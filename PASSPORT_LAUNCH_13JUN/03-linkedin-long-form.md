The Agent Compliance Passport: A signed, portable, offline-verifiable credential for AI agents.

49 days from now, EU AI Act Article 50 kicks in for every new generative AI system shipped into the European Union.

The requirement is clear:
→ Mark all AI-generated content (C2PA + watermark)
→ Disclose AI involvement
→ Remain human-oversightable

But here's the question nobody in the compliance space has answered yet:

How does Agent B on the other side of a transaction KNOW that Agent A meets that bar?

Not "trust the vendor's marketing page." Not "read their 47-page SOC 2 report." Cryptographically know — in milliseconds, offline, with no network call.

Today we're shipping the missing primitive: the Agent Compliance Passport.

It's an open-source MCP server (3 tools, 14 tests, 7 files, 28KB of code) that:
1. Issues Ed25519-signed passports to agents (issuer side)
2. Verifies them offline (auditor side, 100% offline, no API call)
3. Does the A2A handshake between two agents (exchange_credentials)

A passport carries:
- DID-style agent identity
- 11 frameworks (EU AI Act, Article 50, GDPR, HIPAA, SOC 2, ISO 42001, NIST AI RMF, CRA, DORA, NIS2, GPAI CoP)
- Per-claim status (compliant / in_review / non_compliant)
- Expiry + issuer signature

The verifier ships the passport JSON + the issuer's public key, runs Ed25519, returns valid/invalid. That's it. No "trust us" loop. No "rate-limited API". No "depends who's asking".

Why this matters beyond the EU deadline:
→ MCP marketplaces need agent identity to charge per-call
→ A2A payments need signed credentials to authorise a wire
→ Multi-agent pipelines need to know what the upstream agent was trained NOT to do
→ GRC partners need a primitive they can resell

We're open-sourcing it under MIT, 7 files, all 14 tests pass.

The strategic frame: "In a world of unverifiable AI claims, we sell the auditor's math." The signed attestation isn't a feature — it's the cultural moment.

49 days. 1 farm. 1 person. 460 repos. 6,798 monthly installs.

If you're building agents that touch money, data, or humans — this is the receipt.

GitHub: github.com/CSOAI-ORG/meok-compliance-passport-mcp
PyPI: pip install meok-compliance-passport-mcp

#EUAIAct #AgenticAI #Compliance #MCP #A2A #AISafety #SovereignAI
