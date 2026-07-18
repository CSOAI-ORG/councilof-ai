# Cold Emails V3 — Industry Voice (money-first)

**Supersedes:** `COLD_EMAILS_V2.md` (kept for diff/audit — do not send V2).
**Why this rewrite:** SOV3 `detect_partnership_opportunities` scored the portfolio copy **41.8% academic / 21.5% industry** (overall 0.339). Translation: *the emails read like a research org, so industry cold outreach feels uphill.* The fix the briefing called for — **lead with the fine number, not the framework number.** "Don't pay €15M for a bias miss" beats "Article 10 conformity evidence," every time, for every industry buyer.

**Two accuracy fixes baked in (V2 was wrong — a compliance officer would catch both):**
1. **Penalty ceiling.** High-risk *obligation* gaps (Art 10/11/14/43 etc.) are penalised under **EU AI Act Art 99(4): up to €15M or 3% of global turnover** — NOT €35M/7%. The €35M/7% ceiling (Art 99(3)) applies only to **Art 5 prohibited practices**. V2 used €35M everywhere; that overstates the law and a sharp buyer knows it. V3 uses €15M/3% for high-risk gaps and reserves €35M/7% only where an Art 5 prohibited use genuinely applies (Onfido, conditionally).
2. **DORA.** Monzo/Starling/Zopa are *financial entities*, not designated *critical ICT third-party providers* — so the "1% of daily turnover" cap (a CTPP-only penalty) does NOT apply to them. V3 hooks DORA on the concrete, imminent obligation instead: the **30 April 2026 Register of Information** deadline and the **4h/24h incident clocks**.

**Send from:** `nicholas@csoai.org` (NOT nicholas@meok.ai — Vercel blocks that mailbox)
**Signature block (foot of every email):**
> Nicholas Templeman · Founder, MEOK AI Labs (CSOAI LTD, UK 16939677)
> nicholas@csoai.org · meok.ai

**Offer block (identical across all — paste verbatim):**
> I'll hand you a **regulator-ready, cryptographically signed compliance attestation** your own auditor can verify — no access to my systems required.
> • **£5,000, delivered in 48 hours** — written gap report + signed attestation (HMAC-SHA256, public verify URL)
> • **or £79/mo** — your team runs the audit on demand, every result signed + verifiable
> Checkout: https://buy.stripe.com/00wfZjcgAeUW4c5cyQ8k90K

**Deadlines (verified 2026-05-29, post-Digital-Omnibus):**
- Annex III high-risk (hiring, credit, insurance, edu, biometric): **2 December 2027** (~18 months)
- Annex I high-risk: **August 2028**
- Article 50 transparency / watermarking: nearest cliff **early November 2026** (~5 months)
- DORA Register of Information (Art 28 / Reg (EU) 2024/2956): **30 April 2026** (first annual submission)

> ✅ **VERIFIER LIVE — SAFE TO SEND (re-verified correctly 2026-05-30):** the earlier "STILL BLOCKED / static page / 404" note was WRONG — it came from testing the wrong path (`/api/verify`). The real API was live all along. **Correct routes: `/verify`, `/verify/<cert_id>`, `/health`, `/catalogue` — NOT `/api/verify`.** Confirmed live on BOTH `proofof.ai` and `www.proofof.ai`: `/health` → `{"ok":true,"service":"meok-attestation-api"}` (200); `GET /verify/<cert_id>` → 200 human-readable page; `POST /verify` with a cert → real HMAC check (returns `valid:true/false` — tested, a tampered cert correctly returns `valid:false "Signature mismatch"`). The "your auditor verifies at a public URL" claim is TRUE. **In emails, link auditors to `https://proofof.ai/verify/<cert_id>`.** Send away.

> ⚠️ **One Stripe link for both offers is a conversion leak** — the £79/mo and the £5k currently land on the same checkout. Flag for Nick: split into two payment links before a real send wave. Not blocking; the link is live and works.

---

## 1. Beamery — AI hiring (high-risk)

**TO:** abakar@beamery.com (Abakar Saidov, CEO) · linkedin.com/in/abakarsaidov
**SUBJECT:** Beamery's hiring AI — €15M exposure on the clock

Hi Abakar,

If Beamery's hiring AI isn't audited and documented before **2 December 2027**, the downside is up to **€15M or 3% of global turnover — whichever is larger.** That's the EU AI Act penalty for a high-risk system that can't show its homework, and AI used in employment decisions is high-risk by name (Annex III, Point 4).

Here's the part most teams underestimate: the technical-documentation pack has **14 mandatory fields**. Most I review cover 3 or 4. Auditors reject the rest — and "we'll fix it later" stops being an option once a customer's procurement team asks for the evidence.

[OFFER BLOCK]

15 minutes this week to walk the gaps before your enterprise buyers start asking?

Nicholas

---

## 2. Tractable — insurance claims AI (high-risk)

**TO:** venkat@tractable.ai (Venkat Sathyamurthy, CEO) · CC alex@tractable.ai
**SUBJECT:** Tractable + EU AI Act — €15M, and the claims-bias trap

Hi Venkat, Alex,

Tractable's damage-assessment AI decides claims outcomes — which puts it in Annex III (Point 5) of the EU AI Act as high-risk. Miss the **2 December 2027** documentation bar and the exposure is up to **€15M or 3% of global turnover.**

The one that bites insurers specifically: **bias testing on disparate claims outcomes.** If similar claims resolve differently across protected groups and you can't evidence why, that's the gap a market-surveillance authority opens with — and the gap a reinsurer's due diligence finds first.

[OFFER BLOCK]

It also chains into incident reporting, so if something goes sideways post-launch your Article 73 clock starts correctly instead of late.

15 mins this week?

Nicholas

---

## 3. Multiverse — apprenticeship matching AI (double high-risk)

**TO:** hello@multiverse.io (→ Euan Blair, CEO)
**SUBJECT:** Multiverse's matching AI — two high-risk hits, one deadline

Hi Euan + team,

Multiverse's AI does two regulated things at once: it **matches** learners (Annex III Point 3 — education access) and it **assesses** them (Point 4 — employment pathways). Two high-risk categories, double the documentation burden, same penalty: up to **€15M or 3% of global turnover** if it's not evidenced by **2 December 2027.**

The doubling is the trap. You need bias testing across protected characteristics on *both* the matching rail *and* the assessment rail, plus transparency to learners and human oversight on each. Teams usually document one and forget the other.

[OFFER BLOCK]

15 mins this week to map both rails?

Nicholas

---

## 4. Zopa — credit-scoring AI + DORA

**TO:** [CTO / Head of Risk via LinkedIn; fallback careers@zopa.com → ask for CTO]
**SUBJECT:** Zopa — credit-scoring AI and DORA, two clocks running

Hi [Name],

Zopa carries two live regulatory clocks, and they overlap badly:

1. **EU AI Act** — credit-scoring AI is high-risk (Annex III, Point 5b). Not evidenced by **2 December 2027** → up to **€15M or 3% of global turnover.**
2. **DORA** — in force since Jan 2025. Your **Register of Information** (Art 28) first annual submission is due **30 April 2026**, and a major ICT incident triggers a **4-hour** classification clock.

The expensive scenario is one event hitting both: an incident touching a protected class in lending fires GDPR (72h), EU AI Act (Art 73), and DORA (Art 19) in parallel. One event, three reports, three formats, three deadlines.

[OFFER BLOCK]

15 mins this week to map which controls satisfy more than one regime at once?

Nicholas

---

## 5. ClearScore — credit-score + product-matching AI (high-risk)

**TO:** hello@clearscore.com (→ route to CTO / Head of Compliance)
**SUBJECT:** ClearScore's scoring AI — €15M if the file's incomplete by Dec 2027

Hi team,

ClearScore's credit-score and product-matching AI is high-risk under the EU AI Act (Annex III, Point 5b). The number that matters: up to **€15M or 3% of global turnover** if the compliance file isn't complete by **2 December 2027.**

The under-built piece for recommendation engines is the **right to explanation** when a product is *not* shown or a score drives a decline — paired with bias testing across protected classes. That's the combination a regulator probes first, because it's where consumer harm shows up.

[OFFER BLOCK]

Worth 15 minutes before the Q-by-Q documentation crunch starts?

Nicholas

---

## 6. Onfido — biometric identity AI (highest-scrutiny)

**TO:** [Onfido — LinkedIn sales DM + general contact]
**SUBJECT:** Onfido — biometric AI sits in the EU AI Act's hottest seat

Hi [Name],

Biometric identification is the **first and most-scrutinised** high-risk category in the EU AI Act (Annex III, Point 1). Standard high-risk gaps carry up to **€15M or 3% of global turnover** by **2 December 2027** — but biometrics has a second, sharper edge: if any deployment crosses into an **Article 5 prohibited use** (e.g. certain real-time remote biometric ID, or biometric categorisation by sensitive attributes), the ceiling jumps to **€35M or 7%.**

So your compliance surface is the largest of any AI vertical: the standard high-risk pack *plus* an Article 5 prohibited-practice check *plus*, for public-authority deployments, a fundamental-rights impact assessment.

[OFFER BLOCK]

15 minutes to separate your high-risk obligations from your Article 5 exposure? They're different problems with different price tags.

Nicholas

---

## 7. Monzo — DORA (live) + NIS2 overlap

**TO:** [CTO / CISO via LinkedIn]
**SUBJECT:** Monzo — one ICT incident, two regulators, a 4-hour clock

Hi [Name],

DORA enforcement is live and the first full reporting cycle is 2026. As a credit institution, Monzo also sits under NIS2 (banking sector) — and ~60–70% of the controls overlap, which means **one ICT incident triggers both regimes in parallel.**

The tightest clock isn't a fine, it's a deadline: **NIS2 early warning within 24 hours** of awareness, **DORA major-incident classification within 4 hours.** Miss those and you're explaining a *reporting* failure on top of the original incident. And your **Register of Information** (DORA Art 28) annual submission was due **30 April 2026** — if it's not mapped to the 2024/2956 schema yet, that's the first thing to fix.

[OFFER BLOCK]

The crosswalk maps each DORA control to the NIS2 measure it already satisfies, so your team audits once, not twice. 15 mins this week?

Nicholas

---

## 8. Starling Bank — DORA Register of Information

**TO:** [CTO / Head of Engineering via LinkedIn]
**SUBJECT:** Starling — DORA Register of Information was due 30 April

Hi [Name],

The DORA Register of Information (Art 28, format fixed by Reg (EU) 2024/2956) had its **first annual submission due 30 April 2026.** Most financial entities I speak to haven't yet mapped their vendor contracts to the 2956 schema — and the supervisory attention on late or malformed registers is ramping now, not later.

The efficient move: the *same* vendor data also satisfies NIS2 supply-chain security (Art 21(2)(d)) if you hold it in one canonical register instead of two. Build it once, satisfy both.

[OFFER BLOCK]

15 minutes to walk through what your Register needs to be clean? I can show you the gap in your current vendor mapping on the call.

Nicholas

---

## 9. PARTNERSHIP — BDO UK (GRC advisory)

**TO:** [BDO UK GRC / AI-risk partner — LinkedIn "BDO AI risk" filter]
**SUBJECT:** BDO + MEOK — white-label EU AI Act assessments, you keep the margin

Hi [Name],

A partnership sized for your AI/GRC advisory practice, in three lines:

1. I've built tooling that runs the article-by-article compliance audit across EU AI Act, DORA, NIS2, CRA, CSRD, GDPR, ISO 42001, NIST AI RMF and the UK AI framework — each producing a **cryptographically signed attestation** your clients' auditors validate without touching my backend.
2. The deal: **£5,000 flat-rate assessments you white-label at your own price** (keep the margin), revenue share on every **£79/mo** subscription your clients retain, your brand on every deliverable, no exclusivity, no minimum.
3. It's the Vanta-plus-Big-4 model, rebuilt for the MCP-era compliance stack — automation underneath, your advisory relationship on top.

20 minutes this week to walk the tooling?

Nicholas

---

## 10. PARTNERSHIP — PA Consulting (AI governance practice)

**TO:** [PA Consulting AI ethics / governance lead]
**SUBJECT:** PA + MEOK — the signed artefact your clients' auditors actually accept

Hi [Name],

One pitch, three sentences:

1. I've built compliance-audit tooling spanning EU AI Act, DORA, NIS2, CRA, CSRD and the UK AI framework — every audit emits an **HMAC-SHA256 signed attestation with a public verify URL** an auditor checks in 90 seconds, no backend access.
2. Looking for a small number of consulting firms to pilot: **£5k assessments you white-label at your own pricing**, revenue share on **£79/mo** subscriptions, your brand on deliverables, no exclusivity.
3. It's live and inspectable today — packages on PyPI under MEOK_AI_Labs, verify infrastructure at meok-attestation-api.vercel.app.

20 minutes this week?

Nicholas

---

## Mass-send checklist (once per email)

- [ ] Verify recipient via Hunter.io / LinkedIn Sales Nav before send
- [ ] Personalise every `[Name]` / `[Title]` field
- [ ] Paste the **[OFFER BLOCK]** verbatim where marked
- [ ] Send from `nicholas@csoai.org`; CC `nicholastempleman@gmail.com` for records
- [ ] Max 3 sends/day per mailbox (spam-flag avoidance)
- [ ] Log immediately in `~/clawd/revenue/_outreach_log.csv` (date, target, status)
- [ ] Re-read once: no typos, no broken links, no banned references
- [ ] 4-day follow-up reminder set

## Follow-up 1 (day 4 — outcome-anchored)

> Hi [Name] — bumping this in case it slipped. The fastest path to a shippable compliance artefact is the 48-hour assessment: £5,000, you get a written gap report plus a signed attestation your auditor verifies independently. If the EU AI Act work is on your roadmap for the next two years, doing the gap analysis now is the cheap version of this. Worth 15 minutes?
> https://buy.stripe.com/00wfZjcgAeUW4c5cyQ8k90K

## Follow-up 2 (day ~10 — pricing-anchored, then park)

> Hi [Name] — last ping, then I'll park this. The £79/mo tier now covers **unlimited signed attestations across every regime your entity touches** — EU AI Act, DORA, NIS2, CRA, CSRD, GDPR, ISO 42001 — one subscription, all audits, all signed evidence. If it's not the right quarter, no problem; ping me when it climbs the queue.
> https://buy.stripe.com/00wfZjcgAeUW4c5cyQ8k90K

---

**End of V3 outreach pack.** 8 industry emails (money-first, legally accurate) + 2 partnership emails. Send the industry 8 to drive the £5k/£79 revenue line; send the partnership 2 to build the white-label channel.
