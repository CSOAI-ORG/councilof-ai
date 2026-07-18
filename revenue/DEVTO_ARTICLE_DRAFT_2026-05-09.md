---
title: "How We Built 234 MCP Servers for EU AI Act Compliance (And Made Them Free to Try)"
published: false
description: "We shipped 234 Model Context Protocol servers covering EU AI Act, DORA, NIS2, and 9 other frameworks. Here's how they work and why we built them."
tags: mcp, ai, compliance, opensource
cover_image:
canonical_url:
---

If you deploy AI systems in the EU -- or sell to anyone who does -- compliance just became your problem. The EU AI Act is live, Article 50 watermarking obligations hit **November 2, 2026**, and the high-risk Annex III requirements land **December 2, 2027** (pushed back 16 months by the Digital Omnibus amendment, which bought everyone some breathing room but not as much as people think).

We built 234 MCP servers to help developers check compliance from inside their existing tools. All of them are on PyPI, all of them have a free tier, and all of them work with Claude Desktop, Cursor, VS Code, or any MCP-compatible client.

This post walks through what we built, how to set it up, and what it actually does.

## What's MCP and why does it matter for compliance?

Model Context Protocol is an open standard that lets AI assistants call external tools. Instead of alt-tabbing to a compliance dashboard, you ask your AI assistant to check a requirement and it calls the MCP server directly.

For compliance work, this changes the workflow from "read a 200-page regulation, guess whether you're covered" to "describe your system, get a structured answer."

## Quick start: 60 seconds to your first compliance check

Install the flagship EU AI Act server:

```bash
pip install eu-ai-act-compliance-mcp
```

Or run it directly without installing:

```bash
uvx meok-eu-ai-act-compliance
```

### Claude Desktop configuration

Add this to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "eu-ai-act-compliance": {
      "command": "uvx",
      "args": ["meok-eu-ai-act-compliance"],
      "env": {
        "MEOK_API_KEY": "your-api-key-here"
      }
    }
  }
}
```

Without an API key, you get 10 calls per day -- enough to evaluate whether the tool is useful before committing. With a key, the limit is removed.

### VS Code / Cursor

Same config pattern. Drop it into your MCP settings and the tools appear in your assistant's tool list.

## What a compliance check looks like

Once the server is running, you can ask your assistant something like:

> "Check whether a CV-screening tool that ranks job applicants falls under EU AI Act high-risk obligations."

The MCP server will return a structured response covering:

- **Risk classification** (in this case: high-risk under Annex III, Category 4 -- employment and worker management)
- **Applicable articles** with specific obligations
- **Deadlines** relevant to your system category
- **Required documentation** (technical docs, conformity assessments, human oversight requirements)

The output is structured data, not a chatbot opinion. You can pipe it into your CI, your docs, or your risk register.

## Beyond the EU AI Act: 12 frameworks, one interface

The 234 servers aren't all EU AI Act. We built compliance checkers for the frameworks developers actually run into:

| Framework | Server | What it checks |
|-----------|--------|---------------|
| EU AI Act | `eu-ai-act-compliance-mcp` | Risk classification, obligations, timelines |
| DORA | `meok-dora-compliance` | Financial sector ICT resilience |
| NIS2 | `meok-nis2-compliance` | Network and information security |
| CRA | `meok-cra-annex-iv-classifier` | Cyber Resilience Act product categories |
| GDPR | `meok-gdpr-compliance` | Data protection impact assessments |
| HIPAA | `meok-hipaa-compliance` | Healthcare data handling |
| SOC 2 | `meok-soc2-compliance` | Trust service criteria |
| ISO 42001 | `meok-iso42001-compliance` | AI management systems |
| ISO 27001 | `meok-iso27001-compliance` | Information security management |
| NIST RMF | `meok-nist-rmf-compliance` | Risk management framework |
| PCI-DSS | `meok-pci-dss-compliance` | Payment card security |
| OWASP | `meok-owasp-compliance` | Application security |

All installable via `pip install <package-name>`. All share the same freemium model.

## Why the Omnibus delay matters more than you think

When the EU pushed Annex III high-risk deadlines to December 2027, a lot of teams exhaled and moved compliance off the roadmap. That's a mistake for two reasons:

**First**, Article 50 transparency and watermarking obligations were *not* delayed. Those hit November 2, 2026. If your AI system generates synthetic content -- text, images, audio, deepfakes -- you need watermarking infrastructure in roughly six months.

**Second**, conformity assessments for high-risk systems take 12-18 months when you include documentation, testing, and audit cycles. If Annex III applies to you and you start in January 2027, you're already behind.

The delay didn't remove the obligation. It moved the cliff edge just far enough that people will forget about it until it's too late.

## Architecture: how the servers work

Each MCP server follows the same pattern:

1. **Tool registration** -- the server exposes tools via the MCP protocol (list of callable functions with typed parameters)
2. **Regulation mapping** -- user inputs are matched against structured regulation data (articles, annexes, recitals, guidelines)
3. **Classification engine** -- systems are classified by risk level, sector, and applicable requirements
4. **Structured output** -- results come back as typed objects, not free text

The servers are stateless. They don't store your queries, your system descriptions, or your classification results. The freemium gating is rate-limit based, tracked by IP for anonymous usage or by API key for authenticated usage.

## Running multiple servers together

For a typical fintech company deploying AI, you might want EU AI Act + DORA + GDPR running simultaneously:

```json
{
  "mcpServers": {
    "eu-ai-act": {
      "command": "uvx",
      "args": ["meok-eu-ai-act-compliance"]
    },
    "dora": {
      "command": "uvx",
      "args": ["meok-dora-compliance"]
    },
    "gdpr": {
      "command": "uvx",
      "args": ["meok-gdpr-compliance"]
    }
  }
}
```

Then ask your assistant: "Run a full compliance pre-check on our loan approval model across EU AI Act, DORA, and GDPR." You get three structured reports in one conversation.

## What we learned shipping 234 packages

A few things that might be useful if you're building MCP servers yourself:

- **Freemium gating works well for compliance tools.** Developers need to evaluate before they buy, and 10 calls is enough to know whether the tool fits. Conversion happens when they integrate it into CI and hit the limit naturally.
- **`uvx` is underrated.** Zero-install execution means the barrier to trying a tool is one command. No virtualenv, no dependency conflicts.
- **Structured output beats prose.** Compliance answers need to be auditable. Returning typed objects with article references, risk levels, and deadline dates is far more useful than a paragraph of advice.

## Try it

The free tier is live now. No sign-up required for the first 10 calls/day.

```bash
pip install eu-ai-act-compliance-mcp
```

Full package list: [pypi.org/user/MEOK_AI_Labs](https://pypi.org/user/MEOK_AI_Labs/)

Source: [github.com/CSOAI-ORG](https://github.com/CSOAI-ORG)

Website: [meok.ai](https://meok.ai)

If you're building MCP servers or working on AI compliance tooling, I'd genuinely like to hear what frameworks you're dealing with. Drop a comment or find us on GitHub.
