# Signed data feed (assembly + cadence)

`signed-data-feed` — derived from live endpoints on 2026-09-06T05:00:05Z.

> Doctrine: measurement, not certification. Verification is free forever;
> a grade is never sold. Nothing in this file is typed — every number below
> is read at generation time from the live server.

## 402 door
`https://councilof.ai/api/eunomia-data?feed=1` — live status **402**
(4594 B) — the paid artefact sits behind the x402 rail; a settled receipt unlocks it.

## Free preview (must be non-empty)
`https://councilof.ai/api/eunomia-data` — status **200**, **1605 bytes**, `sha256 c004653c445552d5…`

```json
{
  "schema": "csoai.eunomia-data/0.2",
  "kind": "preview",
  "lane": "commercial-data",
  "data_only": true,
  "streams": {
    "signals": {
      "rows": 13,
      "schema": "csoai.signals-index/0.1",
      "href": "https://councilof.ai/signals/_index.json",
      "each": "https://councilof.ai/signals/<axis>.signed.json"
    },
    "first_fine_watch": {
      "signed": true,
      "kid": null,
      "href": "https://councilof.ai/api/fines"
   
```

**DELIVERABLE — free preview answers with real bytes.** Advertised.

## What the buyer receives (from the deliverable field)
See the live catalog body in the appendix of this doc's generator run,
or ask the 402 door. The deliverable is assembled server-side from
already-signed cards; the bundle never manufactures grades.

## Verify path
- Board/verify: https://councilof.ai/gspc-verify
- Merkle proof for any leaf: `https://councilof.ai/api/proof?sha=<64-hex>`
- Public root: https://councilof.ai/root.json (`verify.include` checks the leaf)
- verification is free forever; a grade is never sold

## Ledger it feeds
eunomia streams (signals index, First-Fine Watch) + public-root leaves.
