Subject: Open source — the missing A2A primitive, 49 days before the EU cliff

Hi {first_name},

EU AI Act Article 50 kicks in on 2 Aug 2026 — 49 days from today.

For every new generative AI system shipped into the EU, three requirements become law:
1. Mark all AI-generated content (C2PA + watermark)
2. Disclose AI involvement
3. Remain human-oversightable

The unanswered question is: how does Agent B on the other side of a transaction KNOW that Agent A meets that bar?

Today we're shipping the missing primitive: the Agent Compliance Passport.

It's an open-source MCP server (3 tools, 14 tests, 7 files, 28KB of code) that:
- Issues Ed25519-signed "passports" to AI agents
- Verifies them offline (100% offline, no API call)
- Does the A2A handshake between two agents

A passport carries the agent's DID-style identity, a list of 11 compliance frameworks (EU AI Act, Article 50, GDPR, HIPAA, SOC 2, ISO 42001, NIST AI RMF, CRA, DORA, NIS2, GPAI Code of Practice), and per-claim status — all signed with Ed25519.

The verify tool is 100% offline. You ship the passport JSON plus the issuer's public key, run Ed25519, return valid/invalid. No "trust the vendor". No "rate-limited API". No "depends who's asking".

We've been building the MEOK AI compliance fleet for 12 months — 460 GitHub repos, 294 servers in the official MCP registry, 6,798 monthly installs, 6 trained neural networks in the SOV3 substrate. The passport is the missing primitive the whole stack needed.

This is also the position we'd love your editorial perspective on:

"In a world of unverifiable AI claims, we sell the auditor's math."

The signed attestation isn't a feature — it's the cultural moment. As the A2A economy takes shape over the next 18 months, the question of WHO YOU TRUST to attest WHAT an agent is and isn't authorised to do becomes existential. We're betting it's the math, not the marketing department.

Three things you can do:

1. Try it (6 lines of code): `pip install meok-compliance-passport-mcp`
2. Cover the story (we have a press kit, demo video, and a 30-min interview slot)
3. Quote us (we're available at press@meok.ai for embargoed coverage before 2 Aug 2026)

GitHub: https://github.com/CSOAI-ORG/meok-compliance-passport-mcp
PyPI: pip install meok-compliance-passport-mcp

Happy to send a 90-second demo video, the security paper, or jump on a call.

Best,
Nick Templeman
Founder, MEOK AI Labs
CSOAI LTD · UK Companies House 16939677
press@meok.ai · https://meok.ai
