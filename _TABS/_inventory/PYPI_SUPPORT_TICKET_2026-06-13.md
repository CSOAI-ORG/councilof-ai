# PyPI Support Request: Per-Account "Too many new projects created" 429 Throttle

**Date:** 2026-06-13
**Reporter:** MEOK AI Labs (CSOAI Ltd, UK Companies House 16939677)
**PyPI User:** Nicholastempleman
**Contact:** nicholas@meok.ai

## Summary
Requesting a per-account throttle exemption for the MEOK MCP compliance fleet (340+ PyPI packages). The account is currently rate-limited with HTTP 429 "Too many new projects created" blocking all new project uploads.

## Context
We are publishing a compliance MCP (Model Context Protocol) server fleet — 340+ packages, one per regulation article or compliance domain (EU AI Act, DORA, NIS2, CRA, GDPR, ISO 42001, SOC 2, PCI DSS, HIPAA, FDA, MDR, etc.). Each package is independently installable, MIT-licensed, and registered in the official MCP registry at registry.modelcontextprotocol.io.

The fleet architecture requires one PyPI project per package because:
- Agents install only what they need (not 1 big package with 410 EU AI Act articles)
- Independent versioning per regulation
- Independent security audit per package
- Independent license declarations

## What we've done
- 336/340 packages successfully published
- 4 packages blocked by the per-account 429 throttle
- We have followed the [MCP Scorecard](https://proofof.ai/scorecard) and [MEOK packaging standards](https://meok.ai/standards)
- All packages ship with `<!-- mcp-name: io.github.CSOAI-ORG/<name> -->` in their PyPI description
- All packages have `pyproject.toml`, `server.json`, `acp.json`, `.well-known/agent.json`, `llms.txt`, `glama.json`, `smithery.yaml`, README badge — the full 7-surface coverage

## Blocked packages
- `meok-credential-manager-mcp` 1.0.4 (last attempt: 2026-06-13 12:00 BST, response: 429)
- `meok-credential-vault-mcp` 1.0.0 (not yet attempted — known to be throttled)
- `meok-credential-rotation-mcp` 1.0.0 (not yet attempted)
- ~2 more packages pending

## Questions
1. Is the 24-48h wait the recommended unblock path?
2. Is there a higher quota for verified-org accounts (we can supply Companies House registration)?
3. Should we batch uploads via Trusted Publishing (GitHub Actions) to spread the throttle window?

## Verification
- Org: https://github.com/CSOAI-ORG (50+ public repos)
- Site: https://meok.ai
- MCP registry proof: https://registry.modelcontextprotocol.io (299/300 packages indexed as `io.github.CSOAI-ORG/*`)
- Companies House: https://find-and-update.company-information.service.gov.uk/company/16939677

## Proposed unblock
We are willing to:
- Slow upload cadence to 1 per hour (vs current 30/min)
- Register Trusted Publishing for all repos
- Provide Companies House verification for org-level quota

Please advise on the recommended unblock path.

Thank you,
MEOK AI Labs / CSOAI Ltd
