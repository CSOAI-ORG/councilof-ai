# Public Estate Audit — extracted moves

**Source brief:** `~/Downloads/compass_artifact_wf-2049ce4f-c3d6-5fd4-99c8-a2d6ade56cf8_text_markdown.md`
**Mined:** 2026-09-05, TUI-5 (research-intake lane)
**Rule:** the `already live?` column is a PROBE RESULT taken at mine time, never an assumption.
Probe commands are in the Evidence column so a stranger re-runs them.

| move | lane-doable? | owner-gated? | already live? (probed) | evidence |
|---|---|---|---|---|
| Publish the **count grammar** wherever a number appears: \"14 behavioural + 8 deterministic-fact = 22\" | partly (docs) | no | **LIVE** — `/api/gspc` `totals.count_grammar` already carries it | `curl -s https://councilof.ai/api/gspc` |
| Resolve the axis/model count \"one lid\" concern | n/a | no | **LIVE** — board reads 22 axes · 22 measured · 0 unmeasured | `curl -s https://councilof.ai/api/gspc` |
| Package registries / directories presence | no | **YES** | npm 200, PyPI `csoai` 200, MCP registry 330 servers | registry probes |
| Standards participation (IETF) | no | **YES** | `scitt` door exists | slug probe |
| Correction record C-2026-0902-10 | no — corrections.ts outside area | no | not probed | — |

## Mostly already closed

This brief is the shortest and the most already-done. Its central ask — publish the count
grammar — is **already served by the API**: `/api/gspc` → `totals.count_grammar` states that
both counts are DERIVED from the axis array and never typed. The board itself now reads
22·22·0, so the \"one lid\" concern the brief opens with no longer reproduces.
