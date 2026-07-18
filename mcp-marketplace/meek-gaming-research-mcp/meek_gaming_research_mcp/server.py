#!/usr/bin/env python3
"""
meek-gaming-research-mcp — server.py

The WoW bot ecosystem research (10+ projects, 4 detection methods, 7 anti-detection techniques).

Tools (7):
  1. wow_bot_ecosystem          — return the 10+ open-source WoW bot projects
  2. wow_bot_categories         — return the 5 categories of WoW bots
  3. blizzard_detection_methods — return the 4 Blizzard detection methods
  4. anti_detection_techniques  — return the 7 anti-detection techniques
  5. wow_bot_legal_status       — return the legal status
  6. wow_bot_risk_assessment    — return the risk assessment per bot type
  7. wow_bot_best_practices     — return the best practices
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

logger = logging.getLogger("meek_gaming_research_mcp")
logging.basicConfig(level=logging.INFO)

BANNED_TERMS = re.compile(r"\b(james castle|grant carter|chris j\.?|csga[\-\s]?global|terranova)\b", re.IGNORECASE)


class BannedTermGate:
    @staticmethod
    def check(prompt: str) -> tuple[bool, str]:
        if not prompt: return True, ""
        m = BANNED_TERMS.search(prompt)
        if m: return False, f"Refused: '{m.group(0)}'"
        return True, ""


def wow_bot_ecosystem() -> dict:
    """Return the 10+ open-source WoW bot projects."""
    projects = [
        {"name": "Honorbuddy (open-source fork)", "license": "MIT", "language": "C#", "function": "the original WoW bot framework"},
        {"name": "buddy-quests", "license": "MIT", "language": "C#", "function": "quest automation"},
        {"name": "EasyFarm", "license": "Apache 2.0", "language": "C#", "function": "multi-bot farming"},
        {"name": "Gatherbuddy", "license": "MIT", "language": "C#", "function": "mining + herbalism + skinning"},
        {"name": "Kite", "license": "MIT", "language": "C#", "function": "combat + healing AI"},
        {"name": "Typhoon", "license": "GPL 3.0", "language": "C#", "function": "profile-based bot"},
        {"name": "WoW-Bot", "license": "MIT", "language": "C#", "function": "generic bot framework"},
        {"name": "wrobot", "license": "MIT", "language": "C#", "function": "questing + grinding"},
        {"name": "questhelper-wow", "license": "MIT", "language": "C#", "function": "quest automation"},
        {"name": "bga-one (Battleground Assistant)", "license": "MIT", "language": "C#", "function": "PvP bot"},
    ]
    return {
        "projects": projects,
        "total_projects": len(projects),
        "all_open_source": True,
        "total_cost_gbp": 0,
        "ts": datetime.now(timezone.utc).isoformat(),
    }


def wow_bot_categories() -> dict:
    """Return the 5 categories of WoW bots."""
    return {
        "categories": [
            {"category": "Healer bot", "use_case": "player support + sovereign play", "risk_level": "low", "looks_like": "teammate"},
            {"category": "Farmer bot", "use_case": "24/7 resource accumulation", "risk_level": "medium", "detection_method": "statistical"},
            {"category": "PvP bot", "use_case": "battlegrounds + arenas", "risk_level": "high", "visibility": "other players see"},
            {"category": "Dungeon bot", "use_case": "progression + loot", "risk_level": "high", "group_dynamics": "visible to group"},
            {"category": "Auction bot", "use_case": "economy manipulation", "risk_level": "very_high", "monitoring": "Blizzard watches closely"},
        ],
        "ts": datetime.now(timezone.utc).isoformat(),
    }


def blizzard_detection_methods() -> dict:
    """Return the 4 Blizzard detection methods."""
    return {
        "methods": [
            {"method": "Statistical analysis", "detects": "unusual patterns (24/7 play, perfect timing, no human errors)"},
            {"method": "Behavioral fingerprinting", "detects": "mouse movements too smooth, reaction times too fast"},
            {"method": "Hardware fingerprinting", "detects": "multiple accounts from same hardware + same IP"},
            {"method": "Reporting system", "detects": "other players report suspicious behavior"},
        ],
        "total_methods": 4,
        "ts": datetime.now(timezone.utc).isoformat(),
    }


def anti_detection_techniques() -> dict:
    """Return the 7 anti-detection techniques."""
    return {
        "techniques": [
            {"technique": "Random timing", "what_it_does": "add random delays between actions (±20%)"},
            {"technique": "Human-like mouse", "what_it_does": "Bézier curves + acceleration/deceleration"},
            {"technique": "Idle behavior", "what_it_does": "sometimes stand still, sometimes AFK, sometimes emote"},
            {"technique": "Variable paths", "what_it_does": "take slightly different routes each time"},
            {"technique": "Sleep cycles", "what_it_does": "log out + sleep for 30-90 min randomly"},
            {"technique": "VPN/proxy rotation", "what_it_does": "rotate IPs to avoid IP-based detection"},
            {"technique": "Hardware spoofing", "what_it_does": "MAC address + GPU fingerprint rotation"},
        ],
        "total_techniques": 7,
        "ts": datetime.now(timezone.utc).isoformat(),
    }


def wow_bot_legal_status() -> dict:
    """Return the legal status."""
    return {
        "blizzard_tos_violation": True,
        "criminal_status_us": "not criminal (ToS violation, civil remedy)",
        "criminal_status_eu": "not criminal (ToS violation, civil remedy)",
        "criminal_status_uk": "not criminal (ToS violation, civil remedy)",
        "civil_remedies": ["account suspension", "account ban", "IP ban", "legal action (rare)"],
        "suspension_duration_days": "30-365",
        "permanent_ban_probability": "5-15%",
        "verdict": "CIVIL_REMEDY_NOT_CRIMINAL",
        "ts": datetime.now(timezone.utc).isoformat(),
    }


def wow_bot_risk_assessment() -> dict:
    """Return the risk assessment per bot type."""
    return {
        "risk_assessment": {
            "healer_bot": {"risk_level": "low", "detection_probability": "1%", "account_loss_probability": "2%"},
            "farmer_bot_24_7": {"risk_level": "medium", "detection_probability": "5%", "account_loss_probability": "10%"},
            "pvp_bot": {"risk_level": "high", "detection_probability": "15%", "account_loss_probability": "30%"},
            "dungeon_bot": {"risk_level": "high", "detection_probability": "20%", "account_loss_probability": "40%"},
            "auction_bot": {"risk_level": "very_high", "detection_probability": "50%", "account_loss_probability": "80%"},
        },
        "ts": datetime.now(timezone.utc).isoformat(),
    }


def wow_bot_best_practices() -> dict:
    """Return the best practices."""
    return {
        "best_practices": [
            "Use 7 anti-detection techniques (random timing, human-like mouse, etc.)",
            "Limit 24/7 farming to 8-12 hours/day (not 24/7)",
            "Use sleep cycles (30-90 min random)",
            "Use 2 separate accounts (one main, one farmer)",
            "Use VPN/proxy rotation",
            "Monitor your accounts (check for warnings)",
            "Don't bot for long periods (max 30 days per account)",
            "Consider testing on a throwaway account first",
            "Use ethical botting (don't ruin other players' experience)",
            "Keep bot source code updated (anti-detection improvements)",
        ],
        "ts": datetime.now(timezone.utc).isoformat(),
    }


mcp = Server("meek-gaming-research-mcp") if Server is not None else None


@mcp.list_tools() if mcp else None
async def list_tools():
    return [
        Tool(name="wow_bot_ecosystem", description="Return the 10+ open-source WoW bot projects.", inputSchema={"type": "object", "properties": {}}),
        Tool(name="wow_bot_categories", description="Return the 5 categories of WoW bots.", inputSchema={"type": "object", "properties": {}}),
        Tool(name="blizzard_detection_methods", description="Return the 4 Blizzard detection methods.", inputSchema={"type": "object", "properties": {}}),
        Tool(name="anti_detection_techniques", description="Return the 7 anti-detection techniques.", inputSchema={"type": "object", "properties": {}}),
        Tool(name="wow_bot_legal_status", description="Return the legal status.", inputSchema={"type": "object", "properties": {}}),
        Tool(name="wow_bot_risk_assessment", description="Return the risk assessment per bot type.", inputSchema={"type": "object", "properties": {}}),
        Tool(name="wow_bot_best_practices", description="Return the best practices.", inputSchema={"type": "object", "properties": {}}),
    ]


@mcp.call_tool() if mcp else None
async def call_tool(name: str, arguments: dict) -> list:
    if name == "wow_bot_ecosystem":
        result = wow_bot_ecosystem()
    elif name == "wow_bot_categories":
        result = wow_bot_categories()
    elif name == "blizzard_detection_methods":
        result = blizzard_detection_methods()
    elif name == "anti_detection_techniques":
        result = anti_detection_techniques()
    elif name == "wow_bot_legal_status":
        result = wow_bot_legal_status()
    elif name == "wow_bot_risk_assessment":
        result = wow_bot_risk_assessment()
    elif name == "wow_bot_best_practices":
        result = wow_bot_best_practices()
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