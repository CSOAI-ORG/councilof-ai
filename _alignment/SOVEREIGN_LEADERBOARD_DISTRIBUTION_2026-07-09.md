# HOW MODELS ACTUALLY GET ON THE BOARDS — OpenRouter vs leaderboards, honestly
## The distribution + ranking path for the Sovereign merged model
### CSOAI Ltd · 2026-07-09 · Correcting the "list it and it auto-ranks" assumption

> Nick's question: register the model on OpenRouter — won't their test auto-show us high if we
> beat 1.6T models on tokens/speed, auto-appear on boards? HONEST ANSWER: no — that conflates
> three different things. This brief separates them and gives the REAL path to the boards.

---

## 1. THE THREE THINGS THAT ARE BEING CONFLATED

| Thing | What it actually is | Does it auto-rank you? |
|---|---|---|
| **OpenRouter** | An API MARKETPLACE / router — resells access to models. | NO. It's a storefront, not a judge. |
| **Benchmarks** (MMLU, SWE-bench, GPQA) | Fixed test sets YOU run and report. | NO. You run them; nobody runs them for you. |
| **Leaderboards** (LMArena, HF Open LLM Leaderboard) | Ranked boards — some human-vote, some auto-eval. | Only if you SUBMIT + they accept + it gets traffic/votes. |

**The core correction:** OpenRouter does not test your model, does not benchmark it, and does not
rank it against DeepSeek V4. It's a place to SELL access. Listing there gets you distribution, not
a score. The "auto-show high on boards" step does not exist.

## 2. WHAT OPENROUTER ACTUALLY DOES (and why it's still useful)

- It's an aggregator: users hit one API, OpenRouter routes to many providers' models.
- To be listed you must be a PROVIDER: host the model with a real inference endpoint (vLLM/TGI on
  your rented/owned GPU), meet uptime/latency/throughput SLAs, and apply.
- What it gives you: **distribution + real usage + a public per-model stats page** (tokens served,
  latency, price). That usage page is social proof, NOT a benchmark rank.
- "Beat 1.6T on tokens/speed": OpenRouter DOES show throughput + latency + price per model. If
  your 35B model is faster/cheaper than a 1.6T model (it will be — fewer active params), that is
  VISIBLE and it is a real selling point. But it's a cost/speed stat, not a capability rank.

## 3. HOW YOU ACTUALLY GET ON THE CAPABILITY BOARDS

Three real routes, in order of effort:

### A. HuggingFace Open LLM Leaderboard (the automatable one)
- Open your merged model's weights on HF Hub → submit to the Open LLM Leaderboard → their harness
  auto-runs a fixed benchmark suite (MMLU-Pro, GPQA, MATH, IFEval, etc.) → you get a public score.
- THIS is the closest to "auto-shows a score" — but you must (1) open the weights, (2) submit,
  (3) the score reflects THOSE benchmarks, not tokens/speed.
- A 35B merge will NOT beat a 1.6T model on raw capability benchmarks. It CAN win on
  capability-per-parameter / capability-per-£ — a different, honest, real claim.

### B. LMArena (the human-vote board)
- Anonymous head-to-head human votes → Elo rank. You submit the model; humans chat-battle it.
- No shortcut — it needs real capability + traffic. A niche governance model won't top a general
  board, but CAN win a DOMAIN board if one exists.

### C. Your OWN benchmark (the one that actually sells YOUR model)
- The Sovereign model's edge is NOT general capability — it's GOVERNED COMPLIANCE reasoning.
- Build a governance/compliance benchmark (from your charters + passport MCP), publish it, and
  show your model tops it. This is the honest, winnable board — because you define the axis you're
  actually best at, and back it with a reproducible test.

## 4. THE HONEST VERDICT ON "WILL IT SHOW HIGH?"

- On GENERAL capability boards (vs 1.6T DeepSeek): **no** — a 35B merge won't outrank a 1.6T
  foundation model on MMLU/SWE-bench. Parameter count still buys raw capability.
- On SPEED/COST (OpenRouter stats): **yes, visibly** — 35B-A3B (3B active) is far faster/cheaper
  than 1.6T. That's a real, listable advantage — but it's a cost stat, not a capability rank.
- On a GOVERNANCE/COMPLIANCE board you define: **yes, you can top it** — because you're the only
  one optimising for that axis, and CSOAI's frameworks make it credible.
- "List on OpenRouter → auto-ranks high on boards": **no such mechanism.** Listing = distribution.
  Ranking = separate submission to separate boards, each with its own rules.

## 5. THE REAL SEQUENCE (what to actually do)

1. Build + benchmark the merged model (the run-book) — PROVE it beats its parts first.
2. Open the weights on HF Hub (Apache-2 base makes this clean) → submit to HF Open LLM Leaderboard
   → get an honest public score. (This is the "auto-score" step that actually exists.)
3. List as a provider on OpenRouter for DISTRIBUTION + the speed/cost stats page (real selling
   point vs big models). Requires a hosted endpoint + SLA.
4. Publish YOUR governance benchmark + top it — the board where you actually win.
5. NEVER claim "beats DeepSeek V4" on general capability — claim what's true: faster, cheaper,
   governed, and best-in-class on compliance reasoning. That's a stronger, defensible story.

## HONESTY REGISTER
- OpenRouter = marketplace, not judge. No auto-benchmark, no auto-rank.
- HF Open LLM Leaderboard = the real auto-score path (open weights + submit).
- A 35B merge loses to 1.6T on raw capability; wins on speed/cost/param-efficiency + your domain.
- The winnable board is the one you define (governance/compliance) — real, honest, and yours.
- All of this is downstream of the model actually passing its own benchmark (Gate 1/2). No board
  matters if the merge doesn't beat its parts.

## RECOMMENDATION
Don't count on OpenRouter to rank you — it distributes, it doesn't judge. The honest board path
is: open the merged weights → HF Open LLM Leaderboard for a public score → OpenRouter for the
speed/cost stats + distribution → your own governance benchmark for the board you actually win.
Lead with "faster, cheaper, governed, best-at-compliance," never "beats the 1.6T on capability."

*Authored for Sir Nicholas Templeman. OpenRouter sells access, it doesn't award scores. Your win
isn't out-benchmarking a 1.6T giant — it's being faster, cheaper, governed, and best on the axis
you own. Prove it on a board you define.*
