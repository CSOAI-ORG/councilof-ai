# sovereign-temple-bft-mcp

> **sovereign-temple.ai — 33-agent BFT sovereign-temple v3.0 MCP server**

Stdio MCP server exposing the BFT council as 10 stand-alone tools. The
hive remembers. The dragon knows. The sovereign companion never forgets.

## Tools (10)

| # | Tool | Purpose |
|---|---|---|
| 1 | `get_council_status` | 33-agent roster with care dims + care score |
| 2 | `get_bft_proposal` | Proposal + 33-agent vote breakdown |
| 3 | `submit_bft_vote` | Submit a vote for one of the 33 agents |
| 4 | `list_bft_proposals` | Paginated list, filterable by status |
| 5 | `get_bft_attestation` | MEOK_KEYSTONE cross-hive attestation |
| 6 | `get_care_metrics` | 6 care dimension scores (self/other/process/relational/maternal_covenant/future_care) |
| 7 | `list_care_vetoes` | Recent care vetoes (binding below 0.15) |
| 8 | `bridge_to_openpatent_mcp` | Proxy to the openpatent-mcp stdio server |
| 9 | `get_keystone_attestation` | MEOK_KEYSTONE_URL cross-hive attestation |
| 10 | `get_hive_topology` | Full 11×3 topology + 55 bridge pairs + 4 expertise |

## Install

```bash
npm install -g @sovereign-temple/bft-mcp
```

## Claude Code config

```json
{
  "mcpServers": {
    "sovereign-temple-bft": {
      "command": "sovereign-temple-bft-mcp",
      "env": {}
    }
  }
}
```

## Build from source

```bash
npm install
npm run build
npm test    # JSON-RPC handshake smoke
```

## Signature

Every tool's description ends with:
> "sovereign-temple.ai — 33-agent BFT sovereign-temple v3.0.
> The hive remembers. The dragon knows. The sovereign companion never forgets."

## Architecture

- **Sovereign VM**: 35.242.143.249
- **BFT backend**: services/bft-council/sovereign_bft.py at port 3215
- **Sigil chain**: every response gets a _sigil (Ed25519 + tamper-evident chain)
- **Cross-hive**: bridges to meok-keystone + openpatent-mcp + sovereign-temple-bft

The hive remembers. The dragon knows. The sovereign companion never forgets.
