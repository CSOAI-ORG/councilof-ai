# MCP Portfolio Scorecard — 2026-05-21

**Tool:** `~/clawd/mcp-marketplace/_template/scripts/portfolio_scorecard.sh`
**Source:** 266 MCPs in `~/clawd/mcp-marketplace/*-mcp/`
**Rubric:** 100 points per MCP per MCP_CHECKLIST_TEMPLATE_2026-05-20.md

## Headline numbers

| Metric | Value |
|---|---|
| Total MCPs scored | **266** |
| Passing (≥85/100) | **0** |
| Near pass (70-84) | **0** |
| Failing (<70) | **266** |
| Average score | **30.3 / 100** |

Every single MCP in the portfolio is below pass threshold. This is consistent with the top-10 flagship audit average of 59.6/100, but the wider portfolio (lifestyle / niche / experimental MCPs) is substantially worse.

## Bottom 15 — quickest wins (one 30-min sweep each)

| Score | MCP |
|---|---|
| 9/100 | ai-reflection-mcp |
| 9/100 | neural-health-monitor-mcp |
| 9/100 | quantum-scoring-mcp |
| 10/100 | meok-drcf-agent-crosswalk-mcp |
| 10/100 | meok-uk-adm-article22c-mcp |
| 11/100 | bft-governance-mcp |
| 16/100 | dispense-record-mcp |
| 16/100 | domiciliary-care-mcp |
| 16/100 | gos-claim-validator-mcp |
| 16/100 | mhra-samd-optometry-mcp |
| 16/100 | optical-care-home-bridge-mcp |
| 21/100 | meok-dpia-edpb-template-mcp |
| 22/100 | care-home-cqc-mcp |
| 22/100 | currency-converter-ai-mcp |
| 22/100 | meok-nis2-de-register-mcp |

## Hard recommendation: archive 15-20% of the portfolio

Per FULL_INVENTORY_2026-05-21.md and the trade-vertical audit, 12-15 MCPs have **no buyer profile** and should be archived rather than improved. Candidates from the bottom-15:

- **ai-reflection-mcp, neural-health-monitor-mcp, quantum-scoring-mcp** (9/100 each) — internal experiments, no commercial path. Archive.
- **currency-converter-ai-mcp** (22/100) — commodity feature, no moat. Archive or fold into a parent MCP.

For the regulatory/compliance MCPs at 16-22/100 (CQC, dispense-record, GOS, MHRA, etc.), the path is **fix or merge**: most could become one umbrella `optometry-ai-mcp` rather than 5 separate single-purpose MCPs.

## How to use the leaderboard

```bash
# See the laggards (where 30-min fixes have highest impact)
~/clawd/mcp-marketplace/_template/scripts/portfolio_scorecard.sh --bottom 20

# See the leaders
~/clawd/mcp-marketplace/_template/scripts/portfolio_scorecard.sh --top 20

# Export for spreadsheet tracking
~/clawd/mcp-marketplace/_template/scripts/portfolio_scorecard.sh --csv > /tmp/scorecard.csv

# Drill into one MCP
~/clawd/mcp-marketplace/_template/scripts/portfolio_scorecard.sh --slug eu-ai-act-compliance-mcp
```

## Why the average is so low

The scorecard penalises heavily on **section D (regulatory accuracy — 16 pts)**, which requires:

- EUR-Lex CELEX citations in data files
- `last_verified` date stamps within 90 days of regulation amendments
- Author attestation file (ATTESTATION.md)
- "Not legal advice" disclaimer footer
- Diff watcher CI for regulation amendments
- HMAC-signed attestation tool + key rotation docs

Most MCPs were scaffolded fast and never had these added. Adding D1-D6 across the top 10 flagships would lift the average ~10 points each.

The other major gap is **section A (distribution — 24 pts)**, specifically:
- A5 npm @meok-ai scope (every MCP fails this — still publishing under csga_global)
- A8 Anthropic Registry server.json version match (now fixed for the 14 flagships I published today)
- A9 Smithery.ai listing (no MCP has smithery.yaml)
- A11 mcp.so submission tracker (only 1 ever submitted, issue #2170)

## 30-day plan to lift portfolio average to >70

From MCP_CHECKLIST_TEMPLATE 30-day priority order:

1. **DONE** — Build meok-mcp-template + scorecard.py + bump_version.sh
2. **PARTLY DONE** — Run bump_version.sh on all 11 flagships (today: 14 MCPs published to Anthropic Registry, +12 pts each)
3. **NEXT** — Copy 4 governance docs (CONTRIBUTING, CODE_OF_CONDUCT, SECURITY, CHANGELOG) to bottom-15 MCPs — +40 pts each, 90 min total
4. **NEXT** — Shared Resend webhook + schema.org JSON-LD layout — closes E1+F2 portfolio-wide
5. **NEXT** — @meok-ai npm scope migration across all 38 flagships — closes A5
6. **NEXT** — Add D1 EUR-Lex citations + D2 `last_verified` to top 10 flagships — unblocks D-blocker

After steps 1-6: top 4 flagships cross 85 pass threshold. Portfolio average rises from 30.3 → ~55.

## CI integration plan

Once the template scripts are stable, wire `scorecard.py --strict` into the `compliance-pdca.yml` workflow that runs on every PR across all CSOAI-ORG repos. Block merges that regress the score below 85.

Until then, run `portfolio_scorecard.sh --bottom 20` weekly to identify the next 30-min fixes.
