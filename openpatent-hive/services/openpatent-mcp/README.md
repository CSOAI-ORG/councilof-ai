# openpatent-mcp — npm package

Stdio MCP server that wraps the openpatent.ai API gateway. 4 tools:
disclose_invention, verify_disclosure, search_prior_art, draft_patent_claims.

## Install

```bash
npx -y @openpatent/mcp-server
```

## Add to your MCP client

Claude Code (`~/.claude.json`):
```json
{
  "mcpServers": {
    "openpatent": {
      "command": "npx",
      "args": ["-y", "@openpatent/mcp-server"],
      "env": {
        "OPENPATENT_API_BASE": "https://api.openpatent.ai",
        "OPENPATENT_API_KEY": "your-key-here"
      }
    }
  }
}
```

## Tags

disclose-first-ai-second · 6-layer-cryptographic-proof · bitcoin-ots · c2pa · ed25519
· sha3-512 · defensive-publication · prior-art · ai-safety · sovereignty
