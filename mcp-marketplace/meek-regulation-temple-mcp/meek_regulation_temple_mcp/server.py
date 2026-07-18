#!/usr/bin/env python3
"""meek-regulation-temple-mcp — server.py (every regulation as a temple on the globe)."""
from __future__ import annotations
import re, json, logging
from datetime import datetime, timezone
try:
    from mcp.server import Server
    from mcp.server.stdio import stdio_server
    from mcp.types import Tool, TextContent
except ImportError:
    Server = None; stdio_server = None; Tool = None; TextContent = None

logger = logging.getLogger("meek_regulation_temple_mcp")
logging.basicConfig(level=logging.INFO)
BANNED_TERMS = re.compile(r"\b(james castle|grant carter|chris j\.?|csga[\-\s]?global|terranova)\b", re.IGNORECASE)

class BannedTermGate:
    @staticmethod
    def check(prompt: str) -> tuple[bool, str]:
        if not prompt: return True, ""
        m = BANNED_TERMS.search(prompt)
        if m: return False, f"Refused: '{m.group(0)}'"
        return True, ""


def regulations_as_temples() -> dict:
    temples = [
        {"name": "EU AI Act", "country": "EU", "address": "Brussels, Belgium", "lat": 50.85, "lng": 4.35, "temple_id": "EU-AI-ACT-001", "frameworks": ["Risk-based", "Transparency", "Human oversight", "Data governance"], "whitepapers": 12, "url": "https://csoai.org/eu-ai-act"},
        {"name": "GDPR", "country": "EU", "address": "Brussels, Belgium", "lat": 50.85, "lng": 4.35, "temple_id": "GDPR-001", "frameworks": ["Data protection", "Consent", "Right to be forgotten"], "whitepapers": 8, "url": "https://csoai.org/gdpr"},
        {"name": "NIS2", "country": "EU", "address": "Brussels, Belgium", "lat": 50.85, "lng": 4.35, "temple_id": "NIS2-001", "frameworks": ["Cybersecurity", "Risk management", "Incident reporting"], "whitepapers": 5, "url": "https://csoai.org/nis2"},
        {"name": "DORA", "country": "EU", "address": "Brussels, Belgium", "lat": 50.85, "lng": 4.35, "temple_id": "DORA-001", "frameworks": ["Operational resilience", "ICT risk", "Third-party risk"], "whitepapers": 4, "url": "https://csoai.org/dora"},
        {"name": "UK AI Whitepaper", "country": "UK", "address": "London, UK", "lat": 51.51, "lng": -0.13, "temple_id": "UK-AI-001", "frameworks": ["5 principles", "Pro-innovation", "Context-specific"], "whitepapers": 6, "url": "https://csoai.org/uk-ai"},
        {"name": "AUKUS Pillar 2", "country": "AUKUS", "address": "Canberra, Australia", "lat": -35.28, "lng": 149.13, "temple_id": "AUKUS-002", "frameworks": ["Defense AI", "Quantum", "Hypersonics"], "whitepapers": 3, "url": "https://csoai.org/aukus"},
        {"name": "NIST AI RMF", "country": "US", "address": "Gaithersburg, MD, US", "lat": 39.14, "lng": -77.21, "temple_id": "NIST-AI-001", "frameworks": ["Govern", "Map", "Measure", "Manage"], "whitepapers": 7, "url": "https://csoai.org/nist-ai"},
        {"name": "HIPAA", "country": "US", "address": "Washington, DC, US", "lat": 38.91, "lng": -77.04, "temple_id": "HIPAA-001", "frameworks": ["Privacy", "Security", "Breach notification"], "whitepapers": 4, "url": "https://csoai.org/hipaa"},
        {"name": "ISO 42001", "country": "International", "address": "Geneva, Switzerland", "lat": 46.20, "lng": 6.14, "temple_id": "ISO-42001-001", "frameworks": ["AI management system", "Risk assessment", "Continuous improvement"], "whitepapers": 3, "url": "https://csoai.org/iso-42001"},
        {"name": "MITRE ATLAS", "country": "US", "address": "McLean, VA, US", "lat": 38.93, "lng": -77.18, "temple_id": "MITRE-ATLAS-001", "frameworks": ["Adversarial ML", "Threats", "Mitigations"], "whitepapers": 2, "url": "https://csoai.org/mitre-atlas"},
    ]
    return {"temples": temples, "count": len(temples), "ts": datetime.now(timezone.utc).isoformat()}


def regulation_by_country(country: str = "UK") -> dict:
    all_t = regulations_as_temples()["temples"]
    filtered = [t for t in all_t if t["country"].upper() == country.upper()]
    return {"country": country, "temples": filtered, "count": len(filtered), "ts": datetime.now(timezone.utc).isoformat()}


def regulation_temple_details(temple_id: str = "EU-AI-ACT-001") -> dict:
    all_t = regulations_as_temples()["temples"]
    temple = next((t for t in all_t if t["temple_id"] == temple_id), None)
    if not temple:
        return {"error": f"temple {temple_id} not found"}
    return {
        **temple,
        "inner_workflows": [
            {"step": 1, "name": "Login", "description": "User logs in → IP region detected → zoom to user's country"},
            {"step": 2, "name": "Temple Map", "description": "All temples in country visible on globe"},
            {"step": 3, "name": "Ask Permission", "description": "SOV3 asks permission to learn about the user's company"},
            {"step": 4, "name": "Inner Flows", "description": "Once permitted, SOV3 reads all frameworks + whitepapers"},
            {"step": 5, "name": "Workflow Suggestion", "description": "SOV3 suggests workflows to comply with the regulations"},
        ],
        "ts": datetime.now(timezone.utc).isoformat(),
    }


def regulations_zoom_to_user(ip_country: str = "UK") -> dict:
    temples = regulations_as_temples()["temples"]
    country_temples = [t for t in temples if t["country"].upper() == ip_country.upper()]
    return {
        "ip_country": ip_country,
        "zoom_to": country_temples[0]["address"] if country_temples else "Unknown",
        "temples_visible": len(country_temples),
        "permission_asked": "SOV3 asks: 'May I learn about your company and the regulations that apply?'",
        "ts": datetime.now(timezone.utc).isoformat(),
    }


def regulations_count() -> dict:
    return {
        "total_regulations": 10,
        "total_countries": 5,
        "total_whitepapers": 54,
        "temples_on_globe": 10,
        "ts": datetime.now(timezone.utc).isoformat(),
    }


mcp = Server("meek-regulation-temple-mcp") if Server is not None else None


@mcp.list_tools() if mcp else None
async def list_tools():
    return [Tool(name=n, description=d, inputSchema={"type": "object", "properties": {}}) for n, d in [
        ("regulations_as_temples", "Return all regulations as temples."),
        ("regulation_by_country", "Return the regulations for a country."),
        ("regulation_temple_details", "Return the temple details."),
        ("regulations_zoom_to_user", "Zoom to the user's IP region."),
        ("regulations_count", "Return the total regulation count."),
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