# 📊 SOV33 real evals — correctness-graded reasoning (2026-07-11)

Measured accuracy on the **Groq-wired brain** (`llama-3.3-70b-versatile` via `sov33_compute`).
These are **real, correctness-graded numbers** — they replace every parameter-sum / "9.9T beats
GPT-4" claim with something defensible.

| Benchmark | Sample N | Correct | Accuracy | Grading |
|---|---|---|---|---|
| **GSM8K** (grade-school math) | 8 | 7 | **0.875** | exact final-integer match (canonical `#### N`) |
| **MMLU** (multiple-choice knowledge) | 8 | 8 | **1.000** | A/B/C/D letter match |
| **IFEval** (instruction-following) | 5 | 5 | **1.000** | programmatic constraint check |
| **Overall** | **21** | **20** | **0.952** | — |

## Honesty register (carry these caveats)
- **Small curated SAMPLES of real benchmark items**, not the full HF datasets — they establish a real
  accuracy *floor*, not a leaderboard score. Scale N with the full sets when disk allows.
- GSM8K first ran 0.375 under a naive last-integer grader; that was a **grading artifact**, not model
  capability. With the canonical `#### N` protocol it's **0.875**, consistent with llama-3.3-70b's
  published ~90%. The 1 miss is a deliberately tricky item.
- This measures the **wired brain (Groq tier)**, i.e. what SOV33 actually reasons with today — not a
  bespoke SOV33 model. The value is: the sovereign's reasoning is now a *known, defensible quantity*.
- **Do not** convert these into parameter-sum or "beats X" claims. Report as: "SOV33's reasoning tier
  (llama-3.3-70b via the verified pool) scores 0.875 GSM8K / 1.0 MMLU / 1.0 IFEval on curated samples."

## Repro
`/opt/homebrew/bin/python3.11 ~/clawd/_compute/sov33_evals.py` → `sov33_evals_results.json`.
Backend routes through `sov33_compute.infer` (Groq default). ~45 s for the full sample suite.
