# SWIFT/bank census evidence pack

`swift-bank-pack` — derived from live endpoints on 2026-09-06T06:00:18Z.

> Doctrine: measurement, not certification. Verification is free forever;
> a grade is never sold. Nothing in this file is typed — every number below
> is read at generation time from the live server.

## 402 door
`https://councilof.ai/api/evidence-bundle?obligation=dora&subject=csoai&bundle=1` — live status **402**
(8675 B) — the paid artefact sits behind the x402 rail; a settled receipt unlocks it.

## Free preview (must be non-empty)
`https://councilof.ai/api/evidence-bundle?obligation=dora` — status **200**, **13654 bytes**, `sha256 ef0e0c2b605d6afa…`

```json
{
  "schema": "csoai.evidence-bundle/0.1",
  "kind": "preview",
  "obligation": {
    "id": "dora",
    "control_id": "DORA-28-30",
    "title": "DORA Art. 28-30 — ICT third-party risk oversight + Register of Information",
    "obligation": "DORA Art. 28-30 — ICT third-party oversight of an AI vendor's public model; feeds the financial entity's Register of Information",
    "regulator": "eu-dora",
    "counsel_confirmed": false,
    "honesty": "D
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
SWIFT census reader (/api/swift: n=26, n_measured=0 — census is unmeasured labels, NOT grades) + bank registry (26 banks). Bundled under the DORA obligation via the evidence bundle.
