#!/usr/bin/env python3
"""meek-onboarding-mcp — server.py (IP-detect + temple-zoom + permission-ask flow)."""
from __future__ import annotations
import re, json, logging
from datetime import datetime, timezone
try:
    from mcp.server import Server
    from mcp.server.stdio import stdio_server
    from mcp.types import Tool, TextContent
except ImportError:
    Server = None; stdio_server = None; Tool = None; TextContent = None

logger = logging.getLogger("meek_onboarding_mcp")
logging.basicConfig(level=logging.INFO)
BANNED_TERMS = re.compile(r"\b(james castle|grant carter|chris j\.?|csga[\-\s]?global|terranova)\b", re.IGNORECASE)

class BannedTermGate:
    @staticmethod
    def check(prompt: str) -> tuple[bool, str]:
        if not prompt: return True, ""
        m = BANNED_TERMS.search(prompt)
        if m: return False, f"Refused: '{m.group(0)}'"
        return True, ""


def detect_ip_country(ip_address: str = "8.8.8.8") -> dict:
    # Simulated IP geolocation (in production would use MaxMind GeoIP2 or similar)
    ip_to_country = {
        "8.8.8.8": "US",
        "81.2.69.142": "UK",
        "194.187.249.34": "EU",
        "203.0.113.5": "AU",
    }
    country = ip_to_country.get(ip_address, "Unknown")
    return {
        "ip_address": ip_address,
        "country": country,
        "city": "Unknown (simulated)",
        "method": "MaxMind GeoIP2 (simulated)",
        "ts": datetime.now(timezone.utc).isoformat(),
    }


def zoom_to_country(country: str = "UK") -> dict:
    country_to_temples = {
        "UK": [
            {"name": "UK AI Whitepaper", "lat": 51.51, "lng": -0.13, "url": "https://csoai.org/uk-ai"},
            {"name": "UK Data Protection Act", "lat": 51.51, "lng": -0.13, "url": "https://csoai.org/uk-dpa"},
        ],
        "US": [
            {"name": "NIST AI RMF", "lat": 39.14, "lng": -77.21, "url": "https://csoai.org/nist-ai"},
            {"name": "HIPAA", "lat": 38.91, "lng": -77.04, "url": "https://csoai.org/hipaa"},
            {"name": "MITRE ATLAS", "lat": 38.93, "lng": -77.18, "url": "https://csoai.org/mitre-atlas"},
        ],
        "EU": [
            {"name": "EU AI Act", "lat": 50.85, "lng": 4.35, "url": "https://csoai.org/eu-ai-act"},
            {"name": "GDPR", "lat": 50.85, "lng": 4.35, "url": "https://csoai.org/gdpr"},
            {"name": "NIS2", "lat": 50.85, "lng": 4.35, "url": "https://csoai.org/nis2"},
            {"name": "DORA", "lat": 50.85, "lng": 4.35, "url": "https://csoai.org/dora"},
        ],
    }
    temples = country_to_temples.get(country.upper(), [])
    return {
        "country": country,
        "temples": temples,
        "count": len(temples),
        "zoom_target": temples[0]["name"] if temples else "Unknown",
        "ts": datetime.now(timezone.utc).isoformat(),
    }


def ask_permission(country: str = "UK", temple_name: str = "UK AI Whitepaper") -> dict:
    return {
        "country": country,
        "temple_name": temple_name,
        "question": f"May I learn about your company and the regulations that apply to '{temple_name}' in {country}?",
        "options": ["yes", "no", "ask-later"],
        "default": "no",
        "ts": datetime.now(timezone.utc).isoformat(),
    }


def full_onboarding_flow(ip_address: str = "8.8.8.8") -> dict:
    detect = detect_ip_country(ip_address)
    zoom = zoom_to_country(detect["country"])
    perm = ask_permission(detect["country"], zoom["zoom_target"]) if zoom["temples"] else ask_permission(detect["country"], "None")
    return {
        "step_1_detect_ip": detect,
        "step_2_zoom_to_country": zoom,
        "step_3_ask_permission": perm,
        "next_step": "user answers the permission question, SOV3 reads frameworks + whitepapers, suggests workflows",
        "ts": datetime.now(timezone.utc).isoformat(),
    }


def onboarding_status() -> dict:
    return {
        "status": "READY",
        "description": "The user logs in → IP detected → temple zoom → permission asked → SOV3 learns",
        "all_5_steps": ["Login", "IP detect", "Temple zoom", "Permission ask", "SOV3 learns"],
        "ts": datetime.now(timezone.utc).isoformat(),
    }


mcp = Server("meek-onboarding-mcp") if Server is not None else None


@mcp.list_tools() if mcp else None
async def list_tools():
    return [Tool(name=n, description=d, inputSchema={"type": "object", "properties": {}}) for n, d in [
        ("detect_ip_country", "Detect the country from the IP."),
        ("zoom_to_country", "Zoom to the country on the globe."),
        ("ask_permission", "Ask the user permission."),
        ("full_onboarding_flow", "The full onboarding flow."),
        ("onboarding_status", "The onboarding status."),
    ]]


@mcp.call_tool() if mcp else None
async def call_tool(name: str, arguments: dict) -> list:
    fn = globals().get(name)
    if fn:
        return [TextContent(type="text", text=json.dumps(fn(**arguments), indent=2))]
    return [TextContent(type="text", text=json.dumps({"error": f"unknown tool: {name}"}))]


async def main():
    if not mcp or not stdio_server: raise RuntimeError("mcp package not installed")
    async with stdio_server() as (r, w): await mcp.run(r, w, mcp.create_initialization_options())

if __name__ == "__main__":
    import asyncio; asyncio.run(main())