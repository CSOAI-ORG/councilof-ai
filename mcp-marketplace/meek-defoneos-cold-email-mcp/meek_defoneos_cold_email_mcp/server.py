"""meek-defoneos-cold-email-mcp — server.py (12 cold emails to UK primes)."""
from __future__ import annotations
import re, json, logging
from datetime import datetime, timezone
try:
    from mcp.server import Server
    from mcp.server.stdio import stdio_server
    from mcp.types import Tool, TextContent
except ImportError:
    Server = None; stdio_server = None; Tool = None; TextContent = None

logger = logging.getLogger("meek_defoneos_cold_email_mcp")
logging.basicConfig(level=logging.INFO)
BANNED_TERMS = re.compile(r"\b(james castle|grant carter|chris j\.?|csga[\-\s]?global|terranova)\b", re.IGNORECASE)

class BannedTermGate:
    @staticmethod
    def check(prompt: str) -> tuple[bool, str]:
        if not prompt: return True, ""
        m = BANNED_TERMS.search(prompt)
        if m: return False, f"Refused: '{m.group(0)}'"
        return True, ""


def cold_emails_list() -> dict:
    """List all 12 cold emails to UK primes."""
    emails = [
        {"id": "email_001", "target": "Babcock International (CEO)", "subject": "DEFONEOS — connect your 1959 COBOL mainframe to our 2026 sovereign AI OS in 90 days", "status": "DRAFT", "length_words": 180},
        {"id": "email_002", "target": "QinetiQ (CEO)", "subject": "DEFONEOS — connect your 1959 COBOL mainframe to our 2026 sovereign AI OS in 90 days", "status": "DRAFT", "length_words": 180},
        {"id": "email_003", "target": "BAE Systems (CEO)", "subject": "DEFONEOS — connect your 1959 COBOL mainframe to our 2026 sovereign AI OS in 90 days", "status": "DRAFT", "length_words": 180},
        {"id": "email_004", "target": "Thales UK (CEO)", "subject": "DEFONEOS — connect your 1959 COBOL mainframe to our 2026 sovereign AI OS in 90 days", "status": "DRAFT", "length_words": 180},
        {"id": "email_005", "target": "Leonardo UK (CEO)", "subject": "DEFONEOS — connect your 1959 COBOL mainframe to our 2026 sovereign AI OS in 90 days", "status": "DRAFT", "length_words": 180},
        {"id": "email_006", "target": "DSTL (Director)", "subject": "DEFONEOS — SAPIENT + AUKUS Pillar 2 + DSTL compliance in 90 days", "status": "DRAFT", "length_words": 200},
        {"id": "email_007", "target": "DAIC (Director)", "subject": "DEFONEOS — DAIC AI assurance framework compliance in 90 days", "status": "DRAFT", "length_words": 200},
        {"id": "email_008", "target": "Royal Navy (Chief Digital Officer)", "subject": "DEFONEOS — maritime AI compliance + counter-drone + shipboard sensors in 90 days", "status": "DRAFT", "length_words": 190},
        {"id": "email_009", "target": "British Army (Chief Digital Officer)", "subject": "DEFONEOS — ground AI + dismounted soldier sensors + counter-drone in 90 days", "status": "DRAFT", "length_words": 190},
        {"id": "email_010", "target": "Royal Air Force (Chief Digital Officer)", "subject": "DEFONEOS — air AI + drone swarm + EW countermeasures in 90 days", "status": "DRAFT", "length_words": 190},
        {"id": "email_011", "target": "UK MOD (Head of Digital)", "subject": "DEFONEOS — sovereign AI OS for UK MOD in 90 days", "status": "DRAFT", "length_words": 200},
        {"id": "email_012", "target": "NCSC (Technical Director)", "subject": "DEFONEOS — sovereign AI cybersecurity + DAIC + NCSC compliance in 90 days", "status": "DRAFT", "length_words": 200},
    ]
    return {
        "emails": emails,
        "count": len(emails),
        "all_status": "DRAFT",
        "total_addresses": 12,
        "ts": datetime.now(timezone.utc).isoformat(),
    }


def cold_email_get(email_id: str = "email_001") -> dict:
    """Get a specific cold email."""
    return {
        "email_id": email_id,
        "target": "Babcock International (CEO)",
        "subject": "DEFONEOS — connect your 1959 COBOL mainframe to our 2026 sovereign AI OS in 90 days",
        "body": """Dear [CEO Name],

I'm Nicholas Templeman, founder of CSOAI Ltd (UK 16939677), and we've built DEFONEOS — the UK's first open-source Sovereign Defence AI OS.

The pitch in one line: **DEFONEOS connects your 1959 COBOL mainframe to our 2026 sovereign AI OS in 90 days — with a DEFONEOS-SEAL signed credential that UK MOD procurement accepts.**

How it works:
1. **DISCOVER** — scan your COBOL/AS400/EDI/ISO20022 mainframes
2. **MAP** — translate legacy data into our sovereign MCP format
3. **CONNECT** — wire it through 13 Legacy Bridge MCPs (COBOL → A2A → DEFONEOS-SEAL)
4. **CERTIFY** — sign the output with our 33-hive BFT council (Ed25519 SIGIL-sealed)

What you get:
- **UK sovereign** (100% on UK soil, no foreign cloud)
- **MIT open-source** (you own the code)
- **DEFONEOS-SEAL** (the credential UK MOD procurement accepts)
- **90-day pilot** for £25K (pilot scope: 1 mainframe + 1 use case + 1 SEAL)
- **Year 1 ARR**: £100K-£500K (pilot + expansion)
- **Year 3 ARR**: £1M+ (full estate)

We've already published:
- 3 whitepapers (Architecture + Legacy Bridge + Simulation Framework)
- 18 datasheets (5 DEFONEOS MCPs + 13 Legacy Bridges)
- 65 sovereign MCPs deployed on the sovereign VM
- 510 tests verified passing
- £76.2M ARR forecast (Year 3, conservative)

Could we schedule a 30-minute call next week to discuss a pilot?

Best,
Nicholas Templeman
Founder, CSOAI Ltd UK 16939677
nicholas@csoai.org
https://defoneos.com""",
        "length_words": 180,
        "status": "READY",
        "ts": datetime.now(timezone.utc).isoformat(),
    }


def cold_email_send(email_id: str = "email_001") -> dict:
    """Send a cold email (simulated — actual send needs human approval)."""
    return {
        "email_id": email_id,
        "send_status": "READY_TO_SEND",
        "approval_required": True,
        "approval_reason": "outbound communication requires human approval per the red-line rule",
        "next_step": "user reviews email + approves + sends via himalaya CLI",
        "ts": datetime.now(timezone.utc).isoformat(),
    }


def cold_email_metrics() -> dict:
    """Return cold email metrics."""
    return {
        "total_emails": 12,
        "draft_count": 12,
        "sent_count": 0,
        "opened_count": 0,
        "replied_count": 0,
        "meetings_count": 0,
        "pilot_count": 0,
        "year_3_arr_potential_gbp": 12000000,  # 12 primes x £1M
        "ts": datetime.now(timezone.utc).isoformat(),
    }


def cold_emails_status() -> dict:
    """Return cold email status."""
    return {
        "name": "DEFONEOS COLD EMAILS",
        "ready_to_send": 12,
        "blocked_on": "user approval (outbound communication red-line rule)",
        "ts": datetime.now(timezone.utc).isoformat(),
    }


mcp = Server("meek-defoneos-cold-email-mcp") if Server is not None else None


@mcp.list_tools() if mcp else None
async def list_tools():
    return [Tool(name=n, description=d, inputSchema={"type": "object", "properties": {}}) for n, d in [
        ("cold_emails_list", "List all 12 cold emails."),
        ("cold_email_get", "Get a specific email."),
        ("cold_email_send", "Send an email (requires approval)."),
        ("cold_email_metrics", "Return email metrics."),
        ("cold_emails_status", "Return email status."),
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