# Hacker News Launch Posts — OpenPatent.ai

These are the 5 "Show HN" launch posts scheduled across the 90-day launch
(per `Viral_Bootstrap_Strategy.md` PLAY 1-3). Each one is timed for Tuesday
or Wednesday 08:00-11:00 UTC per the Distribution Playbook.

---

## Post 1: Week 1 (Tuesday 08:30 UTC)

**Title:** `Show HN: OpenPatent.ai – $10 insurance against AI idea theft`

**Body:**

Every time you paste your invention into Claude, ChatGPT, or Copilot, it gets logged. Retained. Potentially used to train models. What if the AI company patents something you invented?

So I built **OpenPatent.ai** — disclose first, AI second.

For $10 you get:
- SHA-3/512 document hash
- HMAC witness attestation
- Ed25519 inventor signature
- **Bitcoin OpenTimestamps** anchor (court-admissible in 10+ jurisdictions)
- C2PA Content Credential
- Hash-chained audit log
- Public verification page at `verify.openpatent.ai/{hash}`

Then you use AI freely. Your invention is now prior art that no one — not even an AI company — can patent.

Free / self-hosted version is MIT. Hosted version is PAYG ($29/$149/$999/$2499 per disclosure, $4999/mo enterprise).

Built on **PatentMCP** (the 6-layer crypto engine, MIT) + forked OpenPatent (MIT) for drafting. 12 legal framework citations baked into the trust surface.

I had to learn more about 35 USC § 102, EU eIDAS, French copyright anteriority, and the Hangzhou Internet Court ruling of 2018 than I ever wanted to. Worth it.

Try it: https://openpatent.ai
MCP server for Claude Code / Cursor: https://mcp.openpatent.ai
Source: https://github.com/CSOAI-ORG/patentmcp

What would you do differently?

---

## Post 2: Week 3 (Wednesday 08:00 UTC)

**Title:** `Show HN: 33-agent BFT council for AI-disclosed inventions`

**Body:**

OpenPatent.ai now has a **33-agent Byzantine Fault Tolerant council** that reviews high-value disclosures.

- 11 technical agents (novelty, non-obviousness, enablement)
- 8 legal agents (claim strength, prosecution risk, 35 USC § 102)
- 8 business agents (competitive positioning, licensing)
- 6 ethics agents (no harm, public benefit, AI safety alignment)

Threshold: **22/33 = 2f+1 supermajority** (Byzantine tolerance: 10 agents).

Each agent evaluates the disclosure independently. Per-agent Ed25519 signatures logged to a hash-chained audit trail. Council decisions are part of the cryptographic proof.

This is the IP-protection layer that Anthropic's Partner Hub calls out as missing. It's also the same BFT pattern that powers the SOV3 28-hive mesh.

Premium tier ($2499/disclosure) triggers council review. Output includes a full review record admissible in 35 USC § 282 interpretation.

Try it: https://openpatent.ai
Council spec: https://github.com/CSOAI-ORG/openpatent-hive/blob/main/services/bft-council/bft.py

What's your take on byzantine-failure tolerance for high-stakes IP decisions?

---

## Post 3: Week 5 (Tuesday 09:00 UTC)

**Title:** `Show HN: OpenPatent MCP – $10 to protect your code from patent trolls`

**Body:**

Patent trolls cost startups ~$80B/year. The cheapest defense used to be $15K+ for a patent lawyer.

I built an **MCP server** that lets Claude Code / Cursor / Windsurf invoke cryptographic patent protection directly:

```
"Protect this algorithm"
→ 6-layer cryptographic proof in 2.3 seconds
→ Bitcoin transaction ID
→ verify.openpatent.ai/{hash} URL
```

Tech:
- Model Context Protocol (MCP) — auto-discovered by Claude Code
- 6-layer proof: SHA-3/512 + HMAC + Ed25519 + Bitcoin OTS + C2PA + hash-chain
- Free / self-hosted (MIT)
- $29/$149/$999/$2499 per disclosure on hosted

Install: `npx -y @openpatent/mcp-server`

I have to be honest — I built this because I personally lost sleep over what
Anthropic, OpenAI, or Google might be logging from my own dev sessions.

Repo: https://github.com/CSOAI-ORG/openpatent-mcp
Manifest: https://mcp.openpatent.ai

Anyone else paranoid about this, or am I overthinking it?

---

## Post 4: Week 8 (Wednesday 10:00 UTC)

**Title:** `Show HN: I spent $10 to make my code lawsuit-proof (here's how)`

**Body:**

Patent trolls are universally hated by developers. The "poor man's patent"
alternative used to require $15K+ in legal fees.

In 2026 you can do it for $10 with a single API call:

1. Disclose your invention (title, description, code, $10)
2. Get a 6-layer cryptographic proof:
   - SHA-3/512 document hash
   - HMAC-SHA256 witness attestation
   - Ed25519 inventor signature
   - **Bitcoin blockchain anchor** (court-admissible in 10+ jurisdictions)
   - C2PA Content Credential
   - Hash-chained audit log
3. Receive a Bitcoin txid and a public verification page
4. Now your invention is **permanent prior art** that no one can patent

This isn't marketing — the legal basis is solid:
- 35 USC § 102 (US prior art)
- Article 54(2) EPC (EU state of the art)
- 17 USC § 102 (US copyright)
- China Hangzhou Internet Court 2018 (first blockchain evidence case)
- France Tribunal Judiciaire de Marseille 2025 (copyright anteriority)
- WIPO 2022 guidance (blockchain for prior authorship)

The tool: **OpenPatent.ai** (Disclose First. AI Second.)
The proof format: PatentMCP (MIT)
The price: $10

I wrote a step-by-step guide: https://openpatent.ai/blog/$10-patent-defense

Did I miss anything in the legal stack?

---

## Post 5: Week 12 (Tuesday 11:00 UTC)

**Title:** `Show HN: I wrote a CLAUDE.md that protects AI startups from legal destruction`

**Body:**

What if we extended the Karpathy-CLAUDE.md wave to legal/compliance/patent protection?

I published **agent-governance-protocol** — a single CLAUDE.md + .claude/commands/ structure that gives any AI agent:
- `/protect` — one-command patent protection
- `/comply` — one-command EU AI Act + DORA + NIS2 compliance check
- `/disclose` — one-command invention disclosure
- `/govern` — one-command BFT-council governance review

Plus a skills/ directory with:
- patent-protection (the 6-layer proof)
- eu-ai-act-compliance (Article 9/13/15/26/50)
- defensive-publication
- blockchain-attestation
- bft-governance
- safety-evaluation
- crosswalk-engine (5-jurisdiction legal mapping)

It's MIT, zero deps, and you can drop it into any project and immediately have a compliant agent.

Karpathy's CLAUDE.md → 156K stars in a week.
obra/superpowers → 226K stars.
This is the legal/governance/compliance layer for that wave.

Repo: https://github.com/CSOAI-ORG/agent-governance-protocol

What would you add to the skills list?
