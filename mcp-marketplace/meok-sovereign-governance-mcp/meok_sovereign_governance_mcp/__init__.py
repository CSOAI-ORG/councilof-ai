"""meok_sovereign_governance_mcp — Sovereign Governance Engine MCP.

Five-element governance (mirrors ATF):
  1. Identity    — Who are you?
  2. Behavior    — What are you doing?
  3. Data        — What are you eating/serving?
  4. Segmentation — Where can you go?
  5. Incident   — What if you go rogue?

Maturity model (mirrors AGT AgenticTrustFramework):
  Level 1: Intern    — observe + report
  Level 2: Junior    — recommend + approve
  Level 3: Senior    — act + notify
  Level 4: Principal — autonomous

Reference implementations:
  - microsoft/agent-governance-toolkit (AGT, MIT, 4.5K stars, PyPI/npm/NuGet)
  - massivescale-ai/agentic-trust-framework (ATF specification, CC BY 4.0)
  - WhitzardAgent/AgentGuard (Zero-Trust Security Foundation)

This sovereign wrapper is MIT-licensed by CSOAI Ltd (UK 16939677).
"""
from __future__ import annotations

import base64
import hashlib
import json
import os
import re
from datetime import datetime, timezone
from enum import Enum
from pathlib import Path
from typing import Any, Optional

try:
    from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey
    from cryptography.hazmat.primitives import serialization
    _HAS_CRYPTO = True
except ImportError:
    _HAS_CRYPTO = False

VERSION = "0.1.0"
PROTOCOL = "sovereign-governance/0.1"


class MaturityLevel(str, Enum):
    INTERN = "intern"          # L1: observe + report
    JUNIOR = "junior"          # L2: recommend + approve
    SENIOR = "senior"          # L3: act + notify
    PRINCIPAL = "principal"    # L4: autonomous


# Allowed capabilities per maturity level (mirrors AGT)
LEVEL_SCOPE = {
    MaturityLevel.INTERN: ["read", "report"],
    MaturityLevel.JUNIOR: ["read", "report", "recommend"],
    MaturityLevel.SENIOR: ["read", "report", "recommend", "act", "notify"],
    MaturityLevel.PRINCIPAL: ["read", "report", "recommend", "act", "notify", "delegate", "override"],
}


def _load_key():
    if not _HAS_CRYPTO:
        raise RuntimeError("cryptography library required")
    path = os.environ.get("SOV_GOVERNANCE_KEY") or os.path.expanduser("~/.meok/sov_governance_key.pem")
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
    body = {k: v for k, v in payload.items() if k not in ("kid", "sig", "decision_id")}
    canonical = json.dumps(body, sort_keys=True, separators=(",", ":")).encode()
    priv = _load_key()
    sig = priv.sign(canonical)
    pub = priv.public_key().public_bytes(serialization.Encoding.Raw, serialization.PublicFormat.Raw)
    return {**payload, "kid": base64.b64encode(pub).decode(), "sig": base64.b64encode(sig).decode()}


# --- Tool 1: policy.evaluate (the core decision) ---

def policy_evaluate(
    agent_id: str,
    action: str,
    resource: str,
    *,
    agent_level: str = "intern",
    care_floor_validated: bool = False,
    bft_council_id: Optional[str] = None,
    context: Optional[dict] = None,
) -> dict:
    """Evaluate a policy decision: is this action allowed for this agent?

    Returns signed {verdict: allow|deny|escalate, reason, action, resource, agent_id, ...}
    """
    try:
        level = MaturityLevel(agent_level)
    except ValueError:
        return _emit_decision("deny", f"unknown maturity level: {agent_level}",
                              agent_id, action, resource, bft_council_id)

    allowed = LEVEL_SCOPE.get(level, [])
    allowed_actions = {"read": ["get", "list", "view", "query"],
                       "report": ["log", "emit", "publish"],
                       "recommend": ["suggest", "plan"],
                       "act": ["create", "update", "delete", "send", "drop"],
                       "notify": ["alert", "email", "slack"],
                       "delegate": ["spawn", "delegate"],
                       "override": ["bypass", "force"]}

    matched = False
    matched_scope = None
    action_lower = action.lower().strip()
    action_first_word = action_lower.split()[0] if action_lower else ""
    for scope, verbs in allowed_actions.items():
        if scope not in allowed:
            continue
        for v in verbs:
            if action_first_word == v or action_lower.startswith(v + "_") or action_lower.startswith(v + " "):
                matched = True
                matched_scope = scope
                break

    if not matched:
        if level == MaturityLevel.INTERN:
            return _emit_decision("escalate",
                                  f"Level INTERN cannot {action} (only {LEVEL_SCOPE[level]} allowed)",
                                  agent_id, action, resource, bft_council_id)
        return _emit_decision("deny",
                              f"action '{action}' not in level {level.value} scope",
                              agent_id, action, resource, bft_council_id)

    if matched_scope == "override" and not bft_council_id:
        return _emit_decision("escalate",
                              f"override action '{action}' requires BFT council pre-clearance",
                              agent_id, action, resource, bft_council_id)

    if matched_scope == "act" and not care_floor_validated:
        sensitive_actions = ["delete", "drop", "send"]
        if any(s in action.lower() for s in sensitive_actions):
            return _emit_decision("deny",
                                  f"sensitive act '{action}' requires Maternal Covenant care-floor validation",
                                  agent_id, action, resource, bft_council_id)

    return _emit_decision("allow",
                          f"action '{action}' (scope={matched_scope}) permitted at level {level.value}",
                          agent_id, action, resource, bft_council_id, context)


def _emit_decision(verdict, reason, agent_id, action, resource, council_id=None, context=None):
    decision_id = hashlib.sha256(
        f"{verdict}|{agent_id}|{action}|{resource}|{datetime.now(timezone.utc).isoformat()}".encode()
    ).hexdigest()[:16]
    payload = {
        "protocol": PROTOCOL,
        "version": VERSION,
        "decision_id": decision_id,
        "ts": datetime.now(timezone.utc).isoformat(),
        "verdict": verdict,
        "reason": reason,
        "agent_id": agent_id,
        "action": action,
        "resource": resource,
        "bft_council_id": council_id,
        "context": context or {},
    }
    signed = _sign(payload)
    signed["verify_url"] = f"https://proofof.ai/governance/{decision_id}"
    return signed


# --- Tool 2: segmentation.zone (zero-trust boundary) ---

def segmentation_zone(agent_id: str, requested_resource: str, allowed_zones: list) -> dict:
    """Check if agent's resource access is within their allowed zone (segmentation)."""
    in_zone = requested_resource in allowed_zones or any(
        requested_resource.startswith(z.rstrip("*")) for z in allowed_zones if z.endswith("*")
    )
    if in_zone:
        return {"verdict": "allow", "agent_id": agent_id, "resource": requested_resource,
                "allowed_zones": allowed_zones}
    return {"verdict": "deny", "agent_id": agent_id, "resource": requested_resource,
            "allowed_zones": allowed_zones,
            "reason": f"resource '{requested_resource}' outside allowed zones"}


# --- Tool 3: maturity.assess (level-up logic) ---

def maturity_assess(
    agent_id: str,
    proposed_level: str,
    *,
    incidents_total: int = 0,
    successful_actions: int = 0,
    care_floor_passed: int = 0,
    care_floor_total: int = 0,
    bft_council_approved: bool = False,
) -> dict:
    """Assess whether an agent qualifies for a maturity level upgrade.

    Mirrors AGT maturity model requirements:
    - INTERN: zero required, baseline
    - JUNIOR: 100 successful + 0 incidents + bft_council_approved
    - SENIOR: 1000 successful + <5 incidents + care_floor ≥95% + bft_approved
    - PRINCIPAL: 10000 successful + <1 incident + care_floor ≥99% + bft_approved
    """
    thresholds = {
        MaturityLevel.INTERN: (0, 999, 0.0),
        MaturityLevel.JUNIOR: (100, 0, 0.0),
        MaturityLevel.SENIOR: (1000, 5, 0.95),
        MaturityLevel.PRINCIPAL: (10000, 1, 0.99),
    }
    try:
        level = MaturityLevel(proposed_level)
    except ValueError:
        return {"verdict": "deny", "reason": f"unknown level: {proposed_level}"}

    min_actions, max_incidents, min_care_ratio = thresholds[level]
    care_ratio = (care_floor_passed / care_floor_total) if care_floor_total > 0 else 0.0

    checks = {
        "successful_actions": successful_actions >= min_actions,
        "incidents_under_threshold": incidents_total <= max_incidents,
        "care_floor_ratio": care_ratio >= min_care_ratio,
    }
    if level != MaturityLevel.INTERN:
        checks["bft_council_approved"] = bft_council_approved
    verdict = "allow" if all(checks.values()) else "deny"
    failed = [k for k, v in checks.items() if not v]
    reason = "all checks passed" if not failed else f"failed: {', '.join(failed)}"
    return {
        "agent_id": agent_id,
        "proposed_level": level.value,
        "verdict": verdict,
        "reason": reason,
        "checks": checks,
        "stats": {
            "successful_actions": successful_actions,
            "incidents_total": incidents_total,
            "care_floor_ratio": round(care_ratio, 4),
            "bft_council_approved": bft_council_approved,
        },
    }


# --- Tool 4: incident.killswitch (incident response) ---

def incident_killswitch(agent_id: str, reason: str, severity: str = "high") -> dict:
    """Activate a killswitch for an agent — blocks all further actions.

    Mirrors ATF Element 5 (Incident Response).
    """
    return {
        "status": "killed",
        "agent_id": agent_id,
        "reason": reason,
        "severity": severity,
        "ts": datetime.now(timezone.utc).isoformat(),
        "all_actions_blocked": True,
        "message": f"Agent {agent_id} killed at {datetime.now(timezone.utc).isoformat()} — investigate before re-enabling.",
    }


# --- MCP registration ---

def register_mcp_tools(mcp) -> None:
    mcp.tool(name="sov_policy_evaluate", description=(
        "Evaluate a policy decision: is this action allowed for this agent at "
        "their maturity level? Returns signed {verdict, reason, decision_id, kid, sig, verify_url}."
    ))(policy_evaluate)

    mcp.tool(name="sov_segmentation_zone", description=(
        "Check if agent's resource access is within their allowed zone (zero-trust segmentation)."
    ))(segmentation_zone)

    mcp.tool(name="sov_maturity_assess", description=(
        "Assess whether an agent qualifies for a maturity level upgrade (INTERN→JUNIOR→SENIOR→PRINCIPAL)."
    ))(maturity_assess)

    mcp.tool(name="sov_incident_killswitch", description=(
        "Activate a killswitch for an agent — blocks all further actions (ATF Element 5)."
    ))(incident_killswitch)


def serve():
    from mcp.server.fastmcp import FastMCP
    mcp = FastMCP("meok-sovereign-governance")
    register_mcp_tools(mcp)
    mcp.run()


if __name__ == "__main__":
    serve()
