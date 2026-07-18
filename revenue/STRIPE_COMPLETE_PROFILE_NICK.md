# Stripe Profile — Your 30-min Completion Walkthrough

**Why this matters:** the funnel infrastructure scores 100/100. Webhook fires, /provision verifies sessions, API keys derive automatically. But Stripe will not release a single penny to your bank account until the profile is verified. Do this once. £0 → revenue.

---

## Path: dashboard.stripe.com → top right (your email) → Account settings

### 1. Business → Public business information (3 min)

| Field | Value to enter |
|-------|----------------|
| Public business name | `MEOK AI Labs` |
| Statement descriptor | `MEOK AI LABS` (must be ≤22 chars) |
| Shortened descriptor | `MEOK*AI` |
| Customer support phone | (leave blank or your mobile) |
| Customer support email | `hello@meok.ai` |
| Public website | `https://meok.ai` |
| Public business description | `Compliance MCP servers for EU AI Act, DORA, NIS2, CRA, GDPR.` |

Click **Save**.

### 2. Business → Account details (5 min)

| Field | Value |
|-------|-------|
| Business type | Individual / Sole trader (if you haven't incorporated MEOK Ltd yet) |
| Legal name | `Nicholas Templeman` |
| Date of birth | (your DOB) |
| Address | (your registered UK address) |
| Phone number | (your mobile) |

Stripe will ask for verification documents. Upload:
- **Photo ID** — UK passport or driving licence (auto-OCR'd)
- **Proof of address** — utility bill / bank statement ≤3 months old

Click **Save** at the bottom.

### 3. Payments → Bank accounts and scheduling (3 min)

Click **Add bank account**.

| Field | Value |
|-------|-------|
| Country | United Kingdom |
| Currency | GBP |
| Sort code | (8-digit, from your bank card or app) |
| Account number | (8-digit) |
| Account holder name | `NICHOLAS TEMPLEMAN` (exactly as on bank account) |

Payout schedule: leave as **Automatic, daily** (Stripe default).

Stripe sends two small deposits (1p-25p each) within 2 business days to verify the account. You'll need to log back in and enter the exact amounts.

### 4. Tax & VAT (UK-specific — 5 min)

If your annual turnover is below £90K, **you do NOT need to register for VAT yet**. Skip this section for now.

If you've already registered for VAT or plan to:
- Settings → Tax → **Tax settings**
- Enable tax collection
- Add your VAT number (format `GB123456789`)
- Set default tax behavior: **Inclusive** (price displays already include VAT)

### 5. Customer Portal (2 min) — CRITICAL for retention

This lets customers self-serve cancel, change card, update billing — without bothering you.

- Settings → Billing → **Customer portal**
- Toggle ON: `Customer can cancel subscriptions`
- Toggle ON: `Customer can update payment method`
- Toggle ON: `Customer can update billing address`
- Toggle ON: `Customer can view invoice history`
- **Cancellation reason** → select "Other" with text field → enables the retention survey

### 6. Subscription dunning (2 min) — CRITICAL for churn

- Settings → Billing → **Subscriptions and emails**
- **Smart retries**: enable. Stripe will retry failed cards up to 4 times over 2 weeks
- **Customer emails for failed payment**: enable all (1st, 2nd, 3rd, 4th retry)
- **Reminder before subscription renewal**: enable, 7 days before
- **Email when card expires**: enable

### 7. Receipts (1 min)

- Settings → Billing → **Customer receipts**
- Header: leave blank (Stripe uses logo from Branding section)
- Footer: `MEOK AI Labs · https://meok.ai · hello@meok.ai`
- Include: "Total tax (where applicable)"

### 8. Branding (3 min)

- Settings → Business settings → **Branding**
- Brand color: `#0057FF` (MEOK blue)
- Accent color: `#0D0B21` (MEOK dark)
- Logo: upload `meok-logo.png` (1024×1024, transparent background recommended)
- Icon: upload `meok-icon.png` (squarish version of logo, used in customer emails)

### 9. Apple Pay / Google Pay / Link (2 min) — boost conversion

- Settings → Payments → **Payment methods**
- Toggle ON: **Apple Pay** (zero setup, works instantly)
- Toggle ON: **Google Pay** (zero setup)
- Toggle ON: **Link** (Stripe's auto-fill, 6-second checkout)

This adds 1-tap checkout. Apple Pay typically lifts conversion 20-40% on mobile.

### 10. Tax forms (US customers — only if applicable) — 1 min

If you sell to US customers and earn >$600/yr from them:
- Settings → Tax → **Tax forms** → fill W-8BEN-E (non-US entity selling to US)

You're a UK individual — this is mostly a formality, but Stripe needs the form to release payouts.

### 11. Webhook verification (1 min)

You don't need to add anything — your webhook is already wired and verified. Just confirm:

- Developers → **Webhooks**
- Endpoint: `https://meok-attestation-api.vercel.app/webhook`
- Status: should show "Listening" (green dot)
- Events subscribed: should include `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`

If any event is missing, click the endpoint → **Add events** → select missing ones.

### 12. Test purchase (5 min) — proves the funnel works end-to-end

1. Open Stripe Dashboard → **Test mode** toggle (top right)
2. Switch your products to test mode by creating a test product at £1
3. From a private browser window, go to your real payment link and buy
4. Use test card `4242 4242 4242 4242`, any future expiry, any CVC
5. Watch the webhook fire in Developers → Webhooks → endpoint logs
6. Confirm:
   - Webhook returns 200 OK
   - Stripe receipt email arrives in your inbox
   - You receive your API key (via /provision flow or webhook)
7. Refund the test charge (Payments → click charge → Refund)
8. Switch back to **Live mode**

If the test fails, the funnel is broken. Email me what you see and I'll diagnose.

---

## You're done

After steps 1-12 (≈30 min focused, may stretch to 90 min including bank verification wait), Stripe will:

- Accept real card payments
- Verify Stripe sessions and auto-generate API keys
- Email customers receipts + branded reminders
- Retry failed cards
- Let customers self-cancel (with reason capture)
- Pay out to your bank daily

The first time someone subscribes to Pro £79, **the money lands in your bank within 2-3 days**.

---

## Common gotchas

- **Stripe asks for "Business website" but rejects meok.ai** — make sure meok.ai serves HTTPS (it does, just check). Sometimes Stripe's crawler is fussy about www. Use `https://www.meok.ai` if bare domain rejected.
- **Photo ID upload fails** — Stripe wants high-res, no glare. Use phone camera in good light, not a scan.
- **Bank account verification deposits don't arrive** — check spam folder for Stripe email, and the deposits show up as "STRIPE" or "MEOK AI LABS TEST" on your statement.
- **Webhook shows "Disabled" instead of "Listening"** — click the endpoint and toggle "Enabled". Should never be off.

---

## Optional but recommended (10 min)

### Annual prepay product (boosts cash flow + reduces churn)

Create a new product:
- Name: `MEOK AI Labs — Pro Annual`
- Price: `£790/year` (saves customer £158 vs monthly)
- One-time or recurring: **Recurring → annually**
- Tax behavior: same as Pro monthly

Add the link to your pricing page as "Save 17% with annual".

### Coupon codes (verify still active)

Check coupons created earlier:
- Settings → Coupons
- Look for `MEOKEAT` and `EARLY20`
- If status is "Active" — good
- If "Expired" — recreate with same code, 20% off, valid 90 days

---

## When you're done with this, ping me

I'll re-run the E2E audit and your Conversion layer should hit 95-98/100. Then we'll know exactly what to push on next.

---

*MEOK AI Labs · hello@meok.ai · 2026-05-13*
