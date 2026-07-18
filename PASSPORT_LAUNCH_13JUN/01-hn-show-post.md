Show HN: Agent Compliance Passport – Signed, portable identity for AI agents

Hi HN,

I built a tiny MCP server that issues Ed25519-signed "passports" to AI agents
and lets any other agent verify them offline before transacting. No network,
no central registry, no permission needed.

The problem: agents are about to do billions of dollars of transactions
with each other (A2A, MCP marketplaces, agent-to-agent payments). But
there's no way for Agent A to know if Agent B is actually GDPR-compliant
or EU AI Act Article 50-ready before wiring it money or trusting its output.

The passport fixes that. It carries:
- DID-style agent identity
- A list of frameworks the agent claims to comply with (EU AI Act,
  Article 50, GDPR, HIPAA, SOC 2, ISO 42001, NIST AI RMF, CRA, DORA, NIS2)
- A per-claim status (compliant / in_review / non_compliant)
- An Ed25519 signature from a known issuer

The verify tool is 100% offline — you ship the passport JSON plus the
issuer's public key, no API call. The exchange_credentials tool does
the A2A handshake: "I'm passport X, you're passport Y, here's what
we can do together."

Why now: EU AI Act Article 50 cliff = 2 Aug 2026 (49 days). Every
developer shipping an AI agent into the EU needs a way to PROVE
their agent is marked, watermarked, and disclosed. This passport
is the only signed-and-verifiable primitive for that.

GitHub: https://github.com/CSOAI-ORG/meok-compliance-passport-mcp
PyPI: pip install meok-compliance-passport-mcp
3 tools, 14 tests passing, 7 files, 28KB of code.

The brand spine: "In a world of unverifiable AI claims, we sell the
auditor's math." The verify URL is the cultural moment.

Happy to answer questions about the crypto choice (Ed25519, not HMAC,
because verify-offline matters more than symmetric speed), the
framework coverage (why we chose 11, not all 50+), and the A2A
handshake design (why we didn't use OAuth2 or JWT-X5C).

— Nick Templeman, MEOK AI Labs
