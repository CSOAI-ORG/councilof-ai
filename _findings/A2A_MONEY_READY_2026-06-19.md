# A2A Money-Ready Status — 2026-06-19

## What changed
- Canonical catalog (`csoai-org/public/.well-known/mcp.json`) enriched: **0 new** A2A entries added, **28 existing** A2A entries upgraded with `stripe_checkout_url` + tier label.
- Landing page built: `csoai-org/public/a2a/index.html` — 28 cards, each wired to a live Stripe checkout.
- Catalog now correctly reports `a2a_servers_listed: 28`.

## The verified-live Stripe ladder used

| Tier | Label | Price | Stripe Link |
|---|---|---|---|
| lvp | Sovereign | £29/mo | https://buy.stripe.com/9B67sNeoIcMObEx56o8k91S |
| mvp | Pro | £199/mo | https://buy.stripe.com/eVq14p1BWcMO4c59mE8k91T |
| hvp | Enterprise | £1,499/mo | https://buy.stripe.com/28E7sNdkEeUW5g96as8k91U |

All three links lifted from `csoai-org/public/_csoai_stripe_buttons.html`, the canonical Stripe button file already in use on csoai.org.

## Why "money-ready" is true without Nick's STRIPE_SECRET_KEY gate
`buy.stripe.com/*` payment links are hosted entirely by Stripe. They do NOT require `STRIPE_SECRET_KEY` in Vercel because no `/api/checkout-session` round-trip is needed — clicks land directly on Stripe-hosted checkout. The STRIPE_SECRET_KEY blocker from {session_june17_csoai_stripe_wired} applies only to in-app subscription flows (the dashboard `/checkout` route), NOT to these direct payment links.

## What's still gated
- **mcpize.com submission** — needs `npx mcpize login` (Nick auth). Manifest at `_findings/MCPIZE_MANIFEST_2026-06-19/`.
- **Per-server PyPI publish confirmation** — `pip install <name>` will work for any server already published. The catalog assumes 271 of 348 are live on PyPI (last verified 2026-06-02).
- **Re-mirroring updated catalog to 114 hive sites** — re-run `~/clawd/.local-tools/mirror_mcp_catalog.py --apply` to push the enriched catalog out.
- **Vercel deploy** — page lives on disk at `csoai-org/public/a2a/index.html` → goes live on next `vercel deploy --prod` from `csoai-org/`.

## A2A MCPs catalogued (by tier)

### Enterprise (£1,499/mo)
- a2a-governance-bridge-mcp — A2A Governance Bridge MCP server. Tools: verify agent compliance, authorize a2a transaction, get tru
- agent-identity-trust-mcp — Agent Identity Trust tools for AI agents. Capabilities: register agent identity, issue credential, v
- agent-incident-relay-mcp — Agent Incident Relay MCP — Article 73 5-clock broadcaster. One incident → simultaneous signed report
- agent-incident-reporter-mcp — Signed, hash-chained, tamper-evident AI incident records (MCP server). EU AI Act Art 73 ready. By ME
- agent-mcp-router-mcp — Agent MCP Router MCP — one router for the whole MEOK fleet. Holds 62 MEOK MCPs behind one namespaced
- agent-orchestrator-mcp — MCP server for agent orchestrator. Features create agent, list agents, delegate task. From MEOK AI L
- agent-policy-enforcement-mcp — Per-agent-pair IAM for A2A. Define policies ('orchestrator may call billing only when amount<1000'),
- meok-aaif-agent-card-mcp — MEOK AAIF Agent Card MCP — Linux Foundation AAIF agent identity bridge. Issues + verifies + publishe

### Pro (£199/mo)
- agent-audit-logger-mcp — Hash-chained HMAC-signed audit log MCP for A2A (agent-to-agent) calls. Every tool-call, agent-handof
- agent-content-watermark-mcp — Agent Content Watermark MCP — dedicated EU AI Act Article 50(2) GenAI watermarking. Visible + invisi
- agent-cost-allocator-mcp — Agent Cost Allocator MCP — multi-tenant LLM cost attribution for chargeback billing. Companion to ag
- agent-data-residency-mcp — Agent data residency + GDPR Chapter V transfer-basis runtime guard. Programmatically answer 'where d
- agent-handoff-certified-mcp — Verifiable agent-to-agent task handoff with signed provenance chain. Initiating agent signs the offe
- agent-prompt-injection-firewall-mcp — The WAF for agents. Pattern-based + heuristic firewall scans prompts, RAG documents, tool arguments,
- agent-replay-debugger-mcp — Agent Replay Debugger MCP — record every agent step + replay deterministically. Step-debugger for ag
- agent-token-budget-mcp — Agent Token Budget MCP — per-session spend cap with signed budget-exhausted attestations. Twin of bf
- bft-progress-council-mcp — BFT Progress Council MCP — 5-voter Byzantine council halts agentic loops when no real progress is ha
- meok-ap2-mandate-mcp — MEOK Google AP2 Mandate MCP — issue + verify + revoke signed user-side spend authorisations for agen
- meok-coinbase-x402-receipt-mcp — MEOK Coinbase x402 Receipt MCP — signed settlement receipts for agentic payments. Base/Polygon/Solan
- meok-stripe-acp-checkout-mcp — MEOK Stripe ACP Checkout MCP — ChatGPT shopping bridge. Issues + verifies + signs Stripe Agentic Com

### Sovereign (£29/mo)
- agent-commerce-payments-mcp — MCP server for agent commerce payments. Features create invoice, process payment, escrow funds. From
- agent-commerce-protocol-mcp — Agent Commerce Protocol MCP — bridges Stripe ACP + Google AP2 + Coinbase x402 for agent payments ins
- agent-delegation-mcp — Agent Delegation MCP server. Tools: create task, delegate task, get task status. Built by MEOK AI La
- agent-negotiation-mcp — AI-powered agent negotiation MCP server for agents. Supports propose deal, evaluate offer, counter o
- agent-rate-limiter-mcp — Fleet-wide shared rate limiter for A2A + multi-MCP deployments. Most MCP servers rate-limit independ
- agent-x402-paywall-mcp — Agent x402 Paywall MCP — wraps Coinbase x402 (HTTP 402) so agents pay per-call without Stripe accoun
- meok-abci-bridge-mcp — MEOK ABCI Bridge MCP — read-only Tendermint / Cosmos blockchain query for agents. Built-in registry 
- meok-libp2p-agent-mesh-mcp — MEOK libp2p Agent Mesh MCP — peer-to-peer agent discovery + addressing. PeerID + multiaddr + signed 

## Coordination
Substrate lane: catalog + page + manifest staged. Deploy lane: runs `vercel deploy --prod` from `csoai-org/` to take it live.
