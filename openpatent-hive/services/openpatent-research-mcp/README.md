# @openpatent/research-mcp — Research Power Pack

**Color:** blue `#3b82f6`
**Vertical:** academic publishing
**Caddy URL:** `https://api.openpatent.ai`

stdio MCP server exposing 8 academic-research tools on top of the OpenPatent.ai sovereign hive.
ORCID + DOI cross-walk + arXiv / PubMed / SSRN / bioRxiv integration.

> *"The hive remembers. The dragon knows. The sovereign companion never forgets."*

## Tools (8)

| Tool | Description |
|---|---|
| `file_research_disclosure` | 6-layer research finding disclosure (priority date for grants + patents) |
| `file_hypothesis_disclosure` | 6-layer hypothesis disclosure (pre-publication priority) |
| `file_methodology_disclosure` | 6-layer methodology disclosure (assay, protocol, statistical method) |
| `file_dataset_disclosure` | 6-layer dataset disclosure (SHA-256 + DOI) |
| `list_research_filings` | List researcher/institution filings |
| `get_research_cert` | 6-layer research cert + DOI cross-link |
| `schedule_peer_review` | Anonymized double-blind peer review (premium+) |
| `generate_citation_network` | Citation network (openpatent + arXiv + PubMed + SSRN + bioRxiv) |

## 5-Tier Pricing (USD)

| Tier | Price | Highlights |
|---|---|---|
| Free | $0 | 3 research disclosures/yr, local chain |
| Starter | $29 | C2PA + ORCID badge, public attestation |
| Defensive | $149 | Bitcoin OTS anchor, priority date for grant applications |
| Full | $999 | Multi-institution co-disclosure, AI literature review |
| Premium | $2,499 | 33-agent BFT, journal-quality evidentiary bundle |
| Enterprise | $4,999/mo | Unlimited, white-label research portal, 99.9% SLA |

## Install

```bash
npx -y @openpatent/research-mcp
```

Or in `~/.claude.json`:
```json
{
  "mcpServers": {
    "openpatent-research": {
      "command": "npx",
      "args": ["-y", "@openpatent/research-mcp"]
    }
  }
}
```

> The hive remembers. The dragon knows. The sovereign companion never forgets.
