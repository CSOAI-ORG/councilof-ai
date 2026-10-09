# CSOAI public truth-alignment patch — 21 September 2026

## State

**Local review commit only:** `61cce41583cbc5ff44ea367aea98e2de3652525a`  
**Branch:** `codex/feed-mcp-public-pointer-20260921`  
**Commit:** `fix: align public MCP and x402 discovery copy`

This is a metadata and documentation correction. It does not alter MCP or x402 behaviour, introduce a product, make a settlement claim, or establish a deployment.

## Corrected public facts

- MCP discovery text now matches the verified tool manifests: **13 tools total = 9 free readers + 4 x402-metered evidence tools**.
- The public payer-query example now uses `0x0000000000000000000000000000000000000000`, an all-zero EVM address that is syntactically valid and does not identify a customer; human-facing copy says to replace it with the payer address. It replaces the non-copyable `0x…` Unicode ellipsis.
- Existing wording that distinguishes measurement from certification remains intact.

## Exact changed files

### MCP metadata and its regression checks

- `public/.well-known/mcp.json`
- `public/.well-known/mcp/server-card.json`
- `mcp/gspc-server/README.md`
- `functions/mcp/mcp-discovery.test.ts`
- `client/src/lib/staleCopy.test.ts`

### x402 source, generated artifacts, and regression checks

- `functions/.well-known/x402.json.ts`
- `functions/.well-known/x402.json.test.ts`
- `functions/api/x402.ts`
- `functions/api/receipt-status.ts`
- `functions/api/receipts/index.ts`
- `functions/api/receipts/latest.ts`
- `scripts/build_openapi.py`
- `scripts/fixtures/x402scan/well_known_x402.json`
- `scripts/llms/llms.txt.tmpl`
- `public/openapi.json`
- `public/llms.txt`
- `scripts/machine-contract-guard.mjs`

Historical interop captures were intentionally left unchanged: they are dated evidence, not current product instructions.

## Validation recorded

Passed in the isolated worktree:

- `git diff --check`
- `git diff --cached --check`
- `node --check scripts/machine-contract-guard.mjs`
- `python3 -m py_compile scripts/build_openapi.py`
- Static consistency check deriving the live declaration from `functions/mcp/gspc-tools.json` and `functions/mcp/paid-tools.json`: **9 + 4 = 13**, matching both MCP well-known files; it also checked every changed payer-example source/generated copy and JSON parsing of `public/openapi.json`.

`node mcp/gspc-server/wired-tools.test.mjs` exercised the real local stdio server and passed its `tools/list` length-13 and name checks. It exited non-zero at its separate `mcp_trust delegates to the canonical measured snapshot` assertion. This patch does not change the server implementation or that assertion path; only the package README changes under `mcp/gspc-server`.

The Vitest suite was not run because this isolated worktree has no installed `node_modules`; no dependency install was performed.

## Unreleased boundaries and remaining gates

- **Not pushed, merged, deployed, or anonymously served-read back.** Public endpoints can still contain the old wording until a controlled release is made and independently read back.
- The MCP registry-evidence `public_url` correction remains in local base commit `a42a5d6a020e7e1afc7d1f5b33936fdf6076b3a5`; it is also not served.
- The P1 canonical feed/sitemap decision remains unresolved: choose one canonical RSS route, update its self-link and sitemap, deploy, then read back `/api/feed.xml`, `/feed.xml`, `/rss.xml`, `/atom.xml`, and `/sitemap.xml` anonymously.
- The unavailable MCP evidence URL must remain represented as `public_url: null` / `not_separately_published` until a stable, independently retrievable public artifact exists. Do not invent a replacement URL.
- A controlled authorized publisher, deployment identifier, and post-deployment response-hash receipt remain required before calling any of these corrections public.
