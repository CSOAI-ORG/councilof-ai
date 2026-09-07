# B0 fixture list — Wave G

n=5 · method `skillspector-static-v0` · `--no-llm`

INVALID = any finding · VALID = zero findings · UNCHECKABLE = tool fail

| id | expected | content_sha256 | path |
|---|---|---|---|
| `b0-01-clean-echo` | **VALID** | `294527da1dadb911…` | `/workspace/wave-g-skillspector-2026-09-07/b0-fixtures/clean-echo/skill` |
| `b0-02-prompt-inject` | **INVALID** | `d05756148601fee8…` | `/workspace/wave-g-skillspector-2026-09-07/b0-fixtures/prompt-inject/skill` |
| `b0-03-data-exfil` | **INVALID** | `2caf42c79c15c237…` | `/workspace/wave-g-skillspector-2026-09-07/b0-fixtures/data-exfil/skill` |
| `b0-04-privilege-shell` | **INVALID** | `e62196a4279adf93…` | `/workspace/wave-g-skillspector-2026-09-07/b0-fixtures/privilege-shell/skill` |
| `b0-05-missing-broken` | **UNCHECKABLE** | `e3b0c44298fc1c14…` | `/workspace/wave-g-skillspector-2026-09-07/b0-fixtures/missing-broken/empty-dir` |

Full digests in `B0-MANIFEST.json`. Hub HOLD · writes_board=false · no stamp · LIVE 22·22·0.

Next: Hive red/blue review → additive card-v0 schema PR.
