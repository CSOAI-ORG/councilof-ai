# NIST AI RMF resource submission — 2026-06-14

## Resource name
MEOK Compliance MCP Fleet

## Resource type
Open-source reference implementation / tool

## Resource URL
https://github.com/CSOAI-ORG
https://pypi.org/project/eu-ai-act-compliance-mcp/
https://meok.ai

## Maintainer
MEOK AI Labs (CSOAI Ltd UK 16939677) — Nicholas Templeman

## Description
MEOK is a fleet of 340+ standalone MCP (Model Context Protocol) servers implementing AI compliance tooling aligned with the NIST AI Risk Management Framework (AI RMF 1.0) and its companion profiles (Generative AI Profile, April 2024).

**Mapping to AI RMF functions**:
- **GOVERN**: Each MCP server exposes a `gov_audit_trail` tool that returns a hash-chained HMAC-signed log of all policy decisions made by the agent.
- **MAP**: Context establishment via the `map_risk_class` tool (deterministic, regulation-anchored).
- **MEASURE**: The `verify` meter at proofof.ai/verify returns a measurable, auditable risk score for any AI-generated output.
- **MANAGE**: The BFT (Byzantine Fault Tolerant) Council substrate provides decentralized governance for new feature proposals.

**Crosswalk to ISO/IEC 42001 (AI Management System)**: covered via `iso-42001-ai-mcp`.

**Crosswalk to EU AI Act**: 410 articles of the EU AI Act are embedded verbatim in `eu-ai-act-compliance-mcp` with a deterministic risk-class detector (4 classes: unacceptable / high / limited / minimal).

## Why it's a reference implementation
- **Standards-anchored**: every package embeds the actual regulation text (EUR-Lex, FDA, NIST) — not paraphrases
- **Deterministic**: risk classification is rule-based, not ML — reproducible across runs
- **Auditable**: HMAC-SHA256 hash chain + verify URL at proofof.ai/verify
- **OpenSSF Best Practices**: CODEOWNERS, dependabot, codeql, scorecard, cosign on every flagship
- **MIT licensed**: free for any use, including commercial

## Standards covered
EU AI Act · NIST AI RMF 1.0 · ISO 42001 · GDPR · DORA · NIS2 · CRA · SOC 2 · HIPAA · FDA 510(k) · MDR

## Adoption
- 340+ servers
- 5,000+ PyPI downloads/week
- 50+ public repos
- 0 paying customers > £0 last 24h (honest disclosure)

## Why submit
To give NIST reviewers and the broader AI RMF community a concrete, runnable reference implementation that:
- Anchors AI risk classification to the actual regulation text
- Provides a public, verifiable audit trail
- Maps cleanly to all 4 AI RMF functions
- Is open source and free

## Contact
hello@meok.ai · UK Companies House 16939677
