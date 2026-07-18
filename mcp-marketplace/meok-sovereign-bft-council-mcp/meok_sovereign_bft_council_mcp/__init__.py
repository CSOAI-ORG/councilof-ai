"""meok-sovereign-bft-council-mcp — 12-around-1 BFT voting (3/5/7 voters).

5 tools:
  1. bft_propose    - create a proposal (returns proposal_id)
  2. bft_vote       - cast a vote (for/against/abstain)
  3. bft_ratify     - check if proposal is ratified (meets quorum)
  4. bft_status     - current BFT state for a proposal
  5. bft_thresholds - return the canonical thresholds (EAT-12 tuned)
"""
from __future__ import annotations
import json
import hashlib
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, List, Optional

PROTOCOL = "sovereign-bft-council/1.0"
VERSION = "1.0.0"

# EAT-12 tuned thresholds: smaller councils vote BETTER (53.20 vs 39.43)
THRESHOLDS = {
    "fast":     {"voters": 3, "quorum": 2, "latency_ms": 50,  "security": 0.7},
    "balanced": {"voters": 5, "quorum": 3, "latency_ms": 150, "security": 0.85},
    "secure":   {"voters": 7, "quorum": 5, "latency_ms": 400, "security": 0.98},
}

# 12 council members (mapped from the 12 Generals)
COUNCIL_MEMBERS = [
    "argus", "scribe", "shield", "builder", "abacus", "lex",
    "scale", "crow", "gear", "voice", "owl", "dragon",
]

_PROPOSALS: Dict[str, dict] = {}
_VOTES: Dict[str, List[dict]] = {}


def _sign(payload: dict) -> dict:
    body = json.dumps(payload, sort_keys=True, default=str)
    payload["kid"] = "bft-" + hashlib.sha256(body.encode()).hexdigest()[:16]
    payload["sig"] = hashlib.sha256((payload["kid"] + body).encode()).hexdigest()
    payload["ts"] = datetime.now(timezone.utc).isoformat()
    return payload


def bft_thresholds() -> dict:
    """Return the EAT-12 tuned BFT thresholds."""
    return _sign({
        "protocol": PROTOCOL, "version": VERSION,
        "thresholds": THRESHOLDS,
        "council_size": 12,
        "doctrine": "Smaller councils vote better (EAT-11 ORNITH)",
    })


def bft_propose(title: str, description: str, *,
                bft_mode: str = "balanced",
                care_floor_impact: bool = False) -> dict:
    """Create a BFT proposal."""
    if bft_mode not in THRESHOLDS:
        bft_mode = "balanced"
    proposal_id = hashlib.sha256(f"{title}|{description}|{_time_ns()}".encode()).hexdigest()[:16]
    threshold = THRESHOLDS[bft_mode]
    proposal = {
        "protocol": PROTOCOL, "version": VERSION,
        "proposal_id": proposal_id,
        "title": title, "description": description,
        "bft_mode": bft_mode,
        "voters_required": threshold["voters"],
        "quorum_required": threshold["quorum"],
        "care_floor_impact": care_floor_impact,
        "status": "PENDING",
        "votes_for": 0, "votes_against": 0, "votes_abstain": 0,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    _PROPOSALS[proposal_id] = proposal
    _VOTES[proposal_id] = []
    return _sign(proposal)


def bft_vote(proposal_id: str, voter: str, vote: str) -> dict:
    """Cast a BFT vote. vote in {for, against, abstain}."""
    if proposal_id not in _PROPOSALS:
        return _sign({"error": f"unknown proposal: {proposal_id}"})
    if voter not in COUNCIL_MEMBERS:
        return _sign({"error": f"unknown voter: {voter}"})
    if vote not in ("for", "against", "abstain"):
        return _sign({"error": f"invalid vote: {vote}"})

    proposal = _PROPOSALS[proposal_id]
    # Check for duplicate vote
    existing = [v for v in _VOTES[proposal_id] if v["voter"] == voter]
    if existing:
        # Update vote
        old = existing[0]["vote"]
        proposal[f"votes_{old}"] -= 1
        for v in _VOTES[proposal_id]:
            if v["voter"] == voter:
                v["vote"] = vote
    else:
        _VOTES[proposal_id].append({
            "voter": voter, "vote": vote,
            "ts": datetime.now(timezone.utc).isoformat(),
        })
    proposal[f"votes_{vote}"] += 1
    # Check ratification
    if proposal["votes_for"] >= proposal["quorum_required"]:
        proposal["status"] = "RATIFIED"
    elif proposal["votes_against"] > (12 - proposal["quorum_required"]):
        proposal["status"] = "REJECTED"
    return _sign({
        "protocol": PROTOCOL, "version": VERSION,
        "proposal_id": proposal_id, "voter": voter, "vote": vote,
        "proposal_status": proposal["status"],
        "votes_for": proposal["votes_for"],
        "votes_against": proposal["votes_against"],
        "quorum_required": proposal["quorum_required"],
    })


def bft_ratify(proposal_id: str) -> dict:
    """Check if a proposal is ratified."""
    if proposal_id not in _PROPOSALS:
        return _sign({"error": f"unknown proposal: {proposal_id}"})
    p = _PROPOSALS[proposal_id]
    ratified = p["status"] == "RATIFIED"
    return _sign({
        "protocol": PROTOCOL, "version": VERSION,
        "proposal_id": proposal_id, "ratified": ratified,
        "status": p["status"],
        "votes_for": p["votes_for"],
        "votes_against": p["votes_against"],
        "quorum_required": p["quorum_required"],
        "voters_required": p["voters_required"],
        "votes_cast": len(_VOTES[proposal_id]),
    })


def bft_status(proposal_id: str) -> dict:
    """Get full status of a BFT proposal including all votes."""
    if proposal_id not in _PROPOSALS:
        return _sign({"error": f"unknown proposal: {proposal_id}"})
    p = _PROPOSALS[proposal_id]
    return _sign({
        "protocol": PROTOCOL, "version": VERSION,
        **p,
        "votes": _VOTES[proposal_id],
    })


# Helper: time_ns for proposal ID
import time as _time_mod
def _time_ns():
    return _time_mod.time_ns()