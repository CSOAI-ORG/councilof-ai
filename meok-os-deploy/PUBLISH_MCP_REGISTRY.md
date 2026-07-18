# Publish MEOK Hatch to the official MCP Registry

`server.json` (this dir) is ready and validated against the registry schema. The MCP endpoint is
**live** at `https://os.meok.ai/api/mcp` (verified: `initialize` → `serverInfo: meok-sovereign 1.0.0`,
protocol `2024-11-05`, `capabilities.tools`). Everything up to the *authenticated publish* is done here.

## What's ready (no owner key)
- `server.json` — name `io.github.CSOAI-ORG/meok-hatch`, remote `streamable-http` → `/api/mcp`.
- Live remote MCP server (JSON-RPC: initialize / tools/list / tools/call).
- `/.well-known/agent-card.json` (A2A), `/llms.txt`, `/api/hatch` (the signed package).

## Owner steps (need GitHub auth — cannot be done headless)
The registry verifies namespace ownership. `io.github.CSOAI-ORG/*` is owned by whoever can auth as
the CSOAI-ORG GitHub org, so publish from an interactive shell:

```bash
# 1. install the publisher CLI (Go)
brew install mcp-publisher   # or: go install github.com/modelcontextprotocol/registry/cmd/mcp-publisher@latest

# 2. authenticate as the namespace owner (opens browser)
mcp-publisher login github          # for io.github.CSOAI-ORG/*

# 3. from this directory (server.json present)
cd meok-os-deploy
mcp-publisher publish
```

- Then also list on the community mirrors for reach: **mcp.so**, **smithery.ai**, **glama.ai**,
  **MCP.Directory** (each is a web submit form — paste the `/api/mcp` URL + description).
- Namespace note: if `io.github.CSOAI-ORG` can't be verified, fall back to a DNS-verified namespace
  `ai.meok/meok-hatch` (add the TXT record the CLI prints to the meok.ai DNS zone).

## Honest status
The server.json + live endpoint are real and correct. The publish itself is one authenticated CLI
call the owner runs — I can't complete OAuth in this environment. After it lands, any MCP host
(Claude, Cursor, VS Code, ChatGPT) can one-click-install the sovereign Hatch.
