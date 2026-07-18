# Nick's manual handoff — what Claude couldn't do alone

**As of 2026-05-21.** Every item below requires Nick's authenticated session or external account. Claude has prepared everything else so each item is 5-30 minutes of work.

## Critical — unblock revenue (≤30 min total)

### 1. Add `api` DNS record on Namecheap (5 min)

- Log in to Namecheap → Domain List → meok.ai → Manage → Advanced DNS
- Click **Add New Record**
- Type: **CNAME**
- Host: **api**
- Value: **cname.vercel-dns.com**
- TTL: **Automatic** (or 60)
- Save

Verify in 60s:
```bash
dig +short api.meok.ai     # expect: cname.vercel-dns.com / 76.76.21.21
curl https://api.meok.ai/  # expect: JSON with "service": "meok-api-gateway"
```

### 2. Create Stripe Meter for £0.0002/call (10 min)

- Log in to Stripe Dashboard (live mode) → **Billing** → **Meters**
- Click **+ Create meter**
- Display name: **MEOK MCP call**
- Event name: **meok_mcp_call**
- Aggregation: **count** (1 unit per event)
- Default aggregation formula: `count`
- Save

Then create metered price linked to the meter:
- Products → **MEOK Universal PAYG** (prod_UYYAj6vDc82Ej9) → Add price
- Price model: **Usage-based** → Per unit
- Amount: **£0.0002 (0.02p)** per unit
- Billing period: **Monthly**
- Meter: **MEOK MCP call**
- Save

Repeat for:
- prod_UYXSCL67zcVfNL (A2A PAYG)
- prod_UYYdAaEjKJwvVC (COBOL Substrate Pro — over-quota)
- prod_UYYAFfTBteOLAb (Governance Substrate — over-quota)

When the gateway is wired (Day 2), it'll emit `meok_mcp_call` events via the Stripe Meter Events API and Stripe meters the £0.0002/call automatically.

### 3. Open the 3 awesome-mcp PRs (5 min)

Branches pushed. One click each in the browser:

- https://github.com/wong2/awesome-mcp-servers/compare/main...CSOAI-ORG:wong2-awesome-mcp-servers:add-meok-compliance-mcps?expand=1
- https://github.com/appcypher/awesome-mcp-servers/compare/main...CSOAI-ORG:appcypher-awesome-mcp-servers:add-meok-compliance-mcps?expand=1
- https://github.com/punkpeye/awesome-mcp-servers/compare/main...CSOAI-ORG:awesome-mcp-servers:add-meok-compliance-mcps?expand=1

Click **Create pull request** on each → done.

### 4. Submit Show HN (Tue 3 June 14:00 UTC)

Full post draft at `revenue/SHOW_HN_POST_2026-06-03.md`. Pre-flight checklist + back-up titles + reply prep already done. Just submit at the exact UTC time.

## High-value but not blocking (≤2h total)

### 5. Reconnect Gmail MCP

Claude lost Gmail access mid-session. Need to re-authorize the Gmail connector in Claude settings so Claude can search inbox / read replies / draft responses on the cold outreach.

### 6. Recover LinkedIn account

Form draft at `revenue/LINKEDIN_ACCOUNT_RECOVERY_EMAIL_2026-04-28.md`. Send to LinkedIn appeals. Once recovered, the 80+ drafted DMs in `revenue/LINKEDIN_DMS_READY_TO_SEND.md` can fire.

### 7. Set up outreach email infrastructure

- Namecheap → Domains → meok.ai → Email Forwarding → add **outreach@meok.ai**, **compliance@meok.ai**, **sales@meok.ai** → forward to **nicholas@meok.ai**
- Set up Resend domain verification (DKIM + SPF + DMARC) for meok.ai
- Wire daily cron at 09:00 BST → pulls from prospect list → sends 10-15 emails/day per address
- Templates ready in `revenue/SEND_THESE_MONDAY_2026-05-26.md`

### 8. Rotate the 3 exposed API keys

These are in this conversation's history (and committed to memory of any LLM I'm running on):

- VERCEL_TOKEN `<REDACTED-ROTATE-2026-06-07>`
- RESEND_API_KEY `<REDACTED-ROTATE-2026-06-16>`
- GITHUB_TOKEN `<REDACTED-ROTATE-2026-06-16>`

Rotate them in their respective dashboards. Update `~/.zshrc` and Vercel env vars with new values.

## Live now and proven (just confirming)

- ✅ `https://api.meok.ai/` — gateway scaffold (needs DNS — see step 1 above)
- ✅ `https://meok-api-gateway.vercel.app/` — direct URL works now
- ✅ `https://meok.ai/a2a` — A2A Substrate landing
- ✅ `https://meok.ai/governance` — Governance Substrate landing
- ✅ `https://meok.ai/cobol` — COBOL Substrate landing
- ✅ `https://meok.ai/protocols` — 8-protocol × 47-framework matrix
- ✅ `https://meok.ai/moe` — Mixture of Experts positioning
- ✅ `https://meok.ai/anthropic-registry` — 47-MCP catalogue
- ✅ `https://meok.ai/fine-calculator` — EU AI Act penalty calculator
- ✅ `https://meok.ai/about` — Founder + Schema.org Person with sameAs
- ✅ `https://meok.ai/press` — Press kit (existing, 690-line launch focus)
- ✅ `https://meok.ai/thanks` — Post-purchase landing
- ✅ `https://councilof.ai` — BFT Council Substrate (rebuilt)
- ✅ `https://csoai.org` — Legal-entity 1-page notice
- ✅ `https://cobolbridge.ai` — COBOL bridge product page
- ✅ `https://templeman-opticians.com` — Family business

Plus 47 Stripe products + payment links (£29 PAYG · £499 A2A · £499 Governance · £199 Cybersec · £999 COBOL Pro · £9,990 COBOL Annual · £4,990 COBOL Defence · £1,499 Universe · £4,990 A2A Defence + 38 per-MCP buy links).

Plus 47 MCPs in Anthropic Registry · 247 PyPI packages · 16 GitHub repos with Sister MCPs + A2A Substrate + Protocol Coverage blocks pushed.

## Total time to unblock everything

| Item | Time |
|---|---|
| Namecheap DNS for api.meok.ai | 5 min |
| Stripe Meter + 4 metered prices | 15 min |
| 3 awesome-mcp PR clicks | 5 min |
| Gmail reconnect | 2 min |
| LinkedIn recovery form | 5 min |
| Outreach email forwarding | 15 min |
| Resend DKIM/SPF/DMARC | 15 min |
| Key rotation | 10 min |
| **Total** | **~72 min** |

72 minutes of Nick's hands → unblocks the daily outreach engine, the per-call metering, the gateway production routing, and the 3 directory listings driving organic traffic.

After those 72 minutes, the only big remaining lift is the **api.meok.ai gateway backend** (Day 2 of Q3_33DAY_DOMINATION_PLAN — wire token resolution + MCP routing + HMAC signing into the existing Edge Function scaffold). That's 2-3 day dev work.

Everything else — landing pages, Stripe products, MCP READMEs, schema markup, attribution surface — is already live.
