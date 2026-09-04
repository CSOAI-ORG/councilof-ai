# GSPC MCP — registry & directory submissions

Staging + status for listing the GSPC measurement server everywhere, permissionlessly
where possible. Verified against current docs Sept 2026. **One honest listing each — no
gaming.** We measure, never certify; every listing links to a recomputable verify.

## The asset
- Public repo: `https://github.com/CSOAI-ORG/councilof-ai` (server in `mcp/gspc-server/`)
- Remote HTTP MCP: `https://councilof.ai/mcp` (streamable-http, no auth, **11 tools** — 7 free, 4 x402-metered)
- stdio npm: `csoai-gspc-mcp` (`npx -y csoai-gspc-mcp`) — independently versioned. Do not write a tool
  count or version here; live `tools/list` and `npm view csoai-gspc-mcp version` are the authorities.
- A2A agent card: `https://councilof.ai/.well-known/agent-card.json`
- OpenAPI 3.1: `https://councilof.ai/openapi/gspc.json`

## Keywords to carry in every listing (search-surface levers)
`AI governance` · `model safety` · `EU AI Act` · `agent verification` · `MCP governance`
· `provenance` · `Ed25519`. Lead use-case: **the verify-before-you-trust check every
agent should run before trusting a model.**

## Reconcile
The MCP Registry descriptor identifies the remote HTTP implementation, so its `server.version`
must match JSON-RPC `initialize.serverInfo.version`. Registry publication can lag the live endpoint;
the published npm package is a separate implementation and release train. Payment travels as the
`x_payment` ARGUMENT, so carrying a metered tool is a packaging choice, not a transport limit.
Re-fetch all three surfaces before stating their versions or tool counts.

**Never write a tool count or a version in a listing you cannot re-check.** The MCP
registry entry carried "7 tools" and `packages: null` for weeks after the door had 12 and
an installable package existed, so it advertised the wrong capability AND gave clients
nothing to install. Re-derive from `tools/list` and `npm view` before every submission.

---

## PERMISSIONLESS — can be submitted without a maintainer's yes

| # | Registry | Mechanism | Status | Ranking levers |
|---|----------|-----------|--------|----------------|
| 1 | **Official MCP Registry** | `mcp-publisher` CLI (GitHub OAuth device flow) | **LISTED** `io.github.CSOAI-ORG/gspc` v1.2.0; corrected v1.3.0 descriptor is local until separately published | flat metadata; completeness of `server.json` (packages, remotes, description) drives downstream renders |
| 2 | **A2A registry (a2aregistry.org)** | one API POST of the well-known URI | **STAGED** (owner to run curl) | health-check liveness (re-polled ~30 min), skills/capabilities completeness |
| 3 | **A2A Registry (a2a-registry.org)** | PR a JSON agent file; CI validates | **STAGED** | liveness + card completeness |
| 4 | **Smithery** | submit HTTPS URL at smithery.ai/new; auto-scans tools | **STAGED** | clean tool scan; usage/tool-call volume; verified-vendor badge (separate, gated) |
| 5 | **mcp.so** | submit repo at mcp.so/submit; saving auto-publishes | **STAGED** | featured/curated placement, stars, recency (not documented) |
| 6 | **awesome-mcp-servers** (`punkpeye`) | PR one README line, alphabetical; `🤖🤖🤖` in PR title fast-tracks | **STAGED** | none algorithmic (SEO/backlink + downstream scraping) |
| 7 | **PulseMCP** | ingests the official registry automatically; submit form at pulsemcp.com/submit | **STAGED / auto** | popularity signals; "official" tag; confirm form reopened post-Aug pause |
| 8 | **Glama** | claim via GitHub OAuth or `glama.json` (maintainers) | **LIVE** | **Tool-Definition-Quality Score** — rich descriptions for all tools; 60% mean + 40% min TDQS; passing build |

### Exact submission payloads

**#2 — a2aregistry.org (headless, no account):**
```bash
curl -X POST https://a2aregistry.org/api/agents/register \
  -H "Content-Type: application/json" \
  -d '{"wellKnownURI":"https://councilof.ai/.well-known/agent-card.json"}'
```

**#6 — awesome-mcp-servers README line** (place alphabetically under the governance/security
category; confirm the emoji legend from surrounding entries):
```
- [CSOAI GSPC](https://github.com/CSOAI-ORG/councilof-ai) 🏎️ ☁️ - Independent AI-governance measurement: read the live GSPC board (EU AI Act, model safety, provenance) and verify Ed25519-signed measurement cards. The verify-before-you-trust check for agents. Measurement, not certification.
```
PR title: `Add CSOAI GSPC (AI-governance measurement) 🤖🤖🤖`

**#4 — Smithery:** open https://smithery.ai/new → "Add a remote server" → URL
`https://councilof.ai/mcp` (no auth). If auto-scan misses tools it reads
`/.well-known/mcp/server-card.json`.

**#5 — mcp.so:** open https://mcp.so/submit → repo URL
`https://github.com/CSOAI-ORG/councilof-ai` → complete draft → Save.

**#8 — Glama: LIVE, verified 2026-09-04.**
Listing: <https://glama.ai/mcp/servers/CSOAI-ORG/councilof-ai> — note the slug is the REPO
(`CSOAI-ORG/councilof-ai`), not the registry name `io.github.CSOAI-ORG/gspc`. Guessing the
registry-name URL returns 404 and has twice been misread here as "not listed". Check the search
page, never a guessed URL.
The root `glama.json` already carries `maintainers: ["CSOAI-ORG"]`, so the claim route is in place.
Description renders correctly. **Its tool scan is stale — it shows 4 tools, from the 0.1.0 era.**
Glama re-scans from the repo and official registry. The official v1.2.0 descriptor still says 12;
the corrected v1.3.0 descriptor is not live until separately published. Re-check before asserting a
count anywhere.
(Left for the owner so the maintainer username is not guessed.)

---

## REVIEW-GATED — submission prepared, needs a maintainer/team review

| # | Registry | Mechanism | Status | Note |
|---|----------|-----------|--------|------|
| 9 | **cursor.directory** | submit at cursor.directory/plugins/new (GitHub sign-in) → manual review | **STAGED** | auto-detects via the repo `.mcp.json` (now added at repo root); the old `cursor/mcp-servers` PR repo is deprecated |
| 10 | **Docker MCP Catalog** | PR to `docker/mcp-registry`: `servers/csoai-gspc/{server.yaml,tools.json,readme.md}` via `task wizard` → Docker-team review | **STAGED** | Apache-2.0 license OK; ~24h to go live on approval |

---

## Why completeness = ranking (honest levers only)
- Full descriptions for every tool actually returned by each release train (Glama TDQS, Smithery scan) beat stubs.
- Real installs + GitHub stars — fed by the `/connect-gspc` funnel and the badge flywheel,
  never fabricated.
- Keyword coverage (above) so registry search surfaces us.
- Genuine-utility signal: lead every listing with the verify-before-you-trust use-case.
