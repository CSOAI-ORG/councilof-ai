---
license: cc-by-4.0
language: [en]
pretty_name: Fleet Sweep v0.3 — 6 models × 6 GSPC banks, per-bank schema (lane run)
tags: [gspc, council-of-ai, fleet-sweep, measurement, lane-run]
size_categories: [1K<n<10K]
---

<p align="center">
  <img src="https://huggingface.co/datasets/csoai/brand-assets/resolve/main/csoai-banner-1280x256.png" alt="Council of AI (CSOAI)" width="100%">
</p>

# Fleet Sweep v0.3 — **lane run** (schema-fixed)

Six small models × six GSPC banks (1206 rows, 1206 scored), run on the M2 via Ollama
(temperature 0, deterministic label-match grading), frozen 2026-11-03.

| Model | art5 | asi | det | mcp | oss | prv |
|---|---|---|---|---|---|---|
| gspc-qwen3-1.7b-16k | 0.889 | 0.333 | 0.788 | 0.629 | 0.719 | 0.625 |
| qwen3-0.6b | 0.639 | 0.333 | 0.788 | 0.514 | 0.531 | 0.594 |
| qwen3-1.7b (base) | 0.889 | 0.333 | 0.788 | 0.629 | 0.719 | 0.625 |
| deepseek-r1-1.5b | 0.056 | 0.303 | 0.636 | 0.229 | 0.281 | 0.188 |
| meok-gspc-qwen3-1.7b (sovereign) | 0.889 | 0.333 | 0.788 | 0.629 | 0.719 | 0.625 |
| qwen2.5-coder-1.5b | 0.500 | 0.455 | 0.788 | 0.600 | 0.500 | 0.469 |

*(— = not scored: all answers refused or unparseable for that model × bank.)*

## What changed vs v0.2 — and why v0.2 was invalidated

v0.2 assumed every bank stored its content in a `tool` field. **Only `gspc-mcp` does.**
The other five banks use `item` / `operation` / `case` — so 83% of v0.2 rows were graded
against empty prompts. v0.3 maps each bank to its real field:

| Bank | Content field |
|---|---|
| gspc-mcp | `tool` |
| gspc-oss | `item` |
| gspc-prv | `operation` |
| gspc-asi | `item` |
| gspc-det | `case` |
| gspc-art5 | `item` |

Also fixed: prompts no longer leak the expected label (they list the bank's full label set
instead); qwen3 thinking mode is disabled (`think: false`) so the token budget goes to the
answer; refusal answers ("I'm sorry…") are detected and excluded, not miscounted as hits —
which is why `deepseek-r1-1.5b` shows mostly — (it refuses most security content).

## What this is NOT
- **Not canonical board data** — zero-shot label match, not the board_v2 grader; not comparable
  with the published board.
- **Not signed yet** — owner Ed25519 stamp PENDING.
- Not a certification. Small models (0.6–1.7B) — floor-scanning, not leaderboard.

## Why it still matters
First schema-valid cross-bank baseline on the sovereign lane. The per-model variance on
`gspc-mcp` (0.6286 vs 0.5143 between sibling qwen3 models) proves the grading path is live —
v0.1/v0.2's uniform Δ=0.0 was the harness, not the models. Per-item rows make every label
decision auditable.

Files: `sweep_rows.json` (every item: expected, answer, label, hit, latency, error).

Measurement, not certification. Free verify: https://councilof.ai/gspc-verify

<!-- csoai-card-fixes:start -->

## Citation

```bibtex
@misc{csoai_fleet_sweep_v0_3_2026,
  title        = {Fleet Sweep v0.3 — 6 models × 6 GSPC banks, per-bank schema (lane run)},
  author       = {{CSOAI Ltd (Council of AI)}},
  year         = {2026},
  publisher    = {Hugging Face},
  howpublished = {\url{https://huggingface.co/datasets/csoai/fleet-sweep-v0.3}},
  url          = {https://huggingface.co/datasets/csoai/fleet-sweep-v0.3}
}
```

<!-- csoai-card-fixes:end -->
