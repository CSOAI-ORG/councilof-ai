# CHANGELOG — CSOAI Seven-Terminal Eating Plan

## 2026-09-12 — Seven-Terminal Execution Complete

### Board and Evidence System

- **22 axes measured** — 14 model-comparison + 8 deterministic-fact, all MEASURED
- **14 model fleets** across behavioural axes, 3 public leader scores (safety TIE, swarm SEPARATED, jail TIE)
- **335 signed measurement cards** — Ed25519-signed, individually verifiable
- **169 Merkle root leaves** — `94e99db5...`, witnessed in Sigstore Rekor (logIndex 2791822965), OTS-stamped pending Bitcoin
- **Evidence column added to board** — shows INDEXED/MEASURED/SIGNED per axis with colour coding
- **All 8 evidence states visible**: INDEXED, MEASURED, SIGNED, ROOTED, ANCHORED, SETTLED, REPRODUCED, UNCHECKABLE

### Financial Coverage

- **425 stablecoins indexed** across 211 chains ($310.8B total supply)
- **65 deep measurements** across 21 EVM chains verified via on-chain `totalSupply()` calls
- **RLUSD cross-chain evidence** — XRPL gateway_balances + ETH totalSupply()
- **XRPL 16 instruments** measured
- **SWIFT 26-institution census** complete
- **ISO 20022 families** mapped

### Agent Economy

- **x402 payment rail live** on Base (eip155:8453), mode=live, USDC
- **9 x402 resources** (1 free + 8 paid): attestation, evidence bundles, proofs, data feeds, RWA evidence
- **MCP endpoint live** — 12 tools (8 free + 4 paid), `POST https://councilof.ai/mcp`
- **A2A endpoint live** — 11 methods, `POST https://councilof.ai/api/a2a`
- **Agent card** — v1.1.0, 4 skills, 2 extensions
- **1 self-settlement confirmed** — 0.01 USDC, tx `0x60172f43ca...`, classified INTERNAL_SELF_FUNDED
- **Revenue from external customers: $0**

### Trust Chain

- **Ed25519 signatures** — all 36 PR#1888 cards verified
- **Merkle root** — deterministic, positional `sha256(left||right)`, direction-aware inclusion proofs
- **Rekor witness** — logIndex 2791822965, type rekord/x509
- **OTS stamp** — alice+bob calendars accepted, awaiting Bitcoin confirmation
- **Base EAS** — prepared, ~$0.01, owner gate
- **XRPL memo** — prepared, ~$0.00001, owner gate
- **Ethereum EAS** — prepared, ~$0.50-2, owner gate
- **Total actual anchoring spend: $0**

### Distribution

- **feed.xml** — 8,107 bytes, 13 items, RSS 2.0
- **sitemap.xml** — 85,947 bytes, 505 URLs
- **llms.txt** — 16,139 bytes, comprehensive agent guidance
- **agent-card.json** — 11,049 bytes, A2A discovery
- **did.json** — 5,059 bytes, 5 verification methods
- **x402.json** — 12,380 bytes, 9 resources, Base mainnet
- **scitt.json** — 3,132 bytes, SCITT manifest
- **robots.txt** — 5,922 bytes, content signals (ai-train=no, ai-input=yes)

### Hugging Face

- **100+ datasets**, 39 spaces, 7 collections
- **12,281+ downloads** (top 5 datasets)
- **Canonical collection**: "GSPC — board · verify · flywheel · queue · banks" (31 items)

### Kaggle

- **csoai-gspc-living-board** — 68 downloads, CC0, fresh snapshot
- **csoai-stablecoin-index-reproducibility** — NEW, 425 assets, CC0

### GitHub

- **CSOAI-ORG** — 651 public repos, 8 followers
- **councilof-ai** — flagship, 10 topics, 1 star
- **gspc-board** — 18 topics, 1 star, evidence states documented

### Outreach

- **26 contacts prepared** across 5 segments (A-E)
- **1 posted** — FedRAMP RFC-0032 comment (2026-09-04)
- **25 DRAFT** — HOLD until endpoints return 200

### Key Corrections

- "22 measured" → 22 axes on the board, all MEASURED — but individual axes may have UNTESTED separation
- "Bitcoin-anchored" → OTS-stamped (Bitcoin-confirmed for some, pending for others)
- "5,000+ signed measurement atoms" → 335 signed measurement cards
- "DID has 2 verification methods" → 5 methods
- "Revenue from settlement" → INTERNAL_SELF_FUNDED (self-payment, not external revenue)

### Costs

- **Actual spend: $0** (all free services)
- **Remaining to complete anchors: ~$0.52-2.01** (Base + XRPL + Ethereum)

### Blockers

- P1: Outreach contacts all HOLD (endpoints need to return 200)
- P1: No external revenue
- P2: IndexNow not submitted
- P2: Google Search Console not verified
- P2: HF canonical collection missing top 2 datasets
- P2: GitHub pins require manual web UI action
- P2: OTS awaiting Bitcoin confirmation
