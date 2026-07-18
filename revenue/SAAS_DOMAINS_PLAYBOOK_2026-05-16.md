# Vertical SaaS Domains Playbook — May 2026
**Turn 5 parked domains into £240-435k blended Y1 ARR with shared infrastructure**

You own premium domains (councilof.ai, haulage.app, muckaway.ai, grabhire.ai, planthire.ai, biasdetectionof.ai). Each maps to one of your MCPs as the underlying engine. Right now they're thin landing pages or parked. This doc maps each into a real SaaS with a defensible data moat, and orders them by realistic ROI.

---

## TL;DR — the ranked verdict

| Rank | Domain | Y1 ARR (realistic) | Why |
|---|---|---|---|
| 🥇 1 | **haulage.app** | £80-140k | Highest WTP (transport managers have budget). PCN avoidance is quantifiable. Tachograph + DVSA pain = recurring + acute. |
| 🥈 2 | **planthire.ai** | £50-90k | CHAS Elite renewal is annual + painful. HAE/CPA partnership channel exists. Mid-market budget. |
| 🥉 3 | **councilof.ai** | £60-120k | Already partially built, Stripe live, urgent Article 50 cliff Dec 2026. But crowded vs Vanta/Drata. |
| 4 | **muckaway.ai** | £40-70k | High search intent but lower WTP (price-sensitive yard owners). EA audit is real but episodic. |
| 5 | **grabhire.ai** | £8-15k standalone | **Don't waste a brand here.** Sell as £19 add-on to muckaway. |

**Total realistic blended Y1 ARR: £240-435k.** Not the £2M+ a spreadsheet TAM × 1% would claim — but real, defensible, and built on infrastructure you mostly already have.

---

## The 5 verticals — full breakdown

### 🥇 1. haulage.app — UK Operator Licence holders

| | |
|---|---|
| **Underlying MCP** | `haulage-uk-compliance-mcp` |
| **TAM** | 11,200 UK Operator Licence holders, 74,000 HGVs |
| **SAM** | ~2,400 mid-market (5-50 vehicles — RHA/Logistics UK members) |
| **Pain $$$/yr per operator** | £12-45k (DVSA roadside fines avg £2k × 3-4 events + WTD remediation + £8k+ TM time on tacho) |
| **Existing competitors** | Tachomaster (£8/driver/mo ≈ £80-400/mo), FleetCheck (£3/vehicle), R2C Online (~£500/mo) |
| **Competitor weakness** | None do Operator Licence *renewal workflow* well |
| **Pricing target** | £49-99/mo (3-vehicle) → £199-499/mo (mid-market) |
| **Y1 ARR realistic** | **£80-140k** |
| **Distribution channel** | RHA member directory cold call + Transport News print ad + "DVSA roadside hot-spot map" viral PR |

**Product spec (90-day MVP):**

1. **Hot-spot map** (free, public, viral): `haulage.app/hotspots` — interactive UK map with DVSA roadside encounter density by postcode + day-of-week. Email-gate the detailed PDF.
2. **OCRS score predictor** (free, account required): inputs vehicle count + driver count + last 12-month incidents → predicts OCRS band + 12-month roadside risk
3. **Operator Licence renewal workflow** (£99/mo): 90 days out reminder + auto-generated TM responsibilities pack + audit-prep checklist
4. **Tacho-infringement classifier** (£199/mo): upload .DDD file → instant infringement classification + WTD breach risk score + remediation pack
5. **Pro tier £499/mo**: priority TM hot-line + monthly DVSA enforcement brief

**Data moat — the gold:**

- **DVSA roadside encounter postcodes by day-of-week** (anonymised, aggregated from user uploads)
- **Tachograph infringement type heatmap** by operator size + sector
- **OCRS-band predictor** (multi-tenant ML — gets better with every new customer)
- **Operator Licence renewal calendar** — predict who's about to renew across the whole UK fleet base

After 6 months of operation, no competitor can replicate this dataset. **That's the moat that gets you bought by Microlise or Logistics UK.**

**Viral hook:** *"Is your fleet on the DVSA hot-list?"* — postcode + vehicle count → roadside-stop probability + nearest 5 hot-spots.

---

### 🥈 2. planthire.ai — UK plant-hire operators

| | |
|---|---|
| **Underlying MCPs** | `nrswa-ai-mcp` + `chas-elite-prep-mcp` + `crane-hire-cpcs-mcp` |
| **TAM** | ~4,800 UK plant-hire firms (HAE + CPA membership ~2,500 + long tail) |
| **SAM** | ~1,200 (CHAS Elite + 5+ asset count) |
| **Pain $$$/yr** | £15-30k (CHAS renewal £500-2k + 80hr prep, LOLER miss = HSE prosecution avg £18k, NRSWA S74 £100/day overrun) |
| **Existing competitors** | inspHire (£250-600/mo, ERP-heavy), Point of Rental, MCS-rm — **none do compliance prep well** |
| **Pricing target** | £79/mo (10 assets) → £199/mo (50 assets) → £499/mo (HAE Elite member) |
| **Y1 ARR realistic** | **£50-90k** |
| **Distribution channel** | HAE/CPA partnership + CHAS renewal-window email blast + Executive Hire Show booth |

**Product spec:**

1. **Free CHAS Elite gap analysis** (12 questions → probability-of-pass score)
2. **LOLER schedule tracker** (£79/mo): per-asset 6-month thorough exam reminder, BS 7121 lift plan templates
3. **CPCS/CISRS card calendar** (£79/mo bundled): never miss an operator card expiry
4. **NRSWA Section 74 deferral tool** (£199/mo): when a job is at risk of overrun, auto-draft the S58 deferral notice
5. **CHAS renewal pack** (£499 one-shot): full readiness audit + document pack 90 days before renewal

**Data moat:**

- Per-asset LOLER schedule across customer base (predict UK-wide LOLER demand spikes)
- CPCS card expiry calendar by region
- CHAS pass/fail patterns by sector

**Viral hook:** *"Free CHAS Elite gap analysis — get your probability-of-pass score in 5 minutes"*.

---

### 🥉 3. councilof.ai — AI governance for SMB + UK public sector

| | |
|---|---|
| **Underlying MCPs** | 6 governance (eu-ai-act, dora, nis2, cra, ai-bom, bias-detection) + dora-nis2-crosswalk |
| **TAM** | ~28,000 UK firms in scope of EU AI Act Art 50 or NIS2 |
| **SAM** | ~3,500 (mid-market tech + regulated SMB + UK public-sector LRAs) |
| **Pain $$$/yr** | £20-80k (Big-4 advisory £40k+ point-in-time + £30k ongoing register-of-info) |
| **Existing competitors** | Vanta ($8-30k/yr), Drata ($7.5-15k), OneTrust ($25k+), Holistic AI |
| **Why we win** | **UK SMB underserved** — Vanta/Drata are US-priced + US-centric, OneTrust enterprise-only |
| **Pricing target** | £29 (Starter, already live) → £79 (Pro, already live) → £499 (Defence, already live) |
| **Y1 ARR realistic** | **£60-120k** (already partial infrastructure — fastest to revenue) |
| **Distribution channel** | Show HN + LinkedIn thought-leadership + NLnet/Innovate UK grant credibility |

**Product spec (already 60% built):**

1. ✅ Stripe products live (£29 / £79 / £499) — DONE
2. ✅ /thanks post-purchase flow — DONE
3. ✅ 14-day free trial + FREE14 coupon — DONE
4. ⏳ **Dashboard SaaS frontend** (the missing piece): login → MCP-call counter → signed-cert history → CTAs to bundles
5. ⏳ **Free Article 50 scorecard** (already at meok.ai/scorecard — needs more distribution + email-capture redirect)
6. ⏳ **Cross-tenant compliance benchmarking**: "your bias rate vs industry average" — only viable once you have 50+ customers

**Data moat:**

- Cross-tenant AI-incident taxonomy (anonymised)
- Register-of-info templates by sector — get better with each customer use
- Bias-test benchmark library

**Viral hook:** Free EU AI Act Article 50 readiness scorecard.

---

### 4. muckaway.ai — UK skip-hire / waste-transport

| | |
|---|---|
| **Underlying MCP** | `skip-hire-ai-mcp` |
| **TAM** | ~3,800 active UK skip-hire operators |
| **SAM** | ~1,400 (3+ vehicles, post-DRS reform, digital-willing) |
| **Pain $$$/yr** | £8-22k (EA penalty £4-12k + ~20hr/wk transfer-note admin = £18k labour) |
| **Existing competitors** | Skip-IT (£89/mo, legacy desktop), WasteLogics (£150-400/mo), AMCS (£600+ enterprise) |
| **Pricing target** | £49/mo blended |
| **Y1 ARR realistic** | **£40-70k** (60-110 paid seats by month 12) |

**Product spec:**

1. **Free EA Audit-Readiness Score** (paste licence number → red/amber/green + missing transfer notes count)
2. **Transfer note PDF generator** (£49/mo): postcode + waste codes → compliant PDF with auto-EWC codes
3. **Customer quote-and-book form** (£49/mo upsell): white-label embed for operator's own website
4. **EA renewal calendar** (£49/mo): never miss a Waste Carrier Licence renewal

**Data moat:**

- EA carrier-licence renewal dates (multi-tenant calendar)
- Postcode-level transfer note volumes (lead-gen gold — sell back to operators by region)
- Per-EWC-code rejection rates (which waste types cause most EA bounces)

**Viral hook:** *"Free EA Audit-Readiness Score"*.

---

### 5. grabhire.ai — **Do NOT build standalone**

Narrow market (1,100 operators, mostly inside skip firms). **Sell as £19/mo add-on to muckaway.ai** instead.

- Tip-site queue tracker (real-time, crowd-sourced) = viral hook only
- Route optimisation for grab fleets = add-on

Don't waste a separate brand. The grabhire.ai domain is best used as a **subdomain redirect to muckaway.ai/grab-hire** once muckaway has traction.

---

## Shared architecture — build ONCE, deploy 5×

This is the leverage. All 5 verticals share the same backend pattern:

```
┌─────────────────────────────────────────────────────────────────────┐
│  vertical.ai (frontend)                                              │
│  ─ Next.js 16 (matches meok/ui pattern)                             │
│  ─ Tailwind + brand-kit-v1 tokens (one design system, 5 themes)     │
│  ─ Clerk auth (already in meok middleware)                          │
│  ─ Stripe Checkout (per-vertical products in same MEOK AI LTD)      │
│  ─ /api/scorecard (free lead-magnet) ← email captured to Buttondown │
│  ─ /api/dashboard (paid, after Clerk auth)                          │
└─────────────────────────────────────────────────────────────────────┘
              │ HTTPS (shared meok-attestation-api)
              ▼
┌─────────────────────────────────────────────────────────────────────┐
│  Shared backend: meok-attestation-api.vercel.app                     │
│  ─ HMAC signing (already live)                                      │
│  ─ /provision (email + session_id → API key)                        │
│  ─ /webhook (Stripe → welcome email via Resend)                     │
│  ─ NEW: per-tenant data tables (one Postgres, schema per vertical)  │
└─────────────────────────────────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────────────────────┐
│  Data layer (Postgres on Supabase or Neon — free tier viable)        │
│  ─ tenants table (Clerk user_id → vertical)                          │
│  ─ haulage_fleet (vehicle_reg, mot_date, tacho_uploads)              │
│  ─ planthire_assets (asset_id, loler_due, cpcs_holders)              │
│  ─ skip_licences (carrier_no, renewal_date, transfer_notes[])        │
│  ─ ai_act_assessments (org, system_name, risk_tier, last_attested)   │
│  ─ All audit-logged + HMAC-anchored via meok-attestation-api         │
└─────────────────────────────────────────────────────────────────────┘
```

**What this means in practice:**

1. **One Stripe account, 5 products per vertical, ~25 products total**
2. **One Clerk org, 5 sign-up flows, 5 dashboards**
3. **One meok-attestation-api with 5 vertical-scoped data schemas**
4. **One Postgres instance — Supabase £25/mo handles all 5 to 500 customers each**

**Build effort estimate (shared infra first, then per-vertical):**
- Shared infra (auth + DB + admin shell): **2 weeks**
- Each vertical frontend + dashboard: **1.5 weeks per vertical**
- Total to 5 launched: **~3 months** part-time / **6 weeks** full-time

---

## The 90-day roadmap

### Phase 1 — Foundation (Weeks 1-2)

Build the shared infrastructure:

- [ ] Set up Supabase / Neon Postgres (£25/mo)
- [ ] Add Clerk to meok-attestation-api (extends existing webhook auth)
- [ ] Create `vertical-saas-template` — Next.js + Clerk + Stripe + brand-kit-v1 + dashboard shell
- [ ] Deploy template to `template.meok.ai` as proof-of-pattern
- [ ] Wire post-purchase email Day 0/3/10 sequence (extend the welcome-email work)

### Phase 2 — haulage.app launch (Weeks 3-4)

The highest-ARR vertical first:

- [ ] Free **DVSA Hot-Spot Map** at haulage.app/hotspots (viral hook + email capture)
- [ ] Login + dashboard: vehicle count, tacho upload, OCRS prediction
- [ ] Stripe products: £49 Starter / £199 Pro / £499 Defence
- [ ] Cold outreach to 200 RHA members (Smartlead campaign)
- [ ] First 5-10 paid customers = ~£500-2k MRR

### Phase 3 — planthire.ai launch (Weeks 5-6)

- [ ] Free **CHAS Elite Gap Analysis** at planthire.ai/scorecard
- [ ] Dashboard: per-asset LOLER calendar + CPCS expiry alerts
- [ ] Stripe products: £79 / £199 / £499
- [ ] Partnership outreach to HAE / CPA / Executive Hire Show

### Phase 4 — councilof.ai full SaaS (Weeks 7-9)

- [ ] Frontend dashboard SaaS (the missing piece — most of stripe + thanks already wired)
- [ ] Free Article 50 scorecard tied to email capture
- [ ] Cross-tenant compliance benchmarking once 50+ customers

### Phase 5 — muckaway.ai launch (Weeks 10-12)

- [ ] Free **EA Audit-Readiness Score** at muckaway.ai/score
- [ ] Quote-form + transfer-note PDF generator
- [ ] Google Ads on "[postcode] skip hire prices" (£500/mo test budget)
- [ ] grabhire.ai becomes the /grab-hire upsell page

---

## Data moats — the deep play

After 12 months, here's what you OWN that nobody else has:

| Dataset | Why it's a moat | Estimated value |
|---|---|---|
| **DVSA roadside encounter heatmap** | Aggregated from haulage.app tacho uploads. No competitor has multi-tenant tacho data + geocoding. Used to predict OCRS score deterioration. | £100-300k acquisition premium (Microlise, FleetCheck would pay for this) |
| **Plant-hire CHAS Elite pass/fail patterns** | Per-sector CHAS scoring data — which industries pass first time, which fail, what red-flag answers correlate with rejection. | £50-150k (HAE or CHAS itself would buy this) |
| **EU AI Act register-of-info corpus** | Anonymised templates by sector. After 100 customers, you have the canonical "what does a NIS2 register actually look like for a UK fintech" dataset. | £200-500k (Vanta/Drata/OneTrust would pay for this to bootstrap UK datasets) |
| **EA waste-carrier risk scoring by EWC code** | Which waste codes most frequently trigger audits. Lead-gen value to operators. | £30-80k (Veolia / Biffa would licence this) |
| **Cross-vertical compliance taxonomy** | Mapping DORA Art 28 → NIS2 Art 23 → EU AI Act Annex IV. The crosswalk gets refined every time a customer reports an incident. | Strategic moat — hard to value, but enables £499/mo Defence tier pricing |

**Combined data-asset value at month 12: ~£500-1,200k.** That's on top of the £240-435k Y1 ARR. Total enterprise value at month 12: **~£2-5M conservatively**.

---

## Concrete action this week

1. **Pick the FIRST vertical to build** — I recommend haulage.app (highest ARR, clearest pain, biggest data moat).
2. **Set up shared Postgres** (Supabase free tier, 10 min): https://supabase.com/dashboard → New Project
3. **Clone the meok/ui slug page pattern** as the haulage.app dashboard scaffolding (~1 hr by me when usage resets)
4. **Buy `haulage.app` hosting on Vercel** + assign DNS (Namecheap → Custom DNS → Vercel nameservers)
5. **Start collecting the DVSA hot-spot data NOW** — even from public sources before any customer exists. By the time the first customer signs up you have 6 months of head-start data.

---

## Honest verdict

**Don't try to build all 5 in parallel.** Build haulage.app well, get to £5-10k MRR, then planthire.ai. Each successful vertical:
- Proves the shared-infra pattern works
- Generates cash to fund the next launch
- Adds to the cross-tenant data moat
- Increases overall portfolio acquisition value

**One vertical at £5k MRR > five verticals at £0.**

The infrastructure work in weeks 1-2 is the unlock. After that, each new vertical is a 1.5-week build because you've already solved auth, billing, signing, webhooks, and the design system.

— Claude (Sonnet), 2026-05-16
