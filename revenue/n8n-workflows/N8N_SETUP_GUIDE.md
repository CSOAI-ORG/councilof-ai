# N8N Credential Setup Guide
**Date:** 2026-05-09 | **SOV3 Task:** task_b6c979d3

---

## Before You Start

All 6 workflows have been fixed and are in `revenue/n8n-workflows/production-ready/`.
10 missing credential blocks were added. 12 logic bugs were fixed.

---

## Step 1: Start n8n

```bash
# Using Docker
docker compose -f ~/clawd/automation/docker-compose.yml up -d

# Or start existing local instance
n8n start
```

n8n will be at: http://localhost:5678

---

## Step 2: Configure 9 Credentials in n8n UI

Go to Settings → Credentials → Add Credential for each:

### 1. Anthropic API Key
- **Type:** Anthropic
- **API Key:** `sk-ant-api03-...` (already in `~/.hermes/.env`)
- **Used by:** WF1, WF2, WF3, WF4, WF6
- **After creating:** Copy the credential ID → replace all `""` in workflow JSONs

### 2. SMTP (Email Sending)
- **Type:** SMTP
- **Host:** (use PrivateEmail or Gmail SMTP)
- **Port:** 587 (TLS)
- **User:** nicholas@csoai.org
- **Password:** (PrivateEmail app password)
- **Used by:** WF1, WF2, WF3, WF5 (x4 nodes), WF6
- **After creating:** Replace `""`

### 3. Postgres (CRM Database)
- **Type:** Postgres
- **Host:** localhost
- **Port:** 5432
- **Database:** meok_crm
- **User:** n8n
- **Password:** (from `.env`)
- **Used by:** WF1 (x2), WF2, WF4
- **After creating:** Replace `""`
- **Run first:** `psql -f ~/clawd/automation/init-crm.sql`

### 4. Twilio (SMS for Templeman Opticians)
- **Type:** Twilio
- **Account SID:** (from Twilio dashboard)
- **Auth Token:** (from Twilio dashboard)
- **Used by:** WF1
- **After creating:** Replace `""`

### 5. Stripe (Live API Key)
- **Type:** Stripe
- **API Key:** `sk_live_...` (from `~/.secrets/stripe_live.env`)
- **Used by:** WF5
- **After creating:** Replace `""`
- **⚠️ Requires Stripe LIVE mode activated**

### 6. Slack Webhook
- **Type:** Slack API
- **Token:** Bot token or webhook URL
- **Used by:** WF2, WF5
- **After creating:** Replace `""`

### 7. Google OAuth (GBP API)
- **Type:** Google OAuth2
- **Client ID / Secret:** (from Google Cloud Console)
- **Scopes:** `https://www.googleapis.com/auth/business.manage`
- **Used by:** WF3
- **After creating:** Replace `""`

### 8. Apollo.io (Sales Intelligence)
- **Type:** Header Auth
- **Name:** X-Api-Key
- **Value:** (Apollo API key)
- **Used by:** WF4
- **After creating:** Replace `""`

### 9. Smartlead.ai (Cold Email)
- **Type:** Header Auth
- **Name:** Authorization
- **Value:** `Bearer (Smartlead API key)`
- **Used by:** WF4
- **After creating:** Replace `""`

---

## Step 3: Import Fixed Workflows

1. Go to n8n → Workflows → Import from File
2. Import each file from `production-ready/`:
   - `01_templeman_recall_workflow.json`
   - `02_universal_form_to_claude_reply.json`
   - `03_gbp_review_to_claude_draft_reply.json`
   - `04_cold_email_sequence_smartlead.json`
   - `05_stripe_new_customer_welcome.json`
   - `06_weekly_newsletter_drafter.json`
3. For each, click on credential placeholders → select the credential you created
4. Save each workflow

---

## Step 4: Set Environment Variable

In n8n, go to Settings → Environment Variables → Add:
```
MEOK_WEBHOOK_SECRET = [generate a random 32-char string]
```

This is required by WF2 for webhook authentication.

---

## Step 5: Activate (one at a time, test each)

Activation order (least risky → most risky):

1. **WF6 (Newsletter)** — test with manual execution first
2. **WF3 (GBP Reviews)** — needs Google OAuth working
3. **WF1 (Templeman Recall)** — needs Postgres + Twilio working
4. **WF2 (Form Reply)** — activate webhook, test with curl
5. **WF5 (Stripe Welcome)** — activate AFTER Stripe live mode
6. **WF4 (Cold Email)** — activate last, sends real emails

**Test command for WF2 webhook:**
```bash
curl -X POST http://localhost:5678/webhook/form-inbound \
  -H "Content-Type: application/json" \
  -H "x-webhook-secret: YOUR_SECRET" \
  -d '{"name":"Test User","email":"test@example.com","message":"Test message"}'
```

---

## Credential Dependency Matrix

| Credential | WF1 | WF2 | WF3 | WF4 | WF5 | WF6 |
|---|---|---|---|---|---|---|
| Anthropic | ✅ | ✅ | ✅ | ✅ | — | ✅ |
| SMTP | ✅ | ✅ | ✅ | — | ✅ | ✅ |
| Postgres | ✅ | ✅ | — | ✅ | — | — |
| Twilio | ✅ | — | — | — | — | — |
| Stripe | — | — | — | — | ✅ | — |
| Slack | — | ✅ | — | — | ✅ | — |
| Google | — | — | ✅ | — | — | — |
| Apollo | — | — | — | ✅ | — | — |
| Smartlead | — | — | — | ✅ | — | — |

**Minimum to activate ANY workflow: Anthropic + SMTP (2 credentials, ~5 min setup)**

---

## Quick Revenue Impact

| Workflow | Revenue Unblocked | Setup Time |
|----------|------------------|------------|
| WF1 (Templeman Recall) | £8-20K/yr recall revenue | 15 min |
| WF5 (Stripe Welcome) | Customer retention + upsell | 5 min |
| WF4 (Cold Email) | Care home sales pipeline | 10 min |
| WF2 (Form Reply) | All website leads captured | 5 min |

*Prepared by JEEVES — SOV3 task_b6c979d3*
