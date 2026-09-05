# Self-Sustaining Ecosystem Loop Map + Chain Order — extracted moves

**Source brief:** `~/Downloads/compass_artifact_wf-a993042a-9325-5170-9fae-954f638e748a_text_markdown.md`
**Mined:** 2026-09-05, TUI-5 (research-intake lane)
**Rule:** the `already live?` column is a PROBE RESULT taken at mine time, never an assumption.
Probe commands are in the Evidence column so a stranger re-runs them.

| move | lane-doable? | owner-gated? | already live? (probed) | evidence |
|---|---|---|---|---|
| **Integrity lockdown this week:** collapse to one lid string | partly | **YES** | board now 22·22·0 — lid consistent | `curl` /api/gspc |
| **Anchor `root.json` via OpenTimestamps** | no — CI | **YES** | **MISSING** — no `ots`/`anchor` field on deployed root | `curl -s https://councilof.ai/root.json` |
| Label or re-sign the **26 SWIFT placeholder cards** | no — signed bytes | **YES** | **UNMEASURED** — `SHA256-placeholder` not reproduced in `/interop/swift-registry.json`; cards live elsewhere | `curl -s https://councilof.ai/interop/swift-registry.json` |
| Close/annotate the correction record | no — corrections.ts | no | not probed | — |
| Market figures ($1.11M/mo, top merchant ~$3,120/mo) date from **~30 May 2026**, not September | n/a — must be dated when quoted | no | n/a | x402scan snapshot via note.com/Katomasa |
| Nine-product collapse → capabilities, not products | n/a — strategy | no | n/a | brief |

## The one number

The brief's \"What to Stop\" and \"The One Number\" sections both land on the same place as this
lane's own audit: **the anchor gap**. The estate signs its root and does not anchor it. Every
loop in the map that ends in \"verifiable by a stranger\" passes through that one missing field.
