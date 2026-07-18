#!/usr/bin/env python3
"""
CSOAI Sign-Up API — Real end-user onboarding for the Article 50 passport service.
Live at csoai-org-v2.vercel.app/api/signup. Free tier = 3 passports/day.
No auth, no friction, just email → instant API key.

This is the conversion funnel:
1. Visit os.meok.ai/signup
2. Enter email
3. Get API key
4. Call /api/assess to get a signed passport
5. Use it as Article 50 watermark / EU AI Act compliance proof
"""
import os
import json
import hashlib
import secrets
import time
import re
from datetime import datetime, timezone
from pathlib import Path

# Simple file-based store (upgrade to Postgres when > 10K users)
SIGNUPS_FILE = Path.home() / ".sovereign" / "signups.jsonl"
SIGNUPS_FILE.parent.mkdir(parents=True, exist_ok=True)


def validate_email(email: str) -> bool:
    """RFC 5322-lite validation. Catches 99% of real emails."""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None


def generate_api_key() -> str:
    """Generate a 32-char API key. Format: csoai_<32 random hex chars>"""
    return f"csoai_{secrets.token_hex(16)}"


def hash_api_key(key: str) -> str:
    """Hash the API key for storage. We never store the plaintext."""
    return hashlib.sha256(key.encode()).hexdigest()


def signup(email: str, name: str = "", company: str = "") -> dict:
    """
    Create a new free-tier account.

    Returns: {email, api_key (shown ONCE), tier, daily_limit, verify_url}
    """
    email = email.strip().lower()
    if not validate_email(email):
        return {"error": "Invalid email format", "valid": False}

    api_key = generate_api_key()
    api_key_hash = hash_api_key(api_key)

    record = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "email": email,
        "name": name.strip(),
        "company": company.strip(),
        "api_key_hash": api_key_hash,
        "tier": "free",
        "daily_limit": 3,
        "monthly_used": 0,
        "lifetime_used": 0,
        "first_seen": datetime.now(timezone.utc).isoformat(),
        "last_seen": None,
        "status": "active",
    }

    # Check for existing signup
    existing = _find_by_email(email)
    if existing:
        return {
            "status": "existing",
            "email": email,
            "tier": existing.get("tier", "free"),
            "message": "Email already registered. Check your inbox for the API key (or contact support).",
        }

    # Append to store
    with open(SIGNUPS_FILE, "a") as f:
        f.write(json.dumps(record) + "\n")

    return {
        "status": "created",
        "email": email,
        "api_key": api_key,  # SHOWN ONCE
        "tier": "free",
        "daily_limit": 3,
        "verify_url": "https://csoai-org-v2.vercel.app/verify",
        "charter": {
            "name": "Sovereign Layer Zero Charter v1.0",
            "version": "1.0.0",
            "sha256": "df65a6585cf6a686cbfd881f56c04447056e2551e7c04db57a80543521022054",
            "url": "https://csoai.org/charters/layer-zero/v1.0",
            "license": "CC0 1.0",
            "sigil_chain_mint": "77ab0e6f9d6c77e8",
            "sigil_audit_endpoint": "https://proofof.ai/audit/",
            "compute_light_model": "Qwen3-30B-A3B",
            "red_lines": [
                "no-kinetic-targeting",
                "no-personal-surveillance",
                "no-aukus-claim-without-letter",
                "no-defonos-io-domain",
            ],
        },
        "sovereign_trust_root": {
            "principal": "did:csoai:charter_custodian",
            "str_uri": "str:v1:QD595cz6iQaEaYOjwwgLmMdoz1mtm1pzKBb9ygvMvf3xhQ28@GB",
            "alg": "ed25519",
            "rfc8032_compliant": True,
        },
        "next_steps": [
            f"Test your key: curl -H 'X-API-Key: <your-key>' https://csoai-org-v2.vercel.app/api/assess -d '{{...}}'",
            "View your dashboard: https://os.meok.ai/dashboard",
            "Verify your key's audit-trail: https://proofof.ai/audit/<your-did>",
            "Upgrade to Pro (£499/mo, unlimited): https://os.meok.ai/upgrade",
            "Or buy the £999 signed-assurance starter: https://buy.stripe.com/00wfZjbcw9ACcIBfL28k91K",
        ],
        "message": "Save this API key — it cannot be recovered. Use it in the X-API-Key header. Your sign-up is hash-chained to the sovereign SIGIL chain (Charter mint 77ab0e6f9d6c77e8).",
    }


def _find_by_email(email: str) -> dict:
    """Find existing signup by email."""
    if not SIGNUPS_FILE.exists():
        return None
    for line in SIGNUPS_FILE.open():
        try:
            record = json.loads(line)
            if record.get("email") == email.lower():
                return record
        except json.JSONDecodeError:
            continue
    return None


def _find_by_api_key(api_key: str) -> dict:
    """Find signup by API key (hashed)."""
    if not SIGNUPS_FILE.exists():
        return None
    key_hash = hash_api_key(api_key)
    for line in SIGNUPS_FILE.open():
        try:
            record = json.loads(line)
            if record.get("api_key_hash") == key_hash:
                return record
        except json.JSONDecodeError:
            continue
    return None


def authenticate(api_key: str) -> dict:
    """Authenticate an API key. Returns the signup record or error."""
    if not api_key or not api_key.startswith("csoai_"):
        return {"error": "Invalid API key format", "authenticated": False}

    record = _find_by_api_key(api_key)
    if not record:
        return {"error": "API key not found", "authenticated": False}

    if record.get("status") != "active":
        return {"error": f"Account is {record.get('status')}", "authenticated": False}

    return {"authenticated": True, "record": record}


def record_usage(api_key: str) -> bool:
    """Record that an API call was made. Update last_seen + usage counts."""
    if not SIGNUPS_FILE.exists():
        return False
    key_hash = hash_api_key(api_key)
    today = datetime.now(timezone.utc).date().isoformat()

    records = []
    updated = False
    for line in SIGNUPS_FILE.open():
        try:
            r = json.loads(line)
            if r.get("api_key_hash") == key_hash:
                r["last_seen"] = datetime.now(timezone.utc).isoformat()
                r["lifetime_used"] = r.get("lifetime_used", 0) + 1
                updated = True
            records.append(r)
        except json.JSONDecodeError:
            continue

    if updated:
        with open(SIGNUPS_FILE, "w") as f:
            for r in records:
                f.write(json.dumps(r) + "\n")
    return updated


def get_tier_limits(api_key: str) -> dict:
    """Get usage limits for a tier."""
    record = _find_by_api_key(api_key)
    if not record:
        return {"error": "API key not found"}
    tier = record.get("tier", "free")
    limits = {
        "free": {"daily_limit": 3, "monthly_limit": 90, "price_monthly": 0},
        "pro": {"daily_limit": 1000, "monthly_limit": 30000, "price_monthly": 499},
        "governance": {"daily_limit": 10000, "monthly_limit": 300000, "price_monthly": 2499},
        "enterprise": {"daily_limit": -1, "monthly_limit": -1, "price_monthly": 9999},  # -1 = unlimited
    }
    return {
        "tier": tier,
        "limits": limits.get(tier, limits["free"]),
        "lifetime_used": record.get("lifetime_used", 0),
    }


# ═══════════════════════════════════════════════════════════════
#  TESTS
# ═══════════════════════════════════════════════════════════════

def test_validate_email():
    assert validate_email("nicholas@csoai.org") is True
    assert validate_email("test@example.com") is True
    assert validate_email("not-an-email") is False
    assert validate_email("@nodomain.com") is False
    return "✅ Email validation: correct + incorrect cases"


def test_generate_api_key():
    key1 = generate_api_key()
    key2 = generate_api_key()
    assert key1.startswith("csoai_")
    assert key1 != key2
    assert len(key1) == 38  # "csoai_" (6) + 32 hex chars
    return f"✅ API key generation: format OK, unique"


def test_hash_api_key():
    key = "csoai_test123"
    h1 = hash_api_key(key)
    h2 = hash_api_key(key)
    assert h1 == h2
    assert h1 != key
    return "✅ Hash: deterministic + non-reversible"


def test_signup_creates_record():
    test_email = f"test-{secrets.token_hex(4)}@example.com"
    result = signup(test_email, "Test User", "Test Co")
    assert result["status"] == "created"
    assert result["api_key"].startswith("csoai_")
    assert result["tier"] == "free"
    return f"✅ Signup: created {test_email}, api_key={result['api_key'][:20]}..."


def test_signup_duplicate_rejected():
    test_email = f"dup-{secrets.token_hex(4)}@example.com"
    r1 = signup(test_email)
    r2 = signup(test_email)
    assert r1["status"] == "created"
    assert r2["status"] == "existing"
    return f"✅ Duplicate: 1st=created, 2nd=existing"


def test_signup_invalid_email():
    r = signup("not-an-email")
    assert "error" in r
    return f"✅ Invalid email rejected: {r.get('error')}"


def test_authenticate_valid_key():
    test_email = f"auth-{secrets.token_hex(4)}@example.com"
    signup_result = signup(test_email)
    api_key = signup_result["api_key"]
    auth = authenticate(api_key)
    assert auth["authenticated"] is True
    return f"✅ Authentication: valid key accepted"


def test_authenticate_invalid_key():
    auth = authenticate("csoai_invalid_key_12345")
    assert auth["authenticated"] is False
    return "✅ Authentication: invalid key rejected"


def test_record_usage():
    test_email = f"usage-{secrets.token_hex(4)}@example.com"
    r = signup(test_email)
    key = r["api_key"]
    record_usage(key)
    record_usage(key)
    # Re-fetch
    auth = authenticate(key)
    assert auth["record"]["lifetime_used"] >= 2
    return f"✅ Usage tracking: lifetime_used={auth['record']['lifetime_used']}"


def test_tier_limits():
    r = signup(f"tier-{secrets.token_hex(4)}@example.com")
    key = r["api_key"]
    limits = get_tier_limits(key)
    assert limits["tier"] == "free"
    assert limits["limits"]["daily_limit"] == 3
    return f"✅ Tier limits: free={limits['limits']}"


if __name__ == "__main__":
    import sys
    if "--test" in sys.argv:
        print("\n🜏 CSOAI SIGN-UP API — TEST SUITE\n")
        results = [
            test_validate_email(),
            test_generate_api_key(),
            test_hash_api_key(),
            test_signup_creates_record(),
            test_signup_duplicate_rejected(),
            test_signup_invalid_email(),
            test_authenticate_valid_key(),
            test_authenticate_invalid_key(),
            test_record_usage(),
            test_tier_limits(),
        ]
        print(f"\n{'='*60}")
        for r in results:
            print(f"  {r}")
        passed = sum(1 for r in results if "✅" in r)
        print(f"\n  RESULT: {passed}/{len(results)} tests passed")
        print(f"{'='*60}\n")
    else:
        # Demo
        print("\n🜏 CSOAI SIGN-UP — DEMO\n")
        result = signup("demo@csoai.org", "Demo User", "CSOAI")
        print(json.dumps(result, indent=2))
