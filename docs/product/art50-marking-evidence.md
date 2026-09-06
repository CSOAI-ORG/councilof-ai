# Article 50 transparency marking evidence (per asset)

`art50-marking-evidence` — derived from live endpoints on 2026-09-06T06:00:18Z.

> Doctrine: measurement, not certification. Verification is free forever;
> a grade is never sold. Nothing in this file is typed — every number below
> is read at generation time from the live server.

## 402 door
`https://councilof.ai/api/art50/marking-evidence?url=https://councilof.ai/` — live status **402**
(8180 B) — the paid artefact sits behind the x402 rail; a settled receipt unlocks it.

## Free preview (must be non-empty)
`https://councilof.ai/api/art50/marking-evidence?url=https://councilof.ai/&preview=1` — status **200**, **6128 bytes**, `sha256 8a2b8bfa289671ee…`

```json
{
  "schema": "csoai.art50.marking-evidence/0.1",
  "mode": "preview",
  "signed": false,
  "fetched_at": "2026-09-06T06:00:16.690Z",
  "measurement": {
    "subject": {
      "sha256": "3c3db07b4c23e488de6bfaa90818e17d4db008c525974417777fdea77b53dda1",
      "bytes": 228404,
      "container": "unknown",
      "source": "url",
      "url": "https://councilof.ai/"
    },
    "checked": [
      {
        "method": "c2pa.manifest-store",
        "r
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
the asset itself is fetched at request time; evidence is what the marking said and when it was read. A measurement of a marking, never a judgement that the marking is lawful.
