# Domain Portfolio Tiering — RAISE PATH 4 (Digital Real Estate → Capital)

**Owner:** Nicholas Templeman / MEOK AI Labs
**Date:** 2026-06-06
**Method:** Reconciled from in-repo audits (`_TOPOLOGY/DOMAINS.md`, `DOMAINS_LIVE_STATE_2026-05-13.md`, `_alignment/ALIGNMENT_2026-06-02.md §5`, `revenue/DOMAIN_BRAND_AUDIT_2026-05-16.md`) + a live HTTP/DNS probe this session + aftermarket price comps (sources at bottom).

---

## 0. Honest pricing reality (read this before any number below)

The 2025 market correction is the single most important fact for this exercise:

- **Median .ai aftermarket sale (2025): ~$811** (≈£640). Average is $6,525 but that average is dragged up by one-word generics like `cloud.ai` ($600K). **Medians, not averages, predict what a two-word/compound name actually sells for.**
- **Hand-registered, parked, low-traffic .ai names** appraise **~$100–$500** and realistically transact **£150–£900** unless the name is short or a strong generic keyword.
- **.app** is a weak resale TLD (no premium-keyword aftermarket to speak of) — most resell at **£50–£300**.
- **.vc** reads as "venture capital" and is unrestricted, but it is a thin, specialist market — **£100–£600** for a decent keyword.
- **Two-word brandables broadly:** ~55% of *all* aftermarket sales land in the $1,000–$3,000 band — but that's across all TLDs and includes names with traffic/age. Treat the **top** of any range here as optimistic-but-possible, not expected.

**Bottom line:** Nick's portfolio is almost entirely **compound/two-word brandables** (`biasdetectionof.ai`, `loopfactory.ai`, etc.), not one-word generics. So the honest expectation per saleable name is **low-£hundreds, with a couple of names able to reach £1–3K if the right operator finds them.** No five-figure fantasy pricing.

**Carrying cost that justifies pruning:** .ai renews at **~$92/yr (~£72/yr)** at Namecheap. .app ~£12/yr, .vc ~£25/yr, .com/.org ~£10/yr. A dormant .ai name is a **£72/yr cash leak** — that is the real reason to either sell or drop, not the (small) sale proceeds.

---

## 1. Tier summary

| Tier | Meaning | Count |
|---|---|---|
| **KEEP-BUILD** | Operating brand or active build — never sell | 14 |
| **KEEP-HOLD** | Tied to a live cluster / cheap to hold / strategic option — don't sell yet | 6 |
| **SELL-NOW** | Dormant, parked, or off-strategy — list on the aftermarket | 7 |
| **DROP (let expire)** | Negative-value: typo'd, ethically constrained, or already DNS-dead | 5 |

*(Total verified owned ≈ 32 names: 28 × .ai, 1 × .app, 1 × .vc, 1 × .com, 1 × .org. The brief's "~59" appears to over-count — it likely folds in not-yet-registered haulage sub-brands (`cartransport.app`, `cranehire.app`, `hiabhire.app` are a £60 Namecheap TODO in `HAULAGE_STATUS_2026-06-06.md`, **not owned**), duplicate Vercel project names, and lapsed planning-doc names (`asisecurity-portal.com`, `industrial-hire-ai.com` — both resolve to **no nameservers**, i.e. not in the live portfolio). Tiering below covers every name that is actually registered.)*

---

## 2. KEEP-BUILD — operating brands (DO NOT SELL)

These have a live site, live Stripe rails, or an active build. Selling any of these would be selling the business.

| Domain | Why keep |
|---|---|
| meok.ai | Primary brand surface / customer login for the whole MCP fleet |
| councilof.ai | Live governance storefront (£29/£79/£99 + 4-tier ladder, live Stripe) |
| csoai.org | "FAA for AI" institution brand, 52-page charter, live |
| proofof.ai | Attestation/verification brand on `meok-attestation-api` (working rails) |
| safetyof.ai | Live (per alignment §5), AI-safety pillar of the of.ai cluster |
| fishkeeper.ai | Live consumer product (£4.99/mo), aquaculture vertical |
| koikeeper.ai | Live premium consumer (£7.99/£19.99/mo), aquaculture vertical |
| aquaponics.app | Aquaculture vertical brand (live per memory) |
| haulage.app | Trade umbrella — 7 verticals, 21-MCP catalogue, lead-gen live |
| planthire.ai | Live trade site, construction-tech cluster (NRSWA/CHAS MCPs) |
| muckaway.ai | Live trade site, high-intent skip/grab-hire (UK term) |
| grabhire.ai | Live trade site, grab-lorry booking |
| landlaw.ai | Live UK planning Q&A, legal-tech micro-product |
| optimobile.ai | **LIVE** (308 redirect, NS healthy) — optometry vertical brand (note: spelt "opti", per memory the canonical one; **`optomobile.ai` with an "o" is the dead twin — see DROP**) |
| templeman-opticians.com | Nick's real family business (optical + care homes), ~£2.5–5K/mo |

> Not probed but named in the brief as KEEP and not to be listed: **safetyof.ai, proofof.ai, aquaponics.app** plus the live trade domains. All retained above.

---

## 3. KEEP-HOLD — strategic option / cheap to hold (don't sell yet)

These are not generating revenue, but each either (a) plugs into a live cluster as an SEO/landing funnel, (b) is genuinely cheap to hold, or (c) has more upside as a 1-page product seed than as a £200 flip. Re-evaluate at next renewal.

| Domain | Rationale | Renewal £/yr |
|---|---|---|
| cobolbridge.ai | Live landing; COBOL-modernisation buyers pay £200K+/project. Worth more as a lead magnet than a flip. | ~£72 |
| biasdetectionof.ai | Live, redirects to a real £299/mo product (EU AI Act Art. 10 forcing function). Keep — it's a funnel, not dead weight. | ~£72 |
| transparencyof.ai | Strongest of.ai cluster name for FinServ/healthcare explainability RFPs. Hold as the one of.ai name to actually build. | ~£72 |
| commercialvehicle.ai | Generic 2-word keyword with real meaning; fits the haulage cluster as a fleet module. Hold (also the best *resale* candidate if you change your mind — see note). | ~£72 |
| dataprivacyof.ai | Cheap option on a GDPR + EU AI Act bundle landing page under csoai.org. | ~£72 |
| accountabilityof.ai | Cheap of.ai funnel that redirects to csoai.org audit. Low cost to keep one redirect. | ~£72 |

> **Trim option for Nick:** the of.ai cluster (`accountabilityof.ai`, `dataprivacyof.ai`, `ethicalgovernanceof.ai`, `asisecurity.ai`, `agisafe.ai`) is **5+ names at ~£72/yr each = £360+/yr** of carry for landing-page redirects. If cash discipline matters more than SEO optionality, demote `accountabilityof.ai` + `dataprivacyof.ai` to SELL/DROP and keep only `transparencyof.ai`. I've kept them in HOLD because they're live and *individually* cheap, but as a *cluster* they're the obvious next prune.

---

## 4. SELL-NOW — list on the aftermarket

Dormant, parked, or off-strategy. None of these has a live product, none is core to the five verticals, and each is costing renewal money. Prices are **realistic BIN ranges** anchored to the median-.ai reality (§0), not aspirational.

| # | Domain | Status (probed) | Honest BIN range | Where | 1-line rationale |
|---|---|---|---|---|---|
| 1 | **loopfactory.ai** | Registered, 404 (parked) | **£600–£2,000** | Dan / Sedo | Best brandable in the sell tier — short, punchy, "loop + factory" reads as automation/dev-tooling; broad buyer pool. Top of range only with the right SaaS founder. |
| 2 | **pokerhud.ai** | Registered, 404 (parked) | **£500–£1,800** | Dan / Sedo / NamePros | Exact-match for "poker HUD" — a real product category (PokerTracker/Hold'em Manager). Niche but the buyer is *identifiable* and motivated. |
| 3 | **diyhelp.ai** | Registered, 404 (parked) | **£300–£1,200** | Dan / Sedo | Clean generic "DIY help" keyword, broad consumer appeal, AI-assistant angle. Two common words = decent brandability. |
| 4 | **asisecurity.ai** | Live placeholder (per audit) | **£250–£900** | Sedo / Afternic | "ASI security" rides the AI-safety narrative; off Nick's core (no ASI product). Better as cash than as a 6th of.ai redirect. |
| 5 | **agisafe.ai** | Live placeholder / sale page exists | **£250–£900** | Sedo / Afternic | "AGI safe" is on-trend; already had a sale page (`domain-sales/agisafe.ai.html`). Sell the narrative, not a product. |
| 6 | **ethicalgovernanceof.ai** | Parked (of.ai cluster) | **£150–£600** | Sedo / Afternic | Longest of.ai name; duplicates what csoai.org already *is*. Dilutive to hold — best monetised as a flip to another governance vendor. |
| 7 | **optometry.vc** | **DNS down (no NS)** | **£100–£500** *(if still registered)* | Sedo / Dan | "Optometry" + ".vc" = a fundable-startup read in Nick's own expertise vertical. **First verify it hasn't already lapsed** (no nameservers); if lapsed, this moves to DROP and costs nothing. |

**SELL-NOW realistic proceeds:** see `DOMAIN_CAPITAL_SUMMARY.md`. Headline: **expected ~£1.2–2.5K total across all 7**, not per name — most will sell at the *low* end of their range, and several may not sell at all within 12 months. Treat any single £1K+ sale as the upside case.

> **commercialvehicle.ai** is deliberately **not** in SELL-NOW: it's the one genuinely generic, broadly-valuable keyword in the set and it fits the haulage cluster. If Nick wants to add an 8th listing for more shots on goal, this is the highest-quality name to flip (BIN **£800–£2,500**) — but holding it as a fleet-module funnel is the stronger play. Listed as a swap-in candidate in `SEDO_LISTINGS.md`.

---

## 5. DROP — let expire (negative value, stop paying)

Do **not** spend effort listing these; the listing time costs more than they'll ever fetch. Just turn off auto-renew. Each .ai dropped = **~£72/yr saved**.

| Domain | Status (probed) | Why drop |
|---|---|---|
| **socialmediamananger.ai** | Registered, 301 | **Typo in the name** ("mananger"). A misspelled brand has ~zero resale value and zero type-in traffic. Let it expire. (£72/yr saved.) |
| **optomobile.ai** | **No nameservers** | The dead twin of the live `optimobile.ai`. Memory confirms "optomobile.ai is dead." If still on auto-renew, cancel. (£72/yr saved.) |
| **optometry-patient.ai** | **DNS down (no NS)** | Long, awkward compound; no product; likely already lapsing. Don't renew. (£72/yr saved if still billed.) |
| **agriculture-robotics.ai** | **DNS down (no NS)** | Unbuilt; robotics work lives on disk under other names. Hyphenated 2-word = weak resale. Let expire. (£72/yr saved.) |
| **suicidestop.ai** | Live placeholder | **Ethical constraint — do NOT sell on the open market.** Either hold and only transfer to a qualified mental-health charity/org, or let expire. Treat as £0; never list. |

> **`asisecurity-portal.com` and `industrial-hire-ai.com`** appeared in old planning docs but **resolve to no nameservers** — they are not in the live portfolio (lapsed or never completed). No action; nothing to drop.

---

## 6. Action order (fastest cash + cleanest estate)

1. **Verify registration** of the three "no-NS" names at Namecheap (`optometry.vc`, `optometry-patient.ai`, `agriculture-robotics.ai`): if already expired → nothing to do; if registered → set `optometry.vc` for sale, set the other two to **no auto-renew**.
2. **Turn off auto-renew** on all 5 DROP names today (saves ~£290/yr in .ai renewals alone once they lapse).
3. **List the 7 SELL-NOW names** using the paste-ready copy in `SEDO_LISTINGS.md` (Dan.com for the brandables, Sedo/Afternic for the governance names). 30 minutes of work.
4. **Decide on the of.ai cluster trim** (§3 note) — optional second prune of `accountabilityof.ai` + `dataprivacyof.ai`.
5. Leave KEEP-BUILD / KEEP-HOLD untouched.

---

## Sources (aftermarket comps)

- Sedo / InterNetX 2025 Global Domain Report — median .ai $811 (2025), average $6,525: https://domainnamewire.com/2025/03/18/peeking-inside-sedo-and-internetxs-2025-global-domain-report/ ; https://sedo.com/us/about-us/news-press/newsroom/global-domain-report-2025-navigating-the-future-of-the-domain-industry/
- .ai July 2025 sales: 748 names, avg $3,620 (top-10 $150K–$700K): https://www.accio.com/business/top-selling-ai-domain-sales-2024-2025
- Hand-reg / parked low-traffic .ai realistic $100–$500: https://www.blackhatworld.com/seo/how-to-sell-hot-ai-domains.1491015/ ; https://humbleworth.com/
- Aftermarket distribution (55% of sales $1K–$3K): https://domaindetails.com/kb/domain-investing/domain-name-valuation-guide
- .vc reads as venture capital, thin specialist market: https://sullysblog.com/should-we-all-be-investing-in-vc-domains
- Namecheap .ai renewal ~$91.98/yr: https://domainoffer.net/tld/ai/namecheap
- NameBio (live comp lookup before final BIN): https://namebio.com/
