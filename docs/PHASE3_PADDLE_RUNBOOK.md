# PHASE3 — Paddle setup runbook for Nick

**Purpose:** Turn the PHASE3 checklist into a step-by-step guide with
exact commands. This runbook takes Nick from "Paddle account created"
to "first real transaction, certificate issued, verifiable offline."

**Lane boundary:** This runbook contains the exact commands, the exact
SKUs, the exact webhook payload shape, and the verification steps.
It does NOT contain Nick's Paddle credentials, the signing key, or
the wallet private key — those stay in Nick's head/keychain.

---

## What's already built and live on master (no action needed)

| Component | File | Tests | What it does |
|---|---|---|---|
| **Refund intake** | `functions/api/refund.ts` | 10/10 | `POST /api/refund` — idempotent, backed by LEADS KV, records a refund + revokes entitlement + cert |
| **Cert schema** | `public/schemas/csoai-certificate-0.1.schema.json` | — | JSON Schema 2020-12 for the certificate wrapper |
| **Cert endpoint** | `functions/api/certificate-schema.ts` | 5/5 | `GET /api/certificate-schema` — describes the issuance contract |
| **csoai_verify cert** | `tools/verify/csoai_verify.py` | 9/9 | `verify_csoai_certificate()` — offline cert verification (Ed25519 + sha256) |
| **Webhook stub** | `functions/api/paddle-webhook.ts` | 3/3 | `POST /api/paddle-webhook` — HMAC verify, entitlement grant, cert issuance |
| **SKU manifest** | `functions/api/_skus.ts` | — | Pricing atoms (owner-decision, env-overridable) |
| **x402 rail** | Already live | 15 settlements | Base mainnet, $0.01–$0.02 USDC per call |
| **Refund record** | `public/schemas/csoai-refund-record-0.1.schema.json` | — | JSON Schema for the refund event |

**What the agent cannot do (Nick/M4 only):**
- Create the Paddle account
- Set the signing key (Ed25519 PKCS8)
- Set the Paddle webhook secret
- Approve the `/pricing` CTA flip
- Run the first real transaction

---

## Step 1 — Create a Paddle account (Nick, one-time)

Go to **https://paddle.com** and create a seller account for **CSOAI Ltd**.

| Field | Value |
|---|---|
| Company name | CSOAI Ltd |
| Registered | UK Companies House 16939677 |
| Country | United Kingdom |
| Currency | GBP (default); accept USD for USDC-exposed customers |
| Website | https://councilof.ai |
| Tax category | Digital services (UK VAT rules apply) |

**After approval (< 24 hours):** You'll have access to the Paddle Dashboard.
Keep the seller credentials safe — they go in Cloudflare Pages secrets, not in the repo.

**Verify:** `curl -s https://councilof.ai | grep -o 'Paddle'` should return nothing until Step 6 flips the CTA.

---

## Step 2 — Create the Paddle product (Nick, one-time)

In Paddle Dashboard → **Catalog → Products**, create ONE product:

| Field | Value |
|---|---|
| Product name | CSOAI Measurement Card — Issuance |
| Description | One signed measurement card issued under the CSOAI public root. Ed25519 signature, Merkle inclusion proof. Verification at councilof.ai/gspc-verify. Measurement, not certification. |
| Price | **$0.02 USD** (the issuance reserve atom from `_skus.ts`) |
| Billing type | **One-time** (not recurring) |
| Tax category | Digital services |

After creation, note the **two IDs**:

| ID | Example | Where it goes |
|---|---|---|
| **Product ID** | `pro_01abcdef` | Cloudflare secret `PADDLE_PRODUCT_ID` |
| **Price ID** | `pri_01abcdef` | Cloudflare secret `PADDLE_PRICE_ID` |

**Verify:** In the Paddle Dashboard, the product should show "Active" with the $0.02 price.

---

## Step 3 — Configure the webhook (Nick, one-time)

In Paddle Dashboard → **Developer → Notifications → Webhooks**, create:

| Field | Value |
|---|---|
| Endpoint URL | `https://councilof.ai/api/paddle-webhook` |
| Events to listen for | `transaction.completed` |
| Secret key | Paddle generates one — copy it immediately |

The webhook handler (`functions/api/paddle-webhook.ts`) is already built
and live on master. It:

1. **Verifies Paddle's HMAC-SHA256 signature** (using `PADDLE_WEBHOOK_SECRET`)
2. **Parses the transaction:** extracts customer email, product_id, price_id, amount
3. **Grants the entitlement** in LEADS KV (idempotent on Paddle transaction id)
4. **Issues the certificate** (`csoai.certificate/0.1`):
   - `certificate_id = sha256(canon(payload))`
   - `sig_ed25519 = Ed25519_sign(canon(payload), BOARD_SIGN_KEY_PKCS8)` (unsigned if key absent)
5. **Returns 200** to Paddle (Paddle retries on non-2xx)

**Verify the webhook endpoint is live:**
```bash
curl -s https://councilof.ai/api/paddle-webhook | jq .
# Expected: {"schema":"csoai.paddle-webhook-endpoint/0.1","endpoint":"/api/paddle-webhook",...}
```

**Verify HMAC rejects unsigned requests:**
```bash
curl -s -X POST https://councilof.ai/api/paddle-webhook \
  -H 'Content-Type: application/json' \
  -d '{"event_type":"test"}' | jq .
# Expected: 401, {"ok":false,"code":"NO_SIGNATURE","detail":"paddle-signature header missing"}
```

---

## Step 4 — Set the Cloudflare secrets (Nick)

In Cloudflare Dashboard → **Pages → councilof-ai → Settings → Environment variables → Production**, set:

| Variable | Value | Notes |
|---|---|---|
| `PADDLE_WEBHOOK_SECRET` | (from Paddle dashboard, Step 3) | **Secret** — do not commit |
| `PADDLE_PRODUCT_ID` | (from Paddle dashboard, Step 2) | `pro_...` |
| `PADDLE_PRICE_ID` | (from Paddle dashboard, Step 2) | `pri_...` |
| `BOARD_SIGN_KEY_PKCS8_B64` | (base64-encoded PKCS8 Ed25519 private key) | **The signing key** — see below |
| `X402_PRICE_ISSUANCE_RESERVE_USD` | `0.02` | Override if pricing changes |

### Getting the signing key

The Ed25519 signing key lives on the brain host. To export it as base64 PKCS8:

```bash
# On the brain host:
cat /path/to/board-attestation-1.key | base64
# Copy the output — that's BOARD_SIGN_KEY_PKCS8_B64
```

**Without this key:** The webhook issues unsigned certificates
(`sig_ed25519: null`). `csoai_verify` reports UNCHECKABLE — which is the
honest state when the key is absent. The entitlement is still granted;
only the signature is missing.

**With this key:** The webhook issues signed certificates. `csoai_verify`
reports VALID. The certificate is verifiable offline.

**Verify secrets are set (after deploy):**
```bash
# The webhook should now reject bad HMAC but accept the format:
curl -s -X POST https://councilof.ai/api/paddle-webhook \
  -H 'Content-Type: application/json' \
  -H 'paddle-signature: hmac:0000000000000000000000000000000000000000000000000000000000000000' \
  -d '{"event_type":"test"}' | jq .
# Expected: 401, {"ok":false,"code":"HMAC_MISMATCH",...}
# (Previously was 422 NO_SECRET if the secret wasn't set)
```

---

## Step 5 — Flip `/pricing` to live checkout (Nick approves, M4 commits)

**Current state:** `/pricing` redirects to `/dashboard?task=pricing-overview`.
The pricing-overview pane shows the SKUs and prices but the CTA button
says "Contact us" or is disabled.

**The change:** Replace the CTA button's `href` with a Paddle checkout URL.
The exact file is the pricing-overview component in the dashboard.

```tsx
// In the pricing-overview pane (DashboardSwiftX402Pane or equivalent):
// Before:
<a href="/contact">Contact us</a>

// After:
<a href={`https://checkout.paddle.com/checkout/${import.meta.env.VITE_PADDLE_PRODUCT_ID}?prices=${import.meta.env.VITE_PADDLE_PRICE_ID}`}
   target="_blank" rel="noopener">
  Buy now — $0.02
</a>
```

**Environment variables for the client (Vite):**
Set `VITE_PADDLE_PRODUCT_ID` and `VITE_PADDLE_PRICE_ID` in the Pages
build environment (Cloudflare Dashboard → Pages → Settings → Environment
variables → Production → Build). These are public (they're in the client
bundle) — they identify the product, not the secret.

**This is the single commit that makes the funnel transactional.**

**Verify after deploy:**
```bash
# The pricing page should now show a Paddle checkout link
curl -s https://councilof.ai/pricing | grep -o 'checkout.paddle.com'
# Expected: checkout.paddle.com
```

---

## Step 6 — Smoke a real transaction (Nick)

**Before any outreach**, smoke a real low-value transaction end-to-end.

### 6.1 — Pay

```bash
open "https://councilof.ai/pricing"
# Click "Buy now" — Paddle's overlay appears.
# Use a real card (the $0.02 atom).
```

### 6.2 — Verify the webhook fired

After payment, Paddle fires `transaction.completed` to `/api/paddle-webhook`.
The handler:

1. Verifies the HMAC signature (PADDLE_WEBHOOK_SECRET)
2. Grants the entitlement (stored in LEADS KV)
3. Issues the certificate (Ed25519 signed if key is set)
4. Returns 200 to Paddle

**Check the Paddle Dashboard → Events** — the webhook should show "Delivered"
with a 200 response.

### 6.3 — Verify the certificate

```bash
# If the cert was emailed to you, save it. Or fetch it from KV via the API.
python3 tools/verify/csoai_verify.py <cert-file-or-url> --json
# Expected: {"signature":{"state":"VALID","detail":"did:web:csoai.org#board-attestation-1"},...}
```

### 6.4 — Verify the refund path works

```bash
# Smoke-test the refund endpoint (operator-manual channel)
curl -s -X POST https://councilof.ai/api/refund \
  -H 'Content-Type: application/json' \
  -d '{
    "schema": "csoai.refund-record/0.1",
    "observed_at": "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'",
    "source": {"channel": "operator_manual", "reference": "smoke-test-'$(date +%s)'"},
    "subject": {"kind": "cert", "id": "acct_smoke_test"},
    "revocations": {
      "entitlement": {"revoked": true, "original_grant_at": "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'", "sku": "csoai.measurement-card.issuance"},
      "cert": {"revoked": true, "cert_sha256": "0000000000000000000000000000000000000000000000000000000000000000"}
    }
  }' | jq .
# Expected: 201, {"ok":true,"refund_id":"rf_...","idempotency_key":"sha256:...",...}
```

```bash
# Retry the same request (idempotency check)
# Same curl again → 200, {"ok":true,"idempotent":true,"note":"An identical refund was already recorded..."}
```

### 6.5 — Verify offline verification works

```bash
python3 tools/verify/csoai_verify.py <cert-file> --tamper-control --json
# Expected: tamper_control.state == "DETECTED" (mutated body fails sig check)
```

---

## Step 7 — Run claims-e2e and e2e-product (M4)

```bash
# claims-e2e: live claims audit
node scripts/claims-e2e.mjs
# Expected: all claims green, no false statements

# e2e-product: live product E2E
E2E_BASE=https://www.csoai.org node scripts/e2e-product.mjs
# Expected: all routes healthy, no 5xx
```

**If either fails: DO NOT proceed to outreach. Fix the failure first.**

---

## Step 8 — Rollback plan (if the transaction path misbehaves)

| Step | Action | Effect |
|---|---|---|
| 1 | Revert the `/pricing` CTA commit | Funnel stays up, payment paused, no new transactions |
| 2 | Paddle Dashboard → Webhooks → pause | No entitlements granted while paused |
| 3 | Nothing else depends on payment | Board, verify, MCP, /api/gspc, /trust all stay live |

**The refund path continues to work** even with the webhook paused —
it's a manual operator action, not Paddle-triggered.

---

## Step 9 — Outreach gate (after the transaction smoke)

**No outreach until the Hive recon/scoring harness covers the full ~2000-lead list.**

| Step | Action | Command |
|---|---|---|
| 1 | Export the lead universe | JEEVES exports `leads.json` (org-level, public schema) |
| 2 | Score all of them | `HIVE_ACCOUNTS=leads.json npm run hive:recon` |
| 3 | Review the report | Manually — check modeled rows flagged for per-account recon |
| 4 | Then outreach begins | Every account already scored + demo-tailored |

---

## SKU reference (from `_skus.ts`)

| SKU | ID | Unit | Price (USD) | Rail |
|---|---|---|---|---|
| Signed Measurement (issuance) | `issuance` | 1 card | $0.02 (reserve), $0.50 (fresh run) | x402 |
| Compliance Evidence Bundle (proof) | `evidence_bundle` | 1 bundle | $250 | x402 or invoice |
| Request Attestation (RAS) | `request_attestation` | 1 request | $0.02 | x402 |
| Article 50 marking evidence | `art50_marking_evidence` | 1 pack | $25 | x402 or invoice |
| Provider Diff Feed (assembly) | `provider_diff_feed` | 1 batch/yr | $25 (batch), $5,000 (partner/yr) | x402 or invoice |
| Receipts batch (historical) | `receipts_batch` | 1 batch | $0.10 | x402 or invoice |
| Enterprise Rail Licence | `enterprise_rail` | per-call/yr | $10,000/yr base | x402 or invoice |

**Doctrine:** No SKU sells a grade, a score, a pass/fail verdict, or a
certificate of conformity. The board stays free. Verification stays free.

---

## What Nick does next (ordered)

1. ✅ Read this runbook
2. Create the Paddle account (Step 1)
3. Create the product (Step 2)
4. Configure the webhook (Step 3)
5. Set the Cloudflare secrets (Step 4)
6. Approve the `/pricing` CTA flip (Step 5)
7. Smoke the $0.02 transaction (Step 6)
8. Run the E2E checks (Step 7)
9. Export the leads for outreach (Step 9)

---

*Measurement, not certification. The board stays free. Verification stays free.*
