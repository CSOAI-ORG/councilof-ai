# gspc — Council OS inside the tool you already use

Four tools: `board_totals` · `get_axis` · `verify_card` · `list_cards`.
Measurement, never certification. No 23rd axis. No sign.

Strangers with a PDF and no Claude: use https://councilof.ai — verify, free, no plugin.

## Install (consent first)

Grok / Claude / Cursor / Kimi will ask before activating MCP. Do **not** pass `--trust` until you accept that.

```bash
# Grok — GitHub source (this folder)
grok plugin install CSOAI-ORG/councilof-ai#plugins/gspc
# after the consent prompt:
grok plugin install CSOAI-ORG/councilof-ai#plugins/gspc --trust

# dedicated plugin repo
grok plugin install CSOAI-ORG/council-of-ai-grok

# Claude
claude mcp add gspc -- npx -y csoai-gspc-mcp
# or HTTP:
# POST https://councilof.ai/mcp

# Cursor — ~/.cursor/mcp.json
# { "mcpServers": { "gspc": { "url": "https://councilof.ai/mcp" } } }
```

Lifestyle MCPs are not this product.
