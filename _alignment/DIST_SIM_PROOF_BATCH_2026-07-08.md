# CSOAI Distribution Sim — Proof Batch (top 50, sample dossiers) 2026-07-08

**Pipeline:** enrich (persona/sector/needs/charter-fit/wedge via reasoning model on public
signals) → score (wedge from compliance gap, care-floor gate) → sign (SIGIL) → `lead_sim` table.
**Result:** 46/50 enriched (2 model refusals, 2 parse gaps), 41 pass care-floor.

## HONEST CALIBRATION NOTE
- All enriched fields are **inferred from public signals**, not scraped — flagged `source=inferred`,
  avg confidence **0.40** (deliberately modest; these are cold public-sector leads).
- **Wedge strength avg 0.998 is inflated:** most top leads have all-zero `compliance_posture`
  (no public evidence of adopted frameworks), so the computed "gap" maxes out. This measures
  *absence of public evidence*, NOT a real 99.8% product advantage. For the full run I'll cap/curve
  wedge and separate "no evidence" from "genuine gap."

## 3 sample dossiers
### OECD AI Policy Observatory  (tier 0)
- **Persona (inferred):** Senior Policy Analyst, AI Governance
- **Sector:** Intergovernmental AI Policy Research & Standards
- **Best-fit charter:** 36-publicwatchdog
- **Needs:**
  - Cross-jurisdictional AI regulation tracking
  - Standardized policy comparison frameworks
  - Public transparency and reporting tools
  - Risk/impact monitoring for member-state AI initiatives
  - Multi-stakeholder consultation and documentation support
- **Wedge:** Provides structured, ongoing observability into global AI policy developments to support the Observatory's monitoring and standards-alignment mandate.
- **Wedge strength:** 1.0 · **Confidence:** 0.65 · **Care-floor:** serve
- **SIGIL:** b2246c0889a91231

### UK AI Safety Institute (AISI)  (tier 0)
- **Persona (inferred):** Head of AI Evaluations / Technical Policy Lead
- **Sector:** Government – AI Safety Evaluation & Regulation
- **Best-fit charter:** 04-safetyof
- **Needs:**
  - Frontier model evaluation and red-teaming frameworks
  - Standardized safety benchmarking across labs
  - Audit trails and accountability reporting for model assessments
  - Bias and risk detection tooling for pre-deployment testing
  - Transparency reporting aligned with international AI safety standards
- **Wedge:** Provides standardized, auditable safety evaluation tooling that matches AISI's core mandate of independently testing frontier AI models before and after deployment.
- **Wedge strength:** 1.0 · **Confidence:** 0.55 · **Care-floor:** serve
- **SIGIL:** 60b71a97048d0aff

### European Data Protection Board (EDPB)  (tier 0)
- **Persona (inferred):** Head of Technology & Digital Policy / Data Protection Advisor
- **Sector:** Government / EU Regulatory Body - Data Protection & Privacy
- **Best-fit charter:** 09-dataprivacyof
- **Needs:**
  - GDPR-aligned compliance and audit tooling for cross-border DPA coordination
  - Algorithmic transparency assessment for AI systems processing personal data
  - Automated case-tracking for consistency mechanism opinions and guidelines
  - Impact assessment tools for automated decision-making under GDPR Art. 22
  - Secure, auditable data-sharing infrastructure for cross-EU regulator collaboration
- **Wedge:** Purpose-built privacy-compliance tooling that maps directly to GDPR obligations, giving the EDPB auditable, cross-jurisdiction data protection assessments rather than generic AI governance features.
- **Wedge strength:** 0.963 · **Confidence:** 0.55 · **Care-floor:** serve
- **SIGIL:** 4a9862ead4c8570a


## For your review before scaling to 2,363
1. Is the dossier shape right (persona / needs / charter-fit / wedge)?
2. Should wedge_strength be re-based (evidence-absence vs real-gap split)?
3. Confidence floor for care-floor 'serve' currently 0.35 — raise it?
