# PHASE3 — Paddle setup runbook for Nick

**Purpose:** Turn the PHASE3 checklist into a step-by-step guide with
exact commands. This runbook takes Nick from "no Paddle account" to
"first real $0.01 USDC transaction, certificate issued, verifiable
offline" — or, if the signing key is already live, from "Paddle account"
to "webhook wired."

**Lane boundary:** This runbook contains the exact commands, the exact
SKUs, the exact webhook payload shape, and the verification steps.
It does NOT contain Nick's Paddle credentials, the signing key, or
the wallet private key — those stay in Nick's head/keychain.

**Prerequisites (already shipped by the agent):**
- `POST /api/refund` — live on master, idempotent, backed by LEADS KV
- `csoai.certificate/0.1` schema — live at `public/schemas/`
- `csoai_verify` cert verification — live at `tools/verify/csoai_verify.py`
- `/api/certificate-schema` — live on master, describes the issuance contract
- `_skus.ts` — the pricing atoms (owner-decision, overridable by env var)
- The 402/x402 challenge rail is already live and tested (15 settlements on Base mainnet)

---

## Step 1 — Create a Paddle account (Nick, one-time)

Go to **https://paddle.com** and create a seller account for **CSOAI Ltd** (UK Companies House 16939677).

| Field | Value |
|---|---|
| Company name | CSOAI Ltd |
| Country | United Kingdom |
| Currency | GBP (default), accept USD for USDC-exposed customers |
| Website | https://councilof.ai |

Once approved (usually < 24 hours), you'll have access to the Paddle
Dashboard. Keep the seller credentials safe — they go in Cloudflare
Pages secrets, not in the repo.

---

## Step 2 — Create the Paddle product (Nick, one-time)

In the Paddle Dashboard → Products, create ONE product:

| Field | Value |
|---|---|
| Product name | CSOAI Measurement Card — Issuance |
| Description | One signed measurement card issued under the CSOAI public root. Ed25519 signature, Merkle inclusion proof. Verification at councilof.ai/gspc-verify. |
| Price | $0.02 USD (the issuance reserve atom from `_skus.ts`) |
| Billing type | One-time (not recurring) |
| Tax category | Digital services (UK VAT rules apply) |

After creation, note the **Product ID** (e.g. `pro_01abcdef`) and
**Price ID** (e.g. `pri_01abcdef`). These go in Cloudflare secrets.

---

## Step 3 — Configure the webhook (Nick, one-time)

In Paddle Dashboard → Developer → Webhooks, create a webhook:

| Field | Value |
|---|---|
| Endpoint URL | `https://councilof.ai/api/paddle-webhook` |
| Events | `transaction.completed`, `transaction.payout_created` |
| Secret | Paddle generates one; copy it to Cloudflare Pages secrets |

The endpoint (`/api/paddle-webhook`) does not exist yet — Nick creates
the secret now, M4 wires the endpoint in the next step.

---

## Step 4 — Wire the webhook handler (M4)

Create `functions/api/paddle-webhook.ts` with this contract:

```typescript
// POST /api/paddle-webhook — Paddle transaction.completed webhook
//
// 1. Verify Paddle's HMAC signature (using PADDLE_WEBHOOK_SECRET).
// 2. Parse the transaction: extract customer email, product_id, price_id, amount.
// 3. Call the internal entitlement grant function.
// 4. Call the cert issuance function (produces a csoai.certificate/0.1 doc).
// 5. Return 200 to Paddle (never 5xx on a transient failure — retry is Paddle's job).
//
// SKUs from functions/api/_skus.ts:
//   issuance.reserve → $0.02 (the atom)
//   evidence_bundle.bundle → $250
//   request_attestation.per_request → $0.02
//
// The cert payload is:
//   { schema, certificate_id, issued_at, issuer_did, payload, sig_ed25519, limits }
// where:
//   certificate_id = sha256(canon(payload))
//   sig_ed25519 = Ed25519_sign(canon(payload), BOARD_SIGN_KEY_PKCS8)
//   issuer_did = "did:web:csoai.org#board-attestation-1"
//
// Tools/verify/csoai_verify.py already verifies this shape.
```

The webhook handler must:
1. Verify the Paddle signature (HMAC-SHA256 over the raw body with the webhook secret).
2. Extract the customer email, Paddle transaction id, amount, currency.
3. Call `POST /api/refund`'s inverse: grant the entitlement (in KV or a DB).
4. Issue the certificate:
   - Build the payload (subject, entitlement, scope, verification).
   - Compute `certificate_id = sha256(canon(payload))`.
   - Sign: `sig_ed25519 = Ed25519_sign(canon(payload), BOARD_SIGN_KEY_PKCS8)`.
   - Store the cert and send it to the customer (email or API response).
5. Return 200 to Paddle (Paddle retries on non-2xx).

**Cloudflare secrets needed:**

| Secret | Purpose | Set by |
|---|---|---|
| `PADDLE_WEBHOOK_SECRET` | Verify webhook HMAC | Nick in Paddle dashboard |
| `PADDLE_PRODUCT_ID` | Match incoming transactions to SKUs | Nick after Step 2 |
| `PADDLE_PRICE_ID` | Match incoming transactions to SKUs | Nick after Step 2 |
| `BOARD_SIGN_KEY_PKCS8_B64` | Ed25519 signing key (base64 PKCS8) | Nick on the brain host |

---

## Step 5 — Set the Cloudflare secrets (Nick)

In the Cloudflare Dashboard → Pages → Settings → Environment
variables → Production, set:

| Variable | Value | Notes |
|---|---|---|
| `PADDLE_WEBHOOK_SECRET` | (from Paddle dashboard, Step 3) | Secret, do not commit |
| `PADDLE_PRODUCT_ID` | (from Paddle dashboard, Step 2) | |
| `PADDLE_PRICE_ID` | (from Paddle dashboard, Step 2) | |
| `BOARD_SIGN_KEY_PKCS8_B64` | (the base64-encoded PKCS8 Ed25519 private key) | **This is the signing key** |
| `X402_PRICE_ISSUANCE_RESERVE_USD` | `0.02` | Override if needed |

These secrets are available to Pages Functions at runtime via `env.SECRET_NAME`.

---

## Step 6 — Flip `/pricing` to live checkout (M4 + Nick)

One commit, small change. In `client/src/pages/Pricing.tsx`:

```tsx
// Before (current):
export default function Pricing() {
  return <Redirect to="/dashboard?task=pricing-overview&tab=measured" />;
}

// After (live checkout):
export default function Pricing() {
  return <Redirect to="/dashboard?task=pricing-overview&tab=measured" />;
  // The CTA button on the pricing-overview pane opens:
  //   window.open(`https://checkout.paddle.com/checkout/${PADDLE_PRODUCT_ID}?prices=${PADDLE_PRICE_ID}`)
  // Paddle's overlay handles the rest.
}
```

The actual CTA is in `DashboardSwiftX402Pane.tsx` or the pricing-overview
component — the exact file depends on where the "Buy" button lives.
The change is: replace `href="/contact"` or the current disabled button
with a Paddle checkout URL.

**This is the single commit that makes the funnel transactional.**

---

## Step 7 — Smoke a real transaction (Nick)

Before any outreach, smoke a real low-value transaction end-to-end:

```bash
# 1. Open the live checkout
open "https://councilof.ai/pricing"
# Click "Buy" — Paddle's overlay appears.
# Use a real card (the $0.02 atom).

# 2. After payment, Paddle fires the webhook.
#    The webhook handler:
#    - Verifies the HMAC signature.
#    - Grants the entitlement (stored in KV).
#    - Issues the certificate (Ed25519 signed).
#    - Returns 200 to Paddle.

# 3. Verify the certificate was issued
python3 tools/verify/csoai_verify.py <cert-url-or-file> --json
# Expected: {"signature": {"state": "VALID", ...}, ...}

# 4. Verify the refund path works
curl -X POST https://councilof.ai/api/refund \
  -H 'Content-Type: application/json' \
  -d '{
    "schema": "csoai.refund-record/0.1",
    "observed_at": "2026-09-15T12:00:00Z",
    "source": {"channel": "operator_manual", "reference": "smoke-test-1"},
    "subject": {"kind": "cert", "id": "acct_smoke_test"},
    "revocations": {
      "entitlement": {"revoked": true, "original_grant_at": "2026-09-15T12:00:00Z", "sku": "csoai.measurement-card.issuance"},
      "cert": {"revoked": true, "cert_sha256": "0000000000000000000000000000000000000000000000000000000000000000"}
    }
  }'
# Expected: 201, ok:true, refund_id:rf_..., idempotency_key:sha256:...

# 5. Retry the same refund (idempotency check)
# Same curl again → 200, idempotent:true, same refund_id.
```

---

## Step 8 — Run claims-e2e and e2e-product (M4)

```bash
# claims-e2e: live claims audit
node scripts/claims-e2e.mjs
# Expected: all claims green, no false statements

# e2e-product: live product E2E
E2E_BASE=https://www.csoai.org node scripts/e2e-product.mjs
# Expected: all routes healthy, no 5xx
```

If either fails, DO NOT proceed to outreach. Fix the failure first.

---

## Step 9 — Rollback plan (if the transaction path misbehaves)

| Step | Action | Effect |
|---|---|---|
| 1 | Revert the `/pricing` CTA commit | Funnel stays up, payment paused, no new transactions |
| 2 | In Paddle Dashboard → Webhooks → pause the webhook | No entitlements granted while paused |
| 3 | Nothing else on the site depends on payment | Everything else stays live (board, verify, MCP, /api/gspc, /trust) |

The refund path (`POST /api/refund`) continues to work even with the
webhook paused — it's a manual operator action, not Paddle-triggered.

---

## Step 10 — Outreach gate (after the transaction smoke)

**No outreach until the Hive recon/scoring harness covers the full ~2000-lead list.**

| Step | Action | Command |
|---|---|---|
| 1 | Export the lead universe | `JEEVES exports leads.json (org-level, public schema)` |
| 2 | Score all of them | `HIVE_ACCOUNTS=leads.json npm run hive:recon` |
| 3 | Review the report | Manually — check modeled rows flagged for per-account recon |
| 4 | Then outreach begins | Every account already scored + demo-tailored |

---

## What the agent has already built (this session)

| Item | PR/Commit | Status |
|---|---|---|
| POST /api/refund | master (live) | ✅ Idempotent, LEADS KV-backed |
| csoai.certificate/0.1 schema | master (live) | ✅ JSON Schema 2020-12 |
| /api/certificate-schema | master (live) | ✅ 5/5 tests |
| csoai_verify cert verification | master (live) | ✅ 9/9 tests |
| PHASE3 B.5 ticked | docs/PHASE3_GO_LIVE.md | ✅ Refund/chargeback path defined |
| PHASE3 C.2 ticked | docs/PHASE3_GO_LIVE.md | ✅ Certificate payload schema fixed |
| PHASE3 C.3 ticked | docs/PHASE3_GO_LIVE.md | ✅ csoai_verify verifies cert offline |

## What Nick does next

1. Create the Paddle account (Step 1)
2. Create the product (Step 2)
3. Set up the webhook (Step 3)
4. Set the Cloudflare secrets (Step 5)
5. Tell M4 to wire the webhook handler (Step 4)
6. Approve the `/pricing` CTA flip (Step 6)
7. Smoke the transaction (Step 7)
8. Run the E2E checks (Step 8)
9. Export the leads for outreach (Step 10)

---

*Measurement, not certification. The board stays free. Verification stays free.*
