"""
MCP server entry point for meok-sovereign-aiact-passport.

Default transport: stdio (works with Claude Desktop, Cursor, any stdio-aware MCP host).
To run:
    python -m sovereign_aiact_passport.server

Or via the installed entry point:
    meok-sovereign-aiact-passport

Honesty register
----------------
This server is a thin MCP wrapper. All real logic lives in `endpoints.py`
and the underlying tools (PassportClient / classifier / verifier).
The signature authority is the CSOAI root server — not this process.
"""

from __future__ import annotations
import asyncio
import json
import sys

# Try the MCP SDK first; gracefully fall back to a stdio loop if missing.
try:
    from mcp.server import Server  # type: ignore
    from mcp.server.stdio import stdio_server  # type: ignore
    from mcp.types import Tool, TextContent  # type: ignore
    MCP_SDK_AVAILABLE = True
except ImportError:  # pragma: no cover
    MCP_SDK_AVAILABLE = False
    Server = None  # type: ignore[assignment]
    stdio_server = None  # type: ignore[assignment]
    Tool = None  # type: ignore[assignment]
    TextContent = None  # type: ignore[assignment]

from sovereign_aiact_passport.endpoints import TOOL_MANIFEST


PROTOCOL_VERSION = "2025-06-18"
SERVER_NAME = "meok-sovereign-aiact-passport"
SERVER_VERSION = "0.1.0"


# ────────────────────────────────────────────────────────────────────
# SDK-mode (preferred): real MCP
# ────────────────────────────────────────────────────────────────────


async def _run_sdk() -> int:
    assert Server is not None
    server: Server = Server(name=SERVER_NAME, version=SERVER_VERSION)  # type: ignore[call-overload, misc]  # mcp.Server signature varies across versions

    @server.list_tools()
    async def _list_tools() -> list[Tool]:
        return [
            Tool(  # type: ignore[call-arg]
                name=entry["schema"]["name"],
                description=entry["schema"]["description"],
                inputSchema=entry["schema"]["input_schema"],  # type: ignore[arg-type]
            )
            for entry in TOOL_MANIFEST
        ]

    @server.call_tool()
    async def _call_tool(name: str, arguments: dict) -> list[TextContent]:
        entry = next((e for e in TOOL_MANIFEST if e["schema"]["name"] == name), None)
        if entry is None:
            return [TextContent(type="text", text=f"unknown tool: {name}")]  # type: ignore[call-arg]
        try:
            if entry["kind"] == "async":
                result = await entry["fn"](**arguments)
            else:
                result = entry["fn"](**arguments)
            return [TextContent(type="text", text=json.dumps(result, indent=2, sort_keys=False))]  # type: ignore[call-arg]
        except Exception as e:
            return [TextContent(  # type: ignore[call-arg]
                type="text",
                text=json.dumps({"error": type(e).__name__, "message": str(e)}, indent=2),
            )]

    opts = server.create_initialization_options()
    opts.protocol_version = PROTOCOL_VERSION
    async with stdio_server() as (read_stream, write_stream):  # type: ignore[misc]
        await server.run(read_stream, write_stream, opts)  # type: ignore[arg-type]
    return 0


# ────────────────────────────────────────────────────────────────────
# Fallback: stdio JSONRPC-like loop (no SDK dependency)
# ────────────────────────────────────────────────────────────────────


def _print(obj: dict) -> None:
    sys.stdout.write(json.dumps(obj, indent=2, sort_keys=False) + "\n")
    sys.stdout.flush()


def _run_minimal_stdio() -> int:
    """Read JSON-RPC requests line-by-line from stdin. Works without mcp SDK.

    Implements the subset needed for testing: initialize + tools/list + tools/call.
    """
    _print({
        "jsonrpc": "2.0",
        "id": 0,
        "result": {
            "protocolVersion": PROTOCOL_VERSION,
            "serverInfo": {"name": SERVER_NAME, "version": SERVER_VERSION},
            "capabilities": {"tools": {}},
        },
    })

    for line in sys.stdin:
        line = line.strip()
        if not line:
            continue
        try:
            req = json.loads(line)
        except Exception:
            continue
        req_id = req.get("id")
        method = req.get("method", "")
        params = req.get("params", {}) or {}

        if method == "tools/list":
            _print({
                "jsonrpc": "2.0",
                "id": req_id,
                "result": {
                    "tools": [
                        {
                            "name": e["schema"]["name"],
                            "description": e["schema"]["description"],
                            "inputSchema": e["schema"]["input_schema"],
                        }
                        for e in TOOL_MANIFEST
                    ]
                },
            })
        elif method == "tools/call":
            name = params.get("name", "")
            args = params.get("arguments", {}) or {}
            entry = next((e for e in TOOL_MANIFEST if e["schema"]["name"] == name), None)
            if entry is None:
                _print({"jsonrpc": "2.0", "id": req_id, "error": {"code": -32601, "message": f"unknown tool {name!r}"}})
                continue
            try:
                if entry["kind"] == "async":
                    result = asyncio.run(entry["fn"](**args))
                else:
                    result = entry["fn"](**args)
                _print({
                    "jsonrpc": "2.0",
                    "id": req_id,
                    "result": {"content": [{"type": "text", "text": json.dumps(result, indent=2, sort_keys=False)}]},
                })
            except Exception as e:
                _print({
                    "jsonrpc": "2.0",
                    "id": req_id,
                    "result": {
                        "content": [{"type": "text", "text": json.dumps({"error": type(e).__name__, "message": str(e)})}],
                        "isError": True,
                    },
                })
        elif method == "ping":
            _print({"jsonrpc": "2.0", "id": req_id, "result": {}})
        else:
            _print({"jsonrpc": "2.0", "id": req_id, "error": {"code": -32601, "message": f"unknown method {method!r}"}})
    return 0


# ────────────────────────────────────────────────────────────────────
# Entrypoint
# ────────────────────────────────────────────────────────────────────


def main() -> int:
    if MCP_SDK_AVAILABLE:
        try:
            return asyncio.run(_run_sdk())
        except KeyboardInterrupt:
            return 0
    return _run_minimal_stdio()


if __name__ == "__main__":  # pragma: no cover
    sys.exit(main())
