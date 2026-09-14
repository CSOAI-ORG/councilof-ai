# Funnel Target — Chainlink (CCIP bridge issuer)

**Who:** Chainlink Labs — CCIP product team. Public source: https://chain.link/cross-chain
**Artifact:** Wrapped-asset parity read for CCIP-bridged stablecoins (USDC on Arbitrum via CCIP escrow). Specific card sha: `/api/wrapper?id=ccip-usdc-arbitrum` (preview free at `?preview=1`).
**Why it is theirs:** Their bridge escrow is one of the 17 pairs in the parity ledger. No one else publishes a deterministic escrow-over-wrapped ratio for their infrastructure at pinned block heights.

**Draft (112 words):**

We publish a signed, publicly verifiable measurement of wrapped-asset parity for CCIP-bridged stablecoins. For USDC on Arbitrum via your escrow, we read `totalSupply()` on the wrapped contract and `balanceOf(<escrow>)` on the origin chain at pinned finalized blocks, compute an escrow-over-wrapped ratio, sign the result Ed25519, and include it in a Merkle root witnessed by Rekor.

The card is live at https://councilof.ai/interop/wrapped-asset-parity-latest.json. Free preview at https://councilof.ai/api/wrapper?id=ccip-usdc-arbitrum&preview=1.

This is measurement, not certification. The ratio is what the two chains said at those two heights. We are interested in your feedback on the escrow address we are reading and whether the pinned-block approach is the right one for CCIP.

From: nicholas@csoai.org
No price. No "certified".
