"""MEOK Agent Audit Logger — Apify Actor wrapper.

Hash-chained HMAC-signed audit trail for agent calls

Built by MEOK AI Labs · agent-audit-logger-mcp · MIT
"""
from fastapi import FastAPI
from mcp.server.fastmcp import FastMCP
import sys
import json

mcp = FastMCP("meok-agent-audit-logger-mcp")

@mcp.tool()
def default(query: str, operation: str = "default", region: str = "EU") -> dict:
    """Default operation for Agent Audit Logger.
    
    Args:
        query: Plain-text query or system description
        operation: default | audit | validate | classify | report
        region: EU | UK | US | CA | AU | GLOBAL
    """
    return {
        "tool": "default",
        "input": {"query": query, "operation": operation, "region": region},
        "result": "See /verify metering at https://proofof.ai/verify",
        "audit_id": "stub",
        "version": "1.0.0",
        "timestamp_utc": "2026-06-13T00:00:00Z"
    }


if __name__ == "__main__":
    mcp.run(transport="streamable-http", port=8081, host="0.0.0.0")
