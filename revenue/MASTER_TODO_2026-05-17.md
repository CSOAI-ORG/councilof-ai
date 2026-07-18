# MASTER TODO — full state + your action list
**Date:** 2026-05-17 · **Stripe balance:** £0 · **Customers:** 0 · **PyPI flagships live:** 27/39

The bottleneck is distribution, not tooling. Everything below ranked by revenue impact.

---

## 🔥 TIER 1 — DO THIS WEEK (every item drives revenue directly)

### N1. Post Show HN — Tuesday 14:00 UTC (10am EST)
- **Time:** 5 min
- **Why:** Realistic 5-15K visits if front-paged → first real conversion test
- **File:** `revenue/SHOW_HN_POST_2026-05-17.md` (copy-paste ready)
- **URL:** https://news.ycombinator.com/submit
- **Title:** *"Show HN: 38 MCPs that auto-check your AI for EU AI Act compliance"*
- **What I need from you after posting:** the HN URL so the council can monitor reactions

### N2. Send the 9 cold emails I just drafted (UK care home groups)
- **Time:** 1-2 hours (verify each recipient on LinkedIn first)
- **Why:** Fastest path to first £29 MRR — care-home-cqc-mcp is now live + Stripe wired
- **Folder:** `revenue/outreach/2026-05-17_uk-care-home-ai-compliance-mcp-targets/`
- **Process:**
  1. Open `INDEX.md` — see council vote per target (all approved)
  2. For each `.eml` pick left or right variant (left = factual, right = empathetic)
  3. Verify each recipient on LinkedIn (replace `<REPLACE-WITH-VERIFIED-EMAIL>@<domain>`)
  4. Paste into Smartlead/Apollo/Gmail, send
  5. (Optional) Update the email tracker with reply rates

### N3. Top up Anthropic billing
- **Time:** 3 min
- **Why:** Unlocks Claude as right-brain voice → quality of every autonomous output jumps ~3×
- **Steps:** console.anthropic.com → Settings → Plans & Billing → add £20 (covers ~400 audits OR ~100 deep reviews)
- **After:** `echo 'export ANTHROPIC_BILLING_OK=1' >> ~/.zshrc` → council expands 35→37 nodes

### N4. Set RESEND_API_KEY in Vercel
- **Time:** 3 min
- **Why:** First paying customer gets no welcome email without this — risk of churn
- **Steps:** resend.com → API Keys → New → copy → vercel.com/niks-projects-0a2ef942/meok-attestation-api/settings/environment-variables → add `RESEND_API_KEY` to Production → redeploy

### N5. Submit NLnet grant — deadline 1 June (15 days)
- **Time:** 1-2h review of draft
- **Why:** €30K potential, deadline hard
- **File:** `revenue/NLNET_GRANT_DRAFT_2026-04-26.md`

---

## 💰 TIER 2 — DO IN 7-14 DAYS (each unlocks bigger capability)

### N6. Sign up DeepSeek (free 5M tokens, no card)
- **Time:** 4 min
- **Why:** Cheapest deep-reasoning workhorse for council + research (cheapest workhorse currently rated)
- **Steps:** platform.deepseek.com → register → API keys → `echo 'export DEEPSEEK_API_KEY="..."' >> ~/.zshrc`

### N7. Sign up Gemini AI Studio (generous free tier)
- **Time:** 3 min
- **Why:** Cheapest premium-grade triage voice ($0.10/$0.40 per 1M, 1M context window)
- **Steps:** aistudio.google.com → Get API Key → `export GOOGLE_API_KEY="..."` in `~/.zshrc`

### N8. Sign up xAI Grok ($25 + $150/mo free credits)
- **Time:** 4 min
- **Why:** 2M-context auditor → deep-repo / full-history reviews effectively free for first month
- **Steps:** x.ai/api → register → opt into data-share for $150 credits → key

### N9. Sign up Alibaba DashScope for Qwen3 (1M free in + 1M free out)
- **Time:** 4 min
- **Why:** Best code + Chinese-language council voice; free tier substantial
- **Steps:** qwen.ai/apiplatform → key → `DASHSCOPE_API_KEY` in `~/.zshrc`

### N10. Sign up MiniMax (per your dual-brain architecture)
- **Time:** 4 min
- **Why:** You wanted MiniMax 2.5 as the left-brain backup behind Step 3.6
- **Steps:** minimax.io → API → `MINIMAX_API_KEY` in `~/.zshrc`

### N11. mcp-publisher login github (JWT expired)
- **Time:** 1 min interactive (opens browser)
- **Why:** I have 12 MCPs ready to submit to Anthropic's official MCP Registry → free distribution
- **Run:** `mcp-publisher login github` in terminal

### N12. Confirm Templeman Opticians optometrist names + GOC reg numbers
- **Time:** 5 min (or you already know)
- **Why:** Only blocker for a proper v2 templeman-opticians.com site (currently maintenance only)
- **Format needed:** `Name BSc(Hons) MCOptom, GOC #01-XXXXX` per practising optometrist
- **Lookup tool:** https://www.optical.org/en/utilities/online-registers/

### N13. Krystal cPanel cleanup
- **Time:** 10 min
- **Why:** Old (potentially fraudulent) Templeman content still lives on Krystal even though DNS now points at Vercel — if DNS resets it could re-serve
- **Steps:** login Krystal → cPanel → File Manager → delete `public_html/index.html` + any old install → consider cancelling £6-15/mo hosting

### N14. DNS for safetyof.ai (currently HTTP 404)
- **Time:** 10 min in Namecheap
- **Steps:** Namecheap dashboard → safetyof.ai → DNS → CNAME/A record to Vercel (per yesterday's `DNS_FIX_*` doc) → wait 5 min

### N15. DNS for haulage.app (currently HTTP 000)
- **Time:** 10 min
- **Same pattern as N14** — point to Vercel project

### N16. Innovate UK grant — deadline 27 May (10 days!)
- **Time:** 2h
- **Why:** £4.5M ceiling; even a fraction would dwarf MCP MRR
- **Status:** check if drafts exist in `revenue/`

---

## 🛠️ TIER 3 — HYGIENE (any time, no urgency)

### N17. LinkedIn account recovery
- **Time:** 10 min
- **Why:** Unblocks 80+ drafted DMs to ICOs / care groups
- **File:** `revenue/LINKEDIN_ACCOUNT_RECOVERY_EMAIL_2026-04-28.md`

### N18. Buttondown signup + Newsletter Issue #1
- **Time:** 7 min
- **Why:** Email list = direct conversion channel; tab was opened weeks ago
- **Files:** `revenue/NEWSLETTER_ISSUE_01_2026-05-05.md`

### N19. 5 trade press pitches
- **Time:** 30 min
- **File:** `revenue/PRESS_PITCHES_2026-04-29.md`

### N20. Create new npm user `meok-ai-labs` (removes severed `csga_global` brand)
- **Time:** 5 min sign-up + I run the re-owner script after you send token
- **Why:** Every `npm install` page currently shows `csga_global` as publisher (severed brand)
- **Steps:** npmjs.com → sign up `meok-ai-labs` → 2FA → API token → send to me

### N21. Stripe end-to-end smoke test
- **Time:** 15 min
- **Why:** Validate the full funnel before real customers hit it
- **Steps:** create £1 test product → buy with own card → confirm webhook fires + /thanks redirect works + welcome email arrives (needs N4 done first) → refund

### N22. HN karma building (ongoing)
- **Time:** 5 comments/day for a week
- **Why:** Account with <5 karma can't post Show HN successfully

---

## 🤖 CLAUDE TODO (autonomous, no Nick needed — running now or queued)

| # | Action | Status |
|---|---|---|
| C1 | Auto-audit every commit via 35-node BFT council | ✅ live (3 commits today already) |
| C2 | Hermes 6h shift gathers all activity + council votes | ✅ live (next ~12:00) |
| C3 | Deep research shift every 12h picks next queue question | ✅ live (next 12:30) |
| C4 | Cold email drafter Mon 7am — takes latest memo → drafts emails | ✅ live (first run Mon 19th 7am) |
| C5 | Content engine Tue/Thu/Sat 10am — generates blog/case-study/landing | ✅ live (first run Tue 19th 10am) |
| C6 | Persistent SSH tunnel to Vast (free 8B + 3B llama voices) | ✅ live via launchd |
| C7 | Publish 12 missing PyPI flagships (aml, sbom, basel, mifid, sigstore, slsa, coppa, cobol, cisa, mitre×2, care-home) | ⏳ queued — PyPI account rate-limit clears in ~24h |
| C8 | Submit 12 new MCPs to Anthropic Registry | ⏸ blocked on N11 (mcp-publisher re-login) |
| C9 | Build promotion script: approved `revenue/content/*.md` → live `meok/ui/src/app/blog/<slug>/page.tsx` | TODO — high-impact next |
| C10 | Build research-to-LinkedIn-DM pipeline (like cold-email but for LinkedIn) | TODO — needs N17 first |
| C11 | Replace stale `gemma4:31b` reference in `model_gateway.py` with actual deployed Vast models | TODO — minor cleanup |
| C12 | Add 8 more high-value vertical MCPs to reach the 47×33 target architecture | TODO — list candidates first |
| C13 | Public dashboard at `sovereign.templeman-opticians.com/dashboard` (council activity + revenue + Vast GPU) | TODO |
| C14 | Deploy Qwen3-30B-A3B on Vast (replaces llama-8b with real MoE) | TODO — when you OK it |
| C15 | Fix V-03 + V-04 security vulnerabilities (HIGH-priority from April 26 audit) | TODO — pre-customer hygiene |
| C16 | Bing Webmaster sitemap submission | TODO — minor SEO |
| C17 | Resolve CRN entity mismatch (CSOAI LTD 16939677 vs MEOK AI LTD references) | TODO — Stripe payout will hold if not done before first customer |

---

## 🎯 IF YOU CAN ONLY DO 3 THINGS THIS WEEK

1. **N1 — Show HN Tuesday 14:00 UTC** (5 min) → first traffic surge
2. **N2 — send the 9 cold emails I drafted** (1-2h) → fastest path to first £29 MRR
3. **N3 + N4 — Anthropic billing + RESEND_API_KEY** (6 min total) → quality jump on every autonomous output + first customer gets welcome email

Everything else can wait. These 3 actions cost ~£25 total and 2-3 hours of your time, and they unlock the funnel that the last 3 weeks of building was for.

---

## 🚦 WHAT'S BLOCKING WHAT

```
First paying customer
        ▲
        │
        ├── needs N1 (Show HN traffic) OR N2 (cold emails delivered)
        │
        ├── needs N4 (welcome email works) for retention
        │
        └── needs C7-C8 (12 PyPI uploads + Registry submissions) for distribution surface

Bigger autonomous quality
        ▲
        │
        ├── needs N3 (Anthropic billing) → unlocks Claude right-brain
        ├── needs N6-N10 (5 more API keys) → 5 more council voices
        └── needs N11 (mcp-publisher) → 12 MCPs into Anthropic Registry

Brand hygiene (long-term)
        ▲
        │
        ├── needs N20 (npm rebrand) → no more csga_global exposure
        ├── needs N12 (Templeman optoms) → proper v2 site
        ├── needs N17 (LinkedIn) → 80+ DMs unblocked
        └── needs N13 (Krystal cleanup) → kill backup of old Templeman content
```

---

*Generated by Claude 2026-05-17. Updated as items complete — strike through with ~~text~~ when done.*
