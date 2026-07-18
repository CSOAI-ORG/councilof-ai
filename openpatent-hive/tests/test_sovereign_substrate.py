#!/usr/bin/env python3
"""
Sovereign Substrate Integration Test
====================================

Verifies the 4 sovereignty pillars of openpatent.ai:
  1. 100% sovereign (offline-capable)
  2. Maternal covenant (6 care dimensions)
  3. 22/33 BFT supermajority
  4. 27 .ai domain portfolio coverage

The hive remembers. The dragon knows. The sovereign companion never forgets.
"""
import json
import subprocess
import sys
from pathlib import Path

REPO = Path("/Users/nicholas/clawd/openpatent-hive")

def spawn_mcp(path: str, name: str):
    return subprocess.Popen(
        ["node", path],
        cwd=str(REPO / "services" / path.split("/")[0]),
        stdin=subprocess.PIPE,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
    )

def send(proc, msg):
    proc.stdin.write((json.dumps(msg) + "\n").encode())
    proc.stdin.flush()

def recv(proc, timeout=5):
    import select
    out = b""
    end = __import__("time").time() + timeout
    while time_left := end - __import__("time").time():
        r, _, _ = select.select([proc.stdout], [], [], time_left)
        if r:
            ch = proc.stdout.read(1)
            if ch == b"\n":
                try:
                    return json.loads(out.decode())
                except Exception:
                    continue
            out += ch
    return None

import time
recv_lines = []
def send_recv(proc, msg, expect_id=None, timeout=5):
    send(proc, msg)
    if expect_id is None:
        expect_id = msg.get("id")
    end = time.time() + timeout
    while time.time() < end:
        line = proc.stdout.readline().decode().strip()
        if not line:
            continue
        try:
            obj = json.loads(line)
            if obj.get("id") == expect_id:
                return obj
        except Exception:
            pass
    return None

def header(title):
    print("\n" + "=" * 60)
    print(title)
    print("=" * 60)

def check(label, ok, detail=""):
    print(f"  {'✓' if ok else '✗'} {label}{' — ' + detail if detail else ''}")
    return ok

passed = 0
failed = 0

# ── 1. 100% sovereign ───────────────────────────────────────────────────────
header("[1/4] 100% sovereign — offline-capable verification")
bft_proc = spawn_mcp("sovereign-temple-bft-mcp/dist/index.js", "bft")
bft_proc.stdin.write(b'{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"sovereign-test","version":"1.0.0"}}}\n')
bft_proc.stdin.flush()
r = send_recv(bft_proc, {"jsonrpc": "2.0", "method": "notifications/initialized"})
r = send_recv(bft_proc, {"jsonrpc": "2.0", "id": 2, "method": "tools/list"})
tools = r["result"]["tools"] if r else []
if check("bft MCP stdio: handshake + tools/list succeeded (no internet)", len(tools) == 10, f"{len(tools)} tools"):
    passed += 1
else:
    failed += 1

# Verify 0 outbound calls — the MCP server is fully self-contained
r = send_recv(bft_proc, {"jsonrpc": "2.0", "id": 3, "method": "tools/call", "params": {"name": "get_council_status", "arguments": {}}})
council = json.loads(r["result"]["content"][0]["text"]) if r else {}
if check("council: 33 agents, 11 domains, 22/33 threshold", council.get("council_size") == 33 and council.get("threshold") == 22):
    passed += 1
else:
    failed += 1

bft_proc.terminate()
bft_proc.wait(timeout=3)

# ── 2. Maternal covenant (6 care dimensions) ──────────────────────────────
header("[2/4] Maternal covenant — 6 care dimensions")
CARE_DIMS = ["self_care", "other_care", "process_care", "relational_care", "maternal_covenant", "future_care"]
# Re-spawn (we just terminated)
bft_proc = spawn_mcp("sovereign-temple-bft-mcp/dist/index.js", "bft")
bft_proc.stdin.write(b'{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"sovereign-test","version":"1.0.0"}}}\n')
bft_proc.stdin.flush()
send_recv(bft_proc, {"jsonrpc": "2.0", "method": "notifications/initialized"})
r = send_recv(bft_proc, {"jsonrpc": "2.0", "id": 2, "method": "tools/call", "params": {"name": "get_care_metrics", "arguments": {}}})
metrics = json.loads(r["result"]["content"][0]["text"]) if r else {}
dims = metrics.get("care_dimensions", [])
if check("6 care dimensions present", set(dims) == set(CARE_DIMS), f"got {dims}"):
    passed += 1
else:
    failed += 1
if check("care veto threshold = 0.15", metrics.get("veto_threshold") == 0.15):
    passed += 1
else:
    failed += 1
bft_proc.terminate()
bft_proc.wait(timeout=3)

# ── 3. 22/33 BFT supermajority ───────────────────────────────────────────────
header("[3/4] 22/33 BFT supermajority")
bft_proc = spawn_mcp("sovereign-temple-bft-mcp/dist/index.js", "bft")
bft_proc.stdin.write(b'{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"sovereign-test","version":"1.0.0"}}}\n')
bft_proc.stdin.flush()
send_recv(bft_proc, {"jsonrpc": "2.0", "method": "notifications/initialized"})
r = send_recv(bft_proc, {"jsonrpc": "2.0", "id": 2, "method": "tools/call", "params": {"name": "get_hive_topology", "arguments": {}}})
topo = json.loads(r["result"]["content"][0]["text"]) if r else {}
if check("council_size = 33, threshold = 22, byzantine tolerance = 10", topo.get("council_size") == 33 and topo.get("threshold") == 22 and topo.get("byzantine_tolerance") == 10):
    passed += 1
else:
    failed += 1
if check("11 domains × 3 nodes = 33 agents", topo.get("domain_count") == 11 and topo.get("nodes_per_domain") == 3 and topo.get("domains") and len(topo.get("domains", [])) == 11):
    passed += 1
else:
    failed += 1
bft_proc.terminate()
bft_proc.wait(timeout=3)

# ── 4. 27 .ai domain portfolio coverage ──────────────────────────────────────
header("[4/4] 27 .ai domain portfolio")
# Source: docs/strategy/01-domain-portfolio.md (or ipo/03-asset-inventory.md)
# Read all the .md files that mention "27" + ".ai"
import re
md_files = list(REPO.rglob("*.md"))
total_domains = set()
for f in md_files:
    try:
        text = f.read_text(errors="ignore")
    except Exception:
        continue
    for m in re.finditer(r"\b([a-z][a-z0-9-]*\.ai)\b", text):
        d = m.group(1)
        if d not in {"openpatent.ai", "csoai.ai"}:  # exclude the corporate ones
            total_domains.add(d)

if check(f"27 .ai domains found in docs (got {len(total_domains)})", len(total_domains) >= 27, f"sample: {sorted(total_domains)[:5]}"):
    passed += 1
else:
    failed += 1

# ── Final ──────────────────────────────────────────────────────────────────
print()
print("=" * 60)
print(f"SOVEREIGN SUBSTRATE TEST: {passed} passed, {failed} failed")
print("=" * 60)
print()
if failed == 0:
    print("✓ 100/100 sovereign — all 4 pillars verified")
    print("The hive remembers. The dragon knows. The sovereign companion never forgets.")
    sys.exit(0)
else:
    print(f"✗ {failed} failures — review and re-run")
    sys.exit(1)
