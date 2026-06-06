# MEOK Revenue-Path Leak Audit — 2026-06-06

**Auditor:** Claude (read-only Stripe API verification + repo grep)
**Scope:** Every payment/checkout/PAYG link on live revenue surfaces (meok.ai consumer site `meok/ui/`, councilof.ai storefront, meok-compliance, flagship MCP READMEs).
**Method:** Grepped all `buy.stripe.com` links → resolved **328 live Stripe payment links** to their ACTUAL product + price via read-only Stripe API (`GET /v1/payment_links`, expand line_items) → cross-referenced each site link's DISPLAYED price/product against what Stripe actually charges. No payments submitted. No Stripe config changed. No prices changed.
**Live Stripe state:** LIVE mode confirmed, GBP balance **£0.00** (matches the "~£0 realized" symptom).

---

## TL;DR — why it's £0

The site is not failing to *show* buy buttons — it's that **the buttons charge the wrong thing**. A batch of correctly-priced Stripe products (Bias £299, Transparency £399, Article-50 Kit £999, Audit-Prep £4,950, NIS2-DE £49/£999, etc.) was **archived/deactivated in Stripe** (the 2026-05-29 "consolidation"), and the landing pages were then "patched" by repointing them at whatever links still resolved — overwhelmingly the single survivor `00wfZjcgAeUW…90K` (which is actually **eu-ai-act Pro £79/mo**). The result:

1. **The single highest-traffic conversion paths are mis-priced or send buyers to the wrong product** — including the homepage CTA, the `/pricing` page, and ~13 topic landing pages.
2. **The cheapest entry point (the £1 smoke test) is a DEACTIVATED link in 296 MCP READMEs + the `/buy` page** — every "start here" click dead-ends.
3. **The entire PAYG line (the headline "£0.05/call" offer) has NO working checkout** — top-up buttons are `mailto:` placeholders and the server-side metering API endpoint 404s.

The per-MCP product pages (`/mcp/[slug]`) and the councilof.ai substrate storefront are the *only* surfaces that are correctly wired.

---

## SEVERITY-RANKED LEAK TABLE (highest revenue impact first)

Status key: **CATASTROPHIC** = buyer charged a wildly wrong amount (chargeback/trust risk) · **WRONG** = wrong product/price · **BROKEN** = dead/inactive link · **MISSING** = no working path · **OK** = correct.

| # | Surface (file:line) | What page SHOWS | Link → ACTUAL Stripe charge | Status |
|---|---|---|---|---|
| 1 | `pricing/pricing-client.tsx:659-660` (`/pricing` NIS2 banner) | "£49 self-serve" **and** "£999 done-for-you" | `7sY00l6Wg…90Q` → **COBOL Substrate Pro £999/mo (recurring)** | **CATASTROPHIC** — £49 buyer charged £999/mo |
| 2 | `home-page-client.tsx:851,853` (homepage "Or self-serve") | "Pro £149/mo" **and** "Defence £999/mo" | both `7sY00l6Wg…90Q` → **COBOL Substrate Pro £999/mo** | **CATASTROPHIC/WRONG** — "Pro £149" → £999/mo COBOL |
| 3 | `home-page-client.tsx:756` (homepage **primary CTA**) | button label "**Subscribe £29/mo**" | `00wfZjcgAeUW…90K` → **eu-ai-act Pro £79/mo** | **WRONG** — promises £29, charges £79 (most-clicked button on site) |
| 4 | `pricing/pricing-client.tsx:607` (Pro card "Subscribe Monthly") | "Pro … £149/mo" | `eVq14pcgAcMO…90N` → **ai-bom Starter £29/mo** | **WRONG** product + price |
| 5 | `pricing/pricing-client.tsx:608` (Pro card annual) | "pay annual £1,490/yr" | `dRmfZj2G03ce…90O` → **eu-ai-act Starter £29/mo** | **WRONG** — charges £29/mo, not £1,490/yr |
| 6 | `pricing/pricing-client.tsx:627-628` (Defence card) | "£999/mo … or annual £9,990" | `eVq7sN6Wg9AC…90R` → **COBOL Defence £4,990/mo** | **WRONG** — charges 5×; "annual" link is also monthly |
| 7 | `buy/page.tsx:14` + **296 MCP READMEs** (`BUY-LADDER` block, "Smoke test £1 / Start here") | "£1 smoke test" | `dRmcN75Sc…90U` → **MEOK Smoke Test £1 [INACTIVE]** | **BROKEN** — deactivated link; the cheapest entry point is dead everywhere |
| 8 | councilof.ai/payg top-up buttons (`council-ai-storefront/payg.html:141,155,169`) + flagship balance-zero fallback | "Top up £10 / £50 / £200" | `mailto:nicholas@meok.ai` (was `STRIPE_LINK_xx_PLACEHOLDER`) | **MISSING** — no Stripe checkout; manual email handoff. No £10/£50/£200 PAYG products exist in Stripe |
| 9 | PAYG server metering backbone (`auth_middleware.py` default `MEOK_PAYG_SERVER_URL=…/payg`) | server-side balance/deduct | `meok-attestation-api.vercel.app/payg/balance` → **404**; `/payg` → **404** | **BROKEN** — documented server-mode metering not deployed (degrades to local-file balance) |
| 10 | `bias-detection/page.tsx:29` | "£299/mo" | `00wfZjcgAeUW…90K` → **eu-ai-act Pro £79/mo** | **WRONG** (correct £299 product `eVq00lcgA…83f` exists but is INACTIVE) |
| 11 | `transparency/page.tsx:29-30` | "£399/mo" and "£1,499/mo" | L29 `00wfZjcg…90K` → eu-ai-act Pro **£79**; L30 `7sY00l6Wg…90Q` → **COBOL £999/mo** | **WRONG** (correct £399 `4gMaEZ1BW…83p` exists but INACTIVE) |
| 12 | `data-privacy/page.tsx:29-30` | "£299/mo" and "£999/mo" | L29 `3cI7sN…83T` → **ai-incident Starter £29**; L30 `00wfZjcg…90K` → eu-ai-act Pro **£79** | **WRONG** |
| 13 | `accountability/page.tsx:29-30` | "£399/mo" and "£1,499/mo" | L29 `eVq7sN6Wg…90R` → **COBOL Defence £4,990/mo**; L30 `00wfZjcg…90K` → **£79** | **WRONG** |
| 14 | `ethical-governance/page.tsx:29-30` | "£999/mo" and "£2,499/mo" | L29 `7sY00l6Wg…90Q` → **COBOL £999/mo** (price coincidence, wrong product); L30 `00wfZjcg…90K` → **£79** | **WRONG** |
| 15 | `article-50-kit/page.tsx:23` | "£999 one-time" | `00wfZjcgAeUW…90K` → **eu-ai-act Pro £79/mo (recurring!)** | **WRONG** — one-time page → recurring sub (correct £999 once `dRmcN794o…83e` exists but INACTIVE) |
| 16 | `audit-prep-bundle/page.tsx:22` | "£4,950 one-time" | `00wfZjcgAeUW…90K` → **eu-ai-act Pro £79/mo (recurring!)** | **WRONG** (correct £4,950 once `dRmfZjcgA…83d` exists but INACTIVE) |
| 17 | `verticals/page.tsx`, `verticals/{healthcare,construction,waste-management}/page.tsx` | various "compliance pack" CTAs | `00wfZjcgAeUW…90K` → **eu-ai-act Pro £79/mo** | **WRONG/SHARED** — generic leaky link on 4 vertical pages |
| 18 | `labs/mcp/page.tsx:28,33` | "Legal & Compliance £99" (L28); enterprise (L33) | L28 `00wfZjcg…90K` → **£79**; L33 `eVq7sN6Wg…90R` → **COBOL Defence £4,990/mo** | **WRONG** |
| 19 | `api/manifest/route.ts:65,66,77` (`mdr-medical-device`, `fda-samd`, `sigstore-cosign`) | per-MCP buy links | `00wfZjcgAeUW…90K` → **eu-ai-act Pro £79** | **WRONG** — 3 MCPs in the manifest map fall back to the leaky link |
| 20 | `ai-incident-reporting-mcp/README.md` "Universal PAYG" row | "£29/mo + £0.0002/call" | `00w3cxcgA…90s` → **Universal PAYG £29/mo** (product OK) | **OK product, WRONG rate text** — README says £0.0002/call, site/pricing say £0.05/call |
| — | `mcp/[slug]/page.tsx` (all 38 per-MCP pages, Starter+Pro) | per-MCP £29 Starter / £79 Pro | each slug → its OWN matching £29/£79 link | **OK** ✓ (well-maintained per-slug map) |
| — | councilof.ai storefront (`council-ai-storefront/index.html`) | Universe £1,499, Cybersec £199, Enterprise £4,990, Substrate £499 | all resolve to matching active products | **OK** ✓ |
| — | `eu-ai-act-compliance-tool/page.tsx:17` | Pro £39.50/mo (LAUNCH50, then £79) | `4gMfZja8seUW…915?prefilled_promo_code=LAUNCH50` → **Compliance Pro £79/mo** | **OK** ✓ (prior leaky-link bug is fixed) |
| — | `buy/page.tsx:25,36` (£9 Quick Kit, £29 Founder Call) | £9 / £29 one-time | `cNi00la8s…90V` → Article 50 Quick Kit £9; `8x228ta8s…90W` → Founder Hour £29 | **OK** ✓ |
| — | `cobol/page.tsx`, `cobol-bridge-audit/page.tsx`, `a2a/page.tsx`, `governance/page.tsx`, `protocols/page.tsx`, `moe/page.tsx`, `mcp-stack/*` | COBOL/A2A/Governance/Universe substrate tiers | resolve to matching active products | **OK** ✓ |

### The "one link, many prices" leak (root cause, item-level)

`https://buy.stripe.com/00wfZjcgAeUW4c5cyQ8k90K` (ACTUAL: **eu-ai-act-compliance Pro, £79/mo**) is hardcoded on **13 distinct consumer pages**, each advertising a different price: £29 (homepage button), £99, £150, £299, £399, £999 one-time, £1,499, £1,999, £2,499, £4,950 one-time. The variable names in the code literally encode the *intended* price (`STRIPE_399`, `STRIPE_999`, `STRIPE_1499`, `STRIPE_1999`) — proof the dev meant different links and pasted the same one. This is the exact "leaky shared Stripe link" failure class from prior incidents, recurred.

---

## PAYG WIRING — detailed verdict

- **`councilof.ai/payg` resolves** (HTTP 200). ✓
- **Top-up checkout is non-functional.** The three top-up buttons (£10/£50/£200) deploy as `mailto:nicholas@meok.ai` (the build replaced `STRIPE_LINK_xx_PLACEHOLDER` with a mailto fallback). There is **no Stripe top-up product** for £10/£50/£200 in the account (only a £29/mo "Universal PAYG" subscription and a £5/cert ProofOf product — neither matches the advertised top-up amounts). → The headline "£0.05/call, top up once" offer cannot be self-served. **MISSING.**
- **Metering code is REAL, not vapourware.** `mcp-marketplace/eu-ai-act-compliance-mcp/auth_middleware.py` implements genuine per-call deduction: `MEOK_PAYG_KEY` gate, `PAYG_PRICE_PER_CALL_GBP` (default 0.05), server-side `/deduct` + `/balance` calls, local-file balance fallback (`~/.meok/payg_balance.json`), and a top-up-URL rejection when balance hits 0. ✓
- **But the server-side backbone 404s.** Default `MEOK_PAYG_SERVER_URL` points at `https://meok-attestation-api.vercel.app/payg`; `GET /payg/balance` and `GET /payg` both **404** (API root is 200). Server-mode metering is dead; only single-machine local-file mode works (and only if a key is manually provisioned). **BROKEN.**
- **The loop closes onto a dead page.** When an agent runs out of PAYG balance, the MCP correctly returns `https://councilof.ai/payg` as the top-up URL — which (per above) has no working checkout. So even a happy-path PAYG agent cannot top up. **Dead-end.**

---

## RANKED FIX LIST (highest revenue impact first)

> Owner-gated actions (Stripe dashboard product reactivation/creation, DNS, Vercel env, deploys) are flagged **[NICK]**. I did not perform any of these.

### P0 — stop charging buyers the wrong amount (trust/chargeback risk)
1. **[NICK] `/pricing` NIS2 buttons (#1) — `£49`/`£999` → £999/mo COBOL sub.** This is the single most dangerous bug: someone clicking "£49 self-serve" gets a £999/MONTH recurring COBOL subscription. **No active NIS2-DE products exist in Stripe** (the 2026-04-26 pivot created `prod_UPKp0KUAbAejak` £49 + `prod_UPKpI8gohaUMdF` £999, but they are not among the 328 active links). Either (a) recreate/activate the NIS2-DE £49 + £999 payment links and wire them, or (b) pull the banner until products exist. Same fix covers homepage #2.
2. **[NICK] Homepage primary CTA (#3) — "Subscribe £29/mo" → £79 link.** Decide the intended price for the headline button (£29 Starter or £79 Pro) and point it at the matching link (`dRm8wRdkEcMO…83O` = eu-ai-act Starter £29, or `4gMfZja8seUW…915` = Compliance Pro £79). One-line change once decided.
3. **[NICK] `/pricing` Pro + Defence cards (#4–#6).** Page shows Pro £149 / Defence £999 but the links charge £29 / £4,990. Decide canonical prices (note: `PRICING_SOURCE_OF_TRUTH.md` says Compliance Pro is **£79**, not £149 — the page is on a different/older model), then wire matching links. The "annual" links currently charge monthly — needs annual price links created or the annual CTA removed.

### P1 — restore the cheap entry point and the topic pages
4. **[NICK] Reactivate the £1 Smoke Test product** (`dRmcN75Sc…90U`, currently INACTIVE) **or** strip the dead `BUY-LADDER` rung from the 296 READMEs + `/buy` page (#7). Reactivating in Stripe is the one-click fix; bulk-editing 296 READMEs is the alternative. Either way the "Start here" path must not dead-end. *(Bulk README edit deliberately NOT done here — out of safe-scope.)*
5. **[NICK] Reactivate the archived correctly-priced products** then repoint the topic pages (#10–#16). These products already exist in Stripe, just deactivated:
   - Bias Detection £299/mo → `eVq00lcgAbIK5g9dCU8k83f` *(reactivate)*
   - AI Transparency £399/mo → `4gMaEZ1BWbIKfUNeGY8k83p` *(reactivate)*
   - Article 50 Watermarking Kit £999 once → `dRmcN794o4gi8sl0Q88k83e` *(reactivate)*
   - Audit-Prep Bundle £4,950 once → `dRmfZjcgA6oq5g9cyQ8k83d` *(reactivate)*
   - Bias Detection Annual £2,990 → `14AdRb1BW28acIB9mE8k83k` *(reactivate)*
   Once reactivated, the page edits are trivial one-liners (swap the leaky `00wfZjcg…90K` for the right link). **Critical sub-issue:** `article-50-kit` and `audit-prep-bundle` are **one-time** offers currently pointing at a **recurring £79/mo** link — even ignoring price, the billing model is wrong (buyer gets a subscription for a "one-time" kit).
6. **[NICK] Replace the leaky link on the 4 vertical pages + `labs/mcp` + 3 manifest entries (#17–#19)** with the correct per-product links once decided.

### P2 — PAYG (the headline offer no one can buy)
7. **[NICK] Create £10 / £50 / £200 PAYG top-up Stripe products** and wire them into `council-ai-storefront/payg.html` (replace the mailto fallbacks). Without this the entire "£0.05/call" pitch is undeliverable.
8. **[NICK] Deploy the attestation-API `/payg` endpoints** (`/payg/balance`, `/payg/deduct`) on `meok-attestation-api.vercel.app`, or change the documented `MEOK_PAYG_SERVER_URL` default to a working host. Currently 404 → server-side metering impossible.

### P3 — consistency / hygiene
9. **[NICK] Pick ONE pricing model.** Three are live simultaneously (per-MCP £29/£79; substrate packs £49–£4,990; landing trio Free/£149/£999/£2,499). This is itself a conversion leak — buyers see contradictory prices across homepage, `/pricing`, topic pages, and READMEs. `PRICING_SOURCE_OF_TRUTH.md` (2026-05-21) already flags this and still lists the leaky `00wfZjcg…90K` link for 6 products — **update the SoT too**.
10. **[NICK] Fix PAYG rate text** in `ai-incident-reporting-mcp/README.md` (#20): says "£0.0002/call", everywhere else says £0.05/call.

---

## CHANGES I APPLIED (unambiguous + obviously-correct only)

**1 change, 1 file** — not committed, not pushed:

| File | Line | Before | After | Why safe |
|---|---|---|---|---|
| `meok/ui/src/app/care-homes/page.tsx` | 22 | `STRIPE_LINK = "…/00wfZjcgAeUW4c5cyQ8k90K"` (eu-ai-act Pro £79/mo) | `STRIPE_LINK = "…/3cIaEZfsMcMO9wp7ew8k83F"` (MEOK Care Home Pack £150/mo) | Page displays **£150/mo** in title, OG, JSON-LD (`price:"150"`), H1, and FAQ — unambiguous. The target product is **ACTIVE** and an exact £150.00/mo match (verified via Stripe API). |

Everything else is **flagged for your confirmation** because the correct target is either (a) a price decision only you can make (multiple live pricing models), or (b) a product you'd need to reactivate/create in the Stripe dashboard first (owner-gated). I did not guess at those, and I did not bulk-edit the 296 READMEs.

---

## Appendix — verification artefacts
- Full resolved link map (all 328 active payment links → product/price): `/tmp/stripe_link_map.json`
- Distinct meok/ui links resolved: see `/tmp/site_codes.txt`
- The leaky link `00wfZjcgAeUW4c5cyQ8k90K` resolves to: **MEOK eu-ai-act-compliance MCP (Pro) | £79/mo** (active).
- `stripe-utm.ts:6` contains `buy.stripe.com/abc` — **not a bug**, it's a docstring usage example (false positive).
