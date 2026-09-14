# Funnel Target — The Network Firm (stablecoin attestation firm)

**Who:** The Network Firm (formerly Armanino's crypto practice). Public source: https://thenetworkfirm.com
**Artifact:** Signed stablecoin measurement cards — USDC, USDT, DAI on Ethereum with on-chain supply reads at pinned block heights. Card sha: `/signed/card_index.json` (335 signed cards).
**Why it is theirs:** They attest reserves for stablecoin issuers. Our on-chain supply reads are a complementary evidence layer.

**Draft (114 words):**

We publish signed, publicly verifiable stablecoin measurements. For USDC, USDT, and DAI on Ethereum, we read `totalSupply()` at pinned finalized blocks, sign the result Ed25519, and include it in a Merkle root. The cards are at https://councilof.ai/signed/card_index.json (335 signed cards).

This is not a reserve attestation. It is an independent on-chain supply read at a deterministic block height — the same block your attestation period covers. If your attestation says USDC supply was X at block Y, our card says the chain said Z at block Y. When they match, that is evidence. When they don't, that is a finding.

We are interested in whether deterministic block-height reads are useful as a cross-check for your attestation practice.

From: nicholas@csoai.org
No price. No "certified".
