# MEOK AI Labs — Pre-Seed / EIS Angel Deck

**CSOAI LTD (t/a MEOK AI Labs) · Companies House #16939677 · Sole founder: Nicholas Templeman**
**Raise: £100K–£300K SAFE · £1–2M cap · EIS-eligible (subject to HMRC Advance Assurance)**
**Built 2026-06-06. Every claim is DD-survivable. Numbers checked live. Pre-revenue, stated up front.**

> **How to read this deck:** This raise is the deliberate opposite of the startups that raised on lies. The product is cryptographic proof-of-compliance; we pitch the same way. Where there's a gap (MRR £0), it's on the slide, not buried. A skeptic can verify every number in `DATA_ROOM/`.

---

## Slide 1 — Problem

**AI regulation just became un-ignorable, and there is no honest, machine-checkable way to prove you comply.**

- The EU AI Act carries penalties up to **€35M or 7% of global turnover** — the largest fines in tech regulation, larger than GDPR.
- Compliance today is **documents and consultants**: PDFs, spreadsheets, and £800–£2,500/yr human auditors producing claims no one can independently verify.
- The result is **compliance theatre** — and a wave of vendors selling trust they can't prove. (The founder built this company *because* he watched startups raise and sell on exactly that kind of un-backed claim.)

**The gap:** there is no widely-adopted way to produce a *cryptographically verifiable* artifact that a specific AI/compliance control was actually met — checkable by a regulator, a customer, or an investor without trusting the vendor.

---

## Slide 2 — Why now

**Two hard deadlines turn "compliance" from optional into a fixed-date purchase.**

1. **EU AI Act is live and biting.** Phased obligations through 2025–2027; penalties up to **€35M / 7% turnover**. Every AI-touching company in or selling into the EU now has a deadline-driven compliance need.
2. **Aquaculture has a harder, sooner, narrower deadline (our wedge):**
   - **ASC Farm Standard v1.0.1** — effective 1 Aug 2025, **mandatory 1 May 2027** (a 2-year transition = a selling calendar). [source: RESEARCH_AQUACULTURE §5, SURE]
   - **RSPCA Assured rainbow trout — 177 new standards in force since 23 Jul 2025** (mandatory slaughter-CCTV, ban on asphyxiation/CO₂ narcosis). [SURE]
   - Major retailers moving to 100% ASC sourcing (e.g. Co-op by 2027).

**Why this is the moment:** regulation has set the clock. Demand isn't a guess about behaviour change — it's a legal requirement with a date on it.

---

## Slide 3 — Solution

**MEOK turns regulations into runnable tools that emit signed, verifiable proof of compliance.**

- We convert the EU AI Act, DORA, NIS2, the CRA, ISO 42001 and ~12 other frameworks into **MCP servers** — compliance logic any AI agent (Claude, Cursor, Windsurf) can call directly.
- Each tool can issue a **HMAC-signed attestation**: a tamper-evident artifact proving a specific control was met, that **anyone can verify without trusting us**.
- The same engine powers vertical packs (starting with aquaculture) where a sector has its own hard deadline.

**The one-liner:** *proof over claims.* In a market full of un-backed assurances, MEOK ships the un-fakeable one.

---

## Slide 4 — Product (live + verifiable)

**This is not a mockup. You can run it today.**

| What | Proof you can check right now |
|---|---|
| **271 MCP servers published on PyPI** (of 316 built) | `pip install eu-ai-act-compliance-mcp` (v1.8.2), `dora-compliance-mcp` (v1.4.3), `nis2-compliance-mcp` (v1.3.1), `iso-42001-ai-mcp` (v1.1.3) — all verified live 2026-06-06 |
| **Live attestation chain** (sign / verify / provision / webhook) | meok-attestation-api.vercel.app → HTTP 200; `meok-attestation-verify` v1.0.3 on PyPI |
| **Aquaculture suite, live on Stripe** | 5 products £29–£999/mo on acct_1TLlEKQvIueK5Xpb (RSPCA £499, UK-FHI £79, Aquaponics £29/79, ASC×RSPCA crosswalk £999, LAIA £29) |
| **MEOK platform** | meok.ai (live) |

*(Note for the diligent: the published package names are `<topic>-compliance-mcp`, not `meok-*`. The `meok-*` names 404 — we tell you so you don't hit a dead end.)*

**Honest status note:** our agentic OS, **SOV3** (a novel care-membrane architecture — 110 tools, 6 trained neural nets), is genuinely differentiated R&D but is **currently down on an environment issue** and is **not** part of this raise's revenue story. We don't demo what isn't working.

---

## Slide 5 — Moat

**Three layers a competitor cannot copy in a weekend.**

1. **~18 months of regulatory crosswalk IP (the deepest moat).** Hand-mapped correspondences: EU AI Act ↔ NIST ↔ ISO 42001 ↔ DORA ↔ NIS2 ↔ CRA + ~12 frameworks. Estimated **12–18 months for a competitor to replicate** — the single hardest asset to copy. *(verify: `csoai-docs/`, the crosswalk MCPs)*
2. **The HMAC attestation chain (the un-fakeable artifact).** A live, signed proof-of-compliance mechanism — a *patentable process* (patent: intend-to-file, not yet filed — stated honestly). This is the structural differentiator vs. every closed-source, claim-based incumbent.
3. **Distribution breadth: 271 live, installable MCPs** across compliance + five verticals, in the agent ecosystem (Claude/Cursor/Windsurf) where buyers already work.

**What the moat is NOT:** it is not GitHub repo count (422 repos is IP depth, not adoption) and it is not network effects yet. It is *domain IP + a verifiable mechanism + breadth of live coverage.*

---

## Slide 6 — Market / TAM

**Lead with the small, sourced, reachable number — not an inflated headline.**

- **Top-down context:** the global AI-governance / compliance-software market is large and growing fast on the back of the EU AI Act. *(We deliberately do not put a fabricated headline £-figure here — the data room cites named analyst figures; a giant TAM behind £0 revenue is the fake move.)*
- **Bottom-up beachhead (the honest number we underwrite):**
  - **~290 UK trout farms**; **~83 ASC-certified UK sites** [RESEARCH_AQUACULTURE, SURE].
  - Each pays **£800–£2,500/yr** to human compliance consultants today [SURE] — a services-replacement pool with **no SaaS incumbent**.
  - Beachhead SAM (trout + ornamental/koi retail under LAIA) ≈ **low-£-millions/yr**, deadline-driven and uncontested.
- **Expansion path:** salmon (larger sites, higher ACV) → the EU AI Act compliance core (the €35M-fine driver, a far larger market) once the wedge proves the motion.

**Estimates are marked as estimates.** We'd rather show a defensible £-millions SOM than an indefensible £-billions TAM.

---

## Slide 7 — Traction (HONEST)

**The headline first, because a diligence call will find it in five minutes:**

> **MRR: £0. Paying customers: 0.**

What that £0 sits on top of — which is the actual investable substance:
- **Distribution is live, not planned:** 271 MCPs installable on PyPI; attestation API live (HTTP 200); 5 aquaculture products live on Stripe and able to take payment **today**.
- **Demand is validated by law, not by a survey:** the ASC May-2027 mandate + RSPCA trout standards mean our beachhead customers *must* solve this on a fixed date.
- **Built by one person:** the entire estate (271 packages, live API, 5 verticals) is one founder's verifiable git history.
- **GitHub: 422 repos, max 2 stars** — we count this as IP depth, *not* adoption, and never as traction.

**The honest ask of the investor:** don't underwrite revenue that isn't here. Underwrite the **conversion** of a live, deadline-driven product into its first paying logos — the exact gap this round funds. (The first LOI/paid pilot is the milestone that re-rates everything — slide 12.)

---

## Slide 8 — Business model

**A clear £29–£999/month ladder, recurring, with a deadline pulling buyers up it.**

| Tier | £/mo | Buyer | Live example |
|---|---|---|---|
| Entry / Hobby | **£29** | small operator, ornamental/koi retailer (LAIA) | LAIA Aquatic, Aquaponics Hobby |
| Mass | **£79** | working farm needing core compliance (UK-FHI) | UK FHI |
| Pro / moat | **£499** | RSPCA-Assured-exposed trout/salmon farm | RSPCA Aquaculture |
| Enterprise / flagship | **£999** | retail-supply-chain crosswalk (ASC×RSPCA×GG.A.P) | ASC×RSPCA crosswalk |

- **Recurring SaaS**, billed monthly or annually (annual = ~2 months free), live on Stripe now.
- **Same ladder structure** carries across to the compliance core (EU AI Act, DORA, NIS2) — the aquaculture tiers are the template, not a one-off.
- **Unit economics (target, marked as target):** software margins; the cost we displace is a £800–£2,500/yr human consultant, so even the £499 tier undercuts the incumbent spend while being always-on.

---

## Slide 9 — Go-to-market

**Aquaculture wedge → compliance core. Narrow, deadline-driven, then broaden.**

1. **Wedge (now):** UK aquaculture. Chosen because it has (a) a *hard* deadline (ASC 1 May 2027), (b) **no SaaS incumbent**, and (c) a founder who **operates a fish farm** — instant domain credibility selling to farmers.
   - Motion: direct outreach to ASC-deadline-exposed farms + retailers; sector partnerships (Stirling, OATA, CEFAS, BTA — templates drafted); the £499 RSPCA tier as the deadline-anchored hook.
2. **Land the first 5–10 paying logos**, prove the deadline-driven conversion, generate signed-attestation case studies.
3. **Broaden to the compliance core:** the same machine-runnable + attestation model applied to the EU AI Act / DORA / NIS2 market (the €35M-fine driver) — a much larger pool, entered with proof in hand rather than a cold pitch.

**Why wedge-first beats horizontal-first:** a narrow market with a legal deadline and no competitor is the highest-probability path to the first real revenue, which is the thing that unlocks every later stage.

---

## Slide 10 — Team

**One founder — said plainly — who has both the domain expertise and the proven ability to build and run.**

- **Nicholas Templeman, sole founder, 100% owner.**
- **Operator, not just a builder:** runs **Templeman Opticians** (real trading optical business, ~£2.5–5K/mo) and a **6.5-acre fish farm** (the aquaculture testbed). Real customers, real cashflow, real sector knowledge.
- **Domain expertise maps to the verticals:** optometry → health/optical; fish-farm operator → the aquaculture wedge. He is selling compliance into a sector he personally operates in.
- **Build velocity is the standout signal:** the entire estate — **271 PyPI packages, a live attestation API, 5 verticals** — is one person's verifiable git history.

**The sole-founder risk, named honestly:** single founder = single point of failure. Mitigants: (a) the build record proves solo execution capacity; (b) real operating businesses prove he can run a company; (c) **this round funds the first hire** (CTO or GTM) + onboarding a compliance and an aquaculture advisor. We present this as a risk-with-a-plan, not a non-issue.

---

## Slide 11 — The Ask

**£100K–£300K on a SAFE at a £1–2M cap. EIS-eligible.**

- **Instrument:** SAFE (or ASA), converting at the next priced round, **£1–2M valuation cap**. Per the staircase (`revenue/IPO_VALUATION_PATH_2026-05-28.md`), this is the realistic pre-seed range for a pre-revenue, IP-rich, sole-founder company with live distribution and a deadline-driven wedge.
- **EIS-eligible** (pursuing **SEIS first** where the early-stage limits allow, then EIS): UK angels get **30% income-tax relief** + CGT reliefs, **subject to HMRC Advance Assurance** (in progress — `DATA_ROOM/01_corporate/01.8`) and the investor's own circumstances. *We state the rules; we never guarantee the relief.*
- **Why this number, honestly:** we are **not** putting a big valuation on £0 revenue — that's the move this whole raise rejects. We price for conviction on the founder + IP + wedge, and let real customers (slide 12 milestones) re-rate the next round.

**What we're explicitly NOT doing:** no inflated MRR, no fabricated pipeline, no "Series A in disguise" valuation. The cap reflects the honest stage.

---

## Slide 12 — Use of funds + milestones

**18 months of runway to convert live distribution into proven revenue and remove every DD red flag.**

**Use of funds (£100–300K, indicative split — refined with the lead):**
- **~45% — first hire (CTO or GTM)** — directly de-risks the sole-founder concern (slide 10).
- **~25% — aquaculture GTM** — outreach, sector partnerships, pilots; convert the deadline into logos.
- **~15% — IP + corporate hygiene** — IP assignment deed (£500), trademarks (~£1.5K), patent draft on the attestation process (£5–15K), audited accounts, Cyber Essentials. *Closes the DD gaps named in the data room.*
- **~15% — product + reliability** — fix/harden SOV3, the MCP index, uptime monitoring.

**Milestones this round buys (each one re-rates the company):**
| By | Milestone | Why it matters |
|---|---|---|
| Month 1–2 | IP assignment deed signed; business bank account; EIS Advance Assurance filed | Removes the #1 DD red flag + unlocks the tax relief |
| Month 3 | **First paying customer** (aquaculture, deadline-driven) | Re-rates from "GitHub estate" to "revenue business" |
| Month 6 | **5–10 paying logos**, first signed-attestation case studies | Proves the conversion motion; seeds the next round |
| Month 6 | First hire onboarded; SOV3 back up; live demo end-to-end | De-risks single-point-of-failure + product story |
| Month 12 | ~£5–10K MRR (target, marked as target) | The seed-stage trigger on the staircase |
| Month 12–18 | EU AI Act compliance core launched off the proven wedge | Opens the much larger market with proof in hand |

**The compounding logic:** the first £499 paying farm funds the credibility that closes the next ten, which proves the motion that opens the €35M-fine market. Every milestone is provable — which is the whole point.

---

*Sources: `_alignment/SWEAT_EQUITY_AND_DATAROOM_2026-06-02.md`, `_alignment/ALIGNMENT_2026-06-02.md`, `_alignment/RESEARCH_AQUACULTURE_2026-06-02.md`, `revenue/IPO_VALUATION_PATH_2026-05-28.md`, `revenue/AQUACULTURE_LIVE_LAUNCH_STATE.md`. PyPI versions + live endpoints verified 2026-06-06. Re-issue when MRR, first customer, or SOV3 status changes.*
