# NLnet NGI0 Commons Fund — Grant Application

**Project:** Open Compliance Automation for the EU AI Act
**Organisation:** MEOK AI Labs (UK)
**Deadline:** 1 June 2026, 12:00 CEST
**Fund:** NGI0 Commons Fund (Horizon Europe Grant No. 101135429)
**Requested Amount:** EUR 48,000
**Duration:** 8 months (July 2026 — February 2027)

---

## 1. Project Name

**Open Compliance Automation for the EU AI Act**

---

## 2. Project Summary (max 250 words)

The EU AI Act enforcement deadline for general-purpose AI systems (Article 50) falls on August 2, 2026. As of this writing, that is 85 days away. Enterprises face penalties of up to EUR 35 million or 7% of global turnover, yet the compliance tooling market is dominated by proprietary platforms costing EUR 130,000-300,000/year — well beyond the reach of Europe's 25 million SMEs.

MEOK AI Labs has built the most comprehensive open-source AI compliance toolkit available today: 246+ MCP (Model Context Protocol) servers published to PyPI, including 15 dedicated to EU AI Act compliance, with HMAC-SHA256 cryptographically signed attestations and publicly verifiable URLs. This is working code, not a whitepaper.

This project will transform that fragmented toolkit into an end-to-end open-source compliance automation suite covering: Article 50 transparency obligations (watermarking, disclosure, user-facing notices), Article 6 risk classification (unacceptable/high/limited/minimal), Article 16 conformity assessment (self-assessment workflows, CE marking readiness), and Article 11 technical documentation (auto-generated technical dossiers in regulatory-grade format). The suite will be published as MIT-licensed Python packages on PyPI, deployable via Docker Compose or pip, with zero vendor lock-in. Target: any SME operating or deploying an AI system in the EU market can achieve baseline compliance in under 4 hours, at zero licensing cost.

---

## 3. Requested Amount

**EUR 48,000**

This sits just below the EUR 50,000 first-proposal cap, reflecting the project's ambition while acknowledging this is a focused 8-month delivery sprint building on 18 months of prior open-source investment by MEOK AI Labs (246 existing PyPI packages, attestation infrastructure, and MCP marketplace — all independently built without prior grant funding).

---

## 4. Duration

**8 months: July 2026 — February 2027**

The timeline is driven by regulatory reality. Article 50 enforcement begins August 2, 2026 — one month after project start. The early milestones deliver immediate-useful tools for that deadline. Later milestones build the comprehensive conformity assessment and documentation automation that providers will need as national competent authorities begin enforcement actions through Q4 2026 and Q1 2027.

---

## 5. Detailed Description

### 5.1 What Problem Does It Solve?

The EU AI Act (Regulation 2024/1689) imposes legally binding obligations on AI system providers, deployers, importers, and distributors operating in the EU market. The compliance burden is substantial and imminent:

| Obligation | EU AI Act Article | Deadline | Status |
|---|---|---|---|
| Transparency (watermarking, disclosure, notices) | Article 50 | **August 2, 2026** | 85 days away |
| Risk classification (prohibited → high → limited → minimal) | Article 6 + Annex III | Phased from Aug 2026 | No open-source classifier exists |
| Conformity assessment (self-assessment, notified body review) | Article 16 + Annex VI | Phased through 2027 | No open-source workflow exists |
| Technical documentation (full dossier requirements) | Article 11 + Annex IV | Required at market placement | No open-source generator exists |
| Penalties for non-compliance | Articles 99-101 | EUR 35M or 7% global turnover | Enforcement imminent |

The current compliance market fails European SMEs in three ways:

1. **Prohibitive cost.** OneTrust GRC costs EUR 130,000-300,000/yr. Vanta and Drata start at EUR 10,000-80,000/yr. These are priced for enterprises, not the 25 million SMEs that form the backbone of the European economy.
2. **Vendor lock-in.** Proprietary compliance platforms export data in closed formats. Auditors and regulators cannot independently verify attestations without access to the vendor's platform.
3. **No open standard for AI compliance.** There is no CycloneDX-equivalent standard for AI-BOMs with regulatory-grade cryptographic signatures. No open-source tool extracts compliance evidence directly from AI system internals via MCP.

MEOK AI Labs has already proven the technical approach: 15 EU AI Act-specific MCP servers generating HMAC-SHA256 signed attestations with public verify URLs at proofof.ai. The missing piece is turning this toolchain into a coherent, end-to-end compliance suite accessible to non-technical compliance officers.

### 5.2 How Does It Solve It?

The project builds four interconnected open-source components, each shipping as MIT-licensed Python packages on PyPI:

**Component 1: EU AI Act Transparency Engine (Articles 50, 52)**
- Automated watermarking detection and generation for AI-generated content (Article 50(2))
- Disclosure notice generation for emotion recognition and biometric categorisation systems (Article 50(3))
- User-facing transparency label generation with machine-readable metadata
- Integration with C2PA Content Credentials specification for downstream compatibility
- Ships as `meok-transparency-mcp` (PyPI)

**Component 2: Risk Classification Engine (Article 6, Annex III)**
- Decision-tree classifier mapping AI system characteristics to risk tiers (unacceptable, high, limited, minimal)
- Rule engine encoding Annex III high-risk categories (biometric, critical infrastructure, education, employment, essential services, law enforcement, migration, justice, democratic processes)
- Generative AI system classification per Article 51 (GPAI with/without systemic risk)
- Automated evidence collection from MCP-connected AI systems to substantiate classification
- Ships as `meok-risk-classifier-mcp` (PyPI)

**Component 3: Conformity Assessment Workflow (Article 16, Annex VI)**
- Self-assessment wizard implementing Annex VI conformity assessment procedures
- Quality management system (QMS) checklist mapped to Article 17 requirements
- Automated gap analysis between current system state and conformity requirements
- CE marking readiness report generation
- EU declaration of conformity template generation (Annex V)
- Ships as `meok-conformity-mcp` (PyPI)

**Component 4: Technical Documentation Generator (Article 11, Annex IV)**
- Auto-generated technical documentation dossiers from MCP system introspection
- Annex IV-compliant structure: system description, design specs, development methodology, testing, risk management, accuracy/robustness metrics
- Cryptographically signed with HMAC-SHA256 attestation + public verify URL
- Machine-readable JSON output for regulator API submission
- Ships as `meok-documentation-mcp` (PyPI)

**Integration layer: `meok-compliance-orchestrator`**
- Single `docker compose up` command deploys the full suite
- REST API for integration with CI/CD pipelines, governance dashboards, or existing GRC tools
- Unified compliance dashboard (React/Tailwind) showing real-time compliance posture across all four Article domains
- All outputs cryptographically attested with HMAC-SHA256 + verify URL

**Architecture:**

```
[AI System under assessment]
        │
        ▼
[MCP Protocol Interface]  ← 246 existing MCP servers extract evidence
        │
        ├──► meok-transparency-mcp ──► Article 50 compliance report
        ├──► meok-risk-classifier-mcp ──► Article 6 risk classification
        ├──► meok-conformity-mcp ──► Article 16 conformity assessment
        └──► meok-documentation-mcp ──► Article 11 technical dossier
                │
                ▼
[meok-attestation-api] ──► HMAC-SHA256 signature + proofof.ai/verify/{hash}
                │
                ▼
[Compliance Dashboard / CI/CD Export / Regulator Submission]
```

### 5.3 Who Benefits and How?

**Primary beneficiaries — European SMEs deploying or developing AI systems:**
- 25 million SMEs in the EU Single Market
- Any company using AI for hiring, credit scoring, customer service, content generation, biometric analysis, or decision support must classify risk and document compliance
- Currently: must hire expensive consultants or buy enterprise SaaS
- After this project: `pip install meok-compliance-orchestrator && meok-compliance scan` produces a cryptographically verifiable compliance report in minutes

**Secondary beneficiaries — Open-source AI ecosystem:**
- AI model developers (Hugging Face, open-weight model publishers) can integrate compliance attestation into their CI/CD
- MCP server developers gain a reference implementation for compliance-aware tool exposure
- EU regulatory sandboxes and national competent authorities gain an open, auditable compliance verification tool

**Tertiary beneficiaries — Standards bodies and civil society:**
- OWASP AI Exchange: MEOK attestation patterns contribute to the canonical security + compliance control set
- CEN/CENELEC JTC 21 (AI standards): open-source implementation validates and stress-tests draft harmonised standards
- European Commission AI Office: open tooling enables transparent, reproducible compliance verification

### 5.4 What Makes It Different from Existing Solutions?

| Dimension | Proprietary (OneTrust, Vanta, Drata) | **Open Compliance Automation (this project)** |
|---|---|---|
| License cost | EUR 10K-300K/yr | EUR 0 (MIT license) |
| Attestation format | Proprietary, vendor-locked | HMAC-SHA256 + public verify URL |
| Verifiability | Requires vendor platform access | Any browser: proofof.ai/verify/{hash} |
| AI-specific compliance | Generic GRC, AI as afterthought | Purpose-built for EU AI Act articles |
| Extensibility | Vendor-controlled plugin ecosystem | 246 MCP servers, any developer can extend |
| Deployment | SaaS-only, vendor cloud | pip install, Docker Compose, on-premises |
| Data residency | Vendor-controlled | Self-hosted, any jurisdiction |
| Audit trail | Opaque | Full MCP tool execution log, cryptographically chained |
| Integration | REST API (vendor-controlled) | Open MCP protocol + REST API |

The **HMAC-SHA256 attestation with public verify URLs** is MEOK's core differentiator. Unlike proprietary platforms where compliance evidence lives inside a vendor's walled garden, every compliance artifact produced by this suite carries a cryptographic signature verifiable by any regulator, auditor, or counterparty without needing access to the original tooling. This makes regulatory submissions auditable-by-design, a property no existing compliance platform provides.

The **246 existing MCP servers** are another key differentiator. Most compliance tools require manual data entry. MEOK's MCP servers can extract compliance evidence directly from AI system internals — model weights, training data metadata, inference pipelines, prompt templates, output watermarking — via the MCP protocol. This is automated compliance evidence collection at a depth no SaaS product can match.

### 5.5 Technical Deliverables

| Deliverable | Format | License | Description |
|---|---|---|---|
| meok-transparency-mcp | PyPI package (Python) | MIT | Article 50 automation: watermarking, disclosure, transparency labels |
| meok-risk-classifier-mcp | PyPI package (Python) | MIT | Article 6 risk classification engine with Annex III rule base |
| meok-conformity-mcp | PyPI package (Python) | MIT | Article 16 conformity assessment workflow and QMS checklist |
| meok-documentation-mcp | PyPI package (Python) | MIT | Article 11/Annex IV technical documentation auto-generator |
| meok-compliance-orchestrator | PyPI + Docker Compose | MIT | Unified deployment, dashboard, and API |
| Compliance Dashboard | React/Tailwind SPA | MIT | Real-time compliance posture visualisation |
| Integration tests | pytest suite (100+ tests) | MIT | End-to-end compliance scenario validation |
| User documentation | Markdown, published at docs.meok.ai | CC-BY-SA 4.0 | Deployment guides, Article-by-Article walkthroughs, API reference |
| Demo video | 15-minute walkthrough | CC-BY-SA 4.0 | SME onboarding from zero to compliance report |
| OWASP AI Exchange contribution | Markdown/JSON mapping | CC0 | EU AI Act control → OWASP AI Exchange control mapping |

All software published to PyPI under MIT license. All documentation under CC-BY-SA 4.0. All contributions to external standards under CC0.

### 5.6 Alignment with NLnet's Mission and NGI0 Commons Fund Priorities

**Full-stack digital commons.** This project delivers the missing compliance layer in the open-source AI stack. Model development (Hugging Face, PyTorch), deployment (Ollama, vLLM), and orchestration (LangChain, MCP) are well-served by open source. Regulatory compliance is not. Filling this gap is essential to making the full AI technology stack available as a commons.

**Open AI models and open data.** The compliance suite is model-agnostic by design. Any open-weight model deployed via MCP can be assessed. The risk classifier is not a black box — the rule engine encoding Annex III is human-readable Python, auditable by regulators and civil society alike. The technical documentation generator produces structured, machine-readable evidence that can feed open regulatory data repositories.

**Intelligent mediators.** MCP (Model Context Protocol) is the emerging open standard for AI system interoperability. This project positions MCP as a compliance mediator — an intelligent layer that translates between AI system internals and regulatory requirements. By building compliance as MCP-native tooling, we ensure that compliance automation evolves alongside AI capabilities rather than lagging behind.

**Open standards.** Every output of this suite is standards-aligned or standards-advancing: CycloneDX 1.7 for AI-BOMs, C2PA Content Credentials for watermarking metadata, MCP for AI system introspection, HMAC-SHA256 for cryptographic attestation. Where standards don't yet exist (EU AI Act machine-readable compliance format), this project proposes a reference implementation that can seed formal standardisation.

**European dimension.** The EU AI Act is the world's first comprehensive AI regulation. Its implementation will define the global standard for AI governance. Building the compliance tooling as European open-source commons — rather than as US-headquartered SaaS products — ensures that European regulatory sovereignty extends to the implementation layer. The project lead (UK) and the target users (EU SMEs) meet the European dimension requirement. Brexit notwithstanding, the UK-EU Trade and Cooperation Agreement maintains alignment on digital regulation, and this project explicitly serves EU-based deployers of AI systems.

### 5.7 Longer-Term Sustainability Plan

**Open-source core (perpetually free).** All compliance automation components remain MIT-licensed and freely available on PyPI. The `pip install meok-compliance-orchestrator` path will always cost EUR 0. This is the commons contribution — it must remain unencumbered.

**MEOK Pro tier (optional, post-grant sustainability).** MEOK AI Labs operates a freemium model. The open-source suite is complete and self-sufficient. A hosted Pro tier (target: GBP 199/month) offers: shared multi-user workspaces, team-based compliance dashboards, audit-ready export bundles, Slack/Teams notification integration, and priority support. The open-source version is not crippled — Pro adds collaboration and convenience, not missing core functionality. This follows successful open-source sustainability models (GitLab, Sentry, Supabase).

**Consulting and integration (revenue stream).** MEOK AI Labs offers paid consulting for SMEs needing custom AI Act compliance integration, bespoke risk assessments, or regulatory liaison support. Grant-funded tooling makes this consulting dramatically more efficient — the open-source suite does 80% of the work, consulting handles the 20% that requires human judgment.

**Standards body engagement (ecosystem sustainability).** By contributing reference implementations and compliance mappings to OWASP AI Exchange, CEN/CENELEC JTC 21, and the European Commission AI Office, the project embeds itself in the evolving regulatory ecosystem. As the regulation matures, the open-source tooling matures with it — maintained by the community that depends on it.

**Community governance.** Within 12 months of project completion, establish a lightweight governance structure (CODEOWNERS, CONTRIBUTING.md, RFC process) to enable community contributions. The project is structured as independently useful PyPI packages — any component can be maintained, forked, or extended independently.

---

## 6. Work Packages and Milestones

### Summary Timeline

```
Jul 2026  Aug 2026  Sep 2026  Oct 2026  Nov 2026  Dec 2026  Jan 2027  Feb 2027
├─────────┼─────────┼─────────┼─────────┼─────────┼─────────┼─────────┼─────────┤
│ WP1: Transparency      │ WP2: Risk              │ WP3: Conformity          │
│ (Article 50)           │ Classification          │ Assessment (Article 16)  │
│                     Aug 2: Art 50 enforcement    │                          │
├────────────────────────┼────────────────────────┼──────────────────────────┤
│                        │ WP4: Technical Docs     │ WP5: Integration + UI    │
│                        │ (Article 11/Annex IV)   │                          │
└────────────────────────┴────────────────────────┴──────────────────────────┘
                                                                   WP6: Testing,
                                                                   docs, release
```

### WP1: EU AI Act Transparency Engine — Month 1 (July 2026)

**Objective:** Deliver Article 50 compliance automation before the August 2, 2026 enforcement deadline.

**Tasks:**
- Implement watermarking detection for AI-generated text, image, audio, and video outputs (Article 50(2))
- Build C2PA Content Credentials integration for machine-readable watermark metadata
- Develop disclosure notice templates for emotion recognition systems (Article 50(3)), biometric categorisation, and deepfake content (Article 50(4))
- Generate user-facing transparency labels in HTML/JSON format
- Integrate with existing MEOK attestation API for signed transparency reports
- Write pytest test suite with 20+ scenario tests
- Publish `meok-transparency-mcp` v1.0 to PyPI

**Deliverable:** `meok-transparency-mcp` v1.0 on PyPI. Produces Article 50-compliant transparency reports with HMAC-SHA256 attestations.
**Budget:** EUR 8,500
**Payment milestone:** Package published to PyPI, test suite passing, demo video of transparency report generation.

### WP2: Risk Classification Engine — Months 2-3 (August-September 2026)

**Objective:** Deliver automated EU AI Act risk classification per Articles 6 and 51, Annex III.

**Tasks:**
- Encode Annex III high-risk categories as human-auditable Python decision tree
- Implement Article 51 GPAI classification pathway (general-purpose AI with/without systemic risk)
- Build automated evidence collection via MCP integration (model architecture, training data provenance, deployment context)
- Generate machine-readable risk classification reports with supporting evidence
- Implement risk tier change detection for CI/CD integration (classification on every deployment)
- Write integration tests covering all Annex III categories and edge cases
- Publish `meok-risk-classifier-mcp` v1.0 to PyPI

**Deliverable:** `meok-risk-classifier-mcp` v1.0 on PyPI. Accepts AI system description (or MCP introspection) and returns regulatory risk tier with supporting evidence.
**Budget:** EUR 9,500
**Payment milestone:** Package published to PyPI, test suite covering all Annex III categories, demo video of risk classification workflow.

### WP3: Conformity Assessment Workflow — Months 3-4 (September-October 2026)

**Objective:** Deliver Article 16 conformity assessment automation with Annex VI self-assessment procedures.

**Tasks:**
- Build Annex VI conformity assessment wizard (interactive and API modes)
- Implement Article 17 quality management system checklist
- Develop automated gap analysis between current system state and conformity requirements
- Generate CE marking readiness reports
- Build EU Declaration of Conformity template generator (Annex V format)
- Integrate with attestation API for signed conformity declarations
- Write integration tests for full conformity workflow
- Publish `meok-conformity-mcp` v1.0 to PyPI

**Deliverable:** `meok-conformity-mcp` v1.0 on PyPI. Interactive and API-driven conformity assessment with auto-generated CE marking documentation.
**Budget:** EUR 9,500
**Payment milestone:** Package published to PyPI, conformity workflow test suite passing, demo video of complete assessment workflow.

### WP4: Technical Documentation Generator — Months 3-5 (September-November 2026)

**Objective:** Deliver Article 11 / Annex IV technical documentation auto-generation with cryptographic attestation.

**Tasks:**
- Build Annex IV document structure generator (system description, design specifications, development methodology, testing procedures, risk management, accuracy/robustness metrics, instructions for use)
- Implement MCP system introspection data collection (model metadata, training data summary, evaluation metrics, deployment architecture)
- Generate machine-readable JSON output for regulator API submission (design for CEN/CENELEC emerging standard)
- Produce human-readable PDF/HTML technical dossier with table of contents and cross-references
- Attach HMAC-SHA256 signature and proofof.ai verify URL to every generated dossier
- Implement CI/CD integration mode (generate documentation on every release)
- Write integration tests validating Annex IV section completeness
- Publish `meok-documentation-mcp` v1.0 to PyPI

**Deliverable:** `meok-documentation-mcp` v1.0 on PyPI. Auto-generates cryptographically signed technical dossiers compliant with Annex IV.
**Budget:** EUR 9,500
**Payment milestone:** Package published to PyPI, test suite validating Annex IV section completeness, demo dossier generated and verified.

### WP5: Compliance Orchestrator and Dashboard — Months 5-6 (November-December 2026)

**Objective:** Unify all components into a single deployable suite with a user-facing compliance dashboard.

**Tasks:**
- Build `meok-compliance-orchestrator` Python package with unified CLI and REST API
- Create Docker Compose configuration deploying all four components + attestation API + dashboard
- Develop React/Tailwind compliance dashboard with: real-time compliance posture, per-Article status indicators, attestation verification widget, export (PDF, JSON, HTML)
- Implement single-command scan: `meok-compliance scan` → full compliance report
- Build CI/CD integration examples (GitHub Actions, GitLab CI)
- Write end-to-end integration tests
- Publish `meok-compliance-orchestrator` v1.0 to PyPI

**Deliverable:** `meok-compliance-orchestrator` v1.0 on PyPI + Docker Compose. One-command deployment of the full compliance suite.
**Budget:** EUR 7,000
**Payment milestone:** Orchestrator published to PyPI, Docker Compose deployment verified, dashboard functional, E2E test suite passing.

### WP6: Testing, Documentation, and Community Release — Months 7-8 (January-February 2027)

**Objective:** Harden, document, and release the complete suite with community onboarding materials.

**Tasks:**
- Comprehensive cross-component integration testing (100+ pytest scenarios)
- Security review of attestation pipeline (HMAC key management, signature verification, API security)
- Accessibility audit (WCAG 2.1 AA for dashboard)
- Write deployment documentation (pip, Docker, on-premises, CI/CD)
- Write Article-by-Article compliance walkthrough guides
- Produce 15-minute demo video: "EU AI Act Compliance in Under 4 Hours"
- Contribute EU AI Act → OWASP AI Exchange control mapping to OWASP AI Security Guide
- Write sustainability and community governance documentation (CONTRIBUTING.md, CODEOWNERS, governance model)
- Publish all remaining components to docs.meok.ai
- Community launch (MCP registry, Hugging Face, Hacker News, relevant EU policy forums)

**Deliverable:** Full v1.0 release of all five PyPI packages, comprehensive documentation at docs.meok.ai, OWASP contribution submitted, demo video published.
**Budget:** EUR 4,000
**Payment milestone:** All packages published, documentation live, OWASP contribution accepted, demo video published.

---

## 7. Budget Breakdown

| Work Package | Description | Person-Days | Rate (EUR/day) | Total (EUR) |
|---|---|---|---|---|
| WP1 | Transparency Engine (Article 50) | 17 | 500 | 8,500 |
| WP2 | Risk Classification Engine (Article 6) | 19 | 500 | 9,500 |
| WP3 | Conformity Assessment Workflow (Article 16) | 19 | 500 | 9,500 |
| WP4 | Technical Documentation Generator (Article 11) | 19 | 500 | 9,500 |
| WP5 | Compliance Orchestrator + Dashboard | 14 | 500 | 7,000 |
| WP6 | Testing, Documentation, Community Release | 8 | 500 | 4,000 |
| **Total** | | **96 person-days** | | **48,000** |

**Rate rationale:** EUR 500/day is a standard contractor rate for senior Python/open-source developers in the UK/EU market. This is below the market median for AI/ML infrastructure engineers (typically EUR 600-800/day), reflecting the project's public-benefit nature and MEOK AI Labs' commitment to the commons.

**No overhead, facilities, or administrative costs are charged.** The EUR 48,000 covers direct development labour only. MEOK AI Labs absorbs all infrastructure costs (Vercel hosting for attestation API, PyPI distribution, GitHub, domain costs).

**In-kind contribution by MEOK AI Labs (not charged to grant):**
- 246 existing MCP servers on PyPI (18 months of prior development)
- meok-attestation-api (HMAC-SHA256 signing + verify infrastructure)
- proofof.ai domain and hosting
- MCP marketplace infrastructure
- All existing EU AI Act MCP servers (15 packages)

This represents approximately 400+ person-days of prior open-source investment that this project builds upon.

---

## 8. Team

**Nicholas Templeman — Project Lead and Sole Developer**

- Founder, MEOK AI Labs
- Creator of 246+ open-source MCP servers published to PyPI (MIT license)
- Developed the meok-attestation-api (HMAC-SHA256 cryptographically signed attestations with public verify URLs)
- Built 15 EU AI Act-specific MCP servers covering Articles 5, 6, 11, 13, 16, 50, and Annex IV
- Designed the SOV3 consciousness engine (78.8% metric, 6 trained neural networks) for automated code generation and system orchestration
- MCP protocol contributor and active participant in MCP ecosystem development
- Location: United Kingdom (eligible under EU Horizon Europe association and European dimension criteria)
- Contact: nicholas@meok.ai

**Previous relevant contributions:**
- meok-attestation-api: Open-source HMAC-SHA256 signing infrastructure for AI compliance attestations
- ai-bom-mcp: CycloneDX AI-BOM generation for AI system supply chain transparency
- proofof-ai-mcp: Blockchain-anchored cryptographic certificates for AI system verification
- agent-audit-logger-mcp: Automated audit trail generation for MCP tool executions
- 15 EU AI Act MCP servers: The most comprehensive open-source implementation of EU AI Act compliance tooling on PyPI

---

## 9. Links to Existing Work

**Core infrastructure (live, open-source):**
- GitHub organisation: https://github.com/CSOAI-ORG
- PyPI author page: https://pypi.org/user/meok-ai/ (246+ packages)
- Attestation API: https://github.com/CSOAI-ORG/meok-attestation-api
- Verification: https://proofof.ai

**Key existing MCP servers (EU AI Act compliance, on PyPI):**
- `eu-ai-act-compliance-mcp` — General EU AI Act compliance
- `eu-ai-act-risk-classifier-mcp` — Initial risk classification (v0.1)
- `eu-ai-act-transparency-mcp` — Article 50 disclosure (v0.1)
- `ai-bom-mcp` — CycloneDX AI-BOM generation
- `agent-audit-logger-mcp` — Audit trail generation
- `proofof-ai-mcp` — Blockchain-anchored certificates
- plus 9 additional EU AI Act-specific packages

**Related grant applications (this project is a focused evolution):**
- `clawd/grants/innovate-uk-frontier-ai-2026/` (UK AI safety focus)
- `clawd/grants/schmidt-sciences/` (AI safety research)

---

## Comparison with Existing or Historical Efforts

**OneTrust AI Governance (proprietary, US):** The dominant enterprise GRC platform. Covers GDPR, ISO 27001, and emerging AI governance modules. Annual cost EUR 130K-300K. Closed-source, SaaS-only, vendor data lock-in. Does not produce cryptographically verifiable attestations. AI governance is a secondary module, not a purpose-built product.

**Vanta / Drata (proprietary, US):** Automated compliance for SOC 2, ISO 27001, GDPR. Enterprise-focused at EUR 10K-80K/yr. Not AI-specific; AI Act modules are marketing slides, not shipping products. No MCP integration. No cryptographic attestation.

**EU AI Act Compliance Checker (open-source, community):** A static questionnaire-based compliance checker. Useful as a starting point but does not integrate with AI system internals, does not generate cryptographically signed evidence, and covers limited Articles.

**CycloneDX (open standard, OWASP Foundation):** The SBOM standard. MEOK's `ai-bom-mcp` already emits CycloneDX 1.4 format. This project upgrades to 1.7 (adding Data Provenance and Citations fields) and pairs AI-BOMs with regulatory attestations — a combination no existing tool provides.

**What makes this project unique:** It is the only compliance suite that (a) integrates directly with AI system internals via MCP, (b) produces cryptographically verifiable regulatory attestations, (c) covers all four major EU AI Act compliance domains (transparency, risk, conformity, documentation), and (d) is fully open-source with zero licensing cost.

---

## Technical Challenges and Mitigations

**Challenge 1: Evolving regulation.** The EU AI Act implementing acts and harmonised standards are still being drafted. The compliance rules may change during or shortly after the project.
*Mitigation:* All rule encodings (risk classification, conformity checklists) are in human-readable Python/YAML, not compiled black boxes. Updates are a config change, not a rewrite. The architecture separates regulatory logic from compliance infrastructure.

**Challenge 2: MCP protocol maturity.** MCP is an emerging standard under active development (Anthropic, 2024). Breaking changes to the protocol could affect evidence collection.
*Mitigation:* MEOK has deep MCP expertise (246 servers built). The compliance suite targets MCP v1.x stable APIs and abstracts MCP interaction behind a version-tolerant adapter layer.

**Challenge 3: Scope management.** The EU AI Act is over 450 pages. Covering all obligations in 8 months requires disciplined scoping.
*Mitigation:* The project targets four specific Articles (6, 11, 16, 50) that form the minimum viable compliance pathway for most AI systems. Additional Articles can be added in follow-up projects or community contributions. The modular PyPI package architecture ensures each component is independently useful and extensible.

**Challenge 4: Legal interpretation ambiguity.** Some EU AI Act provisions are subject to legal interpretation. An open-source tool cannot provide legally binding interpretations.
*Mitigation:* All outputs are explicitly labelled as "compliance assistance, not legal advice." The tool generates evidence and documentation — legal interpretation remains the user's responsibility. Documentation will include prominent disclaimers and reference the official legal text.

---

## Ecosystem Engagement and Promotion

**During the project:**
- Monthly development updates published on the MEOK AI Labs blog and MCP registry
- Active engagement with the MCP developer community (Discord, GitHub discussions)
- Contributions to OWASP AI Exchange (control mapping, reference implementation)
- Presentation of preliminary results at FOSDEM 2027 (February 2027, Brussels)
- Engagement with EU AI Act regulatory sandbox programmes (Spain, France, Netherlands)

**Post-project:**
- Publication on PyPI, Docker Hub, and GitHub with full documentation
- Outreach to European SME associations (Digital SME Alliance, SMEunited) for adoption
- Tutorials and webinars targeting compliance officers and AI engineers
- Publish Article-by-Article walkthrough guides on docs.meok.ai
- Submit to NGI Zero Review for accessibility audit, security audit, and community building support
- Ongoing MCP marketplace maintenance — the compliance suite becomes part of the 246-server MEOK ecosystem

---

## Generative AI Usage Statement

This proposal was drafted with the assistance of generative AI (Anthropic Claude, May 9, 2026) used for document structuring, language refinement, and research synthesis from publicly available NLnet documentation and EU AI Act legal text. All substantive technical content, project design, and compliance domain expertise were provided by the human applicant. The AI served as an editorial assistant, not as the author of the technical strategy or regulatory analysis.

---

**Application prepared by:** Nicholas Templeman, MEOK AI Labs  
**Date:** May 9, 2026  
**Contact:** nicholas@meok.ai  
**GitHub:** https://github.com/CSOAI-ORG  
**PyPI:** https://pypi.org/user/meok-ai/  

---

## Appendix: Map to NLnet Web Form Fields

For ease of submission to the [online application form](https://nlnet.nl/propose/), the sections above map to form fields as follows:

| Form Field | Section in This Document |
|---|---|
| Proposal name | Section 1 |
| Abstract | Section 2 + Section 5.1 (combined for submission) |
| Requested amount + budget | Sections 3, 7 |
| Have you been involved with relevant projects? | Section 8 (team + previous contributions) |
| What will requested budget be used for? | Section 6 (work packages), Section 7 (budget) |
| Compare with existing efforts | Section 5.4, "Comparison" section |
| Technical challenges | "Technical Challenges and Mitigations" section |
| Ecosystem & promotion | Section 5.7 (sustainability), "Ecosystem Engagement" section |
| Attachments | Section 9 (links to existing work) |
| Generative AI usage | Generative AI Usage Statement (final section) |
