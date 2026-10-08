# Burner 0x6ea00613c15f2463bc10c7188215c4fa6f4943c6 is permanently compromised

**Never fund this wallet again.** `REPORT.md` still says "Fund the burner wallet". That step is withdrawn.
REPORT.md is left byte-identical because `public/interop/white-paper-index-v0.1.json` pins its sha256.

- Commit 27ac2d551 (2026-09-12T04:57Z) committed this wallet's private key in `sign-payment.cjs`, in a public repo.
  The current tree no longer holds it, but git history does. Without an owner-approved history rewrite it stays readable,
  and even a rewrite cannot recall copies already taken.
- `sign-payment.cjs` now reads `TUI4_BURNER_KEY` from the environment. It exits 2 without signing if the variable is
  absent or malformed, or if the key derives to this address.

## On-chain history (Base, read 2026-10-07)

| UTC | Event | Attribution |
|---|---|---|
| 2026-09-12 06:15:53 | 0.01 USDC x402 settlement, tx 0xeaaafb8a…8807 | **Ours.** The EIP-3009 nonce 0x9da1e772… in the committed `evidence-executed.json` matches the on-chain `AuthorizationUsed` nonce. |
| 2026-09-13 01:37:07 | 5.758107 USDC (tx 0x51a3b917…) + 0.0006944 ETH out to 0x639f7e0b317f586b350cdcc1ceb22a2ed44e2211 | Not attributed from chain data. An owner must confirm whether this is an estate wallet. |
| 2026-09-14 | EAS schema registrations and attests sent from this wallet | Estate activity |
| 2026-09-22 03:42–04:47 | ~0.00488 ETH swept in three txs (nonces 25–27) to 0xdd90000891a37165ad1dd6cdb2d77256355af056 | **Third-party sweeper.** The collector takes small sweeps from many unrelated wallets, and another public x402 repo lists it as a "sweeper / exploiter". A 1.6e-8 ETH address-poisoning deposit landed one block before the second sweep. |

Balances on 2026-10-07: 0 USDC and 0.0000099994 ETH (dust).

## Classification

The address stays in `KNOWN_INTERNAL_X402_WALLETS` (`functions/api/_x402.ts`) **for historical classification only**,
so the 12 Sep settlement stays `self` and is never counted as buyer revenue. Anyone can read this key, so a settlement
from this address after 2026-09-12 cannot be shown to be ours. Keeping the address classified `self` can only
understate revenue, never overstate it.
