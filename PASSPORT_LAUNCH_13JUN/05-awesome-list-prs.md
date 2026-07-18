# Awesome-List PRs — Agent Compliance Passport

## 1. awesome-mcp-servers (punkpeye/awesome-mcp-servers)

PR title: "Add meok-compliance-passport-mcp — signed, portable credentials for AI agents"

Body:
> Adding a new MCP server for the missing A2A primitive: signed, portable, offline-verifiable credentials for AI agents.
>
> **Repo:** https://github.com/CSOAI-ORG/meok-compliance-passport-mcp
> **Category:** Security / Compliance / Identity
> **What it does:** Issues Ed25519-signed "passports" to agents with framework coverage (EU AI Act, Article 50, GDPR, HIPAA, SOC 2, ISO 42001, NIST AI RMF, CRA, DORA, NIS2). Verifier is 100% offline.
> **Why it belongs here:** The A2A economy needs agent identity. This is the smallest primitive that does it without a central authority.
> **3 tools:** issue_passport, verify_passport, exchange_credentials
> **Tests:** 14/14 pass
> **License:** MIT

---

## 2. awesome-ai-agents (e2b-dev/awesome-ai-agents)

PR title: "Add meok-compliance-passport-mcp — A2A identity primitive for agent compliance"

Body:
> Adding an open-source MCP server that solves the A2A trust problem: signed, portable, offline-verifiable credentials for AI agents.
>
> **Why this list:** It's an open-source agent identity primitive. The "agent passport" covers 11 compliance frameworks (EU AI Act, Article 50, GDPR, HIPAA, SOC 2, ISO 42001, NIST AI RMF, CRA, DORA, NIS2, GPAI CoP) and is verified offline with Ed25519.
> **A2A handshake:** exchange_credentials tool lets any two agents authorise each other without a trust broker.
> **Beachhead deadline:** EU AI Act Article 50 = 2 Aug 2026 (49 days). Every agent shipped into the EU needs this primitive.
> **Repo:** https://github.com/CSOAI-ORG/meok-compliance-passport-mcp
> **Install:** `pip install meok-compliance-passport-mcp`
> **License:** MIT

---

## 3. awesome-compliance (different maintainer)

PR title: "Add meok-compliance-passport-mcp — signed agent credentials for AI compliance frameworks"

Body:
> Adding an open-source agent identity primitive for AI compliance teams.
>
> **What it solves:** The "how does Agent B know Agent A is GDPR/HIPAA/EU AI Act compliant before transacting" problem.
> **Coverage:** 11 frameworks including EU AI Act (with Article 50 specific support), GDPR, HIPAA, SOC 2, ISO 42001, NIST AI RMF, CRA, DORA, NIS2, GPAI Code of Practice.
> **Crypto:** Ed25519 signed, 100% offline verification.
> **Why now:** Article 50 cliff is 49 days away (2 Aug 2026). GRC teams need a primitive they can ship to their dev teams TODAY.
> **Repo:** https://github.com/CSOAI-ORG/meok-compliance-passport-mcp
> **License:** MIT
> **Tests:** 14/14 pass

---

## Submission Checklist

- [ ] Fork each awesome-list repo
- [ ] Add entry to relevant section
- [ ] Verify alphabetical order if required
- [ ] Open PR with the body above
- [ ] Don't ping the maintainer more than once
- [ ] Wait 7 days; if no response, comment once

## Why awesome-lists matter

- punkpeye/awesome-mcp-servers: ~3-5k stars, drives most of the MCP install signal
- e2b-dev/awesome-ai-agents: ~6k stars, E2B is a real company, the list has weight
- awesome-compliance: niche but high-intent audience (GRC + dev)

A single inclusion in punkpeye's list has historically driven 200-500 GitHub stars + 1-2k PyPI installs for a new MCP server.
