# PRESS RELEASE — FOR IMMEDIATE DISTRIBUTION
## First Independent Cross-Chain RLUSD Measurement Reveals $537M Divergence

**London, UK — September 11, 2026** — CSOAI Ltd (UK Companies House 16939677) today published the first independent, signed measurement of Ripple USD (RLUSD) supply across both the XRP Ledger and Ethereum blockchains.

### Key Findings

- **Total RLUSD supply (on-chain):** $2,405,234,373
- **XRPL chain:** $1,028,940,439 (42.9%, 41,200 holders)
- **Ethereum chain:** $1,373,732,628 (57.1%, ERC-20)
- **Ripple transparency page (Aug 20, 2026):** $1,866,500,000
- **Divergence:** ~$537,000,000 (unexplained)

### Methodology

CSOAI's XRPL reader queries mainnet via JSON-RPC with bidirectional domain verification. The Ethereum reader queries the RLUSD ERC-20 contract (0x8292bb45bf1ee4d140127049757c2e0ff06317ed) with symbol verification and 4-RPC failover. Both readings are combined into a single signed measurement card (Ed25519, card-v0 format, SHA-256 manifest).

### Context

RLUSD is the 11th-largest stablecoin globally by supply. It exists on at least 6 blockchain networks. The ~$537M divergence between Ripple's published transparency figure and CSOAI's on-chain measurement may be explained by: NTT sidechain supply (Base, Optimism, Ink, Unichain, XRPL-EVM) not yet measured by CSOAI; timing differences between reads; or attestation reporting lag.

CSOAI does not resolve the gap — it signs it. "Measurement, not certification" is the company's operating doctrine.

### Availability

The measurement card is published at councilof.ai/signed/ and verifiable at councilof.ai/gspc-verify. The XRPL reader data is available at councilof.ai/api/xrpl. All data is CC-BY licensed.

### About CSOAI

CSOAI Ltd operates the Global Sovereign Performance Council (GSPC) — a 22-axis AI measurement board that publishes signed, independently verifiable measurement cards. The company is a published IETF SCITT contributor (draft-templeman-scitt-framing-space-00) and a C2PA Contributor Member.

**Contact:** nicholas@csoai.org
**Website:** councilof.ai
