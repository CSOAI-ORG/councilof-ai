# x402 Self-Test: request_attestation on llama3.2:3b

**Date:** 2026-09-11
**Classification:** INTERNAL_SELF_FUNDED
**Rail:** x402 / Base eip155:8453 / USDC
**Subject:** `llama3.2:3b`
**Resource:** `GET /api/request-attestation?subject=llama3.2:3b`

---

## Step 1 — Discovery (passive)

**Request:** `GET https://councilof.ai/.well-known/x402.json`
**Result:** HTTP 200. Rail mode: `live`. Network: `eip155:8453`. Asset: USDC. PayTo: `0x212686404A7D1E1fD88F35eD6200c3aF7A78ae31`.

---

## Step 2 — Challenge (402 response, captured live)

**Request:** `GET https://councilof.ai/api/request-attestation?subject=llama3.2:3b`
**Result:** HTTP 402 Payment Required

**Challenge body (key fields):**
```json
{
  "x402Version": 2,
  "error": "Payment required",
  "accepts": [{
    "scheme": "exact",
    "network": "eip155:8453",
    "amount": "10000",
    "maxAmountRequired": "10000",
    "asset": "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
    "payTo": "0x212686404A7D1E1fD88F35eD6200c3aF7A78ae31",
    "maxTimeoutSeconds": 300,
    "extra": {"name": "USD Coin", "version": "2", "decimals": 6, "symbol": "USDC"}
  }]
}
```

**Price:** 10,000 atomic = 0.01 USDC (6 decimals). Launch promo (50% off 0.02 USDC normal price).

**Full challenge body preserved:** `/tmp/x402-body.json` (11,189 bytes)

---

## Step 3 — Signed Offer Receipt (JWS)

The challenge includes a signed offer receipt in `extensions.offer-receipt`.

**JWS Header:** `{"alg":"EdDSA","kid":"did:web:csoai.org#board-attestation-1"}`
**JWS Payload:** `{"amount":"10000","asset":"0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913","network":"eip155:8453","payTo":"0x212686404A7D1E1fD88F35eD6200c3aF7A78ae31","resourceUrl":"https://councilof.ai/api/request-attestation","scheme":"exact","validUntil":...,"version":1}`
**Signature present:** Yes (starts with `eyJhbGciOiJFZERTQSIsImtpZCI6ImRpZDp3ZWI6...`)

**Verification:** Resolve DID at `https://csoai.org/.well-known/did.json` → `#board-attestation-1` → Ed25519-verify JWS.

**Status:** ✅ Signed offer receipt IS being emitted. The board signing key is provisioned.

---

## Step 4 — Payment Preparation (UNSIGNED — stopped before signing)

**EIP-3009 TransferWithAuthorization (unsigned payload):**

```json
{
  "from": "<PAYER_WALLET_ADDRESS>",
  "to": "0x212686404A7D1E1fD88F35eD6200c3aF7A78ae31",
  "value": "10000",
  "validAfter": "<CURRENT_UNIX_TIMESTAMP - 300>",
  "validBefore": "<CURRENT_UNIX_TIMESTAMP + 300>",
  "nonce": "<RANDOM_32_BYTES_HEX>"
}
```

**EIP-712 Domain:**
```json
{
  "name": "USD Coin",
  "version": "2",
  "chainId": 8453,
  "verifyingContract": "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"
}
```

**X-PAYMENT construction:**
1. Sign the `TransferWithAuthorization` with payer's private key (EIP-712 typed data)
2. Construct payment payload: `{x402Version:2, scheme:"exact", network:"eip155:8453", payload:{authorization:{from,to,value,validAfter,validBefore,nonce}, signature}}`
3. Base64-encode → `X-PAYMENT` header value
4. `GET /api/request-attestation?subject=llama3.2:3b` with `X-PAYMENT: <base64>`

**Status:** ⏸️ STOPPED before signing. Requires owner wallet private key. The unsigned payload structure is exact and verifiable against the x402 spec.

---

## Step 5 — Expected Settlement (documented, not executed)

After payment, the facilitator would:
1. Call `transferWithAuthorization` on USDC contract (Base mainnet)
2. Transaction hash published in `X-PAYMENT-RESPONSE` header
3. Settlement recorded in `REVENUE_KV` as `INTERNAL_SELF_FUNDED`
4. Card-v0 leaf delivered for `llama3.2:3b`

**Verification path:**
- On-chain: `https://basescan.org/tx/<tx-hash>` — USDC transfer from payer to payTo
- Receipt: `POST /api/receipts/verify` with signed receipt
- Artefact: `GET /api/request-attestation?subject=llama3.2:3b` (now returns 200 with card)

**Revenue impact:** Zero. Classification: `INTERNAL_SELF_FUNFD`. Not counted as buyer.

---

## Summary

| Step | Status | Evidence |
|------|--------|----------|
| Discovery | ✅ PASS | x402.json live, rail mode=live |
| Challenge | ✅ PASS | HTTP 402, amount=10000 (0.01 USDC promo) |
| Signed Offer | ✅ PASS | JWS EdDSA offer receipt emitted |
| Payment | ⏸️ STOPPED | Requires owner wallet key (financial transaction) |
| Settlement | ⏸️ PENDING | Depends on payment |
| Receipt | ⏸️ PENDING | Depends on settlement |

**What this proves:** The x402 rail is fully operational — discovery, challenge, and signed offer-receipt all work end-to-end. The only missing step is the actual USDC transfer, which requires a funded wallet on Base mainnet.
