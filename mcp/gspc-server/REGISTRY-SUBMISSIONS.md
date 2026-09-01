# GSPC MCP — registry & directory submissions

Staging + status for listing the GSPC measurement server everywhere, permissionlessly
where possible. Verified against current docs Sept 2026. **One honest listing each — no
gaming.** We measure, never certify; every listing links to a recomputable verify.

## The asset
- Public repo: `https://github.com/CSOAI-ORG/councilof-ai` (server in `mcp/gspc-server/`)
- Remote HTTP MCP: `https://councilof.ai/mcp` (streamable-http, no auth, **7 tools**)
- stdio npm: `csoai-gspc-mcp` (`npx -y csoai-gspc-mcp`) — **4 tools** (see reconcile note)
- A2A agent card: `https://councilof.ai/.well-known/agent-card.json`
- OpenAPI 3.1: `https://councilof.ai/openapi/gspc.json`

## Keywords to carry in every listing (search-surface levers)
`AI governance` · `model safety` · `EU AI Act` · `agent verification` · `MCP governance`
· `provenance` · `Ed25519`. Lead use-case: **the verify-before-you-trust check every
agent should run before trusting a model.**

## ⚠ Reconcile before re-publishing anywhere
The live HTTP server exposes **7** tools; the stdio npm package + `server.json` describe
**4** ("Four tools"). Options for the owner: (a) add `get_root` / `get_card` /
`verify_inclusion` to `mcp/gspc-server/index.mjs` + `gspc-tools.json` so stdio matches
HTTP, then bump `version` and re-publish; or (b) keep 4 on stdio and correct copy to
"4 (stdio) / 7 (HTTP)". Do NOT advertise 7 on the stdio package until the tools exist.

---

## PERMISSIONLESS — can be submitted without a maintainer's yes

| # | Registry | Mechanism | Status | Ranking levers |
|---|----------|-----------|--------|----------------|
| 1 | **Official MCP Registry** | `mcp-publisher` CLI (GitHub OAuth device flow) | **LISTED** `io.github.CSOAI-ORG/gspc` v1.1.0 | flat metadata; completeness of `server.json` (packages, remotes, description) drives downstream renders |
| 2 | **A2A registry (a2aregistry.org)** | one API POST of the well-known URI | **STAGED** (owner to run curl) | health-check liveness (re-polled ~30 min), skills/capabilities completeness |
| 3 | **A2A Registry (a2a-registry.org)** | PR a JSON agent file; CI validates | **STAGED** | liveness + card completeness |
| 4 | **Smithery** | submit HTTPS URL at smithery.ai/new; auto-scans tools | **STAGED** | clean tool scan; usage/tool-call volume; verified-vendor badge (separate, gated) |
| 5 | **mcp.so** | submit repo at mcp.so/submit; saving auto-publishes | **STAGED** | featured/curated placement, stars, recency (not documented) |
| 6 | **awesome-mcp-servers** (`punkpeye`) | PR one README line, alphabetical; `🤖🤖🤖` in PR title fast-tracks | **STAGED** | none algorithmic (SEO/backlink + downstream scraping) |
| 7 | **PulseMCP** | ingests the official registry automatically; submit form at pulsemcp.com/submit | **STAGED / auto** | popularity signals; "official" tag; confirm form reopened post-Aug pause |
| 8 | **Glama** | claim via GitHub OAuth or `glama.json` (maintainers) | **STAGED** | **Tool-Definition-Quality Score** — rich descriptions for all tools; 60% mean + 40% min TDQS; passing build |

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

**#8 — Glama:** sign in with GitHub (org admin) at glama.ai and claim, OR add a root
`glama.json` with a `maintainers` field naming the org admin's GitHub username, then claim.
(Left for the owner so the maintainer username is not guessed.)

---

## REVIEW-GATED — submission prepared, needs a maintainer/team review

| # | Registry | Mechanism | Status | Note |
|---|----------|-----------|--------|------|
| 9 | **cursor.directory** | submit at cursor.directory/plugins/new (GitHub sign-in) → manual review | **STAGED** | auto-detects via the repo `.mcp.json` (now added at repo root); the old `cursor/mcp-servers` PR repo is deprecated |
| 10 | **Docker MCP Catalog** | PR to `docker/mcp-registry`: `servers/csoai-gspc/{server.yaml,tools.json,readme.md}` via `task wizard` → Docker-team review | **STAGED** | Apache-2.0 license OK; ~24h to go live on approval |

---

## Why completeness = ranking (honest levers only)
- Full descriptions for **all 7 tools** (Glama TDQS, Smithery scan) beat stubs.
- Real installs + GitHub stars — fed by the `/connect-gspc` funnel and the badge flywheel,
  never fabricated.
- Keyword coverage (above) so registry search surfaces us.
- Genuine-utility signal: lead every listing with the verify-before-you-trust use-case.
