"""
MEOK Auth — Shared authentication middleware for MEOK AI Labs MCP servers.

Provides tiered access control, rate limiting, API key management,
and audit logging for all MEOK compliance MCP servers.

Usage:
    from meok_auth import check_access, require_tier, audit_log, Tier

    @mcp.tool(name="my_tool")
    async def my_tool(query: str, api_key: str = "") -> str:
        allowed, msg, tier = check_access(api_key)
        if not allowed:
            return json.dumps({"error": msg, "upgrade_url": "https://meok.ai/pricing"})
        result = do_work(query)
        audit_log(api_key, "my_tool", "framework", "result_summary", tier)
        return json.dumps(result)
"""

from meok_auth.middleware import (
    Tier,
    TIER_LIMITS,
    TIER_ORDER,
    audit_log,
    check_access,
    generate_api_key,
    get_tier_from_api_key,
    get_usage_stats,
    require_tier,
)

__all__ = [
    "Tier",
    "TIER_LIMITS",
    "TIER_ORDER",
    "audit_log",
    "check_access",
    "generate_api_key",
    "get_tier_from_api_key",
    "get_usage_stats",
    "require_tier",
]

__version__ = "0.1.0"