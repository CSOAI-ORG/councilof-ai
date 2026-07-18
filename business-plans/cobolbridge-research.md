# COBOL Bridge — Business Intelligence Report

**Date:** 2026-05-09
**Source:** Deep web research + competitive analysis

## Market Size
- COBOL modernization services: $1.7-3.1B (2024), projected $5.3-8.6B by 2033 (CAGR 11-13%)
- Broader mainframe modernization: $13.3B by 2030
- 220-344 billion lines of COBOL still in production
- 80% of face-to-face financial transactions, 95% of ATM swipes
- TAM for AI transpiler tool: $500M-1B annually

## Competitor Landscape

| Vendor | Approach | Pricing |
|--------|----------|---------|
| Micro Focus (OpenText) | Rehost/recompile .NET/JVM | Per-seat license |
| Raincode | Deterministic compiler | Project-based |
| Heirloom Computing | Cloud-native replatform | Custom |
| Astadia | End-to-end rehost + DevOps | Fixed-scope |
| TSRI | Automated refactoring to Java | ~$0.10-0.30/line |
| AWS Blu Age | Cloud migration (AWS-locked) | $0.10/line |
| Phase Change Software | AI-assisted understanding | Consulting-led |

**Gap:** No dominant per-seat SaaS model exists — COBOL Bridge can own this.

## UK Target Customers
92% of UK banks still rely on mainframes. Confirmed COBOL users:
- **Barclays** (outages traced to mainframe degradation)
- **Lloyds** ("maybe in ten years" for COBOL retirement, £3B+ digital transformation)
- **HSBC, Nationwide, NatWest**
- **Aviva, Legal & General, Prudential** (insurers)
- **HMRC, DWP, NHS** (government)

## USP
AI-native: reads full codebases, maps dependencies, traces execution, generates docs automatically. Cuts exploration from months to days.

**Best position:** Hybrid — AI for comprehension/docs/test-gen, deterministic rules for transpilation. "AI-assisted" not "AI-only."

## SWOT

**Strengths:** AI-native speed, MCP/open-source angle, SaaS disrupts project-based incumbents, no vendor lock-in
**Weaknesses:** New entrant, no case studies, transpilation correctness is existential in banking
**Opportunities:** Retirement cliff (avg COBOL dev is 55+), UK regulatory pressure, DORA compliance forcing modernization
**Threats:** IBM/Anthropic partnership, Microsoft Azure AI agents for COBOL, incumbents adding AI layers

## Pricing Strategy
**Per-seat SaaS (differentiated — nobody else does it):**
- Team: $2,500/seat/month (min 3 seats) — analysis + docs + test gen
- Enterprise: $5,000/seat/month — full transpilation + CI/CD + compliance
- Platform: custom $250K+ annual — unlimited, on-prem, SLA

**Alternative:** Per-line at $0.05-0.15/line (undercuts TSRI/AWS)

## Go-to-Market
1. Gartner/Forrester placement (analysts drive 60%+ of enterprise shortlists)
2. GSI partnerships (Capgemini, DXC, Accenture)
3. Conference circuit (IBM Think, AWS re:Invent mainframe track)
4. Compliance-led content (DORA, FCA operational resilience)
5. Free COBOL analysis MCP as lead magnet, paid transpilation behind paywall
6. First case study with a building society (faster procurement than Big 5)

## Actionable Next Steps
1. Build free COBOL analysis tool as open-source MCP (lead magnet)
2. Create interactive demo: upload COBOL → see AI analysis in 60s
3. Target building societies first (Nationwide, Yorkshire, Coventry)
4. Write DORA compliance angle content (banks MUST modernize)
5. Price at £199/seat/month (was incorrectly £2,499 — FIX THIS IN STRIPE)
