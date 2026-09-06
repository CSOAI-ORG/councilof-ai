# Provider document diff feed

`provider-diff-feed` — derived from live endpoints on 2026-09-06T05:00:05Z.

> Doctrine: measurement, not certification. Verification is free forever;
> a grade is never sold. Nothing in this file is typed — every number below
> is read at generation time from the live server.

## 402 door
`https://councilof.ai/api/feeds/provider-diff?history=1` — live status **402**
(4116 B) — the paid artefact sits behind the x402 rail; a settled receipt unlocks it.

## Free preview (must be non-empty)
`https://councilof.ai/api/feeds/provider-diff` — status **200**, **57485 bytes**, `sha256 5b483a458d7d4fad…`

```json
{
  "schema": "csoai.feeds.provider-diff/0.1",
  "kind": "recent",
  "one_line": "Hash-only, robots-honouring daily capture of AI-provider public documents (terms, usage policy, model cards, pricing, safety policy, Article 50 marking statements). A diff is a change of normalised sha256 between two captures. Content is never stored.",
  "as_of": "2026-09-05T09:06:18Z",
  "normaliser": "csoai-norm-v1",
  "n_targets": 51,
  "n_runs": 3,
  "counts": 
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
/feeds/provider-diff/leaves/ + daily hash captures (robots-honouring).
