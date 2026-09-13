# Wrapped-asset ledger — spec, first cut (2026-09-13)

## Why this exists
Nick asked whether the estate could "make a wrapper or coin" from what it holds. It cannot and
should not: issuing a wrapped token, a stablecoin, or a risk/insurance product is regulated
issuance or underwriting (UK FSMA/EMR, MiCA) and sits behind the EP9 gate — no token, no cover,
no priced product without counsel. What the estate *can* be, today and without permission, is the
independent measurement layer for the wrapper economy: the thing no bridge, issuer or insurer can
credibly publish about itself. This ledger is that layer's first read.

## What is read
For each wrapper pair in the roster (`scripts/readers/wrapped-asset-parity-reader.mjs`):

| field | source | how |
|---|---|---|
| `wrapped_total_supply` | destination chain, wrapped token | `totalSupply()` at the run's pinned finalized block |
| `escrow_balance` | origin chain, canonical token | `balanceOf(<bridge escrow>)` at the origin chain's pinned block |
| `escrow_over_wrapped` | derived | BigInt ratio, six places, truncated — no float anywhere |

Every raw hex result is sha256'd and kept; endpoint substitutions are recorded, never silent.

## States (never collapsed)
- `ESCROW_PARITY_READ` — both reads succeeded; the ratio is what the two chains said at the pinned heights.
- `UNCHECKABLE_NATIVE_ISSUANCE` — the issuer mints natively on the destination chain (Circle CCTP, Tether native). There is no escrow to read. The supply is read; **no parity is claimed and none is implied** — native issuance is not "unbacked".
- `INDEXED_CUSTODIAL` — the reserve sits with a custodian off-chain or on another ledger (BTC, XRP, fund shares). Only the wrapped supply is readable from here; the pair stays INDEXED — never "unbacked" — until a reserve read exists (an XRPL-side read for wXRP is the first candidate).
- `UNMEASURED` — a read failed; the error is in the record; nothing is inferred.

## What it is not
Not a rate, not a grade, not a reserve attestation, not a proof of backing, not a certificate.
A ratio above 1 means more sits in the escrow than the wrapped supply at those two heights; a ratio
below 1 at an `escrow`-model pair is a finding to publish, not a verdict to pronounce. Heights on
two chains are never simultaneous; each record names both blocks and both timestamps.

## First output
`public/interop/wrapped-asset-parity-2026-09-13.json` — 17 pairs (Arbitrum, Optimism, Base, Polygon PoS bridged stablecoins + wBTC, cbBTC, wXRP, BUIDL): 8 read, 4 uncheckable-native, 5 indexed-custodial,
0 unmeasured (calls are paced 200 ms; a failed read is recorded as UNMEASURED, never inferred). Unsigned: state `INDEXED`. The
signing path is the board signer under OIDC (public-root.yml); a signed batch is the next step, and the x402 door `GET /api/wrapper?id=<pair>` is live (free `?preview=1`, 402 challenge with v2 + bazaar,
signed card on payment); staged atoms sit in `public/interop/wrapped-asset-parity-2026-09/` for the signer.

## Where value comes from (doctrine-consistent)
- x402-metered per-asset reads (`asset_specific_x402_doors` is 0 today on the stablecoin readiness
  surface — this is the gap the door closes).
- The design-partner diff feed (GBP-priced, owner-led) for bridges, issuers and insurers who want
  the change series, not the snapshot.
- CC-BY board data that others cite. Risk pricing and insurance are their business; the card is the
  input they pay for, not the cover.

## Roster growth rule
A pair joins the roster only with: the wrapped contract, the canonical contract, the named escrow
(or a `native` note explaining why none exists), and a public source for the escrow address. No
pair is added because it is popular; it is added because it can be read.
