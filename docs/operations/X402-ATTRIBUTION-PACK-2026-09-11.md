# G6.3 — x402 attribution pack (before any $25 tx)

Self-funded excluded from revenue. A 402 is not settlement.

## Before Nick signs a tx

1. **Payer ≠ merchant.** Merchant payTo `0x212686404A7D1E1fD88F35eD6200c3aF7A78ae31` (Base eip155:8453 USDC).
2. **Payer ∉ X402_SELF_WALLETS** (includes `0x4dB7AAFbe797a39Cd6Cc4E7aa64d970F7F6E02B7`). If it is in that set, the settle is a rail proof, not revenue.
3. **Door** is a real SKU (`/api/request-attestation` or a paid MCP tool), not `/api/free-door`.
4. **UTM / referrer** recorded: `ref` query or `x402-list` / PayAI / Glama / proofof.ai.
5. **Live till** `GET https://councilof.ai/api/revenue` — note `one_number.all_time` **before** the tx.

## After (PayAI indexing)

```
curl -sS "https://facilitator.payai.network/discovery/resources/$(python3 -c 'import urllib.parse; print(urllib.parse.quote("https://councilof.ai/api/request-attestation",safe=""))')/stats"
```

Expect last7d settlements to move only if the payer is non-self.

## Attribution report (fill at settle)

| Field | Value |
|---|---|
| as_of | |
| door | |
| payer | |
| self? | yes/no |
| amount (from 402 accepts[] only) | |
| tx hash | |
| referrer | |
| revenue/revenue-excluded | |

**Done-when:** this pack is green **before** Nick signs. This TUI does not sign the tx.
