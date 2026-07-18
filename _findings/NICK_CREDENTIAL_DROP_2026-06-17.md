# Nick Credential Drop — 15-Minute Checklist
**Date:** 2026-06-17 05:30 BST  
**Agent:** JEEVES  
**Purpose:** One doc with exact actions, URLs, and fields to drop. Completing this unlocks first £ revenue.

---

## ✅ Pre-Flight (agent-verified)
- `meok-attestation-api.vercel.app` ✅ live (200, Ed25519 signing ready)
- `MEOK_MASTER_API_KEY` present in `~/clawd/.env.local` ✅
- Vercel CLI authenticated as `nicholastempleman-5584` ✅
- Vercel project list currently empty under `niks-projects-0a2ef942` — projects may live under a different team scope; use dashboard links below.

---

## 1. Stripe — Flip Live + Fix COBOL Bridge Price
**URL:** https://dashboard.stripe.com/products  
**Time:** 5 min  
**Blocks:** ALL revenue

### 1a. Activate live mode
1. Open Stripe Dashboard → Activate account (if not done).
2. Connect bank account / verify identity if prompted.
3. Run a £0.20 test charge on a live card to confirm settlement.

### 1b. Fix COBOL Bridge Pro seat price
**Current wrong price:** £2,499/mo (lawsuit risk)  
**Correct price:** £199/seat/month  

In Stripe products:
1. Find product named **"COBOL Bridge Pro"** (or similar).
2. Edit price from **£2,499** to **£199** per month.
3. If there are existing active subscriptions at £2,499, refund the overcharge or credit accounts.
4. Copy the new **Price ID** (starts with `price_`) into:
   - `~/clawd/.env.local` as `STRIPE_COBOl_BRIDGE_PRICE_ID=<price_id>`
   - Vercel env for `cobol-bridge-demo` project

---

## 2. Vercel Env Vars
**URL:** https://vercel.com/dashboard  
**Time:** 4 min  
**Blocks:** checkout, attestations, auth

Add these to **Production** environment for projects:
- `meok/ui` (meok.ai)
- `csoai-org-v2` (csoai.org)
- `meok-attestation-api` (proofof.ai + meok-attestation-api.vercel.app)
- `cobol-bridge-demo` (cobolbridge.ai)

| Variable | Value / How to get | Projects |
|----------|-------------------|----------|
| `MEOK_MASTER_API_KEY` | `mk_1TUKNMQvIueK5XpbNdY4v9Jb` | meok/ui, meok-attestation-api |
| `STRIPE_SECRET_KEY` | Stripe → Developers → API keys → `sk_live_*` | meok/ui, csoai-org-v2, cobol-bridge-demo |
| `STRIPE_PUBLISHABLE_KEY` | Stripe → Developers → API keys → `pk_live_*` | meok/ui, csoai-org-v2, cobol-bridge-demo |
| `STRIPE_WEBHOOK_SECRET` | Stripe → Developers → Webhooks → endpoint secret | meok/ui, meok-attestation-api |
| `RESEND_API_KEY` | Resend dashboard → API keys → `re_*` | meok/ui, csoai-org-v2 |
| `CLERK_PUBLISHABLE_KEY` | Clerk dashboard → API keys → `pk_live_*` | meok/ui, csoai-org-v2 |
| `CLERK_SECRET_KEY` | Clerk dashboard → API keys → `sk_live_*` | meok/ui, csoai-org-v2 |
| `STRIPE_COBOl_BRIDGE_PRICE_ID` | From step 1b above | cobol-bridge-demo |

**Note:** `vercel projects list` returned zero projects under the CLI-authenticated team. You may need to switch team scope in dashboard or use project-specific links.

---

## 3. Namecheap DNS
**URL:** https://ap.www.namecheap.com/  
**Time:** 3 min  
**Blocks:** 6 dead domains + www subdomains

### 3a. Add A-records for dead domains
Point each to Vercel edge IPs or CNAME to `cname.vercel-dns.com.`:
- `sov3.ai`
- `industrial-hire.ai`
- `wowmcp.ai`
- `eu-ai-act.com`
- `diyhelp.ai`
- `pokerhud.ai`

### 3b. Fix www subdomains
For domains with SSL hostname mismatch on `www`, add:
- Host: `www` → CNAME `cname.vercel-dns.com.`
- Or flatten `www` → A-record `76.76.21.21`

Affected domains include: `safetyof.ai`, `dataprivacyof.ai`, `accountabilityof.ai`, `ethicalgovernanceof.ai`, `openmoe.ai`, `optimobile.ai`, and others per `gaps-2026-06.md`.

---

## 4. SMTP Credentials
**Time:** 1 min  
**Blocks:** 95 staged emails

Add to `~/clawd/.env.local`:
```bash
EMAIL_ADDRESS="your-sending-email@example.com"
EMAIL_PASSWORD="your-app-password"
# Optional but recommended
EMAIL_SMTP_HOST="smtp.example.com"
EMAIL_SMTP_PORT="587"
```

If using PrivateMail, use the provided SMTP host/port and app-specific password.

---

## 5. PyPI + npm Tokens
**URLs:**
- PyPI: https://pypi.org/manage/account/token/
- npm: https://www.npmjs.com/settings/tokens
**Time:** 2 min  
**Blocks:** MCP package publishing

### PyPI
1. Create token with scope `"Entire account"` or `"csoai-org/*"`.
2. Save as `PYPI_API_TOKEN` in GitHub repo secrets and `~/.pypirc`.

### npm
1. Create granular access token with **Publish** scope for `@csoai-org`.
2. Run `npm login` or save to `~/.npmrc`.

---

## 6. Buffer (Social Publishing)
**URL:** https://buffer.com/developers/apps  
**Time:** 30 sec  
**Blocks:** automated LinkedIn/Twitter posts

Create an access token and add:
```bash
BUFFER_ACCESS_TOKEN="..."
```
to `~/clawd/.env.local` and `.hive/config.yaml` under `publish_loop`.

---

## 7. Bing Webmaster (IndexNow)
**URL:** https://www.bing.com/webmasters/Home  
**Time:** 30 sec  
**Blocks:** 14 URL IndexNow submission

Generate an IndexNow key, save it as a TXT file at `/.well-known/IndexNow.txt` on each domain, and drop the key into `~/clawd/.env.local` as `BING_INDEXNOW_KEY`.

---

## After You Drop
Reply with "credentials dropped" and I'll run:
```bash
cd /Users/nicholas/clawd
python3 scripts/execute-credential-drop.py
```
This single command:
1. Verifies all env vars.
2. Publishes the queued MCP packages.
3. Submits IndexNow URLs.
4. Sends the 5 fintech keystone warm intros.
5. Runs a revenue-path smoke test.

**Total estimated time: 15 minutes.**
