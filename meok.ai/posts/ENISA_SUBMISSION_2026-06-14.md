# ENISA reference implementation submission — 2026-06-14

## Project name
MEOK Compliance MCP Fleet

## Project URL
https://github.com/CSOAI-ORG
https://meok.ai
https://pypi.org/project/nis2-compliance-mcp/

## Maintainer
MEOK AI Labs (CSOAI Ltd UK 16939677) — Nicholas Templeman

## License
MIT

## Description
MEOK is a fleet of 340+ standalone MCP (Model Context Protocol) servers implementing EU cybersecurity and AI compliance tooling. Direct ENISA-relevant coverage:

- `nis2-compliance-mcp` — NIS2 (Directive EU 2022/2555) Article 21 + 23 compliance, entity classification, 10 measures audit, incident reporting
- `cra-compliance-mcp` — Cyber Resilience Act (Regulation EU 2024/2847) — product cybersecurity
- `dora-compliance-mcp` — DORA (Regulation EU 2022/2554) — financial sector ICT third-party register
- `eu-ai-act-compliance-mcp` — 410 articles, deterministic risk-class detector, 4-class framework

**Why it's a reference implementation**:
- Every package embeds the **actual** regulation text (EUR-Lex), not paraphrases
- Each carries a hash-chained HMAC-signed audit trail
- All flagships are OpenSSF Best Practices compliant (CODEOWNERS, dependabot, codeql, scorecard, cosign)
- Every tool has a public, unauthenticated `/verify` endpoint at proofof.ai/verify

**Why this matters for ENISA**:
- The EU regulatory stack (NIS2 + CRA + DORA + EU AI Act) is converging. MEOK treats them as a single compliance surface.
- The 4-class risk framework (unacceptable / high / limited / minimal) maps directly to ENISA's threat taxonomy.
- The BFT (Byzantine Fault Tolerant) Council substrate is a runnable implementation of decentralized governance for AI systems.

## Adoption
- 340+ servers
- 5,000+ PyPI downloads/week
- 299/340 in the official MCP registry
- 50+ public repos on CSOAI-ORG

## Contact
hello@meok.ai · UK Companies House 16939677
