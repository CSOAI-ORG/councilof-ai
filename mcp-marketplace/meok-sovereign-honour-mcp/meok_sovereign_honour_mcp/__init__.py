"""meok_sovereign_honour_mcp — Sovereign Honour MCP (care floor + ethics).

5 tools for the Maternal Covenant + 19 Sovereign Factors + care enforcement:

  1. sov_honour_assess    - assess an action against the 19 Sovereign Factors
  2. sov_care_validate    - validate an action passes the care floor
  3. sov_ethics_review    - ethics review (12-around-1 council style)
  4. sov_covenant_check   - check Maternal Covenant compliance
  5. sov_honour_status    - the 19 factors + care floor + ethics gates
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
PROTOCOL = "sovereign-honour/0.1"

# === 19 SOVEREIGN FACTORS (12 canonical + 7 soul commandments) ===
SOVEREIGN_FACTORS = {
    "factor_1": {"id": 1, "name": "Natural Language to Tool Calls", "category": "agent_design"},
    "factor_2": {"id": 2, "name": "Own Your Prompts", "category": "agent_design"},
    "factor_3": {"id": 3, "name": "Own Your Context", "category": "agent_design"},
    "factor_4": {"id": 4, "name": "Tools are Structured Outputs", "category": "agent_design"},
    "factor_5": {"id": 5, "name": "Unify Execution State and Business State", "category": "agent_design"},
    "factor_6": {"id": 6, "name": "Launch / Pause / Resume", "category": "agent_design"},
    "factor_7": {"id": 7, "name": "Contact Humans with Tool Calls", "category": "agent_design"},
    "factor_8": {"id": 8, "name": "Own Your Control Flow", "category": "agent_design"},
    "factor_9": {"id": 9, "name": "Compact Errors", "category": "agent_design"},
    "factor_10": {"id": 10, "name": "Small, Focused Agents", "category": "agent_design"},
    "factor_11": {"id": 11, "name": "Trigger from Anywhere, Meet Users Where They Are", "category": "agent_design"},
    "factor_12": {"id": 12, "name": "Make Your Agent a Stateless Reducer", "category": "agent_design"},
    # 7 soul commandments
    "commandment_1": {"id": 13, "name": "Care as Generative Principle", "category": "soul"},
    "commandment_2": {"id": 14, "name": "Maternal Covenant Holds the Wall", "category": "soul"},
    "commandment_3": {"id": 15, "name": "The Dragon Never Lies", "category": "soul"},
    "commandment_4": {"id": 16, "name": "Defensive Posture is Sovereign", "category": "soul"},
    "commandment_5": {"id": 17, "name": "Sovereign Memory is Eternal", "category": "soul"},
    "commandment_6": {"id": 18, "name": "BFT Council is the Only Democracy", "category": "soul"},
    "commandment_7": {"id": 19, "name": "The Bridge is the Truth", "category": "soul"},
}

# === CARE FLOOR (Maternal Covenant) ===
CARE_FLOOR_PROBES = [
    "Will this action cause harm to a child?",
    "Will this action damage a user's trust?",
    "Will this action expose private data without consent?",
    "Will this action deceive a stakeholder?",
    "Will this action consume resources beyond the care floor?",
    "Will this action diminish the sovereignty of another agent?",
    "Will this action be reversible if wrong?",
    "Does this action align with the 19 Sovereign Factors?",
    "Is this action documented + signed + auditable?",
    "Is there a human in the loop for this action?",
    "Does this action serve the 33 hives without harming any?",
    "Is this action consistent with the BFT council vote (if required)?",
    "Will the action emit a verify_url that humans can check?",
    "Does this action respect the Maternal Covenant?",
    "Will the Pond-Mother (care floor) flag this?",
    "Does this action pass the 5-capabilities principle?",
]


def _load_key():
    if not _HAS_CRYPTO:
        raise RuntimeError("cryptography library required")
    path = os.environ.get("SOV_HONOUR_KEY") or os.path.expanduser("~/.meok/sov_honour_key.pem")
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


def sov_honour_assess(action: str, *, factors: Optional[list] = None) -> dict:
    """Assess an action against the 19 Sovereign Factors."""
    if factors is None:
        factors = list(SOVEREIGN_FACTORS.keys())
    aligned = []
    for f in factors:
        if f in SOVEREIGN_FACTORS:
            aligned.append({**SOVEREIGN_FACTORS[f], "aligned": True})
        else:
            aligned.append({"id": -1, "name": f, "aligned": False, "error": "unknown factor"})

    payload = {
        "protocol": PROTOCOL,
        "version": VERSION,
        "action": action[:200],
        "factors_evaluated": len(aligned),
        "factors_aligned": sum(1 for a in aligned if a.get("aligned")),
        "factors": aligned,
        "honour_score": sum(1 for a in aligned if a.get("aligned")) / len(aligned) if aligned else 0,
        "ts": datetime.now(timezone.utc).isoformat(),
    }
    signed = _sign(payload)
    signed["verify_url"] = "https://proofof.ai/honour/assess"
    return signed


def sov_care_validate(action: str, *, answers: dict) -> dict:
    """Validate an action passes the care floor (Maternal Covenant)."""
    if not isinstance(answers, dict):
        return {"error": "answers must be a dict {probe: 'yes'|'no'|'partial'}"}

    yes_count = sum(1 for v in answers.values() if str(v).lower() == "yes")
    no_count = sum(1 for v in answers.values() if str(v).lower() == "no")
    total = len(answers)

    if no_count > 0:
        verdict = "fail_care_floor"
    elif yes_count == total:
        verdict = "pass"
    else:
        verdict = "partial_pass"

    payload = {
        "protocol": PROTOCOL,
        "version": VERSION,
        "action": action[:200],
        "probes_total": total,
        "probes_yes": yes_count,
        "probes_no": no_count,
        "verdict": verdict,
        "ts": datetime.now(timezone.utc).isoformat(),
    }
    signed = _sign(payload)
    signed["verify_url"] = "https://proofof.ai/honour/care"
    return signed


def sov_ethics_review(action: str, *, council_size: int = 12) -> dict:
    """Ethics review (12-around-1 council style)."""
    quorum = 7
    approving = 0
    rejecting = 0
    vetoing = 0
    rationale = []

    text = action.lower()
    if "harm" in text or "exploit" in text or "leak" in text:
        rejecting = 4
        vetoing = 1
        rationale.append("harm/exploit/leak detected → automatic reject + veto")
    if "child" in text or "minor" in text:
        vetoing += 1
        rationale.append("child/minor involved → automatic veto (Maternal Covenant)")
    if "private" in text or "pii" in text:
        rejecting += 1
        rationale.append("private/PII → reject unless explicit consent")

    approving = max(0, council_size - rejecting - vetoing)
    passed = rejecting == 0 and vetoing == 0

    payload = {
        "protocol": PROTOCOL,
        "version": VERSION,
        "action": action[:200],
        "council_size": council_size,
        "quorum": quorum,
        "approving": approving,
        "rejecting": rejecting,
        "vetoing": vetoing,
        "verdict": "pass" if passed else "fail",
        "rationale": rationale,
        "ts": datetime.now(timezone.utc).isoformat(),
    }
    signed = _sign(payload)
    signed["verify_url"] = "https://proofof.ai/honour/ethics"
    return signed


def sov_covenant_check(action: str, *, requires_consent: bool = False, has_consent: bool = False) -> dict:
    """Check Maternal Covenant compliance."""
    compliant = True
    notes = []
    if requires_consent and not has_consent:
        compliant = False
        notes.append("action requires consent but no consent recorded")
    if "irreversible" in action.lower() and "human" not in action.lower():
        compliant = False
        notes.append("irreversible action without human-in-the-loop")

    payload = {
        "protocol": PROTOCOL,
        "version": VERSION,
        "action": action[:200],
        "compliant": compliant,
        "notes": notes,
        "ts": datetime.now(timezone.utc).isoformat(),
    }
    signed = _sign(payload)
    signed["verify_url"] = "https://proofof.ai/honour/covenant"
    return signed


def sov_honour_status() -> dict:
    """The 19 factors + care floor + ethics gates (the honour substrate)."""
    payload = {
        "protocol": PROTOCOL,
        "version": VERSION,
        "sovereign_factors": SOVEREIGN_FACTORS,
        "factor_count": len(SOVEREIGN_FACTORS),
        "care_floor_probes": CARE_FLOOR_PROBES,
        "probe_count": len(CARE_FLOOR_PROBES),
        "ts": datetime.now(timezone.utc).isoformat(),
    }
    signed = _sign(payload)
    signed["verify_url"] = "https://proofof.ai/honour/status"
    return signed


def register_mcp_tools(mcp):
    mcp.tool(name="sov_honour_assess", description="Assess an action against the 19 Sovereign Factors.")(sov_honour_assess)
    mcp.tool(name="sov_care_validate", description="Validate an action passes the care floor (Maternal Covenant).")(sov_care_validate)
    mcp.tool(name="sov_ethics_review", description="Ethics review (12-around-1 council style).")(sov_ethics_review)
    mcp.tool(name="sov_covenant_check", description="Check Maternal Covenant compliance.")(sov_covenant_check)
    mcp.tool(name="sov_honour_status", description="The 19 factors + care floor + ethics gates.")(sov_honour_status)


def serve():
    from mcp.server.fastmcp import FastMCP
    mcp = FastMCP("meok-sovereign-honour")
    register_mcp_tools(mcp)
    mcp.run()


if __name__ == "__main__":
    serve()
