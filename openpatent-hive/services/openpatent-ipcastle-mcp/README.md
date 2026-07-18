# @openpatent/ipcastle-mcp — IP Castle Power Pack

**Color:** teal `#4ecdc4`
**Vertical:** [ipcastle.ai](https://ipcastle.ai) (white-label)
**Caddy URL:** `https://ipcastle.ai`

stdio MCP server exposing 8 IP-counsel tools on top of the OpenPatent.ai sovereign hive.

> *"The hive remembers. The dragon knows. The sovereign companion never forgets."*

## Tools (8)

| Tool | Description |
|---|---|
| `file_patent_disclosure` | 6-layer patent disclosure (utility / design / plant) |
| `file_trademark` | 6-layer trademark disclosure (word / logo / sound / trade dress) |
| `file_trade_secret` | 6-layer trade-secret disclosure + NNN-chain audit |
| `file_droit_auteur` | French author-right disclosure (Cassation-admissible) |
| `list_ip_filings` | List tenant's IP filings (patent / trademark / trade_secret / droit_auteur) |
| `get_certificate` | 6-layer IP certificate (USPTO / EUIPO / Cassation) |
| `schedule_examiner` | USPTO / EUIPO / JPO / CNIPA examiner review (premium+) |
| `generate_competitor_matrix` | IP competitive matrix (trademarks + patents overlap) |

## 5-Tier Pricing (USD)

| Tier | Price | Highlights |
|---|---|---|
| Free | $0 | 5 IP filings/yr, local chain |
| Starter | $29 | C2PA + EUIPO badge, public attestation |
| Defensive | $149 | Bitcoin OTS anchor, Madrid protocol coverage |
| Full | $999 | Multi-class trademarks, AI claim drafting |
| Premium | $2,499 | 33-agent BFT, examiner referral |
| Enterprise | $4,999/mo | Unlimited, white-label IP portal, 99.9% SLA |

## Install

```bash
npx -y @openpatent/ipcastle-mcp
```

Or in `~/.claude.json`:
```json
{
  "mcpServers": {
    "openpatent-ipcastle": {
      "command": "npx",
      "args": ["-y", "@openpatent/ipcastle-mcp"]
    }
  }
}
```

> The hive remembers. The dragon knows. The sovereign companion never forgets.
