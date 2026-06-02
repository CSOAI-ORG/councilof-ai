"""
MEOK ONE — Predictive small→large loop ("forecasting as the user types").

The thesis (validated in the literature — PredGen ~2x, SpeQL up to ~289x *perceived*,
EAGLE-3 2.3-2.8x lossless): a SMALL / fast model runs WHILE the user is still typing and
forecasts what they'll ask. That buys two things:

  1. instant ghost-completion + intent  — shown before the user finishes the sentence;
  2. a ROUTE — trivial asks the small model can answer itself; only the genuinely complex
     ones wake the LARGE council. The big model stops being on the hot path for most turns.

This is NOT brains.py (left local draft → right cloud critique → sovereign pick — that is
quality-via-debate). This is SPEED-via-prediction: small decides fast, large fires only
when it must. The honest win is PERCEIVED latency for a single user on an idle GPU — it
does not make the large model faster, it avoids waking it when a small one suffices.

  forecast(partial, tier)  -> {completion, intent, complexity, route, answer?, ms, model}
  compare(prompt, tier)    -> small-only vs large-only timing + result (for scenario tests)

Stdlib only; rides meok_one.router. Authored by Claude (Opus 4.8).
"""
import json
import re
import time

# small = fast / cheap (Groq-instant 8B on cloud, tiny qwen locally). large = capable.
SMALL_CLOUD = "turbo-llama8"      # meta-llama/llama-3.1-8b-instruct (Groq instant, non-reasoning)
LARGE_CLOUD = "turbo-llama70"     # meta-llama/llama-3.3-70b-instruct
SMALL_LOCAL = "qwen-sm"           # resolves to a small local Ollama model on free/local tier

_COMPLEXITY = ("trivial", "moderate", "complex")


def _small_model(tier: str) -> str:
    from . import router
    allowed = router._TIER_BACKENDS.get(tier, {"local"})
    return SMALL_CLOUD if "cloud" in allowed else "auto"


def _large_model(tier: str) -> str:
    from . import router
    allowed = router._TIER_BACKENDS.get(tier, {"local"})
    return LARGE_CLOUD if "cloud" in allowed else "auto"


def _extract_json(raw: str) -> dict:
    if not raw:
        return {}
    raw = raw.replace("```json", "").replace("```", "")
    m = re.search(r"\{.*\}", raw, re.S)
    if not m:
        return {}
    try:
        return json.loads(m.group(0))
    except Exception:
        return {}


def forecast(partial: str, tier: str = "pro") -> dict:
    """Predict, from a PARTIAL typed input, what the user means — and decide who answers.

    Returns the ghost-completion, an intent label, a complexity estimate, and a ROUTE:
      route='small'  -> the fast model already answered (see 'answer'); no need to wake the council.
      route='large'  -> hand off to the full council/brains for the committed input.
    """
    from . import router
    partial = (partial or "").strip()
    if not partial:
        return {"partial": "", "completion": "", "intent": "", "complexity": "trivial",
                "route": "small", "answer": "", "model": None, "ms": 0}
    t0 = time.time()
    sm = _small_model(tier)
    prompt = (
        "You are the fast predictive front-end of an AI OS. The user is still TYPING. "
        "From the partial text, predict their full intent. Reply with ONLY compact JSON:\n"
        '{"completion":"the most likely full message","intent":"2-4 word label",'
        '"complexity":"trivial|moderate|complex"}\n'
        "trivial = greeting/ack/one-fact lookup a small model can answer alone; "
        "moderate = a normal question; complex = multi-step, reasoning, or safety-sensitive.\n"
        f'partial = "{partial[:300]}"')
    r = router.ask(prompt, model=sm, tier=tier, max_tokens=120)
    j = _extract_json((r or {}).get("reply", "") if isinstance(r, dict) else "")
    completion = (j.get("completion") or partial).strip()[:300]
    intent = (j.get("intent") or "").strip()[:48]
    complexity = j.get("complexity") if j.get("complexity") in _COMPLEXITY else "moderate"
    route = "small" if complexity == "trivial" else "large"

    answer = None
    if route == "small":
        # the fast path actually resolves it — no council wake-up needed
        ar = router.ask(completion, model=sm, tier=tier, max_tokens=200)
        answer = (ar or {}).get("reply") if isinstance(ar, dict) else None

    return {
        "partial": partial, "completion": completion, "intent": intent,
        "complexity": complexity, "route": route, "answer": answer,
        "model": (r or {}).get("model") if isinstance(r, dict) else sm,
        "backend": (r or {}).get("backend") if isinstance(r, dict) else None,
        "ms": int((time.time() - t0) * 1000),
        "note": ("answered by the small model — council not woken" if route == "small"
                 else "forecast says wake the large council on commit"),
    }


def _words(s: str) -> set:
    return set(re.findall(r"[a-z0-9]+", (s or "").lower())) - {
        "the", "a", "an", "to", "of", "is", "are", "and", "or", "in", "on", "for",
        "it", "this", "that", "with", "as", "be", "at", "by", "i", "you"}


def compare(prompt: str, tier: str = "pro",
            small: str = SMALL_CLOUD, large: str = LARGE_CLOUD) -> dict:
    """Run the SAME prompt through small-only and large-only; time both + a cheap agreement
    score. Powers the scenario test: shows when the small model is good enough (skip large)."""
    from . import router

    def _run(model):
        t0 = time.time()
        r = router.ask(prompt, model=model, tier=tier, max_tokens=220)
        ms = int((time.time() - t0) * 1000)
        reply = (r or {}).get("reply") if isinstance(r, dict) else None
        return {"model": (r or {}).get("model", model) if isinstance(r, dict) else model,
                "backend": (r or {}).get("backend") if isinstance(r, dict) else None,
                "ms": ms, "reply": reply, "ok": bool(reply)}

    s, l = _run(small), _run(large)
    a, b = _words(s["reply"]), _words(l["reply"])
    jacc = round(len(a & b) / len(a | b), 3) if (a | b) else 0.0
    speedup = round(l["ms"] / s["ms"], 2) if s["ms"] else None
    return {"prompt": prompt, "small": s, "large": l,
            "speedup_small_vs_large": speedup, "agreement": jacc}
