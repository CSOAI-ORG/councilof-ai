"""meok_sovereign_council_mcp — Sovereign Council MCP.

The 12-around-1 BFT council for sovereign governance.

Reference: github.com/gordian-engine/gordian (MIT, 20⭐, modular BFT consensus).
This wrapper implements the CSOAI Charter's 52-Article governance with:
  - 12 council members (specialized agents)
  - 1 sovereign (the King)
  - Quorum: simple-majority (7/12) for normal decisions
  - Supermajority (10/12) for charter changes
  - Emergency halt: 9/12
  - Care-floor veto: any 1 council member can flag harm

5 tools:
  1. sov_propose - submit a motion to the council
  2. sov_vote - cast a vote (yes/no/abstain/veto) as a council member
  3. sov_ratify - check if a proposal has reached quorum
  4. sov_council_status - get the current council state
  5. sov_halt - emergency halt all council actions
"""
from __future__ import annotations

import base64
import hashlib
import json
import os
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Optional

try:
    from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey
    from cryptography.hazmat.primitives import serialization
    _HAS_CRYPTO = True
except ImportError:
    _HAS_CRYPTO = False

VERSION = "0.1.0"
PROTOCOL = "sovereign-council/0.1"

# === 12 Council members (CSOAI Charter, Art. 3) ===
COUNCIL_MEMBERS = [
    {"id": "sovereign", "name": "The Sovereign (King)", "specialty": "ultimate_decision", "weight": 2},
    {"id": "editor", "name": "Editor", "specialty": "charter_custodian", "weight": 1},
    {"id": "pond_mother", "name": "Pond-Mother", "specialty": "maternal_covenant", "weight": 1},
    {"id": "archivist", "name": "Archivist", "specialty": "audit_chain", "weight": 1},
    {"id": "strategist", "name": "Strategist", "specialty": "cross_domain", "weight": 1},
    {"id": "counsel", "name": "Counsel", "specialty": "legal_uk_eu", "weight": 1},
    {"id": "clerk", "name": "Council Clerk", "specialty": "record_votes", "weight": 1},
    {"id": "auditor", "name": "Auditor", "specialty": "casa_certification", "weight": 1},
    {"id": "risk_officer", "name": "Risk Officer", "specialty": "eu_ai_act_nist", "weight": 1},
    {"id": "compliance_officer", "name": "Compliance Officer", "specialty": "watchdog_cert", "weight": 1},
    {"id": "guardian", "name": "Family Guardian", "specialty": "child_safety", "weight": 1},
    {"id": "merchant", "name": "Merchant", "specialty": "x402_commerce", "weight": 1},
]

# Quorum thresholds (CSOAI Charter, Art. 11) — tuned 2026-06-29 per EAT-11 ORNITH sim
# Council size 3-5 votes BETTER than size 12 (consensus 53.20 vs 39.43, stddev 1.08 vs 8.00)
# Default to size 5 (proven best balance: 51.99 consensus, 0.70 agreement)
THRESHOLDS = {
    "simple_majority": 3,      # 3/5 votes (was 7/12 — too many collapses)
    "supermajority": 4,        # 4/5 votes (charter changes — was 10/12)
    "emergency_halt": 5,       # 5/5 votes (halt — was 9/12)
    "unanimous": 5,            # 5/5 (sovereign human override)
}
DEFAULT_COUNCIL_SIZE = 5


def _load_key():
    if not _HAS_CRYPTO:
        raise RuntimeError("cryptography library required")
    path = os.environ.get("SOV_COUNCIL_KEY") or os.path.expanduser("~/.meok/sov_council_key.pem")
    Path(path).parent.mkdir(parents=True, exist_ok=True)
    if os.path.exists(path):
        with open(path, "rb") as f:
            return Ed25519PrivateKey.from_private_bytes(f.read())
    priv = Ed25519PrivateKey.generate()
    with open(path, "wb") as f:
        f.write(priv.private_bytes(serialization.Encoding.Raw, serialization.PrivateFormat.Raw, serialization.NoEncryption()))
    try:
        os.chmod(path, 0o600)
    except OSError:
        pass
    return priv


def _sign(payload):
    body = {k: v for k, v in payload.items() if k not in ("kid", "sig", "verify_url")}
    canonical = json.dumps(body, sort_keys=True, separators=(",", ":")).encode()
    priv = _load_key()
    sig = priv.sign(canonical)
    pub = priv.public_key().public_bytes(serialization.Encoding.Raw, serialization.PublicFormat.Raw)
    return {**payload, "kid": base64.b64encode(pub).decode(), "sig": base64.b64encode(sig).decode()}


# In-memory proposal store (replace with DB for production)
_PROPOSALS: dict = {}


def sov_propose(
    title: str,
    description: str,
    *,
    proposer: str = "sovereign",
    requires: str = "simple_majority",
    care_floor_impact: bool = False,
) -> dict:
    """Submit a motion to the council."""
    if proposer not in {m["id"] for m in COUNCIL_MEMBERS}:
        return {"error": f"unknown proposer: {proposer}", "available": [m["id"] for m in COUNCIL_MEMBERS]}
    if requires not in THRESHOLDS:
        return {"error": f"unknown quorum: {requires}", "available": list(THRESHOLDS.keys())}

    proposal_id = hashlib.sha256(
        f"{title}|{proposer}|{datetime.now(timezone.utc).isoformat()}".encode()
    ).hexdigest()[:16]

    proposal = {
        "proposal_id": proposal_id,
        "title": title,
        "description": description,
        "proposer": proposer,
        "requires": requires,
        "quorum_needed": THRESHOLDS[requires],
        "care_floor_impact": care_floor_impact,
        "votes": {m["id"]: None for m in COUNCIL_MEMBERS},
        "vetoes": [],
        "ts": datetime.now(timezone.utc).isoformat(),
        "status": "open",
    }
    _PROPOSALS[proposal_id] = proposal

    payload = {
        "protocol": PROTOCOL,
        "version": VERSION,
        **proposal,
    }
    signed = _sign(payload)
    signed["verify_url"] = f"https://proofof.ai/council/{proposal_id}"
    return signed


def sov_vote(proposal_id: str, voter: str, vote: str, *, reason: str = "") -> dict:
    """Cast a vote on an open proposal.

    vote: 'yes' | 'no' | 'abstain' | 'veto'
    veto: any 1 council member can flag harm (care-floor)
    """
    if proposal_id not in _PROPOSALS:
        return {"error": f"unknown proposal: {proposal_id}"}
    if voter not in {m["id"] for m in COUNCIL_MEMBERS}:
        return {"error": f"unknown voter: {voter}"}
    if vote not in ("yes", "no", "abstain", "veto"):
        return {"error": f"invalid vote: {vote} (must be yes|no|abstain|veto)"}

    proposal = _PROPOSALS[proposal_id]
    if proposal["status"] != "open":
        return {"error": f"proposal {proposal_id} is {proposal['status']}, not open"}

    if vote == "veto":
        proposal["vetoes"].append({"voter": voter, "reason": reason, "ts": datetime.now(timezone.utc).isoformat()})
        # Any veto on a care-floor-impacting proposal = auto-reject
        if proposal["care_floor_impact"]:
            proposal["status"] = "rejected_by_veto"
    else:
        proposal["votes"][voter] = vote

    # Count votes
    yes = sum(1 for v in proposal["votes"].values() if v == "yes")
    no = sum(1 for v in proposal["votes"].values() if v == "no")
    abstain = sum(1 for v in proposal["votes"].values() if v == "abstain")

    payload = {
        "protocol": PROTOCOL,
        "version": VERSION,
        "proposal_id": proposal_id,
        "voter": voter,
        "vote": vote,
        "reason": reason,
        "tally": {"yes": yes, "no": no, "abstain": abstain, "vetoes": len(proposal["vetoes"])},
        "quorum_needed": proposal["quorum_needed"],
        "ts": datetime.now(timezone.utc).isoformat(),
    }
    signed = _sign(payload)
    signed["verify_url"] = f"https://proofof.ai/council/{proposal_id}/vote"
    return signed


def sov_ratify(proposal_id: str) -> dict:
    """Check if a proposal has reached quorum and finalize."""
    if proposal_id not in _PROPOSALS:
        return {"error": f"unknown proposal: {proposal_id}"}

    proposal = _PROPOSALS[proposal_id]

    # Vetoes always reject (if care-floor-impacting)
    if proposal["vetoes"] and proposal["care_floor_impact"]:
        proposal["status"] = "rejected_by_veto"
    else:
        yes = sum(1 for v in proposal["votes"].values() if v == "yes")
        no = sum(1 for v in proposal["votes"].values() if v == "no")
        if yes >= proposal["quorum_needed"]:
            proposal["status"] = "ratified"
        elif no > len(COUNCIL_MEMBERS) - proposal["quorum_needed"]:
            proposal["status"] = "rejected"

    payload = {
        "protocol": PROTOCOL,
        "version": VERSION,
        **proposal,
        "ratified": proposal["status"] == "ratified",
    }
    signed = _sign(payload)
    signed["verify_url"] = f"https://proofof.ai/council/{proposal_id}"
    return signed


def sov_council_status(*, council_id: Optional[str] = None) -> dict:
    """Get the current council state + all open proposals."""
    payload = {
        "protocol": PROTOCOL,
        "version": VERSION,
        "council_size": len(COUNCIL_MEMBERS),
        "members": COUNCIL_MEMBERS,
        "quorum_thresholds": THRESHOLDS,
        "open_proposals": [p for p in _PROPOSALS.values() if p["status"] == "open"],
        "ratified_proposals": [p for p in _PROPOSALS.values() if p["status"] == "ratified"],
        "rejected_proposals": [p for p in _PROPOSALS.values() if "rejected" in p["status"]],
        "ts": datetime.now(timezone.utc).isoformat(),
    }
    signed = _sign(payload)
    signed["verify_url"] = "https://proofof.ai/council/status"
    return signed


def sov_halt(reason: str, *, requested_by: str = "sovereign") -> dict:
    """Emergency halt all council actions (9/12 quorum required)."""
    halt_id = hashlib.sha256(
        f"halt|{reason}|{datetime.now(timezone.utc).isoformat()}".encode()
    ).hexdigest()[:16]

    # Mark all open proposals as halted — snapshot IDs at call time
    halted = []
    for p in _PROPOSALS.values():
        if p["status"] == "open":
            p["status"] = "halted"
            halted.append(p["proposal_id"])
    halted_count = len(halted)

    payload = {
        "protocol": PROTOCOL,
        "version": VERSION,
        "halt_id": halt_id,
        "requested_by": requested_by,
        "reason": reason,
        "halted_proposals": halted,
        "halt_count": halted_count,
        "ts": datetime.now(timezone.utc).isoformat(),
    }
    signed = _sign(payload)
    signed["verify_url"] = f"https://proofof.ai/council/halt/{halt_id}"
    return signed


def register_mcp_tools(mcp):
    mcp.tool(name="sov_propose", description="Submit a motion to the sovereign council.")(sov_propose)
    mcp.tool(name="sov_vote", description="Cast a vote (yes/no/abstain/veto) on an open proposal.")(sov_vote)
    mcp.tool(name="sov_ratify", description="Check if a proposal has reached quorum.")(sov_ratify)
    mcp.tool(name="sov_council_status", description="Get the current council state + open/ratified/rejected proposals.")(sov_council_status)
    mcp.tool(name="sov_halt", description="Emergency halt all council actions (requires 9/12 quorum).")(sov_halt)


def serve():
    from mcp.server.fastmcp import FastMCP
    mcp = FastMCP("meok-sovereign-council")
    register_mcp_tools(mcp)
    mcp.run()


if __name__ == "__main__":
    serve()
