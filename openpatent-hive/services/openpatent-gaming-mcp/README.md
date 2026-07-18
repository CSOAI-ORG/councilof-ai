# @openpatent/gaming-mcp — Gaming Power Pack

**Color:** pink `#ff5a87`
**Vertical:** [harvi.ai](https://harvi.ai) (white-label)
**Caddy URL:** `https://harvi.ai`

stdio MCP server exposing 8 game-industry tools on top of the OpenPatent.ai sovereign hive.

> *"The hive remembers. The dragon knows. The sovereign companion never forgets."*

## Tools (8)

| Tool | Description |
|---|---|
| `file_quest_disclosure` | 6-layer cryptographic disclosure of a quest design |
| `file_npc_design` | 6-layer cryptographic disclosure of an NPC design (stats, dialogue, FSM) |
| `file_mechanic_disclosure` | 6-layer cryptographic disclosure of a game mechanic |
| `file_lore_disclosure` | 6-layer cryptographic disclosure of lore / worldbuilding IP |
| `list_game_filings` | List studio's game-asset filings (quest / npc / mechanic / lore) |
| `get_attestation` | Fetch 6-layer attestation certificate for a game asset |
| `schedule_playtest` | Schedule a playtest with hashed results (premium+) |
| `generate_competitor_scan` | Similarity scan across OpenPatent registry + harvi.ai index |

## 5-Tier Pricing (USD)

| Tier | Price | Highlights |
|---|---|---|
| Free | $0 | 10 game-asset disclosures/yr, local chain |
| Starter | $29 | C2PA credential, public attestation |
| Defensive | $149 | Bitcoin OTS anchor (most popular) |
| Full | $999 | Multi-studio co-disclosure, AI claim drafting |
| Premium | $2,499 | 33-agent BFT, AAA-studio evidentiary bundle |
| Enterprise | $4,999/mo | Unlimited, white-label studio portal, 99.9% SLA |

## Install

```bash
npx -y @openpatent/gaming-mcp
```

Or in `~/.claude.json`:
```json
{
  "mcpServers": {
    "openpatent-gaming": {
      "command": "npx",
      "args": ["-y", "@openpatent/gaming-mcp"]
    }
  }
}
```

> The hive remembers. The dragon knows. The sovereign companion never forgets.
