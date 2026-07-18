# 🔎 CSOAI page audit — what's FIXED vs what's left for M2 · 2026-07-08

Two multi-agent audits (20 pages). Honesty-critical factual errors fixed in PR #131 by M4; the
items below need careful hands (framework taxonomy — guessing risks introducing NEW errors) or are
larger polish. Raw findings: `CSOAI_PAGE_AUDIT_RAW_2026-07-08.json` + `..._TIER2_RAW_...json`.

## ✅ Fixed (verified, in PR #131)
Homepage fabricated stats + earnings claims + hover bug + 'world's first'; Pricing currency + '40%'
math; Compare 26-vs-13; SEC/JurisdictionAct/SystemCard/OsLauncher; **Crosswalk** EU-AI-Act dates
(GPAI in force since Aug-2025; killed fake 2-Dec-2026; 'adjacent frameworks'); **NIS2** transposition
17-Oct-2024 + dropped fake May-2026 templates + DORA-lex-specialis; **DORA** applies 17-Jan-2025;
**Industries** removed non-existent 'Basel III AI Requirements', FERPA name, 40→32 NATO; **EU-AI-Act
guide** OJ-publication vs adoption, Digital-Omnibus 19-Nov-2025, Art.10(3) 'error-free' wording.

## ✅ NOW FIXED by M4 (source-verified, PR #131) — since first draft
NIST AI RMF (MAP 4, MANAGE 3, 'Fair – with Harmful Bias Managed', OECD wording) vs NIST AIRC;
ISO 42001 '38 controls across 9 objectives' vs ISO structure; FedRAMP RFC-0024 = adopted policy
(machine-readable mandatory, OSCAL named primary); regulators.ts M-24-10→M-25-21 (rescinded Apr-2025)
+ Colorado SB 24-205 repealed/replaced by SB 26-189 (ADMT, eff 1 Jan 2027). E2E: 24/24 routes render
0-error, 16/16 links resolve, dead /verify in the KB fixed.

## 🔴 Still left for M2 (lower severity / visual)
1. **NISTAIRMFGuide.tsx** — GOVERN/MAP/MANAGE categories are scrambled vs AI RMF 1.0: GOVERN 6
   (third-party/supply-chain) is omitted; MAP 4 mislabeled 'Risk Tolerance'; MANAGE 3 mislabeled
   'Risk Monitoring'; trustworthy characteristic 'Fair with Managed Bias' → NIST's 'Fair – with
   Harmful Bias Managed'; 'developed in consultation with OECD' overstates (congressionally-directed,
   NIST-led). The 'Cyber AI Profile — New Release Dec 2025' is presented as final — confirm status.
2. **ISO42001Guide.tsx (IEC)** — 'ISO/IEC 42001 has 37 Annex A controls' is the fact; the page says
   '4 informative annexes' / 'five domains' — reconcile to the real Annex A structure. 'Recent
   Certifications' block names bodies + 'first' superlatives with NO citation — add sources or cut.
3. **Fedramp.tsx** — 'RFC-0024 makes OSCAL mandatory for every FedRAMP provider' is an overclaim
   (treats an emerging RFC as settled binding law). The **dates are right** (30 Sep 2026 / 2027);
   soften the 'mandatory/required' framing to 'proposed/expected'. Uncited '100+ Rev5, virtually
   none produced OSCAL' — cite or cut.
4. **HighRiskSystems.tsx** — 'Annex I by August 2027' attributed to the Digital Omnibus, but Aug-2027
   is the ORIGINAL AI Act date; and being in an Annex III category has an exemption route (Art. 6(3))
   — 'the full regime always applies' overstates.
5. **regulators.ts** — Colorado SB 24-205 effective date + OMB M-24-10 status ('operative baseline'
   may be stale post-Jan-2025 EO changes) — verify current status before trusting the cards.

## 🎨 Left for M2 — visual/polish (bigger)
6. **EUAIActGuide.tsx** off-brand palette: hero/timeline/stats use blue-600/indigo/purple — recolor
   to emerald/teal/slate for brand consistency. Also a latent `.replace(' ','-')` slugify bug
   (first-space only) — use `.replace(/[^a-z0-9]+/g,'-')`.
7. **Crosswalk** recommended upgrade: replace the two countdown pills with a single branded SVG
   **EU AI Act enforcement timeline** (Feb-2025 → Aug-2025 → Aug-2026 → Aug-2027 nodes, 'you-are-here'
   marker driven by the existing days() helper). Corrects the schedule AND becomes a citable asset.
8. Site-wide typography polish (spaced-hyphen → em-dash; literal `-&gt;` → `→`) across most pages —
   batch cosmetic, low-risk.
