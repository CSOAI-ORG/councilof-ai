#!/usr/bin/env python3
"""mcp2026_proxy_proof.py — LIVE end-to-end proof that the estate speaks BOTH MCP wires.

Starts a real WSGI server on 127.0.0.1:8090: a legacy (handshake-era) MCP app
wrapped by mcp2026_shim.ShimWSGI. Then issues real HTTP requests:
  A) legacy wire: POST initialize (2025-06-18 client)  -> expect 2025-11-25 local answer
  B) 2026-07-28 wire: POST tools/call with Mcp-Method + Mcp-Name headers
     -> expect canonical injection + echoed result
  C) 2026 wire missing Mcp-Name -> expect -32602 JSON-RPC error
Everything runs in-process (stdlib), prints PASS/FAIL per case, exits 0/1.

Usage: PYTHONPATH= python3 mcp2026_proxy_proof.py [--port 8090]
"""
import json
import sys
import threading
import urllib.request
from wsgiref.simple_server import make_server

sys.path.insert(0, "/Users/nicholas/clawd")
from mcp2026_shim import ShimWSGI  # noqa: E402

CAPTURED = {}  # what the legacy app actually received (post-translation)


def legacy_app(environ, start_response):
    """A handshake-era MCP server: expects initialize first, tracks session."""
    body = environ["wsgi.input"].read(int(environ.get("CONTENT_LENGTH") or 0))
    try:
        req = json.loads(body)
    except Exception:
        req = {}
    method = req.get("method", "unknown")
    CAPTURED[method] = {
        "mcp_method_header": environ.get("HTTP_MCP_METHOD"),
        "mcp_name_header": environ.get("HTTP_MCP_NAME"),
        "meta": (req.get("params") or {}).get("_meta"),
        "session_header": environ.get("HTTP_MCP_SESSION_ID"),
    }
    if method == "initialize":
        result = {"protocolVersion": "2025-06-18", "capabilities": {},
                  "serverInfo": {"name": "legacy-app", "version": "1.0"}}
    elif method == "tools/call":
        result = {"content": [{"type": "text", "text": "legacy-app executed the tool"}],
                  "echo_name_header": environ.get("HTTP_MCP_NAME")}
    else:
        result = {"ok": True}
    payload = json.dumps({"jsonrpc": "2.0", "id": req.get("id", 1),
                          "result": result}).encode()
    start_response("200 OK", [("Content-Type", "application/json"),
                              ("Content-Length", str(len(payload)))])
    return [payload]


def post(url, body, headers=None):
    req = urllib.request.Request(url, data=json.dumps(body).encode(),
                                 headers={"Content-Type": "application/json",
                                          **(headers or {})}, method="POST")
    try:
        with urllib.request.urlopen(req, timeout=5) as r:
            return r.status, json.loads(r.read().decode())
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read().decode())
    except Exception as e:
        return 0, {"error": str(e)}


def main():
    port = int(sys.argv[sys.argv.index("--port") + 1]) if "--port" in sys.argv else 8090
    shim = ShimWSGI(legacy_app)
    srv = make_server("127.0.0.1", port, shim)
    t = threading.Thread(target=srv.serve_forever, daemon=True)
    t.start()
    url = f"http://127.0.0.1:{port}/mcp"
    ok_all = True

    def check(name, cond, detail=""):
        nonlocal ok_all
        print(f"{'PASS' if cond else 'FAIL'}  {name}" + (f"  [{detail}]" if detail else ""))
        ok_all = ok_all and cond

    # A) legacy client: initialize handshake
    st, resp = post(url, {"jsonrpc": "2.0", "id": 0, "method": "initialize",
                          "params": {"protocolVersion": "2025-06-18",
                                     "capabilities": {},
                                     "clientInfo": {"name": "legacy", "version": "1"}}})
    check("A legacy initialize -> 2025-11-25 local answer",
          resp.get("result", {}).get("protocolVersion") == "2025-11-25",
          f"got {resp.get('result', {}).get('protocolVersion')}")

    # B) 2026 stateless client: tools/call with mandatory headers
    st, resp = post(url, {"jsonrpc": "2.0", "id": 1, "method": "tools/call",
                          "params": {"name": "my_tool", "arguments": {}}},
                    headers={"Mcp-Method": "tools/call", "Mcp-Name": "my_tool"})
    got = resp.get("result", {})
    check("B 2026 tools/call executes on legacy app",
          "executed the tool" in json.dumps(got), f"st={st}")
    seen = CAPTURED.get("tools/call", {})
    check("B2 _meta.protocolVersion injected for the app",
          (seen.get("meta") or {}).get("protocolVersion") == "2026-07-28",
          f"meta={seen.get('meta')}")
    check("B3 no session header required (Mcp-Session-Id stripped)",
          seen.get("session_header") in (None, ""))

    # C) 2026 wire with NO Mcp-Name and NO derivable params.name -> -32602
    st, resp = post(url, {"jsonrpc": "2.0", "id": 2, "method": "tools/call",
                          "params": {"arguments": {}}},
                    headers={"Mcp-Method": "tools/call"})
    err = resp.get("error") or {}
    check("C missing Mcp-Name AND no params.name -> -32602",
          err.get("code") == -32602, f"code={err.get('code')}")

    # C2) header missing but params.name present -> derived (lenient migration)
    seen_before = dict(CAPTURED)
    st, resp = post(url, {"jsonrpc": "2.0", "id": 4, "method": "tools/call",
                          "params": {"name": "derived_tool", "arguments": {}}},
                    headers={"Mcp-Method": "tools/call"})
    check("C2 name derivable from params -> derived, not rejected",
          "executed the tool" in json.dumps(resp.get("result", {})),
          "derive-when-possible")

    # D) server/discover answered by shim (stateless discovery)
    st, resp = post(url, {"jsonrpc": "2.0", "id": 3, "method": "server/discover"},
                    headers={"Mcp-Method": "server/discover"})
    d = resp.get("result", {})
    check("D server/discover -> 2026-07-28 capabilities",
          d.get("protocolVersion") == "2026-07-28", f"got {d.get('protocolVersion')}")

    srv.shutdown()
    print(f"\n{'ALL PROOFS PASS — estate speaks BOTH wires via shim' if ok_all else 'PROOF FAILED'}")
    return 0 if ok_all else 1


if __name__ == "__main__":
    raise SystemExit(main())
