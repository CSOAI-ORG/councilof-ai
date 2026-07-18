## r/MCPservers

**Title:** I built an Agent Compliance Passport MCP — Ed25519-signed credentials any agent can verify offline

**Body:**

I just shipped this and I think it might be the missing primitive for the A2A economy.

It's a tiny MCP server (3 tools, 14 tests, 7 files, 28KB) that lets you:

1. **issue_passport(agent_id, agent_type, frameworks, claims)** — returns a signed JSON passport
2. **verify_passport(passport)** — 100% offline Ed25519 verification, no network call
3. **exchange_credentials(agent_a, agent_b)** — A2A handshake: "I'm passport X, you're passport Y, here's what we can do together"

Coverage: EU AI Act, Article 50, GDPR, HIPAA, SOC 2, ISO 42001, NIST AI RMF, CRA, DORA, NIS2, GPAI Code of Practice.

Why I built it: EU AI Act Article 50 cliff = 2 Aug 2026 (49 days). Every agent shipped into the EU needs a way to prove it's marked/watermarked/disclosed. A signed passport is the only primitive I could find that does this with no central authority.

GitHub: https://github.com/CSOAI-ORG/meok-compliance-passport-mcp
PyPI: `pip install meok-compliance-passport-mcp`

The whole thing is 6 lines to use:

```python
from meok_compliance_passport_mcp import issue_passport, verify_passport
passport = issue_passport(agent_id="my-agent", agent_type="llm_agent", frameworks={"eu_ai_act": {"article_50": "compliant"}})
assert verify_passport(passport)
```

Open to feedback on the schema, the framework list, and the A2A handshake design.

---

## r/LocalLLaMA

**Title:** Agent Compliance Passport — Ed25519-signed credentials for local models serving regulated workloads

**Body:**

If you're running a local LLM and serving it into a regulated workflow (HIPAA, GDPR, EU AI Act), the question is: how does the downstream service know your local model is actually compliant?

I just shipped an open-source MCP server (MIT, 7 files, 14 tests) that issues Ed25519-signed "passports" to agents and lets any other agent verify them offline.

Why this matters for local LLM folks:
- A passport signed by your self-hosted attestation key proves the agent was running on a particular model + prompt + guardrail stack
- The verifier is 100% offline — no need to call home
- Article 50 (2 Aug 2026) requires "human-oversightable" — a passport that includes your local human-oversight configuration is a receipt

3 tools, 6 lines of code to issue+verify, MIT licensed.

GitHub: https://github.com/CSOAI-ORG/meok-compliance-passport-mcp
PyPI: pip install meok-compliance-passport-mcp

---

## r/ArtificialIntelligence

**Title:** [Discussion] The missing primitive for the A2A economy: signed, portable, offline-verifiable agent identity

**Body:**

The A2A / agentic-AI conversation is dominated by capability (what can agents DO) and orchestration (how do they coordinate). Almost nobody is talking about IDENTITY — how Agent B trusts that Agent A is what it claims to be.

I think this is the binding constraint. Without signed, portable, offline-verifiable credentials, you can't have:
- Per-call billing (who do you charge?)
- Compliance hand-off (Article 50, GDPR, HIPAA all need it)
- Trust in multi-agent pipelines (what was the upstream agent trained NOT to do?)

I just shipped an open-source MCP server that does exactly this — 3 tools, Ed25519 signed, 100% offline verifiable.

Full writeup + the wedge thesis: https://github.com/CSOAI-ORG/meok-compliance-passport-mcp

Curious what the community thinks about the A2A trust problem. Is signed identity the missing primitive, or am I missing something?

---

## r/europrivacy

**Title:** Agent Compliance Passport — open-source primitive for EU AI Act Article 50 (2 Aug 2026 deadline)

**Body:**

49 days. That's what we have until Article 50 kicks in for new generative AI systems in the EU.

The requirement: mark AI content (C2PA + watermark), disclose AI, remain human-oversightable.

The unsolved problem: how does a regulated entity verify an AI agent meets that bar before transacting with it?

I just shipped the missing primitive. It's called the Agent Compliance Passport — an open-source MCP server that issues Ed25519-signed passports to agents and lets any other agent verify them offline.

The passport is just signed JSON:

```
{
  "did": "did:meok:7f3a...",
  "agent_type": "llm_agent",
  "frameworks": {
    "eu_ai_act": {"article_50": "compliant"},
    "gdpr": {"article_22": "compliant"}
  },
  "issuer": "meok.ai",
  "issued_at": "2026-06-13",
  "expires_at": "2027-06-13",
  "signature": "<Ed25519 128 hex chars>"
}
```

Verifier is 100% offline (no API call, no rate limit, no vendor lock-in).

7 files, 14 tests, MIT licensed.

GitHub: https://github.com/CSOAI-ORG/meok-compliance-passport-mcp
