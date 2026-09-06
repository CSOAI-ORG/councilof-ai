# 16/16 is not reachable by dispatching the signer — nothing signs these cards

Measured 2026-09-06 against the live reader and the signer scripts.

## The three

`GET /api/xrpl` serves 16 assets, **13 signed and 3 not**:

| symbol | issuer | issuer address |
|---|---|---|
| `EURQ` | Quantoz | `rDk1xiArDMjDqnrR2yWypwQAKg4mKnQYvs` |
| `USDQ` | Quantoz | `rDk1xiArDMjDqnrR2yWypwQAKg4mKnQYvs` |
| `PSC` | Republic of Palau | `rwekfW4MiS5yZjXASRBDzzPPWYKuHvKP7E` |

Each carries, verbatim:

    "unmeasured": ["strict_two_way_toml",
                   "sig_ed25519 against #board-attestation-1 (NO_LAPTOP_SIGN)"]

So each is short of 16/16 for **two** reasons, not one. A signature closes the second.
It does not close `strict_two_way_toml`.

## Why dispatching the workflow will not do it

`hf-fin-shells-measure.yml` has three targets, and this is everything they read:

| target | input |
|---|---|
| `ledger` | `public/interop/ledger-cards-compact.json` |
| `mill` | `public/interop/mill-cards-unsigned/` |
| `financial` | `public/interop/financial-measure-compact.json` |

Matched by digest — the `sha256` each asset publishes on `/api/xrpl` — against both
compact files:

    of the 16 asset digests, ledger-cards-compact.json      carries 0
    of the 16 asset digests, financial-measure-compact.json carries 0

Not the 3 unsigned, and **not the 13 already signed either**. Whatever signed those 13
was not one of these three targets. None of the three signer scripts mentions xrpl at
all (`grep -li xrpl scripts/sign_*.py` → nothing).

So **there is no target to dispatch.** Running `target=financial` signs the seven
`financial-measure-card-*.json` axes — which are already signed and already verify (7 of
7 under `did:web:csoai.org#board-attestation-1`, four at n=16; see
`harness/gspc-top100/verify_financial_cards.py`). It would not touch EURQ, USDQ or PSC.

## What 16/16 actually needs

1. A signer that reads the xrpl asset preimages and posts them to `/api/board-sign`
   through the OIDC path — a new script, or a new target on the existing workflow.
2. An OIDC allowlist entry: the **workflow filename is the allowlist key**, so a new
   workflow file would need adding to the allowlist before its token is accepted.
3. `strict_two_way_toml` resolved separately, or the cards stay UNMEASURED for that
   reason after signing and 16/16 on signatures is still not 16/16 on the axis.

That is a code change and an owner decision, not a dispatch. Signing was not attempted:
firing a signing workflow on a guess publishes attestations, and the guess here would
have been wrong — nothing it signs is one of the three.

## What was checked and is fine

- `/api/xrpl` reports 13/16 signed. `client/src/pages/XrplAttest.tsx` types **14/16** in
  four places; PR #1620 (another lane) replaces those with the derived count. Not
  touched here.
- The seven financial cards verify 7 of 7 under the published DID.
- `public/interop/deterministic-axis-atoms.json` said four atoms were "queued for GHA
  OIDC signing" when all four of their axes already had signed, verifying cards —
  corrected in the same PR as the verifier.
