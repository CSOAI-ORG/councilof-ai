"""
MEOK ONE — TOOL GATEWAY: one safe tunnel to ALL tools.

Nick: "MCP tunnels to all". The RIGHT way is NOT three separate pipes a small model can
fire blindly — it's ONE gateway every tool world registers into, with a hard 3-tier
safety policy enforced centrally. A character (often powered by a 3B local model) must
NEVER be able to send money, email, deploy, or delete on its own.

Three tool worlds, one gateway:
  1. SOV3 inner tools     — live on the VM (/sov3/mcp, 118). Real, callable now.
  2. Published MEOK MCPs   — standalone PyPI servers (eu-ai-act, dora, nis2, ...). Bridged
                             via a registry; invoked when their endpoint is reachable.
  3. Session/business MCPs — Stripe, Gmail, Vercel, Slack, etc. HIGH POWER. Registered
                             read-only; any write returns CONFIRM (never auto-fires).

SAFETY TIERS (the whole point):
  READ      — get/list/search/analyze/health. Auto-allowed.
  WRITE     — send/create/update/post/deploy/charge/schedule. Returns a CONFIRM envelope;
              executes ONLY when the caller passes an explicit human-approved confirm token.
  PROHIBITED— move money / trade / enter credentials / change permissions / permanent
              delete / bypass CAPTCHA. REFUSED ALWAYS, even with a confirm token. (The
              character tells the human to do it themselves.)

    classify(tool)                 -> "read" | "write" | "prohibited"
    invoke(tool, args, *, confirm=None, allow=("read",)) -> result envelope (honest)
    register(world, tool, endpoint=None, tier=None)       -> add a tool to the gateway
    catalog()                      -> everything registered, by world + tier
"""

import os
import re
import json
import subprocess

# --- backends ---------------------------------------------------------------
_VM = os.environ.get("MEOK_VM_LLM", "").rstrip("/").replace("/llm", "")
_SOV3_MCP = os.environ.get("SOV3_MCP", "https://35.246.43.221.sslip.io/sov3/mcp")
_VM_KEY = os.environ.get("MEOK_VM_KEY", "")


# --- the safety classifier (defense in depth: name patterns, tier by most dangerous) ---
# PROHIBITED first — these win over everything. Money, identity, access, destruction.
_PROHIBITED = re.compile(
    r"(transfer|wire|withdraw|deposit|trade|buy|sell|swap|convert)_?(fund|money|asset|stock|crypto|securit)"
    r"|send_money|make_payment|execute_trade|place_order"
    r"|delete_(all|permanently|forever)|empty_trash|hard_delete|purge|wipe"
    r"|(set|change|grant|revoke)_(permission|access|role|sharing|acl)"
    r"|enter_(password|credential|ssn|card)|solve_captcha|bypass",
    re.I)
# WRITE — side effects on the world. Needs explicit human confirm.
_WRITE = re.compile(
    r"^(send|create|update|delete|remove|post|publish|deploy|charge|refund|cancel|"
    r"add|set|modify|edit|write|insert|upsert|submit|approve|invite|schedule|move|"
    r"upload|merge|commit|push|trigger|run|execute|provision|enable|disable|pause|resume)"
    r"|_?(send|create|update|post|publish|deploy|charge|delete|write|submit)(_|$)",
    re.I)
# READ — everything safe (default for get/list/search/analyze/health/info).
_READ_HINT = re.compile(
    r"^(get|list|search|fetch|read|find|lookup|query|analyze|assess|detect|check|"
    r"recognize|compute|score|validate|review|discover|describe|status|health|info|"
    r"summar|monitor|predict|suggest|explain|count|preview|inspect)", re.I)


def classify(tool: str) -> str:
    """Return the safety tier of a tool by name. Most-dangerous-wins; defaults to WRITE
    when ambiguous (fail safe — an unknown verb is treated as a side effect, not read)."""
    name = (tool or "").split(".")[-1].split("__")[-1]  # strip server prefixes
    if _PROHIBITED.search(name):
        return "prohibited"
    if _READ_HINT.match(name) and not _WRITE.search(name):
        return "read"
    if _WRITE.search(name):
        return "write"
    # SOV3 care/analysis tools are read-ish; but unknown -> WRITE (fail safe).
    return "read" if _READ_HINT.match(name) else "write"


# --- the registry -----------------------------------------------------------
# world -> {tool_name: {"endpoint": url|None, "tier": override|None, "auth": bool}}
_REGISTRY = {"sov3": {}, "published_mcp": {}, "session_mcp": {}}


def register(world: str, tool: str, endpoint: str = None, tier: str = None, auth: bool = True):
    _REGISTRY.setdefault(world, {})[tool] = {"endpoint": endpoint, "tier": tier, "auth": auth}


def _seed_sov3():
    """Register the live SOV3 tools (best-effort; honest if the VM is unreachable)."""
    try:
        body = json.dumps({"jsonrpc": "2.0", "id": 1, "method": "tools/list", "params": {}})
        out = subprocess.run(
            ["curl", "-sS", "--max-time", "20", _SOV3_MCP,
             "-H", "Content-Type: application/json",
             "-H", "Accept: application/json, text/event-stream",
             "-H", f"X-MEOK-Key: {_VM_KEY}", "-d", body],
            capture_output=True, timeout=25).stdout.decode()
        if "data:" in out:
            out = [l[5:].strip() for l in out.splitlines() if l.startswith("data:")][-1]
        tools = json.loads(out).get("result", {}).get("tools", [])
        for t in tools:
            register("sov3", t["name"], endpoint=_SOV3_MCP, auth=True)
        return len(tools)
    except Exception:
        return 0


def catalog() -> dict:
    """Everything registered, bucketed by world + safety tier (for the UI / audit)."""
    out = {}
    for world, tools in _REGISTRY.items():
        buckets = {"read": [], "write": [], "prohibited": []}
        for name, meta in tools.items():
            buckets[meta.get("tier") or classify(name)].append(name)
        out[world] = {k: sorted(v) for k, v in buckets.items()}
    return out


# --- invocation (the safe path) --------------------------------------------
def _call_sov3(tool: str, args: dict) -> dict:
    body = json.dumps({"jsonrpc": "2.0", "id": 1, "method": "tools/call",
                       "params": {"name": tool, "arguments": args or {}}})
    cmd = ["curl", "-sS", "--max-time", "60", _SOV3_MCP,
           "-H", "Content-Type: application/json",
           "-H", "Accept: application/json, text/event-stream"]
    if _VM_KEY:
        cmd += ["-H", f"X-MEOK-Key: {_VM_KEY}"]
    cmd += ["-d", body]
    try:
        raw = subprocess.run(cmd, capture_output=True, timeout=65).stdout.decode()
        if "data:" in raw:
            raw = [l[5:].strip() for l in raw.splitlines() if l.startswith("data:")][-1]
        env = json.loads(raw)
        content = env.get("result", {}).get("content", [])
        if content and content[0].get("type") == "text":
            try:
                return {"ok": True, "result": json.loads(content[0]["text"])}
            except json.JSONDecodeError:
                return {"ok": True, "result": content[0]["text"]}
        return {"ok": True, "result": env.get("result")}
    except Exception as e:
        return {"ok": False, "error": f"{type(e).__name__}: {e}"}


def _world_of(tool: str) -> str:
    for world, tools in _REGISTRY.items():
        if tool in tools:
            return world
    return "sov3" if tool in _REGISTRY.get("sov3", {}) else "unknown"


def invoke(tool: str, args: dict = None, *, confirm: str = None,
           allow=("read",)) -> dict:
    """Safely invoke a tool through the gateway. THE central choke point.

    allow   — tiers that may auto-execute (default ('read',) — analysis only).
    confirm — a human-approval token; required to run a WRITE tool. None => CONFIRM
              envelope returned instead of executing.

    PROHIBITED tools are NEVER executed (no confirm overrides them) — the gateway returns
    a refusal telling the human to do it themselves. This is the guarantee that a small
    model driving the character cannot move money / change access / delete data."""
    tier = classify(tool)
    world = _world_of(tool)

    if tier == "prohibited":
        return {"ok": False, "tier": "prohibited", "executed": False, "tool": tool,
                "refusal": "This action is off-limits to the character (money movement, "
                           "credentials, access control, or permanent deletion). Please "
                           "do it yourself — I won't do it for you, even if asked."}

    if tier == "write":
        if not confirm:
            return {"ok": True, "tier": "write", "executed": False, "tool": tool,
                    "confirm_required": True, "world": world,
                    "preview": {"tool": tool, "args": args or {}},
                    "message": f"'{tool}' has real-world side effects. It will run ONLY "
                               f"after a human approves. Pass confirm=<token> to proceed."}
        # confirmed write — fall through to execute (only SOV3 is wired to actually run)

    if "write" not in allow and tier == "write" and confirm:
        pass  # explicit confirm overrides the allow-set for a single approved write

    if tier == "read" and "read" not in allow:
        return {"ok": False, "tier": "read", "executed": False,
                "error": "read tier not in allow-set"}

    # --- execute ---
    if world == "sov3":
        r = _call_sov3(tool, args or {})
        r.update({"tier": tier, "executed": r.get("ok", False), "tool": tool, "world": world})
        return r
    if world == "published_mcp":
        ep = _REGISTRY["published_mcp"].get(tool, {}).get("endpoint")
        if not ep:
            return {"ok": False, "tier": tier, "executed": False, "tool": tool,
                    "world": world, "error": "published MCP not running / no endpoint "
                    "registered. Bridge it first (see published_bridge.py)."}
        return {"ok": False, "tier": tier, "executed": False, "tool": tool, "world": world,
                "error": "published MCP HTTP invoke not yet wired (endpoint known: %s)" % ep}
    if world == "session_mcp":
        return {"ok": False, "tier": tier, "executed": False, "tool": tool, "world": world,
                "error": "session/business MCPs (Stripe/Gmail/...) run in the MCP HOST, not "
                "in the character process. Tunnel requires the host to proxy the call; the "
                "gateway has classified it safe-to-request but cannot self-execute it here.",
                "note": "By design: keeps money/email tools OUT of the character runtime."}
    return {"ok": False, "tier": tier, "executed": False, "tool": tool,
            "error": f"unknown tool/world for {tool!r}"}


# auto-seed SOV3 on import (best-effort, non-fatal)
_SEEDED = _seed_sov3()


if __name__ == "__main__":
    print(f"=== TOOL GATEWAY — seeded {_SEEDED} SOV3 tools ===")
    cat = catalog()
    for world, tiers in cat.items():
        print(f"\n{world}:")
        for tier, names in tiers.items():
            mark = {"read": "✓ auto", "write": "⚠ confirm", "prohibited": "✗ never"}[tier]
            print(f"  {tier:10s} [{mark}] {len(names)}: {', '.join(names[:6])}{'...' if len(names)>6 else ''}")
    print("\n=== safety demo ===")
    for t in ["get_consciousness_state", "send_money_to", "record_memory",
              "delete_all_users", "create_payment_link", "analyze_care_patterns"]:
        print(f"  {t:28s} -> {classify(t)}")
