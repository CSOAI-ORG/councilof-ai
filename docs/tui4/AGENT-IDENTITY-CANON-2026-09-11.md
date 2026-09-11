# TUI 4 — Canonical Agent Identity & Protocol Discovery

**Date:** 2026-09-11 (updated with live probes)
**Branch:** `agents/discovery-consolidation-20260911`
**Scope:** Audit, consolidate, and reconcile every MCP, A2A, x402, SDK, and directory surface.

---

## 1. Flagship Identity

One agent, one name across every surface.

| Surface | Identifier | Version | State |
|---------|-----------|---------|-------|
| MCP Registry | `io.github.CSOAI-ORG/gspc` | 1.4.0 (registry) / **1.4.2 (live)** | **STALE — registry needs publish** |
| MCP endpoint | `https://councilof.ai/mcp` | 1.4.2 | **LIVE** |
| MCP server card | `/.well-known/mcp/server-card.json` | schema 2024-11-05 | **LIVE** (stale: says 1.4.0/0.2.1, live is 1.4.2/0.2.2) |
| MCP .well-known | `/.well-known/mcp.json` | schema 2026-07-28 | **LIVE** (stale: says 1.4.0/0.2.1, live is 1.4.2/0.2.2) |
| npm package | `csoai-gspc-mcp` | 0.2.2 (server.json) / **0.2.1 (npm registry)** | **STALE — npm needs publish** |
| A2A Agent Card | `/.well-known/agent-card.json` | 1.1.0 | **LIVE** |
| A2A endpoint | `/api/a2a` | v1.0 JSON-RPC | **LIVE** |
| x402 catalog | `/.well-known/x402.json` | csoai.x402/0.2 | **LIVE** |
| x402 machine catalog | `/api/x402` | csoai.x402-catalog/0.3 | **LIVE** |
| Provider | CSOAI Ltd (UK 16939677) | — | **LIVE** |

### Identity consistency flags

| Check | Result |
|-------|--------|
| Provider name same on card + mcp.json + server-card | **PASS** — "CSOAI Ltd" everywhere |
| Provider URL same | **PASS** — `https://councilof.ai` everywhere |
| Server name same on registry + mcp.json | **PASS** — `io.github.CSOAI-ORG/gspc` |
| Tool count same across surfaces | **PASS** — 12 (8 free + 4 paid) on live, mcp.json, server-card |
| Registry version matches live | **FAIL** — registry says 1.4.0, live says 1.4.2 |
| npm version in server.json matches npm | **FAIL** — server.json says 0.2.2, npm shows 0.2.1 |

---

## 2. MCP Tools — Canonical Manifest

Source: `mcp/gspc-server/gspc-tools.json` (free) + `mcp/gspc-server/paid-tools.json` (paid).

| # | Tool | Free/Paid | Route | State |
|---|------|-----------|-------|-------|
| 1 | `board_totals` | Free | GET /api/gspc | **LIVE** |
| 2 | `get_axis` | Free | GET /api/gspc | **LIVE** |
| 3 | `verify_card` | Free | GET /signed/ + did:web | **LIVE** |
| 4 | `list_cards` | Free | GET /signed/card_index.json | **LIVE** |
| 5 | `get_root` | Free | GET /root.json | **LIVE** |
| 6 | `get_card` | Free | GET /cards/{sha16}.json | **LIVE** |
| 7 | `verify_inclusion` | Free | GET /api/proof?sha= | **LIVE** |
| 8 | `x402_trust` | Free | GET /api/x402 (snapshot) | **LIVE** |
| 9 | `commission_card` | Paid (x402) | GET /api/request-attestation | **LIVE** |
| 10 | `art50_marking_evidence` | Paid (x402) | POST /api/art50/marking-evidence | **LIVE** |
| 11 | `rwa_evidence` | Paid (x402) | GET /api/rwa/evidence | **LIVE** |
| 12 | `receipts_batch` | Paid (x402) | GET /api/receipts/batch | **LIVE** |

**Quarantined (not advertised):**
- `witness_hash` — paid witness issuance disabled pending release gate

**Dropped (explicitly not served):**
- `measure` — mill-tool dropped (a2a.ts and mcp endpoint both return -32601)

---

## 3. A2A Skills — Canonical Manifest

Source: `functions/api/a2a.ts` SKILL_IDS array + `public/.well-known/agent-card.json` skills[].

| # | Skill ID | Card declared | A2A implemented | State |
|---|----------|:---:|:---:|-------|
| 1 | `gspc-board` | Yes | Yes | **LIVE** |
| 2 | `east-west-crosswalk` | Yes | Yes | **LIVE** |
| 3 | `measured-badge` | Yes | Yes | **LIVE** |
| 4 | `benchmark-quality-register` | Yes | Yes | **LIVE** |
| 5 | `article50-detect` | Yes | Yes | **LIVE** |
| 6 | `eu-ai-act-screen` | Yes | Yes | **LIVE** |
| 7 | `x402-discovery` | Yes | Yes | **LIVE** |

**Card ↔ implementation parity:** 7/7 — all card-declared skills are implemented in a2a.ts.

---

## 4. x402 Resources — Canonical Manifest

Source: `/.well-known/x402.json` (9 resources) + `/api/x402` (9 resources).

| # | Resource ID | URL | Free preview | Amount | State |
|---|------------|-----|:---:|--------|-------|
| 1 | `free_door` | /api/free-door | Yes (0) | 0 USDC | **LIVE** (402 with amount=0) |
| 2 | `issuance` | /api/request-attestation | Yes (preview) | challenge-only | **LIVE** |
| 3 | `evidence_bundle` | /api/evidence-bundle | Yes (preview) | challenge-only | **LIVE** |
| 4 | `data_feed` | /api/eunomia-data | Yes (free) | challenge-only | **LIVE** |
| 5 | `proof_bundle` | /api/proof?bundle=1 | Yes (one free) | challenge-only | **LIVE** |
| 6 | `rwa_evidence` | /api/rwa/evidence | Yes (preview) | challenge-only | **LIVE** |
| 7 | `art50_marking_evidence` | /api/art50/marking-evidence | Yes (preview) | challenge-only | **LIVE** |
| 8 | `provider_diff_feed` | /api/feeds/provider-diff | Yes (free) | challenge-only | **LIVE** |
| 9 | `receipts_batch` | /api/receipts/batch | Yes (preview) | challenge-only | **LIVE** |

**x402 rail state:**
- Mode: **LIVE** (facilitator configured)
- Network: `eip155:8453` (Base)
- Asset: USDC (`0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`)
- PayTo: `0x212686404A7D1E1fD88F35eD6200c3aF7A78ae31`
- Scheme: exact (EIP-3009 transferWithAuthorization)
- Offer/Receipt: conditional (JWS EdDSA, kid `did:web:csoai.org#board-attestation-1`)

---

## 5. Directory Status

| # | Directory | State | Key issue |
|---|-----------|-------|-----------|
| 1 | Official MCP Registry | **LIVE** | 354 servers listed; 19 with broken repo URLs |
| 2 | Smithery | **LIVE (defect)** | stale tool scan (4 phantom tools), 401 deploymentUrl |
| 3 | Glama | **LIVE (defustable)** | 368 URLs, 40/40 connectors Unhealthy, 6/7 repos not installable |
| 4 | a2aregistry.org | **STAGED** | owner to run POST curl |
| 5 | a2a-registry.org | **STAGED** | owner to open PR |
| 6 | mcp.so | **NOT_LISTED** | zero CSOAI in 27,929 sitemap URLs |
| 7 | PulseMCP | **UNKNOWN** | 403 block page (was 213 listings on 9/5) |
| 8 | awesome-mcp-servers | **STAGED** | PR drafted, not opened |
| 9 | cursor.directory | **STAGED** | needs submission |
| 10 | Docker MCP Catalog | **STAGED** | needs PR |

---

## 6. Registry Integrity Debt

| Category | Count | Action |
|----------|-------|--------|
| Typo repo URLs (`CSAO-ORG`) | 5 | `mcp-publisher publish` with correct URL |
| Missing repo field (repo exists) | 6 | `mcp-publisher publish` with repo added |
| No public repo (need decision) | 23 | Withdraw or publish repo |
| New bad batch (underscore names) | 19 | Withdraw — repos never created |
| Stale tool count on gspc entry | 1 | Publish v1.4.2 descriptor |
| **Total** | **54** | |

---

## 7. Protocol Surface Inventory

| Protocol | Endpoint | State | Notes |
|----------|---------|-------|-------|
| MCP (Streamable HTTP) | /mcp | **LIVE** | 12 tools, no auth |
| MCP (stdio/npm) | csoai-gspc-mcp | **LIVE** | v0.2.2, npm published |
| A2A v1.0 | /api/a2a | **LIVE** | 7 skills, JSON-RPC |
| x402 | /.well-known/x402.json | **LIVE** | 9 resources, Base USDC |
| OpenAPI 3.1 | /openapi/gspc.json | **LIVE** | `public/openapi.json` + `functions/api/openapi.json.ts` |
| SDK (Python) | csoai-gspc | **PUBLISHED** (PyPI HTTP 200) | `pip install csoai-gspc[verify]` |
| Receipts endpoints | /api/receipts/{verify,index,batch,latest} | **LIVE** | `functions/api/receipts/` (4 handlers + 3 test files) |
| Witness status | /api/witness/status | **LIVE** | `functions/api/witness/status.ts` |
| DID:web | csoai.org/.well-known/did.json | **LIVE** | key-trust for signing |
| AP2 | — | **REGISTRY ONLY** | `csoai-ap2-mandate-mcp` + `csoai-google-ap2-tunnel` registered in MCP registry; no local implementation |
| AG-UI (SSE) | /api/agui/gspc-state | **LIVE** | SSE stream derived from /api/gspc at request time; upstream proxy stubs to RunPod (503 when unconfigured) |

---

## 7.5. Live Probe Results (2026-09-11 14:00 UTC)

Every surface was probed via HTTP from the CI terminal. Results:

| Surface | Probe | Result |
|---------|-------|--------|
| Agent Card | `GET /.well-known/agent-card.json` | **200** — version 1.1.0, 7 skills, 3 extensions |
| x402 Discovery | `GET /.well-known/x402.json` | **200** — csoai.x402/0.2, mode live, 9 resources |
| Free Door | `GET /api/free-door` | **402** with amount=0 — correct behavior |
| A2A Agents Index | `GET /.well-known/agents/index.json` | **200** — 12 agents, 8 free + 4 paid |
| MCP Initialize | `POST /mcp` (initialize) | **200** — serverInfo: csoai-gspc-mcp v1.4.2 |
| AG-UI SSE | `GET /api/agui/gspc-state` | **200** — SSE stream, 22 axes · 22 measured |
| request-attestation | `GET /api/request-attestation?subject=...` | **402** with 0.01 USDC (promo), signed JWS offer receipt |
| DID Document | `GET csoai.org/.well-known/did.json` | **200** — 5 verification methods |
| npm Registry | `GET registry.npmjs.org/csoai-gspc-mcp` | **200** — latest: 0.2.1 (server.json says 0.2.2) |
| Smithery (flagship) | `GET smithery.ai/server/csoai/gspc-mcp` | **308** redirect |
| Smithery (stale) | `GET smithery.ai/server/csoai/gspc` | **308** redirect |
| Glama | `GET glama.ai/mcp/servers?query=csoai` | **200** |
| PayAPI Market | `GET payapi.market/api/council-of-ai-gspc-eu-evidence-feed` | **200** |

### Signed Offer Receipt — CONFIRMED LIVE

The x402 offer-receipt extension is **actively emitting signed JWS offers** when `BOARD_SIGN_KEY_PKCS8_B64` is provisioned. The agent-card.json extension description says "DRAFT WE PUBLISH AND DO NOT YET EMIT" for the A2A signed-receipts extension, but the x402 offer-receipt is working. This is a documentation accuracy issue:

- **x402 offer-receipt:** LIVE (JWS EdDSA, kid `did:web:csoai.org#board-attestation-1`)
- **A2A signed-receipts:** Still DRAFT (task-outcome receipts not emitted)

### npm Version Drift

| Surface | Version |
|---------|---------|
| `mcp/gspc-server/server.json` | npm `0.2.2` |
| npm registry (`registry.npmjs.org`) | `0.2.1` |
| `mcp/gspc-server/package.json` | `0.2.2` |

**Action:** `npm publish` from `mcp/gspc-server/` to bring npm to 0.2.2.

---

## 8. Claims Rejected or Corrected

| Claim | Correction |
|-------|-----------|
| Registry v1.4.0 is current | Live is v1.4.2; registry needs publish |
| Smithery tool scan shows 8 tools | Actually 7 real + 4 phantom; 3 real tools missing |
| Glama csoai/gspc is healthy | All 40 health-checked connectors are Unhealthy |
| mcp.so lists CSOAI | NOT_LISTED — zero occurrences in 27,929 sitemap URLs |
| revenue/arms/x402.json prices | Those are aspirational SKUs; actual 402 amounts come from challenges only |
| AP2 has local implementation | Registry entries only (`csoai-ap2-mandate-mcp`, `csoai-google-ap2-tunnel`); no local code |
| AG-UI not implemented | IS implemented at `/api/agui/gspc-state` (SSE stream, `functions/api/agui/[[path]].ts`) |
| npm csoai-gspc-mcp is at 0.2.2 | npm registry shows 0.2.1; server.json/package.json say 0.2.2 — needs `npm publish` |
| x402 offer-receipt is DRAFT-only | Signed JWS offers ARE being emitted (live probe confirmed, EdDSA kid=board-attestation-1) |

---

## 9. Remaining Blockers

| # | Blocker | Owner | Impact |
|---|---------|-------|--------|
| 1 | MCP Registry publish (v1.4.2) | Owner token | Stale tool count visible to all clients |
| 2 | 19 registry entries need withdraw | Owner token | Broken repo URLs visible |
| 3 | Smithery update (re-scan tools) | Owner account | 4 phantom tools served to clients |
| 4 | Glama health check (connector URLs) | Owner account | 40 connectors show Unhealthy |
| 5 | mcp.so submission | Owner action | Not listed at all |
| 6 | a2aregistry.org POST | Owner action | Agent card not registered |
| 7 | x402 0.01 USDC test | Owner approval | Needs INTERNAL_SELF_FUNDED label |
| 8 | npm provenance | CI config | No attestation on npm package |
| 9 | npm version publish (0.2.2) | `npm publish` | npm registry shows 0.2.1, server.json says 0.2.2 — 12-tool stdio not on npm |

---

## 10. Revenue Truth (from /api/revenue)

| Metric | Value | Source | Classification |
|--------|-------|--------|---------------|
| Distinct non-self payers | 1 | REVENUE_KV | EXTERNAL_CUSTOMER |
| Settlements | 1 | REVENUE_KV | EXTERNAL_CUSTOMER |
| Self-settlements | 5 | REVENUE_KV | INTERNAL_SELF_FUNDED |
| Zero-value settlements | 4 | REVENUE_KV | ZERO_VALUE_PROBE |
| Settled USDC | 20,000 atomic (0.02 USDC) | REVENUE_KV | EXTERNAL_CUSTOMER |
| Rail mode | LIVE | X402_FACILITATOR_URL set | — |

**Revenue classification:** 1 external customer at 0.02 USDC. Self-payments (5) are INTERNAL_SELF_FUNDED and excluded from buyer count. Zero-value probes (4) are plumbing tests, not revenue. The TUI-4 x402 0.01 USDC test for `request_attestation` on `llama3.2:3b` would be classified INTERNAL_SELF_FUNDED when executed.

---

## 11. Surface Catalog Reference

Source: `public/interop/surface-catalog.json` (as_of 2026-09-06).

| Category | Count | Key entries |
|----------|-------|-------------|
| Sites | 5 | councilof.ai, csoai.org, www.csoai.org, HF org, GH org |
| API endpoints | 11 | /api/gspc, /api/state, /api/agui/gspc-state, /api/a2a, /api/cards, /api/axis-register, /api/detect, /api/checkout, /api/fulfill, /api/interop-bulk, /api/methodology |
| Interop datasets | 16+ | attestation-corpus, financial-measure-run, evm-control-facts, ai-economy-index, human-labour-index, mcp-security-scorecard, rwa-attest-index, etc. |
| Rails | 4 | EAS off-chain, XRPL (devnet), OpenTimestamps (planned), x402/HTTP 402 (live) |

---

## 12. Stablecoin/Subject Discovery Metadata (425 assets, 211 chains)

Source: `public/interop/stablecoin-universe-2026-09/readiness.json` + `rwa-registry.json`.

The 425-asset universe is a **frozen DefiLlama snapshot** (2026-09-11T08:19:34Z). Every asset row carries per-asset discovery metadata. The system uses a **subject-parameterization pattern** over shared endpoints — NOT 425 separate servers.

### Two-tier architecture

**Tier 1 — Shared catalog endpoints (free, always):**

| Endpoint | Per-asset? | Content |
|----------|:---:|---------|
| `/api/xrpl` | Yes | 16 locked XRPL assets with issuer, address, holders, supply, TOML check |
| `/api/state` | Aggregate | 8 named RWA instruments + XRPL counts |
| `/root.json` | No | Signed Merkle root with card_sha256 array |
| `stablecoin-universe-2026-09/readiness.json` | Yes (425) | Per-asset discovery state flags |

**Tier 2 — Per-asset parameterized endpoints (x402-metered):**

| Endpoint | Parameter | Pattern |
|----------|-----------|---------|
| `/api/rwa/evidence?asset=<symbol\|address>` | `asset` | XRPL symbol or r-address |
| `/api/request-attestation?subject=<id>&axis=<slug>` | `subject` | Any model/instrument/card ID (1-120 chars) |
| `/api/evidence-bundle?obligation=<id>&subject=<id>` | `obligation` + `subject` | article-50/53/dora/cra + model ID |

### Per-asset discovery states (from readiness.json)

Every row in the 425-asset index carries:
- `a2a_discovery_state`: "GENERIC_CATALOG_ONLY_NO_ASSET_SKILL"
- `mcp_discovery_state`: "GENERIC_CATALOG_ONLY_NO_ASSET_SKILL"
- `x402_discovery_state`: "GENERIC_CATALOG_ONLY_NO_ASSET_SKILL"
- `measurement_depth`: "REGISTRY_METADATA_ONLY"

**Only 1 asset (RLUSD) has deep independent measurement evidence.** The readiness file explicitly states: "a generic door is labeled as a generic door; it is never presented as 425 separate integrations."

---

## 13. x402 Bazaar (PayAI) Indexing State

Source: `scripts/interop/x402-bazaar-audit.py` + `docs/product/X402-BAZAAR-AUDIT.md`.

| Index | Scanned | CSOAI Listings | Current | Stale | Missing |
|-------|---------|:---:|:---:|:---:|:---:|
| PayAI | 28,348 | 6 | 1 | 5 | 3 |
| Coinbase CDP | 14,567 | 0 | 0 | 0 | 9 |

### PayAI listings detail

| Resource | Amount (units) | maxTimeout | Status |
|----------|---:|---:|---------|
| `/api/free-door` | 0 | 300 | **Current** |
| `/api/request-attestation` | 20,000 | 600 | **Stale** (timeout mismatch) |
| `/api/eunomia-data` | 20,000 | 600 | **Stale** |
| `/api/proof` | 20,000 | 600 | **Stale** |
| `/api/rwa/evidence` | 20,000 | 600 | **Stale** |
| `/api/receipts/batch` | 100,000 | 600 | **Stale** |

**3 manifest doors NOT indexed:** `/api/evidence-bundle`, `/api/art50/marking-evidence`, `/api/feeds/provider-diff`. These need confirmed settlements to appear in the Bazaar.

**Coinbase CDP: ABSENT.** Zero CSOAI entries across 14,567 resources. A real paid settlement (not just free-door zero-settle) may be needed for CDP indexing.

### Free door proof

- Price: **0 USDC** — real EIP-3009 settle on Base mainnet (proven tx `0xeb6c41bccb...`, block 50,874,723)
- Returns: live board totals, signed root, verification link, paid catalogue pointer
- Bazaar description: frozen at first-seed (120-char truncation); lastUpdated frozen at `2026-09-09T08:26:19.435Z`

### `pack.councilof.ai` leftover risk

Still serves the old mock door — could mislead discovery agents. Needs decommission or redirect.
