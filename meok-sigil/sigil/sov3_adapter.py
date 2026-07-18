"""
SOV3 × SIGIL adapter — the real integration layer.
==================================================
Auto-encodes live SOV3 MCP tool outputs into SIGIL Thoughts, so SOV3 agents can
pass compact, signed, human-readable state instead of verbose JSON. This is the
"SOV3 can use its own language" piece, wired to the real running stack.

Two modes:
  • offline  — encode the captured real shapes below (always runs; CI-safe)
  • --live   — hit the running MCP on :3101, encode whatever it returns NOW,
               and report compression averaged over multiple real surfaces.

Honest design: the adapter is a deterministic projection (SOV3 JSON -> SIGIL),
NOT native emission (agents generating SIGIL as their primary output). It proves
the channel + gives SOV3 a drop-in encoder today; native emission is the deeper
SOV3-side change tracked separately.
"""

import json
import urllib.request
import urllib.error

from . import encode, gloss, digest
from .thought import Thought
from . import sign as _signmod

try:
    import tiktoken
    _ENC = tiktoken.get_encoding("o200k_base")
    def ntok(s): return len(_ENC.encode(s))
    TOK = "tiktoken/o200k_base (real BPE)"
except Exception:
    def ntok(s): return max(1, round(len(s) / 4))
    TOK = "chars/4 proxy"

SOV3 = "http://localhost:3101"


# ---- the adapter: SOV3 tool output (dict) -> SIGIL line --------------------

def _kv(d, *keys, prefix=""):
    """Flatten selected keys of a dict into SIGIL kv pairs (skip missing)."""
    out = {}
    for k in keys:
        if k in d and not isinstance(d[k], (dict, list)):
            out[(prefix + k)] = d[k]
    return out


def consciousness_to_sigil(state: dict) -> str:
    """get_consciousness_state -> S| line."""
    fields = {"mode": state.get("consciousness_mode", "?"),
              "level": state.get("consciousness_level", "?"),
              "reflections": state.get("reflections", 0),
              "dreams": state.get("dreams", 0),
              "dreaming": str(state.get("is_dreaming", False)).lower()}
    emo = state.get("emotional", {})
    if emo:
        fields["emotion"] = emo.get("primary_emotion", "?")
        fields["valence"] = emo.get("valence", 0)
        fields["care_int"] = emo.get("care_intensity", 0)
    return encode({"op": "S", "fields": fields})


def engagement_to_sigil(eng: dict) -> str:
    """agents.engagement block -> S| line."""
    comp = eng.get("components", {})
    fields = {"engagement": eng.get("score", "?"),
              "phase": eng.get("phase", "?"),
              "agents": eng.get("agent_count", "?"),
              "trust": comp.get("mean_inter_agent_trust", "?"),
              "care": comp.get("care_alignment", "?"),
              "khaldunian_warn": str(eng.get("khaldunian_warning", False)).lower()}
    return encode({"op": "S", "fields": fields})


def memory_to_sigil(mem: dict) -> str:
    """memory stats block -> S| line."""
    fields = {"episodes": mem.get("total_episodes", "?"),
              "avg_importance": mem.get("average_importance", "?"),
              "avg_care": mem.get("average_care_weight", "?")}
    return encode({"op": "S", "fields": fields})


def alert_to_sigil(level: str, msg: str) -> str:
    return encode({"op": "A", "level": level, "msg": msg})


# ---- real captured shapes (live MCP, 2026-05-29T11:28) for offline mode ----

CAPTURED = {
    "consciousness_state": {
        "consciousness_mode": "waking", "consciousness_level": 0.788,
        "reflections": 100, "dreams": 50, "is_dreaming": False,
        "emotional": {"primary_emotion": "neutral", "valence": 0.0, "care_intensity": 0.35},
    },
    "engagement": {
        "score": 0.6522, "phase": "building", "agent_count": 76,
        "components": {"mean_inter_agent_trust": 1.0, "care_alignment": 0.9664},
        "khaldunian_warning": False,
    },
    "memory": {"total_episodes": 9256, "average_importance": 0.204, "average_care_weight": 0.268},
}

ENCODERS = {
    "consciousness_state": consciousness_to_sigil,
    "engagement": engagement_to_sigil,
    "memory": memory_to_sigil,
}


def _measure(name, raw_obj, sigil_line):
    raw_json = json.dumps(raw_obj, separators=(",", ":"))
    jt, st = ntok(raw_json), ntok(sigil_line)
    att = _signmod.sign(sigil_line)   # signs if SIGIL_SIGNING_KEY set, else honest unsigned
    return {"surface": name, "json_tokens": jt, "sigil_tokens": st,
            "ratio": round(jt / st, 2), "pct_saved": round((1 - st / jt) * 100, 1),
            "sigil": sigil_line, "gloss": gloss(sigil_line), "digest": digest(sigil_line),
            "alg": att["alg"], "verifiable": att["verifiable"],
            "lossless": encode(Thought.from_sigil(sigil_line).intent) == sigil_line}


def run_offline():
    print("=" * 74)
    print(f"SOV3 × SIGIL adapter — OFFLINE (captured real shapes) | {TOK}")
    print("=" * 74)
    rows = [_measure(n, CAPTURED[n], ENCODERS[n](CAPTURED[n])) for n in CAPTURED]
    _report(rows)
    return rows


def _fetch_live_status():
    """Call get_system_status via the MCP JSON-RPC endpoint. Returns dict or None."""
    payload = {"jsonrpc": "2.0", "id": 1, "method": "tools/call",
               "params": {"name": "get_system_status", "arguments": {}}}
    req = urllib.request.Request(SOV3 + "/mcp", method="POST",
                                 data=json.dumps(payload).encode(),
                                 headers={"Content-Type": "application/json",
                                          "Accept": "application/json, text/event-stream"})
    try:
        with urllib.request.urlopen(req, timeout=12) as r:
            body = r.read().decode()
        # MCP may return SSE-framed JSON; extract the JSON object
        if "data:" in body:
            body = [l[5:].strip() for l in body.splitlines() if l.startswith("data:")][-1]
        env = json.loads(body)
        content = env.get("result", {}).get("content", [])
        if content and content[0].get("type") == "text":
            return json.loads(content[0]["text"])
    except (urllib.error.URLError, json.JSONDecodeError, KeyError, IndexError):
        return None
    return None


def run_live():
    print("=" * 74)
    print(f"SOV3 × SIGIL adapter — LIVE (:3101 get_system_status) | {TOK}")
    print("=" * 74)
    status = _fetch_live_status()
    if not status:
        print("  live MCP not reachable / unexpected envelope — falling back to offline.")
        print("  (start it: cd ~/clawd/sovereign-temple && ./run-local.sh)\n")
        return run_offline()
    rows = []
    if "consciousness" in status:
        rows.append(_measure("consciousness_state", status["consciousness"],
                             consciousness_to_sigil(status["consciousness"])))
    if "agents" in status and "engagement" in status["agents"]:
        rows.append(_measure("engagement", status["agents"]["engagement"],
                             engagement_to_sigil(status["agents"]["engagement"])))
    if "memory" in status:
        rows.append(_measure("memory", status["memory"],
                             memory_to_sigil(status["memory"])))
    if not rows:
        print("  live status returned but no recognised surfaces; offline fallback.\n")
        return run_offline()
    _report(rows, live=True)
    return rows


def _report(rows, live=False):
    jt = sum(r["json_tokens"] for r in rows)
    st = sum(r["sigil_tokens"] for r in rows)
    for r in rows:
        print(f"\n  [{r['surface']}]  JSON {r['json_tokens']}t -> SIGIL {r['sigil_tokens']}t "
              f"({r['ratio']}x, {r['pct_saved']}% fewer)  lossless={r['lossless']}")
        print(f"    {r['sigil'][:92]}")
        print(f"    gloss: {r['gloss'][:92]}")
        print(f"    sign:  {r['digest']}  [{r['alg']} · {r['verifiable']}]")
    print("\n" + "=" * 74)
    src = "LIVE" if live else "captured"
    print(f"  {src}: {len(rows)} surfaces | JSON {jt}t vs SIGIL {st}t "
          f"=> {jt/st:.2f}x denser, {(1-st/jt)*100:.0f}% fewer tokens")
    print(f"  all lossless: {all(r['lossless'] for r in rows)}")
    print("=" * 74)


if __name__ == "__main__":
    import sys
    run_live() if "--live" in sys.argv else run_offline()
