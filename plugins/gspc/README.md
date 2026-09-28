# gspc — Council OS inside the tool you already use

A pointer to the GSPC MCP server at `https://councilof.ai/mcp` (streamable HTTP, no key).
The tools are whatever that server's `tools/list` returns — this file types no count, because
typed counts here went stale twice (it said "Four tools", then "Seven tools", and "No 23rd axis"
while the live board carried 23). Read the board itself: `GET https://councilof.ai/api/gspc`.

Measurement, never certification. Verification is free. A 404 leaf is INVALID, not UNCHECKABLE.

Strangers with a PDF and no Claude: use https://councilof.ai/gspc-verify — free, no plugin.

## Install (consent first)

Grok / Claude / Cursor / Kimi ask before activating an MCP server. Do **not** pass `--trust`
until you accept that.

```bash
# Grok — this folder (the repo must be reachable from where you install)
grok plugin install CSOAI-ORG/councilof-ai#plugins/gspc
# after the consent prompt:
grok plugin install CSOAI-ORG/councilof-ai#plugins/gspc --trust

# Claude Code — the generated plugin (distribution/plugin, one source for Claude, Cursor, Grok):
#   /plugin marketplace add <checkout>/distribution/plugin   then   /plugin install gspc@council-of-ai
# or the bare server:
claude mcp add --transport http gspc https://councilof.ai/mcp

# Cursor — ~/.cursor/mcp.json
# { "mcpServers": { "gspc": { "url": "https://councilof.ai/mcp" } } }
```

`.mcp.json` carries `"type": "http"`: without it Claude Code registers no server from this
folder (checked 2026-09-28 with Claude Code 2.1.283 — `claude mcp list` printed "No MCP servers
configured" for the url-only entry and "Connected" with the type added).

The npm stdio package (`npx -y csoai-gspc-mcp`) is a separately versioned implementation: its
tool list is not the HTTP door's. Ask it with `tools/list`; do not assume the two match.

The dedicated plugin repo `CSOAI-ORG/council-of-ai-grok` is not reachable anonymously while the
GitHub organisation is dark (HTTP 404, 2026-09-28), so it is not an install path today.

Council OS terminal `COMPUTE` reports the two-machine wire (census digest + AG-UI). It is not an
MCP tool. Lifestyle MCPs are not this product.
