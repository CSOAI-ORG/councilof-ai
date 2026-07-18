"""meok-sovereign-bft-mcp — BFT 3/5/7 voter council runtime.

5 tools:
  1. council_create   - create a BFT council
  2. vote             - cast a vote
  3. tally            - count votes and decide outcome
  4. dissent_record   - record dissent reason
  5. get_outcome      - get the outcome of a council
"""
from __future__ import annotations
import json
import hashlib
from datetime import datetime, timezone
from typing import Optional

PROTOCOL = "sovereign-bft/1.0"
VERSION = "1.0.0"

_COUNCILS = {}  # council_id → council
_VOTES = {}  # council_id → [votes]


def _sign(payload: dict) -> dict:
    body = json.dumps(payload, sort_keys=True, default=str)
    payload["kid"] = "bft-" + hashlib.sha256(body.encode()).hexdigest()[:16]
    payload["sig"] = hashlib.sha256((payload["kid"] + body).encode()).hexdigest()
    payload["ts"] = datetime.now(timezone.utc).isoformat()
    return payload


def council_create(topic: str, voters: list) -> dict:
    """Create a BFT council (3/5/7 voters)."""
    n = len(voters)
    if n not in (3, 5, 7):
        return _sign({"error": "voters must be 3, 5, or 7"})
    quorum = {3: 2, 5: 3, 7: 5}[n]  # 2/3, 3/5, 5/7
    cid = hashlib.sha256(f"{topic}|{datetime.now(timezone.utc).isoformat()}".encode()).hexdigest()[:16]
    council = {
        "council_id": cid,
        "topic": topic,
        "voters": voters,
        "size": n,
        "quorum": quorum,
        "status": "OPEN",
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    _COUNCILS[cid] = council
    _VOTES[cid] = []
    return _sign(council)


def vote(council_id: str, voter: str, choice: str) -> dict:
    """Cast a vote (YES/NO/ABSTAIN)."""
    if council_id not in _COUNCILS:
        return _sign({"error": f"unknown council_id: {council_id}"})
    if choice not in ("YES", "NO", "ABSTAIN"):
        return _sign({"error": "choice must be YES/NO/ABSTAIN"})
    if voter not in _COUNCILS[council_id]["voters"]:
        return _sign({"error": f"{voter} is not a voter in this council"})
    votes = _VOTES[council_id]
    # Replace if voter already voted
    votes = [v for v in votes if v["voter"] != voter]
    votes.append({
        "voter": voter, "choice": choice,
        "voted_at": datetime.now(timezone.utc).isoformat(),
    })
    _VOTES[council_id] = votes
    return _sign({
        "protocol": PROTOCOL, "version": VERSION,
        "council_id": council_id, "voter": voter, "choice": choice,
        "votes_so_far": len(votes),
        "doctrine": f"{voter} voted {choice} in council {council_id}.",
    })


def tally(council_id: str) -> dict:
    """Count votes and decide outcome."""
    if council_id not in _COUNCILS:
        return _sign({"error": f"unknown council_id: {council_id}"})
    council = _COUNCILS[council_id]
    votes = _VOTES[council_id]
    yes = sum(1 for v in votes if v["choice"] == "YES")
    no = sum(1 for v in votes if v["choice"] == "NO")
    abst = sum(1 for v in votes if v["choice"] == "ABSTAIN")
    passed = yes >= council["quorum"]
    if passed:
        council["status"] = "RATIFIED"
    else:
        council["status"] = "REJECTED"
    return _sign({
        "protocol": PROTOCOL, "version": VERSION,
        "council_id": council_id,
        "yes": yes, "no": no, "abstain": abst,
        "quorum": council["quorum"], "size": council["size"],
        "outcome": "PASSED" if passed else "REJECTED",
        "topic": council["topic"],
    })


def dissent_record(council_id: str, voter: str, reason: str) -> dict:
    """Record dissent reason."""
    if council_id not in _COUNCILS:
        return _sign({"error": f"unknown council_id: {council_id}"})
    return _sign({
        "protocol": PROTOCOL, "version": VERSION,
        "council_id": council_id, "voter": voter, "reason": reason,
        "recorded_at": datetime.now(timezone.utc).isoformat(),
        "doctrine": "Dissent is recorded for sovereign audit trail.",
    })


def get_outcome(council_id: str) -> dict:
    """Get the outcome of a council."""
    if council_id not in _COUNCILS:
        return _sign({"error": f"unknown council_id: {council_id}"})
    council = _COUNCILS[council_id]
    votes = _VOTES[council_id]
    return _sign({
        "protocol": PROTOCOL, "version": VERSION,
        "council_id": council_id,
        "topic": council["topic"],
        "status": council["status"],
        "votes": votes, "vote_count": len(votes),
        "size": council["size"], "quorum": council["quorum"],
    })
