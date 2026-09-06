# XRPL asset evidence card (per request)

`xrpl-asset-evidence` — derived from live endpoints on 2026-09-06T05:00:05Z.

> Doctrine: measurement, not certification. Verification is free forever;
> a grade is never sold. Nothing in this file is typed — every number below
> is read at generation time from the live server.

## 402 door
`https://councilof.ai/api/rwa/evidence?asset=RLUSD` — live status **402**
(4429 B) — the paid artefact sits behind the x402 rail; a settled receipt unlocks it.

## Free preview (must be non-empty)
`https://councilof.ai/api/rwa/evidence?asset=RLUSD&preview=1` — status **200**, **4059 bytes**, `sha256 6bdbf95a36c85a07…`

```json
{
  "schema": "csoai.rwa-evidence/0.1",
  "kind": "preview",
  "card": {
    "schema": "https://councilof.ai/schema/card-v0.json",
    "surface": "public.notice",
    "subject": "XRPL RLUSD (Ripple) two-way domain PASS + on-chain obligation",
    "as_of": "2026-09-06T05:00:03Z",
    "source_urls": [
      "https://councilof.ai/api/xrpl",
      "https://ripple.com/.well-known/xrp-ledger.toml",
      "https://api.xrpscan.com/api/v1/names/well-known
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
public.notice evidence cards + XRPL instrument registry (/interop/xrpl-issuer-registry.json).
