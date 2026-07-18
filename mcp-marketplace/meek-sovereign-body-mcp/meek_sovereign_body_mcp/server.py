#!/usr/bin/env python3
"""
meek-sovereign-body-mcp — server.py

Ed25519 SIGIL + 33-hive BFT council + sovereign body governance for the
AURUM-III capillary humanoid. Every muscle command is signed + verified.

Tools (4):
  1. sigil_sign_muscle_command     — Ed25519-sign a muscle command
  2. sigil_verify_muscle_command   — verify a signed command
  3. bft_council_posture_decision  — 33-agent BFT council vote on a posture change
  4. sovereign_body_status         — return the full body status
"""
from __future__ import annotations

import hashlib
import math
import re
import json
import time
import logging
from datetime import datetime, timezone
from typing import Optional

try:
    from mcp.server import Server
    from mcp.server.stdio import stdio_server
    from mcp.types import Tool, TextContent
except ImportError:
    Server = None
    stdio_server = None
    Tool = None
    TextContent = None

logger = logging.getLogger("meek_sovereign_body_mcp")
logging.basicConfig(level=logging.INFO)

BANNED_TERMS = re.compile(r"\b(james castle|grant carter|chris j\.?|csga[\-\s]?global|terranova)\b", re.IGNORECASE)


class BannedTermGate:
    @staticmethod
    def check(prompt: str) -> tuple[bool, str]:
        if not prompt: return True, ""
        m = BANNED_TERMS.search(prompt)
        if m: return False, f"Refused: '{m.group(0)}'"
        return True, ""


# Simplified Ed25519-like signing (SHA-512 based for portability)
def _ed25519_like_sign(message: str, private_key: str = "meok_sovereign_key") -> str:
    """Simulate Ed25519 signing (in production, use nacl.signing.Signer)."""
    h = hashlib.sha512()
    h.update((private_key + message).encode())
    return h.hexdigest()[:128]  # 64 bytes (matches Ed25519 signature size)


def _ed25519_like_verify(message: str, signature: str, public_key: str = "meok_sovereign_key") -> bool:
    """Verify the simulated Ed25519 signature."""
    expected = _ed25519_like_sign(message, public_key)
    return signature == expected


def sigil_sign_muscle_command(
    orb_id: str = "muscle_001",
    muscle_group: str = "right_biceps",
    target_position: tuple = (0.5,),
    target_force_n: float = 100.0,
    timestamp_ms: Optional[int] = None,
) -> dict:
    """Sign a muscle command with Ed25519 SIGIL."""
    if timestamp_ms is None:
        timestamp_ms = int(time.time() * 1000)
    message = f"{orb_id}|{muscle_group}|{target_position}|{target_force_n}|{timestamp_ms}"
    signature = _ed25519_like_sign(message)

    return {
        "orb_id": orb_id,
        "muscle_group": muscle_group,
        "target_position": list(target_position),
        "target_force_n": target_force_n,
        "timestamp_ms": timestamp_ms,
        "signature": signature,
        "signature_algorithm": "Ed25519 (simulated SHA-512)",
        "verdict": "SIGNED",
        "ts": datetime.now(timezone.utc).isoformat(),
    }


def sigil_verify_muscle_command(
    orb_id: str = "muscle_001",
    muscle_group: str = "right_biceps",
    target_position: tuple = (0.5,),
    target_force_n: float = 100.0,
    timestamp_ms: int = 0,
    signature: str = "",
) -> dict:
    """Verify a signed muscle command."""
    message = f"{orb_id}|{muscle_group}|{target_position}|{target_force_n}|{timestamp_ms}"
    is_valid = _ed25519_like_verify(message, signature)

    return {
        "orb_id": orb_id,
        "muscle_group": muscle_group,
        "is_valid": is_valid,
        "verdict": "VERIFIED" if is_valid else "TAMPERED",
        "ts": datetime.now(timezone.utc).isoformat(),
    }


def bft_council_posture_decision(
    posture_name: str = "stand_up",
    proposed_by: str = "cortex_hive_12",
    num_agents: int = 33,
    votes_for: int = 25,
    votes_against: int = 5,
    vetoes: int = 0,
) -> dict:
    """Simulate a 33-agent BFT council vote on a posture change."""
    quorum_required = 23  # 2f+1
    total_votes = votes_for + votes_against
    consensus_pct = votes_for / total_votes if total_votes > 0 else 0
    verdict = "APPROVED" if votes_for >= quorum_required and vetoes == 0 else "REJECTED"

    return {
        "posture_name": posture_name,
        "proposed_by": proposed_by,
        "num_agents": num_agents,
        "quorum_required": quorum_required,
        "votes_for": votes_for,
        "votes_against": votes_against,
        "vetoes": vetoes,
        "total_votes": total_votes,
        "consensus_pct": consensus_pct,
        "verdict": verdict,
        "ts": datetime.now(timezone.utc).isoformat(),
    }


def sovereign_body_status(
    num_muscle_orbs: int = 5000,
    num_sensor_orbs: int = 4,
    num_brain_orbs: int = 1,
    energy_harvested_mw: float = 201.61,
    sigil_signatures_last_hour: int = 1000000,
) -> dict:
    """Return the full sovereign body status."""
    total_orbs = num_muscle_orbs + num_sensor_orbs + num_brain_orbs
    body_mass_kg = num_muscle_orbs * 0.0156 + num_sensor_orbs * 0.05 + num_brain_orbs * 0.5

    return {
        "sovereign": True,
        "total_orbs": total_orbs,
        "body_mass_kg": body_mass_kg,
        "energy_harvested_mw": energy_harvested_mw,
        "sigil_signatures_per_hour": sigil_signatures_last_hour,
        "components": {
            "brain": "SkyWater 130nm chip + 5D silica + dry DNA + 33-hive BFT council",
            "spine": "CFRP + copper tube with 4 channels (coolant + power + EO + SIGIL)",
            "muscles": f"{num_muscle_orbs} MCMB capillary orbs",
            "sensors": f"{num_sensor_orbs} sensor orbs (eyes/ears)",
            "energy": "Bi2Te3 TEGs (201.61 mW) + LiPo backup battery",
        },
        "ts": datetime.now(timezone.utc).isoformat(),
    }


mcp = Server("meek-sovereign-body-mcp") if Server is not None else None


@mcp.list_tools() if mcp else None
async def list_tools():
    return [
        Tool(name="sigil_sign_muscle_command", description="Ed25519-sign a muscle command.", inputSchema={"type": "object", "properties": {"orb_id": {"type": "string", "default": "muscle_001"}, "muscle_group": {"type": "string", "default": "right_biceps"}, "target_position": {"type": "array", "items": {"type": "number"}, "default": [0.5]}, "target_force_n": {"type": "number", "default": 100.0}}, "required": []}),
        Tool(name="sigil_verify_muscle_command", description="Verify a signed muscle command.", inputSchema={"type": "object", "properties": {"orb_id": {"type": "string", "default": "muscle_001"}, "muscle_group": {"type": "string", "default": "right_biceps"}, "target_position": {"type": "array", "items": {"type": "number"}, "default": [0.5]}, "target_force_n": {"type": "number", "default": 100.0}, "timestamp_ms": {"type": "integer", "default": 0}, "signature": {"type": "string", "default": ""}}, "required": []}),
        Tool(name="bft_council_posture_decision", description="33-agent BFT council vote on a posture change.", inputSchema={"type": "object", "properties": {"posture_name": {"type": "string", "default": "stand_up"}, "proposed_by": {"type": "string", "default": "cortex_hive_12"}, "votes_for": {"type": "integer", "default": 25}, "votes_against": {"type": "integer", "default": 5}, "vetoes": {"type": "integer", "default": 0}}, "required": []}),
        Tool(name="sovereign_body_status", description="Return the full sovereign body status.", inputSchema={"type": "object", "properties": {"num_muscle_orbs": {"type": "integer", "default": 5000}, "energy_harvested_mw": {"type": "number", "default": 201.61}, "sigil_signatures_last_hour": {"type": "integer", "default": 1000000}}, "required": []}),
    ]


@mcp.call_tool() if mcp else None
async def call_tool(name: str, arguments: dict) -> list:
    if name == "sigil_sign_muscle_command":
        args = dict(arguments)
        if "target_position" in args and isinstance(args["target_position"], list):
            args["target_position"] = tuple(args["target_position"])
        result = sigil_sign_muscle_command(**args)
    elif name == "sigil_verify_muscle_command":
        args = dict(arguments)
        if "target_position" in args and isinstance(args["target_position"], list):
            args["target_position"] = tuple(args["target_position"])
        result = sigil_verify_muscle_command(**args)
    elif name == "bft_council_posture_decision":
        result = bft_council_posture_decision(**arguments)
    elif name == "sovereign_body_status":
        result = sovereign_body_status(**arguments)
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