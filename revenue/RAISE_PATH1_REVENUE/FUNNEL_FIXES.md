# FUNNEL_FIXES — concrete fixes to convert

**Date:** 2026-06-06. **Scope:** the path from "someone is interested" → card charged. Findings below are from reading the actual files, not assumptions. **Severity-ordered.**

**One framing decision up front:** the B2B aquaculture buyer (trout farm, koi importer) and the B2C consumer (fishkeeper.ai hobbyist) are **different funnels** and must not share copy or buy-ladders. Mixing them is the root cause of several leaks below.

---

## VERDICT on the £1/£9/£29 buy-ladder: it DILUTES the B2B funnel. Remove it from the aquaculture READMEs.

**What's actually there** (confirmed in `mcp-marketplace/meok-rspca-aquaculture-mcp/README.md` lines 113–124, and identically in `meok-laia-aquatic-mcp`, `fishkeeper-ai-mcp`, `meok-koikeeper-ai-mcp`):

```
## 💸 Try MEOK in 30 seconds — instant buy ladder
| Smoke test  | £1  | Signed sample MCP-Hardening report + Article 50 PDF |
| Quick Kit   | £9  | EU AI Act Article 50 implementation guide (C2PA + EU-Icon) |
| Founder Call| £29 | 30-min 1-on-1 with the founder |
> Builds on the 81-MCP MEOK fleet.
```

**Why it dilutes (B2B):** a trout farmer who has just read about RSPCA Assured gap-analysis is then offered an **"EU AI Act Article 50 PDF"** and a **"MCP-Hardening report"**. These are from a completely different product line (AI-governance compliance). To a fish farmer they are noise that says "this vendor isn't really about fish" — it actively *reduces* trust at the moment of decision. The "81-MCP fleet" line reads as spray-and-pray, the opposite of the focused-expert posture that closes a £499 sale.

**The one piece worth keeping (re-themed):** a **£29 "Founder Call / mini-audit"** as a low-commitment first step is genuinely useful for B2B — but it must be *aquaculture* framed ("30-min compliance review of your RSPCA/LAIA setup"), not "30-min 1-on-1 with the founder" sitting under an EU-AI-Act header.

### Fix F1 (do first — highest ROI, lowest effort): clean the aquaculture README footers
For each of `meok-rspca-aquaculture-mcp`, `meok-uk-fhi-mcp`, `meok-asc-rspca-crosswalk-mcp`, `meok-laia-aquatic-mcp`, `meok-aquaponics-monitor-mcp`:
1. **Delete** the entire `<!-- BUY-LADDER:START -->` EU-AI-Act block (£1 smoke-test / £9 Article-50 / "81-MCP fleet").
2. **Replace** the "Sign up: [meok.ai/pricing]" line (README line ~86) with the **direct live Stripe link** for that product (the server.py runtime already uses these — README just needs to match):
   - rspca → `https://buy.stripe.com/8x28wR0xS7su23X7ew8k90z` (£499/mo)
   - uk-fhi → `https://buy.stripe.com/aFa5kF3K41465g9fL28k90B` (£79/mo)
   - asc-crosswalk → `https://buy.stripe.com/8x25kF4O85kmfUN42k8k90G` (£999/mo)
   - laia → `https://buy.stripe.com/8x2aEZeoI5km7ohdCU8k90I` (£29/mo)
   - aquaponics → `https://buy.stripe.com/aFa28t80k9ACdMF1Uc8k90D` (£29 hobby) / `https://buy.stripe.com/00w28tgwQ6oq9wpcyQ8k90E` (£79 pro)
3. (Optional) add ONE aquaculture-framed low-commitment line: `**Not ready to subscribe?** 30-min compliance review of your setup — [book a call](mailto:nicholas@meok.ai?subject=Aquaculture%20compliance%20review)`.

**Note — the README "Free tier: 30 calls/hour" claim:** confirm the server actually enforces a free tier before advertising it (the rate-limit branch in `server.py` exists, but verify the limit matches the README's "30 calls/hour" / "30 calls/day" wording — they currently disagree across files). A free-tier promise that doesn't match the code is exactly the kind of unverifiable claim to avoid.

### Where the buy-ladder DOES belong
Keep a consumer £-ladder concept **only on the consumer apps** (fishkeeper.ai / koikeeper.ai), and re-theme it to the actual consumer products (FishKeeper Pro £4.99/mo, KoiKeeper Pro £7.99/mo, KoiKeeper Premium £19.99/mo — these Stripe products already exist per `AQUACULTURE_LIVE_LAUNCH_STATE.md`). Not the EU-AI-Act ladder. See F4.

---

## CRITICAL — the consumer apps have NO buy path at all

### Finding (confirmed in `fishkeeper-site/index.html`)
- The site is a React SPA: `<div id="root"></div>` with the app bundle.
- The **nav bar is empty** (lines 143–146: an empty flex `<div>` where CTA buttons should be).
- The **footer** links only to `meok.ai`, `csoai.org`, `/api/manifest` — **no pricing, no "Upgrade", no Stripe link anywhere.**
- The only MEOK hook is `<script src="https://meok.ai/widgets/meok-trust-bar.js">`.
- `koikeeper-site/` is the same shell.

**So the task brief's premise ("the consumer apps redirect to meok.ai") is only half-true:** they *link* to meok.ai in the footer, but there is **no upgrade CTA and no redirect to a checkout.** A consumer who loves the free app literally cannot find how to pay. That's a 100% leak on the consumer funnel.

> Caveat: the buy path may be rendered *inside* the React bundle (not in the static `index.html`). **Verify in-browser first** (load fishkeeper.ai, look for an Upgrade button) before assuming it's missing. If it IS in the bundle, check the link target is a live Stripe link, not a dead `/pricing`.

### Fix F2 (consumer): add a real upgrade CTA
If the React app has no upgrade button: add a persistent **"Upgrade to Pro — £4.99/mo"** button in the nav and after a value moment (e.g. after a water-test result or a disease-ID), linking to the **existing** FishKeeper Pro Stripe link (`prod_UPeiiddZNN0ysd`, £4.99/mo) / KoiKeeper Pro (`prod_UPeinFan85GUEm`, £7.99/mo). The products exist; they just aren't wired to a button.

### Fix F3 (consumer): the meok-trust-bar widget depends on meok.ai being up
The trust bar loads from `https://meok.ai/widgets/meok-trust-bar.js`. If that path 404s (the launch-state doc flags the aquaculture trust-bar widget as ❌ not yet deployed), the consumer site shows a broken/empty bar. **Verify the widget URL returns 200**; if not, either deploy it or remove the script tag so it's not a visible defect.

---

## B2B landing page leaks

### Fix F4 (B2B): confirm `meok.ai/aquaculture` is actually deployed
`AQUACULTURE_LIVE_LAUNCH_STATE.md` lists "Deploy meok.ai/aquaculture page" as **❌ not done** (needs Next.js push). The cold emails and READMEs reference `meok.ai/aquaculture`. **If that page 404s, every outbound link to it is a dead end.**
- **Until it's confirmed live, all outreach should link to direct Stripe links (already done in OUTREACH_BATCH_1), not to `meok.ai/aquaculture`.**
- The page content already exists drafted at `~/clawd/revenue/AQUACULTURE_LANDING_PAGE.md` — it's good (clear price table, consultant-vs-MEOK comparison, real deadlines). It just needs deploying. Deploy it, then re-point links.

### Fix F5 (B2B): the landing page CTAs point to generic /pricing
`AQUACULTURE_LANDING_PAGE.md` "Get started" section links to `meok.ai/pricing` (generic) and a mailto. **Replace the primary CTA per-product with the direct Stripe links** so an in-market farmer can buy the £79 FHI or £29 LAIA without a sales conversation. Keep the mailto "talk to Nick" as the secondary CTA for the £499/£999 tiers (those genuinely need a call).

### Fix F6 (B2B): remove the unverifiable / aspirational claims from the landing page before driving traffic
The drafted landing page asserts things that may not yet be true — each must be made true or softened:
- "**University of Stirling … (in discussion)**", "**OATA … distribution channel**", "**CEFAS … data licence**" — these are *pitches sent*, not partnerships agreed. Per proof-over-claims, label them as outreach/intent or remove until reciprocated. Stating them as live partnerships is exactly the failure mode to avoid.
- "**MEOK PondSense v1.0 ships as the reference sensor rig**" — confirm the hardware actually ships before claiming it; otherwise mark "in development."
- "**signed attestation … verify at meok.ai/verify**" — confirm `meok.ai/verify` + `meok-attestation-api` are live (CONVERSION_PLAN Q4). If not live, this is a claim a buyer can falsify in one click = worst-case credibility hit.
- "**250+ MEOK MCPs**" footer — memory's verified count is 271 published / 316 built. Use a real number or drop it; for a fish farmer it's irrelevant anyway.

---

## Checkout / Stripe hygiene

### Fix F7: confirm each Stripe payment link is the RIGHT product at the RIGHT price
Past sessions found wrong-link bugs (a checkout pointing at a £499 product, a leaky shared link). **Before sending outreach, click each of the 6 aquaculture links** in `AQUACULTURE_LIVE_LAUNCH_STATE.md` and confirm: correct product name, correct price, GBP, livemode, and that completion lands somewhere sensible (a thank-you page, not a dead Stripe success screen). A broken link in the first cold email burns the best lead.

### Fix F8: add a post-payment landing / onboarding trigger
When the £79 FHI or £29 LAIA card succeeds, what happens? If it's just Stripe's default "payment received," the customer is stranded — they paid but don't know how to *use* the MCP. Add a Stripe success-URL redirect to a short "you're in — here's how to install + book your concierge setup" page (even a single static page). This converts a one-month curiosity charge into a retained customer. (Past sessions patched ~100 links with a thanks-page redirect — apply the same here.)

---

## Priority order (do these before sending Batch 1)

| # | Fix | Effort | Why now |
|---|---|---|---|
| **F1** | Strip EU-AI-Act ladder + wire direct Stripe links into 5 aquaculture READMEs | 20 min | The READMEs are the public face on PyPI/GitHub; the off-topic ladder actively reduces B2B trust |
| **F7** | Click-test all 6 Stripe links | 10 min | A broken link in the first email kills the best lead |
| **F4/F5** | Confirm `meok.ai/aquaculture` live or keep links Stripe-direct; per-product CTAs | 30 min | Don't send traffic to a 404 |
| **F6** | Soften unverifiable partnership/hardware/verify claims | 20 min | Proof-over-claims; a falsifiable claim is worse than no claim |
| **F8** | Stripe success-URL → onboarding page | 30 min | Converts a charge into a retained customer |
| **F2/F3** | Consumer upgrade CTA + trust-bar 200-check (verify in-browser first) | 1–2 hr | Fixes the consumer funnel, but consumer is secondary to the B2B first-sale push |

**Do NOT** drive any paid traffic or send outreach linking to a page until F1, F7, F4 are done. The products can take cards; the job is making sure the *path to the card* is clean and on-message.
