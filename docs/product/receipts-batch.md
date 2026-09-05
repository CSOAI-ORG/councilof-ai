# Receipts batch (historical measurement leaves)

`receipts-batch` — derived from live endpoints on 2026-09-05T12:20:02Z.

> Doctrine: measurement, not certification. Verification is free forever;
> a grade is never sold. Nothing in this file is typed — every number below
> is read at generation time from the live server.

## 402 door
`https://councilof.ai/api/receipts/batch?from=2026-09-01&to=2026-09-05` — live status **402**
(6342 B) — the paid artefact sits behind the x402 rail; a settled receipt unlocks it.

## Free preview (must be non-empty)
`https://councilof.ai/api/receipts/batch?from=2026-09-01&to=2026-09-05&preview=1` — status **200**, **2047 bytes**, `sha256 d9ea85b9bb59ee92…`

```json
{
  "schema": "csoai.receipts.batch/0.1",
  "kind": "preview",
  "window": {
    "from": "2026-09-01T00:00:00Z",
    "to": "2026-09-05T00:00:00Z"
  },
  "count": 200,
  "matched": 927,
  "cap": 200,
  "truncated": true,
  "next_from": "2026-09-03T06:29:59Z",
  "span": {
    "first_as_of": "2026-09-01T00:00:00Z",
    "last_as_of": "2026-09-03T06:29:59Z"
  },
  "roots_in_window": 23,
  "roots_indexed_total": 29,
  "batch_sha256": "c9d2342e8037d8478
```

**DELIVERABLE.** The free preview answers with real bytes.

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
receipts corpus (preview shows counts + cap, not leaves).
