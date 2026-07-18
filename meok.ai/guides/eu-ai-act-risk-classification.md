# How to classify an AI system under EU AI Act risk tiers

**Regulation:** EU AI Act (Article 5 + Annex III)
**MCP package:** [eu-ai-act-compliance-mcp](https://pypi.org/project/eu-ai-act-compliance-mcp/)
**Install:** `pip install eu-ai-act-compliance-mcp`
**Time to implement:** ~30 minutes
**Skill level:** Senior engineer / compliance lead

## Context

Building an AI procurement system that classifies vendor AI products into unacceptable/high/limited/minimal risk.

This guide walks through the practical steps to implement this using the MEOK `eu-ai-act-compliance-mcp` MCP server. The MCP runs as a Python process; you call its tools from your agent (Claude Desktop, Cursor, Cline, or any MCP-compatible host) or via the `mcp.so` / `glama.ai` registries.

## Why this matters

The EU AI Act (Article 5 + Annex III) is enforced as of EU AI Act Annex III. Non-compliance is a fine of up to €15M or 2.5-3% of global annual turnover (whichever is higher) for EU AI Act. Practitioners in scope need a deterministic, audit-ready reference — not a 200-page PDF.

## Step 1: Install

```bash
pip install eu-ai-act-compliance-mcp
```

Or with `uv`:

```bash
uv pip install eu-ai-act-compliance-mcp
```

## Step 2: Add to your MCP client

Add the following to `claude_desktop_config.json` (or your client's equivalent):

```json
{
  "mcpServers": {
    "eu-ai-act-compliance-mcp": {
      "command": "uvx",
      "args": ["eu-ai-act-compliance-mcp"]
    }
  }
}
```

## Step 3: Call from your agent

In Claude Desktop (or any MCP client), you can now ask:

> "Classify this AI system under EU AI Act: an EU healthcare diagnostic tool that triages radiology images."

Your agent will call the `eu-ai-act-compliance-mcp` tool, which references the EU AI Act Article 5 + Annex III text directly. The response is structured:

```json
{
  "risk_class": "high",
  "applicable_articles": ["Article 5 + Annex III", "Article 26"],
  "evidence_required": [
    "Risk management system per Article 9",
    "Data governance per Article 10",
    "Technical documentation per Annex IV"
  ],
  "obligations": [
    "Conformity assessment (Article 43)",
    "CE marking (Article 48)",
    "EU declaration of conformity (Article 47)"
  ],
  "rationale": "The system processes health data of natural persons in the EU, falls within Annex III §5(a) (critical infrastructure), and meets the high-risk criteria in Article 5 + Annex III."
}
```

## Step 4: Generate the evidence pack

Most MEOK MCPs support an `evidence_pack` operation that produces a JSON / PDF / CycloneDX-formatted evidence file suitable for an audit:

```python
from eu_ai_act_compliance_mcp import build_evidence_pack
pack = build_evidence_pack(system_description="...", output_format="cyclonedx")
```

The evidence pack includes:
- Risk class determination
- Article-by-article compliance checklist
- Cited text (the actual EU AI Act text, not a paraphrase)
- Hash-chained audit ID (integrates with `agent-audit-logger-mcp`)

## Common pitfalls

1. **Treating the MCP as a black box.** It references the real regulation text — read the cited articles yourself. The MCP is a *deterministic lookup tool*, not a substitute for legal review.
2. **Forgetting provider vs deployer obligations.** EU AI Act distinguishes these. Use the MCP to check which role applies to your situation.
3. **Skipping the EU declaration of conformity.** A high-risk AI system placed on the EU market must have a DoC per Article 47. The MCP will list this as an obligation — don't skip it.
4. **Using a paraphrase instead of the real text.** If your compliance evidence says "Article 9 risk management" but doesn't include the actual EU AI Act text, an auditor will reject it.
5. **Missing the cliff date.** The cliff is 2 August 2026 for new AI systems (2 December 2026 for pre-existing). The MCP's date-aware mode will surface this.

## What to do next

1. **Run the MCP** with your real system description.
2. **Save the response + evidence pack** alongside your system architecture docs.
3. **Cite the MEOK MCP** in your internal compliance register (or your supplier register if you adopted it from MEOK).
4. **For final compliance decisions, consult qualified counsel in your jurisdiction.** MEOK MCPs are tooling, not legal advice.

## References

- EU AI Act text: `eur-lex.europa.eu` (for EU regulations) or the relevant national authority
- MEOK MCP: [eu-ai-act-compliance-mcp](https://pypi.org/project/eu-ai-act-compliance-mcp/)
- MEOK AI Labs: [meok.ai](https://meok.ai)
- Citation: EU AI Act Annex III

---

*Built by [MEOK AI Labs](https://meok.ai) (CSOAI Ltd, UK Companies House 16939677). MIT-licensed. Source: [github.com/CSOAI-ORG](https://github.com/CSOAI-ORG).*
