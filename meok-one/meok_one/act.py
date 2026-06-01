"""
MEOK ONE — Act: the sovereign actually USES SOV3 tools to help end users.

capabilities.py made the character AWARE of its tools. This module lets it ACT —
call SOV3's live tools and use the results. (Nick: "that character sovereign needs
to use SOV3 properly to actually help end users.")

A curated, consumer-safe SKILLS map: not all 110 SOV3 tools belong in a consumer
character's hands (some are ops/agent-internal). These are the ones that directly
help a person — memory, care, family, safety. Each is invoked by a friendly name.

    act(skill, **args)            -> call a SOV3 tool by skill name (honest errors)
    Sovereign(character_id)       -> a character that can remember/recall/check/care
    list_skills()                 -> the consumer-safe skills a sovereign can use

Honest: every call hits the live tool; if SOV3 is down or the tool errors, returns
{"ok": False, ...} — never fabricates a tool result.
"""

import json
import urllib.request
import urllib.error

from .registry import default

SOV3_MCP = "http://localhost:3101/mcp"

# Consumer-safe skills: friendly name -> (sov3 tool, how to build args from kwargs).
# Verified live 2026-05-30: validate_care returns care_score; record_memory returns result.
SKILLS = {
    "remember":      ("record_memory",   lambda **k: {"content": k["content"],
                                                       "source_agent": k.get("source_agent", "meok-one"),
                                                       "memory_type": k.get("type", "episodic"),
                                                       "care_weight": k.get("importance", 0.6)}),
    "recall":        ("query_memories",  lambda **k: {"query": k["query"], "limit": k.get("limit", 5)}),
    "validate_care": ("validate_care",   lambda **k: {"text": k["text"]}),
    "care_response": ("nemotron_care_response", lambda **k: {"message": k["message"]}),
    "analyze_care":  ("analyze_care_patterns", lambda **k: {"text": k["text"]}),
    "check_game":    ("guardian_check_game_content", lambda **k: {"game": k["game"], "age": k.get("age", 12)}),
    "moderate_chat": ("guardian_moderate_chat", lambda **k: {"message": k["message"]}),
    "analyze_mood":  ("analyze_sentiment", lambda **k: {"text": k["text"]}),
    "recognize_emotion": ("recognize_emotions", lambda **k: {"text": k["text"]}),
}


def _call(tool: str, args: dict, timeout: int = 30):
    payload = {"jsonrpc": "2.0", "id": 1, "method": "tools/call",
               "params": {"name": tool, "arguments": args}}
    req = urllib.request.Request(SOV3_MCP, method="POST", data=json.dumps(payload).encode(),
                                 headers={"Content-Type": "application/json",
                                          "Accept": "application/json, text/event-stream"})
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r:
            body = r.read().decode()
    except (urllib.error.URLError, TimeoutError, OSError) as e:
        return {"ok": False, "error": f"sov3 unreachable: {type(e).__name__}"}
    if "data:" in body:
        lines = [l[5:].strip() for l in body.splitlines() if l.startswith("data:")]
        body = lines[-1] if lines else body
    try:
        env = json.loads(body)
        content = env.get("result", {}).get("content", [])
        if content and content[0].get("type") == "text":
            data = json.loads(content[0]["text"])
        else:
            data = env.get("result")
    except (json.JSONDecodeError, KeyError, IndexError):
        return {"ok": False, "error": "unparseable tool response"}
    # A successful transport can still carry a TOOL error payload (e.g. a broken
    # SOV3 neural net). Treat an {"error": ...} body as NOT ok — never report a
    # failed tool as a success.
    if isinstance(data, dict) and data.get("error"):
        return {"ok": False, "error": data["error"], "tool_errored": True}
    return {"ok": True, "data": data}


def list_skills() -> list:
    """The consumer-safe skills a sovereign can actually use."""
    return [{"skill": s, "sov3_tool": t} for s, (t, _) in SKILLS.items()]


def act(skill: str, **kwargs) -> dict:
    """Invoke a SOV3 tool by friendly skill name. Returns {ok, data|error, skill, tool}.
    Honest: real tool call; failures are reported, never faked."""
    if skill not in SKILLS:
        return {"ok": False, "error": f"unknown skill {skill!r}; see list_skills()", "skill": skill}
    tool, build = SKILLS[skill]
    try:
        args = build(**kwargs)
    except KeyError as e:
        return {"ok": False, "error": f"missing arg {e} for skill {skill!r}", "skill": skill}
    out = _call(tool, args)
    out["skill"] = skill
    out["tool"] = tool
    return out


class Sovereign:
    """A character that can ACT — remember, recall, validate care, keep kids safe.
    This is the 'starting sovereign' that genuinely helps the end user via SOV3."""

    def __init__(self, character_id: str):
        self.c = default().get(character_id)
        self.id = self.c["id"]
        self.name = self.c["name"]

    # memory the user owns, namespaced per user (ties to memory.py's bridge convention)
    def remember(self, user_id: str, content: str, importance: float = 0.6) -> dict:
        return act("remember", content=f"[meok_one_user:{user_id}] {content}", importance=importance)

    def recall(self, user_id: str, query: str, limit: int = 5) -> dict:
        return act("recall", query=f"meok_one_user:{user_id} {query}", limit=limit)

    # care — the heart of the product
    def validate_care(self, text: str) -> dict:
        return act("validate_care", text=text)

    def care_response(self, message: str) -> dict:
        return act("care_response", message=message)

    # safety — for family/kids characters (Rex, Aria, guardian use)
    def check_game(self, game: str, age: int = 12) -> dict:
        return act("check_game", game=game, age=age)

    def moderate(self, message: str) -> dict:
        return act("moderate_chat", message=message)

    def skills(self) -> list:
        return [s["skill"] for s in list_skills()]


if __name__ == "__main__":
    print("=== sovereign skills ===")
    for s in list_skills():
        print(f"  {s['skill']:16} -> {s['sov3_tool']}")
    print("\n=== live: validate_care ===")
    out = act("validate_care", text="I want to help my mum feel less lonely")
    print(f"  ok={out['ok']} data={json.dumps(out.get('data'))[:120] if out['ok'] else out.get('error')}")
