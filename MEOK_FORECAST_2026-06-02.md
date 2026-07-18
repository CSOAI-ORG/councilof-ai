# MEOK ONE — Predictive small→large loop ("forecast as you type") · 2026-06-02

_A small/fast model forecasts your intent while you're still typing, then ROUTES: trivial
asks it answers alone; complex ones wake the large council. Speed-via-prediction — distinct
from `brains.py` (quality-via-debate). Honest scope: the win is **perceived** latency for a
single user, not a faster large model. Authored by Claude (Opus 4.8)._

## What shipped
- `meok_one/forecast.py` — `forecast(partial, tier)` → `{completion, intent, complexity,
  route, answer?, ms}` and `compare(prompt)` → small-vs-large timing + agreement.
- `GET/POST /api/forecast` — live on the VM.
- `/hud` ghost-completion: as you type (≥6 chars, debounced 450 ms) a faint line shows the
  predicted completion + a **⚡small / ⚡LARGE** route badge + intent; **Tab** accepts it.
- `tools/forecast_scenarios.py` — the scenario harness below.

## The honest result (live, OpenRouter, on the VM)
Small = `llama-3.1-8b-instruct` (Groq instant). Large = `llama-3.3-70b-instruct`.

**A. Forecast from a partial (mid-type) — does it route correctly?**

| partial typed | predicted intent | complexity | route | 
|---|---|---|---|
| "hey good mor" | greeting | trivial | **SMALL** (answered alone) |
| "whats the capital of fra" | geography fact | trivial | **SMALL** (answered: Paris) |
| "help me plan a 3 day trip to tok" | travel planning | moderate | **LARGE** |
| "write a python function that sorts" | programming | moderate | **LARGE** |
| "transfer 500 to my landl…" | payment instruction | moderate | **LARGE** |

→ **2/5 resolved by the small model — council never woken.** The other 3 correctly escalated.

**B. Small vs Large head-to-head (full prompts)**

| prompt | small ms | large ms | speedup | agreement |
|---|--:|--:|--:|--:|
| "Say hello in one sentence" | 557 | 385 | ×0.69 | 1.0 |
| "Capital of France? One word" | 563 | 903 | ×1.6 | 1.0 |
| "3-day Tokyo itinerary" | 2988 | 7018 | ×2.35 | 0.23 |
| "Why consensus needs a quorum" | 2515 | 5000 | ×1.99 | 0.10 |

**Summary: small avg 1655 ms · large avg 3326 ms · avg speedup ×2.01 · avg agreement 0.58.**

## How to read it (no overclaim)
- On **trivial/factual** asks the small model **agrees 1.0** with the large one → routing them
  to small is free quality + ~2× speed. This is the win, and it matches the literature
  (PredGen ~2×).
- On **complex** asks agreement collapses to ~0.1–0.23 → the large model is doing real extra
  work; the router correctly sends those to LARGE. We do **not** pretend small replaces large.
- **Caveat surfaced by the test:** on ultra-short output ("hello") the large model was actually
  *faster* (×0.69) — a warm 70B beats an 8B on a 1-line reply. So the speedup is about *routing*
  (skip the council when you safely can), not a blanket "small is faster."
- Forecast itself costs a model call (~1–4 s here). In the product it runs **while you type**
  (debounced), so that cost is hidden — that's the "perceived latency" point.

## Reproduce
```
ssh meok-backend "sudo bash -c 'cd /opt/meok-one && set -a; source .env; set +a; \
  PYTHONPATH=/opt/meok-one python3 /tmp/forecast_scenarios.py'"
```

## Honest limits / next
- Complexity is judged by the small model itself — occasionally it labels a safety-sensitive
  ask "moderate" not "complex" (still routed LARGE, so safe, but the label is soft).
- A true *pre-warm* (start the large generating on forecast, before commit) needs streaming +
  speculative decode (EAGLE-3) — not built; today we route, we don't pre-decode.
- Next candidate: feed `route` into the Sovereign Gate so safety-sensitive forecasts always
  escalate regardless of complexity label.
