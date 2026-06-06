"""
MEOK ONE ⇄ MCP bridge.

Lets the OS, DOME, LAW, MAP and the 27 characters actually CALL the live tool
ecosystem — SOV3's 110 governance tools + the compliance MCP catalogue — instead
of being a closed UI. This is the "bridge MCPs to our tools" wire.

Pure stdlib (MEOK ONE ships zero pip deps). Talks to SOV3's MCP over HTTP with
the bearer token, handles the streamable-HTTP SSE framing, degrades cleanly.

Routes (wired in server.py):
  GET  /api/mcp/tools          → list available tools (SOV3 tools/list)
  POST /api/mcp/call           → {tool, arguments}  → tools/call
                                  {description, capability} → delegate_task (care-gated)
"""
import os, json, urllib.request, urllib.error

SOV3_URL = os.environ.get("SOV3_MCP_URL", "http://localhost:3101/mcp")


def _token() -> str:
    t = os.environ.get("SOV3_MCP_TOKEN", "")
    if t:
        return t
    for p in ("~/.sov3_mcp_token", "~/clawd/sovereign-temple/.sov3_mcp_token",
              "~/sovereign-temple/.sov3_mcp_token", "/home/meok/sov3/.sov3_mcp_token",
              "/opt/sov3/.sov3_mcp_token"):
        try:
            return open(os.path.expanduser(p)).read().strip()
        except Exception:
            continue
    return ""


def _rpc(method: str, params: dict, timeout: int = 60):
    payload = json.dumps({"jsonrpc": "2.0", "id": 1, "method": method, "params": params}).encode()
    req = urllib.request.Request(SOV3_URL, data=payload, method="POST", headers={
        "Content-Type": "application/json",
        "Accept": "application/json, text/event-stream",
        "Authorization": f"Bearer {_token()}",
    })
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r:
            raw = r.read().decode("utf-8", "replace")
    except urllib.error.HTTPError as e:
        return {"error": f"SOV3 HTTP {e.code}", "detail": e.read().decode("utf-8", "replace")[:200]}
    except Exception as e:
        return {"error": f"SOV3 unreachable: {e}"}
    if "data:" in raw and '"result"' in raw:   # streamable-http SSE framing
        for ln in raw.splitlines():
            if ln.startswith("data:"):
                raw = ln[5:].strip()
                break
    try:
        data = json.loads(raw)
    except Exception:
        return {"error": "bad SOV3 response", "raw": raw[:200]}
    if data.get("error"):
        return {"error": data["error"]}
    return data.get("result", data)


def list_tools():
    res = _rpc("tools/list", {})
    tools = res.get("tools", []) if isinstance(res, dict) else []
    return {
        "ok": not (isinstance(res, dict) and res.get("error")),
        "count": len(tools),
        "tools": [{"name": t.get("name"), "description": (t.get("description") or "")[:140]} for t in tools],
        "via": SOV3_URL,
        "error": res.get("error") if isinstance(res, dict) else None,
    }


def call(body: dict):
    tool = body.get("tool") or body.get("name")
    if not tool and (body.get("description") or body.get("capability")):
        # convenience: delegate a task to the care-gated agent system
        return _rpc("tools/call", {"name": "delegate_task", "arguments": {
            "description": body.get("description", ""),
            "required_capabilities": [body.get("capability", "planning")],
            "priority": int(body.get("priority", 5)),
        }})
    if not tool:
        return {"error": "provide {tool, arguments} or {description, capability}"}
    return _rpc("tools/call", {"name": tool, "arguments": body.get("arguments", {})})
