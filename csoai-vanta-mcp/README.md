# CSOAI Vanta MCP Server

A Model Context Protocol (MCP) server that bridges Vanta evidence and controls into the CSOAI Layer 0 trust layer.

## Tools

- `list_evidence` — list Vanta evidence folders and IDs.
- `get_control_status` — get status for a Vanta control.
- `export_attestation` — convert a Vanta control into a CSOAI attestation payload.
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
    "csoai-vanta": {
      "command": "node",
      "args": ["/path/to/csoai-vanta-mcp/dist/index.js"],
      "env": {
        "VANTA_API_TOKEN": "your_token",
        "CSOAI_API_TOKEN": "your_csoai_token"
      }
    }
  }
}
```

## Environment variables

- `VANTA_API_TOKEN` — live Vanta API key (optional; mock data returned if omitted).
- `VANTA_API_BASE` — override the Vanta API base URL.
- `CSOAI_API_TOKEN` — CSOAI tenant token for signed attestations.
- `CSOAI_API_URL` — override the CSOAI API endpoint.

## Status

This is a scaffold. Live Vanta API calls are stubbed and will be implemented once API credentials are available.
