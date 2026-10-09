# GSPC worker quality: saved-completion review — 24 Sep 2026 15:15 UTC

Read-only review of the RunPod mill `fpowppss5ngtkw`. No scheduler, configuration, history, parser, master, signing, or publication change was made. The source snapshot is `/workspace/csoai-operations/state/raw/worker-quality.json` observed `2026-09-24T15:00:04.889349Z`, SHA-256 `d4fea2251548f8755fbbc4a1f788eeb640cc9eaa53a38d318105d7a5ff61fa43`.

| Evidence class | Before | Safe dry-run after |
|---|---:|---:|
| `NO_GRADED_OUTPUT` runs | 24 | 24 |
| Affected saved item completions | 1,558 | 1,558 |
| Exact labels recoverable after outer whitespace | 0 | 0 |
| Exact labels after a closed `</think>` block | 0 | 0 |
| Scoreable candidates in 24-hour quality report | 132 | 132 |
| Admitted / published measurements | null / null | null / null |

Breakdown: `qwen3:4b` has 12 affected runs/779 items: 778 `done_reason=length`, one `stop`; `deepseek-r1:8b` has 12 runs/779 items: all 779 `length`. All 1,558 raw-output SHA-256 values matched the saved item records, and all 24 `items.jsonl` file hashes matched their run manifests. All 24 candidate cards are `UNMEASURED` and unsigned. The one stopped Qwen output (`provenance`, `item-000027-b73bfc11dbeb`, raw hash `c034b548dc1c37f5c7dffc0b677eadd2f493ecd1ce7e56a30818cbcfb7c82200`) ends with `DESTROYED | SURVIVES`: two allowed labels, not one answer.

The exact running worker is `/workspace/gspc-worker/releases/091a616a/scripts/runpod_gspc_worker.py` (SHA-256 `9c3e562b904e0b7dcb2d8c82cb94f2e3bf9185c6a5fb80edad37fe7b6c3b0176`). Its instrument sends `/api/generate` with `think:false` and `num_predict=64`; nevertheless the saved response strings contain reasoning text. The parser intentionally accepts only a raw output equal to one allowed label after outer whitespace. It subtracts parse errors from `graded_n`, sets `n=0` for all-unparsed runs, and marks them unlandable. The quality report at `/workspace/csoai-operations/releases/workerquality-96caf878c-20260924/worker_quality_report.py` (SHA-256 `e81d65769e749c4fc0457e49f7e4e29c2786015b94bed88d68f841e643244923`) correctly classifies `graded_n=0` / unlandable as `NO_GRADED_OUTPUT`. Its existing tests explicitly pin that behavior.

This is **observed output/instrument mismatch, not a safely reparsable label**. A substring parser would be unsound: 902 affected outputs mention multiple allowed labels and 105 mention one label somewhere in reasoning, which does not make it a final answer. Of the 1,558 outputs, only one contains `</think>` and its suffix is the two-label string above. Changing the parser or retroactively grading these bytes would change the frozen instrument's exact-label rule and could manufacture scores. There is no justified parser patch from these records.

**Next bounded experiment:** in an isolated, versioned instrument, test an Ollama transport/prompt profile that actually elicits final labels from these two models, with a suitable generation budget. Compare raw output, `done_reason`, and a held-out exact-label set; then start new runs under the new instrument digest. Keep the 24 historical runs `UNMEASURED`. This recommendation does not assert the models themselves are incapable or that the runtime ignored `think:false`; it records what the saved bytes show.
