"""
RUNESTONE PER-USER HISTORY — Each user sees their own sovereign activity.
Reads the ledger, filters by submitted_by sovereign_id, returns per-user
runestone history with stats.
"""

import json
from pathlib import Path
from datetime import datetime

LEDGER = Path("/tmp/sovereign-portal/runestone-ledger.jsonl")


def get_user_history(sovereign_id: str) -> dict:
    """Return all runestones submitted by this sovereign_id."""
    if not LEDGER.exists():
        return {"sovereign_id": sovereign_id, "runestones": [], "total": 0}

    entries = []
    for line in LEDGER.read_text().strip().split("\n"):
        try:
            entry = json.loads(line)
            runestone = entry.get("runestone", {})
            if runestone.get("sovereign_id") == sovereign_id:
                entries.append(runestone)
        except: pass

    # Compute stats
    modes = {}
    for r in entries:
        mode = r.get("mode", "1-brain")
        modes[mode] = modes.get(mode, 0) + 1
    total_voters = sum(r.get("consensus", {}).get("n_voters", 1) for r in entries)

    return {
        "sovereign_id": sovereign_id,
        "total_runestones": len(entries),
        "by_mode": modes,
        "total_voters_used": total_voters,
        "earliest": entries[0]["ts"] if entries else None,
        "latest": entries[-1]["ts"] if entries else None,
        "runestones": entries,
    }


if __name__ == "__main__":
    # Demo: show all sovereign_ids in the ledger
    if LEDGER.exists():
        seen = set()
        for line in LEDGER.read_text().strip().split("\n"):
            try:
                r = json.loads(line).get("runestone", {})
                sid = r.get("sovereign_id", "anon")
                seen.add(sid)
            except: pass
        for sid in seen:
            h = get_user_history(sid)
            print(f"\nSovereign ID: {sid[:16]}...")
            print(f"  Total: {h['total_runestones']} runestones")
            print(f"  Modes: {h['by_mode']}")
            print(f"  Voters: {h['total_voters_used']}")
            print(f"  Range: {h['earliest'][:19]} → {h['latest'][:19]}")
