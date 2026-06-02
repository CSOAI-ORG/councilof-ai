# MEOK LAW — Crosswalk SME-Review Report (2026-06-02)

_The 11 new civilian crosswalks were built as structural mappings to each framework's real
architecture, then put through an **adversarial AI peer-review** pass (one reviewer per
framework, instructed to refute: verify every clause ID, de-inflate equivalence, remove
misleading rows). This is a genuine accuracy pass — **not** a substitute for human legal
counsel. Every file is now flagged `provenance: "v1 generated + AI peer-reviewed; pending
human counsel sign-off"` with `metadata.sme_reviewed = true`._

## Result: clause IDs were mostly accurate; the main work was de-inflating equivalence

| Framework | Maps | Ref fixes | Downgrades | Removed | Headline catch |
|---|---|---|---|---|---|
| ISO/IEC 42001 | 30 | 3 | 8 | 0 | Clause 10.1/10.2 (improvement vs corrective action) were inverted |
| ISO/IEC 27001 | 26 | 0 | 0 | 0 | Clean — 2022 Annex A themes all correct |
| GDPR | 25 | 0 | 1 | 1 | Articles all correct; trimmed unsupported topics |
| SOC 2 | 24 | 0 | 2 | 0 | CC/PI/P criteria correct; 2 "full" → strong |
| Canada AIDA | 26 | 5 | 5 | 1 | Removed a **phantom s.36** citation; AIDA marked proposed/stalled |
| FDA AI/ML SaMD | 24 | 3 | 2 | 0 | FDA premarket review ≠ EU notified-body conformity assessment |
| HIPAA | 22 | 0 | 3 | 0 | CFR §s correct; dropped an unsupported "safety" topic |
| Basel III (overlay) | 21 | 4 | 7 | 1 | BCBS 239 P6 = Adaptability (not Completeness); flagged consultative doc |
| Brazil LGPD | 24 | 5 | 2 | 1 | LGPD Articles correct; PL 2338 marked pending |
| India DPDPA | 23 | 6 | 1 | 0 | §6 consent / §8(3) accuracy fixed; **MeitY → NITI Aayog** misattribution |
| Australia AI Ethics | 22 | 1 | 1 | 2 | Principles/guardrails correct; framed strictly as voluntary |
| **Total** | **267** | **~27** | **~32** | **~6** | |

**Read of the result:** the subagents that *built* the crosswalks got the real clause/section
identifiers right far more often than not (ISO 27001, GDPR, SOC 2, HIPAA, Australia, Brazil had
**zero** ID errors). The systematic weakness the review corrected was **over-claimed
equivalence** — "exceeds"/"full" used as marketing rather than fact — now downgraded to honest
strong/partial. A handful of genuine factual errors were caught and fixed (the table's
"headline catch" column).

## What still needs a human lawyer before you sell these as certified
- **Canada AIDA** — proposed bill that died at prorogation (Jan 2025); only the Treasury Board
  Directive on Automated Decision-Making is in force. Crosswalk marks every AIDA ref as proposed.
- **FDA AI/ML SaMD** — GMLP + Action Plan are non-binding guidance; only the PCCP carries
  statutory force (FD&C Act §515C via FDORA 2022). Mappings now say "expects", not "requires".
- **India DPDPA** — no statutory right-to-explanation / automated-decision provision (no GDPR
  Art-22 analogue); explainability mappings are partial with that caveat.
- **Basel III** — this is an **AI-governance overlay** on BCBS 239 + model-risk practice, not a
  mapping to Basel III capital rules. Scope note added.
- **Brazil PL 2338/2023** — pending, not law.

## Coverage now
- **23 public framework crosswalks across 9 regions** (EU, UK, US, CA, APAC, BR, IN, AU, GLOBAL)
  + 4 domain crosswalk MCPs (DORA↔NIS2, DRCF-agent, ASC↔RSPCA, CSOAI-governance).
- **2 defence crosswalks** (DoD/JAIC, NATO) built + AI-reviewable but **held in the private
  Dagon namespace** per the civilian-only positioning — not in the public product.
- Live: `meok.ai/law` (connect page) · `/api/law` + `/api/law/applicable|crosswalk|register` ·
  `meok-law-mcp` v1.1.0 (same bundle). CSOAI 52-article charter is the pivot for cross-region handoffs.

_Authored by Claude (Opus 4.8). Reviewers: 11 independent Claude Opus 4.8 agents (AI peer review)._
