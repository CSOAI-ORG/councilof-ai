# G6.1 — Claim sweep (one sitting)

Nick executes in the browser. This TUI cannot SIWX, PulseMCP login, or mcp.so $39.

## Order (one sitting)

| # | Surface | Status 2026-09-11 | What you do | Paste |
|---|---|---|---|---|
| 1 | **Forge registry** | owner CLI | `forge publish` from the GSPC MCP package dir with the live remote `https://councilof.ai/mcp` | name: Council of AI GSPC; measurement not certification |
| 2 | **PulseMCP** | 403 unauth | Sign in → claim `csoai-gspc` / `councilof.ai/mcp` | remote URL `https://councilof.ai/mcp` |
| 3 | **mcp.so** | submit is **$39** | Skip paid. If a free ticket still exists: Remote Server URL `https://councilof.ai/mcp`, name Council of AI GSPC MCP | do not pay $39 from this checklist |
| 4 | **mcp.directory** | GitHub/publisher page | Claim publisher CSOAI-ORG; point at `https://councilof.ai/mcp` | |
| 5 | **Glama** | **already live** `glama.ai/mcp/servers/CSOAI-ORG/councilof-ai` | Embed badge on top-10 READMEs (below) | badge markdown below |
| 6 | **Smithery** | live | Confirm `councilof.ai/mcp` | |
| 7 | **proofof.ai apex 301** | Pages project `proofof-ai` already serves the receipt on `*.pages.dev` | Cloudflare → zone **proofof.ai** → delete the Bulk Redirect / Page Rule **proofof.ai → councilof.ai/** | after delete, apex should match https://proofof-ai.pages.dev/ |
| 8 | **bodies.ai** | AWS/Route53 404 | 301 → `https://councilof.ai/receipt` (one receipt home) | |
| 9 | **ceasai.org** | TLS fail | NS to Cloudflare, then 301 → `https://councilof.ai/` | |
| 10 | **x402scan SIWX** | owner | Sign in, bind merchant `0x212686404A7D1E1fD88F35eD6200c3aF7A78ae31` | no self-settle as revenue |

## Glama badge (top-10 READMEs)

```md
[![Council of AI GSPC](https://glama.ai/mcp/servers/CSOAI-ORG/councilof-ai/badges/score.svg)](https://glama.ai/mcp/servers/CSOAI-ORG/councilof-ai)
```

Paste on: `councilof-ai`, `csoai-gspc-mcp` npm README, GSPC mill kit, six-axis greenfield, art50 pack, rwa evidence, receipts batch, eunomia, gspc-verify extension, council-os.

## Do not

- Treat Glama/Smithery as “new claims” — they are already live.
- Pay mcp.so $39.
- Count self-settles as revenue.
- Type a public seat price.

**Done-when:** this file exists; Nick ticks 1–10 in one sitting.
