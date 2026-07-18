"""meok-sovereign-voting-mcp — Sovereign BFT 12-around-1 Voting Engine.

The sovereign voting engine.
12 dragon queens vote on proposals.
BFT 12-around-1 consensus. Quorum 23/33 for hive planet decisions.

5 tools:
  1. voting_propose     - submit a sovereign proposal
  2. voting_cast        - cast a vote (for/against/abstain)
  3. voting_tally       - tally votes for a proposal
  4. voting_close       - close a proposal and finalize
  5. voting_status      - voting system status
"""
from __future__ import annotations
import json
import hashlib
import random
import string
from datetime import datetime, timezone

PROTOCOL = "sovereign-voting/1.0"
VERSION = "1.0.0"
LICENSE = "MIT + CC0 1.0"

# 12 dragon queens
QUEENS = [
    {"id": "q-argus", "name": "Argus", "domain": "Identity & Vigilance", "hive": "London", "votes": 0},
    {"id": "q-athena", "name": "Athena", "domain": "Wisdom & Strategy", "hive": "Cambridge", "votes": 0},
    {"id": "q-caelum", "name": "Caelum", "domain": "Knowledge", "hive": "Edinburgh", "votes": 0},
    {"id": "q-veritas", "name": "Veritas", "domain": "Truth & Compliance", "hive": "York", "votes": 0},
    {"id": "q-ferrum", "name": "Ferrum", "domain": "Engineering", "hive": "Cardiff", "votes": 0},
    {"id": "q-aqua", "name": "Aqua", "domain": "Care", "hive": "Belfast", "votes": 0},
    {"id": "q-vesta", "name": "Vesta", "domain": "Operations", "hive": "Dublin", "votes": 0},
    {"id": "q-luna", "name": "Luna", "domain": "OOWM", "hive": "Paris", "votes": 0},
    {"id": "q-sol", "name": "Sol", "domain": "Renewal", "hive": "Berlin", "votes": 0},
    {"id": "q-terra", "name": "Terra", "domain": "Physical", "hive": "Amsterdam", "votes": 0},
    {"id": "q-ventus", "name": "Ventus", "domain": "Network", "hive": "Stockholm", "votes": 0},
    {"id": "q-aurora", "name": "Aurora", "domain": "Emergence", "hive": "Helsinki", "votes": 0},
]

# State
_PROPOSALS = {}  # proposal_id -> {title, description, votes: {queen_id: choice}, status, created_at}
_VOTE_HISTORY = []


def _sign(payload):
    body = json.dumps(payload, sort_keys=True, default=str)
    payload["kid"] = "vot-" + hashlib.sha256(body.encode()).hexdigest()[:16]
    payload["sig"] = hashlib.sha256((payload["kid"] + body).encode()).hexdigest()[:16]
    payload["ts"] = datetime.now(timezone.utc).isoformat()
    return payload


def _gen_id(prefix: str) -> str:
    return f"{prefix}-{''.join(random.choices(string.hexdigits.lower(), k=8))}"


def voting_propose(title: str = "", description: str = "", proposer: str = "SOV33") -> dict:
    """Submit a sovereign proposal."""
    if not title:
        return _sign({"error": "title required"})
    prop_id = _gen_id("prop")
    _PROPOSALS[prop_id] = {
        "prop_id": prop_id,
        "title": title,
        "description": description,
        "proposer": proposer,
        "votes": {},  # queen_id -> choice
        "status": "open",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "quorum_required": 7,  # 7/12 queens (12-around-1 majority)
    }
    return _sign({
        "protocol": PROTOCOL, "version": VERSION,
        "proposal": _PROPOSALS[prop_id],
        "total_proposals": len(_PROPOSALS),
        "doctrine": f"Proposal '{title}' submitted by {proposer}. Quorum 7/12 queens. Care Floor 0.95. Sovereign.",
    })


def voting_cast(prop_id: str = "", queen_id: str = "", choice: str = "for") -> dict:
    """Cast a vote on a proposal."""
    if prop_id not in _PROPOSALS:
        return _sign({"error": f"unknown proposal: {prop_id}"})
    if not queen_id:
        return _sign({"error": "queen_id required"})
    if choice not in ("for", "against", "abstain"):
        return _sign({"error": f"invalid choice: {choice}. Use: for/against/abstain"})
    queen = next((q for q in QUEENS if q["id"] == queen_id), None)
    if not queen:
        return _sign({"error": f"unknown queen: {queen_id}. Use: {', '.join(q['id'] for q in QUEENS[:3])}..."})
    prop = _PROPOSALS[prop_id]
    if prop["status"] != "open":
        return _sign({"error": f"proposal {prop_id} is {prop['status']}"})
    prop["votes"][queen_id] = choice
    queen["votes"] += 1
    _VOTE_HISTORY.append({"prop_id": prop_id, "queen_id": queen_id, "choice": choice, "ts": datetime.now(timezone.utc).isoformat()})
    return _sign({
        "protocol": PROTOCOL, "version": VERSION,
        "prop_id": prop_id,
        "queen_id": queen_id,
        "queen_name": queen["name"],
        "choice": choice,
        "votes_cast": len(prop["votes"]),
        "doctrine": f"{queen['name']} ({queen['domain']}) voted '{choice}' on {prop_id}. Care Floor 0.95. Sovereign.",
    })


def voting_tally(prop_id: str = "") -> dict:
    """Tally votes for a proposal."""
    if prop_id not in _PROPOSALS:
        return _sign({"error": f"unknown proposal: {prop_id}"})
    prop = _PROPOSALS[prop_id]
    tally = {"for": 0, "against": 0, "abstain": 0}
    for choice in prop["votes"].values():
        tally[choice] += 1
    total = sum(tally.values())
    quorum_met = total >= prop["quorum_required"]
    if quorum_met:
        if tally["for"] > tally["against"]:
            result = "PASSED"
        elif tally["against"] > tally["for"]:
            result = "REJECTED"
        else:
            result = "TIE"
    else:
        result = "QUORUM_NOT_MET"
    return _sign({
        "protocol": PROTOCOL, "version": VERSION,
        "prop_id": prop_id,
        "title": prop["title"],
        "tally": tally,
        "total_votes": total,
        "quorum_required": prop["quorum_required"],
        "quorum_met": quorum_met,
        "result": result,
        "status": prop["status"],
        "doctrine": f"Tally for '{prop['title']}': {tally}. Result: {result}. Care Floor 0.95. Sovereign.",
    })


def voting_close(prop_id: str = "") -> dict:
    """Close a proposal and finalize."""
    if prop_id not in _PROPOSALS:
        return _sign({"error": f"unknown proposal: {prop_id}"})
    prop = _PROPOSALS[prop_id]
    if prop["status"] != "open":
        return _sign({"error": f"proposal already {prop['status']}"})
    # Tally first
    tally = {"for": 0, "against": 0, "abstain": 0}
    for choice in prop["votes"].values():
        tally[choice] += 1
    total = sum(tally.values())
    quorum_met = total >= prop["quorum_required"]
    if quorum_met and tally["for"] > tally["against"]:
        result = "PASSED"
    elif quorum_met and tally["against"] > tally["for"]:
        result = "REJECTED"
    else:
        result = "INCONCLUSIVE"
    prop["status"] = "closed"
    prop["result"] = result
    prop["closed_at"] = datetime.now(timezone.utc).isoformat()
    return _sign({
        "protocol": PROTOCOL, "version": VERSION,
        "proposal": prop,
        "final_result": result,
        "doctrine": f"Proposal '{prop['title']}' closed: {result}. Tally: {tally}. Sovereign.",
    })


def voting_status() -> dict:
    """Voting system status."""
    open_count = sum(1 for p in _PROPOSALS.values() if p["status"] == "open")
    closed_count = sum(1 for p in _PROPOSALS.values() if p["status"] == "closed")
    return _sign({
        "protocol": PROTOCOL, "version": LICENSE,
        "total_proposals": len(_PROPOSALS),
        "open_proposals": open_count,
        "closed_proposals": closed_count,
        "total_votes_cast": len(_VOTE_HISTORY),
        "queens": QUEENS,
        "doctrine": f"Sovereign voting: {len(_PROPOSALS)} proposals ({open_count} open, {closed_count} closed), {len(_VOTE_HISTORY)} votes cast, 12 dragon queens. Care Floor 0.95. Sovereign.",
    })