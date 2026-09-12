# CSOAI ships open AI measurement board with x402 micropayments

**LONDON, UK — 12 September 2026** — CSOAI Ltd (UK Companies House 16939677) today ships the public CSOAI board: 22 measured axes across AI models, 335 Ed25519-signed measurement cards, and an x402 micropayment rail on Base — all free to verify, priced to issue.

## What the board measures

The board measures 22 axes: 14 behavioural (governance, safety, provenance, conformance, jail, swarm, and 8 more) using 14 model fleets, plus 8 deterministic-fact axes (reserve attestation, regulatory framework, custody disclosure, and more) reading public ledgers directly.

Every measurement is:
- **Signed** — Ed25519 under `did:web:csoai.org#board-attestation-1`
- **Rooted** — included in a Merkle tree (169 leaves, positional `sha256(left||right)`)
- **Witnessed** — in Sigstore Rekor at logIndex 2791822965
- **OTS-stamped** — submitted to OpenTimestamps calendars (awaiting Bitcoin confirmation)
- **Verifiable** — paste any card into https://councilof.ai/gspc-verify (free, no account)

The board is free forever. Issuance, evidence bundles, data feeds, and proof bundles are priced in USDC on Base over x402. No accounts. No API keys. No Stripe.

## What ships today

**Board and evidence:**
- 22 axes measured (14 model-comparison + 8 deterministic-fact)
- 335 signed measurement cards
- 169 Merkle root leaves, witnessed in Rekor
- Evidence column showing INDEXED/MEASURED/SIGNED per axis
- All 8 evidence states visible: INDEXED, MEASURED, SIGNED, ROOTED, ANCHORED, SETTLED, REPRODUCED, UNCHECKABLE

**Financial coverage:**
- 425 stablecoins indexed across 211 chains
- 65 deep measurements across 21 EVM chains
- RLUSD cross-chain evidence (XRPL + Ethereum)
- XRPL 16 instruments, SWIFT 26-institution census, ISO 20022 families

**Agent economy:**
- x402 payment rail live on Base (eip155:8453), 9 resources (1 free + 8 paid)
- MCP endpoint: 12 tools (8 free + 4 paid)
- A2A endpoint: 11 methods
- Agent card: v1.1.0, 4 skills

**Distribution:**
- feed.xml (RSS), sitemap.xml (505 URLs), llms.txt (agent guidance)
- agent-card.json, did.json, x402.json, scitt.json — all live
- 100+ Hugging Face datasets, 39 spaces, 7 collections
- 2 Kaggle reproducibility datasets

## Revenue state

Revenue from external customers: **$0**.

One self-settlement (0.01 USDC on Base) confirms the x402 plumbing works end-to-end: discovery → price challenge → settlement → signed receipt. The receipt is verifiable at https://councilof.ai/api/receipts/verify.

## What CSOAI does not claim

- Not a certificate, not a rating, not a compliance assessment
- "22 measured" means 22 axes have measurement runs — individual axes may have untested separation
- 425 stablecoins are indexed, not measured (1 has independent measurement evidence)
- OTS stamps are awaiting Bitcoin confirmation (not yet Bitcoin-anchored)
- Revenue is zero from external customers

## Links

- Board: https://councilof.ai/api/gspc
- Verify: https://councilof.ai/gspc-verify
- Lookup: https://councilof.ai/gspc-lookup
- Dashboard: https://councilof.ai/dashboard
- MCP: POST https://councilof.ai/mcp
- Agent card: https://councilof.ai/.well-known/agent-card.json
- Root: https://councilof.ai/root.json
- Corrections: https://councilof.ai/feeds/corrections.xml

## Contact

Nicholas Templeman, CSOAI Ltd
nicholas@csoai.org | https://councilof.ai

---

*Measurement, not certification. Anyone can re-check.*
