# Axis-by-Axis — From the Live Register to What Actually Pays

**Source brief:** `~/Downloads/compass_artifact_wf-4ebedca2-079b-50de-bd91-228df2fd2b49_text_markdown.md`
**Mined:** 2026-09-05, TUI-5 (research-intake lane)
**Rule:** the `already live?` column is a PROBE RESULT taken at mine time, never an assumption.
Probe commands are in the Evidence column so a stranger re-runs them.

| move | lane-doable? | owner-gated? | already live? (probed) | evidence |
|---|---|---|---|---|
| **Door A — Provenance / C2PA \"check-this-asset\"** (asset_hash + fields) | no — functions/ | no | `c2pa` slug exists; per-object door not probed | slug probe |
| **Door B — Token/issuer/contract state \"check-this-thing\"** (XRPL reader + ChainFacts) | no — functions/ | no | `/api/xrpl` 200 | `curl` /api/xrpl |
| **Discovery listings to file day one:** CDP Bazaar discovery index `api.cdp.coinbase.com/platform/v2/x402/discovery`, x402scan, agentic.market/x402-list | **partly** — a door recording listing state is lane-doable | **YES** (the filings) | **NOT RECORDED** anywhere in the estate | slug probe |
| Per-object pricing model (per-asset, per-thing) | no — price surfaces are gate-controlled | **YES** | doctrine: no public prices; price lives in the 402 challenge | `scripts/price-gate.mjs` |

## Doctrine note

The brief names per-object dollar figures. **Those must not be published as static bytes** —
`price-gate.mjs` blocks a numeric `price*` key anywhere under `public/**.json`, and it blocked
a production deploy on exactly that on 2026-09-05 (60 findings). Price belongs in the live
402 challenge at request time. Any door written from this brief carries the SKU id and the
challenge URL, never the number.
