# CSOAI Drata MCP Server

A Model Context Protocol (MCP) server that bridges Drata controls and test results into the CSOAI Layer 0 trust layer.

## Tools

- `list_controls` — list Drata controls and latest test results.
- `get_control_status` — get status for a Drata control.
- `export_attestation` — convert a Drata control into a CSOAI attestation payload.
- `sync_to_csoai` — submit the payload to CSOAI for signing.

## Install

```bash
npm install
npm run build
```

## Usage with Claude Desktop / any MCP host

```json
{
  "mcpServers": {
    "csoai-drata": {
      "command": "node",
      "args": ["/path/to/csoai-drata-mcp/dist/index.js"],
      "env": {
        "DRATA_API_TOKEN": "your_token",
        "CSOAI_API_TOKEN": "your_csoai_token"
      }
    }
  }
}
```

## Environment variables

- `DRATA_API_TOKEN` — live Drata API key (optional; mock data returned if omitted).
- `DRATA_API_BASE` — override the Drata API base URL.
- `CSOAI_API_TOKEN` — CSOAI tenant token for signed attestations.
- `CSOAI_API_URL` — override the CSOAI API endpoint.

## Status

This is a scaffold. Live Drata API calls are stubbed and will be implemented once API credentials are available.
