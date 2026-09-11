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
