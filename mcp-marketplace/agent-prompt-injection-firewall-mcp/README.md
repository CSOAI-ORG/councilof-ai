[![MCP Scorecard: 84/100](https://img.shields.io/badge/proofof.ai-84%2F100-5b21b6)](https://proofof.ai/scorecard/agent-prompt-injection-firewall-mcp.html)

> ## 🧱 Part of the MEOK A2A Substrate
>
> This MCP is 1 of 12 agent-to-agent primitives. Run the whole pipeline
> (identity → trust → policy → firewall → rate-limit → handoff → audit
> → governance) as one signed endpoint for **£499/mo** including 100K
> calls — or **£0.0002 per call** pay-as-you-go.
>
> 👉 [meok.ai/a2a](https://meok.ai/a2a) — see the Substrate

# Agent Prompt Injection Firewall MCP


> ## Buy Starter — £29/mo
> **Signed attestations + unlimited audits + email support.**
> 👉 **[Subscribe at meok.ai](https://buy.stripe.com/aFa7sNcgAdQS0ZT1Uc8k91t)** — instant HMAC signing key + Stripe-managed billing.
>
> Free tier remains MIT-licensed and zero-config. Upgrade only when you need signed compliance artefacts for audit.

[![PyPI](https://img.shields.io/pypi/v/agent-prompt-injection-firewall-mcp)](https://pypi.org/project/agent-prompt-injection-firewall-mcp/) [![Python](https://img.shields.io/pypi/pyversions/agent-prompt-injection-firewall-mcp)](https://pypi.org/project/agent-prompt-injection-firewall-mcp/) [![MCPize](https://img.shields.io/badge/MCPize-Available-blue)](https://mcpize.com)


**WAF for AI agents — block prompt injection before it reaches the LLM**

Agents that blindly forward user input + retrieved documents to other agents are the #1 production AI vulnerability (OWASP LLM01). This MCP is the pre-flight gate.

By [MEOK AI Labs](https://meok.ai).


## Quick Install

| Client | Install |
|--------|---------|
| **Claude Desktop** | [![Install in Claude](https://img.shields.io/badge/Install-Claude-blue)](https://claude.ai) |
| **Cursor** | [![Install in Cursor](https://img.shields.io/badge/Install-Cursor-black)](https://cursor.com) |
| **VS Code** | [![Install in VS Code](https://img.shields.io/badge/Install-VS_Code-blue)](https://code.visualstudio.com) |
| **Windsurf** | [![Install in Windsurf](https://img.shields.io/badge/Install-Windsurf-purple)](https://codeium.com/windsurf) |
| **Docker** | `docker run -p 8000:8000 agent-prompt-injection-firewall-mcp` |
| **pip** | `pip install agent-prompt-injection-firewall-mcp` |

## Install

```bash
pip install agent-prompt-injection-firewall-mcp
```

## Tools

- `scan_prompt`
- `define_custom_rule`
- `list_rules`
- `scan_log`
- `sign_firewall_attestation`

## Claude Desktop

```json
{
  "mcpServers": {
    "agentpromptinjectionfirewall": { "command": "agent-prompt-injection-firewall-mcp" }
  }
}
```

## Tiers

- **Free** — generous daily limit (100-1,000 depending on operation)
- **Pro £199/mo** — unlimited + signed HMAC attestations with public verify URLs — [subscribe](https://buy.stripe.com/aFa7sNcgAdQS0ZT1Uc8k91t)
- **Enterprise £1,499/mo** — multi-tenant + custom predicate DSL + SIEM webhook push — [subscribe](https://buy.stripe.com/aFa7sNcgAdQS0ZT1Uc8k91t)

## Why this exists

The EU AI Act (Aug 2026), DORA (live), ISO 42001, and OWASP LLM01 Top-10 all demand runtime controls for agent systems — not just deployment-time audits. This MCP is that runtime control layer, emitting cryptographically signed evidence your auditor accepts.

## Related MEOK A2A MCPs

- [`agent-policy-enforcement-mcp`](https://pypi.org/project/agent-policy-enforcement-mcp/) — per-pair IAM
- [`agent-handoff-certified-mcp`](https://pypi.org/project/agent-handoff-certified-mcp/) — signed delegation chain
- [`agent-prompt-injection-firewall-mcp`](https://pypi.org/project/agent-prompt-injection-firewall-mcp/) — prompt injection WAF
- [`agent-rate-limiter-mcp`](https://pypi.org/project/agent-rate-limiter-mcp/) — fleet-wide quota
- [`agent-audit-logger-mcp`](https://pypi.org/project/agent-audit-logger-mcp/) — hash-chained signed log
- [`a2a-governance-bridge-mcp`](https://pypi.org/project/a2a-governance-bridge-mcp/) — map A2A to compliance frameworks
- [`meok-attestation-verify`](https://pypi.org/project/meok-attestation-verify/) — independent cert verifier

## Wire it up — full stack

Pair this with the MEOK chain that turns one agent action into ONE signed compliance event:

1. **bft-progress-council-mcp** — anti-loop guardrail
2. **agent-token-budget-mcp** — hard spend cap
3. **agent-prompt-injection-firewall-mcp** — OWASP LLM01 scan
4. **agent-audit-logger-mcp** — hash-chained evidence
5. **a2a-governance-bridge-mcp** — fold N attestations → 1 signed event
6. **agent-incident-relay-mcp** — broadcast incidents to 5 regimes simultaneously

See [meok.ai/mcp-stack](https://meok.ai/mcp-stack) for the full architecture and [meok.ai/mcp-stack/demo](https://meok.ai/mcp-stack/demo) for the live in-browser demo.

## License

MIT — MEOK AI Labs, 2026.


## Sister MCPs

Part of the MEOK **A2a** pack — designed to work together as a fleet. Install the whole pack with `npx meok-setup --pack a2a`, or pick the ones you need:

- **Data Residency** → `uvx agent-data-residency-mcp` · [PyPI](https://pypi.org/project/agent-data-residency-mcp/) · [GitHub](https://github.com/CSOAI-ORG/agent-data-residency-mcp)
- **Certified Handoff** → `uvx agent-handoff-certified-mcp` · [PyPI](https://pypi.org/project/agent-handoff-certified-mcp/) · [GitHub](https://github.com/CSOAI-ORG/agent-handoff-certified-mcp)
- **Policy Enforcement** → `uvx agent-policy-enforcement-mcp` · [PyPI](https://pypi.org/project/agent-policy-enforcement-mcp/) · [GitHub](https://github.com/CSOAI-ORG/agent-policy-enforcement-mcp)
- **Audit Logger** → `uvx agent-audit-logger-mcp` · [PyPI](https://pypi.org/project/agent-audit-logger-mcp/) · [GitHub](https://github.com/CSOAI-ORG/agent-audit-logger-mcp)
- **Rate Limiter** → `uvx agent-rate-limiter-mcp` · [PyPI](https://pypi.org/project/agent-rate-limiter-mcp/) · [GitHub](https://github.com/CSOAI-ORG/agent-rate-limiter-mcp)

Full catalogue + Anthropic Registry verify links: [meok.ai/anthropic-registry](https://meok.ai/anthropic-registry)


## Protocol coverage + Universal PAYG

This MCP is part of MEOK's 47-MCP fleet that bridges every active agent-interop protocol
and 30+ regulatory frameworks. See the full coverage matrix at [meok.ai/protocols](https://meok.ai/protocols).

**Agent interop protocols supported (8 live):**

- ✅ **MCP** (Anthropic) — native
- ✅ **A2A** (Google + Linux Foundation, absorbed IBM ACP Sept 2025)
- ✅ **IBM ACP** — covered via A2A merge
- ◐ **Stripe ACP** (Agentic Commerce Protocol) — Q3 bridge via [agent-commerce-protocol-mcp](https://github.com/CSOAI-ORG/agent-commerce-protocol-mcp)
- ◐ **AP2** (Google Agent Payments) — partial via [agent-commerce-payments-mcp](https://github.com/CSOAI-ORG/agent-commerce-payments-mcp)
- ◐ **x402** (Coinbase HTTP 402) — partial via api.meok.ai gateway
- → **OASF / AGNTCY** (Cisco Outshift + Linux Foundation) — Q3 bridge
- 👁 **ANP** (Cisco Agent Network) — watch-list

**Pricing options:**

| Option | Price | Best for |
|---|---|---|
| Self-host (this MCP) | £0 — MIT | Devs |
| This MCP Starter | £29/mo | One-MCP teams |
| This MCP Pro | £79/mo | Production + 24h SLA |
| [Universal PAYG](https://buy.stripe.com/aFa7sNcgAdQS0ZT1Uc8k91t) | £29/mo + £0.0002/call | Spiky usage across many MCPs |
| Substrate bundle (this category) | £99-£499/mo | A whole pack |
| [MEOK Universe](https://buy.stripe.com/aFa7sNcgAdQS0ZT1Uc8k91t) | £1,499/mo | All 47 MCPs, 500K calls |

Each tier above the free self-host adds HMAC-signed attestations verifiable at
`verify.meok.ai`. Linux Foundation governance on the A2A spine means EU regulated
buyers can deploy without vendor-lock-in objections.

<!-- mcp-name: io.github.CSOAI-ORG/agent-prompt-injection-firewall-mcp -->

<!-- BUY-LADDER:START -->

## 💸 Try MEOK in 30 seconds — instant buy ladder

| Tier | Price | What you get | Stripe |
|---|---|---|---|
| Smoke test | **£1** | Signed sample MCP-Hardening report + Article 50 PDF | <https://buy.stripe.com/aFa7sNcgAdQS0ZT1Uc8k91t> |
| Quick Kit | **£9** | EU AI Act Article 50 implementation guide (C2PA + EU-Icon) | <https://buy.stripe.com/aFa7sNcgAdQS0ZT1Uc8k91t> |
| Founder Call | **£29** | 30-min 1-on-1 with the founder | <https://buy.stripe.com/aFa7sNcgAdQS0ZT1Uc8k91t> |

> Refundable. UK Stripe — VAT-clean. Builds on the 81-MCP MEOK fleet.
> Verify any signed report at <https://meok.ai/verify>.

<!-- BUY-LADDER:END -->

