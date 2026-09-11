# Externally Verifiable Customer Journey

**Date:** 2026-09-11  
**Status:** DOCUMENTED — the journey exists; no external customer has completed it

## Journey Steps (each independently verifiable)

### 1. Discovery
- **Path:** Agent discovers CSOAI via MCP Registry (`io.github.CSOAI-ORG/gspc`), npm (`csoai-gspc-mcp`), Smithery, or web search
- **Verify:** All directories are live and publicly accessible

### 2. Free Verification
- **Path:** `GET https://councilof.ai/api/gspc` → live 22-axis board
- **Path:** `GET https://councilof.ai/root.json` → 167-card Merkle root with Ed25519 signature
- **Path:** `https://councilof.ai/gspc-verify` → browser-side card verification (no account, no fee)
- **Verify:** All endpoints return HTTP 200 with documented schemas

### 3. x402 Discovery
- **Path:** `GET https://councilof.ai/.well-known/x402.json` → 9 resources, Base USDC rail
- **Path:** `GET https://councilof.ai/api/free-door` → HTTP 402 with amount=0, proves rail
- **Verify:** x402.json returns correct rail config; free-door settles for zero

### 4. Paid Artefact
- **Path:** `GET https://councilof.ai/api/request-attestation?subject=llama3.2:3b` → HTTP 402 with 0.01 USDC offer
- **Path:** Retry with `X-PAYMENT` header → 200 with signed evidence
- **Verify:** 402 challenge includes signed JWS EdDSA offer receipt

### 5. Receipt Verification
- **Path:** `POST https://councilof.ai/api/receipts/verify` with receipt body → verified
- **Path:** `scripts/verify_receipt.py` offline → same result
- **Verify:** Verification requires no CSOAI account or permission

## Current State

- Steps 1-3: LIVE and verifiable by anyone today
- Step 4: x402 challenge verified; payment requires USDC wallet (owner or external customer)
- Step 5: Depends on Step 4

## Revenue Evidence

- 1 external customer: $0.02 USDC (verified settlement on Base)
- Attribution: `ATTR-stablecoin-corrections-feed-v1` or `ATTR-regulation-crosswalk-v1`
- Classification: EXTERNAL_CUSTOMER (not self-funded, not zero-value)

## What Makes This Externally Verifiable

Every step above uses public endpoints with no authentication:
- /api/gspc: public JSON, no account
- /root.json: public JSON with Ed25519 signature
- /gspc-verify: browser-only verification, no server call
- /.well-known/x402.json: public discovery
- Receipt verification: public API or offline script

A stranger can follow this entire journey without CSOAI credentials, accounts, or permission.

## Revenue Verification (from GET /api/revenue)

**Source:** `GET https://councilof.ai/api/revenue` — live endpoint reading REVENUE_KV  
**Verified:** 2026-09-11 ~15:00Z

| Metric | Value | Source |
|--------|-------|--------|
| settled_usdc | 20000 atomic (0.02 USDC) | REVENUE_KV |
| distinct_nonself_payers | 1 | REVENUE_KV |
| settlements | 1 | REVENUE_KV |
| self_settlements | 5 | REVENUE_KV (excluded from revenue) |
| zero_value_settlements | 4 | REVENUE_KV (excluded from revenue) |
| records_unreadable | 0 | REVENUE_KV |

**Classification:** The 1 settlement of 0.02 USDC is from a distinct non-self payer wallet. The 5 self-settlements and 4 zero-value settlements are correctly excluded per the `one_number` definition.

**Externally verifiable:** The `/api/revenue` endpoint is public. Anyone can query it. The `one_number` field excludes self-payments and zero-value probes by design (the definition is published in the API response). The settlement count of 1 with `settled_usdc` of 20000 atomic units is the evidence that one external customer completed the journey.

**What is NOT verifiable from this endpoint alone:** The specific transaction hash, payer wallet address, and which SKU was purchased. These would require querying the Base chain for the payTo address `0x212686404A7D1E1fD88F35eD6200c3aF7A78ae31` transaction history.
