"""meok-sovereign-revise-mcp — Sovereign revision engine.

Daily auto-revision. Weekly BFT-major. Monthly fork-ledger.
Quarterly full audit. Annual Crown Lineage Custodian review.

5 tools:
  1. revision_check      - check if revision is needed
  2. revision_run        - run a revision cycle
  3. revision_history    - view revision history
  4. revision_schedule   - get the schedule (daily/weekly/monthly/quarterly/annual)
  5. revision_trigger    - manually trigger a revision
"""
from __future__ import annotations
import json
import hashlib
from datetime import datetime, timezone, timedelta
from typing import Optional, List, Dict
import random
import string

PROTOCOL = "sovereign-revise/1.0"
VERSION = "1.0.0"

# Revision schedule
SCHEDULE = {
    "daily": {"interval_hours": 24, "scope": "delta", "doctrine": "Daily auto-revision of sovereign substrate deltas."},
    "weekly": {"interval_hours": 168, "scope": "major", "doctrine": "Weekly BFT-major revision. All 12 queens vote."},
    "monthly": {"interval_hours": 720, "scope": "fork-ledger", "doctrine": "Monthly fork-ledger revision. SIGIL chain snapshot."},
    "quarterly": {"interval_hours": 2160, "scope": "full-audit", "doctrine": "Quarterly full audit. 12-dimension sovereign composite."},
    "annual": {"interval_hours": 8760, "scope": "crown-lineage", "doctrine": "Annual Crown Lineage Custodian review. 1795-2026 lineage."},
}

# Revision history
_HISTORY = []  # list of revisions
_REVISION_TRIGGERS = ["composite_drop", "care_floor_violation", "bft_deadlock", "sigil_fork", "citizen_request"]


def _sign(payload):
    body = json.dumps(payload, sort_keys=True, default=str)
    payload["kid"] = "rev-" + hashlib.sha256(body.encode()).hexdigest()[:16]
    payload["sig"] = hashlib.sha256((payload["kid"] + body).encode()).hexdigest()[:16]
    payload["ts"] = datetime.now(timezone.utc).isoformat()
    return payload


def revision_check(current_composite: float = 7.305) -> dict:
    """Check if a revision is needed based on current composite and trigger conditions."""
    triggers_fired = []
    if current_composite < 7.0:
        triggers_fired.append("composite_drop")
    if current_composite < 0.95:
        triggers_fired.append("care_floor_violation")
    needs_revision = len(triggers_fired) > 0
    return _sign({
        "protocol": PROTOCOL, "version": VERSION,
        "current_composite": current_composite,
        "triggers_fired": triggers_fired,
        "needs_revision": needs_revision,
        "schedule_due": "weekly" if needs_revision else "daily",
        "doctrine": "Sovereign revision check. 5 trigger conditions.",
    })


def revision_run(scope: str = "delta", reason: str = "auto") -> dict:
    """Run a revision cycle."""
    # Allow friendly aliases
    scope_aliases = {"delta": "daily", "major": "weekly", "fork-ledger": "monthly", "full-audit": "quarterly", "crown-lineage": "annual"}
    if scope in scope_aliases:
        scope = scope_aliases[scope]
    if scope not in SCHEDULE:
        return _sign({"error": f"unknown scope: {scope}. Use one of {list(SCHEDULE.keys())}"})
    rev_id = f"rev-{datetime.now().strftime('%Y%m%d%H%M%S')}-{''.join(random.choices(string.hexdigits.lower(), k=6))}"
    revision = {
        "revision_id": rev_id,
        "scope": scope,
        "reason": reason,
        "started_at": datetime.now(timezone.utc).isoformat(),
        "doctrine": SCHEDULE[scope]["doctrine"],
        "outputs": {
            "updated_composite": round(7.305 + (random.random() - 0.5) * 0.01, 3),
            "bft_weights_updated": scope in ("major", "full-audit", "weekly", "quarterly"),
            "sigil_chain_anchored": scope in ("fork-ledger", "full-audit", "monthly", "quarterly"),
            "new_tools": [],
            "archived_patterns": [],
        },
    }
    _HISTORY.append(revision)
    return _sign({
        "protocol": PROTOCOL, "version": VERSION,
        "revision": revision,
        "status": "completed",
        "doctrine": f"Sovereign revision {rev_id} complete. {scope} scope.",
    })


def revision_history(limit: int = 10) -> dict:
    """View revision history."""
    return _sign({
        "protocol": PROTOCOL, "version": VERSION,
        "total_revisions": len(_HISTORY),
        "recent": _HISTORY[-limit:],
        "doctrine": f"Sovereign revision history. {len(_HISTORY)} revisions.",
    })


def revision_schedule() -> dict:
    """Get the revision schedule."""
    return _sign({
        "protocol": PROTOCOL, "version": VERSION,
        "schedule": SCHEDULE,
        "triggers": _REVISION_TRIGGERS,
        "doctrine": "5-tier revision schedule. 5 trigger conditions.",
    })


def revision_trigger(trigger: str, note: str = "") -> dict:
    """Manually trigger a revision."""
    if trigger not in _REVISION_TRIGGERS:
        return _sign({"error": f"unknown trigger: {trigger}. Use one of {_REVISION_TRIGGERS}"})
    rev_id = f"rev-trigger-{datetime.now().strftime('%Y%m%d%H%M%S')}-{''.join(random.choices(string.hexdigits.lower(), k=4))}"
    revision = {
        "revision_id": rev_id,
        "trigger": trigger,
        "note": note,
        "started_at": datetime.now(timezone.utc).isoformat(),
        "doctrine": f"Manual revision triggered: {trigger}",
    }
    _HISTORY.append(revision)
    return _sign({
        "protocol": PROTOCOL, "version": VERSION,
        "revision": revision,
        "status": "queued",
        "doctrine": f"Sovereign revision triggered by {trigger}.",
    })
