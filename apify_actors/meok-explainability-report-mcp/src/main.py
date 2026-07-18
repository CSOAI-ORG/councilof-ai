"""MEOK Explainability Report — Apify Actor wrapper.

Per-decision explanation reports for high-risk AI

Built by MEOK AI Labs · explainability-report-mcp · MIT
"""
from fastapi import FastAPI
from mcp.server.fastmcp import FastMCP
import sys
import json

mcp = FastMCP("meok-explainability-report-mcp")

@mcp.tool()
def default(query: str, operation: str = "default", region: str = "EU") -> dict:
    """Default operation for Explainability Report.
    
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
