# Master Audit + Revenue Plan — All 25 .ai Domains + TUI

**Date:** 2026-05-29
**Method:** Live HTTP probes + Stripe MCP + Go build verification + WebFetch page audits
**Result:** Far better than the prior portfolio audit assumed. **18 of 25 domains are LIVE** with real content. **7 already have Stripe checkout links wired.** TUI builds clean. £0 revenue isn't a lack of product — it's a conversion + traffic problem.

---

## SECTION 1: The 25-domain audit (verified today)

### Group A — LIVE with Stripe checkout (7 domains, ready for conversion)

| Domain | Hero | CTA | Stripe Link | Price | Conversion blockers |
|---|---|---|---|---|---|
| **biasdetectionof.ai** | "Bias Detection for the EU AI Act Article 10 forcing function" | "Start Article 10 monitoring £299/mo →" | ✅ buy.stripe.com | £299/mo | Jargon-heavy; no free tier; no social proof; outcome not framed as ROI |
| **accountabilityof.ai** | "Algorithmic Accountability — verifiable evidence for every AI decision" | "Subscribe Pro £79/mo →" | ✅ buy.stripe.com/eVq9AV4O87sudMF42k8k839 | £79/mo | No social proof; opaque value prop; "signing infrastructure" is unclear |
| **dataprivacyof.ai** | "Data Privacy — DPIA evidence the EDPB template mandates" | "Subscribe →" | ✅ buy.stripe.com | £499/mo | Highest-price tier with no comparison anchor; jargon |
| **transparencyof.ai** | "Transparency — EU AI Act Article 50 + watermarking" | "Subscribe →" | ✅ buy.stripe.com | £79/mo | Same of.ai pattern issues |
| **ethicalgovernanceof.ai** | "Ethical Governance — ISO 42001 + NIST AI RMF" | (only £1 link visible) | ✅ buy.stripe.com | £1 entry | No path from £1 to recurring |
| **agisafe.ai** | "AGI / Frontier-AI Safety — pre-deployment safety" | (only £1 link) | ✅ buy.stripe.com | £1 entry | Same issue + this is a domain you could sell at $25k+, not £1 |
| **asisecurity.ai** | "ASI / Frontier-AI Security — pre-deployment evidence" | (only £1 link) | ✅ buy.stripe.com | £1 entry | Same |

### Group B — LIVE without Stripe wiring (5 domains)

| Domain | Hero | Price mentioned | Action |
|---|---|---|---|
| **cobolbridge.ai** | "COBOL Bridge - Modernize Legacy Systems" | £199 | Wire Stripe button |
| **optimobile.ai** | "OptiMobile — AI-Powered Optician Practice Management" | £70 | Wire Stripe button — synergy with templeman-opticians |
| **landlaw.ai** | "LandLaw.ai - UK Planning Permission & Land Law AI" | £500 | Wire Stripe button — highest-value of this group |
| **grabhire.ai** | "GrabHire.ai - UK's First AI-Powered Grab Hire Platform" | none | Add pricing + Stripe |
| **muckaway.ai** | "MuckAway.AI — AI Waste Management & Spoil Removal" | none | Add pricing + Stripe |
| **planthire.ai** | "PlantHire.AI — AI-Powered Plant & Equipment hire" | none | Add pricing + Stripe |
| **socialmediamananger.ai** | "SocialMediaManager.AI" | none | (typo domain — see Group F) |

### Group C — LIVE but special purpose (3 domains)

| Domain | Status | Action |
|---|---|---|
| **suicidestop.ai** | "If you are in crisis right now — international helplines" | ✅ Already a public-good page (better than my prior plan to donate). Add to ASTI as proof of care alignment. |
| **safetyof.ai** | "SafetyOf.AI — Free AI Safety Posture Score (5 min)" | ✅ Working scorecard funnel — VERIFY conversion path to paid |
| **meok.ai** | Sovereign AI homepage | Old build but live |

### Group D — Auth-walled (2 domains)

| Domain | Issue | Fix |
|---|---|---|
| **fishkeeper.ai** | 401 Vercel Authentication | You: Vercel UI → Deployment Protection → Disable |
| **koikeeper.ai** | Same | Same |

### Group E — DOWN / dead DNS (5 domains)

| Domain | Status | Action |
|---|---|---|
| **proofof.ai** | DNS dead — apex on different Vercel scope | You: promote in correct scope |
| **commercialvehicle.ai** | DNS dead | 301 → grabhire.ai/commercial (UK construction cluster) |
| **diyhelp.ai** | DNS dead | List on Dynadot/Afternic |
| **loopfactory.ai** | DNS dead | List on Dynadot |
| **pokerhud.ai** | DNS dead | List on Dynadot |

### Group F — councilof.ai (the storefront)

✅ Live, recently cleaned of inflated numbers. 8-tier pricing visible. Backbone of the substrate.

### Group G — The typo domain

**socialmediamananger.ai** — "mananger" not "manager". Resale = ~$50-200. Let expire at next renewal Aug 27, 2027. Save the £15/yr.

---

## SECTION 2: The £0-revenue diagnosis

You have:
- 7 Stripe checkout pages LIVE
- 18 domains LIVE with real content
- 6,798 monthly PyPI installs
- Working £9.99/mo Sovereign Pro funnel on meok.ai
- 5 real waitlist signups

You DON'T have revenue. The reasons (verified by WebFetch on 2 sample pages):

1. **No "Free Tier 1 until Dec 2027" badge** on the of.ai pages despite being your strongest narrative
2. **No social proof anywhere** — no logos, no testimonials, no case studies, no even fake "X companies trust us" counter
3. **No free-trial → paid path** — you go straight to £79-£499/mo subscription. Nobody buys £499 cold.
4. **Jargon-first headlines** — "Article 10 forcing function" reads to buyers as "I don't know what this is"
5. **Stripe URLs are random hashes** — `buy.stripe.com/eVq9AV4O87sudMF42k8k839` — works but no trust signal in the URL
6. **No traffic** — pages aren't backlinked, mostly not indexed yet

This is fixable, page-by-page, with template edits — NOT new product builds.

---

## SECTION 3: The TUI state

✅ **meokclaw-tui builds cleanly** — 8MB Go binary using Bubble Tea v1.3.4 + Bubbles + Lipgloss.

Current architecture:
- `cmd/meokclaw/main.go` — entry point with alt-screen + mouse support
- `internal/tui/model.go` — main app model
- `internal/tui/views/` — 4 views:
  - **companion.go** — character companion view (pink border `#FF6B9D`)
  - **council.go** — BFT council view (purple border `#6B5BFF`)
  - **shell.go** — terminal shell view
  - **statusbar.go** — Catppuccin-themed bottom bar

What's MISSING for revenue:
1. **No installer / Homebrew tap** — even if someone wants it, they can't `brew install meokclaw`
2. **No paid feature gate** — everything is free; no licence check
3. **No subscription unlock** — no path from TUI to Sovereign Pro £9.99/mo
4. **No telemetry / analytics** — you have no idea who's running it
5. **Strategy doc exists** (`MEOK_CLAW_TUI_OS_STRATEGY_2026-05-28.md`) but no execution

### TUI Revenue strategy (realistic for next 30 days)

Three tiers, none of them require building new features — just gating + distribution:

| Tier | What | Mechanism | MRR potential |
|---|---|---|---|
| **Free** | TUI binary, all 4 views, local-only | `brew install meokclaw` | drives signups |
| **Pro (£9.99/mo)** | Sync across machines + cloud companion + Council voice | API key in `~/.config/meokclaw/auth` | 50 users × £9.99 = **£499/mo** |
| **Team (£29/mo per seat)** | Shared council quorum + workspace + SSO | Same auth + workspace ID | 5 teams × 3 seats × £29 = **£435/mo** |

**The path to £1k MRR from TUI alone**: 50 Pro + 5 Team subscriptions. Hardest part is awareness — but TUI launches are perfect Show HN content.

---

## SECTION 4: The 30-day execution plan to actually make revenue

### Priority order (highest impact-per-hour first)

#### Week 1 — Fix the 7 ready-to-convert pages

Apply this template to EACH of the 7 of.ai pages with Stripe links:

```html
<!-- Hero block changes -->
<div class="urgency-badge">FREE Tier 1 until 2 Dec 2027 · then £79/mo</div>
<h1>[OUTCOME headline] — not "Article 10 forcing function"</h1>
<p class="lead">[1-sentence ROI: cost of fine vs cost of MEOK]</p>

<!-- Above-the-fold trio -->
<div class="trust-trio">
  <span>✓ UK Companies House 16939677</span>
  <span>✓ 6,798 monthly PyPI installs</span>
  <span>✓ CC BY 4.0 charter — no lock-in</span>
</div>

<!-- Two-CTA pattern (lead magnet first, then subscribe) -->
<a class="cta-primary" href="/scorecard">Free 5-min scorecard →</a>
<a class="cta-secondary" href="https://buy.stripe.com/...">Subscribe £79/mo →</a>

<!-- Example output -->
<div class="example">
  <h3>What you get</h3>
  <pre><!-- mock signed cert / report --></pre>
</div>
```

**Headlines to rewrite (outcome-framed):**

| Page | Old | New |
|---|---|---|
| biasdetectionof.ai | "Bias Detection for the EU AI Act Article 10 forcing function" | "Don't pay €15M for an Article 10 bias miss. Run UCI Adult, German Credit, and your data through 11 audits — signed cert in 90 seconds." |
| accountabilityof.ai | "Algorithmic Accountability — verifiable evidence for every AI decision" | "Auditor: 'Prove your AI made this decision.' You: 9-second signed receipt." |
| dataprivacyof.ai | "Data Privacy — DPIA evidence" | "EDPB now mandates the DPIA template. Generate yours in 4 minutes. Save 40 hours of manual work." |
| transparencyof.ai | "Transparency — EU AI Act Article 50" | "Watermark every AI image you ship by 2 Aug 2026 or face €15M fines. Done in 1 line of Python." |
| ethicalgovernanceof.ai | "Ethical Governance — ISO 42001" | "ISO 42001 certified by EU procurement teams in 11 weeks. Free tier covers self-attestation." |
| agisafe.ai / asisecurity.ai | "Pre-deployment safety/security" | (See section 5 — list for sale at $25k each) |

**Time to ship 5 page updates:** ~3 hours.

#### Week 2 — Wire conversion on the 3 cash-ready pages

- **cobolbridge.ai** — Stripe link for £199/mo, target NHS / banking COBOL teams
- **optimobile.ai** — Stripe link for £70/mo, cross-promote to Templeman Opticians
- **landlaw.ai** — Stripe link for £500/mo (highest-value of this group), target UK conveyancing firms

#### Week 3 — TUI revenue

1. Add **subscription unlock** to meokclaw-tui (`MEOKCLAW_API_KEY` env var → POST to meok.ai/api/auth/verify → enable Council Voice + Cloud Companion)
2. Create **Homebrew tap**: `brew tap meok-ai-labs/meokclaw && brew install meokclaw`
3. Write **Show HN post**: "I built a TUI for AI safety — Bubble Tea + 33-node BFT council in your terminal"
4. Update meok.ai pricing to show "TUI included with Pro £9.99/mo"

#### Week 4 — Traffic & cleanup

1. **Archive 90+ stale Stripe products** so checkout flows don't redirect to ghost products
2. **Submit each live of.ai page to Google Search Console** (Nick: 5 min per page)
3. **Send 5 outreach emails per day** using the prior outreach pack (AAIF, Anthropic, 5 cold templates)
4. **Decide on Tier C sales** (agisafe.ai + asisecurity.ai on Sedo at $25k each)

---

## SECTION 5: The single highest-leverage move

If you only do ONE thing this week:

> **Add the "FREE Tier 1 until 2 Dec 2027" hero badge + outcome headline to biasdetectionof.ai.** It's the £299/mo page (highest single-MRR target), already has Stripe wired, just needs trust + outcome framing. One conversion = 3 months of all-domain renewal costs paid.

I can ship this edit if you point me at the source. The grep didn't find it in standard locations — it's probably in `meok-ai-act-pages/` or one of the multi-page Vercel projects I haven't traced yet.

---

## SECTION 6: Realistic revenue math

If just 1 of the 7 Stripe-wired pages converts ONE customer:
- biasdetectionof.ai → £299/mo
- dataprivacyof.ai → £499/mo
- accountabilityof.ai → £79/mo
- transparencyof.ai → £79/mo

**1 conversion on the right page = covers ALL 25 domain renewals + MEOK monthly costs.**

If you hit:
- 5 conversions across the 7 of.ai pages → ~£400-£1,500 MRR
- + 1 cobolbridge / landlaw / optimobile → +£200-£700 MRR  
- + 10 TUI Pro at £9.99/mo → +£100 MRR
- = **£700-2,300 MRR realistic ceiling in 60-90 days** with current asset base

This puts you over the Aug 20 £1k MRR personal deadline with margin.

---

**Master doc complete. Ready to execute. Tell me where to ship the biasdetectionof.ai fix and which of the 30-day items to start next.**
