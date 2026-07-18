# Show HN draft — 2026-06-13

## Title
Show HN: MEOK Compliance MCP Fleet — 340+ Regulation-as-Code Servers

## Body
Hi HN,

Solo founder here (MEOK AI Labs / CSOAI Ltd, Yorkshire UK). I've spent the last 8 months shipping a fleet of 340+ MCP servers — one server per regulation (EU AI Act 410 articles, DORA, NIS2, CRA, GDPR, ISO 42001, SOC 2, PCI DSS, HIPAA, FDA, MDR, AIDA, etc.).

Each server is a standalone PyPI package (`pip install <name>`) with:
- The actual regulation text (EUR-Lex / FDA / NIST, not paraphrases)
- A deterministic risk-class detector
- A hash-chained HMAC-signed audit trail
- Full OpenSSF Best Practices wiring (CODEOWNERS, dependabot, codeql, scorecard, cosign signing)

Why one server per regulation, not one big package?
- Agents install only what they need (Article 13 IFU != Article 27 FRIA)
- Independent versioning per regulation
- Independent security audit per package

Why now?
- EU AI Act Article 50 transparency/watermark cliff is 2 August 2026 (60 days)
- DORA ICT third-party register is in production
- The 4-class risk framework (unacceptable / high / limited / minimal) needs tooling

What's installed today (299 of 340 in the official MCP registry):
```
pip install eu-ai-act-compliance-mcp    # 410 articles, FTS5
pip install dora-compliance-mcp         # DORA 2022/2554
pip install gdpr-compliance-ai-mcp      # DPIA + Art 33 + SCCs
pip install iso-42001-ai-mcp            # AI Management System
pip install fda-samd-mcp                # FDA 510(k) for AI/ML
```

Every server.py is wired with a live `/verify` meter at proofof.ai/verify — pay-as-you-go, metered, no account required for the first 200 calls/day.

Org: https://github.com/CSOAI-ORG (50+ public repos)
Site: https://meok.ai
Scorecard: https://proofof.ai/scorecard
Companies House: 16939677

I built this because I couldn't find compliance MCPs that referenced the actual regulation text. Every other one I tried was a thin wrapper around a ChatGPT prompt. The EU AI Act alone has 410 articles — you can't just say "is this compliant?" without anchoring to the actual text.

License: MIT (all packages)

Happy to answer questions about the architecture, the metering, the PBFT council substrate, or the EU AI Act cliff specifically.
