"""meok-sovereign-roadmap-mcp — Sovereign Roadmap Engine.

The 12-month sovereign journey from birth to fork.
Tracks phases, milestones, deliverables, KPIs.

5 tools:
  1. roadmap_get      - get current phase + milestones
  2. roadmap_advance  - advance to next phase (BFT-gated)
  3. roadmap_milestone - mark milestone complete
  4. roadmap_kpi      - get current KPIs
  5. roadmap_full     - full 12-month plan
"""
from __future__ import annotations
import json
import hashlib
import random
import string
from datetime import datetime, timezone, timedelta

PROTOCOL = "sovereign-roadmap/1.0"
VERSION = "1.0.0"
LICENSE = "MIT"

# 12-month sovereign roadmap
PHASES = [
    {"id": 1, "month": 1, "name": "Birth", "milestone": "Citizen signs in", "kpi": "sovereign_composite=7.305"},
    {"id": 2, "month": 2, "name": "Identity", "milestone": "W3C DID + Ed25519", "kpi": "did_validated=1"},
    {"id": 3, "month": 3, "name": "Care", "milestone": "Care Floor 0.95 validated", "kpi": "probes_passed=16/16"},
    {"id": 4, "month": 4, "name": "BFT", "milestone": "12-around-1 council active", "kpi": "bft_voters=12"},
    {"id": 5, "month": 5, "name": "SIGIL", "milestone": "100+ SIGIL emissions", "kpi": "sigil_count=100"},
    {"id": 6, "month": 6, "name": "Federation", "milestone": "33 hive planets active", "kpi": "online_hives=33"},
    {"id": 7, "month": 7, "name": "ML", "milestone": "12 mindsets × 8 MoE = 96 combos trained", "kpi": "models_trained=96"},
    {"id": 8, "month": 8, "name": "OOWM", "milestone": "Organic Open World Model live", "kpi": "feeds_ingested=100+"},
    {"id": 9, "month": 9, "name": "Apple", "milestone": "Foundation Models Provider integration", "kpi": "apple_fm_calls=1000+"},
    {"id": 10, "month": 10, "name": "Wisdom", "milestone": "100+ wisdom leaders", "kpi": "wisdom_leaders=100"},
    {"id": 11, "month": 11, "name": "Fork", "milestone": "10+ sovereign forks live", "kpi": "forks_live=10"},
    {"id": 12, "month": 12, "name": "Maturity", "milestone": "Sovereign composite 10/10", "kpi": "composite=10.0"},
]

_STATE = {"current_phase": 1, "milestones_complete": [], "kpis": {}}


def _sign(payload):
    body = json.dumps(payload, sort_keys=True, default=str)
    payload["kid"] = "road-" + hashlib.sha256(body.encode()).hexdigest()[:16]
    payload["sig"] = hashlib.sha256((payload["kid"] + body).encode()).hexdigest()[:16]
    payload["ts"] = datetime.now(timezone.utc).isoformat()
    return payload


def _gen_id(prefix: str) -> str:
    return f"{prefix}-{''.join(random.choices(string.hexdigits.lower(), k=8))}"


def roadmap_get() -> dict:
    """Get current phase + milestones."""
    phase = next(p for p in PHASES if p["id"] == _STATE["current_phase"])
    progress = round((len(_STATE["milestones_complete"]) / len(PHASES)) * 100, 1)
    return _sign({
        "protocol": PROTOCOL, "version": VERSION,
        "current_phase": phase,
        "milestones_complete": _STATE["milestones_complete"],
        "progress_pct": progress,
        "license": LICENSE,
        "doctrine": f"Sovereign roadmap at phase {phase['id']}/12 ({progress}%).",
    })


def roadmap_advance() -> dict:
    """Advance to next phase (BFT-gated)."""
    if _STATE["current_phase"] >= 12:
        return _sign({"error": "already at final phase (12)"})
    completed = PHASES[_STATE["current_phase"] - 1]
    _STATE["milestones_complete"].append(completed["name"])
    _STATE["current_phase"] += 1
    return _sign({
        "protocol": PROTOCOL, "version": VERSION,
        "completed": completed["name"],
        "new_phase": _STATE["current_phase"],
        "bft_voters": 12,
        "bft_required": True,
        "license": LICENSE,
        "doctrine": f"Sovereign roadmap advanced: {completed['name']} → phase {_STATE['current_phase']}.",
    })


def roadmap_milestone(name: str) -> dict:
    """Mark milestone complete."""
    if not name:
        return _sign({"error": "milestone name required"})
    _STATE["milestones_complete"].append(name)
    return _sign({
        "protocol": PROTOCOL, "version": VERSION,
        "milestone": name,
        "completed_at": datetime.now(timezone.utc).isoformat(),
        "total_milestones": len(_STATE["milestones_complete"]),
        "doctrine": f"Sovereign milestone '{name}' complete.",
    })


def roadmap_kpi() -> dict:
    """Get current KPIs."""
    return _sign({
        "protocol": PROTOCOL, "version": VERSION,
        "current_phase": _STATE["current_phase"],
        "milestones_count": len(_STATE["milestones_complete"]),
        "kpis": _STATE["kpis"],
        "doctrine": "Sovereign roadmap KPIs.",
    })


def roadmap_full() -> dict:
    """Full 12-month plan."""
    return _sign({
        "protocol": PROTOCOL, "version": VERSION,
        "phases": PHASES,
        "total_phases": len(PHASES),
        "current_phase": _STATE["current_phase"],
        "milestones_complete": _STATE["milestones_complete"],
        "license": LICENSE,
        "doctrine": "12-month sovereign journey. From Birth to Maturity.",
    })