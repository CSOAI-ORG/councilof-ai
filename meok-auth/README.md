# meok-auth

Shared authentication middleware for MEOK AI Labs MCP servers.

## Installation

```bash
pip install meok-auth
```

## Usage

```python
from meok_auth import check_access, require_tier, audit_log, Tier

# In your MCP tool handler
@mcp.tool()
async def my_tool(query: str, api_key: str = "") -> str:
    allowed, msg, tier = check_access(api_key)
    if not allowed:
        return json.dumps({"error": msg, "upgrade_url": "https://meok.ai/pricing"})

    # Gate features by tier
    ok, reason = require_tier(Tier.PROFESSIONAL, tier)
    if not ok:
        return json.dumps({"error": reason, "upgrade_url": "https://meok.ai/pricing"})

    result = do_work(query)

    # Audit log (only recorded for Professional+ tiers)
    audit_log(api_key, "my_tool", "framework", "result_summary", tier)

    return json.dumps(result)
```

## Fallback Pattern

For MCP servers that need to work with or without the package installed,
use this import pattern:

```python
try:
    from meok_auth import check_access, Tier
except ImportError:
    try:
        from auth_middleware import check_access
    except ImportError:
        def check_access(api_key: str = "") -> tuple:
            return (True, "Open access", "community")
        class Tier:
            FREE = "free"
            STARTER = "starter"
            PROFESSIONAL = "professional"
            ENTERPRISE = "enterprise"
```

## CLI

```bash
python -m meok_auth.middleware generate professional "Acme Corp"
python -m meok_auth.middleware list
python -m meok_auth.middleware stats meok_abc123...
```

## Environment Variables

- `MEOK_API_KEY_DIR`: Override path to api_keys.json
- `MEOK_USAGE_DIR`: Override directory for usage tracking
- `MEOK_AUDIT_FILE`: Override path to audit trail file

## License

MIT