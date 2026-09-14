# Funnel Target — LayerZero (Stargate bridge issuer)

**Who:** LayerZero Labs — Stargate product team. Public source: https://stargate.finance
**Artifact:** Wrapped-asset parity read for Stargate-bridged USDC. Specific: escrow-over-wrapped ratio at pinned block heights on Ethereum + Arbitrum.
**Why it is theirs:** Stargate's USDC pool is one of the largest bridge escrows. No independent measurement of their escrow/wrapped parity exists at deterministic block heights.

**Draft (108 words):**

We measure wrapped-asset parity for bridge-escrowed stablecoins by reading `totalSupply()` on the destination chain and `balanceOf(<escrow>)` on the origin chain at pinned finalized blocks, then computing an escrow-over-wrapped ratio. The result is signed Ed25519 and included in a Merkle root.

For Stargate's USDC on Arbitrum, the card is at https://councilof.ai/interop/wrapped-asset-parity-latest.json. Free preview: https://councilof.ai/api/wrapper?id=stargate-usdc-arbitrum&preview=1.

This is measurement, not certification. We want to confirm we are reading the correct escrow address for your pool. If the pinned-block approach has a flaw for LayerZero's messaging model, we want to know.

From: nicholas@csoai.org
No price. No "certified".
