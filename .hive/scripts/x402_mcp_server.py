#!/usr/bin/env python3
"""x402_mcp_server.py — x402-gated MCP server.

Demonstrates per-tool-call payments for the Operation Hive Mind protocol stack.
If no X-Payment-Proof header is present, returns HTTP 402 with payment details.
If a valid mock proof is provided, executes the requested tool.
"""
from __future__ import annotations

import hashlib
import json
import time
from datetime import datetime, timezone
from http.server import BaseHTTPRequestHandler, HTTPServer
from pathlib import Path
from typing import Any
from urllib.parse import parse_qs, urlparse

ROOT = Path("/Users/nicholas/clawd")
LOG = ROOT / ".hive" / "logs" / "x402_mcp_server.log"
PORT = 3950

# Tool pricing in USD cents
PRICING = {
    "verify_sbt": 25,
    "assess_compliance": 100,
    "run_council_vote": 50,
    "generate_audit_report": 500,
    "query_memories": 10,
}


def log(msg: str) -> None:
    LOG.parent.mkdir(parents=True, exist_ok=True)
    with LOG.open("a", encoding="utf-8") as f:
        f.write(f"[{datetime.now(timezone.utc).isoformat()}] {msg}\n")
    print(msg)


def make_payment_details(tool: str) -> dict[str, Any]:
    return {
        "scheme": "x402",
        "version": "1.0",
        "tool": tool,
        "amount_cents": PRICING.get(tool, 25),
        "currency": "USD",
        "settlement_token": "USDC",
        "settlement_chain": "base",
        "recipient": "0xCSOAIx402Treasury",
        "expires_at": int(time.time()) + 300,
        "memo": f"MCP tool call: {tool}",
    }


def verify_mock_proof(tool: str, proof: str) -> bool:
    """Mock verification: proof is sha256('pay:<tool>:<amount>')."""
    amount = PRICING.get(tool, 25)
    expected = hashlib.sha256(f"pay:{tool}:{amount}".encode()).hexdigest()
    return proof == expected


def execute_tool(tool: str, params: dict[str, Any]) -> dict[str, Any]:
    """Mock tool execution."""
    return {
        "tool": tool,
        "params": params,
        "result": f"Mock execution of {tool} succeeded.",
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


class Handler(BaseHTTPRequestHandler):
    def log_message(self, format: str, *args: Any) -> None:
        log(format % args)

    def _json(self, status: int, data: dict[str, Any]) -> None:
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(json.dumps(data).encode("utf-8"))

    def do_GET(self) -> None:
        parsed = urlparse(self.path)
        if parsed.path == "/health":
            self._json(200, {"status": "healthy", "port": PORT, "tools": list(PRICING.keys())})
        elif parsed.path == "/tools":
            self._json(200, {"tools": {k: {"price_cents": v} for k, v in PRICING.items()}})
        else:
            self._json(404, {"detail": "Not Found"})

    def do_POST(self) -> None:
        parsed = urlparse(self.path)
        if parsed.path != "/mcp/call":
            self._json(404, {"detail": "Not Found"})
            return

        length = int(self.headers.get("Content-Length", 0))
        try:
            body = json.loads(self.rfile.read(length).decode("utf-8"))
        except Exception as e:
            self._json(400, {"detail": f"Invalid JSON: {e}"})
            return

        tool = body.get("tool")
        params = body.get("params", {})
        if tool not in PRICING:
            self._json(400, {"detail": f"Unknown tool. Available: {list(PRICING.keys())}"})
            return

        proof = self.headers.get("X-Payment-Proof", "")
        if not proof or not verify_mock_proof(tool, proof):
            details = make_payment_details(tool)
            self.send_response(402)
            self.send_header("Content-Type", "application/json")
            self.send_header("X-Payment-Required", "x402")
            self.end_headers()
            self.wfile.write(json.dumps({"detail": "Payment required", "payment": details}).encode("utf-8"))
            log(f"402 requested for {tool}")
            return

        result = execute_tool(tool, params)
        self._json(200, {"status": "paid", "result": result})
        log(f"200 executed {tool}")


def main() -> None:
    server = HTTPServer(("127.0.0.1", PORT), Handler)
    log(f"x402 MCP Server listening on http://127.0.0.1:{PORT}")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass


if __name__ == "__main__":
    main()
