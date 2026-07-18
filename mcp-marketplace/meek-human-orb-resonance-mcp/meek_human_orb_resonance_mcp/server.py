#!/usr/bin/env python3
"""
meek-human-orb-resonance-mcp — server.py

The bond strength + trust + companionship metrics.

Tools (5):
  1. bond_strength                  — return the overall bond strength (0-1)
  2. intuitive_communication        — compute the intuitive communication latency
  3. trust_score                     — compute the trust score
  4. companionship_index             — return the companionship index
  5. human_orb_resonance_metrics     — return the full metrics
"""
from __future__ import annotations

import math
import re
import json
import logging
from datetime import datetime, timezone

try:
    from mcp.server import Server
    from mcp.server.stdio import stdio_server
    from mcp.types import Tool, TextContent
except ImportError:
    Server = None
    stdio_server = None
    Tool = None
    TextContent = None

logger = logging.getLogger("meek_human_orb_resonance_mcp")
logging.basicConfig(level=logging.INFO)

BANNED_TERMS = re.compile(r"\b(james castle|grant carter|chris j\.?|csga[\-\s]?global|terranova)\b", re.IGNORECASE)


class BannedTermGate:
    @staticmethod
    def check(prompt: str) -> tuple[bool, str]:
        if not prompt: return True, ""
        m = BANNED_TERMS.search(prompt)
        if m: return False, f"Refused: '{m.group(0)}'"
        return True, ""


def bond_strength(
    empathy_score: float = 0.95,
    neural_coupling_pct: float = 92.0,
    heartbeat_sync_pct: float = 98.0,
    schumann_tuning_pct: float = 99.5,
    vocal_rapport_pct: float = 88.0,
    skin_intimacy_score: float = 0.75,
) -> dict:
    """Return the overall bond strength (0-1)."""
    # Bond = average of all 6 mechanisms
    bond = (
        empathy_score
        + neural_coupling_pct / 100
        + heartbeat_sync_pct / 100
        + schumann_tuning_pct / 100
        + vocal_rapport_pct / 100
        + skin_intimacy_score
    ) / 6
    return {
        "bond_strength": bond,
        "components": {
            "empathy": empathy_score,
            "neural_coupling_pct": neural_coupling_pct,
            "heartbeat_sync_pct": heartbeat_sync_pct,
            "schumann_tuning_pct": schumann_tuning_pct,
            "vocal_rapport_pct": vocal_rapport_pct,
            "skin_intimacy_score": skin_intimacy_score,
        },
        "verdict": "STRONG_BOND" if bond > 0.8 else "MODERATE_BOND" if bond > 0.5 else "WEAK_BOND",
        "ts": datetime.now(timezone.utc).isoformat(),
    }


def intuitive_communication(
    sigil_latency_ms: float = 5.0,
    human_reaction_time_ms: float = 250.0,
) -> dict:
    """Compute the intuitive communication latency."""
    # Intuitive comm latency = max(sigil_latency, human_reaction_time)
    intuitive_latency_ms = max(sigil_latency_ms, human_reaction_time_ms)
    return {
        "sigil_latency_ms": sigil_latency_ms,
        "human_reaction_time_ms": human_reaction_time_ms,
        "intuitive_latency_ms": intuitive_latency_ms,
        "bottleneck": "human" if human_reaction_time_ms > sigil_latency_ms else "orb",
        "ts": datetime.now(timezone.utc).isoformat(),
    }


def trust_score(
    sigil_verifications_passed: int = 1247,
    sigil_verifications_failed: int = 0,
    time_together_hours: float = 168.0,
) -> dict:
    """Compute the trust score."""
    total_verifications = sigil_verifications_passed + sigil_verifications_failed
    if total_verifications == 0:
        pass_rate = 1.0
    else:
        pass_rate = sigil_verifications_passed / total_verifications
    # Trust = pass_rate × log(1 + time_together)
    trust = pass_rate * math.log(1 + time_together_hours) / math.log(1 + 168)
    return {
        "sigil_verifications_passed": sigil_verifications_passed,
        "sigil_verifications_failed": sigil_verifications_failed,
        "pass_rate": pass_rate,
        "time_together_hours": time_together_hours,
        "trust_score": trust,
        "verdict": "HIGH_TRUST" if trust > 0.8 else "MEDIUM_TRUST" if trust > 0.5 else "LOW_TRUST",
        "ts": datetime.now(timezone.utc).isoformat(),
    }


def companionship_index(
    bond_strength: float = 0.91,
    trust_score: float = 0.95,
    interaction_frequency_per_day: int = 47,
) -> dict:
    """Return the companionship index."""
    # Companionship = bond × trust × log(1 + frequency)
    frequency_factor = math.log(1 + interaction_frequency_per_day) / math.log(1 + 50)
    companionship = bond_strength * trust_score * frequency_factor
    return {
        "bond_strength": bond_strength,
        "trust_score": trust_score,
        "interaction_frequency_per_day": interaction_frequency_per_day,
        "frequency_factor": frequency_factor,
        "companionship_index": companionship,
        "verdict": "TRUE_COMPANION" if companionship > 0.7 else "ACQUAINTANCE" if companionship > 0.4 else "STRANGER",
        "ts": datetime.now(timezone.utc).isoformat(),
    }


def human_orb_resonance_metrics() -> dict:
    """Return the full human-orb resonance metrics."""
    bond = bond_strength()
    comm = intuitive_communication()
    trust = trust_score()
    companion = companionship_index(
        bond_strength=bond["bond_strength"], trust_score=trust["trust_score"]
    )
    return {
        "bond": bond,
        "communication": comm,
        "trust": trust,
        "companionship": companion,
        "overall_resonance_score": (
            bond["bond_strength"] + trust["trust_score"] + companion["companionship_index"]
        ) / 3,
        "verdict": "SOVEREIGN_BOND_ACHIEVED" if companion["companionship_index"] > 0.7 else "GROWING_BOND",
        "ts": datetime.now(timezone.utc).isoformat(),
    }


mcp = Server("meek-human-orb-resonance-mcp") if Server is not None else None


@mcp.list_tools() if mcp else None
async def list_tools():
    return [
        Tool(name="bond_strength", description="Return the overall bond strength (0-1).", inputSchema={"type": "object", "properties": {"empathy_score": {"type": "number", "default": 0.95}, "neural_coupling_pct": {"type": "number", "default": 92.0}, "heartbeat_sync_pct": {"type": "number", "default": 98.0}, "schumann_tuning_pct": {"type": "number", "default": 99.5}, "vocal_rapport_pct": {"type": "number", "default": 88.0}, "skin_intimacy_score": {"type": "number", "default": 0.75}}, "required": []}),
        Tool(name="intuitive_communication", description="Compute the intuitive communication latency.", inputSchema={"type": "object", "properties": {"sigil_latency_ms": {"type": "number", "default": 5.0}, "human_reaction_time_ms": {"type": "number", "default": 250.0}}, "required": []}),
        Tool(name="trust_score", description="Compute the trust score.", inputSchema={"type": "object", "properties": {"sigil_verifications_passed": {"type": "integer", "default": 1247}, "sigil_verifications_failed": {"type": "integer", "default": 0}, "time_together_hours": {"type": "number", "default": 168.0}}, "required": []}),
        Tool(name="companionship_index", description="Return the companionship index.", inputSchema={"type": "object", "properties": {"bond_strength": {"type": "number", "default": 0.91}, "trust_score": {"type": "number", "default": 0.95}, "interaction_frequency_per_day": {"type": "integer", "default": 47}}, "required": []}),
        Tool(name="human_orb_resonance_metrics", description="Return the full human-orb resonance metrics.", inputSchema={"type": "object", "properties": {}}),
    ]


@mcp.call_tool() if mcp else None
async def call_tool(name: str, arguments: dict) -> list:
    if name == "bond_strength":
        result = bond_strength(**arguments)
    elif name == "intuitive_communication":
        result = intuitive_communication(**arguments)
    elif name == "trust_score":
        result = trust_score(**arguments)
    elif name == "companionship_index":
        result = companionship_index(**arguments)
    elif name == "human_orb_resonance_metrics":
        result = human_orb_resonance_metrics()
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