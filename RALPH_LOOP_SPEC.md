# The Ralph Loop — converge-until-stable improvement (spec)

The mechanism that turns "track records" into **constant improvement of all work** — branding, content, demos, bridges, code. Sits on the existing self-improve loop (telemetry → queen → King-ratify → Ed25519-sign) and uses the `model-scoreboard-mcp` track records.

## The loop (per work item)
```
input: work_item {type, task, current_output, current_score}
state: dry = 0
repeat:
  1. GENERATE  — ask the top-K models for `task` (from scoreboard best_for) to improve current_output
  2. SCORE     — each candidate scored (rubric per work-type: brand-fit, accuracy, conversion, lint…)
                 + record_result(model, task, score)  → feeds the scoreboard
  3. VOTE      — bft_vote(task, candidates): score-weighted, Byzantine-tolerant (needs > half)
                 no majority → escalate to the full council (don't promote a coin-flip)
  4. DECIDE    — if winner.score > current_score + ε:  promote, current = winner, dry = 0
                 else: dry += 1
  5. ATTEST    — on promote: King ratifies → Ed25519-sign → hash-chain to the ledger → OS verifies on-device
until dry >= K  (converged — no improvement in K rounds)  OR  budget exhausted
```

## Why it's "ralph"
Repeatedly re-run the agents on the same task until the score plateaus — the cheap, brutal, *effective* convergence pattern. No human in the inner loop; the **rubric + BFT vote + King-ratify gate** are the selection pressure. Nick's oversight = the King gate on promotion (nothing ships unverified).

## Parameters (the "frequency" you asked about — all tunable)
- **K** (dry rounds to declare converged) — patience.
- **ε** (min score gain to promote) — anti-churn threshold.
- **cadence** — how often the loop runs per work item (continuous / on-change / scheduled). This *is* the "frequency."
- **K-models** — how many models debate each round (the "vibration": more models = richer back-and-forth, slower).

## Per-work-type rubrics (what "better" means)
| Work type | Scored on |
|---|---|
| Branding / guidelines | brand-fit, consistency, on-voice |
| Content | accuracy, clarity, engagement, on-message |
| Demos / distribution | conversion, completeness, works-E2E |
| Bridges / code | tests pass, lint, perf, governance flags |
| Governance classification | matches framework + council agreement |

## Honest status
- **Engine pieces exist:** `model-scoreboard-mcp` (record/leaderboard/best_for/bft_vote) + the MEOK OS self-improve loop (telemetry→queen→King-ratify→Ed25519). The Ralph Loop is the orchestration that chains them.
- **Goes live when the runtime runs** (GCP VM `api-server` — the LLM-call + retrain backend). Until then it's a spec + working scoreboard, not an autonomous loop. No overclaim.
