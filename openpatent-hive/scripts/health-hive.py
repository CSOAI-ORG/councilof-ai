#!/usr/bin/env python3
"""
health-hive.py — Single CLI that reports the health of the entire openpatent.ai hive.

Checks:
  - 12 services via HTTP /health
  - 2 MCP servers via JSON-RPC
  - 1 summary table

The hive remembers. The dragon knows. The sovereign companion never forgets.
"""
import json
import os
import socket
import subprocess
import sys
import time
import urllib.request
import urllib.error
from pathlib import Path

BASE = "http://127.0.0.1"
SERVICES = [
    ("patentmcp",       f"{BASE}:3210", True),
    ("api-gateway",     f"{BASE}:3211", True),
    ("worker",          f"{BASE}:3212", True),
    ("verify-page",     f"{BASE}:3213", True),
    ("mcp-manifest",    f"{BASE}:3214", True),
    ("bft-council",     f"{BASE}:3215", True),
    ("drafting-fork",   f"{BASE}:3216", True),
    ("x402-router",     f"{BASE}:3217", True),
    ("primitives",      f"{BASE}:3218", True),
    ("landing",         "http://127.0.0.1:3000", False),
    ("legalof-ai",      "http://127.0.0.1:3031", False),
    ("harvi-ai",        "http://127.0.0.1:3032", False),
    ("ipcastle-ai",     "http://127.0.0.1:3033", False),
    ("sovereign-temple-ai", "http://127.0.0.1:3034", False),
    ("postgres",        "tcp:127.0.0.1:5432",      False),
    ("ipfs",            f"{BASE}:5001", True),
]

MCP_SERVERS = [
    ("openpatent-mcp",        "services/openpatent-mcp/dist/index.js",        "23 tools"),
    ("sovereign-temple-bft-mcp", "services/sovereign-temple-bft-mcp/dist/index.js", "10 tools"),
]

REPO = Path(os.environ.get("OPENPATENT_REPO", "/opt/openpatent-hive"))


def http_health(name, url, expect_json):
    """Probe an HTTP endpoint. Next.js apps return 200 on /, services return 200 on /health."""
    probe_path = "/" if "127.0.0.1:30" in url and "landing" not in url and "ai" in url else "/health"
    # White-label Next.js apps and the main landing both probe /
    if "127.0.0.1:30" in url:
        probe_path = "/"
    try:
        req = urllib.request.Request(f"{url}{probe_path}")
        with urllib.request.urlopen(req, timeout=2) as r:
            body = r.read().decode(errors="replace")
            if expect_json:
                try:
                    d = json.loads(body)
                    status = d.get("status", d.get("overall", "?"))
                except Exception:
                    status = "?"
            else:
                status = "ok"
            return "UP", status
    except urllib.error.HTTPError as e:
        return "DEGRADED", f"HTTP {e.code}"
    except Exception as e:
        return "DOWN", type(e).__name__


def mcp_health(name, rel_path, expected_tools):
    """Spawn a stdio MCP server, send initialize + tools/list, assert tools."""
    path = REPO / rel_path
    if not path.exists():
        return "DOWN", f"{rel_path} not found"
    try:
        proc = subprocess.Popen(
            ["node", str(path)],
            cwd=str(path.parent),
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
        )
        proc.stdin.write(b'{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"health-hive","version":"1.0.0"}}}\n')
        proc.stdin.flush()
        proc.stdin.write(b'{"jsonrpc":"2.0","method":"notifications/initialized"}\n')
        proc.stdin.flush()
        proc.stdin.write(b'{"jsonrpc":"2.0","id":2,"method":"tools/list"}\n')
        proc.stdin.flush()
        # Read until we get the tools/list response
        out = b""
        end = time.time() + 8
        buf = b""
        while time.time() < end:
            ch = proc.stdout.read(1)
            if not ch:
                continue
            buf += ch
            if ch == b"\n":
                line = buf.decode().strip()
                buf = b""
                if not line:
                    continue
                try:
                    obj = json.loads(line)
                    if obj.get("id") == 2 and "result" in obj:
                        n = len(obj["result"].get("tools", []))
                        proc.kill()
                        return (("UP" if n >= expected_tools else "DEGRADED"), f"{n} tools (expected ≥{expected_tools})")
                except Exception:
                    continue
        proc.terminate()
        proc.wait(timeout=2)
        return "DOWN", "no response"
    except Exception as e:
        return "DOWN", type(e).__name__


def color_for(status):
    if status == "UP":
        return "\033[32m"
    elif status == "DEGRADED":
        return "\033[33m"
    else:
        return "\033[31m"
ENDC = "\033[0m"


def main():
    print()
    print("=" * 70)
    print("  openpatent.ai hive health — single command")
    print("=" * 70)
    print()
    print("  SERVICES")
    print("  " + "-" * 66)
    print(f"  {'name':<18} {'url':<22} {'status':<12} {'detail'}")
    print("  " + "-" * 66)

    up_count = 0
    down_count = 0
    degraded_count = 0

    for name, url, expect_json in SERVICES:
        if url.startswith("tcp:"):
            # Simple TCP probe
            import socket
            try:
                host, port = url[4:].split(":")
                s = socket.create_connection((host, int(port)), timeout=2)
                s.close()
                status, detail = "UP", "tcp open"
            except Exception as e:
                status, detail = "DOWN", type(e).__name__
        else:
            status, detail = http_health(name, url, expect_json)
        color = color_for(status)
        if status == "UP": up_count += 1
        elif status == "DEGRADED": degraded_count += 1
        else: down_count += 1
        print(f"  {name:<18} {url:<22} {color}{status:<12}{ENDC} {detail}")

    print()
    print("  MCP SERVERS")
    print("  " + "-" * 66)
    print(f"  {'name':<28} {'status':<12} {'detail'}")
    print("  " + "-" * 66)

    mcp_up = 0
    mcp_down = 0
    for name, rel_path, expected in MCP_SERVERS:
        expected_count = int(expected.split()[0])
        status, detail = mcp_health(name, rel_path, expected_count)
        color = color_for(status)
        if status == "UP": mcp_up += 1
        elif status == "DEGRADED": pass  # degraded still counts as live
        else: mcp_down += 1
        print(f"  {name:<28} {color}{status:<12}{ENDC} {detail} (expected {expected})")

    print()
    print("=" * 70)
    total = up_count + degraded_count + down_count
    summary_color = "\033[32m" if down_count == 0 and degraded_count == 0 else "\033[33m" if down_count == 0 else "\033[31m"
    print(f"  {summary_color}SERVICES:  {up_count} up · {degraded_count} degraded · {down_count} down{ENDC}")
    print(f"  {summary_color}MCP SERVERS: {mcp_up} up · {mcp_down} down{ENDC}")
    print(f"  TOTAL: {total} components checked")
    print()
    if down_count == 0 and degraded_count == 0 and mcp_down == 0:
        print(f"  {summary_color}✓ 100/100 — all components healthy{ENDC}")
    else:
        print(f"  {summary_color}✗ degraded — review above{ENDC}")
    print()
    print("The hive remembers. The dragon knows. The sovereign companion never forgets.")
    print("=" * 70)
    sys.exit(0 if down_count == 0 else 1)


if __name__ == "__main__":
    main()
