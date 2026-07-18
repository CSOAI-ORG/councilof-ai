#!/usr/bin/env python3
"""Sovereign billing/quota system. Per-user monthly runestone allowance."""
import json
from pathlib import Path
from datetime import datetime, timedelta

QUOTAS = Path("/tmp/sovereign-portal/quotas.json")

def get_quota(sovereign_id):
    if not QUOTAS.exists():
        return {"sovereign_id": sovereign_id, "tier": "free", "monthly_limit": 100, "used": 0}
    d = json.loads(QUOTAS.read_text())
    return d.get(sovereign_id, {"sovereign_id": sovereign_id, "tier": "free", "monthly_limit": 100, "used": 0})

def increment(sovereign_id, n=1):
    d = json.loads(QUOTAS.read_text()) if QUOTAS.exists() else {}
    q = d.setdefault(sovereign_id, {
        "sovereign_id": sovereign_id, "tier": "free",
        "monthly_limit": 100, "used": 0, "tier_resets_at": (datetime.now() + timedelta(days=30)).isoformat()
    })
    q["used"] = q.get("used", 0) + n
    QUOTAS.write_text(json.dumps(d, indent=2))
    return q

def check(sovereign_id):
    q = get_quota(sovereign_id)
    return q["used"] < q["monthly_limit"]

if __name__ == "__main__":
    import sys
    sid = sys.argv[1] if len(sys.argv) > 1 else "test"
    print(json.dumps(get_quota(sid), indent=2))
