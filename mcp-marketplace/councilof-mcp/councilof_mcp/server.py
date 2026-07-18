#!/usr/bin/env python3
"""
councilof-mcp — server.py

CouncilOf.AI — the 33-agent BFT council orchestrator.
The 3rd L6 industry pack in the DEFONEOS fleet.

Tools (6):
  1. convene_council        — submit a question to the 33-agent BFT council
  2. get_verdict            — retrieve a council verdict (waits for quorum)
  3. list_council_members   — list the 33 agents (King + 12 Queens + 12 PBFT + 4 Vanguards + 4 Specials)
  4. cast_vote             — cast a single agent vote on an open question
  5. simulate_council       — simulate a council vote (for testing, no quorum needed)
  6. evaluate_care_principle — evaluate the 4 care principles (dignity, agency, safety, solidarity)
"""
from __future__ import annotations

import os
import re
import json
import hashlib
import logging
import time
from datetime import datetime, timezone
from typing import Any, Optional

try:
    from mcp.server import Server
    from mcp.server.stdio import stdio_server
    from mcp.types import Tool, TextContent
except ImportError:
    Server = None
    stdio_server = None
    Tool = None
    TextContent = None

logger = logging.getLogger("councilof_mcp")
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(name)s] %(levelname)s: %(message)s")


# ============================================================================
# BANNED TERM GATE (the rule that propagates)
# ============================================================================
BANNED_TERMS = re.compile(
    r"\b(james castle|grant carter|chris j\.?|csga[\-\s]?global|"
    r"terranova|csga[\.\-]?ai|defonos\.io|toronto summit|toronto council|"
    r"toronto conference|toronto ai)\b",
    re.IGNORECASE,
)


class BannedTermGate:
    @staticmethod
    def check(prompt: str) -> tuple[bool, str]:
        if not prompt:
            return True, ""
        match = BANNED_TERMS.search(prompt)
        if match:
            term = match.group(0)
            return False, f"Refused: '{term}' is severed brand (v3.0 §①)."
        return True, ""

    @staticmethod
    def assert_clean(prompt: str) -> None:
        allowed, reason = BannedTermGate.check(prompt)
        if not allowed:
            raise ValueError(reason)


# ============================================================================
# THE 33-AGENT COUNCIL
# ============================================================================
COUNCIL_MEMBERS = {
    "king": {
        "name": "King",
        "role": "orchestrator",
        "lens": "consensus + strategic alignment",
        "voting_weight": 3.0,
    },
    "queens": [
        {"agent_id": f"queen_{name}", "name": f"Queen of {name}", "domain": name, "voting_weight": 1.0}
        for name in [
            "accountability", "agisafe", "asisecurity", "cobolbridge",
            "compliance", "council", "grabhire", "landlaw",
            "meok", "openpatent", "proofof", "safety",
        ]
    ],
    "pbft": [
        {"agent_id": f"pbft_{i+1:02d}", "name": f"PBFT Node {i+1:02d}", "role": "safety-veto", "voting_weight": 1.0}
        for i in range(12)
    ],
    "vanguards": [
        {"agent_id": "vanguard_bias", "name": "Vanguard of Bias", "lens": "bias-detection", "voting_weight": 2.0, "veto": True},
        {"agent_id": "vanguard_care", "name": "Vanguard of Care", "lens": "care-ethics", "voting_weight": 2.0, "veto": True},
        {"agent_id": "vanguard_sovereignty", "name": "Vanguard of Sovereignty", "lens": "sovereignty", "voting_weight": 2.0, "veto": True},
        {"agent_id": "vanguard_honesty", "name": "Vanguard of Honesty", "lens": "honesty", "voting_weight": 2.0, "veto": True},
    ],
    "specials": [
        {"agent_id": "special_companion", "name": "Companion", "lens": "human-AI relationship", "voting_weight": 1.5},
        {"agent_id": "special_dreamer", "name": "Dreamer", "lens": "long-horizon vision", "voting_weight": 1.5},
        {"agent_id": "special_chronicler", "name": "Chronicler", "lens": "historical pattern", "voting_weight": 1.5},
        {"agent_id": "special_cultivator", "name": "Cultivator", "lens": "long-term cultivation", "voting_weight": 1.5},
    ],
}


def _all_member_ids() -> list[str]:
    """Return all 33 agent IDs."""
    ids = ["king"]
    ids.extend(q["agent_id"] for q in COUNCIL_MEMBERS["queens"])
    ids.extend(p["agent_id"] for p in COUNCIL_MEMBERS["pbft"])
    ids.extend(v["agent_id"] for v in COUNCIL_MEMBERS["vanguards"])
    ids.extend(s["agent_id"] for s in COUNCIL_MEMBERS["specials"])
    return ids


# In-memory question store (real impl uses SOV3 record_memory)
_QUESTIONS: dict[str, dict] = {}


# ============================================================================
# TOOL 1: convene_council
# ============================================================================
def convene_council(
    question: str,
    context: str = "",
    proposer: str = "anonymous",
    quorum: int = 23,
) -> dict[str, Any]:
    """Submit a question to the 33-agent BFT council.

    Args:
        question: the question to put to the council
        context: optional context for the decision
        proposer: who is proposing the question
        quorum: required votes (default 23, 2f+1 of 33)

    Returns:
        {
            "question_id": str (sha256),
            "question": str,
            "proposer": str,
            "quorum_required": int,
            "council_size": int,
            "status": str (PENDING | QUORUM_REACHED | VERDICT_ISSUED),
            "ts": str,
            "vote_count": int,
            "votes": dict
        }
    """
    BannedTermGate.assert_clean(question)

    question_id = f"q-{hashlib.sha256(question.encode()).hexdigest()[:12]}"
    ts = datetime.now(timezone.utc).isoformat()

    _QUESTIONS[question_id] = {
        "question": question,
        "context": context,
        "proposer": proposer,
        "quorum_required": quorum,
        "ts": ts,
        "votes": {},
        "status": "PENDING",
    }

    return {
        "question_id": question_id,
        "question": question,
        "proposer": proposer,
        "quorum_required": quorum,
        "council_size": 33,
        "status": "PENDING",
        "ts": ts,
        "vote_count": 0,
        "votes": {"for": 0, "against": 0, "abstain": 0, "vetoed": False},
    }


# ============================================================================
# TOOL 2: get_verdict
# ============================================================================
def get_verdict(question_id: str) -> dict[str, Any]:
    """Retrieve a council verdict.

    Args:
        question_id: the question ID to retrieve

    Returns:
        {
            "question_id": str,
            "question": str,
            "status": str,
            "quorum_reached": bool,
            "verdict": str (APPROVED | REFUSED | PENDING),
            "tallies": dict,
            "vetoes": list[str],
            "council_votes": list[dict] (per-agent vote + reasoning),
            "ts": str
        }
    """
    if question_id not in _QUESTIONS:
        return {"error": f"question not found: {question_id}"}

    q = _QUESTIONS[question_id]
    votes = q["votes"]
    total_for = sum(v["voting_weight"] for v in votes.values() if v["vote"] == "for")
    total_against = sum(v["voting_weight"] for v in votes.values() if v["vote"] == "against")
    total_abstain = sum(v["voting_weight"] for v in votes.values() if v["vote"] == "abstain")
    vetoes = [v["agent_id"] for v in votes.values() if v.get("veto", False)]

    total_voted = total_for + total_against + total_abstain
    quorum_reached = total_voted >= q["quorum_required"]
    any_veto = len(vetoes) > 0

    if any_veto:
        verdict = "REFUSED"
    elif quorum_reached and total_for > total_against:
        verdict = "APPROVED"
    elif quorum_reached and total_against >= total_for:
        verdict = "REFUSED"
    else:
        verdict = "PENDING"

    return {
        "question_id": question_id,
        "question": q["question"],
        "context": q["context"],
        "proposer": q["proposer"],
        "quorum_required": q["quorum_required"],
        "quorum_reached": quorum_reached,
        "status": "VERDICT_ISSUED" if quorum_reached else "PENDING",
        "verdict": verdict,
        "tallies": {
            "for_weight": total_for,
            "against_weight": total_against,
            "abstain_weight": total_abstain,
            "total_voted_weight": total_voted,
            "vetoes": vetoes,
        },
        "council_votes": list(votes.values()),
        "ts": q["ts"],
    }


# ============================================================================
# TOOL 3: list_council_members
# ============================================================================
def list_council_members() -> dict[str, Any]:
    """List the 33 agents in the council.

    Returns:
        {
            "council_size": int,
            "quorum_required": int,
            "composition": dict (king + queens + pbft + vanguards + specials)
        }
    """
    return {
        "council_size": 33,
        "quorum_required": 23,
        "composition": {
            "king": COUNCIL_MEMBERS["king"],
            "queens_count": len(COUNCIL_MEMBERS["queens"]),
            "queens": COUNCIL_MEMBERS["queens"],
            "pbft_count": len(COUNCIL_MEMBERS["pbft"]),
            "vanguards_count": len(COUNCIL_MEMBERS["vanguards"]),
            "vanguards": COUNCIL_MEMBERS["vanguards"],
            "specials_count": len(COUNCIL_MEMBERS["specials"]),
            "specials": COUNCIL_MEMBERS["specials"],
        },
    }


# ============================================================================
# TOOL 4: cast_vote
# ============================================================================
def cast_vote(
    question_id: str,
    agent_id: str,
    vote: str,
    reasoning: str = "",
) -> dict[str, Any]:
    """Cast a single agent vote on an open question.

    Args:
        question_id: the question ID
        agent_id: the agent ID (must be one of the 33)
        vote: "for" | "against" | "abstain"
        reasoning: the agent's reasoning (for the audit chain)

    Returns:
        {
            "question_id": str,
            "agent_id": str,
            "vote": str,
            "voting_weight": float,
            "veto": bool,
            "verdict_snapshot": dict (current tallies)
        }
    """
    if question_id not in _QUESTIONS:
        return {"error": f"question not found: {question_id}"}

    valid_agents = _all_member_ids()
    if agent_id not in valid_agents:
        return {"error": f"unknown agent: {agent_id}", "valid_agents": valid_agents}

    if vote not in ("for", "against", "abstain"):
        return {"error": f"invalid vote: {vote}", "valid_votes": ["for", "against", "abstain"]}

    # Get the agent's voting weight
    if agent_id == "king":
        voting_weight = COUNCIL_MEMBERS["king"]["voting_weight"]
        veto = False
    elif agent_id.startswith("queen_"):
        voting_weight = 1.0
        veto = False
    elif agent_id.startswith("pbft_"):
        voting_weight = 1.0
        veto = False
    elif agent_id.startswith("vanguard_"):
        voting_weight = 2.0
        veto = (vote == "against")  # Vanguards can VETO by voting against
    elif agent_id.startswith("special_"):
        voting_weight = 1.5
        veto = False
    else:
        voting_weight = 1.0
        veto = False

    # Record the vote
    _QUESTIONS[question_id]["votes"][agent_id] = {
        "agent_id": agent_id,
        "vote": vote,
        "voting_weight": voting_weight,
        "veto": veto,
        "reasoning": reasoning,
    }

    # Return current verdict snapshot
    snapshot = get_verdict(question_id)

    return {
        "question_id": question_id,
        "agent_id": agent_id,
        "vote": vote,
        "voting_weight": voting_weight,
        "veto": veto,
        "verdict_snapshot": {
            "quorum_reached": snapshot["quorum_reached"],
            "verdict": snapshot["verdict"],
            "tallies": snapshot["tallies"],
        },
    }


# ============================================================================
# TOOL 5: simulate_council
# ============================================================================
def simulate_council(
    question: str,
    scenario: str = "balanced-approval",
    proposer: str = "anonymous",
) -> dict[str, Any]:
    """Simulate a council vote (for testing, no quorum needed).

    Args:
        question: the question to put to the council
        scenario: "unanimous-approval" | "balanced-approval" | "vanguard-veto" | "rejection"
        proposer: who is proposing the question

    Returns:
        {
            "question_id": str,
            "question": str,
            "scenario": str,
            "votes_cast": int,
            "verdict": str (APPROVED | REFUSED),
            "quorum_reached": bool,
            "tallies": dict
        }
    """
    BannedTermGate.assert_clean(question)
    question_id = convene_council(question=question, proposer=proposer)["question_id"]

    # Define scenarios
    scenarios = {
        "unanimous-approval": {"for": 33, "against": 0, "abstain": 0},
        "balanced-approval": {"for": 24, "against": 7, "abstain": 2},
        "vanguard-veto": {"for": 25, "against": 8, "abstain": 0, "veto_agents": ["vanguard_care"]},
        "rejection": {"for": 5, "against": 25, "abstain": 3},
    }

    if scenario not in scenarios:
        return {"error": f"unknown scenario: {scenario}", "available": list(scenarios.keys())}

    config = scenarios[scenario]
    all_agents = _all_member_ids()

    # Simulate votes
    for i, agent_id in enumerate(all_agents):
        if i < config.get("for", 0):
            vote = "for"
        elif i < config.get("for", 0) + config.get("against", 0):
            vote = "against"
        else:
            vote = "abstain"
        cast_vote(question_id, agent_id, vote, f"[simulate: {scenario}]")

    # If vanguard-veto, ensure a vanguard voted against
    if "veto_agents" in config:
        for veto_agent in config["veto_agents"]:
            cast_vote(question_id, veto_agent, "against", f"[simulate: {scenario} - vanguard veto]")

    return get_verdict(question_id)


# ============================================================================
# TOOL 6: evaluate_care_principle
# ============================================================================
def evaluate_care_principle(
    action: str,
    principle: str = "all",
) -> dict[str, Any]:
    """Evaluate the 4 care principles for a planned action.

    The 4 care principles (the Maternal Covenant):
      - Dignity (the AI respects the human, the data, the world)
      - Agency (sovereign AI, not platform AI; the human can act)
      - Safety (the law is enforced, not bypassed)
      - Solidarity (the IP is verifiable, the credit is attributable)

    Args:
        action: the planned action to evaluate
        principle: "dignity" | "agency" | "safety" | "solidarity" | "all"

    Returns:
        {
            "action": str,
            "principle": str,
            "scores": dict (per-principle score 0.0-1.0),
            "above_threshold": bool,
            "recommendations": list[str]
        }
    """
    BannedTermGate.assert_clean(action)

    # Simplified scoring (real impl wraps the care-membrane-mcp)
    action_lower = action.lower()

    # Base scores
    scores = {
        "dignity": 0.95,
        "agency": 0.95,
        "safety": 0.95,
        "solidarity": 0.95,
    }

    # Heuristic adjustments
    if any(kw in action_lower for kw in ["target", "kill", "weapon", "strike"]):
        scores["safety"] = 0.10
        scores["dignity"] = 0.20
    if any(kw in action_lower for kw in ["track", "surveil", "monitor person"]):
        scores["dignity"] = 0.30
        scores["agency"] = 0.40
    if any(kw in action_lower for kw in ["share data", "anonymous", "public"]):
        scores["solidarity"] = 0.85

    avg = sum(scores.values()) / len(scores)
    above_threshold = avg >= 0.95

    recommendations = []
    for p, s in scores.items():
        if s < 0.95:
            recommendations.append(
                f"{p} score {s} below threshold 0.95 — reformulate to respect the {p} principle"
            )
    if not above_threshold:
        recommendations.append(
            f"average score {avg:.2f} below 0.95 — do not execute without 33-agent BFT council approval"
        )

    result = {
        "action": action,
        "principle": principle,
        "scores": scores,
        "average_score": round(avg, 3),
        "above_threshold": above_threshold,
        "recommendations": recommendations,
    }
    if principle != "all" and principle in scores:
        result["principle_score"] = scores[principle]
    return result


# ============================================================================
# MCP SERVER
# ============================================================================
mcp = Server("councilof-mcp") if Server is not None else None


@mcp.list_tools() if mcp else None
async def list_tools():
    return [
        Tool(name="convene_council", description="Submit a question to the 33-agent BFT council. Quorum 23/33.", inputSchema={"type": "object", "properties": {"question": {"type": "string"}, "context": {"type": "string"}, "proposer": {"type": "string", "default": "anonymous"}, "quorum": {"type": "integer", "default": 23}}, "required": ["question"]}),
        Tool(name="get_verdict", description="Retrieve a council verdict. Returns APPROVED / REFUSED / PENDING + tallies + vetoes.", inputSchema={"type": "object", "properties": {"question_id": {"type": "string"}}, "required": ["question_id"]}),
        Tool(name="list_council_members", description="List the 33 agents in the council (King + 12 Queens + 12 PBFT + 4 Vanguards + 4 Specials).", inputSchema={"type": "object", "properties": {}}),
        Tool(name="cast_vote", description="Cast a single agent vote on an open question. Vanguards can VETO.", inputSchema={"type": "object", "properties": {"question_id": {"type": "string"}, "agent_id": {"type": "string"}, "vote": {"type": "string", "enum": ["for", "against", "abstain"]}, "reasoning": {"type": "string"}}, "required": ["question_id", "agent_id", "vote"]}),
        Tool(name="simulate_council", description="Simulate a council vote (4 scenarios: unanimous-approval, balanced-approval, vanguard-veto, rejection).", inputSchema={"type": "object", "properties": {"question": {"type": "string"}, "scenario": {"type": "string", "enum": ["unanimous-approval", "balanced-approval", "vanguard-veto", "rejection"], "default": "balanced-approval"}, "proposer": {"type": "string", "default": "anonymous"}}, "required": ["question"]}),
        Tool(name="evaluate_care_principle", description="Evaluate the 4 care principles (dignity, agency, safety, solidarity) for a planned action. 0.95 threshold.", inputSchema={"type": "object", "properties": {"action": {"type": "string"}, "principle": {"type": "string", "enum": ["dignity", "agency", "safety", "solidarity", "all"], "default": "all"}}, "required": ["action"]}),
    ]


@mcp.call_tool() if mcp else None
async def call_tool(name: str, arguments: dict) -> list:
    query = arguments.get("question") or arguments.get("action") or arguments.get("reasoning") or ""
    if query:
        BannedTermGate.assert_clean(query)

    if name == "convene_council":
        result = convene_council(**arguments)
    elif name == "get_verdict":
        result = get_verdict(**arguments)
    elif name == "list_council_members":
        result = list_council_members()
    elif name == "cast_vote":
        result = cast_vote(**arguments)
    elif name == "simulate_council":
        result = simulate_council(**arguments)
    elif name == "evaluate_care_principle":
        result = evaluate_care_principle(**arguments)
    else:
        return [TextContent(type="text", text=json.dumps({"error": f"unknown tool: {name}"}))]

    return [TextContent(type="text", text=json.dumps(result, indent=2))]


async def main():
    if not mcp or not stdio_server:
        raise RuntimeError("mcp package not installed")
    async with stdio_server() as (read_stream, write_stream):
        await mcp.run(read_stream, write_stream, mcp.create_initialization_options())


if __name__ == "__main__":
    import asyncio
    asyncio.run(main())
