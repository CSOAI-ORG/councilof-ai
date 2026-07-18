# Apify MCP Store Submission Kit — MEOK AI Labs
**Date:** 2026-06-13
**Status:** ZERO coverage today. This kit provides everything needed to publish the top 14 compliance packages as Apify Actors.

## Why this is the most important miss

**Apify has a real, browseable MCP server category** at `apify.com/store/categories/mcp-servers`, with 5,000+ Actors indexed. AI agents pull from it via the Apify MCP server (`mcp.apify.com`) — the same channel is integrated into Claude Desktop, Cursor, VS Code, ChatGPT. Zero MEOK coverage means we miss the only distribution channel that has:

1. **Built-in billing** — agentic payments via x402 (USDC on Base) or Skyfire
2. **Default MCP server** in every major AI client (Claude Desktop, Cursor, VS Code, ChatGPT)
3. **Recurring revenue** per Agent invocation
4. **SEO/discovery** — Apify Actor pages rank for "EU AI Act MCP" type queries

## Top 14 MEOK packages to publish as Apify Actors

| # | Package | Why | Apify Actor slug |
|---|---------|-----|-------------------|
| 1 | eu-ai-act-compliance-mcp | 1,287/wk PyPI, cliff 2 Aug 2026 | `meok/eu-ai-act-compliance` |
| 2 | dora-compliance-mcp | 1,186/wk, LIVE | `meok/dora-compliance` |
| 3 | cra-compliance-mcp | 1,073/wk, cliff 11 Dec 2027 | `meok/cra-compliance` |
| 4 | gdpr-compliance-ai-mcp | 980/wk, LIVE | `meok/gdpr-compliance` |
| 5 | bias-detection-mcp | 974/wk, AI Act Art 10 | `meok/bias-detection` |
| 6 | iso-42001-ai-mcp | 881/wk, AIMS | `meok/iso-42001` |
| 7 | ai-bom-mcp | 874/wk, EU AI Act Art 13 | `meok/ai-bom` |
| 8 | nis2-compliance-mcp | LIVE, 660/wk | `meok/nis2-compliance` |
| 9 | explainability-report-mcp | 587/wk, EU AI Act Art 13 | `meok/explainability-report` |
| 10 | agent-audit-logger-mcp | 659/wk, hash-chained | `meok/agent-audit-logger` |
| 11 | csrd-compliance-mcp | 542/wk, ESRS | `meok/csrd-compliance` |
| 12 | canada-aida-ai-mcp | 513/wk, Canada AIDA | `meok/canada-aida` |
| 13 | ai-incident-reporting-mcp | 482/wk, Art 73 + NIS2 | `meok/ai-incident-reporting` |
| 14 | meok-attestation-verify | 103/wk, hardware root-of-trust | `meok/attestation-verify` |

## Per-Actor submission template

Each Actor is a thin wrapper around our existing `server.py` (already Python+FastAPI+stdio). The Apify Actor uses container transport.

### Directory structure

```
meok-eu-ai-act-compliance-actor/
├── .actor/
│   ├── actor.json           # Apify manifest
│   ├── input_schema.json    # Apify input
│   └── output_schema.json   # Apify output
├── Dockerfile               # Extends our hardened base
├── src/
│   └── main.py              # Thin wrapper around server.py
└── README.md
```

### `.actor/actor.json` (template)

```json
{
  "actorSpecification": 1,
  "name": "meok-eu-ai-act-compliance",
  "title": "MEOK EU AI Act Compliance",
  "description": "410 articles from EUR-Lex via FTS5 search. Instant risk scan, deterministic class detection, evidence pack export. By MEOK AI Labs.",
  "version": "1.0.0",
  "input": "./input_schema.json",
  "output": "./output_schema.json",
  "dockerfile": "../Dockerfile",
  "categories": ["AI", "COMPLIANCE"],
  "requiredSecrets": [],
  "httpMcpServer": {
    "transport": "streamable-http",
    "url": "https://meok-eu-ai-act-compliance.apify.actor/mcp"
  }
}
```

### `input_schema.json` (template)

```json
{
  "title": "MEOK EU AI Act Compliance Input",
  "type": "object",
  "schemaVersion": 1,
  "properties": {
    "system_description": {
      "title": "AI system description",
      "type": "string",
      "description": "Plain-English description of the AI system (e.g. 'EU healthcare diagnostic AI that triages radiology images')",
      "editor": "textarea"
    },
    "operation": {
      "title": "Operation",
      "type": "string",
      "enum": ["risk_classify", "article_lookup", "evidence_pack"],
      "default": "risk_classify"
    },
    "region": {
      "title": "Region",
      "type": "string",
      "enum": ["EU", "UK", "US", "CA", "AU", "GLOBAL"],
      "default": "EU"
    },
    "api_key": {
      "title": "MEOK API key (optional)",
      "type": "string",
      "description": "For higher rate limits (200/day cap). Get one at meok.ai/dashboard"
    }
  },
  "required": ["system_description", "operation"]
}
```

### `Dockerfile` (extends our hardened base)

```dockerfile
FROM meok/mcp-base:latest
COPY . /app
WORKDIR /app
RUN pip install --no-cache-dir eu-ai-act-compliance-mcp==1.8.11
EXPOSE 8081
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD curl -fsS http://localhost:8081/healthz || exit 1
CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8081"]
```

### `src/main.py` (thin wrapper)

```python
from fastapi import FastAPI
from mcp.server.fastmcp import FastMCP
import os

# Reuse existing server.py logic via subprocess
mcp = FastMCP("meok-eu-ai-act-compliance")

@mcp.tool()
def risk_classify(system_description: str, region: str = "EU") -> dict:
    """Classify an AI system's EU AI Act risk class (unacceptable / high / limited / minimal).
    
    Returns:
        { "class": str, "articles": [str], "evidence_required": [str], "rationale": str }
    """
    # Delegate to the actual server.py
    import subprocess, json
    result = subprocess.run(
        ["python", "-m", "eu_ai_act_compliance", "risk_classify",
         "--description", system_description, "--region", region],
        capture_output=True, text=True
    )
    return json.loads(result.stdout)

if __name__ == "__main__":
    mcp.run(transport="streamable-http", port=8081)
```

## Submission workflow

For each of the 14 packages:

```bash
# 1. Create the Actor directory
cp -r /Users/nicholas/clawd/mcp-marketplace/_templates/apify-actor-template/ meok-<package>-actor/

# 2. Customize actor.json, input_schema.json, and main.py
# 3. Build and test locally
cd meok-<package>-actor
apify login
apify push

# 4. Verify in store
open https://apify.com/meok/<package>
```

**Time per Actor:** ~1 hour agent (template is 90% reusable).
**Total for 14 packages:** ~14 hours.

## IndexNow + Apify combined push

After Apify publishes the 14 Actor pages, submit them via IndexNow batch:

```json
{
  "host": "meok.ai",
  "key": "<INDEXNOW_KEY>",
  "urlList": [
    "https://apify.com/meok/eu-ai-act-compliance",
    "https://apify.com/meok/dora-compliance",
    ...
  ]
}
```

POST to `https://api.indexnow.org/indexnow` with the JSON body.

## EAT angle for Apify

Apify Actor pages get indexed by Google. Each Actor page becomes a citation-ready URL with:
- Author = MEOK AI Labs
- Source = github.com/CSOAI-ORG/...
- License = MIT
- Compliance disclaimer
- "Used by" (Apify shows usage stats publicly)

This is a **free EAT signal** — 14 indexed pages with verifiable author + source + license + disclaimers.

## Cost

- Apify free tier: 5 actors, 1GB memory, $5/mo credit. Sufficient for 14 Actors at low volume.
- Apify paid: $49/mo for 30 actors + 16GB memory + $50/mo compute credit. Needed once 1 Actor exceeds free tier.
- Per-actor run cost: ~$0.001-0.01 (FastAPI container, 1-5s execution).
- x402 / Skyfire payment: 0.5% transaction fee on paid Actor runs.

**Expected revenue at 1k runs/day across 14 actors:** $20-200/day once traffic hits.
