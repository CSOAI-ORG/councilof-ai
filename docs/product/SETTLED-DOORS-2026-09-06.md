# Settled doors — 2026-09-06

The first non-zero x402 settlement the rail has ever carried. Measurement, not revenue: the payer is a
wallet the estate controls (a throwaway funded by the owner), so this is a self-settlement. It proves
the rail settles real USDC on Base mainnet end to end; it does not make a buyer. `/api/revenue`
`one_number` stays 0 and must stay 0 until a wallet we do not control pays a non-zero amount.

| # | door | amount | payer | payTo | network | tx | block | observed |
|---|---|---|---|---|---|---|---|---|
| 1 | `GET /api/request-attestation?subject=csoai&axis=honesty` | 0.02 USDC (20000 units) | 0x4dB7AAFbe797a39Cd6Cc4E7aa64d970F7F6E02B7 (self, throwaway) | 0x212686404A7D1E1fD88F35eD6200c3aF7A78ae31 | eip155:8453 | [0xac49241b…1c91](https://basescan.org/tx/0xac49241b1e65ab5942e5a84ff48daf52b8de2dd99d3ac23103d18578821b1c91) | 50942514 | 2026-09-06T05:59:35Z |
| 2 | `GET /api/request-attestation?subject=clan-csoai-plain:latest` | 0.02 USDC (20000 units) | 0x4dB7AAFbe797a39Cd6Cc4E7aa64d970F7F6E02B7 (self, throwaway) | 0x212686404A7D1E1fD88F35eD6200c3aF7A78ae31 | eip155:8453 | [`0xeec6b053…b8dd`](https://basescan.org/tx/0xeec6b0532d058194d810b52574928fdd5e1e6e3a4fd48ab0304ba2807589b8dd) | — | 2026-09-06T08:01:20Z |
| 3 | `GET /api/eunomia-data?feed=1` | 0.02 USDC (20000 units) | 0x4dB7AAFbe797a39Cd6Cc4E7aa64d970F7F6E02B7 (self, throwaway) | 0x212686404A7D1E1fD88F35eD6200c3aF7A78ae31 | eip155:8453 | [`0x444155d9…c46c`](https://basescan.org/tx/0x444155d966fcf140cb93531ec0e804e2da2c17224631ae531d19183e7fa9c46c) | — | 2026-09-06T08:04:16Z |
| 4 | `GET /api/proof?bundle=1` | 0.02 USDC (20000 units) | 0x4dB7AAFbe797a39Cd6Cc4E7aa64d970F7F6E02B7 (self, throwaway) | 0x212686404A7D1E1fD88F35eD6200c3aF7A78ae31 | eip155:8453 | [`0x0207386d…64f7`](https://basescan.org/tx/0x0207386dd0549c6f952e2e271cd65a8a8d6c417c9bffa1fb6ede7ae6279164f7) | — | 2026-09-06T08:04:18Z |
| 5 | `GET /api/rwa/evidence?asset=RLUSD` | 0.02 USDC (20000 units) | 0x4dB7AAFbe797a39Cd6Cc4E7aa64d970F7F6E02B7 (self, throwaway) | 0x212686404A7D1E1fD88F35eD6200c3aF7A78ae31 | eip155:8453 | [`0x8b647288…7c9a`](https://basescan.org/tx/0x8b6472885cad7b5f5e88b150bad10d7122da28a06470077cf6988cb509b47c9a) | — | 2026-09-06T08:04:20Z |
| 6 | `GET /api/receipts/batch?from=2026-09-01&to=2026-09-06` | 0.10 USDC (100000 units) | 0x4dB7AAFbe797a39Cd6Cc4E7aa64d970F7F6E02B7 (self, throwaway) | 0x212686404A7D1E1fD88F35eD6200c3aF7A78ae31 | eip155:8453 | [`0x835109e1…197a`](https://basescan.org/tx/0x835109e14f2d1ca2573e87a84b14b63e779fb2c6a11af0d3e62402c0de7e197a) | — | 2026-09-06T08:05:34Z |
| 7 | `GET /api/art50/marking-evidence?url=<https://…>` | **25 USDC** (25000000 units) | — | — | eip155:8453 | **NOT SETTLED — priced above the payer balance** | — | 2026-09-06T08:05Z |
| 8 | `GET /api/feeds/provider-diff?history=1` | **25 USDC** (25000000 units) | — | — | eip155:8453 | **NOT SETTLED — priced above the payer balance** | — | 2026-09-06T08:05Z |
| 9 | `GET /api/evidence-bundle?obligation=cra&bundle=1` | **250 USDC** (250000000 units) | — | — | eip155:8453 | **NOT SETTLED — priced above the payer balance** | — | 2026-09-06T08:05Z |

## Rows 2–6: the buyer path, and why the ledger moved this time

Row 1 settled direct with the facilitator, so the edge saw nothing and `/api/revenue` did not change.
Rows 2–6 went through the door itself (`PAYMENT-SIGNATURE`, `scripts/grants/x402-settlement-census.py
--url … --allow-self`), which is the path that writes a `settled:tx:*` record. They were only safe to
run after the deploy carrying 5d94839 went green: that commit lists the throwaway payer in
`X402_SELF_WALLETS`, without which the counter would have called our own wallet a buyer.

Checked after the first settle, before spending on the rest:

    self_settlements 1 -> 5      all_time 0      settlements (non-self) 0

`all_time` is the One Number and it has not moved. That was the stop condition and it held.
Total spent on Move A: **0.18 USDC**.

## Rows 7–9: three doors we cannot afford to buy from ourselves

Move A was specified as eight doors. Five settled. Three did not, and not because anything is broken —
they are priced above the whole payer balance:

| door | its own 402 asks |
|---|---|
| `/api/evidence-bundle?obligation=cra&bundle=1` | **250 USDC** |
| `/api/art50/marking-evidence` | **25 USDC** |
| `/api/feeds/provider-diff?history=1` | **25 USDC** |

Settling all eight would cost about **300 USDC** against a payer holding ~4.6. `self_settlements 8`
is unreachable at this budget by roughly sixty-five times, so five is the honest ceiling today and
the expectation should be restated rather than the number massaged.

Two smaller things the run surfaced, both recorded because they cost a retry each:

- `/api/evidence-bundle?obligation=eu-cra` answers **200 with a free preview**, not a challenge. The
  paid resource is named inside that preview as `?obligation=cra&bundle=1` — a different parameter
  value AND an extra flag. The path was copied from the door's own response, per R9, rather than
  guessed from the manifest's placeholder.
- `/api/receipts/batch` asks 0.10 USDC, which is above the census default per-host cap of 0.05, so it
  needed `--per-host-cap 100000`. The cap did exactly its job: it refused to spend more than it was
  told to, on our own door.


## How it was produced
`X402_MAINNET=1 SETTLE=1 X402_RESOURCE=<door> X402_PAYER_KEY=<throwaway> bash scripts/grants/x402-testnet-loop.sh`
— 402 read from the live door, EIP-3009 signed for its exact terms (domain from `accepts[0].extra` + `asset`, #1518),
facilitator.payai.network `/verify` → `isValid:true`, `/settle` → `success:true`. Submitted on-chain by the
facilitator (0xc6699d2a…) through Multicall3 `aggregate3`; the USDC `Transfer` log reads payer → payTo, 20000.

## What it does NOT prove
- Not revenue, not a buyer (self wallet).
- Not a receipt in our own ledger: this path settles direct with the facilitator, so the edge wrote no
  `settled:tx:*` record and `/api/revenue` is unchanged. Receipts in the ledger come from the buyer path
  (`PAYMENT-SIGNATURE` to the door; `scripts/grants/x402-settlement-census.py --url … --allow-self`),
  and only after the payer is listed in `X402_SELF_WALLETS`, or the counter would call our own wallet a buyer.

## Re-check
```
curl -s -X POST https://mainnet.base.org -H 'content-type: application/json' \
  -d '{"jsonrpc":"2.0","id":1,"method":"eth_getTransactionReceipt","params":["0xac49241b1e65ab5942e5a84ff48daf52b8de2dd99d3ac23103d18578821b1c91"]}'
```
Expect `status 0x1`, and a `Transfer` log on 0x8335…2913 from 0x4db7…02b7 to 0x2126…ae31 with data 0x4e20 (20000).
