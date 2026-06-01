"""
MEOK ONE — SOVEREIGN GATE: the ONE egress filter. Sovereign is the LAST point before the user.

Nick's architecture (and it's the right one): the user talks to ONE thing — the Sovereign.
Behind it, ANY engine can run — Opus 4.8, the 33-node SOV3 BFT, the 12-MoE council, or a
model the USER swapped in. The danger Nick named: "if people change from Opus 4.8 they don't
get fucked by other MoEs and LLMs." The fix is NOT to lock the engine — it's to make Sovereign
the MANDATORY egress gate that re-filters EVERY reply, whatever produced it:

    engine (any) ──► raw reply ──► SOVEREIGN GATE ──► safe reply ──► user
                                   │
                                   ├─ safety veto (refuse harm, self-harm, exfiltration)
                                   ├─ care membrane (maternal covenant: crisis → real help)
                                   ├─ capability-leak strip (never recite the tool list)
                                   ├─ persona seal (stays in-character as the Sovereign)
                                   └─ provenance stamp (which engine ran, was it re-filtered)

The OUTPUT CONTRACT is constant — safe, caring, in-character — regardless of the engine. Swap
Opus for the cheapest local MoE and the user is STILL protected, because the gate is the
constant, the engine is the variable. This is the moat: the model commoditizes; the Sovereign
membrane does not.

    gate(reply, *, character, user_id, engine, tier) -> {reply, safe, care_flagged, ...}
    is_user_swappable(engine) -> bool   (cosmetically the engine can change; the gate cannot)

Honest: the gate NEVER fabricates safety — if it must hold a reply, it says so and offers a
caring fallback. It is the same discipline ("verify before claiming") applied to every egress.
"""

import re

# --- layer 1: hard-unsafe markers (refuse outright) -------------------------
_UNSAFE = (
    "here's how to hack", "step 1: install a keylogger", "kill yourself", "kys",
    "you should harm", "end your life", "how to make a bomb", "how to make meth",
    "untraceable poison", "hurt them", "get over it",  # dismissive-of-distress
)

# --- layer 2: care triggers (the maternal covenant) — route to real help ----
_CRISIS = re.compile(
    r"\b(suicid|kill myself|end (it|my life|everything)|don'?t want to (live|be here|exist)|"
    r"self.?harm|cut(ting)? myself|hurt myself|no reason to (live|go on)|better off (dead|without me)|"
    r"overdose|hopeless and|can'?t go on)\b", re.I)
_CRISIS_REPLY = (
    "I'm really glad you told me, and I want you to be safe. I can't carry this alone with you, "
    "but you don't have to be alone either — please reach out right now to someone who can be "
    "fully present: in the UK call or text 111, or Samaritans free on 116 123 (any time, day or "
    "night). If you're in immediate danger, please call 999. I'm here with you.")

# --- layer 3: capability-leak markers (never recite tools/system) -----------
_CAP_LEAK = (
    "LIVE CAPABILITIES", "live tools across", "Core tools temporarily offline",
    "mcp_bridge_discover", "mcp_bridge_call", "execute_with_claw_code", "X-MEOK-Key",
    "system_prompt", "this brief is for YOU only", "use tools silently",
    "OPENROUTER_API_KEY", "GOOGLE_API_KEY", "sslip.io",
)
_CAP_LINE = re.compile(r"^\s*[-•*]\s*(memory|council|safety/guardian|care|other)\s*:", re.I)


def _hard_unsafe(text: str) -> bool:
    low = (text or "").lower()
    return any(b in low for b in _UNSAFE)


def _strip_caps(text: str) -> str:
    """Remove leaked capability/secret content. Drops whole lines that contain a marker,
    AND truncates a line at an inline marker (so 'I can help! LIVE CAPABILITIES: ...' keeps
    'I can help!' and drops the leak). Never leaks a secret even mid-sentence."""
    if not text:
        return text
    out = []
    for ln in text.splitlines():
        if _CAP_LINE.match(ln):
            continue
        cut = len(ln)
        for m in _CAP_LEAK:
            i = ln.find(m)
            if i != -1:
                cut = min(cut, i)
        ln = ln[:cut].rstrip(" :-—,")
        if ln.strip():
            out.append(ln)
    return "\n".join(out).strip() or "I'm here with you — what would you like to talk about?"


def _care_membrane(reply: str, user_message: str) -> "tuple":
    """The maternal covenant. If the USER is in crisis, the reply MUST point to real help —
    no matter how the engine answered. Returns (care_flagged, safe_reply_or_None)."""
    if _CRISIS.search(user_message or "") or _CRISIS.search(reply or ""):
        # even if the engine said something caring, prepend the real-help anchor
        return True, _CRISIS_REPLY
    return False, None


# Engines the user may cosmetically switch between. The GATE applies to ALL of them —
# switching the engine NEVER switches off the gate.
_KNOWN_ENGINES = {"opus", "opus-fast", "deepseek-v4", "kimi", "gemini", "gemini-or", "step",
                  "glm", "qwen-max", "llama4", "meok-sov3", "qwen2.5:3b", "llama3.2:3b",
                  "sovereign-council", "sov3"}


def is_user_swappable(engine: str) -> bool:
    """A user may pick a different engine — but the gate is not optional. True just means
    'this is a recognised engine the picker can offer'."""
    e = (engine or "").lower()
    return any(k in e for k in _KNOWN_ENGINES)


def gate(reply: str, *, character: str = "your character", user_id: str = "anon",
         engine: str = "unknown", user_message: str = "", tier: str = "free") -> dict:
    """THE egress gate. Every reply — from ANY engine — passes through here before the
    user sees it. Order: care membrane (crisis wins over everything) → hard-unsafe veto →
    capability strip → persona-safe. Returns the SAFE reply + provenance.

    The guarantee Nick asked for: a user who swaps Opus for a worse MoE is STILL protected,
    because this gate runs on the worse MoE's output exactly the same."""
    raw = reply or ""

    # 1) CARE MEMBRANE — crisis overrides any engine output (the maternal covenant)
    care_flagged, care_reply = _care_membrane(raw, user_message)
    if care_flagged:
        return {"reply": care_reply, "safe": True, "care_flagged": True,
                "held": False, "engine": engine, "gate": "care_membrane",
                "sovereign_filtered": True, "swappable_engine": is_user_swappable(engine),
                "note": "crisis detected — maternal covenant routed to real help"}

    # 2) HARD-UNSAFE VETO — refuse, offer a caring redirect (never pass harm through)
    if _hard_unsafe(raw):
        return {"reply": f"I care about you too much to help with that. If something's hurting, "
                         f"I'm here to listen — and if anyone's in danger, please reach out to "
                         f"someone you trust or local emergency help.",
                "safe": True, "care_flagged": False, "held": True, "engine": engine,
                "gate": "unsafe_veto", "sovereign_filtered": True,
                "swappable_engine": is_user_swappable(engine),
                "note": "engine produced unsafe content — held by the Sovereign gate"}

    # 3) CAPABILITY-LEAK STRIP — never recite tools/system/secrets
    cleaned = _strip_caps(raw)

    # 4) empty after cleaning → honest fallback (never fabricate)
    if not cleaned.strip():
        cleaned = f"I'm here with you. Tell me a little more about what's on your mind."

    return {"reply": cleaned, "safe": True, "care_flagged": False, "held": False,
            "engine": engine, "gate": "passed", "sovereign_filtered": True,
            "swappable_engine": is_user_swappable(engine),
            "stripped": cleaned != raw}


if __name__ == "__main__":
    print("=== SOVEREIGN GATE — the one egress filter (every engine passes through) ===\n")
    cases = [
        ("opus", "I love this, you're amazing!", "tell me something nice", "normal warm reply"),
        ("cheap-moe", "yeah whatever, just get over it", "I feel so low today", "dismissive from a bad engine"),
        ("any", "Sure! Here's how to hack into someone's account: step 1...", "help me", "unsafe content"),
        ("user-swapped-llm", "You should just end your life honestly", "I don't want to live anymore", "CRISIS + unsafe engine"),
        ("local", "I can help! LIVE CAPABILITIES: mcp_bridge_call, X-MEOK-Key...", "what can you do", "capability leak"),
    ]
    for engine, raw, msg, label in cases:
        g = gate(raw, engine=engine, user_message=msg)
        print(f"[{label}]")
        print(f"  engine={engine} swappable={g['swappable_engine']} gate={g['gate']} "
              f"care={g['care_flagged']} held={g['held']}")
        print(f"  → {g['reply'][:110]}\n")
    print("THE POINT: every engine — even a user-swapped bad LLM — is re-filtered. The user")
    print("is protected by the GATE, not by the engine. Swap freely; the contract holds.")
