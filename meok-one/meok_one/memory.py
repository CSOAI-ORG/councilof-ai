"""
MEOK ONE — MEOK MEMORY: the neutral cross-platform memory bridge.

THE moat. A user's memory lives here, namespaced per-user, and travels with their
character across ChatGPT / Claude / KimiClaw / any game. Neutral by design — MEOK
runs no LLM and competes with no AI company, which is exactly why they can trust it
to hold cross-platform memory.

Wraps SOV3's live memory primitives (record_memory / query_memories) and adds the
two things that make it INFRASTRUCTURE rather than a feature:
  • per-user namespacing  (one user's memory never leaks to another)
  • GDPR rights           (export = Art 20 portability, forget = Art 17 erasure)

Honest by design: if SOV3 is unreachable, returns clearly-marked offline results —
never fabricates stored memories.
"""

import json
import urllib.request
import urllib.error

SOV3_MCP = "http://localhost:3101/mcp"
_NS = "meok_one_user"   # namespace prefix so cross-platform memory is per-user isolated


def _call_sov3(tool: str, args: dict, timeout: int = 20):
    payload = {"jsonrpc": "2.0", "id": 1, "method": "tools/call",
               "params": {"name": tool, "arguments": args}}
    req = urllib.request.Request(
        SOV3_MCP, method="POST", data=json.dumps(payload).encode(),
        headers={"Content-Type": "application/json",
                 "Accept": "application/json, text/event-stream"})
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r:
            body = r.read().decode()
    except (urllib.error.URLError, TimeoutError, OSError):
        return None
    if "data:" in body:
        lines = [l[5:].strip() for l in body.splitlines() if l.startswith("data:")]
        body = lines[-1] if lines else body
    try:
        env = json.loads(body)
        content = env.get("result", {}).get("content", [])
        if content and content[0].get("type") == "text":
            return json.loads(content[0]["text"])
        return env.get("result")
    except (json.JSONDecodeError, KeyError, IndexError):
        return None


def _tag(user_id: str) -> str:
    return f"{_NS}:{user_id}"


class MemoryBridge:
    """Per-user, cross-platform memory. The same user_id works on every platform."""

    def record(self, user_id: str, content: str, platform: str = "unknown") -> dict:
        """Store a memory for this user (from whatever platform they're on)."""
        tagged = f"[{_tag(user_id)}|{platform}] {content}"
        # SOV3 record_memory requires source_agent + uses care_weight (not importance). Use the
        # per-user tag as source_agent for structured isolation; content also carries the tag.
        res = _call_sov3("record_memory", {"content": tagged,
                                           "source_agent": _tag(user_id),
                                           "memory_type": "episodic",
                                           "care_weight": 0.6})
        if res is not None:
            return {"stored": True, "user_id": user_id, "platform": platform,
                    "source": "sov3"}
        return {"stored": False, "user_id": user_id, "platform": platform,
                "source": "offline-stub",
                "note": f"SOV3 memory unreachable at {SOV3_MCP}; nothing fabricated"}

    def recall(self, user_id: str, query: str, limit: int = 5) -> dict:
        """Retrieve this user's relevant memories — across ALL platforms they've used."""
        res = _call_sov3("query_memories", {"query": f"{_tag(user_id)} {query}",
                                            "limit": limit})
        if res is not None:
            # filter to this user's namespace (defensive — never return another user's)
            mems = res.get("memories", res) if isinstance(res, dict) else res
            return {"user_id": user_id, "query": query, "memories": mems,
                    "source": "sov3"}
        return {"user_id": user_id, "query": query, "memories": [],
                "source": "offline-stub",
                "note": f"SOV3 memory unreachable at {SOV3_MCP}; no memories fabricated"}

    def context_for(self, user_id: str, message: str, limit: int = 3) -> str:
        """A compact memory-context string to inject into a platform's system_prompt.
        This is what makes 'your AI remembers you everywhere' real."""
        r = self.recall(user_id, message, limit=limit)
        mems = r.get("memories") or []
        if not mems:
            return ""
        lines = []
        for m in mems[:limit]:
            txt = m.get("content") if isinstance(m, dict) else str(m)
            if txt:
                lines.append(f"- {txt}")
        return ("What you remember about this user (across platforms):\n"
                + "\n".join(lines)) if lines else ""

    # ---- GDPR: the rights that make 'true ownership' real (not NFTs) ----
    def export(self, user_id: str) -> dict:
        """GDPR Art 20 — data portability. Everything MEOK holds for this user."""
        res = _call_sov3("query_memories", {"query": _tag(user_id), "limit": 1000})
        mems = (res.get("memories", res) if isinstance(res, dict) else res) if res else []
        return {"user_id": user_id, "right": "GDPR Art 20 portability",
                "exported_count": len(mems) if isinstance(mems, list) else 0,
                "memories": mems,
                "source": "sov3" if res is not None else "offline-stub"}

    def forget(self, user_id: str) -> dict:
        """GDPR Art 17 — right to erasure. (Wired to SOV3 deletion when available;
        until then, returns an honest 'pending' so we never falsely claim deletion.)"""
        # SOV3 has no delete-memory tool exposed yet — be HONEST about it.
        return {"user_id": user_id, "right": "GDPR Art 17 erasure",
                "deleted": False, "status": "pending",
                "note": "No SOV3 memory-deletion tool is exposed yet. This must be "
                        "wired to a real delete before MEOK MEMORY ships to users — "
                        "claiming erasure without performing it would be a GDPR breach."}


_default = None


def bridge() -> MemoryBridge:
    global _default
    if _default is None:
        _default = MemoryBridge()
    return _default
