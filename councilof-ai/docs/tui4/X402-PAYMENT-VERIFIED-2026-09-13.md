# x402 Payment — Verified Evidence

**Date:** 2026-09-12T06:15:53Z
**Classification:** INTERNAL_SELF_FUNDED
**Revenue impact:** Zero (self-payment)

## Transaction

| Field | Value |
|-------|-------|
| Transaction | `0xeaaafb8a8e087cf5148f5fa59cfe7b773689bf686e2e99be8f7c4a7c393e8807` |
| Chain | Base (eip155:8453) |
| Status | OK |
| Amount | 0.01 USDC (10,000 atomic units) |
| Subject | llama3.2:3b |
| Payer | 0x6ea00613c15f2463bC10c7188215c4FA6f4943C6 (burner wallet) |
| Pay-to | 0x212686404A7D1E1fD88F35eD6200c3aF7A78ae31 |
| Campaign | csoai-launch-30d-20260911 |

## End-to-End Flow (All Steps Passed)

| Step | Result | Evidence |
|------|--------|----------|
| 1. Discovery | PASS | GET /.well-known/x402.json |
| 2. Challenge | PASS | HTTP 402, amount=0.01 USDC |
| 3. Signing | PASS | EIP-3009 with burner wallet |
| 4. Settle | PASS | tx on Base mainnet |
| 5. Delivery | PASS | Signed card returned |
| 6. Verify | PASS | root.json Ed25519 signed |
| 7. Receipt | PASS | JWS EdDSA in X-PAYMENT-RESPONSE |

Self-funded test. Revenue remains zero.
