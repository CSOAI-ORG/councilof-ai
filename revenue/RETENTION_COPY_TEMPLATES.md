# Retention Copy Templates
## Welcome, dunning, cancellation — drop into Stripe Dashboard

These templates close the 60-point gap in Layer 4 (Retention). Customer Portal + dunning emails are the highest-leverage retention investment: every prevented churn = LTV × annual_value.

---

## 1. Welcome email (post-purchase) — Send via SendGrid / Resend after Stripe webhook fires

**Subject:** Your MEOK API key + 3 things worth doing in your first 5 minutes

**Body (HTML or markdown):**

```
Hi {{first_name}},

Welcome to MEOK Pro. You just unlocked unlimited compliance MCP calls + cryptographically signed attestations your auditor can verify independently.

Your API key:
{{api_key}}

(Treat it like a password. Don't commit to git. Use environment variables only.)

—

Three things worth doing in your next 5 minutes:

1. **Set the key in your shell:**
   export MEOK_API_KEY={{api_key}}

   Add it to ~/.zshrc or ~/.bash_profile to persist.

2. **Try a signed audit:**
   pip install eu-ai-act-compliance-mcp
   Then in Claude Desktop, ask:
   "Run a full EU AI Act compliance check for my SaaS and sign the attestation."

3. **Verify the signature publicly:**
   Every cert MEOK signs has a verify URL. Try one now:
   https://meok-attestation-api.vercel.app/verify
   Paste any cert you generate. Auditors can verify the exact same URL.

—

What you have access to:
- 40+ governance MCPs (EU AI Act, DORA, NIS2, CRA, GDPR, ISO 42001, …)
- 410 articles of verbatim EU regulation text via FTS5 search
- HMAC-signed compliance attestations
- Unlimited daily calls
- Email support (this address, hello@meok.ai)

Coming soon:
- White-label Trust Centers (Enterprise)
- Notified Body partnership program
- Slack ChatOps integration

—

Reply to this email with one sentence on what you wish MEOK did better.
Every reply gets read. Most replies ship within a week.

— Nicholas
Founder, MEOK AI Labs
https://meok.ai

P.S. If anything breaks, reply with the cert_id and I'll fix it.
```

---

## 2. Dunning sequence (Stripe handles delivery, you set copy)

### 2a. First retry (3 days after failed payment)

**Subject:** Quick heads up: your MEOK payment didn't go through

```
Hi {{first_name}},

Your card ending {{card_last_4}} was declined when we tried to renew your MEOK Pro subscription.

No drama — happens to everyone. Couple of common fixes:

1. Card expired? Update at:
   {{customer_portal_url}}

2. Bank flagged the £79 as unusual? Approve it in your banking app.

We'll auto-retry in 3 days. No action needed if you've fixed it.

If something else is going on — money's tight, you don't need MEOK anymore — just reply and tell me. Honesty appreciated.

— Nicholas
MEOK AI Labs
```

### 2b. Second retry (7 days after failed payment)

**Subject:** Second try — your MEOK Pro subscription

```
{{first_name}},

We tried your card again and it still bounced.

If you want to keep MEOK Pro running:
{{customer_portal_url}} (update payment method)

If you'd rather pause or cancel, no hard feelings:
{{customer_portal_url}} (manage subscription)

I'd rather you cancel than ghost. If MEOK isn't worth £79 for you right now, that's useful signal I want to know about.

— Nicholas
```

### 2c. Final retry (14 days after failed payment)

**Subject:** Last attempt — your MEOK Pro subscription will pause

```
{{first_name}},

We'll try your card one last time tomorrow. If it bounces, your MEOK Pro features pause and you go back to the free tier (10 calls/day).

Your API key still works — you just lose unlimited calls + signed attestations.

If you want to resume any time:
{{customer_portal_url}}

If you want to tell me why this isn't working for you (price, missing feature, wrong fit), reply to this email. I'll act on it.

— Nicholas
```

---

## 3. Cancellation flow (Stripe Customer Portal "Cancellation reason")

When you enable Customer Portal cancellation, Stripe lets you collect a reason. Use these options:

| Option (shown to customer) | Internal action |
|---------------------------|-----------------|
| `Too expensive` | Auto-offer 50% off next 3 months (retention coupon) |
| `Missing a feature I need` | Trigger founder follow-up email asking which feature |
| `Found an alternative` | Trigger founder follow-up email asking which one |
| `Project ended / no longer needed` | Send pause-instead-of-cancel option (keep API key, downgrade to free) |
| `Other` (free text) | Read every one, no auto-response |

Set up via:
- Stripe Dashboard → Settings → Billing → Customer Portal → Cancellation reasons

### Save-the-customer email (auto-fires when "Too expensive" selected)

**Subject:** Before you go — 50% off for the next 3 months?

```
{{first_name}},

You're about to cancel MEOK Pro because of price. Totally fair.

Before you do:

I'd rather give you 3 months at £40/mo than lose you over £39.

Use code RETAIN50 in your Customer Portal:
{{customer_portal_url}}

Valid for the next 7 days, then I lose track of it.

If even £40 is too much, just cancel — no hard feelings. The free tier (10 calls/day) is yours forever.

— Nicholas
```

---

## 4. Renewal reminder (7 days before annual renewal)

**Subject:** Quick reminder: your MEOK annual subscription renews in a week

```
{{first_name}},

Your MEOK Pro annual plan renews on {{renewal_date}} at £790.

Just a heads up so it's not a surprise.

If you want to keep going, nothing to do — auto-renews.

If you want to switch to monthly, cancel, or pause:
{{customer_portal_url}}

If you've gotten value from MEOK this year, would you reply with one sentence I can put on the website? (Anonymized or attributed, your call.)

— Nicholas
```

---

## 5. Win-back email (30 days after cancellation)

**Subject:** What changed since you left MEOK?

```
{{first_name}},

You cancelled MEOK Pro about a month ago. I'm curious — what changed?

- Did you find a better tool?
- Did the project wrap up?
- Did MEOK miss the mark on something specific?

Three sentences max. I read every reply and your feedback shapes what I build next.

If MEOK Pro would be useful again, the door's open:
https://buy.stripe.com/00wfZjcgAeUW4c5cyQ8k90K

And if you're done — that's fine too.

— Nicholas
```

---

## How to wire this up

1. **Welcome email**: requires SendGrid / Resend account (free tier works). Add to `meok-attestation-api/api/index.py` after successful /provision call. ~50 lines of code.
2. **Dunning emails**: Stripe Dashboard → Settings → Billing → Customer emails → customize copy in each retry email
3. **Cancellation reasons**: Stripe Dashboard → Settings → Billing → Customer Portal → enable cancellation reasons
4. **Renewal reminder**: Stripe Dashboard → Settings → Billing → Subscriptions → upcoming invoice email (7 days before)
5. **Win-back**: Stripe doesn't send these — use a Resend cron + your customer list (export from Stripe). 50 lines of Python.

---

## Estimated retention impact

Industry baseline for SaaS at £79/mo:
- Failed payment recovery (dunning): adds 30-40% of failed payments back
- Customer portal cancel: drops involuntary churn by 50%
- Save-the-customer offer: retains 15-25% of "too expensive" cancels
- Win-back: 5-8% of cancelled customers return within 90 days

If MEOK Pro reaches 50 paying customers, retention copy = £200-400/mo MRR saved per month.

---

*MEOK AI Labs · hello@meok.ai*
