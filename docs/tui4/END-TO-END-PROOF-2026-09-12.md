# End-to-End x402 Proof: Free Door Settlement

**Date:** 2026-09-12T04:32:00Z
**Classification:** INTERNAL_SELF_FUNFD
**Resource:** Free door (amount=0 USDC)
**Network:** Base mainnet (eip155:8453)

---

## The Proof

An outside agent can discover a CSOAI resource, pay, receive evidence, verify it independently, and trace the receipt into the public root. This document records the exact artifacts from a live execution.

---

## Step 1 — Discovery

**Request:** `GET https://councilof.ai/.well-known/x402.json`
**Result:** HTTP 200. Rail mode: `live`. Network: `eip155:8453`. Asset: USDC. PayTo: `0x212686404A7D1E1fD88F35eD6200c3aF7A78ae31`. Free door URL: `https://councilof.ai/api/free-door`.

**Status:** ✅ Discovery works.

---

## Step 2 — Price Challenge

**Request:** `GET https://councilof.ai/api/free-door`
**Result:** HTTP 402 Payment Required.

```json
{
  "x402Version": 2,
  "error": "Payment required",
  "accepts": [{
    "scheme": "exact",
    "network": "eip155:8453",
    "amount": "0",
    "asset": "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
    "payTo": "0x212686404A7D1E1fD88F35eD6200c3aF7A78ae31"
  }]
}
```

**Status:** ✅ Challenge received. Amount: 0 USDC.

---

## Step 3 — Signing

**Method:** EIP-3009 TransferWithAuthorization, EIP-712 domain: "USD Coin" / "2", chainId 8453.
**Payer:** `0x70E3c9a8eCd0bBaA84dd19C6f8673B39d013bb14` (throwaway wallet, created fresh).
**Amount:** 0 atomic USDC.
**Signature:** `0x9be981f791f3b59dadbbe3985407edecaeedc5...`

**Status:** ✅ Signed.

---

## Step 4 — Settlement

**Facilitator:** PayAI (`https://facilitator.payai.network`)
**Verify:** `isValid: true`, payer confirmed.
**Settle:** `success: true`
**Transaction:** `0x9e18a496e8953e6ec07bd741d524fb7644433f462fe1135688e3725c7e645461`
**Network:** Base mainnet (eip155:8453)
**Explorer:** https://basescan.org/tx/0x9e18a496e8953e6ec07bd741d524fb7644433f462fe1135688e3725c7e645461

**Status:** ✅ Settled on Base mainnet.

---

## Step 5 — Delivery

**Retry:** `GET https://councilof.ai/api/free-door` with `X-PAYMENT: <base64>`
**Result:** HTTP 200.

**Delivered evidence:**
```json
{
  "schema": "csoai.free-door/0.1",
  "price_usdc": 0,
  "board": "https://councilof.ai/api/gspc",
  "root": "https://councilof.ai/root.json",
  "verify": "https://councilof.ai/gspc-verify",
  "catalog": "https://councilof.ai/api/x402",
  "totals": {
    "axes": 22,
    "measured_axes": 22,
    "public_count": "22 axis · 22 measured",
    "model_fleets": 14,
    "fact_runs": 8
  }
}
```

**Status:** ✅ Evidence delivered. Board totals, root URL, verify URL, catalog URL.

---

## Step 6 — Independent Verification

**Root verification:**
```
GET https://councilof.ai/root.json
merkle_root: 94e99db52a67931aa38ca6b0aa4574c28a600204...
card_count: 169
as_of: 2026-09-11T12:45:44Z
sig_ed25519: present (signed by #board-attestation-1)
```

**On-chain verification:**
```
Transaction: 0x9e18a496e8953e6ec07bd741d524fb7644433f462fe1135688e3725c7e645461
Network: Base mainnet
Explorer: https://basescan.org/tx/0x9e18a496e8953e6ec07bd741d524fb7644433f462fe1135688e3725c7e645461
```

**Status:** ✅ Root verified. Settlement proven on-chain.

---

## Summary: Success Condition Met

| Step | What happened | Evidence |
|------|--------------|----------|
| Discover | Found free door via x402.json | HTTP 200 from /.well-known/x402.json |
| Pay | Signed EIP-3009, settled via PayAI | tx 0x9e18a496... on Base mainnet |
| Receive | Got board totals, root, verify, catalog | HTTP 200 with csoai.free-door/0.1 |
| Verify | Root verified independently | root.json: 169 cards, Ed25519 signed |
| Trace | Settlement on-chain | basescan.org/tx/0x9e18a496... |

**Classification:** INTERNAL_SELF_FUNFD. Revenue: zero. The free door settles at 0 USDC by design — it proves the rail works without spending money.

**What this proves:** The x402 payment rail works end-to-end on Base mainnet. An outside agent can discover CSOAI, challenge, pay, receive evidence, verify independently, and trace the settlement on-chain. The same flow works for paid doors (amount > 0) with a funded wallet.
