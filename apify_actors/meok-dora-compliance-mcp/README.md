# MEOK DORA Compliance — Apify Actor

**Source:** `github.com/CSOAI-ORG/dora-compliance-mcp`
**PyPI:** `pypi.org/project/dora-compliance-mcp`
**Author:** MEOK AI Labs (CSOAI Ltd, UK Companies House 16939677)
**License:** MIT

DORA Regulation (EU) 2022/2554 compliance. ICT risk, third-party, incident reporting.

## Tools

DORA Article 33 critical CTPP classification, Article 19 incident reporting

## Use

```json
{
  "mcpServers": {
    "meok-dora-compliance-mcp": {
      "url": "https://meok-dora-compliance-mcp.apify.actor/mcp"
    }
  }
}
```

Or run locally:

```bash
apify login
apify push
```

## Pricing

- **Free tier:** 1,000 runs/month, $0.001/run (Apify free compute)
- **Paid:** 10,000 runs/month, $0.005/run (with x402 USDC payment on Base)

## Compliance

This Actor is tooling only. It does not constitute legal advice. For final
compliance decisions, consult qualified counsel in your jurisdiction.
