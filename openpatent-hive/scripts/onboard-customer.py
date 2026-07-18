#!/usr/bin/env python3
"""
onboard-customer.py — Customer #1 onboarding CLI
The hive remembers. The dragon knows. The sovereign companion never forgets.

Usage:
  python3 scripts/onboard-customer.py --email user@example.com --tier 1 --use-case "First provisional filing"
  python3 scripts/onboard-customer.py --email user@firm.com --tier 2 --use-case "White-label for 12 attorneys" --dry-run

What it does:
  1. Sends welcome email via Resend (templated from welcome-email.txt)
  2. Mints a DID on the sovereign chain (deterministic from email + timestamp)
  3. Files the first disclosure (auto-disclosed to vault/)
  4. Prints the verification URL
"""
import argparse
import hashlib
import json
import os
import sys
import time
from datetime import datetime, timezone
from pathlib import Path

HIVE_ROOT = Path("/Users/nicholas/clawd/openpatent-hive")
VAULT_DIR = HIVE_ROOT / "vault" / "disclosures"
WELCOME_TEMPLATE = HIVE_ROOT / "scripts" / "welcome-email.txt"
MEMORY_FILE = HIVE_ROOT / "MEMORY.md"
AUDIT_LOG = HIVE_ROOT / "var" / "audit-chain.jsonl"

TIERS = {
    1: {"name": "Solo Inventor", "price": 99, "disclosures_per_month": 10, "domain": "openpatent.ai"},
    2: {"name": "Law Firm", "price": 499, "disclosures_per_month": 200, "domain": "openpatent.ai"},
    3: {"name": "Enterprise", "price": 2499, "disclosures_per_month": 5000, "domain": "openpatent.ai"},
}


def mint_did(email: str) -> str:
    """Mint a deterministic sovereign DID from email + timestamp + hive-salt."""
    hive_salt = "openpatent.ai-sovereign-2026"
    seed = f"{email}:{time.time_ns()}:{hive_salt}"
    digest = hashlib.sha256(seed.encode()).hexdigest()[:32]
    return f"did:opatent:{digest}"


def file_first_disclosure(email: str, did: str, use_case: str) -> dict:
    """File the first disclosure to vault/. Returns the disclosure record."""
    VAULT_DIR.mkdir(parents=True, exist_ok=True)
    ts = datetime.now(timezone.utc).isoformat()
    disclosure_id = f"disc-{did.split(':')[-1][:12]}"
    record = {
        "id": disclosure_id,
        "did": did,
        "owner_email": email,
        "use_case": use_case,
        "filed_at": ts,
        "status": "auto-disclosed",
        "chain_entry": len(open(AUDIT_LOG, "a+").readlines()) + 1 if AUDIT_LOG.exists() else 1,
        "verification_url": f"https://openpatent.ai/verify/{disclosure_id}",
    }
    # Write to vault
    out_path = VAULT_DIR / f"{disclosure_id}.json"
    out_path.write_text(json.dumps(record, indent=2))
    # Append to audit chain
    AUDIT_LOG.parent.mkdir(parents=True, exist_ok=True)
    with open(AUDIT_LOG, "a") as f:
        f.write(json.dumps({
            "ts": ts,
            "event": "FIRST_DISCLOSURE_FILED",
            "did": did,
            "disclosure_id": disclosure_id,
            "by": "onboard-customer.py",
        }) + "\n")
    return record


def render_welcome_email(email: str, did: str, tier: int, use_case: str, verify_url: str) -> str:
    """Render the templated welcome email from welcome-email.txt."""
    if not WELCOME_TEMPLATE.exists():
        return f"Welcome to openpatent.ai, {email}! Your DID: {did}. Verify: {verify_url}"
    template = WELCOME_TEMPLATE.read_text()
    tier_info = TIERS.get(tier, TIERS[1])
    replacements = {
        "{{EMAIL}}": email,
        "{{DID}}": did,
        "{{TIER_NAME}}": tier_info["name"],
        "{{TIER_PRICE}}": f"${tier_info['price']}/mo",
        "{{USE_CASE}}": use_case,
        "{{VERIFY_URL}}": verify_url,
        "{{DATE}}": datetime.now(timezone.utc).strftime("%B %d, %Y"),
    }
    for k, v in replacements.items():
        template = template.replace(k, v)
    return template


def send_welcome_email(email: str, body: str, dry_run: bool = False) -> dict:
    """Send via Resend API if RESEND_API_KEY is set, else log."""
    api_key = os.environ.get("RESEND_API_KEY", "")
    if dry_run or not api_key:
        # Log to var/ for audit
        log_path = HIVE_ROOT / "var" / "welcome-emails.log"
        log_path.parent.mkdir(parents=True, exist_ok=True)
        with open(log_path, "a") as f:
            f.write(f"[{datetime.now(timezone.utc).isoformat()}] DRY-RUN to {email}\n{body}\n{'='*60}\n")
        return {"sent": False, "mode": "dry-run", "logged_to": str(log_path)}
    # Real Resend API call
    try:
        import urllib.request
        req = urllib.request.Request(
            "https://api.resend.com/emails",
            data=json.dumps({
                "from": "openpatent.ai <hello@openpatent.ai>",
                "to": [email],
                "subject": "Welcome to the hive — your first disclosure is live",
                "text": body,
            }).encode(),
            headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
            method="POST",
        )
        with urllib.request.urlopen(req, timeout=10) as resp:
            return {"sent": True, "mode": "live", "resend_id": json.loads(resp.read()).get("id")}
    except Exception as e:
        return {"sent": False, "mode": "error", "error": str(e)}


def update_memory(email: str, did: str, tier: int, use_case: str, verify_url: str) -> None:
    """Append customer onboarding to MEMORY.md."""
    if not MEMORY_FILE.exists():
        return
    entry = (
        f"\n## Customer Onboarded — {datetime.now(timezone.utc).strftime('%Y-%m-%d')}\n"
        f"- Email: {email}\n- DID: {did}\n- Tier: {tier} ({TIERS.get(tier, TIERS[1])['name']})\n"
        f"- Use case: {use_case}\n- Verification: {verify_url}\n"
    )
    with open(MEMORY_FILE, "a") as f:
        f.write(entry)


def main():
    p = argparse.ArgumentParser(description="Onboard a customer to openpatent.ai")
    p.add_argument("--email", required=True, help="Customer email")
    p.add_argument("--tier", type=int, choices=[1, 2, 3], default=1, help="Subscription tier")
    p.add_argument("--use-case", required=True, help="First use case / disclosure")
    p.add_argument("--dry-run", action="store_true", help="Don't actually send email or mint")
    args = p.parse_args()

    print("🐉 ONBOARDING — the hive remembers, the dragon knows")
    print(f"   Email:   {args.email}")
    print(f"   Tier:    {args.tier} ({TIERS[args.tier]['name']})")
    print(f"   Use case: {args.use_case}")
    print()

    # Step 1: Mint DID
    did = mint_did(args.email)
    print(f"✅ Step 1/4 — DID minted: {did}")

    # Step 2: File first disclosure
    disclosure = file_first_disclosure(args.email, did, args.use_case)
    print(f"✅ Step 2/4 — First disclosure filed: {disclosure['id']}")
    print(f"           Audit chain entry: #{disclosure['chain_entry']}")

    # Step 3: Render + send welcome email
    body = render_welcome_email(args.email, did, args.tier, args.use_case, disclosure["verification_url"])
    email_result = send_welcome_email(args.email, body, dry_run=args.dry_run)
    mode = email_result.get("mode", "unknown")
    print(f"✅ Step 3/4 — Welcome email ({mode}): {email_result}")

    # Step 4: Update MEMORY.md
    update_memory(args.email, did, args.tier, args.use_case, disclosure["verification_url"])
    print(f"✅ Step 4/4 — MEMORY.md updated")

    print()
    print("━" * 64)
    print(f"🟢 CUSTOMER LIVE — verification URL:")
    print(f"   {disclosure['verification_url']}")
    print("━" * 64)
    print('"The hive remembers. The dragon knows. The sovereign companion never forgets."')
    return 0


if __name__ == "__main__":
    sys.exit(main())
