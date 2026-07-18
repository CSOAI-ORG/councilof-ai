# Awesome MEOK MCP Servers

[![Awesome](https://awesome.re/badge.svg)](https://awesome.re)

> A curated list of 341+ MCP (Model Context Protocol) servers for AI agent compliance, governance, audit, attestation, and production-grade infrastructure. Built by [MEOK AI Labs](https://meok.ai).

MEOK AI Labs ships one MCP server per regulation, framework, or workflow — so your agent can reference the actual text, perform deterministic lookups, and produce audit-ready evidence packs. Every server is MIT-licensed, PyPI-installable, and registered in the official MCP registry.

## Contents

- [Compliance & Regulation](#compliance--regulation)
- [Governance, Audit & Attestation](#governance-audit--attestation)
- [Industry & Sector](#industry--sector)
- [Developer & Engineering](#developer--engineering)
- [Data, Search & Knowledge](#data-search--knowledge)
- [Identity, Trust & Security](#identity-trust--security)
- [Agent Infrastructure](#agent-infrastructure)

---

## Compliance & Regulation

The EU AI Act cliff is **2 August 2026** (pre-existing systems: 2 December 2026). MEOK ships MCPs for every major regulation your agent might need to reference.

### EU AI Act

- [eu-ai-act-compliance-mcp](https://pypi.org/project/eu-ai-act-compliance-mcp/) — 410 articles from EUR-Lex via FTS5 search. Instant risk scan, deterministic class detection, evidence pack export. **1,287 downloads/week.**
- [meok-eu-ai-act-art-13-ifu-mcp](https://pypi.org/project/meok-eu-ai-act-art-13-ifu-mcp/) — Article 13 Instructions for Use drafting
- [meok-eu-ai-act-art-26-fria-mcp](https://pypi.org/project/meok-eu-ai-act-art-26-fria-mcp/) — Article 26 Fundamental Rights Impact Assessment

### DORA (Digital Operational Resilience Act)

- [dora-compliance-mcp](https://pypi.org/project/dora-compliance-mcp/) — DORA Regulation (EU) 2022/2554 compliance. ICT risk, third-party, incident reporting. **LIVE since 17 Jan 2025. 1,186 downloads/week.**
- [dora-nis2-crosswalk-mcp](https://pypi.org/project/dora-nis2-crosswalk-mcp/) — DORA ↔ NIS2 cross-reference table

### NIS2 (Network and Information Security Directive 2)

- [nis2-compliance-mcp](https://pypi.org/project/nis2-compliance-mcp/) — 160k entities, 18 sectors. **LIVE since 18 Oct 2024.**
- [meok-nis2-de-register-mcp](https://pypi.org/project/meok-nis2-de-register-mcp/) — German NIS2 national implementation register

### CRA (Cyber Resilience Act)

- [cra-compliance-mcp](https://pypi.org/project/cra-compliance-mcp/) — Regulation (EU) 2024/2847. **Cliff 11 Dec 2027.**
- [meok-cra-annex-iv-classifier-mcp](https://pypi.org/project/meok-cra-annex-iv-classifier-mcp/) — CRA Annex IV technical documentation classifier

### GDPR

- [gdpr-compliance-ai-mcp](https://pypi.org/project/gdpr-compliance-ai-mcp/) — DPIA + Art 33 + SCCs. 980 downloads/week.

### ISO 42001 / 27001

- [iso-42001-ai-mcp](https://pypi.org/project/iso-42001-ai-mcp/) — ISO/IEC 42001 AI Management System
- [iso-27001-ai-mcp](https://pypi.org/project/iso-27001-ai-mcp/) — ISO/IEC 27001 ISMS

### Other regulations

- [csrd-compliance-mcp](https://pypi.org/project/csrd-compliance-mcp/) — CSRD / ESRS sustainability reporting
- [hipaa-compliance-mcp](https://pypi.org/project/hipaa-compliance-mcp/) — HIPAA healthcare
- [canada-aida-ai-mcp](https://pypi.org/project/canada-aida-ai-mcp/) — Canada AIDA
- [fda-samd-mcp](https://pypi.org/project/fda-samd-mcp/) — FDA SaMD 510(k)
- [cqc-compliance-mcp](https://pypi.org/project/cqc-compliance-mcp/) — UK CQC care homes

## Governance, Audit & Attestation

The trust stack for AI agent decisions.

- [agent-audit-logger-mcp](https://pypi.org/project/agent-audit-logger-mcp/) — Hash-chained HMAC-signed audit log for A2A (agent-to-agent) calls
- [ai-self-audit-mcp](https://pypi.org/project/ai-self-audit-mcp/) — Self-audit + signed certificate
- [ai-bom-mcp](https://pypi.org/project/ai-bom-mcp/) — AI Bill of Materials in CycloneDX format
- [explainability-report-mcp](https://pypi.org/project/explainability-report-mcp/) — EU AI Act Article 13 explainability
- [bias-detection-mcp](https://pypi.org/project/bias-detection-mcp/) — Fairness / bias detection
- [meok-attestation-verify](https://pypi.org/project/meok-attestation-verify/) — Hardware root-of-trust
- [firmware-attestation-mcp](https://pypi.org/project/firmware-attestation-mcp/) — Firmware attestation, NSA-ANT-class checks
- [ai-incident-reporting-mcp](https://pypi.org/project/ai-incident-reporting-mcp/) — Article 73 + NIS2 incident reporting

## Industry & Sector

Domain-specific MCPs for vertical AI agents.

- [haulage-uk-compliance-mcp](https://pypi.org/project/haulage-uk-compliance-mcp/) — UK haulage compliance + DVSA
- [meok-tacho-audit-mcp](https://pypi.org/project/meok-tacho-audit-mcp/) — Tachograph audit
- [crane-hire-cpcs-mcp](https://pypi.org/project/crane-hire-cpcs-mcp/) — CPCS crane operator compliance
- [care-home-cqc-mcp](https://pypi.org/project/care-home-cqc-mcp/) — UK CQC care homes
- [meok-soil-assoc-organic-aqua-mcp](https://pypi.org/project/meok-soil-assoc-organic-aqua-mcp/) — Soil Association organic aquaculture

## Developer & Engineering

- [a2a-governance-bridge-mcp](https://pypi.org/project/a2a-governance-bridge-mcp/) — A2A (agent-to-agent) governance bridge
- [agent-negotiation-mcp](https://pypi.org/project/agent-negotiation-mcp/) — Multi-agent negotiation
- [agent-policy-enforcement-mcp](https://pypi.org/project/agent-policy-enforcement-mcp/) — Agent policy enforcement
- [agent-mcp-router-mcp](https://pypi.org/project/agent-mcp-router-mcp/) — One router for the whole MEOK fleet
- [agent-commerce-protocol-mcp](https://pypi.org/project/agent-commerce-protocol-mcp/) — A2A commerce protocol
- [ci-cd-generator-ai-mcp](https://pypi.org/project/ci-cd-generator-ai-mcp/) — CI/CD pipeline generator
- [dockerfile-generator-ai-mcp](https://pypi.org/project/dockerfile-generator-ai-mcp/) — Dockerfile generator
- [ad-copy-ai-mcp](https://pypi.org/project/ad-copy-ai-mcp/) — Ad copy generation
- [budget-planner-ai-mcp](https://pypi.org/project/budget-planner-ai-mcp/) — Budget planning
- [workout-planner-ai-mcp](https://pypi.org/project/workout-planner-ai-mcp/) — Workout planning
- [translator-pro-ai-mcp](https://pypi.org/project/translator-pro-ai-mcp/) — Translation
- [clipboard-ai-mcp](https://pypi.org/project/clipboard-ai-mcp/) — Clipboard bridge
- [database-universal-mcp](https://pypi.org/project/database-universal-mcp/) — Universal DB
- [data-science-ai-mcp](https://pypi.org/project/data-science-ai-mcp/) — Data science
- [cobol-bridge-mcp](https://pypi.org/project/cobol-bridge-mcp/) — COBOL bridge
- [planthire-ai-mcp](https://pypi.org/project/planthire-ai-mcp/) — Plant hire UK
- [skip-hire-ai-mcp](https://pypi.org/project/skip-hire-ai-mcp/) — Skip hire UK
- [hr-management-ai-mcp](https://pypi.org/project/hr-management-ai-mcp/) — HR management
- [marketing-analytics-ai-mcp](https://pypi.org/project/marketing-analytics-ai-mcp/) — Marketing analytics
- [plagiarism-checker-ai-mcp](https://pypi.org/project/plagiarism-checker-ai-mcp/) — Plagiarism detection
- [eudi-wallet-mcp](https://pypi.org/project/eudi-wallet-mcp/) — EUDI wallet
- [firmware-attestation-mcp](https://pypi.org/project/firmware-attestation-mcp/) — Firmware attestation
- [meok-aquaponics-monitor-mcp](https://pypi.org/project/meok-aquaponics-monitor-mcp/) — Aquaponics monitor
- [memory-search-mcp](https://pypi.org/project/memory-search-mcp/) — Memory search
- [gos-claim-validator-mcp](https://pypi.org/project/gos-claim-validator-mcp/) — GOS claim validator
- [meok-rail-freight-uk-mcp](https://pypi.org/project/meok-rail-freight-uk-mcp/) — UK rail freight
- [meok-rspca-aquaculture-mcp](https://pypi.org/project/meok-rspca-aquaculture-mcp/) — RSPCA aquaculture

## Data, Search & Knowledge

- [vector-knowledge-graph-mcp](https://pypi.org/project/vector-knowledge-graph-mcp/) — Vector + knowledge graph
- [encoder-ai-mcp](https://pypi.org/project/encoder-ai-mcp/) — Encoder
- [keyword-extractor-ai-mcp](https://pypi.org/project/keyword-extractor-ai-mcp/) — Keyword extraction
- [sentiment-analysis-ai-mcp](https://pypi.org/project/sentiment-analysis-ai-mcp/) — Sentiment analysis

## Identity, Trust & Security

- [agent-identity-trust-mcp](https://pypi.org/project/agent-identity-trust-mcp/) — Agent identity & trust
- [fda-samd-mcp](https://pypi.org/project/fda-samd-mcp/) — FDA SaMD

## Agent Infrastructure

- [meok-council](https://pypi.org/project/meok-council/) — 36-node PBFT council substrate (2f+1=23 threshold)
- [sovereign-temple](https://pypi.org/project/sovereign-temple/) — Local AI brain runtime
- [meok-sdk-py](https://pypi.org/project/meok-sdk-py/) — Python SDK
- [mcpize-submissions](https://github.com/CSOAI-ORG/mcpize-submissions) — Public MCP marketplace submissions
- [mcp-scorecard-mcp](https://pypi.org/project/mcp-scorecard-mcp/) — MCP fleet scorecard

---

## Why MEOK MCPs

- **One server per regulation.** No paraphrasing — references the actual EUR-Lex / NIST / FFIEC / FDA text.
- **Deterministic.** Same input → same output. Suitable for compliance evidence packs and regulator review.
- **Audit-ready.** Every call is hash-chained, signed, and logged. Integrates with `agent-audit-logger-mcp`.
- **Agent-native.** Tools are first-class. Your agent can call them by name, pass arguments, use results in subsequent steps.
- **Free tier.** 200 calls/day on `meok.ai` without an API key. 50,000/day with a key (subject to fair use).

## Get involved

- **Browse:** [meok.ai](https://meok.ai)
- **PyPI:** [pypi.org/user/MEOK-AI-Labs](https://pypi.org/user/MEOK-AI-Labs/)
- **Source:** [github.com/CSOAI-ORG](https://github.com/CSOAI-ORG) (50+ repos)
- **Council substrate:** [meok-council :3200](https://meok.ai/meok-council) (36 nodes, 11 domains)
- **Issues / discussion:** Use GitHub Issues on the relevant repo

## Contributing

This list is maintained by [MEOK AI Labs](https://meok.ai). To add a new MEOK MCP, open a PR with the package name, PyPI link, GitHub repo, and a 1-line description.

## Disclaimer

MEOK MCPs are tooling for engineering and compliance teams. They do not constitute legal advice. For final compliance decisions, consult qualified counsel in your jurisdiction.
