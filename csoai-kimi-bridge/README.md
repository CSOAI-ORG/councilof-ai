# csoai-kimi-bridge

An MCP server that lets Kimi agents query the CSOAI website, competitors, market gaps, and live SOV Town simulation output.

## Install

```bash
npm install -g csoai-kimi-bridge
```

Or run from source:

```bash
git clone https://github.com/CSOAI-ORG/csoai-kimi-bridge.git
cd csoai-kimi-bridge
npm install
npm run build
```

## Use with Kimi

Add to your MCP settings:

```json
{
  "mcpServers": {
    "csoai-kimi-bridge": {
      "command": "node",
      "args": ["/path/to/csoai-kimi-bridge/dist/index.js"],
      "env": { "CSOAI_SITE_URL": "https://csoai.org" }
    }
  }
}
```

## Tools

- `list_pages` — every public page on csoai.org and its purpose.
- `get_page_brief` — one-paragraph brief for any page by path.
- `list_competitors` — EAT kill-sheet competitors.
- `list_market_gaps` — high-priority market gaps.
- `get_simulation_summary` — latest SOV Town run summary.
- `propose_page_edit` — suggest an edit to a page (returns guidance, does not apply).

## Environment variables

- `CSOAI_SITE_URL` — target site URL (default: https://csoai.org).

## License

MIT © CSOAI LTD
