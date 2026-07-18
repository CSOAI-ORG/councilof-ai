<!-- mcp-name: io.github.CSOAI-ORG/optical-care-home-bridge-mcp -->
[![MCP Scorecard: 84/100](https://img.shields.io/badge/proofof.ai-84%2F100-5b21b6)](https://proofof.ai/scorecard/optical-care-home-bridge-mcp.html)

# Optical Care-Home Bridge

[![PyPI](https://img.shields.io/pypi/v/optical-care-home-bridge-mcp)](https://pypi.org/project/optical-care-home-bridge-mcp/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![MEOK AI Labs](https://img.shields.io/badge/MEOK_AI_Labs-uk--specialist-purple)](https://meok.ai)

Bridge between domiciliary optometry visits + care-home governance. Handles consent capacity (Mental Capacity Act), GOS 6 eligibility, post-visit care plan update sync.

## Install

```bash
pip install optical-care-home-bridge-mcp
```

## Tools

| Tool | Purpose |
|------|---------|
| `mca_capacity_check` | Mental Capacity Act 2005 assessment template |
| `gos6_visit_eligibility` | GOS 6 domiciliary visit eligibility check |
| `post_visit_care_plan_sync` | Update care plan after optical visit (vision-related adjustments) |
| `safeguarding_red_flags` | Adult safeguarding red-flag detection from visit notes |
| `registered_optometrist_audit` | GOC registration check for visiting optometrist |

## Built by a UK practitioner

Nicholas Templeman runs an active UK optical practice (templeman-opticians.com) + AI compliance company. This MCP encodes lessons from real workflows, not paperwork theory.

## Pricing

- **Free**: 10 calls/day. No API key.
- **Pro** £79/mo: unlimited + signed attestations. [Subscribe](https://buy.stripe.com/aFa7sNcgAdQS0ZT1Uc8k91t)
- **Enterprise** £1,499/mo: white-label + on-premise. hello@meok.ai

## License

MIT © MEOK AI Labs

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



## Configuration

Add to your `claude_desktop_config.json` (Claude Desktop) or your MCP client config:

```json
{
  "mcpServers": {
    "optical-care-home-bridge-mcp": {
      "command": "uvx",
      "args": ["optical-care-home-bridge-mcp"]
    }
  }
}
```

Or: `pip install optical-care-home-bridge-mcp` then run the `optical-care-home-bridge-mcp` command (stdio transport).

## Examples

Once configured, ask your assistant, for example:
- "Use `mca_capacity_check` to …"
- "Use `gos6_visit_eligibility` to …"
- "Use `post_visit_care_plan_sync` to …"
