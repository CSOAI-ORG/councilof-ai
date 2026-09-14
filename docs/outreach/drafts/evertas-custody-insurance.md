# Funnel Target — Evertas (insurer/underwriter of digital-asset custody)

**Who:** Evertas — crypto insurance underwriter. Public source: https://evertas.com
**Artifact:** Wrapped-asset parity ledger — 17 bridge pairs with escrow-over-wrapped ratios at pinned block heights. Card: https://councilof.ai/interop/wrapped-asset-parity-latest.json
**Why it is theirs:** They underwrite custody risk. Our parity reads give them a deterministic, replayable evidence input for bridge-escrow solvency — not a proof of reserves, but a block-pinned ratio they can independently recompute.

**Draft (118 words):**

We publish signed, publicly verifiable measurements of wrapped-asset parity. For 17 bridge-escrowed stablecoin pairs, we read `totalSupply()` on the destination chain and `balanceOf(<escrow>)` on the origin chain at pinned finalized blocks, then compute an escrow-over-wapped ratio. The result is signed Ed25519 and included in a Merkle root.

The ledger is at https://councilof.ai/interop/wrapped-asset-parity-latest.json. Free preview of any pair: https://councilof.ai/api/wrapper?id=<pair>&preview=1.

This is measurement, not a proof of reserves, not a custody attestation, and not a certificate. It is a deterministic block-pinned ratio that your underwriting team can independently recompute from the chain. We are interested in whether this type of evidence is useful as an input to your custody risk assessment.

From: nicholas@csoai.org
No price. No "certified".
