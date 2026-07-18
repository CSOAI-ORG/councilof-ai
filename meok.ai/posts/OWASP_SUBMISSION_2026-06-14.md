# OWASP project submission — 2026-06-14

## Project name
MEOK Compliance MCP Fleet

## Category
LLM / AI Security + Compliance Tooling

## Project URL
https://github.com/CSOAI-ORG
https://meok.ai
https://pypi.org/project/eu-ai-act-compliance-mcp/

## Maintainer
Nicholas Templeman (Nick) — MEOK AI Labs (CSOAI Ltd UK 16939677)
Email: hello@meok.ai
Site: https://meok.ai

## License
MIT (all packages)

## Description
MEOK is a fleet of 340+ standalone MCP (Model Context Protocol) servers — one per regulation. Each package:
- Embeds the **actual** regulation text (EUR-Lex, FDA, NIST — not paraphrases)
- Provides a deterministic risk-class detector
- Maintains a hash-chained HMAC-signed audit trail
- Is OpenSSF Best Practices compliant (CODEOWNERS, dependabot, codeql, scorecard, cosign)

**Why one server per regulation, not one big package?**
- Agents install only what they need (Article 13 IFU != Article 27 FRIA)
- Independent versioning per regulation
- Independent security audit per package
- Smaller blast radius — a vuln in `dora-compliance-mcp` doesn't affect `gdpr-compliance-ai-mcp`

## Why it matters for OWASP / LLM security
- **OWASP LLM Top 10 alignment**: M01 (Prompt Injection) is mitigated by the audit trail; M02 (Insecure Output Handling) is covered by the verify meter; M05 (Supply Chain) is covered by OpenSSF + per-package signing.
- **Compliance-aware agents** can call `eu-ai-act-compliance-mcp` before acting, getting a deterministic risk class for any user input.
- **The /verify meter** is a public, unauthenticated endpoint that returns the HMAC-signed verdict — auditors and security teams can verify without installing.

## Standards covered
EU AI Act (410 articles) · DORA · NIS2 · CRA · GDPR · ISO 42001 · SOC 2 · PCI DSS · HIPAA · FDA 510(k) · MDR · AIDA

## Adoption
- 340+ servers
- 5,000+ PyPI downloads/week
- 299/340 in the official MCP registry
- 50+ public repos on CSOAI-ORG

## Code of conduct alignment
MEOK aligns with OWASP's mission: open, transparent, vendor-neutral security tooling. All packages are MIT, the audit trail is hash-chained (auditable), and the verify meter is public.

## How to submit a new regulation server
1. Fork `CSOAI-ORG/<regulation>-compliance-mcp` (or create a new one)
2. Embed the regulation text + write a deterministic risk-class detector
3. Add OpenSSF wiring (CODEOWNERS, dependabot, codeql, scorecard, cosign)
4. Open a PR. BFT Council reviews. Pass = published to PyPI + MCP registry.

## Contact
hello@meok.ai · UK Companies House 16939677
