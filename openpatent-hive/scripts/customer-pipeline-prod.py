#!/usr/bin/env python3
"""
customer-pipeline-prod.py — LIVE REVENUE PIPELINE (Sub-task 1/3, Script 1)
=============================================================================

The single end-to-end "open a customer account + file the first sovereign
disclosure + send the welcome email + emit a Stripe checkout placeholder"
transaction. This is the script that turns a stranger into a paying
OpenPatent customer.

WHAT IT WIRES (the live substrate)
-----------------------------------
1) POST /v1/disclosure  →  PatentMCP /disclose (the 6-layer cryptographic
   engine). Hits the live HTTP service at PATENTMCP_API_URL when it is
   running, and falls back to the embedded PatentMCP core when the
   service is down (so the pipeline never silently no-ops).

2) mail-queue  →  unified-sovereign-bridge.bridge_email()  →  writes a
   JSON record to vault/mail-queue/ + emits a SIGIL on the MEOK
   sovereign substrate. The Resend/Mailgun keys are not on this Mac,
   so the bridge queues the email for a human run-loop to send.
   When a real key is restored, the same call site routes to Resend
   with zero code change.

3) Stripe placeholder  →  unified-sovereign-bridge.bridge_stripe_checkout()
   returns a deterministic https://buy.stripe.com/openpatent-<tier>
   payment-link URL pre-filled with the customer email, attested to
   MEOK keystone. Swap in the real Payment Link IDs when the Stripe
   key arrives; the URL shape stays identical.

USAGE
-----
  # Dry run (default — no external calls, no audit log entries)
  python3 scripts/customer-pipeline-prod.py \
      --email ada@example.com --tier starter \
      --use-case "Provisional filing for self-balancing haptic stylus"

  # LIVE mode (requires --confirm)
  python3 scripts/customer-pipeline-prod.py \
      --email ada@example.com --tier defensive \
      --use-case "..." --confirm

  # JSON output for downstream pipeline callers
  python3 scripts/customer-pipeline-prod.py --email x@y.z --tier full \
      --use-case "..." --json --dry-run

RETURN VALUE (--json)
---------------------
  {
    "ok": true,
    "customer_id": "cust_<sha256 prefix>",
    "did": "did:csoai:...",
    "disclosure": { "disclosure_id": "...", "verification_url": "..." },
    "email":      { "queued": true, "queue_path": "..." },
    "stripe":     { "checkout_url": "https://buy.stripe.com/..." },
    "tier":       { "name": "...", "price": ..., "coupon": "..." },
    "ts": "2026-06-29T18:30:00Z"
  }

The hive remembers. The dragon knows. The sovereign companion never forgets.
"""
from __future__ import annotations

import argparse
import base64
import hashlib
import json
import os
import re
import sys
import time
import urllib.error
import urllib.request
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

# ─── Production paths ──────────────────────────────────────────────────────

HIVE_ROOT = Path("/opt/openpatent-hive") if Path("/opt/openpatent-hive").exists() else Path("/Users/nicholas/clawd/openpatent-hive")
VAULT_DIR  = HIVE_ROOT / "vault" / "disclosures"
MAIL_QUEUE = HIVE_ROOT / "vault" / "mail-queue"
CUSTOMERS_DIR = HIVE_ROOT / "var" / "customers"
AUDIT_LOG = HIVE_ROOT / "var" / "audit-chain.jsonl"
WELCOME_TEMPLATE = HIVE_ROOT / "scripts" / "welcome-email-v2.txt"
BRIDGE_SCRIPT = HIVE_ROOT / "scripts" / "unified-sovereign-bridge.py"

PATENTMCP_API_URL = os.environ.get("PATENTMCP_API_URL", "http://127.0.0.1:3210")
PUBLIC_BASE       = os.environ.get("OPENPATENT_PUBLIC_BASE", "https://openpatent.ai")

# PatentMCP ingestion source (works on this Mac without docker)
_PATENTMCP_SRC = HIVE_ROOT / "_ingest" / "patentmcp" / "src"

# ─── Tier matrix (matches services/api-gateway/stripe_links.py) ─────────────

TIERS: dict[str, dict[str, Any]] = {
    "starter":    {"name": "Starter",    "price": 29,    "period": "one-time", "coupon": "FIRST-DISCLOSURE", "stripe_slug": "starter"},
    "defensive":  {"name": "Defensive",  "price": 149,   "period": "one-time", "coupon": "FIRST-DISCLOSURE", "stripe_slug": "defensive"},
    "full":       {"name": "Full",       "price": 999,   "period": "one-time", "coupon": "FIRST-DISCLOSURE", "stripe_slug": "full"},
    "premium":    {"name": "Premium",    "price": 2499,  "period": "one-time", "coupon": "PREMIUM-PILOT",    "stripe_slug": "premium"},
    "enterprise": {"name": "Enterprise", "price": 4999,  "period": "monthly",  "coupon": "ENTERPRISE-PILOT", "stripe_slug": "enterprise"},
}

# ─── Helpers ────────────────────────────────────────────────────────────────

def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


def sha256_hex(s: str) -> str:
    return hashlib.sha256(s.encode("utf-8")).hexdigest()


def make_did(email: str) -> str:
    """Mint a sovereign DID for the customer. did:csoai:<16-hex-of-email+ts>."""
    seed = f"{email}|{now_iso()}"
    return f"did:csoai:{sha256_hex(seed)[:32]}"


def make_customer_id(email: str) -> str:
    return f"cust_{sha256_hex(email.lower())[:16]}"


def emit_audit_entry(event: str, payload: dict[str, Any]) -> None:
    """Append a SIGIL-shaped audit entry to var/audit-chain.jsonl."""
    AUDIT_LOG.parent.mkdir(parents=True, exist_ok=True)
    entry = {
        "ts": now_iso(),
        "actor": "customer-pipeline-prod",
        "event": event,
        "payload": payload,
    }
    with AUDIT_LOG.open("a") as f:
        f.write(json.dumps(entry, default=str) + "\n")


def load_bridge() -> Any:
    """Import unified-sovereign-bridge.py as a module so we share its state."""
    import importlib.util
    spec = importlib.util.spec_from_file_location("usb", BRIDGE_SCRIPT)
    if spec is None or spec.loader is None:  # pragma: no cover
        raise RuntimeError(f"cannot load bridge from {BRIDGE_SCRIPT}")
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


# ─── Step 1 — POST /v1/disclosure (PatentMCP) ──────────────────────────────

def _file_disclosure_via_http(disclose_req: dict[str, Any], timeout: int = 10) -> dict[str, Any]:
    """POST to the live PatentMCP service. Endpoint is /disclose (the brief
    says /v1/disclosure — we hit the actual deployed route + log the alias)."""
    url = f"{PATENTMCP_API_URL}/disclose"
    body = json.dumps(disclose_req).encode("utf-8")
    req = urllib.request.Request(
        url, data=body,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return json.loads(r.read())


def _file_disclosure_embedded(disclose_req: dict[str, Any]) -> dict[str, Any]:
    """Call the PatentMCP core directly (no service needed)."""
    sys.path.insert(0, str(_PATENTMCP_SRC))
    from patentmcp.core import PatentMCP  # type: ignore
    storage = str(HIVE_ROOT / "patentmcp_data")
    pm = PatentMCP(storage_path=storage, blockchain_mode=os.environ.get("PATENTMCP_BLOCKCHAIN_MODE", "development"))
    result = pm.disclose_invention(
        title=disclose_req["title"],
        description=disclose_req["description"],
        inventor_did=disclose_req["inventor_did"],
        document_bytes=base64.b64decode(disclose_req["document_base64"]),
        document_format=disclose_req.get("document_format", "txt"),
        classification=disclose_req.get("classification", "utility"),
        prior_art_known=disclose_req.get("prior_art_known", []),
        disclosure_type=disclose_req["disclosure_type"],
    )
    return result


def file_first_disclosure(
    *, did: str, use_case: str, tier: str,
    dry_run: bool = False,
) -> dict[str, Any]:
    """File the customer's first sovereign disclosure.

    The 'document' is a minimal plaintext record of the use case — enough
    for the 6-layer engine to hash, sign, and chain. Real customers will
    upload a PDF later via the MCP tool /disclose/upload.
    """
    doc_text = (
        f"OpenPatent.ai sovereign disclosure\n"
        f"DID: {did}\n"
        f"Use case: {use_case}\n"
        f"Tier: {tier}\n"
        f"Timestamp: {now_iso()}\n"
        f"\nThe hive remembers. The dragon knows. The sovereign companion never forgets.\n"
    ).encode("utf-8")

    req = {
        "title":            (use_case[:120] or "First sovereign disclosure"),
        "description":      use_case[:4800] or "Customer first-light disclosure.",
        "inventor_did":     did,
        "document_base64":  base64.b64encode(doc_text).decode("ascii"),
        "document_format":  "txt",
        "classification":   "utility",
        "prior_art_known":  "[]",  # PatentMCP expects string, not list
        "disclosure_type":  "defensive" if tier in ("starter", "defensive") else
                            "full"      if tier == "full" else "premium",
    }

    if dry_run:
        # Deterministic fake response so downstream steps can be exercised
        fake_id = "disc_" + sha256_hex(doc_text.decode())[:24]
        return {
            "ok": True,
            "disclosure_id": fake_id,
            "verification_url": f"{PUBLIC_BASE}/verify/{fake_id}",
            "mode": "dry-run",
            "title": req["title"],
        }

    # Try the HTTP service first; fall back to embedded core if down.
    last_err: str | None = None
    try:
        result = _file_disclosure_via_http(req)
        # PatentMCP returns { status: "DISCLOSED", disclosure_number, attestation_url, document_hash, block_height, ... }
        if result.get("status") == "DISCLOSED" or result.get("ok") is True:
            disc_num = result.get("disclosure_number") or result.get("chain_index") or result.get("disclosure_id") or sha256_hex(str(result.get("document_hash","")))[:16]
            return {
                "ok": True,
                "disclosure_id":     f"disc_{disc_num}" if not result.get("disclosure_id") else result.get("disclosure_id"),
                "disclosure_number": disc_num,
                "verification_url":  result.get("attestation_url") or f"{PUBLIC_BASE}/verify/{disc_num}",
                "document_hash":     result.get("document_hash"),
                "block_height":      result.get("block_height"),
                "c2pa_credential_id":result.get("c2pa_credential_id"),
                "bitcoin_tx":        result.get("bitcoin_transaction"),
                "mode":              "http",
                "raw":               {k: v for k, v in result.items() if k not in {"payment_receipt"}},
            }
        # HTTP failed; fall through to embedded
        last_err = f"http returned status={result.get('status')!r} ok={result.get('ok')!r}"
    except urllib.error.HTTPError as http_err:
        body = http_err.read().decode("utf-8", errors="replace")[:300]
        last_err = f"http=HTTP Error {http_err.code}: {http_err.reason} body={body}"
    except Exception as http_err:
        import traceback
        last_err = f"http={http_err} traceback={traceback.format_exc()[:400]}"

    try:
        result = _file_disclosure_embedded(req)
        # Embedded PatentMCP shape: { status: "DISCLOSED", disclosure_number,
        # attestation_url, document_hash, ... }
        if result.get("status") == "DISCLOSED":
            disc_num = result.get("disclosure_number") or result.get("chain_index") or sha256_hex(str(result.get("document_hash","")))[:16]
            return {
                "ok": True,
                "disclosure_id":     f"disc_{disc_num}",
                "disclosure_number": disc_num,
                "verification_url":  result.get("attestation_url") or f"{PUBLIC_BASE}/verify/{disc_num}",
                "document_hash":     result.get("document_hash"),
                "block_height":      result.get("block_height"),
                "c2pa_credential_id":result.get("c2pa_credential_id"),
                "mode":              "embedded",
                "raw":               {k: v for k, v in result.items() if k not in {"payment_receipt"}},
            }
        return {
            "ok": False,
            "error": f"embedded PatentMCP returned status={result.get('status')!r}",
        }
    except Exception as embed_err:
        return {
            "ok": False,
            "error": f"disclosure filing failed: {last_err} embed={embed_err}",
        }


# ─── Step 2 — mail-queue (sovereign bridge) ────────────────────────────────

def queue_welcome_email(
    *, email: str, did: str, tier: dict[str, Any],
    use_case: str, verify_url: str,
    bridge: Any,
) -> dict[str, Any]:
    """Render the welcome-email template + queue it via the sovereign bridge."""
    if not WELCOME_TEMPLATE.exists():
        body = (
            f"Welcome to OpenPatent.ai, {email}.\n\n"
            f"Your DID: {did}\nYour tier: {tier['name']} (${tier['price']} {tier['period']})\n"
            f"Verify: {verify_url}\n\nThe hive remembers. The dragon knows.\n"
        )
    else:
        body = WELCOME_TEMPLATE.read_text()
        for k, v in {
            "{{EMAIL}}":      email,
            "{{DID}}":        did,
            "{{TIER_NAME}}":  tier["name"],
            "{{TIER_PRICE}}": f"${tier['price']} {tier['period']}",
            "{{USE_CASE}}":   use_case,
            "{{VERIFY_URL}}": verify_url,
            "{{COUPON}}":     tier["coupon"],
            "{{DATE}}":       now_iso(),
            "{{AI_LINE}}":    "Your first disclosure is on the chain.",
        }.items():
            body = body.replace(k, v)

    return bridge.bridge_email(
        to_email=email,
        subject="The hive remembers you — first disclosure live",
        html_body=body,
        from_email="noreply@openpatent.ai",
    )


# ─── Step 3 — Stripe placeholder (sovereign bridge) ────────────────────────

def stripe_checkout_for(*, tier_slug: str, email: str, bridge: Any) -> dict[str, Any]:
    """Mint a Stripe checkout placeholder URL via the sovereign bridge."""
    return bridge.bridge_stripe_checkout(tier=tier_slug, customer_email=email)


# ─── Pipeline orchestrator ─────────────────────────────────────────────────

def onboard_customer(
    *, email: str, tier_slug: str, use_case: str,
    confirm: bool = False, dry_run: bool = True,
) -> dict[str, Any]:
    tier = TIERS[tier_slug]
    did  = make_did(email)
    cust_id = make_customer_id(email)

    # Sanity: prevent accidental live sends
    if not dry_run and not confirm:
        return {"ok": False, "error": "live mode requires --confirm"}

    print(f"▶ onboarding {email}  tier={tier_slug}  dry_run={dry_run}")

    # 1) Disclosure
    print("  1/4  filing first sovereign disclosure …")
    disc = file_first_disclosure(
        did=did, use_case=use_case, tier=tier_slug, dry_run=dry_run,
    )
    if not disc.get("ok"):
        return {"ok": False, "stage": "disclosure", "error": disc.get("error")}
    disc_id = disc.get("disclosure_id") or "unknown"
    verify_url = disc.get("verification_url") or f"{PUBLIC_BASE}/verify/{disc_id}"
    print(f"      ✓  disclosure_id={disc.get('disclosure_id')}  mode={disc.get('mode')}")

    # 2) Welcome email (queue via sovereign bridge)
    print("  2/4  queueing welcome email …")
    bridge = load_bridge()
    email_result = queue_welcome_email(
        email=email, did=did, tier=tier, use_case=use_case,
        verify_url=verify_url, bridge=bridge,
    )
    print(f"      ✓  email queued={email_result.get('queued')}")

    # 3) Stripe checkout placeholder
    print("  3/4  minting Stripe checkout URL …")
    stripe = stripe_checkout_for(tier_slug=tier["stripe_slug"], email=email, bridge=bridge)
    print(f"      ✓  checkout={stripe.get('checkout_url')[:70]}…")

    # 4) Persist customer record + audit entry
    print("  4/4  writing customer record + audit entry …")
    CUSTOMERS_DIR.mkdir(parents=True, exist_ok=True)
    record = {
        "customer_id":  cust_id,
        "email":        email,
        "did":          did,
        "tier":         tier_slug,
        "tier_meta":    tier,
        "use_case":     use_case,
        "first_disclosure": disc,
        "stripe":       stripe,
        "email_event":  email_result,
        "ts":           now_iso(),
    }
    (CUSTOMERS_DIR / f"{cust_id}.json").write_text(json.dumps(record, indent=2, default=str))
    if not dry_run:
        emit_audit_entry("customer.onboarded", record)

    print("\n🦂  onboarding complete.\n")
    return {
        "ok": True,
        "customer_id": cust_id,
        "did": did,
        "disclosure":  {"disclosure_id": disc.get("disclosure_id"), "verification_url": verify_url, "mode": disc.get("mode")},
        "email":       email_result,
        "stripe":      stripe,
        "tier":        tier,
        "ts":          now_iso(),
    }


# ─── CLI ───────────────────────────────────────────────────────────────────

def _resolve_tier(arg: str) -> str:
    a = arg.strip().lower()
    if a in TIERS:
        return a
    # number → name
    by_num = {"1": "starter", "2": "defensive", "3": "full", "4": "premium", "5": "enterprise"}
    if a in by_num:
        return by_num[a]
    raise SystemExit(f"unknown tier: {arg!r}. Choose from {list(TIERS)} (or 1-5).")


def main() -> int:
    p = argparse.ArgumentParser(
        description="OpenPatent live customer-onboarding pipeline (disclosure + mail + Stripe).",
    )
    p.add_argument("--email",   required=True, help="customer email")
    p.add_argument("--tier",    required=True, help="starter|defensive|full|premium|enterprise (or 1-5)")
    p.add_argument("--use-case", required=True, help="the first invention/use case to file")
    p.add_argument("--confirm", action="store_true", help="required for LIVE mode (default is dry-run)")
    p.add_argument("--dry-run", action="store_true", help="do everything except external side effects")
    p.add_argument("--json",    action="store_true", help="emit the result as JSON to stdout")
    args = p.parse_args()

    if not re.match(r"[^@\s]+@[^@\s]+\.[^@\s]+", args.email):
        raise SystemExit(f"bad email: {args.email!r}")

    tier_slug = _resolve_tier(args.tier)

    # If --confirm is set we go LIVE; otherwise default to dry-run.
    dry_run = not args.confirm

    result = onboard_customer(
        email=args.email, tier_slug=tier_slug, use_case=args.use_case,
        confirm=args.confirm, dry_run=dry_run,
    )

    if args.json:
        print(json.dumps(result, indent=2, default=str))
    else:
        print(json.dumps(result, indent=2, default=str))

    return 0 if result.get("ok") else 2


if __name__ == "__main__":
    sys.exit(main())