# CSOAI public release handoff — 21 September 2026

Updated: 2026-09-21T14:34:00Z

## M2 release candidate

Working tree: `/Users/nicholas/clawd/wt-distribution-ledger-freshness-20260921`  
Branch: `codex/distribution-ledger-freshness-20260921`  
Head: `1378d76a7`

The candidate is clean and has two new focused local commits:

1. `a75dfac11 fix: separate MCP catalogue from protocol endpoint`
   - Keeps `/mcp` solely for the Streamable HTTP MCP protocol.
   - Moves the human catalogue and every detail page to `/mcps/` and `/mcps/:slug`.
   - Replaces the stale claim of a “291+ fleet” with the 292 rows actually present in the catalogue data.
   - Derives visible category and framework counts from the rows, so stale summary fields cannot hide a category.
   - Removes generic installation, API-key and gateway claims from a record page. Each record now states that it is discovery metadata and links to its named source.
   - Removes inaccurate subscription JSON-LD from record pages.

2. `1378d76a7 fix: reconcile public machine discovery metadata`
   - Aligns the MCP manifests, A2A directory description and buyer guide to the observed hosted MCP response: 13 tools, nine free read-only tools, four x402-metered evidence tools.
   - Adds `/ .well-known/mcp.json`, `/ .well-known/mcp/server-card.json` and `/ .well-known/x402.json` to the generated sitemap (spaces shown here only to prevent accidental rendering; actual paths contain no spaces).
   - Makes the sitemap gate reject a URL blocked by the default `robots.txt` policy.

The release bundle is ready locally:

- `/Users/nicholas/clawd/_alignment/councilof-ai-public-release-20260921.bundle`
- SHA-256: `dcee777728adcff16d43ce0a8ecf8ac3d4f054b7593b7b538df280790219fdb1`

## Local human and protocol readback

The desktop browser rendered the candidate directly from the M2 Vite server:

- `http://127.0.0.1:8791/mcps/` — title `MCP catalogue — 292 records | CSOAI`; shows the discovery boundary, 292 rows, 10 categories and 8 framework labels.
- `http://127.0.0.1:8791/mcps/a2a-governance-bridge-mcp` — title `MCP catalogue record — A2A Governance Bridge | CSOAI`; source and hosted-service boundaries shown.
- Local Pages runtime `GET /mcp` — HTTP 200 protocol JSON. Human `/mcps` routes require prerender in the Pages artifact; they currently return the expected 404 before that output exists.

The local prerender attempt for the two catalogue routes is blocked because this Mac lacks Playwright’s required `chrome-headless-shell` binary. The build itself passes. This is a concrete environment blocker, not a passing prerender claim.

## Exact validation passed

- Focused UI, route, truth, A2A, directory and JWS checks: **95 tests passed across 8 files**.
- `npm run guard:sitemap-truth`: passed; all **554** sitemap URLs are valid served paths under the candidate rules.
- `git diff --check`: passed before commit.
- `npm run build:client`: passed, including the project’s existing public-truth guards.

Build observation: the current artifact contains 19,901 public files, 99 under the 20,000 Pages limit. That leaves limited capacity and should remain a release preflight check.

## Live production remains separate

Nothing in this candidate has been deployed, uploaded, sent, claimed, paid for, signed, or submitted to an external directory.

Before release, production still has these known mismatches:

- `/mcps/` presents a stale “291+ fleet” surface with internal detail links that target the `/mcp` protocol path.
- The live sitemap has 552 URLs and omits the three machine-readable `.well-known` documents.
- Four sitemap-listed API endpoints are excluded by the live default robots policy.
- The live public MCP was observed through `POST /mcp` as 13 tools; public copy and some manifests had stale counts.

## M2 and M4 alignment

M4 (`IOKs-MacBook-Air.local`) is online and authenticated to Desktop Commander. Direct ping succeeded at `2026-09-21T13:06:25.070Z`, with version 0.2.51 and the active update script present. The previously reported missing update module belongs to an M2 npm cache path, not M4. No M4 repair was needed.

## Release gate and policy conflict

The candidate includes `ci/hf-jobs/deploy.sh`, a gated HF Jobs mirror of the deployment workflow. It needs a current source bundle plus `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`; all four deployment-token environment checks are absent on this M2 session. It also requires Playwright prerendering.

However, `DEPLOY-LOCK.md` still states that production writes happen only through GitHub Actions and expressly prohibits direct `wrangler pages deploy`. The HF runner itself invokes Wrangler. Those two rules conflict. No production action should be launched until the owner resolves that policy conflict and authorizes the exact hosted runner/credential path.

Once that is resolved, the required gate is:

1. a hosted run with the correct Cloudflare credential set and current source bundle;
2. successful prerender in that environment;
3. target/binding preflight;
4. anonymous production readback of `/mcps/`, one `/mcps/:slug`, `/mcp`, `/robots.txt`, `/sitemap.xml`, the three `.well-known` documents, and `/dashboard/?tab=distribution`;
5. the required two-minute anti-clobber recheck.

No wallet, Uniswap, MetaMask, payment, trading, signing, or external-directory action is part of this release.
