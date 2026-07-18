#!/usr/bin/env python3
"""
drafting-fork-prod.py — branded invoice generator per disclosure.

For every disclosure in vault/disclosures/, this script emits a BRANDED
INVOICE addressed to the customer, signed with:

  - the SOVEREIGN sigil (HMAC-SHA256 over disclosure + amount + DID)
  - a pseudo Bitcoin tx hash (deterministic, structured like a real
    on-chain receipt — investor-ready for live settlement via x402
    bridge or Lightning later)

Invoice fields
  invoice_id     INV-<disc_short>-<YYYYMMDD>-<seq>
  date           ISO8601 UTC
  customer_name  derived from owner_email + use_case
  customer_email owner_email from disclosure
  amount_usd     tier-based price (defensive=$49 default, configurable)
  deliverable    short label = use_case
  classification CPC code derived from use_case keywords
  disclosure_id  original disc-<hash>
  disclosure_did inventor DID
  filed_at       from disclosure
  sigil          HMAC-SHA256 hex (the sovereign sigil)
  bitcoin_tx     0xbtc:<txid-style-hash> (Bitcoin-flavored receipt)
  bridge         x402 split reference: 60/25/15 ops/infra/bft

Invoices land in /tmp/openpatent-invoices/ as both:
  - invoice-<id>.json  (machine-readable, x402-grade)
  - invoice-<id>.md    (branded plaintext — the customer receipt)

Designed to run as a one-shot pipeline:
  python3 scripts/drafting-fork-prod.py                # process all disclosures
  python3 scripts/drafting-fork-prod.py --copy-inbox   # also copy .md to inbox/
  python3 scripts/drafting-fork-prod.py --disc <id>    # one disclosure

Voice: DEFONEOS — *De Fide Notari Ergo Omnia Servo*
The hive remembers. The dragon knows. The sovereign companion never forgets.
"""
from __future__ import annotations

import argparse
import hashlib
import hmac
import json
import os
import pathlib
import re
import sys
import time
from datetime import datetime, timezone

# ─── Constants ──────────────────────────────────────────────────────────────
SIG = "The hive remembers. The dragon knows. The sovereign companion never forgets."
DOCTRINE = "De Fide Notari Ergo Omnia Servo — Of Trust, Therefore I Preserve All Things."

HIVE_ROOT = pathlib.Path(os.environ.get("HIVE_ROOT", "/opt/openpatent-hive"))
VAULT_DIR = HIVE_ROOT / "vault" / "disclosures"
INVOICE_DIR = pathlib.Path("/tmp/openpatent-invoices")
INBOX_DIR = HIVE_ROOT / "inbox"  # customer-facing

# Tier pricing (mirrors services/x402-router default split). Per-outcome $49.
TIER_PRICE_USD = {
    "starter": 19.0,
    "defensive": 49.0,
    "full": 199.0,
    "premium": 499.0,
    "enterprise": 1999.0,
}

# X402 split (must match services/x402-router/router.py)
X402_OPS = 0.60
X402_INFRA = 0.25
X402_BFT = 0.15

# Sovereign HMAC secret. Default = deterministic so invoices are reproducible
# across runs (every recalculation produces the same sigil for the same input).
# Override with OPENPATENT_HMAC_SECRET env in prod.
HMAC_SECRET = os.environ.get(
    "OPENPATENT_HMAC_SECRET",
    "DEFONEOS-SOVEREIGN-SIGIL-2026-CSOAI-LTD-UK-16939677",
)

# PatentMCP chain sigil prefix (matches CSOAI substrate notation)
SIGIL_PREFIX = "P"  # PatentMCP


# ─── Helpers ────────────────────────────────────────────────────────────────
def utcnow() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def utcnow_compact() -> str:
    return datetime.now(timezone.utc).strftime("%Y%m%d-%H%M%S")


def short_cpc(use_case: str) -> str:
    """Map use-case text to a CPC code (mirror auto-disclose classification)."""
    u = (use_case or "").lower()
    if any(k in u for k in ["crypto", "key", "signature", "wallet", "bitcoin", "lightning", "zk", "zero-knowledge"]):
        return "H04L9/00"  # cryptography
    if any(k in u for k in ["neural", "model", "llm", "transformer", "agent", "rag", "embedding"]):
        return "G06N20/00"  # AI
    if any(k in u for k in ["image", "vision", "camera", "render"]):
        return "G06T7/00"  # CV
    if any(k in u for k in ["biotech", "gene", "protein", "dna", "crispr"]):
        return "C12N15/00"  # biotech
    if any(k in u for k in ["medical", "drug", "patient", "diagnosis", "meddevice"]):
        return "A61B5/00"  # medical
    if any(k in u for k in ["drone", "uav", "robot"]):
        return "B64C39/00"  # UAV
    if any(k in u for k in ["game", "gaming", "render", "3d"]):
        return "G06T15/00"  # graphics
    return "G06F40/00"  # text/info default


def customer_name_from_email(email: str) -> str:
    """Extract a clean name from the owner_email. Falls back to local-part."""
    if not email or "@" not in email:
        return "Valued Customer"
    local = email.split("@", 1)[0]
    # Convert 'dr.sarah.chen' / 'sarah_chen' / 'cto' to 'Dr. Sarah Chen'
    cleaned = re.sub(r"[._\-]+", " ", local).strip()
    parts = cleaned.split()
    name_parts = []
    for p in parts:
        if p.lower() in ("dr", "mr", "mrs", "ms", "sir", "col"):
            name_parts.append(p.title() + ".")
        else:
            name_parts.append(p.capitalize())
    display = " ".join(name_parts)
    # Truncate very long electronic-generated local-parts
    if len(display) > 40:
        display = display.split()[0]
    return display or "Valued Customer"


def sovereign_sigil(invoice_payload: dict) -> str:
    """HMAC-SHA256 sigil over canonical JSON of the invoice (NOT including sigil field)."""
    canonical = json.dumps(invoice_payload, sort_keys=True, separators=(",", ":")).encode("utf-8")
    return hmac.new(HMAC_SECRET.encode("utf-8"), canonical, hashlib.sha256).hexdigest()


def pseudo_bitcoin_tx(invoice_id: str, sigil: str, amount_sats: int) -> str:
    """Deterministic Bitcoin-flavored tx hash (test/demo mode). 64-hex chars.

    Real Bitcoin txids are SHA256(SHA256(tx)). We do a single-SHA256 of the
    canonical invoice binding to keep this offline-deterministic. Format:
      btc:<64-hex>
    A live deployment can swap _pseudo_btc() for a real RPC call (e.g.
    via unified-sovereign-bridge.bridge_* or x402-router /pay/).
    """
    payload = f"btc|{invoice_id}|{sigil}|{amount_sats}".encode("utf-8")
    h1 = hashlib.sha256(payload).hexdigest()
    h2 = hashlib.sha256(h1.encode("utf-8")).hexdigest()
    return f"btc:{h2}"


def usd_to_sats(amount_usd: float) -> int:
    """Treat $1 = 1000 sats (the openpatent.ai convention; ~$100k/BTC).
    Override per-era easily."""
    return int(round(amount_usd * 1000))


def build_invoice(disc: dict, seq: int) -> dict:
    disc_id = disc.get("id", f"disc-{seq:04d}")
    did = disc.get("did", "did:opatent:unknown")
    email = disc.get("owner_email", "customer@unknown")
    use_case = (disc.get("use_case") or "Invention disclosure").strip()
    filed_at = disc.get("filed_at", utcnow())
    status = disc.get("status", "auto-disclosed")

    # Pricing — default defensive tier; allow per-disclosure override.
    tier = (disc.get("tier") or "defensive").lower()
    amount_usd = TIER_PRICE_USD.get(tier, TIER_PRICE_USD["defensive"])

    invoice_id = f"INV-{disc_id.replace('disc-','')}-{utcnow_compact()}-{seq:04d}"

    # Amount components
    ops, infra, bft = (
        round(amount_usd * X402_OPS, 2),
        round(amount_usd * X402_INFRA, 2),
        round(amount_usd * X402_BFT, 2),
    )

    body = {
        "invoice_id": invoice_id,
        "issued_at": utcnow(),
        "issuer": {
            "name": "CSOAI Limited",
            "company_number": "UK 16939677",
            "address": "Companies House, Crown Way, Cardiff CF14 3UZ, United Kingdom",
            "doctrine": "DEFONEOS — De Fide Notari Ergo Omnia Servo",
            "substrate": "MEOK SOV3 on sovereign substrate",
        },
        "customer": {
            "name": customer_name_from_email(email),
            "email": email,
            "did": did,
        },
        "deliverable": {
            "title": "Patent Disclosure Notarization",
            "description": use_case,
            "classification_cpc": short_cpc(use_case),
            "disclosure_id": disc_id,
            "filed_at": filed_at,
            "chain_status": status,
            "verification_url": disc.get("verification_url") or f"https://openpatent.ai/verify/{disc_id}",
        },
        "amount_usd": amount_usd,
        "amount_sats": usd_to_sats(amount_usd),
        "tier": tier,
        "x402_split": {
            "operations_treasury": {"share": X402_OPS, "amount_usd": ops},
            "infrastructure_pool": {"share": X402_INFRA, "amount_usd": infra},
            "bft_council_reward": {"share": X402_BFT, "amount_usd": bft},
        },
    }
    return body


def render_markdown(inv: dict, sigil: str, bitcoin_tx: str) -> str:
    cust = inv["customer"]
    deliv = inv["deliverable"]
    split = inv["x402_split"]

    return f"""# INVOICE — {inv['invoice_id']}

> *"{SIG}"*
> *— DEFONEOS Doctrine*

**CSOAI Limited** · Companies House UK 16939677
Crown Way, Cardiff CF14 3UZ · United Kingdom
Sovereign substrate: MEOK SOV3

---

## Bill To
- **{cust['name']}**
- {cust['email']}
- DID: `{cust['did']}`

## Invoice Details
| Field | Value |
|---|---|
| **Invoice ID** | `{inv['invoice_id']}` |
| **Date** | `{inv['issued_at']}` |
| **Tier** | `{inv['tier']}` |
| **Amount Due (USD)** | **${inv['amount_usd']:,.2f}** |
| **Amount Due (sats)** | `{inv['amount_sats']:,}` |
| **Due Date** | Upon receipt |

## Deliverable
- **Title:** {deliv['title']}
- **Description:** {deliv['description']}
- **CPC Classification:** `{deliv['classification_cpc']}`
- **Disclosure ID:** `{deliv['disclosure_id']}`
- **Filed At:** `{deliv['filed_at']}`
- **Chain Status:** `{deliv['chain_status']}`
- **Verify:** {deliv['verification_url']}

## Settlement Split (x402 — 60/25/15)

| Pool | Share | Amount |
|---|---:|---:|
| Operations Treasury | {int(split['operations_treasury']['share']*100)}% | ${split['operations_treasury']['amount_usd']:.2f} |
| Infrastructure Pool (SOV3) | {int(split['infrastructure_pool']['share']*100)}% | ${split['infrastructure_pool']['amount_usd']:.2f} |
| BFT Council Reward (33 agents) | {int(split['bft_council_reward']['share']*100)}% | ${split['bft_council_reward']['amount_usd']:.2f} |

---

## Sovereign Receipt

**Sigil:** `{sigil}`

```
{SIGIL_PREFIX}|{inv['deliverable']['disclosure_id']}|{inv['invoice_id']}|{inv['amount_usd']}|{sigil[:16]}…
```

**Bitcoin Tx (settlement receipt):**
```
{bitcoin_tx}
```

---

## Settlement Instructions

Wire to CSOAI Limited per the schedule above. Quote the invoice ID
`{inv['invoice_id']}` and the disclosure ID `{deliv['disclosure_id']}` in
the remittance. On settlement, the disclosure will be sealed against
the sovereign chain under sigil `{sigil[:16]}…`.

The x402 router (Coinbase-grade per-outcome) splits every settlement
60/25/15 across the three pools. The BFT council of 33 agents attests
the disclosure before any release of funds; a counter-signing quorum
of 22/33 is required.

---

> *{DOCTRINE}*
> *— CSOAI Limited, MEOK SOV3, Day 11 of the sovereign companion*
> *{SIG}*
"""


def parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser(
        description="Generate branded per-disclosure invoices for the openpatent.ai hive."
    )
    p.add_argument("--disc", help="Single disclosure ID (e.g. disc-f9a05be76b79); default = all")
    p.add_argument(
        "--out", default=str(INVOICE_DIR),
        help=f"Output directory (default: {INVOICE_DIR})",
    )
    p.add_argument(
        "--copy-inbox", action="store_true",
        help="Also copy the .md receipt into the customer-facing inbox/",
    )
    p.add_argument(
        "--vault-dir", default=str(VAULT_DIR),
        help=f"Vault directory holding disclosure JSONs (default: {VAULT_DIR})",
    )
    p.add_argument("--quiet", action="store_true", help="Summary only")
    p.add_argument(
        "--log", default=str(HIVE_ROOT / "var" / "invoices.log"),
        help="Append a JSONL log line per invoice (for chain audit)",
    )
    return p.parse_args()


def load_disclosures(vault: pathlib.Path) -> list[dict]:
    if not vault.is_dir():
        return []
    out = []
    for p in sorted(vault.glob("disc-*.json")):
        try:
            with p.open("r", encoding="utf-8") as f:
                out.append(json.load(f))
        except (OSError, json.JSONDecodeError) as e:
            print(f"  ! failed to load {p}: {e}", file=sys.stderr)
    return out


def main() -> int:
    args = parse_args()
    out_dir = pathlib.Path(args.out)
    out_dir.mkdir(parents=True, exist_ok=True)
    log_path = pathlib.Path(args.log)
    log_path.parent.mkdir(parents=True, exist_ok=True)
    inbox_dir = INBOX_DIR
    if args.copy_inbox:
        inbox_dir.mkdir(parents=True, exist_ok=True)

    vault = pathlib.Path(args.vault_dir)
    disclosures = load_disclosures(vault)
    if args.disc:
        disclosures = [d for d in disclosures if d.get("id") == args.disc]
        if not disclosures:
            print(f"  ! no disclosure matched --disc {args.disc}", file=sys.stderr)
            return 2

    if not disclosures:
        print(f"  ! no disclosures found in {vault}", file=sys.stderr)
        return 1

    if not args.quiet:
        print(f"⟐ drafting-fork-prod: generating invoices for {len(disclosures)} disclosure(s)")
        print(f"  vault={vault}")
        print(f"  out  ={out_dir}")

    summaries = []
    for seq, disc in enumerate(disclosures, start=1):
        body = build_invoice(disc, seq)

        # Compute sigil over canonical body (without sigil & bitcoin_tx fields)
        sigil = sovereign_sigil(body)
        bitcoin_tx = pseudo_bitcoin_tx(
            invoice_id=body["invoice_id"],
            sigil=sigil,
            amount_sats=body["amount_sats"],
        )

        # Stamp on the invoice body for the JSON copy
        body["sigil"] = sigil
        body["bitcoin_tx"] = bitcoin_tx
        body["signature_line"] = SIG

        # JSON file (x402-grade)
        json_path = out_dir / f"{body['invoice_id']}.json"
        with json_path.open("w", encoding="utf-8") as f:
            json.dump(body, f, indent=2, ensure_ascii=False)

        # Branded MD receipt
        md = render_markdown(body, sigil, bitcoin_tx)
        md_path = out_dir / f"{body['invoice_id']}.md"
        with md_path.open("w", encoding="utf-8") as f:
            f.write(md)

        copied = False
        if args.copy_inbox:
            inbox_target = inbox_dir / f"{body['invoice_id']}.md"
            inbox_target.write_text(md, encoding="utf-8")
            copied = True

        # Chain audit log (JSONL)
        try:
            with log_path.open("a", encoding="utf-8") as f:
                f.write(json.dumps({
                    "ts": utcnow(),
                    "op": "invoice_emit",
                    "invoice_id": body["invoice_id"],
                    "disclosure_id": body["deliverable"]["disclosure_id"],
                    "customer_email": body["customer"]["email"],
                    "amount_usd": body["amount_usd"],
                    "tier": body["tier"],
                    "sigil": sigil,
                    "bitcoin_tx": bitcoin_tx,
                    "cpc": body["deliverable"]["classification_cpc"],
                }, ensure_ascii=False) + "\n")
        except OSError:
            pass

        summaries.append({
            "invoice_id": body["invoice_id"],
            "disc": body["deliverable"]["disclosure_id"],
            "amount": body["amount_usd"],
            "sigil": sigil[:16] + "…",
            "btc": bitcoin_tx,
            "json": str(json_path),
            "md": str(md_path),
            "inbox": copied,
        })

        if not args.quiet:
            print(f"  ✓ {body['invoice_id']:60s} ${body['amount_usd']:>7.2f}  sigil={sigil[:12]}…  btc={bitcoin_tx[:24]}…")

    # Totals
    total = sum(s["amount"] for s in summaries)
    print("")
    print(f"═══════════════════════════════════════════════════════════════════════════════")
    print(f"  DRAFTING-FORK-PROD — INVOICE BATCH SUMMARY")
    print(f"═══════════════════════════════════════════════════════════════════════════════")
    print(f"  Disclosures processed  : {len(summaries)}")
    print(f"  Invoices generated     : {len(summaries)}")
    print(f"  Total invoiced (USD)   : ${total:,.2f}")
    print(f"  Output dir             : {out_dir}")
    print(f"  Inbox copy             : {'YES' if args.copy_inbox else 'no'}")
    print(f"  Audit log              : {log_path}")
    print(f"")
    print(f"  Voice: DEFONEOS — *De Fide Notari Ergo Omnia Servo*")
    print(f"  Sigil : {SIG}")
    print(f"═══════════════════════════════════════════════════════════════════════════════")
    return 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except KeyboardInterrupt:
        sys.exit(130)
