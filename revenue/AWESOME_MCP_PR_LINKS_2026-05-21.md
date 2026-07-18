# awesome-mcp PRs — Ready to Open (Manual Step Required)

**Status:** 3 branches pushed to CSOAI-ORG forks · API-based PR creation blocked by GitHub on cross-org forks · Nick needs to click "Compare & pull request" on each.

## One-click PR URLs (open these in browser)

| Repo | Stars | One-click PR URL |
|------|-------|-------------------|
| **wong2/awesome-mcp-servers** | 4,092 | https://github.com/wong2/awesome-mcp-servers/compare/main...CSOAI-ORG:wong2-awesome-mcp-servers:add-meok-compliance-mcps?expand=1 |
| **appcypher/awesome-mcp-servers** | 5,554 | https://github.com/appcypher/awesome-mcp-servers/compare/main...CSOAI-ORG:appcypher-awesome-mcp-servers:add-meok-compliance-mcps?expand=1 |
| **punkpeye/awesome-mcp-servers** | 87,245 | https://github.com/punkpeye/awesome-mcp-servers/compare/main...CSOAI-ORG:awesome-mcp-servers:add-meok-compliance-mcps?expand=1 |

## Steps for Nick (5 min total)

1. Open the first URL above in a browser (logged in to GitHub).
2. Click **Create pull request**.
3. The title + body are pre-filled from the commit message. Optionally tweak.
4. Click **Create pull request** again to confirm.
5. Repeat for the other two URLs.

## Suggested PR titles (each repo)

> **Add MEOK Compliance MCPs (38 regulatory MCP servers)**

## Suggested PR body

> Adds a single-line entry for **MEOK Compliance MCPs** — a portfolio of 38 MIT-licensed compliance MCP servers covering:
>
> - **EU regulation:** EU AI Act, DORA, NIS2, CRA, GDPR, MiCA, MDR/IVDR
> - **Sector frameworks:** ISO 42001, NIST AI RMF, Basel III, MiFID II, FDA SaMD, HIPAA, COPPA/FERPA
> - **Cybersecurity:** MITRE ATT&CK, MITRE ATLAS, CISA KEV, SBOM (CycloneDX 1.6 + SPDX 3.0), SLSA, Sigstore Cosign
> - **AI-specific:** AI Bill of Materials, watermarking + C2PA, bias detection (Article 10), prompt-injection firewall
> - **A2A patterns:** agent handoff certification, rate limiter, audit logger, data residency, policy enforcement
>
> All MIT-licensed and self-hostable via `uvx <package>-mcp`. Pro tier adds HMAC-signed attestations for DORA Art 17 / EU AI Act Art 12 / ISO 42001 audit evidence.
>
> GitHub org: https://github.com/CSOAI-ORG
> Project: https://meok.ai

## Why API-based PR creation failed

The CSOAI-ORG forks are owned by a user-type account but GitHub treats cross-org PR creation as requiring different scopes than the OAuth token has. Web UI bypasses this. (See "Resource not accessible by personal access token" — the gh CLI has the right scopes but cross-fork policy still rejects.)
