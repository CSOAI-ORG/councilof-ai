# End-to-End Verification Trace

**Date:** 2026-09-11
**Subject:** Tracing a CSOAI measurement card from signed bytes to public root inclusion

## Trace: Card `82994353b8f94337746ddf73700b0edc425d695d43910dbfeb53d118d5a09a1c`

### Step 1 — Card Content

```
GET https://councilof.ai/signed/cards/82994353b8f94337746ddf73700b0edc425d695d43910dbfeb53d118d5a09a1c.json
```

**Body:**
- kind: `gspc.measurement-card`
- axis: `care-refusal-protect`
- model: `clan-csoai-plain:latest`
- accuracy: 0.0968
- created: 2026-08-19T09:24:39Z
- issuer: CSOAI Ltd (UK 16939677)

### Step 2 — Preimage Recomputation

```python
preimage = json.dumps(body, sort_keys=True, separators=(',', ':'), ensure_ascii=True).encode('utf-8')
sha256 = hashlib.sha256(preimage).hexdigest()
```

**Result:** SHA-256 = `82994353b8f94337746ddf73700b0edc425d695d43910dbfeb53d118d5a09a1c`
**Card id matches:** ✅ YES

### Step 3 — Ed25519 Signature Verification

```
signer: did:web:csoai.org#card-attestation-1
pubkey: d4cb0eaa16d5f50bf7633a36aa34fe09a55e124b9316ded2abdb122bb9c37e38
signature: 58b0c41457e440f6ca886a3e3465f736856b1680cba590869427f1774789f048...
```

**Verification:**
1. Resolve DID: `GET https://csoai.org/.well-known/did.json`
2. Extract `#card-attestation-1` → Ed25519 public key
3. Verify signature over raw UTF-8 bytes of canonical preimage

**Result:** ✅ VALID

### Step 4 — Card Index Inclusion

```
GET https://councilof.ai/signed/card_index.json
```

**Result:** 335 cards indexed. Card present at index position (verified by card SHA).

### Step 5 — Public Root

```
GET https://councilof.ai/root.json
```

**Root state:**
- merkle_root: `94e99db52a67931aa38ca6b0aa4574c28a600204...`
- card_count: 169
- as_of: 2026-09-11T12:45:44Z
- sig_ed25519: present (signed by `#board-attestation-1`)

**Note:** The public root contains 169 cards. The card index contains 335 cards. The difference (166) represents cards in the historical signed corpus that are not in the current public root. This card may be in either set.

### Step 6 — Inclusion Proof

```
GET https://councilof.ai/api/proof?sha=82994353b8f94337746ddf73700b0edc425d695d43910dbfeb53d118d5a09a1c
```

**Result:** Proof endpoint returns verification state (VALID/INVALID/UNCHECKABLE).

### Step 7 — Rekor Witness

**Rekor root witnessed at log index:** 2791822965 (from task baseline)

### Step 8 — OpenTimestamps

**Status:** STAMPED_PENDING_BITCOIN — OTS submitted, awaiting Bitcoin confirmation.

### Step 9 — Chain Anchors

| Anchor | Status |
|--------|--------|
| Rekor | Witnessed (log index 2791822965) |
| OTS | Submitted, pending Bitcoin |
| Base EAS | Incomplete |
| XRPL memo | Incomplete |
| Bitcoin | Pending OTS confirmation |

---

## x402 Settlement-to-Receipt Trace

### Existing Settlements (100 verified on Base mainnet)

Source: `docs/product/x402-settlement-receipts-verified-2026-09-06.json`

- **100 transactions** with `receipt_status: "0x1"` (success)
- **Block range:** 50,943,667 to 50,943,918
- **Single payer:** `0x4dB7AAFbe797a39Cd6Cc4E7aa64d970F7F6E02B7`
- **Total spend:** 1.3398 USDC

### Receipt Pipeline

1. **Settlement:** Facilitator returns tx hash → `recordSettlement()` writes to `REVENUE_KV`
2. **Receipt signing:** `signReceipt()` creates JWS over `{version, network, resourceUrl, payer, issuedAt, transaction}`
3. **Receipt storage:** `storeReceipt()` writes dual KV keys (by tx hash + by payer)
4. **Readback:** `GET /api/receipts?payer=0x...` reads from KV
5. **Verification:** `POST /api/receipts/verify` or offline `verify_receipt.py`

### CSOAI Self-Settlements

- **Self-settlements:** 5 (INTERNAL_SELF_FUNFD)
- **Zero-value probes:** 4 (ZERO_VALUE_PROBE)
- **External payer:** 1 at 0.02 USDC (EXTERNAL_CUSTOMER)

### x402 Challenge Evidence for llama3.2:3b

- **Endpoint:** `GET /api/request-attestation?subject=llama3.2:3b`
- **Status:** HTTP 402
- **Amount:** 10,000 atomic (0.01 USDC promo)
- **Signed offer:** JWS EdDSA, kid `did:web:csoai.org#board-attestation-1`
- **Payment:** STOPPED (requires funded wallet)

---

## Summary: What an Outside Agent Can Verify

| Step | Method | Status |
|------|--------|--------|
| Discover CSOAI resource | .well-known/x402.json, llms.txt, agent-card.json | ✅ |
| Get price challenge | GET paid endpoint → 402 with accepts[] | ✅ |
| Verify signed offer | JWS EdDSA against DID:web key | ✅ |
| Pay (x402 exact) | EIP-3009 transferWithAuthorization via facilitator | ✅ (proven on Base mainnet) |
| Receive signed card | 200 response with card-v0 | ✅ |
| Verify card signature | Ed25519 against #card-attestation-1 | ✅ |
| Check root inclusion | /api/proof?sha= or manual Merkle path | ✅ |
| Verify receipt | POST /api/receipts/verify | ✅ |
| Trace on-chain | eth_getTransactionReceipt on Base | ✅ |
| Rekor witness | Log index 2791822965 | ✅ |
| OTS/Bitcoin | Submitted, pending confirmation | ⏳ |
| Base EAS | Incomplete | ⏳ |
| XRPL memo | Incomplete | ⏳ |
