# SovX listing copy pack — free surfaces (2026-10-03)

Use VERBATIM. Never invent counts. Never sell a score/rank/grade/certificate.
Product name **SovX** is owner-ruled public (R-2026-0928-02). Publish on N-sites ruled (R-2026-0929-05).
Canonical: https://councilof.ai/wrappers · CAIP-19 index: https://councilof.ai/api/wrapper/index.json
Live index (2026-10-03 readback): **45 assets · 24 pairs · 17 with archive · 2 unkeyed sides** (`csoai.wrapper-caip19-index/0.1`).
A listing is not an endorsement. A state is not a rating.

## Name / one-liner
**Name:** SovX
**One-liner (≤80):** Wrapped-asset parity ledger — supply beside escrow, read not rated
**Tagline (≤60):** Wrapped-asset parity — read, not rated

## Short (70–120 chars)
`SovX reads wrapped and bridged token pairs: wrapped supply beside origin escrow at named blocks. Measurement, not a rating.`

## Medium (200–350 chars)
`SovX is CSOAI's wrapped-asset measurement surface. One row per bridged or custodial wrapper pair: wrapped supply on its chain beside the escrow that backs it, read at named blocks from public RPC. States: ESCROW_PARITY_READ · UNCHECKABLE_NATIVE_ISSUANCE · INDEXED_CUSTODIAL · UNMEASURED. A listing is not an endorsement; a state is not a rating. Free doors at councilof.ai/wrappers.`

## Long (600–900 chars)
`SovX (wrapped-asset measurements by CSOAI Ltd, UK Companies House 16939677) publishes a wrapped-asset parity ledger: one row per bridged or custodial wrapper pair. Wrapped supply on its chain is read beside the origin-chain escrow that backs it, at named finalized blocks, from public RPC. Raw reads are hashed; paid artefacts are signed evidence for already-measured work.

States are four and only four: ESCROW_PARITY_READ (both sides read), UNCHECKABLE_NATIVE_ISSUANCE (native mint; no escrow; supply read, no ratio claimed), INDEXED_CUSTODIAL (custodian-held reserve not readable here), UNMEASURED (a read failed; the error is recorded and nothing inferred). INDEXED is not MEASURED. A listing is not an endorsement or a recommendation. A state is not a rating, an attestation or a statement about reserves.

Try it free: https://councilof.ai/wrappers · CAIP-19 lookup https://councilof.ai/api/wrapper/index.json · parity ledger https://councilof.ai/interop/wrapped-asset-parity-latest.json. Verification stays free. We never sell a score, rank, grade, or certificate.`

## FAQ (AEO)
**Q: What is SovX?**
A: SovX is CSOAI's wrapped-asset measurement surface — a parity ledger of bridged and custodial wrapper pairs, read from public RPC at named blocks.

**Q: Does SovX rate or certify wrappers?**
A: No. SovX measures and records. A listing is not an endorsement; a state is not a rating, grade, or certificate.

**Q: What states can a SovX row carry?**
A: ESCROW_PARITY_READ, UNCHECKABLE_NATIVE_ISSUANCE, INDEXED_CUSTODIAL, or UNMEASURED. Four states only.

**Q: How do I look up a token?**
A: Open https://councilof.ai/api/wrapper/index.json (CAIP-19 key) or https://councilof.ai/wrappers.

**Q: Is there a free door?**
A: Yes. Preview doors are free; verification is free. Paid artefacts are signed evidence for already-measured work and never upgrade a state.

## Category / pricing
**Category:** Fintech · Blockchain · Developer Tools · Data & Analytics · AI Safety
**Pricing:** Free to read · x402 pay-per-evidence (signed cards for already-measured work)
**URL:** https://councilof.ai/wrappers
**Alt URL:** https://councilof.ai
**Repo / docs:** https://councilof.ai/api/wrapper/index.json (omit GitHub if the form wants a code repo)

## Maker / org
**Company:** CSOAI Ltd
**Contact:** nicholas@csoai.org
**HQ:** United Kingdom (Companies House 16939677)
**Related product:** GSPC — open AI measurement board (https://councilof.ai)

## Proof block
```
curl -s https://councilof.ai/api/wrapper/index.json | jq '.counts'
curl -sL -o /dev/null -w '%{http_code}\n' https://councilof.ai/wrappers
curl -s https://councilof.ai/interop/wrapped-asset-parity-latest.json | jq '.schema // .name'
```

## JSON-LD (SoftwareApplication)
```json
{
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "SovX",
  "applicationCategory": "FinanceApplication",
  "operatingSystem": "Web, API",
  "url": "https://councilof.ai/wrappers",
  "description": "Wrapped-asset parity ledger — supply beside escrow at named blocks. Read, not rated. Measurement, not certification.",
  "offers": {"@type": "Offer", "price": "0", "priceCurrency": "GBP", "description": "Free preview doors; x402-metered signed evidence for already-measured work"},
  "license": "https://creativecommons.org/licenses/by/4.0/",
  "publisher": {"@type": "Organization", "name": "CSOAI Ltd"}
}
```

## Banned (same truth gates as GSPC brand pack)
- sell a score / rank / grade / certificate
- certified / certification / compliance badge
- rating / safety score / reserve attestation (we publish reads)
- collapse INDEXED → MEASURED · signed → admitted → measured → paid
- CSGA · James Castle · Terranova (never)
- invent pair/asset counts (use live `/api/wrapper/index.json` `.counts`)
