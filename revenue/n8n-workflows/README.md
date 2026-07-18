# n8n Workflows — Cross-Brand Automation Library

**6 workflows ready to import.** Each is a JSON file you can drop into a self-hosted n8n instance.

## Setup (one-time, ~30 min)

1. **Self-host n8n** — Docker on iokfarm or any VPS:
   ```bash
   docker run -d --name n8n -p 5678:5678 \
     -v ~/n8n_data:/home/node/.n8n \
     -e N8N_BASIC_AUTH_ACTIVE=true \
     -e N8N_BASIC_AUTH_USER=nick \
     -e N8N_BASIC_AUTH_PASSWORD=$(openssl rand -hex 16) \
     -e WEBHOOK_URL=https://n8n.iokfarm.co.uk/ \
     -e GENERIC_TIMEZONE=Europe/London \
     n8nio/n8n
   ```

2. **Add credentials in n8n UI** for:
   - Anthropic Claude (api key)
   - Twilio (account SID + auth token + UK SMS sender)
   - SMTP (Gmail App Password OR SendGrid OR Mailgun)
   - Stripe Live (api key from `~/.secrets/stripe_live.env`)
   - Slack (webhook URL or bot token)
   - Apollo.io (api key)
   - Smartlead.ai (api key + campaign ID)
   - Postgres / PocketBase (host + creds for shared CRM)
   - Google OAuth (one per GBP location)

3. **Import each workflow JSON** via n8n → Workflows → Import from File

4. **Replace placeholders** in each workflow:
   - `REPLACE_WITH_*_CRED_ID` — match to credentials you set in step 2
   - `iokfarm.co.uk` webhook URLs — match your actual n8n host

5. **Activate each workflow** (toggle switch top right)

---

## The 6 workflows

| # | File | Purpose | Trigger | Brands |
|---|---|---|---|---|
| 1 | `01_templeman_recall_workflow.json` | 12/24-month patient eye-exam recall via SMS + email | Daily 9am cron | Templeman Opticians |
| 2 | `02_universal_form_to_claude_reply.json` | Form submission → Claude-drafted reply within 60 sec | Webhook from any brand site | All 12 |
| 3 | `03_gbp_review_to_claude_draft_reply.json` | Google Business Profile review → Claude-drafted reply (in inbox for human approve) | 4-hour poll | Templeman, Tree-King, Randalls, WCR, iokfarm |
| 4 | `04_cold_email_sequence_smartlead.json` | Cold prospect list → Apollo enrich → Claude personalize → Smartlead 7-touch sequence | Webhook from CSV import | MEOK, Network Nick |
| 5 | `05_stripe_new_customer_welcome.json` | New paid sub → Slack notify + 5-email founder-led welcome series (Day 0, 1, 7, 30) | Stripe webhook | All paying brands |
| 6 | `06_weekly_newsletter_drafter.json` | Sunday auto-pull EUR-Lex + DSIT + ICO news → Claude drafts the EU AI Compliance Brief → emails draft to Nick for Monday review | Sunday 14:00 UK cron | MEOK / EU AI Compliance Brief |

---

## Workflow-by-workflow setup notes

### #1 Templeman recall

**Required first:**
- Postgres connection to whatever PMS Templeman uses (Optix, Acuity, custom)
- Schema columns: `id, first_name, last_name, mobile, email, last_exam_date, opt_out_recall, last_recall_sent, recall_count`
- Twilio UK SMS sender configured (apply for short-code or use Templeman's mobile)
- SMTP configured (likely Gmail App Password from appointments@templeman-opticians.com)

**First-run test:** manually trigger with a single test patient row. Verify SMS arrives, email arrives, DB updated.

**Compliance note:** ensure each patient has consent on file. Add a compliance check at query time (`AND has_recall_consent=true`).

### #2 Universal form → Claude reply

**Required first:**
- Wire `fetch('https://n8n.iokfarm.co.uk/webhook/form-inbound', {...})` into each form on each brand site
- PocketBase / Postgres `leads` table created
- Slack channel `#leads` set up

**First-run test:** submit a fake form on one site. Verify reply arrives within 60 seconds.

### #3 GBP review reply

**Required first:**
- Google My Business API enabled in Google Cloud Console (free)
- OAuth set up per GBP location (one location = one credential)

**First-run test:** wait for next real review. Or manually post a test review on a private QR landing.

### #4 Cold email sequence

**Required first:**
- Apollo.io account (free tier 50 contacts/mo, paid £39+/mo for more)
- Smartlead.ai campaign created with 7-touch template
- Domain authentication (SPF, DKIM, DMARC) on the sender domain

**First-run test:** import CSV of 5 test prospects. Verify Smartlead receives them.

### #5 Stripe welcome

**Required first:**
- Stripe webhook endpoint added to https://n8n.iokfarm.co.uk/webhook/stripe (configured in Stripe Dashboard → Webhooks)
- Webhook signing secret saved as n8n credential

**First-run test:** create a £1 test product, buy it, verify all 4 emails arrive on schedule + Slack ping fires.

### #6 Weekly newsletter

**Required first:**
- Buttondown account (free tier 100 subs)
- Newsletter handle `meok-eu-ai-compliance-brief` reserved

**First-run test:** trigger manually on a Sunday. Verify draft arrives in Nick's inbox by Sunday evening.

---

## Total estimated value (per workflow, 12 months)

| Workflow | Time saved | Revenue uplift |
|---|---|---|
| #1 Templeman recall | ~2h/week (admin) | £8-20K/yr (recall conversions) |
| #2 Form → reply | ~1h/week (lead triage) | indirect (faster reply = higher conversion) |
| #3 GBP review reply | ~3h/month | indirect (GBP rank uplift = more local clicks) |
| #4 Cold email | ~5h/week (manual outreach) | £5-30K/yr (1-3 closes from automated outbound) |
| #5 Stripe welcome | ~2h/week (manual onboarding) | indirect (lower churn, higher referrals) |
| #6 Weekly newsletter | ~2h/week (writing) | compounding (10-50 new subs/week × 12 months × 5% conversion) |

**Total time saved:** ~10-15h/week.
**Total revenue uplift (combined):** £15-50K direct + significant indirect.

---

## What I (Claude) can NOT do for you autonomously

- **Stand up the n8n Docker container** (you need shell access on iokfarm or VPS)
- **Configure all the credentials** (API keys + OAuth tokens require your interactive login on each provider)
- **Connect to the Templeman PMS** (the schema + connection string are private to your business)
- **Buy Twilio/Smartlead/Apollo accounts** (require your card)

**What I CAN do next session:**

- Generate the Docker Compose file with all services
- Generate the Postgres schema for the shared CRM
- Write deployment scripts for the VPS
- Write the form-submit JS snippets for each brand site

Tell me to "wire the n8n infra" and I'll do that next.
