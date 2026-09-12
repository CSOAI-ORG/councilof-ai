# CSOAI Layer 0 Interoperability Map

**Date:** 2026-09-11
**Entity:** CSOAI Ltd (UK 16939677), `did:web:csoai.org`

## Protocol Surfaces

| # | Protocol | Surfaces | LIVE | BROKEN | STAGED |
|---|----------|----------|------|--------|--------|
| 1 | MCP | 7 (HTTP, fallback, stdio, dead worker, registry, Smithery, Glama) | 5 | 1 | 1 |
| 2 | A2A | 4 (JSON-RPC, agent card, agents.json, agent.json) | 4 | 0 | 0 |
| 3 | x402 | 12 (discovery, catalog, trust, free door, receipts verify, receipts payer, bulk, x402list, PayAPI, 8 paid doors) | 12 | 0 | 0 |
| 4 | AG-UI | 2 (GSPC state stream, wire proxy) | 1 | 0 | 1 |
| 5 | OpenAPI | 3 (full, GSPC, function tools) | 3 | 0 | 0 |
| 6 | DID:web | 1 (5 Ed25519 keys) | 1 | 0 | 0 |
| 7 | SDK | 3 (npm csoai-gspc-mcp, PyPI csoai-gspc, PyPI csoai-claimguard) | 3 | 0 | 0 |
| 8 | llms.txt | 1 | 1 | 0 | 0 |
| 9 | Feeds | 5 (corrections, cards, roots, press, RSS) | 5 | 0 | 0 |
| 10 | Signed Artifacts | 7 (board, measurement, chain, chain-facts, verify-card.mjs, card_index, root) | 7 | 0 | 0 |
| 11 | Interop Data | 14+ JSON files | 14 | 0 | 0 |
| 12 | .well-known | 304 doors | 304 | 0 | 0 |
| **Total** | | **363+** | **360** | **1** | **2** |

## Flagship Identity Alignment

| Surface | Identifier | Version | State |
|---------|-----------|---------|-------|
| MCP Registry | `io.github.CSOAI-ORG/gspc` | 1.4.2 (live) / 1.4.0 (registry, needs publish) | STALE |
| MCP endpoint | `https://councilof.ai/mcp` | 1.4.2 | LIVE |
| MCP server card | `/.well-known/mcp/server-card.json` | 1.4.2 (fixed) | LIVE |
| MCP .well-known | `/.well-known/mcp.json` | 1.4.2 (fixed) | LIVE |
| npm package | `csoai-gspc-mcp` | 0.2.2 (server.json) / 0.2.1 (npm, needs publish) | DRIFT |
| A2A Agent Card | `/.well-known/agent-card.json` | 1.1.0 | LIVE |
| x402 catalog | `/.well-known/x402.json` | csoai.x402/0.2 | LIVE |
| Provider | CSOAI Ltd (UK 16939677) | — | LIVE |

## MCP Tools (12)

| # | Tool | Free/Paid | Route |
|---|------|-----------|-------|
| 1 | board_totals | Free | GET /api/gspc |
| 2 | get_axis | Free | GET /api/gspc |
| 3 | verify_card | Free | GET /signed/ + did:web |
| 4 | list_cards | Free | GET /signed/card_index.json |
| 5 | get_root | Free | GET /root.json |
| 6 | get_card | Free | GET /cards/{sha16}.json |
| 7 | verify_inclusion | Free | GET /api/proof?sha= |
| 8 | x402_trust | Free | GET /api/x402 |
| 9 | commission_card | Paid | GET /api/request-attestation |
| 10 | art50_marking_evidence | Paid | POST /api/art50/marking-evidence |
| 11 | rwa_evidence | Paid | GET /api/rwa/evidence |
| 12 | receipts_batch | Paid | GET /api/receipts/batch |

## A2A Skills (7)

| # | Skill | Implemented | Handler |
|---|-------|:---:|---------|
| 1 | gspc-board | Yes | deriveBoard() |
| 2 | east-west-crosswalk | Yes | /api/cross |
| 3 | measured-badge | Yes | /api/badge |
| 4 | benchmark-quality-register | Yes | /api/benchmark-quality |
| 5 | article50-detect | Yes | /api/detect |
| 6 | eu-ai-act-screen | Yes | /api/assess |
| 7 | x402-discovery | Yes | /api/x402 |

## x402 Resources (9 declared, 6 indexed in PayAI)

| # | Resource | PayAI indexed | CDP indexed |
|---|----------|:---:|:---:|
| 1 | free_door | Current | No |
| 2 | request-attestation | Stale (timeout) | No |
| 3 | evidence-bundle | **Missing** | No |
| 4 | eunomia-data | Stale (timeout) | No |
| 5 | proof | Stale (timeout) | No |
| 6 | rwa/evidence | Stale (timeout) | No |
| 7 | art50/marking-evidence | **Missing** | No |
| 8 | feeds/provider-diff | **Missing** | No |
| 9 | receipts/batch | Stale (timeout) | No |

## DID:web Keys (5)

| Key ID | Purpose | Holder |
|--------|---------|--------|
| #site-release-1 | Site deploys, release cards | Keystone |
| #estate-chain-1 | Fleet board chains | Pod |
| #board-attestation-1 | x402 JWS, board snapshots | Cloudflare |
| #card-attestation-1 | Measurement cards | Mac-held |
| #gspc-board-22axis-2026 | 3-party MPC board key | Oracle (3 shares) |

## SDK/Packages (3)

| Package | Platform | Version | Install |
|---------|----------|---------|---------|
| csoai-gspc-mcp | npm | 0.2.1 (needs 0.2.2 publish) | npx -y csoai-gspc-mcp |
| csoai-gspc | PyPI | 0.2.20260905 | pip install "csoai-gspc[verify]" |
| csoai-claimguard | PyPI | latest | pip install csoai-claimguard |

## Distribution Mirrors (6)

| Mirror | URL | State |
|--------|-----|-------|
| HuggingFace | huggingface.co/csoai | LIVE |
| GitHub | github.com/CSOAI-ORG | LIVE |
| Kaggle | kaggle.com/.../csoai-gspc-living-board | LIVE |
| Zenodo DOI | doi.org/10.5281/zenodo.21991104 | LIVE |
| MCP CI Action | github.com/CSOAI-ORG/action-verify-attestation | LIVE |
| Council OS | github.com/CSOAI-ORG/council-os | LIVE |

## Gaps

| Gap | Impact | Fix |
|-----|--------|-----|
| MCP Registry stale (1.4.0 vs 1.4.2) | Clients get wrong version | mcp-publisher publish |
| npm version drift (0.2.1 vs 0.2.2) | stdio installs old version | npm publish |
| AP2 absent | No AP2 endpoints | N/A (external packages only) |
| MCP dead worker (404) | Stale in old registry versions | Documented as dead |
| Smithery stale duplicate | 4 phantom tools | Owner to retire csoai/gspc |
| Glama 40 unhealthy | All connectors show Unhealthy | Owner to update URLs |
| mcp.so not listed | Zero CSOAI in sitemap | Owner to submit |
| A2A signed-receipts DRAFT | Extension declared, not emitted | Pending implementation |
| OpenTimestamps PLANNED | Not yet implemented | Pending |
| 3 PayAI doors missing | Not indexed | Need confirmed settlements |
