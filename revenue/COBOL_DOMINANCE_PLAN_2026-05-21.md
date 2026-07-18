# COBOL Substrate — Dominance Plan
*Nick Templeman / CSOAI-ORG / MEOK AI Labs | 2026-05-21*

## The Truth

| What | Status | Gap |
|---|---|---|
| cobol-bridge.vercel.app (Node) | LIVE but 0 tools registered | Claims 5 tools, stubs only |
| cobol-bridge-mcp (Python/PyPI) | LIVE, 5 tools working | No HTTP endpoint, simpler logic |
| npm-package in deploy-ready | FULL implementations exist | NEVER wired into deployed server |
| meok.ai/cobol page | LIVE | Claims tools that don't work |
| Stripe products | LIVE in STRIPE_LIVE account | buy.stripe.com links NOT from this account |
| COBOLBRIDGE private repo | ZIP exists | Never extracted/deployed |

**Root cause:** The real 5-tool Node.js implementation exists at:
`/Users/nicholas/Desktop/jan - feb 2026/Cobol Bridge Launch (4)/COBOL-BRIDGE-DEPLOY-READY/npm-package/src/`
...but was never built and deployed to Vercel. The deployed server is a skeleton.

---

## 7-Day Dominance Plan

### DAY 1 — Deploy the real tools to cobol-bridge.vercel.app
**Objective:** The deployed server registers and runs all 5 tools

1. Copy `copybook-parser.ts`, `cics-bridge.ts`, `jcl-scanner.ts`, `vsam-mapper.ts`, `ebcdic-translator.ts` from the deploy-ready npm-package into `/Users/nicholas/cobol-bridge/src/tools/`
2. Replace `/Users/nicholas/cobol-bridge/src/index.ts` with the deploy-ready version (has tool registration + express + rate limiter + auth)
3. Copy `types/index.ts` and `utils/index.ts` from the deploy-ready package
4. Update `package.json` to add `helmet`, `rate-limiter-flexible`, `winston` (already in deploy-ready index.ts)
5. `npm run build` → push to Vercel → redeploy
6. **Verify:** `curl https://cobol-bridge.vercel.app/health` shows tools registered + `curl -H "Authorization: Bearer test" https://cobol-bridge.vercel.app/mcp` returns MCP tools list

### DAY 2 — Auth gate the `/mcp` endpoint
**Objective:** Paying customers get exclusive access; free tier limited

1. Set `COBOL_BRIDGE_API_KEY` in Vercel env for cobol-bridge project
2. Modify `/mcp` route to require `Authorization: Bearer <key>` header
3. Set up per-customer API keys: generate unique keys, store in Stripe metadata
4. Test: no key → 401; wrong key → 401; valid key → 200 + tools
5. Wire Stripe webhook: on `checkout.session.completed`, create API key and email to customer

### DAY 3 — Add COBOL-Coder-14B transpiler tool
**Objective:** The headline benchmark tool actually works

1. Read `/Users/nicholas/clawd/sovereign-stack/cobolbridge-ai/cobolbridge_transpiler.py` — this IS the real FPT model integration
2. Build a `cobol-coder-transpiler.ts` tool that:
   - Accepts COBOL source code
   - Calls the FPT COBOL-Coder-14B via HuggingFace Inference API (or local if available)
   - Returns Python/Java output with compiler-validated success %
3. Register as 6th tool: `cobol-coder-transpiler`
4. If FPT API is unavailable, fall back to the Python transpiler logic via subprocess
5. **Verify:** `curl` test with sample COBOL returns actual transpiled code

### DAY 4 — Fix Stripe links on meok.ai/cobol
**Objective:** Buy buttons go to LIVE Stripe products, not test-mode placeholders

1. Read `STRIPE_PRICE_*` env vars from the `ui` Vercel project
2. Replace all 3 hardcoded `buy.stripe.com/*` URLs in `page.tsx` with:
   - `https://checkout.stripe.com/pay/${PRICE_ID}` for one-time
   - `https://buy.stripe.com/${PRICE_ID}` for subscriptions
   - OR use Stripe Checkout Session API (server-side, no publishable key needed)
3. Confirm `STRIPE_PUBLISHABLE_KEY` is set in Vercel
4. **Verify:** Click each buy button → goes to LIVE Stripe checkout (not 404)

### DAY 5 — Governance Crosswalk tool (DORA/NIS2/AI Act)
**Objective:** The regulatory sales lever actually works

1. Build `cobol-governance-crosswalk.ts` in `/Users/nicholas/cobol-bridge/src/tools/`
2. Input: COBOL program name/type + industry sector
3. Output: JSON mapping to applicable regulations with gap scores:
   - DORA Art.17 (Register of Information)
   - NIS2 Art.23 (Incident reporting)
   - EU AI Act Art.12 (Record-keeping)
   - Basel III/IV (BCBS 239 data lineage)
   - PCI-DSS v4.0 (Scope gap analysis)
   - FCA SM&CR (Accountability)
4. Register as 7th tool: `governance-crosswalk`
5. **Verify:** Test with "banking-payment-program" → returns all 6 regulation scores

### DAY 6 — Pilot intake form + CRM workflow
**Objective:** Leads from meok.ai/cobol → Stripe pilot product → CRM

1. Add 14-day pilot form to meok.ai/cobol page:
   - Fields: company, name, email, COBOL estate size, DORA deadline
   - Action: creates Stripe Checkout Session for £4,990 pilot product
2. Wire Stripe webhook on `checkout.session.completed` for pilot product:
   - Auto-create ticket in Airtable/Notion CRM
   - Auto-send NDA PDF + copybook upload link
3. Pilot-to-subscription flow: if pilot customer buys Pro within 90 days, apply £4,990 credit
4. **Verify:** Submit form → Stripe checkout → webhook fires → CRM ticket created

### DAY 7 — Rebrand + CI/CD + launch outreach
**Objective:** Brand is clean, pipeline is automated, outreach goes out

1. **Rebrand:** sed replace `csga-global.org` → `meok.ai`, `CSGA Global` → `MEOK AI Labs`, `@csga-global` → `@meok-ai` across all 22 HTML files + package.json + index.ts
2. **CI/CD:** Add GitHub Actions or simple test script that runs `npm run build && npm test` before deploy
3. **Outreach batch 1:** 25 emails to tier-2 UK banks (Virgin Money, TSB, Metro Bank, Co-op, Close Brothers, Paragon, Aldermore, Shawbrook) using the 5-step sequence from the playbook
4. **LinkedIn:** Post "220 billion lines" authority post + send 25 connection requests to tier-1 bank CTOs/Heads of Engineering
5. **Verify:** GitHub Actions green on push; first 25 emails in Sent/Outlook

---

## Revenue Targets

| Month | MRR | ARR | Customers |
|---|---|---|---|
| M1 | £1,998 | £24K | 2 Pro |
| M2 | £5,997 | £72K | 3 (add 1 Defence) |
| M3 | £11,994 | £144K | 6 |
| M4 | £19,984 | £240K | 8 |
| M5 | £34,974 | £420K | 12 |
| M6 | £59,958 | £720K | 16+ |

Defence tier = 83% of revenue at M6. LTV:CAC = 22:1 (Pro), 149:1 (Defence).

---

## What We Own (Clean IP)

- `CSOAI-ORG/cobol-bridge` — 91 commits, all by `CSOAI.org`. James Castle only in package.json metadata.
- `cobol-bridge-mcp` on PyPI — published under MEOK brand
- `cobolbridge.ai` domain — branded MEOK
- COBOL-Coder-14B integration — FPT model, used per its licence (not our IP, legally clear)
- All launch materials, case studies, docs — authored by Nick

## What Needs Fixing Before Any External Contact

1. ✅ Package.json author/name rebrand (James Castle → MEOK AI Labs)
2. ✅ cobol-bridge.vercel.app tools must actually work (not stubs)
3. ✅ buy.stripe.com links must point to LIVE account products
4. ✅ COBOL-Coder-14B must actually return transpiled code
5. ❌ NO outreach until items 1-4 are done
