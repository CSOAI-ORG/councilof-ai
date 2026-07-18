# Reddit Posts — Ready to Post

---

## r/ClaudeAI

**Title:** I built 147 MCP compliance servers — EU AI Act deadline is 70 days away

**Body:**
Built a suite of free MCP servers that automate EU AI Act compliance checking directly in Claude Desktop / Cursor. With Article 50 (watermarking + transparency) hitting 2 August 2026, I wanted tools that work inside AI agent workflows instead of yet another checklist PDF.

What they do:
- Risk classification (prohibited / high-risk / limited / minimal)
- GPAI obligations checker (Articles 52-55)
- Penalty calculator (up to 7% of global turnover)
- Gap analysis against all 180 articles
- C2PA watermark attestation (Article 50)
- DORA + NIS2 + CRA cross-regulation mapping

Install: `pip install eu-ai-act-compliance-mcp`

Then add to your claude_desktop_config.json:
```json
{
  "mcpServers": {
    "eu-ai-act": {
      "command": "python",
      "args": ["-m", "eu_ai_act_compliance_mcp"]
    }
  }
}
```

All free, runs locally, no API keys. 147 packages on PyPI covering EU AI Act, DORA, NIS2, CRA, UK AI Bill, ISO 42001 and more.

GitHub: https://github.com/CSOAI-ORG
Landing: https://councilof.ai

Happy to answer questions about the regulatory landscape or how MCP servers work for compliance automation.

---

## r/artificial

**Title:** EU AI Act Article 50 deadline in 70 days — open-source compliance toolkit for AI developers

**Body:**
The EU AI Act Article 50 watermarking + transparency deadline is 2 August 2026. If you're building AI systems that generate synthetic content (text, image, audio, video) and serving EU users, you need machine-readable provenance markers.

I built open-source tooling that automates this:
- C2PA Content Credentials manifest generation
- Risk classification across all 180 articles
- GPAI self-assessment (Articles 52-55)
- Signed compliance attestations

Free: `pip install eu-ai-act-compliance-mcp`

Works as an MCP server with Claude Desktop, Cursor, or any MCP client. Also covers DORA (financial), NIS2 (cybersecurity), CRA (connected products), and UK AI Bill.

https://councilof.ai

---

## r/eupolicy

**Title:** Open-source toolkit for EU AI Act Article 50 compliance — 70 days to deadline

**Body:**
With the Digital Omnibus moving Article 50 transparency obligations to 2 August 2026, I've built open-source tooling that automates compliance checking for AI providers and deployers.

Covers:
- Article 50 watermarking (C2PA provenance metadata)
- Article 5 prohibited practices screening
- Article 6 risk classification
- Articles 52-55 GPAI obligations
- Annex III high-risk system identification
- Penalty calculator (up to 7% of global turnover)
- Cross-regulation mapping (DORA, NIS2, CRA)

Free and pip-installable: `pip install eu-ai-act-compliance-mcp`

Also built dedicated servers for DORA (financial entities), NIS2 (essential/important entities), CRA (connected products), and the UK AI Bill.

Would be interested to hear from compliance teams about what's missing or what would be most useful.

https://councilof.ai
