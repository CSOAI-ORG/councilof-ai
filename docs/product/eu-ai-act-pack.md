# EU AI Act pack (Article 50 / 53 transparency)

`eu-ai-act-pack` — derived from live endpoints on 2026-09-06T05:00:05Z.

> Doctrine: measurement, not certification. Verification is free forever;
> a grade is never sold. Nothing in this file is typed — every number below
> is read at generation time from the live server.

## 402 door
`https://councilof.ai/api/evidence-bundle?obligation=article-53&subject=csoai&bundle=1` — live status **402**
(8802 B) — the paid artefact sits behind the x402 rail; a settled receipt unlocks it.

## Free preview (must be non-empty)
`https://councilof.ai/api/evidence-bundle?obligation=article-53` — status **200**, **14683 bytes**, `sha256 9994ce6b6960fc2f…`

```json
{
  "schema": "csoai.evidence-bundle/0.1",
  "kind": "preview",
  "obligation": {
    "id": "article-53",
    "control_id": "EU-AI-ACT-53",
    "title": "EU AI Act Article 53 — GPAI model provider obligations (technical documentation, downstream information, copyright policy, training-content summary)",
    "obligation": "Article 53(1)(a)–(d) — GPAI provider documentation + downstream-provider information; in force since 2 August 2025 (Art 113)",
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
obligations ledger, Article 50 + 53 rows; pack page /packs/eu-article-50.
