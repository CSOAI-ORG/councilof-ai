"""Exercise only the observer's own read-only MCP server."""
import asyncio
import datetime as dt
import json
import os
from pathlib import Path
import sys
from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client

async def main():
    env = {k: os.environ[k] for k in ("HOME", "USER", "LOGNAME", "PATH", "SSH_AUTH_SOCK") if k in os.environ}
    params = StdioServerParameters(command=sys.executable,
        args=["-B", str(Path(__file__).with_name("observer.py")), "mcp"], env=env)
    results = {"as_of": dt.datetime.now(dt.timezone.utc).isoformat(), "checks": {}}
    async with stdio_client(params) as (reader, writer):
        async with ClientSession(reader, writer) as session:
            init = await session.initialize()
            results["protocol_version"] = init.protocolVersion
            tools = (await session.list_tools()).tools
            expected = {"fleet_status", "shadow_evidence", "coordination_handoff"}
            assert {t.name for t in tools} == expected
            assert all(t.annotations.readOnlyHint for t in tools)
            results["tools"] = sorted(expected)
            for name in sorted(expected):
                reply = await session.call_tool(name, {})
                assert not reply.isError, name
                data = json.loads(next(c.text for c in reply.content if c.type == "text"))
                if name == "shadow_evidence":
                    assert data["readback"]["integrity"] == "MATCH"
                    state = data["readback"]["current_assessment"]
                    results["checks"][name] = {"integrity": "MATCH",
                        "historical_rows": data["receipt"]["payload"]["historical_rows"],
                        "usable_combinations": state["usable_combinations"],
                        "missing_combinations": state["unobserved_or_invalid"],
                        "profitability_tested": False, "live_execution_allowed": False}
                elif name == "fleet_status":
                    assert data["M4"]["condor"]["http_status"] == 200
                    assert data["M4"]["hummingbot"]["http_status"] == 200
                    results["checks"][name] = data
                else:
                    assert "Evidence limits" in data["text"]
                    results["checks"][name] = "PASS"
            rejected = await session.call_tool("not_a_tool", {})
            assert rejected.isError
            results["unknown_tool_rejected"] = True
    results["status"] = "PASS"
    print(json.dumps(results, indent=2, sort_keys=True))

if __name__ == "__main__":
    asyncio.run(main())
