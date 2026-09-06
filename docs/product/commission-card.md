# Commission a signed card (request-attestation)

`commission-card` — derived from live endpoints on 2026-09-06T05:00:05Z.

> Doctrine: measurement, not certification. Verification is free forever;
> a grade is never sold. Nothing in this file is typed — every number below
> is read at generation time from the live server.

## 402 door
`https://councilof.ai/api/request-attestation?subject=csoai&axis=honesty` — live status **402**
(4676 B) — the paid artefact sits behind the x402 rail; a settled receipt unlocks it.

## Free preview (must be non-empty)
`https://councilof.ai/api/request-attestation` — status **402**, **4592 bytes**, `sha256 ce7daf22e31f43da…`

```json
{
  "x402Version": 2,
  "error": "Payment required",
  "resource": {
    "url": "https://councilof.ai/api/request-attestation",
    "description": "Request attestation (RAS): commission a signed card-v0 receipt for one subject on the frozen bank — re-serves existing signed measurement cards, never invents a score. Measurement, not certification. 22 axes measured · 14 model fleets · 3 public leader scores · 8 fact runs · TIE is TIE · not a certifi
```

**DELIVERABLE — PAID DOOR, NOT ADVERTISED.** The door is live and a settled receipt unlocks the artefact; the free preview is the 402 challenge itself (4592 bytes), so by the rule above this SKU is not advertised. Not advertised is a choice about marketing; it is not a statement that the door cannot deliver.

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
public root + reveries: the card-index verification rail; nothing measured here is certificative.
