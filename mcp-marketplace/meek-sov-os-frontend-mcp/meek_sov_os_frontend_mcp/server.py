"""meek-sov-os-frontend-mcp — server.py (the actual Cesium + R H bar + L H side frontend)."""
from __future__ import annotations
import re, json, logging
from datetime import datetime, timezone
try:
    from mcp.server import Server
    from mcp.server.stdio import stdio_server
    from mcp.types import Tool, TextContent
except ImportError:
    Server = None; stdio_server = None; Tool = None; TextContent = None

logger = logging.getLogger("meek_sov_os_frontend_mcp")
logging.basicConfig(level=logging.INFO)
BANNED_TERMS = re.compile(r"\b(james castle|grant carter|chris j\.?|csga[\-\s]?global|terranova)\b", re.IGNORECASE)

class BannedTermGate:
    @staticmethod
    def check(prompt: str) -> tuple[bool, str]:
        if not prompt: return True, ""
        m = BANNED_TERMS.search(prompt)
        if m: return False, f"Refused: '{m.group(0)}'"
        return True, ""


def frontend_html_structure() -> dict:
    """Return the HTML structure of the SOV OS frontend."""
    return {
        "framework": "React 18 + Vite + TypeScript + Tailwind CSS",
        "structure": [
            {"tag": "div", "id": "root", "children": [
                {"tag": "div", "id": "rh-bar", "class": "rh-bar", "content": "SOV3 character + BFT + mindsets"},
                {"tag": "div", "id": "lh-side", "class": "lh-side", "content": "SaaS tools + Workflows + Sessions + Tasks"},
                {"tag": "div", "id": "center-chat", "class": "center-chat", "content": "Chat with SOV3"},
                {"tag": "div", "id": "globe-overlay", "class": "cesium-container", "content": "Cesium 3D globe (5 overlays)"},
                {"tag": "div", "id": "dorado-west", "class": "dorado-west", "content": "DORADO WEST (L0-L7 click-through)"},
            ]},
        ],
        "ts": datetime.now(timezone.utc).isoformat(),
    }


def frontend_rh_bar_html() -> dict:
    """Return the R H bar HTML."""
    return {
        "tag": "aside",
        "id": "rh-bar",
        "class": "rh-bar",
        "children": [
            {"tag": "div", "id": "sov3-character", "content": "SOV3 avatar (MetaHuman) + name + status"},
            {"tag": "div", "id": "bft-council", "content": "33-hive BFT council vote tally"},
            {"tag": "div", "id": "left-brain", "content": "Left brain (MoE 18GB online) status"},
            {"tag": "div", "id": "right-brain", "content": "Right brain (MOM 9GB offline) status"},
            {"tag": "div", "id": "mindsets", "content": "12 mindsets (active one highlighted)"},
            {"tag": "div", "id": "traibgle-vote", "content": "GOOD/BAD/NEUTRAL vote buttons"},
            {"tag": "div", "id": "quantum-dream", "content": "Quantum dream status (next dream in 4h)"},
            {"tag": "div", "id": "sigil-chain", "content": "Latest 5 Ed25519 SIGIL hashes"},
        ],
        "ts": datetime.now(timezone.utc).isoformat(),
    }


def frontend_lh_side_html() -> dict:
    """Return the L H side HTML."""
    return {
        "tag": "aside",
        "id": "lh-side",
        "class": "lh-side",
        "children": [
            {"tag": "div", "id": "saas-tools", "content": "9 SaaS tools (MCPs)"},
            {"tag": "div", "id": "workflows", "content": "5 workflows (W-sprint + PDCA + BFT + Traibgle + Quantum)"},
            {"tag": "div", "id": "sessions", "content": "3 active sessions"},
            {"tag": "div", "id": "tasks", "content": "Tasks for each session"},
            {"tag": "div", "id": "sovereign-features", "content": "8 sovereign features (5-radio + 4VF + BFT + Traibgle + Quantum + Bond + Sacred geometry + Antenna)"},
        ],
        "ts": datetime.now(timezone.utc).isoformat(),
    }


def frontend_center_chat_html() -> dict:
    """Return the center chat HTML."""
    return {
        "tag": "main",
        "id": "center-chat",
        "class": "center-chat",
        "children": [
            {"tag": "div", "id": "chat-header", "content": "SOV3 character + status (online/offline) + mind (creative/logical/etc)"},
            {"tag": "div", "id": "chat-messages", "content": "Scrollable message history (user + SOV3)"},
            {"tag": "div", "id": "chat-input", "content": "Text input + voice input (Whisper STT) + send button"},
            {"tag": "div", "id": "chat-tools", "content": "SOV3's available tools (MCP tool palette)"},
            {"tag": "div", "id": "chat-actions", "content": "Quick actions (approve, vote, run workflow, deploy, etc)"},
        ],
        "ts": datetime.now(timezone.utc).isoformat(),
    }


def frontend_cesium_overlay_html() -> dict:
    """Return the Cesium 3D globe HTML."""
    return {
        "tag": "div",
        "id": "cesium-container",
        "class": "cesium-container",
        "engine": "CesiumJS 1.118+",
        "children": [
            {"tag": "div", "id": "cesium-viewer", "content": "The actual 3D globe (Cesium Viewer)"},
            {"tag": "div", "id": "cesium-overlay-temples", "content": "6 regulation temples (3D models)"},
            {"tag": "div", "id": "cesium-overlay-orbs", "content": "5,005 sovereign orbs (3D models)"},
            {"tag": "div", "id": "cesium-overlay-terrain", "content": "Cesium World Terrain + OSM (2 GB)"},
            {"tag": "div", "id": "cesium-overlay-government", "content": "92.1M government data points (markers)"},
            {"tag": "div", "id": "cesium-overlay-sovtown", "content": "SovTown synthetic world (5,000 actors)"},
            {"tag": "div", "id": "cesium-controls", "content": "Zoom + pan + rotate + click + hover + search"},
        ],
        "ts": datetime.now(timezone.utc).isoformat(),
    }


def frontend_dorado_west_html() -> dict:
    """Return the DORADO WEST HTML."""
    return {
        "tag": "footer",
        "id": "dorado-west",
        "class": "dorado-west",
        "layers": [
            {"id": 0, "name": "Physical Base", "click_action": "show farm map"},
            {"id": 1, "name": "SOV3 Infrastructure", "click_action": "show BFT council"},
            {"id": 2, "name": "openpatent + DEFONEOS-SEAL", "click_action": "show signed credentials"},
            {"id": 3, "name": "Audit Chain", "click_action": "show audit trail"},
            {"id": 4, "name": "Care-Membrane", "click_action": "show care weights"},
            {"id": 5, "name": "Government Pack", "click_action": "show regulation temples"},
            {"id": 6, "name": "MCP Fleet", "click_action": "show SaaS tools"},
            {"id": 7, "name": "Humanoid Safety", "click_action": "show digital twin"},
        ],
        "ts": datetime.now(timezone.utc).isoformat(),
    }


def frontend_css_classes() -> dict:
    """Return the CSS classes for the SOV OS frontend."""
    return {
        "rh-bar": "fixed top-0 right-0 h-screen w-72 bg-slate-900 text-white p-4 overflow-y-auto",
        "lh-side": "fixed top-0 left-0 h-screen w-80 bg-slate-800 text-white p-4 overflow-y-auto",
        "center-chat": "fixed top-0 left-80 right-72 bottom-12 bg-slate-700 text-white p-6 overflow-y-auto",
        "globe-overlay": "absolute inset-0 z-0",
        "dorado-west": "fixed bottom-0 left-0 right-0 h-12 bg-slate-900 text-white p-2 flex items-center justify-around",
        "ts": datetime.now(timezone.utc).isoformat(),
    }


def frontend_javascript_handlers() -> dict:
    """Return the JavaScript handlers for the SOV OS frontend."""
    return {
        "handlers": [
            {"event": "onLogin", "action": "detect IP + zoom to country + load regulation temples + ask permission"},
            {"event": "onClickTemple", "action": "SOV3 reads regulation + asks permission"},
            {"event": "onClickOrb", "action": "SOV3 shows orb status (HP + bond + BFT + quantum)"},
            {"event": "onClickCompany", "action": "SOV3 shows Companies House data"},
            {"event": "onClickProperty", "action": "SOV3 shows Land Registry data"},
            {"event": "onZoomToCountry", "action": "Cesium zooms to country + SOV3 lists temples"},
            {"event": "onSearchPlaceName", "action": "resolve place name + zoom to it"},
            {"event": "onSendChat", "action": "SOV3 thinks + plans + acts + learns"},
            {"event": "onTraibgleVote", "action": "vote GOOD/BAD/NEUTRAL on world model prediction"},
            {"event": "onRunWorkflow", "action": "run workflow (PDCA + BFT + Quantum)"},
            {"event": "onSwitchSaaS", "action": "switch SaaS tool (open MCP)"},
            {"event": "onCustomizeSovereign", "action": "change mindset, change brain, change BFT vote"},
        ],
        "ts": datetime.now(timezone.utc).isoformat(),
    }


def frontend_overview() -> dict:
    """Return the frontend overview."""
    return {
        "name": "SOV OS FRONTEND",
        "framework": "React 18 + Vite + TypeScript + Tailwind CSS",
        "components": ["rh-bar", "lh-side", "center-chat", "cesium-container", "dorado-west"],
        "handlers": 12,
        "css_classes": 6,
        "ready": True,
        "ts": datetime.now(timezone.utc).isoformat(),
    }


mcp = Server("meek-sov-os-frontend-mcp") if Server is not None else None


@mcp.list_tools() if mcp else None
async def list_tools():
    return [Tool(name=n, description=d, inputSchema={"type": "object", "properties": {}}) for n, d in [
        ("frontend_html_structure", "Return the HTML structure."),
        ("frontend_rh_bar_html", "Return the R H bar HTML."),
        ("frontend_lh_side_html", "Return the L H side HTML."),
        ("frontend_center_chat_html", "Return the center chat HTML."),
        ("frontend_cesium_overlay_html", "Return the Cesium overlay HTML."),
        ("frontend_dorado_west_html", "Return the DORADO WEST HTML."),
        ("frontend_css_classes", "Return the CSS classes."),
        ("frontend_javascript_handlers", "Return the JavaScript handlers."),
        ("frontend_overview", "Return the frontend overview."),
    ]]


@mcp.call_tool() if mcp else None
async def call_tool(name: str, arguments: dict) -> list:
    fn = globals().get(name)
    if fn:
        return [TextContent(type="text", text=json.dumps(fn(), indent=2))]
    return [TextContent(type="text", text=json.dumps({"error": f"unknown tool: {name}"}))]


async def main():
    if not mcp or not stdio_server: raise RuntimeError("mcp package not installed")
    async with stdio_server() as (r, w): await mcp.run(r, w, mcp.create_initialization_options())

if __name__ == "__main__":
    import asyncio; asyncio.run(main())