#!/usr/bin/env python3
"""
Smoke test the sovereign-temple-bft-mcp stdio server.

Spawns a mock bft-council FastAPI-style HTTP service on 127.0.0.1:9999
that returns a 33-agent roster, points the MCP server at it via the
BFT_COUNCIL_BASE env var, drives the stdio JSON-RPC handshake, and
asserts:

  1. `initialize` response is well-formed
  2. `tools/list` returns EXACTLY 10 tools
  3. Every tool's description contains the DEFONEOS signature line
  4. The 10 tool names match the contract
  5. `tools/call get_council_status` returns a 33-agent payload

Exits 0 on success, non-zero on any failure with a clear message.
"""
import json
import os
import shutil
import signal
import socket
import subprocess
import sys
import time
from pathlib import Path

ROOT = Path("/Users/nicholas/clawd/openpatent-hive/services/sovereign-temple-bft-mcp")
MOCK_PORT = 9999
MOCK_HOST = "127.0.0.1"

EXPECTED_TOOLS = [
    "get_council_status",
    "get_bft_proposal",
    "submit_bft_vote",
    "list_bft_proposals",
    "get_bft_attestation",
    "get_care_metrics",
    "list_care_vetoes",
    "bridge_to_openpatent_mcp",
    "get_keystone_attestation",
    "get_hive_topology",
]

SIG_LINE = (
    "sovereign-temple.ai — 33-agent BFT sovereign-temple v3.0. "
    "The hive remembers. The dragon knows. "
    "The sovereign companion never forgets."
)


def port_in_use(host: str, port: int) -> bool:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.settimeout(0.2)
        try:
            s.connect((host, port))
            return True
        except OSError:
            return False


def spawn_mock_bft() -> subprocess.Popen:
    """Spawn a mock bft-council HTTP server on 127.0.0.1:MOCK_PORT.

    Returns the 33-agent roster at /agents and 200 OKs for every other path.
    """
    domains = [
        "ethics", "security", "research", "governance", "care",
        "technical", "sovereign", "hydro", "biosensing", "emergence", "substrate",
    ]
    care_dims = [
        "self_care", "other_care", "process_care",
        "relational_care", "maternal_covenant", "future_care",
    ]
    agents = []
    for domain in domains:
        for node in ("alpha", "beta", "gamma"):
            aid = f"{domain}-{node}"
            care_bias = {}
            for k, dim in enumerate(care_dims):
                base = 1.0 / len(care_dims)
                primary = (care_dims.index(dim) == domains.index(domain) % len(care_dims))
                care_bias[dim] = round(base + (0.05 if primary else 0.0), 4)
            agents.append({
                "id": aid,
                "domain": domain,
                "node": node,
                "pubkey_prefix": aid.encode().hex()[:16].ljust(16, "0"),
                "care_bias": care_bias,
            })

    mock_src = f'''
import http.server
import json
import socketserver

AGENTS = {json.dumps(agents)}
DOMAINS = {json.dumps(domains)}
CARE_DIMS = {json.dumps(care_dims)}

class H(http.server.BaseHTTPRequestHandler):
    def _send(self, obj, status=200):
        body = json.dumps(obj).encode()
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        if self.path == "/agents":
            self._send({{
                "council_size": 33,
                "bft_threshold": 22,
                "byzantine_tolerance": 10,
                "domains": DOMAINS,
                "care_dimensions": CARE_DIMS,
                "agents": AGENTS,
            }})
        else:
            self._send({{"ok": True, "path": self.path}})

    def do_POST(self):
        n = int(self.headers.get("Content-Length", 0))
        _ = self.rfile.read(n)
        if "/attest" in self.path:
            self._send({{
                "attestation_id": "mock-attest-1",
                "proposal_hash": "deadbeef",
                "status": "ATTESTED",
                "attester": "meok-keystone",
            }})
        else:
            self._send({{"ok": True, "path": self.path}})

    def log_message(self, *args, **kwargs):
        pass

with socketserver.TCPServer(("{MOCK_HOST}", {MOCK_PORT}), H) as srv:
    srv.serve_forever()
'''
    return subprocess.Popen(
        ["python3", "-c", mock_src],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
        preexec_fn=os.setsid,
    )


def wait_for_port(host: str, port: int, timeout: float = 5.0) -> bool:
    deadline = time.time() + timeout
    while time.time() < deadline:
        if port_in_use(host, port):
            return True
        time.sleep(0.1)
    return False


def npm_install() -> None:
    print(f"[1/5] npm install in {ROOT} ...")
    proc = subprocess.run(
        ["npm", "install", "--no-audit", "--no-fund"],
        cwd=str(ROOT),
        capture_output=True,
        text=True,
        timeout=180,
    )
    if proc.returncode != 0:
        print("npm install FAILED")
        print("STDOUT:", proc.stdout[-2000:])
        print("STDERR:", proc.stderr[-2000:])
        raise SystemExit(1)


def tsc_build() -> None:
    print("[2/5] npx tsc ...")
    proc = subprocess.run(
        ["npx", "tsc"],
        cwd=str(ROOT),
        capture_output=True,
        text=True,
        timeout=120,
    )
    if proc.returncode != 0:
        print("tsc FAILED")
        print("STDOUT:", proc.stdout[-2000:])
        print("STDERR:", proc.stderr[-2000:])
        raise SystemExit(1)


def run_mcp_handshake() -> dict:
    """Spawn the stdio server, drive initialize + tools/list + tools/call,
    and return the parsed JSON-RPC responses keyed by request id."""
    print("[3/5] spawning stdio MCP server ...")
    mcp = subprocess.Popen(
        ["node", "dist/index.js"],
        cwd=str(ROOT),
        stdin=subprocess.PIPE,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        env={**os.environ, "BFT_COUNCIL_BASE": f"http://{MOCK_HOST}:{MOCK_PORT}"},
        bufsize=0,
        preexec_fn=os.setsid,
    )

    try:
        # Read the banner from stderr (so we know it started cleanly)
        time.sleep(0.5)
        try:
            banner = mcp.stderr.read(4096).decode(errors="replace")
        except Exception:
            banner = ""

        def send(req: dict) -> None:
            assert mcp.stdin is not None
            line = (json.dumps(req) + "\n").encode()
            mcp.stdin.write(line)
            mcp.stdin.flush()

        print("    sending initialize + tools/list + tools/call(get_council_status) ...")
        send({
            "jsonrpc": "2.0", "id": 1, "method": "initialize",
            "params": {
                "protocolVersion": "2024-11-05",
                "capabilities": {},
                "clientInfo": {"name": "smoke", "version": "0.1.0"},
            },
        })
        send({"jsonrpc": "2.0", "method": "notifications/initialized"})
        send({"jsonrpc": "2.0", "id": 2, "method": "tools/list"})
        send({
            "jsonrpc": "2.0", "id": 3, "method": "tools/call",
            "params": {"name": "get_council_status", "arguments": {}},
        })

        # Give the server a moment to write all responses, then close stdin
        # so it exits cleanly.
        time.sleep(1.5)
        if mcp.stdin is not None:
            try:
                mcp.stdin.close()
            except Exception as e:
                import logging
                logging.getLogger("openpatent.sigil").warning("silent except: %s", e)
                pass

        # Drain stdout
        out = b""
        if mcp.stdout is not None:
            try:
                out = mcp.stdout.read()
            except Exception as e:
                import logging
                logging.getLogger("openpatent.sigil").warning("silent except: %s", e)
                pass

        # Parse JSON-RPC responses (each on its own line)
        responses = {}
        for line in out.decode(errors="replace").split("\n"):
            line = line.strip()
            if not line:
                continue
            try:
                msg = json.loads(line)
            except json.JSONDecodeError:
                continue
            if "id" in msg and "result" in msg:
                responses[msg["id"]] = msg["result"]

        return {
            "responses": responses,
            "banner": banner,
            "stdout": out.decode(errors="replace"),
        }
    finally:
        try:
            os.killpg(os.getpgid(mcp.pid), signal.SIGTERM)
        except Exception as e:
            import logging
            logging.getLogger("openpatent.sigil").warning("silent except: %s", e)
            pass
        try:
            mcp.wait(timeout=2)
        except Exception:
            try:
                os.killpg(os.getpgid(mcp.pid), signal.SIGKILL)
            except Exception as e:
                import logging
                logging.getLogger("openpatent.sigil").warning("silent except: %s", e)
                pass


def main() -> int:
    print(f"=== sovereign-temple-bft-mcp smoke test ===")
    print(f"    root: {ROOT}")
    print(f"    mock_bft: http://{MOCK_HOST}:{MOCK_PORT}")

    if not shutil.which("node"):
        print("FAIL: node not on PATH"); return 1
    if not shutil.which("npx"):
        print("FAIL: npx not on PATH"); return 1

    if port_in_use(MOCK_HOST, MOCK_PORT):
        print(f"FAIL: port {MOCK_PORT} already in use; free it first")
        return 1

    mock = spawn_mock_bft()
    try:
        if not wait_for_port(MOCK_HOST, MOCK_PORT, timeout=5.0):
            print(f"FAIL: mock bft-council did not bind {MOCK_PORT}")
            return 1
        print(f"    mock bft-council ready on :{MOCK_PORT}")

        npm_install()
        tsc_build()

        result = run_mcp_handshake()
        responses = result["responses"]
        banner = result["banner"]
        stdout_blob = result["stdout"]

        # ── 4. Assertions ────────────────────────────────────────────────
        print("[4/5] asserting JSON-RPC responses ...")

        # Initialize
        if 1 not in responses:
            print("FAIL: no initialize response")
            print("BANNER:", banner)
            print("STDOUT:", stdout_blob[:2000])
            return 1
        init = responses[1]
        server_info = init.get("serverInfo", {})
        if "sovereign-temple-bft-mcp" not in server_info.get("name", ""):
            print(f"FAIL: serverInfo.name = {server_info!r} (expected sovereign-temple-bft-mcp)")
            return 1
        if server_info.get("version") != "1.0.0":
            print(f"FAIL: serverInfo.version = {server_info!r} (expected 1.0.0)")
            return 1
        print(f"    serverInfo: {server_info}")

        # tools/list
        if 2 not in responses:
            print("FAIL: no tools/list response"); return 1
        tools = responses[2].get("tools", [])
        if not isinstance(tools, list):
            print(f"FAIL: tools is not a list: {tools!r}"); return 1

        # EXACTLY 10 tools
        if len(tools) != 10:
            print(f"FAIL: expected exactly 10 tools, got {len(tools)}")
            print(f"  tools: {[t.get('name') for t in tools]}")
            return 1
        print(f"    tools count: {len(tools)} ✓")

        tool_names = {t.get("name") for t in tools}
        missing = set(EXPECTED_TOOLS) - tool_names
        if missing:
            print(f"FAIL: missing tools: {sorted(missing)}")
            return 1
        print(f"    tool names: {sorted(tool_names)} ✓")

        # Every tool's description contains the signature line
        bad = []
        for t in tools:
            desc = t.get("description", "")
            if SIG_LINE not in desc:
                bad.append(t.get("name"))
        if bad:
            print(f"FAIL: tools missing signature line: {bad}")
            for t in tools:
                if t.get("name") in bad:
                    print(f"  {t.get('name')}: {t.get('description')[:200]!r}")
            return 1
        print(f"    all 10 tool descriptions contain the signature line ✓")

        # tools/call get_council_status → 33-agent response
        if 3 not in responses:
            print("FAIL: no tools/call response for get_council_status")
            return 1
        call_result = responses[3]
        content = call_result.get("content", [])
        if not content or not isinstance(content, list):
            print(f"FAIL: tools/call content is empty: {call_result!r}")
            return 1
        text_blob = "\n".join(c.get("text", "") for c in content)
        try:
            payload = json.loads(text_blob)
        except json.JSONDecodeError as e:
            print(f"FAIL: tools/call text is not JSON: {e}")
            print(text_blob[:500])
            return 1

        # Locate the 33-agent list — handle both {agents: [...]} and
        # bft-council /agents shape (council_size + agents).
        agents = payload.get("agents")
        council_size = payload.get("council_size")
        if agents is None and council_size is None:
            # The /agents shape nests differently — accept either top-level
            # or a nested body
            if isinstance(payload.get("body"), dict):
                inner = payload["body"]
                agents = inner.get("agents", agents)
                council_size = inner.get("council_size", council_size)

        n_agents = len(agents) if isinstance(agents, list) else 0
        if n_agents != 33 and council_size != 33:
            print(f"FAIL: get_council_status did not return 33 agents "
                  f"(agents={n_agents}, council_size={council_size})")
            print(f"  payload keys: {list(payload.keys())}")
            return 1
        print(f"    get_council_status → 33 agents (n_agents={n_agents}, "
              f"council_size={council_size}) ✓")
        print(f"    source: {payload.get('source', 'n/a')}")

        # ── 5. Done ──────────────────────────────────────────────────────
        print("[5/5] ALL ASSERTIONS PASSED")
        print()
        print("  ✓ initialize: serverInfo.name = sovereign-temple-bft-mcp, version = 1.0.0")
        print(f"  ✓ tools/list: exactly {len(tools)} tools")
        print("  ✓ all 10 tool names match contract")
        print("  ✓ all 10 descriptions contain the DEFONEOS signature line")
        print("  ✓ tools/call(get_council_status) → 33-agent response")
        return 0
    finally:
        try:
            os.killpg(os.getpgid(mock.pid), signal.SIGTERM)
        except Exception as e:
            import logging
            logging.getLogger("openpatent.sigil").warning("silent except: %s", e)
            pass
        try:
            mock.wait(timeout=2)
        except Exception:
            try:
                os.killpg(os.getpgid(mock.pid), signal.SIGKILL)
            except Exception as e:
                import logging
                logging.getLogger("openpatent.sigil").warning("silent except: %s", e)
                pass


if __name__ == "__main__":
    sys.exit(main())
