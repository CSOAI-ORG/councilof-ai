# Show HN: Open-source EU AI Act compliance toolkit — 74 days until Article 50 deadline

## Title (for HN submission)
Show HN: Open-source EU AI Act compliance toolkit (MCP servers) - deadline in 74 days

## URL
https://councilof.ai

## Text (paste in the text field)

Hi HN,

I built a suite of open-source MCP (Model Context Protocol) servers that automate EU AI Act compliance checking. With the Article 50 watermarking + transparency deadline hitting 2 August 2026, I figured the community could use tools that actually work inside AI agent workflows rather than yet another PDF checklist.

What it does:
- Risk classification per Article 6 (prohibited/high-risk/limited/minimal)
- GPAI obligations checker (Article 52-55)
- Penalty calculator (up to 7% of global turnover)
- Compliance gap analysis against all 180 articles
- DORA, NIS2, CRA cross-regulation mapping
- AI Bill of Materials generation (Article 53)
- C2PA watermark attestation (Article 50)

All free, pip-installable, works with Claude Desktop, Cursor, or any MCP client:

    pip install eu-ai-act-compliance-mcp

The free tier gives 10 calls/day per tool. If you need signed attestations for auditors, there's a paid tier.

Stack: Python + FastMCP, no external API dependencies, runs entirely locally. 147 packages on PyPI covering EU AI Act, DORA, NIS2, CRA, UK AI Bill, ISO 42001, and more.

GitHub: https://github.com/CSOAI-ORG
PyPI: https://pypi.org/user/MEOK_AI_Labs/

Feedback welcome. Happy to answer questions about the regulatory landscape.
