# x402 Self-Test — Challenge Evidence

**Date:** 2026-09-11T12:33:30Z  
**Classification:** INTERNAL_SELF_FUNDED  
**Revenue impact:** Zero. Payment NOT executed (owner gate).

## Step 1: Discovery — PASS

- GET https://councilof.ai/.well-known/x402.json → HTTP 200
- Schema: csoai.x402/0.2
- Mode: live
- Network: eip155:8453 (Base)
- Asset: USDC (0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913)
- payTo: 0x212686404A7D1E1fD88F35eD6200c3aF7A78ae31
- Resources: 9 (1 free + 8 paid)

## Step 2: Free Door Challenge — PASS

- GET https://councilof.ai/api/free-door → HTTP 402
- Amount: 0 USDC (free forever, rail proof)
- Behavior: Returns x402 challenge with accepts[] entry at amount "0"
- Signed offer receipt: JWS EdDSA (kid did:web:csoai.org#board-attestation-1)
- Proof: A zero-amount 402 settles and charges nothing — proves the rail works

## Step 3: Request-Attestation Challenge — PASS

- GET https://councilof.ai/api/request-attestation?subject=llama3.2:3b → HTTP 402
- Amount: 10000 atomic units (0.01 USDC with 6 decimals)
- Campaign: csoai-launch-30d-20260911 (PROMO_EXISTING_DATA)
- Normal price: 20000 (0.02 USDC), promo: 10000 (0.01 USDC)
- Campaign period: 2026-09-11 to 2026-10-11
- Fresh compute excluded: true
- Signed offer receipt: JWS EdDSA present in extensions.offer-receipt
- Signature: EdDSA over compact JWS serialization
- Verify: base64url-decode JWS payload, fetch did:web:csoai.org DID doc, take #board-attestation-1 public key, verify Ed25519 over header.payload

## Step 4: Payment — BLOCKED (Owner Gate)

Cannot execute without a funded Base wallet. The x402 protocol requires:
1. Client reads 402 response's accepts[] entry
2. Client creates USDC transfer authorization (EIP-3009 or permit)
3. Client sends X-PAYMENT header with encoded payment proof
4. Server verifies via facilitator (/verify then /settle)
5. Server returns 200 with X-PAYMENT-RESPONSE SettlementResponse

**Required:** Funded wallet with 0.01 USDC on Base mainnet + x402-fetch client library.

## Step 5: Settlement — BLOCKED (depends on Step 4)

## Step 6: Receipt Verification — BLOCKED (depends on Step 5)

## Key Finding

The x402 offer-receipt extension is LIVE and emitting signed JWS EdDSA offers. The agent-card.json extension description says "DRAFT WE PUBLISH AND DO NOT YET EMIT" — this is now inaccurate for x402 offer-receipts (while the A2A signed-receipts extension remains draft-only).

## Evidence Files

- Free-door 402 response: captured via curl, full JSON with extensions.bazaar + extensions.offer-receipt
- Request-attestation 402 response: captured via curl, full JSON with pricing, campaign, signed offer
- Both responses carry: scheme=exact, network=eip155:8453, asset=USDC, payTo=0x21268...
