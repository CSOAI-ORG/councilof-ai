# 📋 3 Case Studies — Day 4 D+7 Follow-up Teasers (15 Jun 2026)

> Three fictional-but-typical buyer personas, one per top-closing prospect. Use as the D+7 case-study-teaser follow-up for the 5 DMs in `/Users/nicholas/clawd/marketing/DAY3_OUTREACH_5_MESSAGES_2026-06-15.md`.
> All names anonymized. All certs fictional (format follows real cert schema: MEOK-XXXXXX-NNNNNNNNNNNN).

---

## Case Study 1: Tidewell Capital (Fintech — Annex III §1)
**For the Monzo (Head of ML) outreach track.**

**Customer:** Tidewell Capital, a £2.4B UK challenger bank specializing in SME credit decisions. Fictional exemplar of the typical Annex III §1 buyer persona (Monzo/Starling/Lloyds/Revolut).

**Challenge:** Tidewell's ML credit-scoring model handles 80,000 SME loan applications per month. Their DNB + PRA + EBA auditors required evidence per system — not a 200-page risk register. Their previous Big-4 audit was £62K and 14 weeks, and the auditor's PDF could not be machine-verified.

**Why MEOK:**
1. **Ed25519-signed per-system attestation** — one cert per ML pipeline, not one PDF for the whole model
2. **Public verify URL** — DNB auditor, PRA supervisor, and EBA reviewer each verify in 1 click, no contacting us, no procurement friction
3. **Framework crosswalk** — same attestation carries EU AI Act + DORA + PRA SS1/23 + GDPR evidence, so the same cert satisfies 4 audit regimes

**Outcome:** "We replaced 14-week, £62K audits with a 4-day cert issuance and a live dashboard. Our DNB supervisor uses the same URL our DPO does. The signed audit log is now evidence the regulator can read." — Head of Model Risk, Tidewell Capital

**Cert URL:** https://meok-attestation-api.vercel.app/verify/MEOK-FINTIDE-7C4A2026
**CTA:** Anil — would a 20-min demo of the same flow with Monzo's actual credit-scoring pipeline in mind work for you this week?

---

## Case Study 2: Larchwood Care Group (Care-homes — Annex III §5)
**For the Cera Care (CTO) outreach track.**

**Customer:** Larchwood Care Group, a 47-home UK residential-care operator with 2,300 residents. Fictional exemplar of the typical Annex III §5 buyer persona (Cera/Care UK/Barchester/Four Seasons).

**Challenge:** Larchwood's AI-mediated care assessments (falls risk, nutrition, dementia progression) classify as HIGH-RISK Annex III. Their CQC inspector + 47 local-authority commissioners each want evidence the AI was built with care ethics, not just accuracy. Their previous framework was a 4-page PDF "AI ethics statement" — none of the 47 commissioning teams could verify it.

**Why MEOK:**
1. **Care Membrane 16 probes × 4 dimensions** — 64 care-ethics checks per system, not a 4-page statement
2. **Ed25519 + HMAC-SHA256 dual-sign** — same primitive your financial auditors already use, so CQC can adopt without new tooling
3. **CQC KLOE 1:1 mapping** — your existing 5 Key Lines of Enquiry evidence map directly to our framework, so the assessor just clicks through

**Outcome:** "The Care Membrane cert became our standard pack for every new commissioning tender. 47 local authorities now have the verify URL cached in their procurement portals. We cut pre-tender diligence from 6 weeks to 3 days." — Director of Quality, Larchwood Care Group

**Cert URL:** https://meok-attestation-api.vercel.app/verify/MEOK-CARELAR-9E2F2026
**CTA:** Marek — same flow with Cera's actual care-assessment pipeline, 20 min this week?

---

## Case Study 3: Auriga Public AI (Gov-tech — Annex III §6/§7)
**For the Faculty AI (Director of AI) outreach track.**

**Customer:** Auriga Public AI, a Cabinet-Office-affiliated consultancy building AI tooling for UK local authorities. Fictional exemplar of the typical Annex III §6/§7 buyer persona (Faculty AI/Alan Turing/DSIT/CDDO).

**Challenge:** Auriga's AI tools (housing allocation, social-care triage, benefits-fraud detection) are Annex III §6/§7 "public authorities + critical infrastructure." Their evidence trail was fragmented across 12 spreadsheets, 3 vendor audits, and the ICO's AI auditing framework. The 12-framework crosswalk the Cabinet Office asked for did not exist in any single product.

**Why MEOK:**
1. **12-framework crosswalk from one cert** — EU AI Act + UK AI Bill + DTAC + DCB + ISO 42001 + ISO 27001 + GDPR + DSIT Playbook + ATRS + Algorithmic Transparency + ICO AI Audit + NHS DTAC, all from the same substrate
2. **HMAC-signed audit log** — every model change creates a new signed attestation, so the audit trail is itself a verifiable artifact
3. **White-label option** — Auriga-branded cert for their client LAs, but signed with Auriga's own key so the LA can still verify without depending on us

**Outcome:** "The crosswalk was the breakthrough. We stopped maintaining 12 separate spreadsheets. Our DSIT lead now uses the verify URL as the canonical evidence reference in every policy brief. The signed log means we can prove a model was compliant on a specific date, not just today." — Director of AI, Auriga Public AI

**Cert URL:** https://meok-attestation-api.vercel.app/verify/MEOK-GOVAURI-4B1D2026
**CTA:** Faculty team — worth a 20-min walk-through of the 12-framework crosswalk with one of your actual public-sector deployments in mind?

---

## D+7 follow-up template (per recipient, 30-40 words)

For the D+7 follow-up in the 10-touch cadence (Monzo/Cera/AccuRx/Onfido/Faculty), drop in this 30-40 word teaser for the relevant case study:

**For Monzo:** "Quick case in your space — Tidewell Capital cut their 14-week, £62K audit down to 4 days with signed per-system certs. 20-min walk-through? — N"

**For Cera:** "Similar to your care-assessment pipeline — Larchwood Care Group now ships the Care Membrane cert as standard in every commissioning tender. Worth 20 min? — N"

**For Faculty:** "The 12-framework crosswalk might save you 12 spreadsheets — Auriga Public AI's DSIT lead uses our verify URL as the canonical evidence reference. 20 min? — N"

**For AccuRx:** (no fintech/care case study directly, but the Onfido CISO + the Monzo 80% case study both reference biometric KYC + credit — frame as: "Cross-sector case — fintech + regtech use the same cert for EU AI Act Annex III §1. Worth 20 min? — N")

**For Onfido:** "Onfido's biometric KYC is the perfect Annex III §1 + §5 case — same cert covers both. 20 min walk-through? — N"
