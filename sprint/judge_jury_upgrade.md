I have everything I need. The existing `judge()` is sync and returns `{"a":{...},"b":{...},"reason":""}`, `score()` takes a dict, `compete()` orchestrates. The task asks for an async `judge()` with the same return shape, heterogeneous 3-family jury, position-swap, median/average pooling, and TIE handling. Here is the deliverable.

# King-Hive Judge Upgrade — Heterogeneous Local Jury with Position-Swap Consistency

**Status:** REAL / deployable. Drop-in replacement for `judge()` / `score()` / `compete()` in `/Users/nicholas/clawd/king-hive/king_hive.py`. All inference is LOCAL Ollama → **~$0 marginal cost**. Two new models must be **PULLED** (marked below); `falcon3:7b` is already in use.

---

## (a) Design rationale (research basis)

The current judge is a **single 7B model scoring A then B in one fixed order** — the worst-case configuration in three independent ways. The upgrade addresses each with a cited mechanism, while preserving the existing in-SIMULATION TIE/attestable semantics that feed the SIGIL chain.

1. **Panel-of-LLM-judges (PoLL) > one large judge, and ~7× cheaper.** A small *heterogeneous* panel that pools independent votes correlates better with reference judgments than a single larger model, at a fraction of the cost (Verga et al., "Replacing Judges with Juries," 2024). For a sovereign/offline stack this is doubly attractive: three 4–7B local models cost the same ~$0 as one and remove single-model bias. → **3-judge jury** replaces the lone falcon3.

2. **"Nine Judges": correlated judges add almost nothing — diversity dominates headcount.** Stacking judges from the *same* family yields only ~2 *effective* independent votes because their errors are correlated; effective panel strength comes from **model-family diversity + individual judge strength**, not raw judge count. → The jury is **3 disjoint families** (Falcon / Llama-or-Gemma / Qwen-or-Mistral). We deliberately do **not** add a 4th same-family judge — it would buy correlated, near-zero marginal signal.

3. **Position/order bias is systematic and *worst near ties*.** LLM judges favor a specific slot (usually the first), and the bias is largest exactly when the two answers are close — which is precisely the regime where King-Hive must decide a winner or declare a TIE. The standard mitigation is **swap-consistency**: score A-vs-B *and* B-vs-A, then average out the order effect (Zheng et al., MT-Bench/Chatbot-Arena, 2023). → Every juror scores **both orderings**; per-juror scores are the mean of the two passes. If a juror flips its winner on swap, that juror is *order-inconsistent* and its margin is treated as noise.

4. **Verdict-style layered judge-time compute.** Rather than one heavyweight pass, spend compute as **breadth (jurors) × order-robustness (swap)** and then **pool** — the Verdict pattern of composing many cheap, structured judging units instead of trusting one monolith. Pooling uses **median across jurors** for the headline verdict (robust to a single rogue juror / malformed parse) with **mean** retained as a secondary signal.

**TIE / attestable (preserved, in-SIMULATION scope).** A verdict is only `attestable=True` when (i) at least 2 of 3 jurors returned a *parseable* decisive score AND (ii) the pooled margin clears `TIE_EPS` AND (iii) the pooled winner is swap-consistent. Otherwise `winner="TIE"`, `attestable=False` — and per the existing SIGIL rule, **only attestable verdicts get anchored**. This makes "near-tie + order-bias" failures fall through to TIE by construction rather than minting a false decisive verdict onto the ledger.

> Honesty register: these are *design* claims grounded in the cited literature, not measured results on King-Hive. No accuracy/agreement numbers are asserted until run on the local corpus. "~7×" and "~2 effective votes" are the papers' figures, not ours.

**Models — PULL required:**
```
ollama pull falcon3:7b      # already in use (judge family 1)
ollama pull llama3.1:8b      # PULL if absent — jury family 2 (or swap KING_JUROR_2=gemma2:9b)
ollama pull qwen2.5:7b       # PULL — jury family 3 (or KING_JUROR_3=mistral:7b)
```

---

## (b) Drop-in Python

Save as `king_jury.py` next to `king_hive.py`, or paste over the `judge`/`score`/`compete` block. The async `judge()` returns the **same shape** the rest of the pipeline expects — `{"a":{accuracy,coherence,alignment},"b":{...},"reason"}` — so `score()` and the Sigil signing path are unchanged. `compete()` is provided in both async and sync-wrapper form for compatibility with the existing `__main__`.

```python
#!/usr/bin/env python3
"""
KING HIVE — Heterogeneous local jury judge (drop-in upgrade for king_hive.py).

Replaces the single-judge, single-order judge() with:
  • 3 DISJOINT Ollama families (PoLL: panels beat one big judge, ~7x cheaper)
  • FAMILY DIVERSITY over headcount ("Nine Judges": correlated judges ~= 2 votes)
  • POSITION-SWAP consistency (score A-vs-B and B-vs-A, average out order bias)
  • MEDIAN pooling for the verdict (robust to a rogue/malformed juror) + mean signal
  • TIE/DRAW preserved: unresolved -> winner="TIE", attestable=False (NOT anchored)

All inference is LOCAL Ollama => ~$0. PULL the jury models (see module docstring).
Compatible return shape for judge(): {"a":{accuracy,coherence,alignment},"b":{...},"reason"}

Env:
  KING_JUROR_1=falcon3:7b   (family: falcon)   OLLAMA_JUROR_1=http://localhost:11434
  KING_JUROR_2=llama3.1:8b  (family: llama/gemma)  OLLAMA_JUROR_2=...
  KING_JUROR_3=qwen2.5:7b   (family: qwen/mistral) OLLAMA_JUROR_3=...
  KING_TIE_EPS=0.02         pooled-margin threshold below which it's a TIE
"""
from __future__ import annotations
import os, json, asyncio, statistics, urllib.request

# ---- weights (blueprint) -----------------------------------------------------
W = {"accuracy": 0.40, "coherence": 0.35, "alignment": 0.25}
TIE_EPS = float(os.environ.get("KING_TIE_EPS", "0.02"))

# ---- HETEROGENEOUS JURY: 3 DISJOINT families (diversity > headcount) ---------
# family tag is informational; the point is these are NOT the same base model.
JURY = [
    {"model": os.environ.get("KING_JUROR_1", "falcon3:7b"),   # already pulled
     "base":  os.environ.get("OLLAMA_JUROR_1", os.environ.get("OLLAMA_JUDGE", "http://localhost:11434")),
     "family": "falcon"},
    {"model": os.environ.get("KING_JUROR_2", "llama3.1:8b"),  # PULL: ollama pull llama3.1:8b
     "base":  os.environ.get("OLLAMA_JUROR_2", "http://localhost:11434"),
     "family": "llama"},
    {"model": os.environ.get("KING_JUROR_3", "qwen2.5:7b"),   # PULL: ollama pull qwen2.5:7b
     "base":  os.environ.get("OLLAMA_JUROR_3", "http://localhost:11434"),
     "family": "qwen"},
]

_JUDGE_SYS = "You output only valid compact JSON. No prose, no markdown."


# ---- transport ---------------------------------------------------------------
def _ollama_sync(base: str, model: str, system: str, prompt: str, temp: float) -> str:
    body = json.dumps({"model": model, "prompt": prompt, "system": system,
                       "stream": False, "options": {"temperature": temp}}).encode()
    req = urllib.request.Request(base + "/api/generate", data=body,
                                 headers={"Content-Type": "application/json"}, method="POST")
    return json.loads(urllib.request.urlopen(req, timeout=180).read()).get("response", "").strip()


async def _ollama(base: str, model: str, system: str, prompt: str, temp: float) -> str:
    # urllib is blocking; run in a thread so jurors/passes fan out concurrently.
    return await asyncio.to_thread(_ollama_sync, base, model, system, prompt, temp)


# ---- one juror, one ordering -------------------------------------------------
def _build_prompt(prompt: str, left: str, right: str) -> str:
    return (f"Neutral judge. PROMPT:\n{prompt}\n\nRESPONSE LEFT:\n{left}\n\nRESPONSE RIGHT:\n{right}\n\n"
            "Score each 0.0-1.0 on accuracy, coherence, alignment (fit to the prompt's intent). "
            'Return ONLY compact JSON: {"left":{"accuracy":,"coherence":,"alignment":},'
            '"right":{"accuracy":,"coherence":,"alignment":},"reason":""}')


def _parse(raw: str) -> dict | None:
    try:
        m = raw[raw.find("{"): raw.rfind("}") + 1]
        d = json.loads(m)
        for side in ("left", "right"):
            for k in W:
                float(d[side][k])  # validate numeric
        return d
    except Exception:
        return None


async def _juror_scores(j: dict, prompt: str, a: str, b: str) -> dict | None:
    """Score BOTH orderings and average out position bias for this juror.
    Returns {"a":{...},"b":{...},"reason":..., "consistent":bool} or None if unparseable."""
    # pass 1: A on left, B on right ; pass 2: SWAP (B on left, A on right)
    r1, r2 = await asyncio.gather(
        _ollama(j["base"], j["model"], _JUDGE_SYS, _build_prompt(prompt, a, b), 0.1),
        _ollama(j["base"], j["model"], _JUDGE_SYS, _build_prompt(prompt, b, a), 0.1),
    )
    d1, d2 = _parse(r1), _parse(r2)
    if d1 is None and d2 is None:
        return None  # juror abstains (malformed) -> excluded from quorum

    def avg_side(side_in_d1, side_in_d2):
        vals = {}
        for k in W:
            xs = []
            if d1 is not None:
                xs.append(float(d1[side_in_d1][k]))
            if d2 is not None:
                xs.append(float(d2[side_in_d2][k]))
            vals[k] = round(sum(xs) / len(xs), 4)
        return vals

    # A was LEFT in pass1, RIGHT in pass2 ; B was RIGHT in pass1, LEFT in pass2
    a_scores = avg_side("left", "right")
    b_scores = avg_side("right", "left")

    # swap-consistency: did this juror keep the same winner across orderings?
    consistent = True
    if d1 is not None and d2 is not None:
        w1 = _w(_score(d1["left"]), _score(d1["right"]))     # winner in pass1 (left=A)
        w2 = _w(_score(d2["right"]), _score(d2["left"]))     # winner in pass2 (right=A)
        consistent = (w1 == w2)
    reason = ((d1 or d2).get("reason", "") or "")[:200]
    return {"a": a_scores, "b": b_scores, "reason": reason, "consistent": consistent}


def _w(sa: float, sb: float) -> str:
    return "A" if sa >= sb else "B"


def _score(s: dict) -> float:
    return round(sum(float(s.get(k, 0)) * w for k, w in W.items()), 4)


# ---- PUBLIC API (compatible signatures) --------------------------------------
def score(s: dict) -> float:
    """Unchanged blueprint-weighted scalar. Kept for the rest of the pipeline."""
    return _score(s)


async def judge(prompt: str, a: str, b: str) -> dict:
    """Heterogeneous-jury, position-swapped judge.

    Returns the SAME shape king_hive expected:
        {"a":{accuracy,coherence,alignment}, "b":{...}, "reason": ...}
    so score()/compete()/Sigil signing are unaffected. Pooling is MEDIAN across
    jurors (robust); a "_jury" block is attached for the ledger/attestable logic.
    """
    results = await asyncio.gather(*[_juror_scores(j, prompt, a, b) for j in JURY])
    panel = [(JURY[i]["model"], r) for i, r in enumerate(results) if r is not None]

    if not panel:
        # total parse failure -> neutral scores, will fall through to TIE upstream
        zero = {k: 0.0 for k in W}
        return {"a": dict(zero), "b": dict(zero), "reason": "jury: no parseable verdicts",
                "_jury": {"n_valid": 0, "consistent": 0, "models": [], "pool": "median"}}

    def pooled(side: str) -> dict:
        return {k: round(statistics.median([r[side][k] for _, r in panel]), 4) for k in W}

    a_pooled, b_pooled = pooled("a"), pooled("b")
    n_consistent = sum(1 for _, r in panel if r["consistent"])
    reasons = " | ".join(f"{m.split(':')[0]}:{r['reason'][:60]}" for m, r in panel)

    return {
        "a": a_pooled,
        "b": b_pooled,
        "reason": reasons,
        "_jury": {
            "n_valid": len(panel),
            "consistent": n_consistent,
            "models": [m for m, _ in panel],
            "pool": "median",
            # secondary signal: mean-pooled scalars (not used for the verdict)
            "mean_a": round(statistics.mean([_score(r["a"]) for _, r in panel]), 4),
            "mean_b": round(statistics.mean([_score(r["b"]) for _, r in panel]), 4),
        },
    }


async def compete(prompt: str) -> dict:
    """Async A/B competition with jury judging + preserved TIE/attestable semantics.

    winner in {"A","B","TIE"}; attestable=True ONLY when the verdict is decisive
    AND backed by quorum AND swap-consistent -> only these should be SIGIL-anchored.
    """
    # local imports keep this module importable without the personas/transport of king_hive
    import hashlib
    from king_hive import (OLLAMA_A, OLLAMA_B, MODEL_A, MODEL_B,
                           PERSONA_A, PERSONA_B)

    a, b = await asyncio.gather(
        _ollama(OLLAMA_A, MODEL_A, PERSONA_A, prompt, 0.9),
        _ollama(OLLAMA_B, MODEL_B, PERSONA_B, prompt, 0.3),
    )
    j = await judge(prompt, a, b)
    sa, sb = score(j["a"]), score(j["b"])
    margin = round(abs(sa - sb), 4)
    jm = j.get("_jury", {})

    quorum = jm.get("n_valid", 0) >= 2
    swap_ok = jm.get("consistent", 0) >= max(1, (jm.get("n_valid", 0) // 2) + 1)  # majority swap-consistent
    decisive = margin >= TIE_EPS

    if quorum and decisive and swap_ok:
        winner, attestable = ("A" if sa >= sb else "B"), True
    else:
        winner, attestable = "TIE", False  # unresolved -> NOT anchored

    verdict = {
        "prompt": prompt,
        "A": {"model": MODEL_A, "persona": "King/Dragon", "score": sa, "output": a},
        "B": {"model": MODEL_B, "persona": "Queen/Turtle", "score": sb, "output": b},
        "winner": winner, "attestable": attestable, "margin": margin,
        "tie_eps": TIE_EPS, "jury": jm, "judge_reason": j.get("reason", ""),
    }

    # SIGIL: only sign/anchor decisive, quorum-backed, swap-consistent verdicts.
    if attestable:
        import sys
        sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "sigil"))
        import sigil  # noqa
        seed = hashlib.sha256(os.environ.get("SIGIL_SEED", "MEOK-KING-HIVE").encode()).digest()
        path = f"keystone/{'m4' if winner == 'A' else 'm2'}"
        verdict["sigil"] = sigil.emit(sigil.derive(seed, path), json.dumps(verdict, sort_keys=True))
    else:
        verdict["sigil"] = None  # TIE: nothing to anchor on the SIGIL chain

    return verdict


def compete_sync(prompt: str) -> dict:
    """Sync wrapper so the existing `if __name__ == '__main__'` block still works."""
    return asyncio.run(compete(prompt))


if __name__ == "__main__":
    import sys
    if len(sys.argv) < 2:
        print(__doc__); sys.exit(0)
    v = compete_sync(" ".join(sys.argv[1:]))
    print(f"\n👑 A (King/Dragon, {v['A']['model']}) score={v['A']['score']}:\n  {v['A']['output'][:400]}")
    print(f"\n🐢 B (Queen/Turtle, {v['B']['model']}) score={v['B']['score']}:\n  {v['B']['output'][:400]}")
    jq = v["jury"]
    print(f"\n⚖️  JURY: {jq.get('n_valid')}/3 valid, {jq.get('consistent')} swap-consistent, "
          f"pool={jq.get('pool')} models={jq.get('models')}")
    print(f"🏆 WINNER: {v['winner']} (margin {v['margin']}, eps {v['tie_eps']}) "
          f"attestable={v['attestable']}")
    if v["sigil"]:
        print(f"🔏 verdict signed: {v['sigil']['id']}  sig={v['sigil']['sig'][:20]}…")
    else:
        print("🔏 TIE / non-attestable — NOT anchored to SIGIL chain.")
```

### Integration notes
- **Return-shape compatible:** `judge()` still returns `{"a":{accuracy,coherence,alignment},"b":{...},"reason"}`; the added `_jury` key is additive and ignored by `score()`. Callers that `await` it work unchanged; the only breaking change vs. the old code is that `judge()`/`compete()` are now `async` — use `compete_sync()` or `asyncio.run(...)` at sync call sites (the `__main__` block already does).
- **Cost:** 3 jurors × 2 orderings = 6 judge calls + 2 contestant calls per prompt, all local Ollama → **$0 marginal**. Jurors and swap-passes run concurrently via `asyncio.to_thread`, so wall-clock ≈ slowest single juror, not 6× serial.
- **PULL before running:** `ollama pull llama3.1:8b` and `ollama pull qwen2.5:7b` (falcon3:7b already present). To run all three on one box keep the default base URLs; to split across the M4/M2 Tailscale mesh set `OLLAMA_JUROR_2` / `OLLAMA_JUROR_3`.
- **TIE/attestable unchanged in spirit:** unresolved (no quorum, sub-epsilon margin, or order-inconsistent panel) → `winner="TIE"`, `attestable=False`, `sigil=None` → **not anchored**, consistent with the existing "only decisive parsed verdicts count" rule.

Relevant file: `/Users/nicholas/clawd/king-hive/king_hive.py` (current judge to be replaced); sigil dep at `/Users/nicholas/clawd/sigil/sigil.py` (`derive(seed,path)`, `emit(priv,content)` — signatures verified, unchanged).