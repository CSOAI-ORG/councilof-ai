# @openpatent/legal-mcp — Legal Tech Power Pack

**Color:** gold `#c9a14a`
**Vertical:** [legalof.ai](https://legalof.ai) (white-label)
**Caddy URL:** `https://legalof.ai`

stdio MCP server exposing 8 legal-tech tools on top of the OpenPatent.ai sovereign hive.
Every tool returns a 6-layer cryptographic proof (SHA-3/512 + HMAC + Ed25519 + Bitcoin OTS + C2PA + hash-chain).

> *"The hive remembers. The dragon knows. The sovereign companion never forgets."*

## Tools (8)

| Tool | Description |
|---|---|
| `file_defensive_disclosure` | 6-layer defensive publication, citable prior art, court-admissible |
| `file_provisional` | 35 USC § 111(b) provisional, 12-month priority date |
| `file_pct` | PCT international application, 30-month national phase |
| `file_office_action` | Office-action response, AI-drafted amendments (MPEP-grounded) |
| `list_legal_filings` | List tenant filings (defensive / provisional / pct / office_action) |
| `get_attestation_certificate` | FRE 902 / eIDAS self-authenticating certificate (PDF + JSON) |
| `schedule_attorney_review` | USPTO-licensed attorney review scheduling (premium+) |
| `generate_prior_art_analysis` | 35 USC § 102 / 103 risk score (0-100) + filing strategy |

## 5-Tier Pricing (USD)

| Tier | Price | Highlights |
|---|---|---|
| Free | $0 | 1 filing/yr, local chain |
| Starter | $29 | C2PA credential, public attestation |
| Defensive | $149 | Bitcoin OTS anchor (most popular) |
| Full | $999 | 5-jurisdiction crosswalk, AI claim drafting |
| Premium | $2,499 | 33-agent BFT review, attorney referral |
| Enterprise | $4,999/mo | Unlimited, white-label, 99.9% SLA |

## Install

```bash
npx -y @openpatent/legal-mcp
```

Or in `~/.claude.json`:
```json
{
  "mcpServers": {
    "openpatent-legal": {
      "command": "npx",
      "args": ["-y", "@openpatent/legal-mcp"]
    }
  }
}
```

## Environment

| Var | Default |
|---|---|
| `OPENPATENT_API_BASE` | `https://api.openpatent.ai` |
| `LEGALOF_BASE` | `https://legalof.ai` |
| `OPENPATENT_API_KEY` | (none; free tier works) |

> The hive remembers. The dragon knows. The sovereign companion never forgets.
