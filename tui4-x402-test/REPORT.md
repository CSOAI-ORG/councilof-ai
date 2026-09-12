# TUI-4 x402 Payment Test — CSOAI request_attestation

**Label:** INTERNAL_SELF_FUNDED — Revenue remains zero  
**Timestamp:** 2026-09-12T04:55:00Z  
**Target:** `https://councilof.ai/api/request-attestation` (subject=llama3.2:3b, axis=governance)  
**Burner Wallet:** `0x6ea00613c15f2463bC10c7188215c4FA6f4943C6`  
**PayTo (CSOAI treasury):** `0x212686404A7D1E1fD88F35eD6200c3aF7A78ae31`

---

## Result Summary

| Step | What | Status |
|------|------|--------|
| 1. Discovery | GET `/.well-known/x402.json` | **PASS** — Full catalog returned, 9 resources, mode=live |
| 2. Free door | GET `/api/free-door` | **PASS** — 402 challenge with amount=0, JWS offer signed |
| 3. Price challenge | POST `/api/request-attestation` without payment | **PASS** — 402 with accepts[0].amount=10000 (0.01 USDC promo) |
| 4. Balance check | eth_call on USDC contract | **0.000000 USDC** |
| 4b. ETH check | eth_getBalance | **0.0 ETH** |
| 5. Payment execution | EIP-3009 sign + submit | **SIGNATURE VALID, PAYMENT REJECTED (unfunded)** |

**Overall: PARTIAL** — Full flow exercised end-to-end. Signature pipeline works. Blocked by zero wallet balance.

---

## Step 1: x402 Catalog Discovery

**File:** `step1-x402-catalog.json`

Key findings:
- **Schema:** `csoai.x402/0.2`
- **Network:** `eip155:8453` (Base mainnet)
- **Asset:** USDC `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`
- **PayTo:** `0x212686404A7D1E1fD88F35eD6200c3aF7A78ae31`
- **Mode:** `live` (not demo/sandbox)
- **Resources:** 9 payable endpoints:
  1. `/api/free-door` — amount=0, free forever
  2. `/api/request-attestation` — issuance, 0.01 USDC promo (normally 0.02)
  3. `/api/evidence-bundle` — assembly, EU AI Act bundles
  4. `/api/eunomia-data` — assembly, data feeds
  5. `/api/proof` — assembly, Merkle inclusion proofs
  6. `/api/rwa/evidence` — issuance, RWA asset evidence
  7. `/api/art50/marking-evidence` — assembly, Art. 50 marking
  8. `/api/feeds/provider-diff` — assembly, provider change records
  9. `/api/receipts/batch` — assembly, historical card batches
- **Extensions:** offer-receipt (JWS/EdDSA, kid=`did:web:csoai.org#board-attestation-1`)
- **MCP endpoint:** `https://councilof.ai/mcp` (streamable-http), 4 paid tools + 8 free tools
- **Quarantined:** witness endpoint (pre-release gate)
- **Indexed in:** x402 Bazaar (PayAI)

---

## Step 2: Free Door

**File:** `step2-free-door.json`

- HTTP 402 returned (amount=0, USDC, Base mainnet)
- Offer JWS signed by board-attestation-1 key
- `csoai_pricing.normal_amount_atomic: "0"` — genuinely free, not a promo
- Description: "the Bazaar door itself: this resource is free and settles for zero"

---

## Step 3: Price Challenge (No Payment)

**File:** `step3-402-challenge.json`

- HTTP 402 Payment Required
- **Amount:** 10,000 atomic units = **0.01 USDC**
- **Pricing:** `PROMO_EXISTING_DATA` — promo campaign `csoai-launch-30d-20260911`
  - Normal: 20,000 atomic (0.02 USDC)
  - Promo: 10,000 atomic (0.01 USDC)
  - Window: 2026-09-11 → 2026-10-11
  - `fresh_compute_excluded: true` (existing data only)
- **Offer JWS:** Signed (EdDSA, kid=did:web:csoai.org#board-attestation-1)
- **Preview** included: subject=llama3.2:3b, axis=governance, axis_known=false, 0 signed cards on file
- **Not paid reason:** "no x-payment header"

---

## Step 4: Wallet Balance

**File:** `step4-usdc-balance.json`, `step4-eth-balance.json`

- **USDC balance:** 0.000000 USDC (result = `0x00...00`)
- **ETH balance:** 0.0 ETH (result = `0x0`)

The burner wallet is **unfunded**. Neither USDC nor ETH (for gas) is present on Base mainnet.

---

## Step 5: Payment Attempt

**File:** `evidence-executed.json`, `sign-payment.cjs`

### What was executed:
1. **402 challenge captured** — exact amount, payTo, asset confirmed
2. **EIP-3009 transferWithAuthorization** built:
   - Domain: `{name: "USD Coin", version: "2", chainId: 8453, verifyingContract: USDC_ADDRESS}`
   - Authorization: from=PAYER, to=PAY_TO, value=10000, validAfter/validBefore window
   - Random 32-byte nonce
3. **EIP-712 typed data signature** generated with burner private key
4. **Signature verification passed:** `recovered === PAYER_ADDRESS` ✅
5. **x-payment header** built (base64-encoded JSON with signature + authorization)
6. **POST submitted** with x-payment header
7. **HTTP 402 returned** — payment not settled (expected: wallet has no USDC to transfer)

### Signature details:
- Signature: `0x9a13f1dc061e839ba8c66e1fe43f11fc0c2fdde1ef39904ef573a91f2b884cac2e7d39d56f952afa581cc55de49e8d07e03d75b4f9e4cebae0a4f3a57f11736f1b`
- Recovered: `0x6ea00613c15f2463bC10c7188215c4FA6f4943C6`
- Valid: true

### Why it failed:
The x402 facilitator (server-side) attempts to settle the EIP-3009 authorization on-chain. With 0 USDC in the payer wallet, the on-chain transfer would revert. The server returns 402 again rather than delivering the artefact.

---

## Receipts Check

**File:** `step4-receipts.json` (inline in evidence-executed.json)

- Endpoint: `/api/receipts?payer=0x6ea...43C6`
- Status: `OK`
- Count: 0 (no receipts for this payer)
- Honesty note: "An empty list means 'this payer has no receipts'"

---

## What's Needed to Complete

1. **Fund the burner wallet** with at least 0.01 USDC on Base mainnet
   - Send to: `0x6ea00613c15f2463bC10c7188215c4FA6f4943C6`
   - Network: Base (chain 8453)
   - Asset: USDC (`0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`)
   - Minimum: 0.01 USDC + a small amount of ETH for gas (~0.0001 ETH)
   - Note: No ETH needed if using EIP-3009 (gasless for the payer — the facilitator pays gas). But some USDC is needed.
2. **Re-run** `node sign-payment.cjs` from this directory
3. **Expected:** HTTP 200 with commissioned card, receipt signed by board key

---

## Pricing Detail (for future reference)

| Product | SKU | Normal | Promo | Notes |
|---------|-----|--------|-------|-------|
| request_attestation | per_request | 0.02 USDC | 0.01 USDC | 30-day launch promo until 2026-10-11 |
| evidence-bundle | per_bundle | TBD | TBD | EU AI Act compliance |
| eunomia-data | per_feed | TBD | TBD | Data feeds |
| proof | per_bundle | TBD | TBD | Merkle proofs |

---

## Files in This Directory

| File | Content |
|------|---------|
| `REPORT.md` | This report |
| `sign-payment.cjs` | Reusable payment signing script (CJS, ethers v6) |
| `evidence-executed.json` | Full evidence from payment attempt |
| `step1-x402-catalog.json` | Raw x402 catalog response |
| `step2-free-door.json` | Raw free-door 402 challenge |
| `step3-402-challenge.json` | Raw request-attestation 402 challenge |
| `step4-usdc-balance.json` | Raw USDC balance RPC response |
| `step4-eth-balance.json` | Raw ETH balance RPC response |
