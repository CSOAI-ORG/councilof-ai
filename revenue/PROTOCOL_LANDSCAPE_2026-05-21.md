# Agent Interop Protocol Landscape — May 2026 Snapshot

**Why this matters for MEOK:** our 47 MCPs sit at the bottom of a fast-coalescing stack. Knowing which protocols won, merged, or died determines what we bridge to next.

## The 7 protocols (and the "ACP" name collision)

| # | Name | Owner | Layer | Status May 2026 | Our coverage |
|---|---|---|---|---|---|
| 1 | **MCP** Model Context Protocol | Anthropic (Nov 2024) | Tool/data calls (agent → tools) | DOMINANT — largest ecosystem | ✅ Native — all 47 MCPs |
| 2 | **A2A** Agent-to-Agent | Google + Linux Foundation (Apr 2025) | Agent-to-agent task delegation | DOMINANT — absorbed IBM ACP | ✅ Native — 12 A2A MCPs + Substrate |
| 3 | **IBM ACP** Agent Comms Protocol | IBM Research (Mar 2025) | Agent-to-agent messaging | **MERGED INTO A2A Sept 2025** — dead as separate spec | ✅ Covered by A2A Substrate |
| 4 | **Stripe ACP** Agentic Commerce Protocol | Stripe + OpenAI | Agent commerce inside ChatGPT | LIVE — Apache 2.0 — ChatGPT-first | ❌ **Gap — high priority** |
| 5 | **AP2** Agent Payments Protocol | Google + Mastercard + PayPal + Adyen (60+ orgs) | Cross-platform agent payments | LIVE — broad coalition, early adoption | ⚠️ Partial — `agent-commerce-payments-mcp` mentions PSD2/MiCA but not AP2 mandates |
| 6 | **x402** HTTP 402 Payments | Coinbase | HTTP-native pay-per-call | LIVE — already mentioned in our `eu-ai-act-compliance-mcp` README | ✅ Partial |
| 7 | **ANP** Agent Network Protocol | Cisco | Agent network discovery | EMERGING — early days | ❌ Watch-list only |

## The "ACP" name collision — clarification

When someone says "ACP" in mid-2026, they could mean:

- **IBM ACP** — the Agent Communication Protocol. **Status: dead.** Merged into A2A in September 2025 under Linux Foundation. The tech is now part of A2A. **If a buyer says "we use ACP", they probably mean an A2A-spec implementation, and our Substrate already supports them.**

- **Stripe ACP** — the Agentic Commerce Protocol. **Status: live.** Developed by Stripe with OpenAI, Apache 2.0 licensed, used inside ChatGPT for in-conversation purchase flows. **If a buyer says "we use ACP" and they're a merchant, they mean Stripe ACP, and we need to bridge.**

This is genuinely confusing because the acronyms collide. Our positioning needs to address both.

## The agent payments cluster (where we have a real gap)

Three competing payments protocols all live, none dominant yet:

### Stripe ACP (Agentic Commerce Protocol)
- Apache 2.0
- ChatGPT-first integration
- Designed for in-conversation merchant payments
- Best for: B2C agent commerce
- Adoption signal: every Stripe merchant gets it via OpenAI's ChatGPT shopping

### Google AP2 (Agent Payments Protocol)
- Cryptographically signed "Mandates" — verifiable credentials acting as proof of user intent
- 60+ org coalition (Mastercard, PayPal, Adyen, American Express, Coinbase, Salesforce)
- Cross-platform, not tied to one vendor
- Best for: regulated commerce, cross-border, B2B
- Adoption signal: payments giants don't want Stripe to own the protocol

### Coinbase x402
- HTTP 402 Payment Required + on-chain settlement (Base / Solana / Polygon)
- No SDK needed — agents just hit a URL, get a 402, pay, retry
- Best for: pay-per-call API access, micro-transactions
- Adoption signal: built into x402.org public discovery

All three solve a different slice. A serious agent-commerce play supports **all three** and lets the buyer pick.

## What MEOK should add (in priority order)

### Priority 1 — `agent-commerce-protocol-mcp` (NEW)

The Stripe ACP bridge. Wraps Stripe's official ACP SDK as an MCP server.

- Lets any Claude/Cursor agent initiate a Stripe ACP transaction
- Signed payment intent
- Webhook bridge to our existing `agent-audit-logger-mcp` for evidence chain
- **Stripe Starter £29/mo · Pro £79/mo · A2A Substrate included**
- **Why this MCP first:** Stripe has the largest merchant footprint. One MCP that "just works with Stripe ACP" unlocks every ChatGPT-shopping flow without code.

### Priority 2 — Extend `agent-commerce-payments-mcp` with AP2 mandate support

The existing MCP already handles PSD2 + MiCA attestation. Adding AP2 mandate generation + verification makes it the cross-protocol layer.

- AP2 mandates = verifiable credentials signed by the user authorising the agent
- We can sign + verify these mandates as part of our existing HMAC-attestation chain
- No new MCP — extension of existing
- **Pricing:** unchanged £29/£79

### Priority 3 — `agent-x402-paywall-mcp` (NEW)

Coinbase x402 lets an MCP itself be paid-for-on-call. This is **the natural bridge to our `api.meok.ai` gateway**:

- Wrap our gateway endpoints with x402
- Agents hit `api.meok.ai/v1/a2a/<primitive>` without auth
- Get HTTP 402 → pay via Coinbase Onramp / USDC
- Retry succeeds, signed attestation returned
- **Eliminates Stripe-account requirement** for agent buyers. Pure pay-as-you-go.

### Priority 4 — Update existing 12 A2A MCP READMEs

Each one mentions which agent-interop protocols it speaks:

```markdown
## Protocol support

- MCP (Anthropic) — native
- A2A (Google + Linux Foundation, formerly IBM ACP) — native
- Stripe ACP — bridge available via agent-commerce-protocol-mcp
- AP2 (Google) — mandate support via agent-commerce-payments-mcp
- x402 (Coinbase) — pay-per-call via agent-x402-paywall-mcp
```

### Priority 5 — Update /a2a landing with the protocol map

Add a "Multi-protocol coverage" section between the pipeline diagram and the pricing. Buyers want to know they can use the Substrate regardless of which agent stack they're committed to.

## Updated Show HN angle (June 3)

Old title (working):

> Show HN: Multi-LLM agent OS with visible BFT council disagreement + 38 compliance MCPs

NEW (stronger):

> Show HN: 47 MCPs + the only A2A substrate that speaks A2A, Stripe ACP, AP2, and x402 (MIT)

This positions us as the **protocol-agnostic layer** — the one place an agent dev can pick up infrastructure that survives whatever protocol war shakes out.

## Don't get distracted by ANP yet

Cisco's Agent Network Protocol is early. No production deployments we can find. Watch-list, don't build for it yet.

## Why Linux Foundation governance matters

Three of the agent protocols (A2A, IBM ACP, BeeAI runtime) are now under Linux Foundation oversight. For EU regulated buyers, **Linux Foundation governance is a procurement-friendly signal**: no single vendor lock-in, multiple-entity stewardship, public standards process.

When pitching to EU/UK regulators and enterprise compliance buyers, lead with:

> "Our A2A Substrate is built on the Linux-Foundation-governed A2A standard (which absorbed IBM ACP). MIT-licensed under CSOAI LTD (Companies House 16939677). No vendor lock-in."

This neutralises the "Anthropic is a US foreign vendor" objection that EU procurement raises against MCP-only pitches.

## 30-day priority checklist

1. **Week 1 (this week)**: Write protocol map (this doc) ✓ · Update /a2a with protocol coverage block · Ship `agent-commerce-protocol-mcp` skeleton (Stripe ACP bridge)
2. **Week 2**: AP2 mandate extension on `agent-commerce-payments-mcp` · Cross-link from /a2a to the 3 payment MCPs
3. **Week 3**: Ship `agent-x402-paywall-mcp` · Wire our `api.meok.ai` gateway endpoints to return HTTP 402 by default (with x402 settlement)
4. **Week 4**: All 12 A2A README protocol-support blocks updated · Show HN angle revised to lead with multi-protocol coverage · Cross-post to Anthropic Discord + r/AgentPayments + Stripe community

## Bottom line

The "what about ACP?" question has two answers:

- **IBM ACP** — already covered by A2A Substrate (the spec merged in)
- **Stripe ACP + AP2 + x402** — the agent payments cluster, three live protocols, we have partial coverage via `agent-commerce-payments-mcp` and need 2 new MCPs

Building those 2 new MCPs (commerce-protocol + x402-paywall) plus extending the existing payments MCP makes MEOK the **only** A2A substrate that works inside ChatGPT (Stripe ACP), the Google/Mastercard mandate world (AP2), and the on-chain agent economy (x402). That's a stronger Show HN angle than what we have today.
