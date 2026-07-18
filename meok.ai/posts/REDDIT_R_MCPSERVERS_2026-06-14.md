# Reddit r/MCPservers draft — 2026-06-14

## Title
[MEOK Compliance MCP Fleet] 340+ Regulation-as-Code MCP Servers — EU AI Act 410 articles, DORA, NIS2, CRA, GDPR, ISO 42001, SOC 2, HIPAA, FDA, MDR — all standalone PyPI packages

## Body
Solo founder shipping a regulation-as-code MCP fleet. 340+ servers, one per regulation, each:
- The actual regulation text (EUR-Lex / FDA / NIST, not paraphrases)
- A deterministic risk-class detector
- HMAC-signed hash-chained audit trail
- OpenSSF Best Practices (CODEOWNERS, dependabot, codeql, scorecard, cosign)
- Standalone PyPI package: `pip install <name>`

Why one server per regulation, not one big package? Agents install only what they need. Article 13 IFU != Article 27 FRIA != DORA Art 28. Independent versioning, independent security audit.

Why now? EU AI Act Article 50 (transparency / watermarking) cliff is **2 August 2026 — 49 days out**. DORA ICT third-party register is in production. The 4-class risk framework (unacceptable / high / limited / minimal) needs tooling.

Quick start:
```
pip install eu-ai-act-compliance-mcp    # 410 articles, FTS5
pip install dora-compliance-mcp         # DORA 2022/2554
pip install gdpr-compliance-ai-mcp      # DPIA + Art 33 + SCCs
pip install iso-42001-ai-mcp            # AI Management System
pip install fda-samd-mcp                # FDA 510(k) for AI/ML
```

299/340 in the official MCP registry. Every server has a live `/verify` meter at proofof.ai/verify — 200 free calls/day, no signup.

Org: https://github.com/CSOAI-ORG (50+ public repos)
Site: https://meok.ai
Scorecard: https://proofof.ai/scorecard
License: MIT (all)

Happy to answer any architecture questions — the PBFT council substrate, the hash-chained audit trail, the EUR-Lex scrape pipeline, or the EU AI Act cliff timing.

## Suggested tags
mcp · model-context-protocol · compliance · eu-ai-act · dora · gdpr · open-source · pypl
