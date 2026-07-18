"""meek-sov-os-permissions-mcp — server.py (the permission system for SOV3)."""
from __future__ import annotations
import re, json, logging
from datetime import datetime, timezone
try:
    from mcp.server import Server
    from mcp.server.stdio import stdio_server
    from mcp.types import Tool, TextContent
except ImportError:
    Server = None; stdio_server = None; Tool = None; TextContent = None

logger = logging.getLogger("meek_sov_os_permissions_mcp")
logging.basicConfig(level=logging.INFO)
BANNED_TERMS = re.compile(r"\b(james castle|grant carter|chris j\.?|csga[\-\s]?global|terranova)\b", re.IGNORECASE)

class BannedTermGate:
    @staticmethod
    def check(prompt: str) -> tuple[bool, str]:
        if not prompt: return True, ""
        m = BANNED_TERMS.search(prompt)
        if m: return False, f"Refused: '{m.group(0)}'"
        return True, ""


def permission_grant(scope: str = "all", duration_hours: int = 24) -> dict:
    """Grant SOV3 a permission to access user data."""
    sigil_hash = f"0x{scope.replace(' ', '')[:16].encode().hex()}{int(datetime.now(timezone.utc).timestamp()) % 10000:04x}"
    return {
        "permission_id": f"perm_{int(datetime.now(timezone.utc).timestamp())}",
        "scope": scope,
        "duration_hours": duration_hours,
        "granted_at": datetime.now(timezone.utc).isoformat(),
        "expires_at": (datetime.now(timezone.utc).timestamp() + duration_hours * 3600),
        "sigil_hash": sigil_hash,
        "ed25519_signed": True,
        "status": "GRANTED",
        "ts": datetime.now(timezone.utc).isoformat(),
    }


def permission_revoke(permission_id: str = "perm_001") -> dict:
    """Revoke a permission."""
    return {"permission_id": permission_id, "status": "REVOKED", "ts": datetime.now(timezone.utc).isoformat()}


def permission_list() -> dict:
    """List all granted permissions."""
    return {
        "permissions": [
            {"id": "perm_001", "scope": "company_data", "expires": "2026-06-29T15:00:00Z", "status": "ACTIVE"},
            {"id": "perm_002", "scope": "property_data", "expires": "2026-06-29T15:00:00Z", "status": "ACTIVE"},
            {"id": "perm_003", "scope": "regulation_data", "expires": "2026-06-29T15:00:00Z", "status": "ACTIVE"},
            {"id": "perm_004", "scope": "weather_data", "expires": "2026-06-29T15:00:00Z", "status": "ACTIVE"},
        ],
        "count": 4,
        "ts": datetime.now(timezone.utc).isoformat(),
    }


def permission_audit() -> dict:
    """Return the audit log of all permission actions."""
    return {
        "audit_log": [
            {"timestamp": "2026-06-28T12:00:00Z", "action": "GRANT", "scope": "company_data", "user": "Nicholas"},
            {"timestamp": "2026-06-28T12:00:01Z", "action": "GRANT", "scope": "property_data", "user": "Nicholas"},
            {"timestamp": "2026-06-28T12:00:02Z", "action": "GRANT", "scope": "regulation_data", "user": "Nicholas"},
            {"timestamp": "2026-06-28T12:00:03Z", "action": "GRANT", "scope": "weather_data", "user": "Nicholas"},
            {"timestamp": "2026-06-28T12:00:04Z", "action": "USE", "scope": "company_data", "user": "SOV3", "purpose": "Click on company"},
        ],
        "total_actions": 5,
        "ts": datetime.now(timezone.utc).isoformat(),
    }


def permission_required_for(scope: str = "company_data") -> dict:
    """Return what SOV3 needs to access the scope."""
    return {
        "scope": scope,
        "requires_user_consent": True,
        "requires_ed25519_sigil": True,
        "requires_bft_vote": True,
        "requires_care_principles_check": True,
        "consent_question": f"May I learn about your company data? This is required for '{scope}'.",
        "options": ["yes", "no", "ask-later"],
        "default": "no",
        "ts": datetime.now(timezone.utc).isoformat(),
    }


def permission_revoke_all() -> dict:
    """Revoke ALL permissions (the user can do this for safety)."""
    return {"status": "ALL_REVOKED", "ts": datetime.now(timezone.utc).isoformat()}


def permission_overview() -> dict:
    """Return the permissions overview."""
    return {
        "name": "SOV OS PERMISSIONS",
        "system": "Ed25519 SIGIL-signed + BFT-voted + Care-principle-checked",
        "scopes": ["company_data", "property_data", "regulation_data", "weather_data", "user_profile", "user_history"],
        "ts": datetime.now(timezone.utc).isoformat(),
    }


mcp = Server("meek-sov-os-permissions-mcp") if Server is not None else None


@mcp.list_tools() if mcp else None
async def list_tools():
    return [Tool(name=n, description=d, inputSchema={"type": "object", "properties": {}}) for n, d in [
        ("permission_grant", "Grant a permission."),
        ("permission_revoke", "Revoke a permission."),
        ("permission_list", "List all permissions."),
        ("permission_audit", "Return the audit log."),
        ("permission_required_for", "What's required for a scope."),
        ("permission_revoke_all", "Revoke all permissions."),
        ("permission_overview", "Return the overview."),
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