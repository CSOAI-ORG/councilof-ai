# Evidence bundle mapped to an obligation

`evidence-bundle` — derived from live endpoints on 2026-09-06T04:45:27Z.

> Doctrine: measurement, not certification. Verification is free forever;
> a grade is never sold. Nothing in this file is typed — every number below
> is read at generation time from the live server.

## 402 door
`https://councilof.ai/api/evidence-bundle?obligation=article-50&subject=csoai&bundle=1` — live status **402**
(5592 B) — the paid artefact sits behind the x402 rail; a settled receipt unlocks it.

## Free preview (must be non-empty)
`https://councilof.ai/api/evidence-bundle?obligation=article-50` — status **200**, **12694 bytes**, `sha256 92ce46c0d662de1f…`

```json
{
  "schema": "csoai.evidence-bundle/0.1",
  "kind": "preview",
  "obligation": {
    "id": "article-50",
    "control_id": "EU-AI-ACT-50",
    "title": "EU AI Act Article 50 — transparency & marking of AI-generated content",
    "obligation": "Article 50 — provider transparency + synthetic-content marking (machine-readable & detectable)",
    "regulator": "eu-ai-act",
    "counsel_confirmed": true,
    "honesty": null,
    "existing_pack": "http
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
obligations ledger (/interop/obligations-ledger.json) + OSCAL observations.
