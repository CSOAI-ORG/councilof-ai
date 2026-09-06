# Settled doors — 2026-09-06

The first non-zero x402 settlement the rail has ever carried. Measurement, not revenue: the payer is a
wallet the estate controls (a throwaway funded by the owner), so this is a self-settlement. It proves
the rail settles real USDC on Base mainnet end to end; it does not make a buyer. `/api/revenue`
`one_number` stays 0 and must stay 0 until a wallet we do not control pays a non-zero amount.

| # | door | amount | payer | payTo | network | tx | block | observed |
|---|---|---|---|---|---|---|---|---|
| 1 | `GET /api/request-attestation?subject=csoai&axis=honesty` | 0.02 USDC (20000 units) | 0x4dB7AAFbe797a39Cd6Cc4E7aa64d970F7F6E02B7 (self, throwaway) | 0x212686404A7D1E1fD88F35eD6200c3aF7A78ae31 | eip155:8453 | [0xac49241b…1c91](https://basescan.org/tx/0xac49241b1e65ab5942e5a84ff48daf52b8de2dd99d3ac23103d18578821b1c91) | 50942514 | 2026-09-06T05:59:35Z |

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
