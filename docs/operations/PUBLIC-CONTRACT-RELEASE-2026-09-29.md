# Public contract release candidate — 2026-09-29

Base: public GitHub master `c63c004d923455d8e32949e2078491fdc74f273c`.
Contract-source commit: `9cb5e6c9d54c02796b7ed57d2ef42cc81c6a66c4`.

## Candidate invariants

- Canonical GitHub capability source: `council-os/capabilities.json`.
- 214 declared capabilities; 179 are `LIVE`.
- HTTP contract identity is exact **method + /api path + lifecycle**.
- Candidate registry HTTP operations: **188**.
- Candidate OpenAPI HTTP operations: **188**.
- Missing: **0**. Extra: **0**. Lifecycle mismatches: **0**.
- OpenAPI: **138 paths**, **21 x402 doors**.
- MCP/A2A drift guard semantics are LIVE-name based; HTTP is lifecycle-aware.

## Pre-release production readback

Against live councilof.ai, the corrected guard currently reports:

- HTTP registered but not served from this GitHub registry: **32**.
- HTTP served but not registered here: **10**.
- MCP served but not registered here: **3**.
- A2A served but not registered here: **2**.

The public production estate is therefore ahead of this GitHub master in a newer source-backed capability tranche. This PR is **draft/review only until that tranche is reconciled**; it must not be used to roll production backward.

### Production-ahead, source-backed tranche

The Oracle/canonical mirror contains source and declarations for these production capabilities that public GitHub master has not yet absorbed:

- HTTP: `/api/measurement/fresh-capsule`, `/api/ras/mcp-probe`, `/api/ras/supply`, `/api/ras/x402-check` (GET plus POST aliases).
- MCP: `measurement_index`, `verify_capsule`, `server_evidence`.
- A2A: `measurement-capsules`, `server-evidence`.

Those additions are handled by a separate reconciliation step rather than being silently collapsed into this contract-fix PR.

### Production-only orphan routes

Six live HTTP routes were observed in production but no matching handler files or path history were found in the available Git object/worktree estate:

- `GET /api/momentum`
- `GET /api/wrapper/asset/dai`
- `GET /api/wrapper/asset/usdc`
- `GET /api/wrapper/asset/usdt`
- `GET /api/x402-quotes`
- `GET /api/xl`

They are not promoted into the registry by this PR merely because they are live. Source provenance must be recovered or the routes explicitly withdrawn.

## Public operational indexes

This candidate refreshes the existing public index machinery from current sources:

- `/layer0-drive-through.json`
- `/eat-flywheel.json`
- `/layer0-distribution.json`
- `/progress-index.json`

Current generated state on this GitHub lineage:

- 214 canonical capabilities / 179 LIVE.
- 23/23 GSPC axes measured.
- 78 correction entries.
- 28 x402 resources.
- 10 A2A skills.
- 1 distinct non-self payer.

## Post-deploy gate

This draft must not become a release until:

1. the production-ahead source-backed tranche is reconciled,
2. each production-only orphan route is source-recovered or intentionally withdrawn,
3. two independent witnesses return HTTP 200 for all four index URLs and agree on body hashes,
4. already-live public surfaces do not regress,
5. the production capability drift guard materially closes instead of moving the mismatch elsewhere.
