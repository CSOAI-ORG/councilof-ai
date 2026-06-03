# MEOK AI Labs — Master Monetization & Domination Plan (2026)

**Reality baseline (verified this session):**
- 290 MCP repos · ~211 live on official MCP Registry · ~30-50K PyPI downloads/mo · 90+ on Glama
- Revenue: £0 · Customers: 0 · Stripe products: 95+
- **Diagnosis: reach is SOLVED. The gap is 100% monetization + conversion.**

The 100x is not more packages. It's switching on the payment rails you already built and never connected.

---

## 1. MONETIZATION ARCHITECTURE — "as above, so below"

Three monetization layers, each mapped to a rail you ALREADY have a repo for:

### Layer 0 — Free discovery engine (keep free forever)
Basic tool calls stay free + unlimited. This IS the marketing — it drives installs, AEO, and registry ranking. Every free call already emits an upsell line → councilof.ai.

### Layer 1 — Per-call paywall (x402) ← THE 100x LEVER
Premium endpoints (signed attestations, full gap analysis, evidence-pack generation, multi-BU reports) return **HTTP 402 → x402 micropayment → unlock**.
- Wrapper: `agent-x402-paywall-mcp` + `meok-x402-wrap-mcp`
- Receipts: `meok-coinbase-x402-receipt-mcp`
- Price: $0.05–0.50 per premium call
- **Why 100x:** this monetizes AI AGENTS calling your tools — zero human in the loop, scales with the agent economy. 30-50K calls/mo × even $0.10 on premium = real recurring money with no sales calls.

### Layer 2 — Subscription / API key (Stripe ACP)
Humans/orgs wanting unlimited premium + dashboard + support.
- Rail: `meok-stripe-acp-checkout-mcp` (agentic Stripe checkout) + the live councilof.ai Stripe products
- £79/mo Pro · £499/mo Enterprise

### The "master configuration" — one auth substrate
`meok-tier-auth` becomes the shared gate every premium MCP checks. It validates **any** of:
- a valid API key (Layer 2), OR
- an x402 payment receipt (Layer 1), OR
- an active ACP subscription (Layer 2)

One substrate. All 290 tools plug into it. THIS is the "master coherence" — the agent-economy + compliance stack composed, not 290 disconnected scripts.

```
Agent/User → MCP tool call
   → meok-tier-auth checks: free endpoint? → serve
                            premium? → 402 (x402) OR key OR ACP sub
   → on payment/auth → unlock + emit signed receipt/attestation
```

---

## 2. AEO + SEO PLAYBOOK — get the models to recommend you

When a user asks Claude/ChatGPT/Perplexity *"what MCP should I use for EU AI Act compliance?"*, you win by **breadth × consistency**:

1. **MEOK sigil README header** standardized across all 290 repos: one-line value prop · `pip install X` · "Works with Claude Desktop / Cursor" · regulation + deadline · keywords · link to councilof.ai. (Scriptable across all repos.)
2. **Official Registry presence** (done — 211) — the models read the registry.
3. **Awesome-list saturation** — PRs into every awesome-mcp / awesome-compliance / awesome-eu-ai-act list (several already filed). Models trained on these.
4. **llms.txt** on meok.ai + councilof.ai so AI crawlers get a clean capability map.
5. **Comparison pages** ("MEOK vs Ansvar", "MEOK vs Vanta for AI Act") — captures AEO + SEO long-tail.
6. **Consistent naming** — `meok-` / clear regulation names so the model associates the brand with the category.

Quick win: one script stamps the sigil header + topics/keywords across all 290 repos in a batch.

---

## 3. THE 2-WEEK REVENUE SWITCHES (existing assets only)

**Week 1 — wire the rails**
1. Publish the GAP-B payment-rail MCPs to PyPI: `agent-x402-paywall-mcp`, `meok-x402-wrap-mcp`, `meok-stripe-acp-checkout-mcp`, `meok-coinbase-x402-receipt-mcp`, `meok-ap2-mandate-mcp`. (Phase 2 — they're built.)
2. Integrate `meok-tier-auth` + x402 paywall into the TOP 5 flagships (eu-ai-act, dora, nis2, watermark, cra). Gate ONLY the premium endpoints.
3. Nick: set Coinbase x402 receiving wallet.

**Week 2 — turn on the funnel**
4. One landing page: "Free EU AI Act check → pay-per-attestation (x402) OR £79/mo unlimited (Stripe)."
5. The upsell CTA (already repointed to councilof.ai) now lands on a WORKING checkout.
6. Fire the drafted LinkedIn DMs + Show HN at the now-monetized flagship.

**Honest sequencing:** fastest £1 is the Stripe £79/mo Pro key (live on councilof.ai today) — do that NOW for humans. x402 is the scalable 100x for agents — wire it across Week 1-2. Run BOTH.

---

## 4. PHASE PLAN

- **Phase 1 — ALIGN** (running): ~260/290 on Registry + PyPI + Glama.
- **Phase 2 — RAILS**: build+publish the 30 GAP-B repos, x402/ACP first.
- **Phase 3 — MONETIZE**: meok-tier-auth substrate + paywall top 5 flagships.
- **Phase 4 — AEO BLITZ**: sigil README sweep + llms.txt + awesome-list saturation + comparison pages.
- **Phase 5 — CONVERT**: landing page + outbound + measure first £.

**North star: first £1 within 14 days, then clone the pattern across the fleet.**
