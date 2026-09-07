# CRA × AI Act × DORA — cross-framework evidence pack (csoai.evid-pack/1.0)
**Why now:** the EU Cyber Resilience Act (CRA) breach-reporting clock starts **11 September 2026** (24h initial, 72h update, 14-day detailed to ENISA) — with NO mutual recognition between CRA, EU AI Act (Art. 50 live since 2 Aug; Annex III deferred to 2 Dec 2027 via Digital Omnibus 2026/1744) and DORA. Three enforcement bodies, three reporting formats, one AI system. The gaps between the regimes are where a **neutral, signed, cross-framework measurement layer** is worth money; this pack is that layer's public artefact.

## What a buyer gets (the deliverable-first framing)
1. **CRA readiness report** — the 24h/72h/14-day reporting obligations mapped onto the AI system's components, with the signed evidence cards per component (the card format: Ed25519 under did:web:csoai.org#card-attestation-1, the `gspc.measurement-card` family, verified free).
2. **Cross-framework evidence bundle** — one evidence set, three envelopes (CRA / AI Act Art. 50 & GDPR obligations / DORA tech-risk) — each envelope signed, the corpus rooted; the reviewer gets the same truth in each regime's terminology.
3. **The gap map** — which obligations are CRA-only, AI-Act-only, DORA-only, shared-but-differently-worded; the map is derived from the frozen statutes (never our words as their words; the map names the provision, not a score).
4. **The proof-of-record** — the measurement cards + the root + the Irys pin, so the buyer can verify without us.

## Doors (the metered SKUs this pack maps to)
- `https://councilof.ai/api/evidence-bundle?obligation=<dora|eu-cra|article-50|article-53>&subject=<model-id>&bundle=1` — 0.02, the signed per-obligation bundle
- `https://councilof.ai/api/art50/marking-evidence?url=<https://…>` — 0.02 (this door is the Art. 50 side)
- `https://councilof.ai/api/receipts/batch` — 0.10 (the settlement record)
- `https://councilof.ai/api/request-attestation` — 0.02 (issuance)
- Every 402 carries the `offer-receipt` extension (server-signed offer + receipt) — the buyer's proof, verified without trusting us.

## The claims we NEVER make
- Not a certificate, not conformity, not EU-listed; the cards are measurement, never certification.
- No amount in prose (amounts live only inside the 402 challenge).
- CRA reporting dates are from the published regulation (Digital Omnibus 2026/1744 + the ENISA notification requirement), and the pack says so; we never misstate a provision.

## Publish
- Site page: the CRA Readiness Kit (already a lobby route `/cra-readiness`) must link this pack + the cross-framework map.
- The map page (`/crosswalk`) is the neutral cross-framework view.
- The pack's `SKU_INDEX` entry: `eu-cra-cross-framework` — the OFFER doc: `docs/product/OFFER-eu-cra-cross-framework.md`.
