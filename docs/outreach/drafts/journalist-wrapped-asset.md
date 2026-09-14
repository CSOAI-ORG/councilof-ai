# Funnel Target — Journalist (wrapped-asset backing)

**Who:** One journalist who has written about wrapped-asset backing. Candidate: someone at The Block, CoinDesk, or Decrypt who has covered wBTC custody, cbBTC launch, or bridge-escrow solvency. Public source: recent articles on wrapped-asset backing.
**Artifact:** Wrapped-asset parity ledger — 17 bridge pairs with signed escrow-over-wrapped ratios. Card: https://councilof.ai/interop/wrapped-asset-parity-latest.json
**Why it is theirs:** They have written about whether wrapped assets are fully backed. Our ledger gives them a deterministic, independently verifiable data source — not an attestation from the issuer, but a chain-pinned read they can check themselves.

**Draft (112 words):**

You have written about whether wrapped assets are fully backed. We have a dataset that might be useful: a signed, publicly verifiable ledger of escrow-over-wrapped ratios for 17 bridge-escrowed stablecoin pairs, read at pinned finalized block heights on both chains.

The ledger is at https://councilof.ai/interop/wrapped-asset-parity-latest.json. Every ratio is independently recomputable — the record names both block heights and both chain endpoints. Free verification at https://councilof.ai/gspc-verify.

This is not a proof of reserves and not a certificate. It is a deterministic block-pinned ratio. When the ratio is above 1, more sits in escrow than the wrapped supply at those two heights. When it is below 1, that is a finding to investigate, not a verdict to pronounce.

From: nicholas@csoai.org
No price. No "certified".
