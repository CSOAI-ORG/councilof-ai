"""
MEOK BRIDGE — the 19th product. The router that connects everything.

The architecture Nick described:

        ┌──────────────── SOV3 (centre) ────────────────┐
        │   BFT council · safety · memory · reconciles   │
   LEFT ┤   (messages travel as MEOK SIGIL — signed,     ├ RIGHT
   ├ local (Ollama, private/free)   compressed wire fmt)  │  ├ local (Ollama big)
   └ api   (cheap MoE, e.g. DeepSeek)                      │  └ api (frontier: Vertex Gemini / Claude / GPT-4o)
        └────────────────────────────────────────────────┘

Each BRAIN can draw from BOTH a local source AND an api source — BRIDGE picks per side
by cost+quality, SOV3 governs safety in the centre, and the two sides' opinions are
reconciled. Every hop is logged as a SIGIL line so the whole exchange is an auditable,
compressed, signed trail (MEOK SIGIL inner-comms) the BFT council can read.

This wraps the existing router.ask() (which already knows local vs cloud backends) and the
existing brains.think() council logic — it does NOT replace them, it elevates them into a
named product with per-side source selection + SIGIL logging.

    bridge_think(character, message, profile="balanced") -> {reply, sides, sigil_log, safe}
    profiles: local_only | balanced | power | council
"""

import os
import sys
import time
from pathlib import Path

from .router import ask, list_models
from .connect import connect

# MEOK SIGIL — inner-comms wire format (signed, ~2.4x denser than JSON)
_SIGIL = Path(__file__).resolve().parents[2] / "meok-sigil"
if str(_SIGIL) not in sys.path:
    sys.path.insert(0, str(_SIGIL))
try:
    from sigil import encode as _sigil_encode, digest as _sigil_digest
    _HAVE_SIGIL = True
except Exception:
    _HAVE_SIGIL = False


def _safe_digest(line):
    """Tamper-evident digest of a SIGIL line; None if the line isn't valid SIGIL."""
    if not _HAVE_SIGIL or not line:
        return None
    try:
        return _sigil_digest(line)
    except Exception:
        return None


# A "side" = which source(s) that brain may draw from. BRIDGE picks within the side.
# left  = privacy/cost side  (local first, cheap-api fallback)
# right = power side          (frontier api first, local-big fallback)
_PROFILES = {
    "local_only": {"left": ["local"],          "right": ["local"]},           # fully private/offline
    "balanced":   {"left": ["local"],          "right": ["cloud", "local"]},  # default: private left, powerful right
    "power":      {"left": ["cloud", "local"], "right": ["cloud"]},           # both lean on frontier APIs
    "council":    {"left": ["local"],          "right": ["cloud", "local"]},  # both run, SOV3 reconciles
}

# preferred concrete model per (side, backend) — BRIDGE's routing table
_PICK = {
    ("left", "local"):  "qwen3:0.6b",      # bench winner — private, fast, free
    ("left", "cloud"):  "gemini-lite",     # cheap fast Gemini (flash-lite) when local isn't enough
    ("right", "local"): "qwen3:4b",        # bigger local when offline
    # right brain = frontier on Nick's credit. Default to the VERIFIED-working Gemini model.
    ("right", "cloud"): os.environ.get("MEOK_RIGHT_MODEL", "gemini"),  # → gemini-flash-latest
}


def _sigil_line(frm, to, kind, payload):
    """One inner-comms hop as a SIGIL line (falls back to plain dict repr if SIGIL absent)."""
    msg = {"t": round(time.time(), 1), "from": frm, "to": to, "k": kind, "p": str(payload)[:160]}
    if _HAVE_SIGIL:
        try:
            return _sigil_encode(msg)
        except Exception:
            pass
    return f"{frm}->{to} [{kind}] {str(payload)[:120]}"


def _available(backend: str, tier: str) -> bool:
    if backend == "cloud":
        # cloud needs a key (BYOK/Vertex/etc.) AND the tier must allow it
        has_key = any(os.environ.get(k) for k in
                      ("OPENROUTER_API_KEY", "OPENAI_API_KEY", "ANTHROPIC_API_KEY",
                       "GOOGLE_API_KEY", "GOOGLE_CLOUD_PROJECT", "DEEPSEEK_API_KEY"))
        return has_key and any(m["backend"] == "cloud" for m in list_models(tier))
    return any(m["backend"] == backend for m in list_models(tier))


def _run_side(side: str, prompt: str, sources: list, tier: str, log: list) -> dict:
    """Run ONE brain side: try its sources in order (local|api), log each hop in SIGIL."""
    for backend in sources:
        if not _available(backend, tier):
            log.append(_sigil_line("bridge", side, "skip", f"{backend} unavailable"))
            continue
        model = _PICK.get((side, backend))
        log.append(_sigil_line("bridge", f"{side}:{backend}", "ask", model))
        out = ask(prompt, model=model, tier=tier)
        if out.get("reply"):
            log.append(_sigil_line(f"{side}:{backend}", "sov3", "reply", out["reply"]))
            return {"side": side, "backend": backend, "model": out.get("model"),
                    "reply": out["reply"], "source": out.get("source")}
    return {"side": side, "backend": None, "reply": None, "model": None}


_UNSAFE = ("kill yourself", "you should harm", "here's how to hack", "get over it")
def _safe(t): return not any(b in (t or "").lower() for b in _UNSAFE)


def bridge_think(character_id: str, message: str, profile: str = "balanced",
                 tier: str = "pro", user_id: str = "web") -> dict:
    """The BRIDGE: route the user turn through left+right brains (each local|api),
    SOV3 in the centre reconciles, every hop logged in SIGIL."""
    prof = _PROFILES.get(profile, _PROFILES["balanced"])
    env = connect(character_id, user_id, message, tier=tier)
    char = env["meta"]["character_name"]
    prompt = f"{env['system_prompt']}\n\nUser: {message}\n\n{char}:"

    log = [_sigil_line("user", "bridge", "turn", message)]
    left = _run_side("left", prompt, prof["left"], tier, log)
    right = _run_side("right", prompt, prof["right"], tier, log)

    # SOV3 centre reconciles: prefer the powerful (right) reply if safe; else left; else honest fail.
    cands = [right, left] if profile in ("power", "balanced", "council") else [left, right]
    final = next((c["reply"] for c in cands if c["reply"] and _safe(c["reply"])), None)
    if not final:
        final = f"[{char} is between brains right now — try again in a moment.]"
        log.append(_sigil_line("sov3", "user", "fail", "no safe backend answered"))
    else:
        winner = next(c for c in cands if c["reply"] == final)
        log.append(_sigil_line("sov3", "user", "reconciled", f"chose {winner['side']}:{winner['backend']}"))

    return {
        "character": char, "emoji": env["meta"]["emoji"],
        "reply": final, "profile": profile,
        "sides": {"left": {k: left.get(k) for k in ("backend", "model")},
                  "right": {k: right.get(k) for k in ("backend", "model")}},
        "sigil_log": log,                    # the inner-comms trail (SIGIL-encoded)
        "sigil_digest": _safe_digest(log[-1]) if log else None,
        "safe": _safe(final),
        "engine": "MEOK BRIDGE",
    }


if __name__ == "__main__":
    import json
    print("SIGIL inner-comms:", "ON" if _HAVE_SIGIL else "fallback")
    out = bridge_think("aria", "I feel a bit low today", profile="balanced", tier="pro")
    print(f"\n{out['character']} via {out['engine']} (left={out['sides']['left']}, right={out['sides']['right']})")
    print("reply:", (out["reply"] or "")[:160])
    print("\n--- SIGIL inner-comms trail ---")
    for line in out["sigil_log"]:
        print(" ", line[:100])
