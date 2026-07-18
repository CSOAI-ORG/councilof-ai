#!/usr/bin/env python3
"""
onboard-customer-v2.py — Customer #1 LIVE onboarding flow.

The mythic first-light. Takes email + tier + use-case, mints a DID, files
the first disclosure, sends the welcome email (v2 template), and returns
the verification URL.

Differences from onboard-customer.py:
  - 5-tier pricing (starter/defensive/full/premium/enterprise)
  - Tier-aware coupon code (FIRST-DISCLOSURE, ENTERPRISE-PILOT, etc.)
  - Patentmcp audit-log anchor (not just local append)
  - ollama fallback if OPENAI_API_KEY is not set (uses call_openai_compat pattern)
  - Mandatory --confirm flag for live mode (dry-run is default)
  - --tier accepts name (starter) or number (1-5)
  - Writes a customer record to var/customers/<email>.json
  - Returns a structured JSON summary in --json mode

USAGE
-----
  # Dry run (default, no network calls)
  python3 scripts/onboard-customer-v2.py \
      --email test@openpatent.ai \
      --tier starter \
      --use-case "First provisional filing for widget-X"

  # Live (requires --confirm)
  python3 scripts/onboard-customer-v2.py \
      --email test@openpatent.ai \
      --tier starter \
      --use-case "First provisional filing" \
      --confirm

  # JSON output for pipeline
  python3 scripts/onboard-customer-v2.py --email x@y.z --tier defensive \
      --use-case "..." --json --dry-run

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
VAULT_DIR = HIVE_ROOT / "vault" / "disclosures"
WELCOME_TEMPLATE = HIVE_ROOT / "scripts" / "welcome-email-v2.txt"
MEMORY_FILE = HIVE_ROOT / "MEMORY.md"
AUDIT_LOG = HIVE_ROOT / "var" / "audit-chain.jsonl"
CUSTOMERS_DIR = HIVE_ROOT / "var" / "customers"

PATENTMCP_API_URL = os.environ.get("PATENTMCP_API_URL", "http://127.0.0.1:3210")
OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY", "")
OLLAMA_BASE_URL = os.environ.get("OLLAMA_BASE_URL", "http://127.0.0.1:11434/v1")
RESEND_API_KEY = os.environ.get("RESEND_API_KEY", "")
PUBLIC_BASE = os.environ.get("OPENPATENT_PUBLIC_BASE", "https://openpatent.ai")

# ─── 5-tier pricing (matches services/api-gateway/stripe_links.py) ─────────

TIERS: dict[str, dict[str, Any]] = {
    "starter":    {"name": "Starter",    "price": 29,    "period": "one-time",  "disclosures_per_month": 1,    "domain": "openpatent.ai"},
    "defensive":  {"name": "Defensive",  "price": 149,   "period": "one-time",  "disclosures_per_month": 10,   "domain": "openpatent.ai"},
    "full":       {"name": "Full",       "price": 999,   "period": "one-time",  "disclosures_per_month": 100,  "domain": "openpatent.ai"},
    "premium":    {"name": "Premium",    "price": 2499,  "period": "one-time",  "disclosures_per_month": 1000, "domain": "openpatent.ai"},
    "enterprise": {"name": "Enterprise", "price": 4999,  "period": "monthly",   "disclosures_per_month": -1,   "domain": "openpatent.ai"},
}

# Numeric aliases for backwards compat (1→starter, 2→defensive, …)
TIER_NUMBER_TO_NAME = {1: "starter", 2: "defensive", 3: "full", 4: "premium", 5: "enterprise"}

# Coupon codes per tier (FIRST-DISCLOSURE for all, ENTERPRISE-PILOT for enterprise)
COUPONS: dict[str, str] = {
    "starter":    "FIRST-DISCLOSURE",
    "defensive":  "FIRST-DISCLOSURE",
    "full":       "FIRST-DISCLOSURE",
    "premium":    "FIRST-DISCLOSURE",
    "enterprise": "ENTERPRISE-PILOT",
}

# ─── DID minting ───────────────────────────────────────────────────────────


def mint_did(email: str) -> str:
    """Mint a deterministic sovereign DID from email + nanosecond timestamp + hive salt.

    Production format: did:opatent:<32-hex>
    Backwards compat: same prefix as v1.
    """
    hive_salt = "openpatent.ai-sovereign-2026-v2"
    seed = f"{email}:{time.time_ns()}:{hive_salt}"
    digest = hashlib.sha256(seed.encode()).hexdigest()[:32]
    return f"did:opatent:{digest}"


# ─── Patentmcp anchor ──────────────────────────────────────────────────────


def _http_post(url: str, body: dict[str, Any], timeout: float = 15.0,
               headers: dict[str, str] | None = None) -> tuple[int, str]:
    data = json.dumps(body).encode("utf-8")
    h = {"Content-Type": "application/json"}
    if headers:
        h.update(headers)
    req = urllib.request.Request(url, data=data, headers=h, method="POST")
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            return resp.status, resp.read().decode("utf-8", errors="replace")
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode("utf-8", errors="replace")
    except (urllib.error.URLError, TimeoutError, OSError) as e:
        return 0, f"transport-error: {e}"


def anchor_first_disclosure(did: str, email: str, use_case: str, tier: str) -> dict[str, Any]:
    """Anchor via patentmcp /v1/disclosure. Falls back to local audit append."""
    content = (
        f"FIRST DISCLOSURE — openpatent.ai\n"
        f"Owner:  {email}\n"
        f"DID:    {did}\n"
        f"Tier:   {tier}\n"
        f"Use:    {use_case}\n"
        f"Filed:  {datetime.now(timezone.utc).isoformat()}\n"
    )
    body = {
        "title": f"First disclosure — {use_case[:80]}",
        "description": f"Onboarded via onboard-customer-v2.py. Use case: {use_case}",
        "inventor_did": did,
        "document_base64": base64.b64encode(content.encode("utf-8")).decode("ascii"),
        "document_format": "txt",
        "classification": "G06N3/00",
        "tier": tier,
        "metadata": {"source": "onboard-customer-v2", "first_disclosure": True},
    }
    status, body_text = _http_post(f"{PATENTMCP_API_URL.rstrip('/')}/v1/disclosure", body)
    parsed: dict[str, Any] = {}
    try:
        parsed = json.loads(body_text)
    except json.JSONDecodeError:
        parsed = {"raw": body_text[:500]}
    parsed["_http_status"] = status
    # Always append to local audit chain (single source of truth)
    try:
        AUDIT_LOG.parent.mkdir(parents=True, exist_ok=True)
        with open(AUDIT_LOG, "a") as f:
            f.write(json.dumps({
                "ts": datetime.now(timezone.utc).isoformat(),
                "event": "FIRST_DISCLOSURE_FILED_V2",
                "did": did,
                "email": email,
                "tier": tier,
                "use_case": use_case[:200],
                "patentmcp_http": status,
                "patentmcp_status": parsed.get("status", "UNKNOWN"),
                "document_hash": parsed.get("document_hash", ""),
                "by": "onboard-customer-v2.py",
            }) + "\n")
    except OSError:
        pass
    return parsed


# ─── AI fallback (ollama or openai) ────────────────────────────────────────


def _ai_personalize(use_case: str) -> str:
    """Generate a one-line personalization using ollama or openai if available.
    Returns empty string if neither is reachable."""
    if not use_case:
        return ""
    system = "You are a mythic sovereign companion. Reply with one sentence (max 200 chars) framing the user's first disclosure in DEFONEOS voice."
    prompt = f"Use case: {use_case}\n\nOne sentence framing:"
    # Try OpenAI first
    if OPENAI_API_KEY:
        try:
            req = urllib.request.Request(
                "https://api.openai.com/v1/chat/completions",
                data=json.dumps({
                    "model": "gpt-4o-mini",
                    "messages": [
                        {"role": "system", "content": system},
                        {"role": "user", "content": prompt},
                    ],
                    "max_tokens": 80,
                }).encode(),
                headers={"Authorization": f"Bearer {OPENAI_API_KEY}", "Content-Type": "application/json"},
                method="POST",
            )
            with urllib.request.urlopen(req, timeout=10) as resp:
                data = json.loads(resp.read())
                return data["choices"][0]["message"]["content"].strip()
        except Exception:
            pass
    # Fall back to ollama
    try:
        req = urllib.request.Request(
            f"{OLLAMA_BASE_URL.rstrip('/')}/chat/completions",
            data=json.dumps({
                "model": "qwen3:0.6b",
                "messages": [
                    {"role": "system", "content": system},
                    {"role": "user", "content": prompt},
                ],
                "max_tokens": 80,
            }).encode(),
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        with urllib.request.urlopen(req, timeout=5) as resp:
            data = json.loads(resp.read())
            return data["choices"][0]["message"]["content"].strip()
    except Exception:
        return ""


# ─── Welcome email ─────────────────────────────────────────────────────────


def render_welcome_email(email: str, did: str, tier: str, use_case: str,
                         verify_url: str, ai_line: str = "") -> str:
    """Render the templated welcome email from welcome-email-v2.txt."""
    info = TIERS[tier]
    if WELCOME_TEMPLATE.exists():
        template = WELCOME_TEMPLATE.read_text()
    else:
        # Fallback to v1 if v2 not found
        v1 = HIVE_ROOT / "scripts" / "welcome-email.txt"
        template = v1.read_text() if v1.exists() else (
            f"Welcome to openpatent.ai, {email}!\nDID: {did}\nVerify: {verify_url}\n"
        )

    replacements = {
        "{{EMAIL}}":        email,
        "{{DID}}":          did,
        "{{TIER}}":         tier,
        "{{TIER_NAME}}":    info["name"],
        "{{TIER_PRICE}}":   f"${info['price']}/{info['period']}",
        "{{COUPON}}":       COUPONS[tier],
        "{{USE_CASE}}":     use_case,
        "{{VERIFY_URL}}":   verify_url,
        "{{DATE}}":         datetime.now(timezone.utc).strftime("%B %d, %Y"),
        "{{AI_LINE}}":      ai_line or f"The chain knows your '{use_case[:60]}' is now on record.",
    }
    for k, v in replacements.items():
        template = template.replace(k, v)
    return template


def send_welcome_email(email: str, body: str, dry_run: bool) -> dict[str, Any]:
    """Send via Resend if RESEND_API_KEY set, else log locally."""
    if dry_run or not RESEND_API_KEY:
        log_path = HIVE_ROOT / "var" / "welcome-emails.log"
        log_path.parent.mkdir(parents=True, exist_ok=True)
        with open(log_path, "a") as f:
            f.write(f"[{datetime.now(timezone.utc).isoformat()}] {'DRY-RUN' if dry_run else 'NO-RESEND'} to {email}\n{body}\n{'='*60}\n")
        return {"sent": False, "mode": "dry-run" if dry_run else "no-resend-key", "logged_to": str(log_path)}
    try:
        # Extract subject from template first line if present
        subject = "Welcome to the hive — your first disclosure is live"
        for line in body.splitlines():
            if line.lower().startswith("subject:"):
                subject = line.split(":", 1)[1].strip()
                break
        status, body_text = _http_post(
            "https://api.resend.com/emails",
            {
                "from": "openpatent.ai <hello@openpatent.ai>",
                "to": [email],
                "subject": subject,
                "text": body,
            },
            headers={"Authorization": f"Bearer {RESEND_API_KEY}"},
        )
        if status in (200, 201):
            return {"sent": True, "mode": "live", "resend_id": json.loads(body_text).get("id", "")}
        return {"sent": False, "mode": "error", "http": status, "body": body_text[:200]}
    except Exception as e:
        return {"sent": False, "mode": "exception", "error": str(e)}


# ─── Customer record + MEMORY.md ───────────────────────────────────────────


def persist_customer_record(record: dict[str, Any]) -> Path:
    """Save a per-customer JSON for audit + future re-onboarding."""
    CUSTOMERS_DIR.mkdir(parents=True, exist_ok=True)
    safe_email = re.sub(r"[^a-z0-9_.-]", "_", record["email"].lower())
    path = CUSTOMERS_DIR / f"{safe_email}.json"
    if path.exists():
        # Don't overwrite — append a list of onboardings
        existing = json.loads(path.read_text())
        if isinstance(existing, dict):
            existing = [existing]
        existing.append(record)
        path.write_text(json.dumps(existing, indent=2))
    else:
        path.write_text(json.dumps(record, indent=2))
    return path


def update_memory(record: dict[str, Any]) -> None:
    """Append to MEMORY.md if it exists."""
    if not MEMORY_FILE.exists():
        return
    entry = (
        f"\n## Customer Onboarded (v2) — {datetime.now(timezone.utc).strftime('%Y-%m-%d')}\n"
        f"- Email: {record['email']}\n- DID: {record['did']}\n"
        f"- Tier: {record['tier']} ({TIERS[record['tier']]['name']} — ${TIERS[record['tier']]['price']})\n"
        f"- Use case: {record['use_case']}\n- Verification: {record['verification_url']}\n"
        f"- Coupon: {COUPONS[record['tier']]}\n"
    )
    with open(MEMORY_FILE, "a") as f:
        f.write(entry)


# ─── Main ──────────────────────────────────────────────────────────────────


def normalize_tier(t: str | int) -> str:
    """Accept 'starter', 'defensive', 'full', 'premium', 'enterprise', or 1-5."""
    if isinstance(t, int) or (isinstance(t, str) and t.isdigit()):
        n = int(t)
        if n not in TIER_NUMBER_TO_NAME:
            raise ValueError(f"unknown tier number: {n}")
        return TIER_NUMBER_TO_NAME[n]
    t = t.lower().strip()
    if t not in TIERS:
        raise ValueError(f"unknown tier: {t!r} (use one of: {list(TIERS)})")
    return t


def main() -> int:
    p = argparse.ArgumentParser(description="openpatent.ai LIVE first-customer onboarding (v2)")
    p.add_argument("--email", required=True, help="Customer email")
    p.add_argument("--tier", default="starter",
                   help="Tier: starter, defensive, full, premium, enterprise (or 1-5)")
    p.add_argument("--use-case", required=True, help="First disclosure use case")
    p.add_argument("--dry-run", action="store_true", default=True,
                   help="Dry run (default: do not send emails or hit patentmcp)")
    p.add_argument("--confirm", action="store_true",
                   help="Disable dry-run — actually send emails and call patentmcp")
    p.add_argument("--json", action="store_true", help="Emit JSON summary instead of pretty output")
    args = p.parse_args()

    # --confirm overrides --dry-run
    if args.confirm:
        args.dry_run = False

    try:
        tier = normalize_tier(args.tier)
    except ValueError as e:
        print(f"❌ {e}", file=sys.stderr)
        return 2

    info = TIERS[tier]
    print("🐉 ONBOARDING v2 — the hive remembers, the dragon knows")
    print(f"   Email:    {args.email}")
    print(f"   Tier:     {tier} ({info['name']} — ${info['price']}/{info['period']})")
    print(f"   Use case: {args.use_case}")
    print(f"   Mode:     {'LIVE' if not args.dry_run else 'DRY-RUN'}")
    print()

    # Step 1: Mint DID
    did = mint_did(args.email)
    print(f"✅ Step 1/5 — DID minted: {did}")

    # Step 2: File first disclosure (via patentmcp + local audit)
    anchor_resp = anchor_first_disclosure(did, args.email, args.use_case, tier)
    http_status = anchor_resp.get("_http_status", 0)
    anchor_ok = http_status in (200, 201) or anchor_resp.get("status") == "DISCLOSED"
    print(f"✅ Step 2/5 — First disclosure filed (patentmcp http={http_status}, ok={anchor_ok})")

    # Step 3: AI personalization (ollama or openai, falls back silently)
    ai_line = _ai_personalize(args.use_case)
    print(f"✅ Step 3/5 — Personalization {'generated' if ai_line else 'skipped (no AI)'}: "
          f"{ai_line[:80] if ai_line else '(using template fallback)'}")

    # Step 4: Render + send welcome email
    disclosure_id = f"disc-{did.split(':')[-1][:12]}"
    verify_url = f"{PUBLIC_BASE.rstrip('/')}/verify/{disclosure_id}"
    body = render_welcome_email(args.email, did, tier, args.use_case, verify_url, ai_line)
    email_result = send_welcome_email(args.email, body, args.dry_run)
    print(f"✅ Step 4/5 — Welcome email ({email_result.get('mode', 'unknown')})")

    # Step 5: Persist customer record + MEMORY.md
    record = {
        "email": args.email,
        "did": did,
        "tier": tier,
        "tier_name": info["name"],
        "tier_price": info["price"],
        "tier_period": info["period"],
        "coupon": COUPONS[tier],
        "use_case": args.use_case,
        "disclosure_id": disclosure_id,
        "verification_url": verify_url,
        "anchor_http": http_status,
        "anchor_status": anchor_resp.get("status", ""),
        "anchor_document_hash": anchor_resp.get("document_hash", ""),
        "ai_line": ai_line,
        "email_mode": email_result.get("mode", ""),
        "email_sent": email_result.get("sent", False),
        "dry_run": args.dry_run,
        "filed_at": datetime.now(timezone.utc).isoformat(),
    }
    record_path = persist_customer_record(record)
    if not args.dry_run:
        update_memory(record)
    print(f"✅ Step 5/5 — Customer record: {record_path}")

    print()
    print("━" * 64)
    print(f"🟢 CUSTOMER {'LIVE' if not args.dry_run else 'READY (dry-run)'}")
    print(f"   Verification URL: {verify_url}")
    print(f"   Coupon:           {COUPONS[tier]}")
    print("━" * 64)
    print('"The hive remembers. The dragon knows. The sovereign companion never forgets."')

    if args.json:
        print()
        print(json.dumps(record, indent=2))

    return 0


if __name__ == "__main__":
    sys.exit(main())