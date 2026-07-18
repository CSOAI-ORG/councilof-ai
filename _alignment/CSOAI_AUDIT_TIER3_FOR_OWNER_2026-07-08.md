# 🔎 Tier-3 audit — fixed vs owner/M2 decisions · 2026-07-08

8 pages (Certification, Academy, PolicyGenerator, AgentGovernance, TrustCenter, Penalties,
Article50, ReadinessAssessment). Honesty-critical items fixed by M4 (PR #131); the below need
owner/backend decisions or subtle legal-mapping care. Raw: `..._TIER3_RAW_...json`.

## ✅ Fixed by M4 (build-verified, 0-error render)
- **Certification** (paid): score-lie ('N of 5 correct' was the *answered* count → real correctCount);
  quorum '67%' → '23 of 33'; 'certificate has been issued' → honest 'being processed'; frozen 60:00
  clock → real countdown + auto-submit.
- **Article50**: fabricated '2 Dec 2026' → real legacy-GPAI 2 Aug 2027 grace.
- **TrustCenter**: 'Certified' ISO 27001/42001/SOC-2 → 'In Progress' (see ⚠️ below).
- **Academy**: 'the law that governs you' → 'frameworks and law that apply to you'; Layer-0 → /layer0.
- **ReadinessAssessment**: EO 14110→M-25-21, UK 'AI Bill'→framework, Canada AIDA lapsed.

## 🚨 OWNER decision (highest priority)
- **TrustCenter cert status.** I set ISO 27001 / ISO 42001 / SOC 2 Type II to **"In Progress"** because
  there's no evidence in-repo that CSOAI holds these accredited certs, and claiming "Certified +
  independently verified by accredited auditors" when not held is a serious legal/ASA risk. **If CSOAI
  genuinely holds any of these, restore "Certified" for that one with the certificate evidence.** If
  not, "In Progress" is the honest status. Same for the FAQ claim of complying with HIPAA (HIPAA has
  no certification and only applies to covered entities/BAAs).

## 🔴 Certification — paid-product integrity (needs backend/owner)
- **Dead "Download Certificate" buttons** (no onClick / no endpoint) on a paid deliverable — wire or hide.
- **5-question placeholder bank** ("will be loaded from database") issues 1-year credentials off sample
  Qs — load the real, versioned question bank server-side before charging/issuing.
- **Impossible 70% pass on 5 Qs** (3/5=60% fail, 4/5=80% pass) — enlarge the bank or state the real 4/5 mark.
- **Certificate not persisted** — handleSubmit never calls an issue mutation; wire it so a pass records a real cert.

## 🟠 Subtle legal-mapping refinements (verify vs the Regulation before editing)
- **PolicyGenerator**: ISO/IEC 42001 clause **8.3 is 'AI risk treatment', not impact assessment** (impact
  assessment = clause 8.4 + Annex A control); generated policy applies high-risk controls to *every* tier.
- **AgentGovernance**: record-keeping = **Art. 12 (logging)**, Art. 11 = technical documentation; Art. 50
  has two limbs (50(1) disclosure, 50(2)/(4) marking/labelling); Art. 9/14 apply to high-risk, not 'agents' broadly.
- **Penalties**: 'whichever is higher' (fixed cap vs % turnover) applies to **undertakings**; for others it's
  the fixed cap — don't state it universally. GPAI-provider fines sit under **Art. 101**, not Art. 99.
  (The page's 1% figure for 'incorrect info' IS correct — Art. 99(5).)
