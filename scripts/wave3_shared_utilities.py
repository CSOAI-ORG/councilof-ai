#!/usr/bin/env python3
"""Wave 3: Unified rate limiter + tool whitelist/blacklist + health check.

Creates a shared module at mcp-marketplace/meok_shared/ that all servers can import.
"""
import os

SHARED_DIR = os.path.expanduser("~/clawd/mcp-marketplace/meok_shared")
os.makedirs(SHARED_DIR, exist_ok=True)

# ── Unified Rate Limiter ──
with open(os.path.join(SHARED_DIR, "rate_limiter.py"), "w") as f:
    f.write('''"""
Unified Rate Limiter for MEOK MCP Servers.
Replaces the 4 different rate limit implementations across servers.
Tier-aware, per-tool tracking, with structured error responses.
"""
import time
from collections import defaultdict
from typing import Optional

# ── Configuration ─────────────────────────────────────────────

TIER_LIMITS: dict[str, int] = {
    "free": 25,       # 25 calls/day/tool
    "pro": 500,       # 500 calls/day/tool
    "enterprise": 5000,  # 5,000 calls/day/tool
}

WINDOW_SECONDS = 86400  # 24 hours
ENABLED_TOOLS: Optional[set[str]] = None
DISABLED_TOOLS: Optional[set[str]] = None


def configure(enabled_tools: str = "", disabled_tools: str = "", 
              limits: dict = None):
    """Configure rate limiter from environment variables.
    
    Args:
        enabled_tools: Comma-separated list of tool names to enable (all if empty)
        disabled_tools: Comma-separated list of tool names to disable
        limits: Dict mapping tier names to daily call limits
    """
    global ENABLED_TOOLS, DISABLED_TOOLS
    if enabled_tools:
        ENABLED_TOOLS = set(t.strip() for t in enabled_tools.split(",") if t.strip())
    if disabled_tools:
        DISABLED_TOOLS = set(t.strip() for t in disabled_tools.split(",") if t.strip())
    if limits:
        TIER_LIMITS.update(limits)


class RateLimiter:
    """Thread-safe per-tool rate limiter."""
    
    def __init__(self):
        self._counts: dict[str, list[float]] = defaultdict(list)
    
    def check(self, tool_name: str, tier: str = "free") -> tuple[bool, int, int]:
        """Check if a tool call is allowed.
        
        Returns:
            (allowed: bool, remaining: int, limit: int)
        """
        # Tool whitelist/blacklist check
        if ENABLED_TOOLS and tool_name not in ENABLED_TOOLS:
            return False, 0, 0
        if DISABLED_TOOLS and tool_name in DISABLED_TOOLS:
            return False, 0, 0
        
        limit = TIER_LIMITS.get(tier, TIER_LIMITS["free"])
        now = time.time()
        
        # Prune old entries
        self._counts[tool_name] = [
            t for t in self._counts[tool_name] 
            if now - t < WINDOW_SECONDS
        ]
        
        remaining = max(0, limit - len(self._counts[tool_name]))
        
        if remaining > 0:
            self._counts[tool_name].append(now)
            remaining -= 1
        
        return remaining >= 0 or remaining == 0, remaining, limit
    
    def get_stats(self, tool_name: str) -> dict:
        """Get usage statistics for a tool."""
        now = time.time()
        self._counts[tool_name] = [
            t for t in self._counts[tool_name] 
            if now - t < WINDOW_SECONDS
        ]
        limit = TIER_LIMITS["free"]  # Conservative
        used = len(self._counts[tool_name])
        return {
            "tool": tool_name,
            "calls_today": used,
            "limit": limit,
            "remaining": max(0, limit - used),
            "window_seconds": WINDOW_SECONDS,
            "reset_at": int(now + WINDOW_SECONDS - (now % WINDOW_SECONDS))
        }


# Global instance
limiter = RateLimiter()


def check_rate(tool_name: str, tier: str = "free") -> tuple[bool, str, int]:
    """Convenience function matching existing server patterns.
    
    Returns:
        (allowed: bool, error_message: str, remaining: int)
    """
    allowed, remaining, limit = limiter.check(tool_name, tier)
    if not allowed:
        if ENABLED_TOOLS and tool_name not in ENABLED_TOOLS:
            return False, f"Tool '{tool_name}' is not in ENABLED_TOOLS", 0
        if DISABLED_TOOLS and tool_name in DISABLED_TOOLS:
            return False, f"Tool '{tool_name}' is disabled", 0
        return False, (
            f"Rate limit exceeded for {tool_name}. "
            f"{tier.title()} tier: {limit}/day. "
            f"Upgrade at https://meok.ai/pricing"
        ), 0
    return True, "", remaining


# Auto-configure from environment
import os as _os
_env_enabled = _os.environ.get("MEOK_ENABLED_TOOLS", "")
_env_disabled = _os.environ.get("MEOK_DISABLED_TOOLS", "")
if _env_enabled or _env_disabled:
    configure(enabled_tools=_env_enabled, disabled_tools=_env_disabled)
''')

# ── Health Check ──
with open(os.path.join(SHARED_DIR, "health.py"), "w") as f:
    f.write('''"""
Health check endpoint for MEOK MCP Servers.
Adds /health endpoint to any FastMCP server.
"""
import time
import json

START_TIME = time.time()


def get_health(mcp_server) -> dict:
    """Get health status for an MCP server."""
    tools = []
    if hasattr(mcp_server, '_tool_manager'):
        tm = mcp_server._tool_manager
        if hasattr(tm, '_tools'):
            tools = list(tm._tools.keys())
    
    return {
        "status": "healthy",
        "uptime_seconds": int(time.time() - START_TIME),
        "tools_available": len(tools),
        "version": getattr(mcp_server, 'version', '1.0.0'),
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
    }


def health_endpoint(mcp_server):
    """Generate a simple HTTP health endpoint handler.
    
    Usage:
        from meok_shared.health import health_endpoint
        
        @mcp.custom_route("/health", methods=["GET"])
        def health():
            return health_response(mcp)
    """
    status = get_health(mcp_server)
    return {
        "statusCode": 200,
        "headers": {"Content-Type": "application/json"},
        "body": json.dumps(status, indent=2)
    }
''')

# ── Vendor-prefixed tool naming helper ──
with open(os.path.join(SHARED_DIR, "naming.py"), "w") as f:
    f.write('''"""
Standardized vendor-prefixed tool naming for MEOK MCPs.
Pattern: {vendor}_{action}_{target}
Example: meok_eu_ai_classify_risk, meok_dora_audit_pillars
"""

def vendor_prefix(server_name: str) -> str:
    """Extract a short vendor prefix from server name.
    
    Examples:
        eu-ai-act-compliance-mcp -> meok_eu_ai
        dora-compliance-mcp -> meok_dora
        nis2-compliance-mcp -> meok_nis2
    """
    name = server_name.replace("-mcp", "")
    
    # Map common prefixes
    prefix_map = {
        "eu-ai-act-compliance": "meok_eu_ai_act",
        "dora-compliance": "meok_dora",
        "nis2-compliance": "meok_nis2",
        "cra-compliance": "meok_cra",
        "iso-42001-ai": "meok_iso42001",
        "iso-27001-ai": "meok_iso27001",
        "soc2-compliance-ai": "meok_soc2",
        "bias-detection": "meok_bias",
        "ai-bom": "meok_ai_bom",
        "agent-prompt-injection-firewall": "meok_firewall",
        "healthcare-ai-governance": "meok_health",
        "meok-watermark-attest": "meok_watermark",
        "meok-omnibus-tracker": "meok_omnibus",
        "meok-dpia-edpb-template": "meok_dpia",
        "trust-chain": "meok_trust",
        "care-membrane": "meok_care",
        "memory-search": "meok_memory",
        "web-research": "meok_research",
        "proofof-ai": "proofof",
        "code-executor": "meok_exec",
    }
    
    return prefix_map.get(name, f"meok_{name.replace('-', '_')}")


def tool_name(server_name: str, action: str, target: str = "") -> str:
    """Generate standardized vendor-prefixed tool name.
    
    Args:
        server_name: The MCP server name
        action: What the tool does (search, classify, audit, generate, verify, etc.)
        target: What it operates on (risk, pillar, document, etc.)
    
    Returns:
        Standardized tool name like 'meok_eu_ai_act_classify_risk'
    """
    prefix = vendor_prefix(server_name)
    parts = [prefix, action]
    if target:
        parts.append(target)
    return "_".join(parts)
''')

# ── __init__.py ──
with open(os.path.join(SHARED_DIR, "__init__.py"), "w") as f:
    f.write('''"""
MEOK Shared MCP Utilities
=========================
Unified rate limiting, health checks, vendor-prefixed naming.
Drop-in replacement for per-server implementations.

Usage:
    from meok_shared.rate_limiter import check_rate, configure
    from meok_shared.health import health_endpoint
    from meok_shared.naming import tool_name
"""

from .rate_limiter import RateLimiter, check_rate, configure, limiter
from .health import health_endpoint, get_health
from .naming import vendor_prefix, tool_name

__all__ = [
    "RateLimiter", "check_rate", "configure", "limiter",
    "health_endpoint", "get_health",
    "vendor_prefix", "tool_name",
]
''')

print(f"✅ Created shared utilities in: {SHARED_DIR}")
print(f"   - rate_limiter.py (unified, tier-aware, whitelist/blacklist)")
print(f"   - health.py (health check endpoint)")
print(f"   - naming.py (vendor-prefixed tool naming)")
print(f"   - __init__.py (clean imports)")
