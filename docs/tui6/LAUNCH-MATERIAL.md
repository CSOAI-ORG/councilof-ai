# CSOAI Launch Material — Verified Facts Only

**Generated:** 2026-09-12
**Source:** Live endpoints on councilof.ai + committed artifacts on CSOAI-ORG/councilof-ai master
**Rule:** Every claim below traces to a verifiable artifact. No unsupported superlatives.

---

## For Financial Risk Teams

**What:** CSOAI measures stablecoins, tokenized funds and financial rails on 22 governance and evidence axes. Every measurement is signed Ed25519, included in a Merkle root, and witnessed by Rekor.

**Verified facts:**
- 425 stablecoins indexed across 211 chains ($310.79B circulating)
- 5 assets deeply measured: USDC ($50.6B Ethereum), USDT ($88.3B Ethereum), DAI ($4.6B Ethereum), RLUSD ($60.5M XRPL), USDC ($421.7B Stellar)
- 335 signed measurement cards, 335/335 Ed25519 valid
- 167 cards in public Merkle root
- Rekor witnessed (log index 2791822965)
- OTS submitted, awaiting Bitcoin confirmation

**Free:** Verify any card at https://councilof.ai/gspc-verify. Read the board at https://councilof.ai/api/gspc.

**Paid:** Commission a signed card for your asset. Evidence bundles for regulatory filings. Correction feeds for monitoring.

---

## For Data Vendors and Market Data Providers

**What:** Machine-readable, signed, correction-tracked measurement data for AI governance and financial evidence.

**Verified facts:**
- MCP server at https://councilof.ai/mcp (12 tools, 8 free, 4 paid)
- A2A Agent Card at https://councilof.ai/.well-known/agent-card.json (v1.1.0)
- x402 payment on Base mainnet (USDC)
- RSS feeds: state changes, corrections, cards, roots
- 100 Hugging Face datasets (~25K downloads)
- 19 Kaggle datasets

**Free:** Read the board, verify cards, check the root — all free.

**Paid:** Data feeds (assembly + cadence), correction monitoring, evidence bundles.

---

## For Agent Infrastructure Operators

**What:** CSOAI is the measurement and receipt layer for machine-to-machine commerce. Agents can discover, pay, receive and verify evidence through standard protocols.

**Verified facts:**
- MCP: csoai-gspc-mcp v1.4.2, 12 tools (8 free, 4 paid x402)
- A2A: Agent Card v1.1.0 with signed-receipts and x402 extensions
- x402: 9 resources on Base mainnet, USDC, mode=live
- AG-UI: SSE endpoint for live board events
- Free door: amount=0 (free forever)
- DID: did:web:csoai.org with Ed25519 verification methods

**Free:** Any agent can discover CSOAI, read the board, verify cards and check roots without paying.

**Paid:** Commission cards, evidence bundles, trust receipts, data feeds.

---

## RLUSD Cross-Chain Measurement

**What:** CSOAI has measured RLUSD across XRPL and Ethereum deployments.

**Verified facts (XRPL):**
- Issuer: rMxCKbEDwqr76QuheSUMdEGf4B9xJ8m5De
- Trust lines: 9,198
- Supply: ~60.5M RLUSD in circulation
- Ledger: 106912681, hash: DA1FBACCEB713F20769449187523E3AB...
- Measurement state: PARTIAL_ONE_CHAIN_XRPL (readiness.json)

**Verified facts (Ethereum):**
- Contract: 0x5c4510Af552505f3A543625Bc9683160aF71Bf91
- Measurement state: UNMEASURED (EVM reader built, contract needs verification)

**Not claimed:** Full cross-chain aggregate, proof of reserves, compliance.

---

## Stablecoin Attestations

**What:** CSOAI measures stablecoin evidence on-chain and publishes signed cards.

**Coverage:**
- Ethereum: USDC, USDT, DAI measured via public RPC
- XRPL: RLUSD measured via XRPL cluster
- Stellar: USDC measured via Horizon API
- Deep measurement queue: 20 prioritized assets
- 425 assets indexed from DefiLlama

**Not claimed:** Proof of reserves, compliance, safety, fully cross-chain verified.

---

## Model Governance

**What:** CSOAI measures AI models on 22 axes using frozen prompts and deterministic grading.

**Verified facts:**
- 22 axes measured (14 behavioural + 8 financial/domain)
- 335 signed measurement cards
- 14 model fleets measured
- 3 public leader scores (safety TIE, swarm SEPARATED, jail TIE)
- NIST AI RMF crosswalk: 4 function-level mappings
- EU AI Act: Art 5, 9, 15, 17, 50 mapped to GSPC axes

**Not claimed:** Certification, compliance, safety determination, conformity assessment.

---

## MCP/x402 Trust

**What:** CSOAI publishes trust receipts for MCP, A2A and x402 interactions.

**Verified facts:**
- MCP server: 12 tools, 8 free, 4 paid
- x402: 9 resources, Base mainnet, USDC
- Settlement state: 0 external settlements, 0 self-settlements
- Free door: amount=0
- Offer-receipt extension: conditional JWS (EdDSA)

**Not claimed:** Revenue, adoption, external customers.

---

## Revenue (Honest)

| Category | Amount | Classification |
|----------|--------|----------------|
| External customer revenue | $0.00 | ZERO |
| Self-funded test payments | $0.00 | INTERNAL_SELF_FUNDED |
| Zero-value probes | 0 | ZERO_VALUE_PROBE |

**Scale gate:** One attributable outside buyer + repeat intent, OR two written pilot acceptances at stated price. Neither met.

---

## How to Verify

1. Read the board: `curl https://councilof.ai/api/gspc`
2. Verify a card: `curl https://councilof.ai/gspc-verify`
3. Check the root: `curl https://councilof.ai/root.json`
4. Resolve the DID: `curl https://csoai.org/.well-known/did.json`
5. Check Rekor: log index 2791822965 on rekor.sigstore.dev
