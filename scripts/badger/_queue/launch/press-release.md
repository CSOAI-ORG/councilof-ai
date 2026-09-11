# CSOAI launches the open, signed AI measurement board

**LONDON, UK — September 03, 2026** — CSOAI Ltd (UK 16939677) today ships the public CSOAI board — an open, Ed25519-signed measurement substrate for AI behaviour, with Sigstore Rekor witnessing and OpenTimestamps stamps (pending Bitcoin attestation on 3 published root files).

The board measures 22 axes across AI models — 14 model-comparison (jail, governance, safety, conformance, etc.) + 8 deterministic-fact (issuer accounts, RWA tokens, witness receipts). Every measurement is signed under `did:web:csoai.org#card-attestation-1` (Ed25519) and chained via SHA-256. Three published root files carry confirmed Bitcoin OTS anchors (blocks 965121, 965138, 965268); 243 additional files carry pending OTS stamps awaiting Bitcoin commitment. Individual measurement cards do NOT carry timestamp-authority anchors — that capability is planned, not live.

The board is free forever. Issuance, evidence bundles, data feeds, proof bundles, and custom audits are priced in USDC on Base over x402 — every receipt settles on-chain. No Stripe. No accounts. No API keys. Prices appear only in the 402 challenge and are never hardcoded.

The substrate ships with:
- 335 signed measurement cards, individually Ed25519-signed and SHA-256-chained
- 44 discovery doors at `/.well-known/<standard>.json` — IETF SCITT, W3C PROV-O, NIST AI RMF, OWASP LLM Top 10, EU AI Act, ISO 42001, and 37 more
- A public corrections ledger documenting every defect found, with the fix
- A free-to-reproduce GitHub repo, and a verifier that works offline in any browser

The doctrine: **measurement, not certification. Anyone can re-check.**

The pay-to address: `0x212686404A7D1E1fD88F35eD6200c3aF7A78ae31` (Base mainnet).

For more information, contact press@csoai.org.
