# Anthropic Cookbook PR Draft — 2026-06-13

## Target
- Repo: github.com/anthropics/anthropic-cookbook
- File: /patterns/mcp/build_an_mcp_server.md (new) OR add to existing
- Or: /misc/compliance_mcp_servers.md (new)

## Title
"340+ compliance MCP servers: one per regulation (EU AI Act, DORA, NIS2, CRA, GDPR, ISO 42001, SOC 2, PCI DSS, HIPAA, FDA, MDR, AIDA)"

## Body
Hi Anthropic team,

I've been building a compliance-as-code fleet of MCP servers (https://github.com/CSOAI-ORG) over the last 8 months. I'd like to add a cookbook recipe showing how to use them with Claude.

The pattern is:
1. `pip install eu-ai-act-compliance-mcp`
2. Add to Claude Desktop / Cursor / Cline MCP config:
   ```json
   {"mcpServers": {"eu-ai-act-compliance-mcp": {"command": "uvx", "args": ["eu-ai-act-compliance-mcp"]}}}
   ```
3. Ask Claude: "What does EU AI Act Article 50 say about watermarking?"
4. Claude uses the MCP tool to get the actual text from EUR-Lex (not a hallucination)

The fleet has 340+ packages, all MIT-licensed, all on PyPI, all in the official MCP registry.

The recipe would show:
- Installing multiple MCPs at once
- Chaining them (audit-logger records every call)
- Using the /verify meter for pay-as-you-go
- Generating evidence packs for compliance audits

Happy to write the full .md file in the cookbook's style. Let me know which directory and naming convention you'd prefer.

Thanks,
Nick Templeman
MEOK AI Labs (CSOAI Ltd, UK Companies House 16939677)
