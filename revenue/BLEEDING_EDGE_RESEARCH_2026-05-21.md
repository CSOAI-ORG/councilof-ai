# Bleeding-Edge Bootstrap Research — 2026-05-21

Research from agent. Identifies highest-leverage next moves for MEOK AI Labs solo founder pushing toward £3,333/day MRR.

---

## 1) MCP ecosystem gaps (solo-shippable in <1 week)

- **`meok-mcp-cardgen` CLI** — SEP-1649 + SEP-1960 + SEP-2127 active but unmerged. Claude Desktop + Cursor ship MCP v2.1 with `/.well-known/mcp/server-card.json` discovery (April 2026). Free CLI that scans an MCP server and emits both card shapes — every MCP author on the registry (~2,000+) needs this. Adjacent paid: hosted card-validation badge.
- **`@meok/mcp-apps-ui`** — SEP-1865 MCP Apps went stable Jan 26, 2026. Tools return interactive HTML via `ui://` URI. No UI component library exists. Ship shadcn-style sandboxed components.
- **`meok-tool-policy` MCP** — per-tool fine-grained governance (OPA/Rego-style). Composio / MintMCP / Kong only block at server level. 53–62% of regulated-industry MCP adopters cite security blocker.
- **`meok-mcp-test`** — pytest plugin for golden-file + schema-drift + tool-failure tests. Thousands of MCPs ship zero tests. Inspector is debug-only.
- **`meok-x402-wrap`** — language-agnostic FastMCP wrapper to add USDC paywall in 1 line. Coinbase + Vercel + Cloudflare ship examples but no universal wrapper.

## 2) Agent-infra business models to copy

- **MCPize playbook** — one-click Cloudflare Workers deploy + 80% rev share. Copy: `meok-deploy` CLI that ships any MCP to CFW + Vercel Functions + Fly.io with x402 + Stripe paywall pre-wired.
- **Stripe ACP launch** — single demo video + partner logos, launched inside ChatGPT Instant Checkout. MEOK equivalent: `meok-ap2-merchant` — first-mover open-source AP2 merchant MCP submitted to `google-agentic-commerce/AP2` examples directory (free distribution channel).
- **x402 Foundation co-marketing** — Coinbase + Cloudflare + Visa moved x402 to Linux Foundation Sept 2025. They boost ecosystem tools — ship MEOK x402 MCP, get listed in Coinbase docs.
- **MCPCon CFP submission** — AGNTCon + MCPCon Europe Sept 17-18 Amsterdam, NA Oct 22-23 San Jose. 20-min talk on "shipping 62 MCPs solo" matches indie content these confs want.
- **`meok-agents-md-lint`** — eslint-style linter for AGENTS.md. AAIF stewards the standard. No good validator exists. Every coding-agent vendor's DevRel team will retweet.

## 3) Bleeding-edge standards moving in Q2/Q3 2026

- **EU AI Act Article 50 — Aug 2, 2026 (post-Omnibus = 2 Nov 2026)** — second draft Code of Practice Jan 2026 introduced **EU icon for labelling AI content**. Ship `meok-eu-aigc-icon` MCP. Nobody else is.
- **C2PA 2.2 spec (May 2025)** — durable Content Credentials with soft+hard binding (Digimarc-compatible). Ship `meok-c2pa-durable` first-mover before Adobe tooling lands.
- **CRA Article 14 reporting — 11 Sept 2026** — active exploitation reporting. No MCP exists. Ship `meok-cra-art14-reporter` — 90 days runway, every EU software vendor needs.
- **NIS2 Netherlands implementation — Q2 2026** — self-assessment by June 2026. Copy MEOK DE variant → `meok-nis2-nl-register`. Deadline THIS MONTH for NL entities.
- **MCP 2026 roadmap** — stateless async ops + registry crawler protocol shipping Q2/Q3. Ship `meok-mcp-stateless-adapter` when spec lands.
- **AP2 v0.2.0 (April 2026)** — Verifiable Credential "Mandates" net-new. Python SDK exists at `code/sdk/python/ap2/`. Wrap is days, not weeks. Ship `meok-ap2-mandate`.

## Quick-win priority stack (next 7 days)

1. **`meok-mcp-cardgen`** — registry traffic, every MCP author benefits
2. **`meok-nis2-nl-register`** — deadline THIS MONTH, just copy DE
3. **`meok-x402-wrap`** — clear revenue path, Coinbase distribution
4. **`meok-ap2-mandate`** — first-mover, Google/PayPal/Mastercard ecosystem
5. **`meok-eu-aigc-icon`** — 2 Nov 2026 cliff, C2PA 2.2 compliant
6. **`meok-cra-art14-reporter`** — 11 Sept 2026 deadline
7. **`meok-agents-md-lint`** — viral DevRel boost
8. **`meok-mcp-test`** — testing harness OSS funnel

## Sources

- SEP-1649 MCP Server Cards: https://github.com/modelcontextprotocol/modelcontextprotocol/issues/1649
- SEP-2127 PR + Go reference: https://github.com/modelcontextprotocol/modelcontextprotocol/pull/2127
- MCP Apps SEP-1865: https://blog.modelcontextprotocol.io/posts/2026-01-26-mcp-apps/
- MCP 2026 Roadmap: https://blog.modelcontextprotocol.io/posts/2026-mcp-roadmap/
- x402 Coinbase docs: https://docs.cdp.coinbase.com/x402/mcp-server
- x402 → Linux Foundation: https://thedefiant.io/news/infrastructure/coinbase-x402-payment-protocol-moves-to-linux-foundation
- AP2 spec: https://ap2-protocol.org/specification/
- AP2 v0.2.0: https://github.com/google-agentic-commerce/AP2
- EU AI Act Article 50: https://artificialintelligenceact.eu/article/50/
- EU CoP 2nd draft + icon: https://digital-strategy.ec.europa.eu/en/library/commission-publishes-second-draft-code-practice-marking-and-labelling-ai-generated-content
- C2PA 2.2: https://spec.c2pa.org/specifications/specifications/2.2/specs/C2PA_Specification.html
- CRA + NIS2 + DORA deadlines: https://www.schellman.com/blog/cybersecurity/european-compliance-nis2-cra-dora
- AAIF 2026 events: https://www.linuxfoundation.org/press/agentic-ai-foundation-announces-global-2026-events-program-anchored-by-agntcon-mcpcon-north-america-and-europe
- AGNTCY Linux Foundation: https://www.linuxfoundation.org/press/linux-foundation-welcomes-the-agntcy-project-to-standardize-open-multi-agent-system-infrastructure-and-break-down-ai-agent-silos
- MCPize 80% rev share: https://mcpize.com/blog/deploy-mcp-cloudflare
- AGENTS.md (AAIF): https://agents.md/
- MCP testing gaps: https://dev.to/klement_gunndu/your-mcp-server-has-no-tests-here-are-4-patterns-to-fix-that-2k59
