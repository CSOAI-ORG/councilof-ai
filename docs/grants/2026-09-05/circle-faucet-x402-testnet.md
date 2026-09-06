# Circle testnet faucet + the x402 testnet loop — 2026-09-05

> **Measured facts, each naming the endpoint or file that returns it.** Re-fetch before sending.
>
> - **Buyer's-eye x402 census (measured artefact).** 316 conformant hosts paid for real: **100 DELIVERED**,
>   **213 REFUSED**, 2 NO_CHALLENGE, 1 MISMATCH. **13 hosts recorded an on-chain settlement and still
>   delivered nothing** (0.193 USDC), each row carrying its tx hash so a reader can check the chain.
>   Dataset: <https://huggingface.co/datasets/csoai/x402-settlement-census> — `summary-2026-09-06.json`.
>   *One purchase per host, one moment: a single refusal is not a pattern. 1.3398 USDC spent, all of it ours.*
> - **Revenue.** `/api/revenue` → `one_number.all_time` = **0** distinct non-self payers, status **MEASURED**.
>   Separately `settled_usdc.count` is **`null`, status UNMEASURED** — null is not zero, and neither is
>   revenue. Self-settlements (5) and zero-value settlements (4) are recorded and are never payers.
> - **Hub cells.** `/api/hub-cards` → `counts`. These are **third-party models on the Hub, never our own
>   coverage** — the endpoint says so in its own `population` field.

Target: https://faucet.circle.com/ · Companion script: `scripts/grants/x402-testnet-loop.sh` · Facts: `FACTS-2026-09-05.json`

## Status

| | |
|---|---|
| Open now | **OPEN** — "This Faucet is public and permissionless for anyone to use. There's no account required" (page text, read 2026-09-05) |
| Deadline | none |
| Sign-in | **none**. reCAPTCHA only. Anyone in a browser: pick token → pick network → paste address → captcha → submit |
| Amount | "20 USDC on testnet every 2 hours, per address"; "One request per pairing of asset and test network every 2 hours" |
| Tokens | USDC, EURC, cirBTC |
| Networks that matter here | **Base Sepolia** (listed), also Ethereum Sepolia, OP Sepolia, Arbitrum Sepolia, Polygon PoS Amoy, XRP Ledger Testnet, Solana Devnet, Stellar Testnet, XDC Apothem (full list on the page) |
| Fit | n/a — not a grant. It is the free input to proving the last hop of the money rail. |

## What the test loop needs (every value read, not typed)

| Item | Value | Source |
|---|---|---|
| Live rail (mainnet) | x402Version 2 · scheme `exact` · network `eip155:8453` · asset `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913` (USDC on Base) · payTo `0x212686404A7D1E1fD88F35eD6200c3aF7A78ae31` · mode `live` · 9 resources | https://councilof.ai/.well-known/x402.json |
| Testnet network id | CAIP-2 `eip155:84532` (v2) / slug `base-sepolia` (v1); chainId 84532 | facilitator `/supported`; `functions/api/_x402_config.ts` maps both |
| Testnet asset | USDC on Base Sepolia `0x036CbD53842c5426634e7929541eC2318f3dCF7e` | x402 v2 spec worked example; `scripts/badger/prove-settle-testnet.py` |
| Facilitator (primary) | `https://facilitator.payai.network` — `/supported` lists v1 `base-sepolia` and v2 `eip155:84532`, scheme `exact` (read 2026-09-05) | https://facilitator.payai.network/supported |
| Facilitator (alternative) | `https://x402.org/facilitator` — v2 `eip155:84532` `exact` (+ `upto`, `batch-settlement`). **The base path `x402.org/facilitator` returns 404**; `x402.org` (200) and `x402.org/facilitator/supported` (200) both resolve, so the facilitator is reachable but that base URL is not a page. Verified 2026-09-06 | https://x402.org/facilitator/supported |
| Receiver on testnet | the same `payTo` — an EVM address exists on every EVM chain | derived from x402.json |
| Payer | a THROWAWAY key funded by the faucet; `scripts/badger/make-payer-wallet.sh` writes `.payer.key` (chmod 600, never printed) | repo |
| Current mainnet proof | `/api/revenue` `one_number.all_time = 1` distinct non-self payer; `settled_usdc` status `UNMEASURED` (null, never 0) | https://councilof.ai/api/revenue |

## The exact loop

```bash
# 0. one-time: throwaway wallet, then fund it in the browser at https://faucet.circle.com (USDC → Base Sepolia → address)
bash scripts/badger/make-payer-wallet.sh          # prints the address only
export X402_PAYER_KEY=$(cat .payer.key)           # never echo this

# 1. supported? 2. copy the live 402 shape  3. sign + /verify  (moves nothing)
bash scripts/grants/x402-testnet-loop.sh

# 4. submit the testnet transfer
SETTLE=1 bash scripts/grants/x402-testnet-loop.sh
```

The equivalent bare curl, once `BODY` has been produced by the script's signing step (it is the v2 body: `{"x402Version":2,"paymentPayload":{...,"accepted":REQS,"payload":{"signature","authorization"}},"paymentRequirements":REQS}` with `REQS.network = "eip155:84532"` and `REQS.asset = 0x036C…CF7e`):

```bash
curl -sS -H 'content-type: application/json' -d "$BODY" https://facilitator.payai.network/verify
curl -sS -H 'content-type: application/json' -d "$BODY" https://facilitator.payai.network/settle   # returns {"success":true,"transaction":"0x…"} → https://sepolia.basescan.org/tx/<tx>
```

## What this proves, and what it does not

- Proves: the facilitator's `/verify` → `/settle` path accepts our exact challenge shape and an EIP-3009 authorisation signed under the USDC (`name "USDC"`, `version "2"`) EIP-712 domain. The mainnet dialect drift of 2026-09-04 (PayAI advertising v1+v2, "highest version wins", v2 body rejected) is exactly the class of failure this loop catches for free — see `scripts/x402-rail-proof.py` docstring.
- Does not prove: a mainnet settle; nothing here reaches `/api/revenue`; no Bazaar indexes a testnet settle. The live edge issues `eip155:8453` only (`NETWORK_CAIP2_BASE`), so the loop copies the live 402 and re-targets it; the edge is not itself exercised on testnet. To exercise the edge on testnet a preview deployment with `X402_NETWORK=base-sepolia`-style config would be needed — that switch does not exist today (`_x402_config.ts` maps the slug but nothing sets it). Not built here; noted.

## Owner line

None for the faucet (no account). The governor is already running it in a browser; the only secret is the throwaway key, which stays in `.payer.key`.
