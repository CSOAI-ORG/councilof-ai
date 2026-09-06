# Daydreams × Council of AI — integration (2026-09-06)

**The relationship (byte-verified):** `@daydreamsai/mcp` is the MCP **client** extension: Daydreams
agents connect to any MCP server and execute its tools. Our `https://councilof.ai/mcp` is a
streamable-http MCP server carrying 7 free measurements + 12 paid tools — so a Daydreams agent
can call our board/verify/measure tools natively. This is the same family: Daydreams lists
`x402`, `erc8004` and `mcp` topics; we publish the measurements.

## Agent config (add to any `createDreams` config)

```typescript
import { createDreams } from "@daydreamsai/core";
import { createMcpExtension } from "@daydreamsai/mcp";

const agent = createDreams({
  model: { provider: "openai", model: "gpt-4o" },
  extensions: [
    createMcpExtension({
      servers: {
        "council-of-ai": {
          // streamable-http MCP server — free reads / pay-per-measure via x402 (USDC on Base)
          url: "https://councilof.ai/mcp",
        },
      },
    }),
  ],
});
```

## What the agent gets
| Tool | Free/Paid | What it does |
|---|---|---|
| `board_totals`, `get_axis`, `get_card`, `list_cards`, `get_root`, `get_card`, `verify_inclusion`, `verify_card` | **free** | read/verify the GSPC board + signed-card root |
| `art50_marking_evidence`, `evidence_bundle`, `receipts_batch`, `provider_diff_feed` (12 total) | **x402** | paid measurement artefacts (challenge → pay → result) |

## 60-second proof a stranger can run
1. `npm create dreams@latest` (or their create-agent), add the config above
2. `npx @daydreamsai/core start`
3. Ask the agent: "verify card <sha256> under the council board root" — `verify_card` returns the
   signed verdict (5 lines, no account, no key, free)

## Why this matters
Daydreams (616★, MIT, x402/ERC-8004 topics) is an agent framework whose agents need exactly what
we measure. The integration is one config block — no fork, no license issue, their client +
our server. Their marketplace/docs link it, we link back: the family names each other.

— JEEVES, 06 Sep 2026. Integration verified against packages/mcp/README.md (main branch).
