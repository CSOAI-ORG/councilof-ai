"""
EAT-708 BFT Council endpoint — sovereign BFT voting for SovSpace + J-Space ops.

Per CHARTER_SOV33_NINE_STAGE_FLOW: BFT quorum is 9/13 over THE_13_MEMBERS
(Hub + 12 Queens). Sovereign-bound. SIGIL-anchored.

This endpoint serves both READ-ONLY (get the council + pending votes) AND
WRITE (vote on a pending J-Space op).
"""
from __future__ import annotations
import json, hashlib, secrets
from datetime import datetime, timezone

CSOAI_CHARTER_SHA256 = "df65a6585cf6a686cbfd881f56c04447056e2551e7c04db57a80543521022054"
CSOAI_SIGIL_MINT = "77ab0e6f9d6c77e8"
CARE_FLOOR = 0.95

# The 13 THE_13_MEMBERS (Hub + 12 Queens) — canonical BFT-33 council voter roster.
THE_13_MEMBERS = [
    ("The Hub",         "sovereign-router",   "arbiter"),
    ("Care-Membrane",   "queen",              "Care floor gate (0.95)"),
    ("Article-0",       "queen",              "Constitutional floor"),
    ("BFT-33",          "queen",              "Council vote (quorum 9/13)"),
    ("Sigil-Chain",     "queen",              "Ed25519 audit anchor"),
    ("Str-Receipt",     "queen",              "STR pubkey attestation"),
    ("Care-Floor",      "queen",              "0.95 hard gate"),
    ("Care-Scorer",     "queen",              "cohere.command-r rubric"),
    ("Truth-Log",       "queen",              "Honest register"),
    ("Charter-Sigma",   "queen",              "Charter Article 0"),
    ("OWEM-Builder",    "queen",              "5-layer orchestration"),
    ("J-Space-Lens",    "queen",              "Concept lens"),
    ("Mother-Covenant", "queen",              "Care precedes all"),
]
QUORUM = 9  # of 13. f_bft = (13-1)/3 = 4.

# In-memory pending-vote ledger (would persist in real substrate)
_PENDING = {}  # vote_id -> {proposal, votes_for, votes_against, voters_for, voters_against, sigil}


def _new_vote_id():
    return f"bft-{secrets.token_hex(8)}"


def _sigil(entropy):
    h = hashlib.sha256((CSOAI_SIGIL_MINT + entropy + datetime.now(timezone.utc).isoformat()).encode()).hexdigest()[:16]
    return h


def bft_council(method="GET", proposal=None, vote=None, voter="anonymous"):
    """BFT Council dispatch: GET → list, POST action=propose, POST action=vote."""
    if method == "GET":
        return {
            "council_name": "SOV33 THE_13_MEMBERS",
            "members": [{"name": n, "tier": t, "role": r} for (n,t,r) in THE_13_MEMBERS],
            "member_count": len(THE_13_MEMBERS),
            "quorum": QUORUM,
            "f_bft": (len(THE_13_MEMBERS)-1)//3,
            "care_floor": CARE_FLOOR,
            "pending_vote_count": len(_PENDING),
            "sigil_mint": CSOAI_SIGIL_MINT,
            "charter_sha256": CSOAI_CHARTER_SHA256,
        }

    if method == "POST" and proposal:
        # Create new pending vote
        vote_id = _new_vote_id()
        _PENDING[vote_id] = {
            "proposal": proposal[:300],
            "votes_for": 0, "votes_against": 0,
            "voters_for": [], "voters_against": [],
            "sigil": _sigil(proposal),
            "ts": datetime.now(timezone.utc).isoformat(),
        }
        return {"vote_id": vote_id, "state": _PENDING[vote_id]}

    if method == "POST" and vote and isinstance(vote, dict):
        # Cast a vote
        vote_id = vote.get("vote_id")
        choice = vote.get("choice", "abstain")  # for / against / abstain
        if not vote_id or vote_id not in _PENDING:
            return {"error": f"unknown vote_id: {vote_id}"}, 400
        if voter in _PENDING[vote_id]["voters_for"] or voter in _PENDING[vote_id]["voters_against"]:
            return {"error": f"{voter} already voted on {vote_id}"}, 400
        if choice == "for":
            _PENDING[vote_id]["votes_for"] += 1
            _PENDING[vote_id]["voters_for"].append(voter)
        elif choice == "against":
            _PENDING[vote_id]["votes_against"] += 1
            _PENDING[vote_id]["voters_against"].append(voter)
        # Check quorum
        passed = _PENDING[vote_id]["votes_for"] >= QUORUM
        rejected = _PENDING[vote_id]["votes_against"] >= QUORUM
        return {"vote_id": vote_id, "cast": choice, "voter": voter,
                "state": {** _PENDING[vote_id], "passed": passed, "rejected": rejected, "quorum_met": passed or rejected}}

    return {"error": "unsupported action", "methods": ["GET", "POST action=propose", "POST action=vote"]}


def bft_tally(vote_id):
    """Return the live tally for a pending vote."""
    if vote_id not in _PENDING:
        return {"error": f"unknown vote_id: {vote_id}"}
    v = _PENDING[vote_id]
    return {"vote_id": vote_id, "proposal": v["proposal"], "votes_for": v["votes_for"], "votes_against": v["votes_against"], "quorum": QUORUM, "passed": v["votes_for"] >= QUORUM, "sigil": v["sigil"]}
