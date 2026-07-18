#!/usr/bin/env python3
"""Independent sigil validator - anyone can run this to verify a runestone."""
import json, hashlib
from pathlib import Path
from datetime import datetime

LEDGER = Path("/tmp/sovereign-portal/runestone-ledger.jsonl")

def compute_sigil(runestone):
    """Reproduce the sigil from a runestone's content."""
    msg = json.dumps(runestone, sort_keys=True, default=str)
    return hashlib.sha256(msg.encode()).hexdigest()[:32]

def verify_sigil(runestone):
    """Verify that a runestone's sigil matches its content."""
    declared = runestone.get("sigil", "")
    computed = compute_sigil(runestone)
    return {
        "declared": declared,
        "computed": computed,
        "match": declared == computed,
        "verified": declared == computed,
    }

def verify_in_ledger(sigil):
    """Find a runestone by sigil and verify it."""
    if not LEDGER.exists():
        return {"error": "no ledger"}
    for line in LEDGER.read_text().strip().splitlines():
        try:
            entry = json.loads(line)
            r = entry.get("runestone", {})
            if r.get("sigil", "").startswith(sigil):
                return verify_sigil(r)
        except: pass
    return {"error": "sigil not found"}

if __name__ == "__main__":
    import sys
    s = sys.argv[1] if len(sys.argv) > 1 else ""
    print(json.dumps(verify_in_ledger(s), indent=2))
