"""
MEOK Auth Middleware — Authentication, tier management, and audit logging.

This is the canonical implementation of the MEOK AI Labs authentication
middleware. It provides:

- Tiered access control (free, starter, professional, enterprise)
- Per-day rate limiting based on tier
- API key management and validation
- Audit trail logging for professional+ tiers
- Optional Stripe integration for live tier validation
- Configurable via environment variables for standalone or embedded use

Environment Variables:
    MEOK_API_KEY_DIR: Override path to api_keys.json (default: ~/.meok/api_keys.json)
    MEOK_USAGE_DIR: Override path to usage tracking dir (default: ~/.meok/)
    MEOK_AUDIT_FILE: Override path to audit trail file (default: ~/.meok/audit_trail.jsonl)

Standalone Usage:
    This module can be used as a CLI tool for key management::

        python -m meok_auth.middleware generate <tier> <customer_name>
        python -m meok_auth.middleware list
        python -m meok_auth.middleware stats <api_key>
"""

import hashlib
import json
import os
import time
from enum import Enum
from typing import Optional, Tuple


class Tier(str, Enum):
    """Access tiers for MEOK AI Labs services.

    Each tier has specific rate limits and feature access defined in TIER_LIMITS.
    Tier values are stored as lowercase strings for consistency across
    API keys, JSON storage, and cross-service communication.
    """

    FREE = "free"
    STARTER = "starter"
    PROFESSIONAL = "professional"
    ENTERPRISE = "enterprise"


TIER_LIMITS: dict[Tier, dict] = {
    Tier.FREE: {"calls_per_day": 10, "frameworks": 1, "audit_trail": False},
    Tier.STARTER: {"calls_per_day": 100, "frameworks": 1, "audit_trail": False},
    Tier.PROFESSIONAL: {"calls_per_day": 1000, "frameworks": 5, "audit_trail": True},
    Tier.ENTERPRISE: {"calls_per_day": -1, "frameworks": -1, "audit_trail": True},
}

TIER_ORDER: list[Tier] = [Tier.FREE, Tier.STARTER, Tier.PROFESSIONAL, Tier.ENTERPRISE]

_MEOK_DIR: str = os.environ.get("MEOK_USAGE_DIR", os.path.expanduser("~/.meok"))
_KEYS_FILE: str = os.environ.get(
    "MEOK_API_KEY_DIR", os.path.join(_MEOK_DIR, "api_keys.json")
)
_USAGE_FILE: str = os.path.join(_MEOK_DIR, "usage.json")
_AUDIT_FILE: str = os.environ.get(
    "MEOK_AUDIT_FILE", os.path.join(_MEOK_DIR, "audit_trail.jsonl")
)


def _ensure_dir() -> None:
    """Create the MEOK data directory if it doesn't exist.

    Handles gracefully if the directory is not writable (e.g., in a
    sandboxed environment) by catching OSError.
    """
    try:
        os.makedirs(_MEOK_DIR, exist_ok=True)
    except OSError:
        pass


def _load_json(path: str) -> dict:
    """Load JSON data from a file, returning empty dict on any failure.

    Args:
        path: Absolute path to the JSON file.

    Returns:
        Parsed JSON dict, or empty dict if file is missing or corrupt.
    """
    _ensure_dir()
    if os.path.exists(path):
        try:
            with open(path) as f:
                return json.load(f)
        except (json.JSONDecodeError, IOError, OSError):
            return {}
    return {}


def _save_json(path: str, data: dict) -> None:
    """Atomically save JSON data to a file.

    Args:
        path: Absolute path to the JSON file.
        data: Dictionary to serialize and save.
    """
    _ensure_dir()
    try:
        with open(path, "w") as f:
            json.dump(data, f, indent=2)
    except OSError:
        pass


def generate_api_key(
    tier: Tier,
    customer_name: str,
    stripe_customer: str = "",
    stripe_session_id: str = "",
) -> str:
    """Generate a new API key for a customer.

    Creates a deterministic-yet-unique key seeded from the tier, customer
    name, and current timestamp. The key is stored in the keys file for
    subsequent validation.

    Args:
        tier: The access tier to assign.
        customer_name: Human-readable customer identifier.
        stripe_customer: Optional Stripe customer ID for billing integration.
        stripe_session_id: Optional Stripe checkout session ID.

    Returns:
        The generated API key string (prefixed with ``meok_``).
    """
    raw = f"meok_{tier.value}_{customer_name}_{time.time()}"
    key = f"meok_{hashlib.sha256(raw.encode()).hexdigest()[:32]}"

    keys = _load_json(_KEYS_FILE)
    keys[key] = {
        "tier": tier.value,
        "customer": customer_name,
        "stripe_customer": stripe_customer,
        "stripe_session_id": stripe_session_id,
        "created": time.strftime("%Y-%m-%dT%H:%M:%SZ"),
        "active": True,
    }
    _save_json(_KEYS_FILE, keys)
    return key


def get_tier_from_api_key(api_key: str) -> Tier:
    """Look up the access tier for a given API key.

    Optionally re-validates against Stripe if the key has a linked
    Stripe customer ID, refreshing the stored tier if it has changed.

    Args:
        api_key: The API key to look up. Empty string returns Tier.FREE.

    Returns:
        The resolved Tier, defaulting to Tier.FREE for missing or
        inactive keys.
    """
    if not api_key:
        return Tier.FREE

    keys = _load_json(_KEYS_FILE)
    record = keys.get(api_key)
    if not record or not record.get("active", True):
        return Tier.FREE

    local_tier = (
        Tier(record["tier"]) if record.get("tier") in [t.value for t in Tier] else Tier.FREE
    )

    stripe_customer = record.get("stripe_customer")
    if stripe_customer:
        try:
            from stripe_tier_checker import check_stripe_tier

            live_tier_str = check_stripe_tier(customer_email="", api_key=api_key)
            if live_tier_str and live_tier_str in [t.value for t in Tier]:
                live_tier = Tier(live_tier_str)
                if live_tier != local_tier:
                    record["tier"] = live_tier.value
                    _save_json(_KEYS_FILE, keys)
                return live_tier
        except (ImportError, Exception):
            pass

    return local_tier


def check_access(api_key: str = "", framework: str = None) -> Tuple[bool, str, Tier]:
    """Main access control function for MEOK MCP servers.

    Validates the API key, resolves the tier, and enforces per-day rate
    limits. Call this at the start of every tool handler.

    Args:
        api_key: The caller's API key. Empty string triggers the free tier.
        framework: Optional framework identifier for audit logging.

    Returns:
        A 3-tuple of (allowed, message, tier):
        - **allowed** (bool): True if the request should proceed.
        - **message** (str): ``"OK"`` on success, or an error/rejection message.
        - **tier** (Tier): The resolved tier for downstream feature gating.
    """
    tier = get_tier_from_api_key(api_key)
    limits = TIER_LIMITS[tier]

    usage = _load_json(_USAGE_FILE)
    today = time.strftime("%Y-%m-%d")
    key_hash = hashlib.sha256((api_key or "anon").encode()).hexdigest()[:12]
    day_key = f"{key_hash}:{today}"

    current = usage.get(day_key, 0)
    max_calls = limits["calls_per_day"]

    if max_calls != -1 and current >= max_calls:
        return (
            False,
            f"Rate limit reached ({max_calls}/day on {tier.value} tier). "
            f"Upgrade at https://meok.ai/pricing",
            tier,
        )

    usage[day_key] = current + 1
    cutoff = time.strftime("%Y-%m-%d", time.localtime(time.time() - 7 * 86400))
    usage = {k: v for k, v in usage.items() if k.split(":")[1] >= cutoff}
    _save_json(_USAGE_FILE, usage)

    return True, "OK", tier


def require_tier(minimum: Tier, current: Tier) -> Tuple[bool, str]:
    """Check whether a given tier meets the minimum requirement.

    Args:
        minimum: The minimum tier required for the feature.
        current: The user's current tier.

    Returns:
        A 2-tuple of (allowed, message):
        - **allowed** (bool): True if ``current >= minimum``.
        - **message** (str): ``"OK"`` or an upgrade prompt message.
    """
    if TIER_ORDER.index(current) < TIER_ORDER.index(minimum):
        return (
            False,
            f"Requires {minimum.value} tier. Current: {current.value}. "
            f"Upgrade at https://meok.ai/pricing",
        )
    return True, "OK"


def audit_log(
    api_key: str,
    tool_name: str,
    framework: str,
    result_summary: str,
    tier: Tier,
) -> None:
    """Append an entry to the audit trail.

    Only Professional and Enterprise tiers generate audit log entries.
    Entries are appended as JSONL for efficient sequential writes.

    Args:
        api_key: The caller's API key (truncated for privacy).
        tool_name: Name of the MCP tool invoked.
        framework: The compliance framework (e.g., ``"eu_ai_act"``).
        result_summary: Short description of the result.
        tier: The resolved tier of the caller.
    """
    if not TIER_LIMITS[tier]["audit_trail"]:
        return

    _ensure_dir()
    entry = {
        "ts": time.strftime("%Y-%m-%dT%H:%M:%SZ"),
        "tool": tool_name,
        "framework": framework,
        "result": result_summary[:200],
        "tier": tier.value,
        "key_prefix": (api_key or "")[:8] + "...",
    }
    try:
        with open(_AUDIT_FILE, "a") as f:
            f.write(json.dumps(entry) + "\n")
    except OSError:
        pass


def get_usage_stats(api_key: str = "") -> dict:
    """Get usage statistics for a given API key.

    Args:
        api_key: The caller's API key. Empty string uses the free tier.

    Returns:
        A dict with keys: tier, calls_today, limit, remaining, audit_trail.
    """
    usage = _load_json(_USAGE_FILE)
    tier = get_tier_from_api_key(api_key)
    limits = TIER_LIMITS[tier]

    key_hash = hashlib.sha256((api_key or "anon").encode()).hexdigest()[:12]
    today = time.strftime("%Y-%m-%d")
    day_key = f"{key_hash}:{today}"

    return {
        "tier": tier.value,
        "calls_today": usage.get(day_key, 0),
        "limit": limits["calls_per_day"],
        "remaining": (
            max(0, limits["calls_per_day"] - usage.get(day_key, 0))
            if limits["calls_per_day"] != -1
            else "unlimited"
        ),
        "audit_trail": limits["audit_trail"],
    }


def main() -> None:
    """CLI entry point for API key management.

    Usage::

        python -m meok_auth.middleware generate <tier> <customer_name>
        python -m meok_auth.middleware list
        python -m meok_auth.middleware stats <api_key>
    """
    import sys

    if len(sys.argv) < 2:
        print("Usage:")
        print("  python -m meok_auth.middleware generate <tier> <customer_name>")
        print("  python -m meok_auth.middleware list")
        print("  python -m meok_auth.middleware stats <api_key>")
        print(f"\nTiers: {', '.join(t.value for t in Tier)}")
        sys.exit(0)

    cmd = sys.argv[1]

    if cmd == "generate":
        tier = Tier(sys.argv[2])
        name = sys.argv[3]
        key = generate_api_key(tier, name)
        print(f"Generated key: {key}")
        print(f"Tier: {tier.value}")
        print(f"Customer: {name}")
    elif cmd == "list":
        keys = _load_json(_KEYS_FILE)
        for k, v in keys.items():
            status = "active" if v.get("active", True) else "disabled"
            print(f"  {k[:20]}... | {v['tier']:15} | {v['customer']:20} | {status}")
    elif cmd == "stats":
        key = sys.argv[2]
        stats = get_usage_stats(key)
        print(json.dumps(stats, indent=2))


if __name__ == "__main__":
    main()