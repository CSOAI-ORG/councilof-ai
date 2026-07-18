# 🐉 Layer-0 Protocol / MCP Audit: openmoe.ai · openpatent.ai · OPENMCP · MCPscoreboard
**Date:** 2026-06-24 · **Agent:** JEEVES (Kimi Code CLI)  
**Task:** SOV3 `task_69fbfeb0` · **Sources:** live probes, `openmoe-bft/`, `clawd/openpatent-hive/`, `clawd/mcp-marketplace/`, `clawd/CSOAI_LAYER0_UP_MASTER_STACK_2026-06-19.md`, `clawd/_TABS/_inventory/OPENMCP_EXECUTION_2026-06-13.md`, `meok-sovereign-memory/ALIGNMENT_REPORT_2026-06-23.md`

---

## 1. WHAT "LAYER 0" REQUIRES

Per `CSOAI_LAYER0_UP_MASTER_STACK_2026-06-19.md`, Layer 0 is the **CSOAI sovereign foundation** beneath MCP/A2A/x402. It has 4 planes and 8 typed capabilities.

### 1.1 The 4 planes
| Plane | Required artifact | Honest status |
|---|---|---|
| Identity / Discovery | `did:csoai` + A2A agent cards + directory | **STUB** |
| Governance | 12-around-1 BFT council + Sovereign Gate + Maternal Covenant | **REAL** (`bft-progress-council-mcp` proven) |
| Compliance (proof) | 271-MCP regulation corpus wired as verifier | **REAL catalogue / verifier spec** |
| IP & Provenance | openpatent.ai + SIGIL Ed25519 hash-chain | **REAL rails** (177 records) |

### 1.2 The 8 capabilities (honest register)
| # | Capability | Status |
|---|---|---|
| A | Identity (`did:csoai`) | STUB |
| B | Certification (Watchdog Cert) | MOCK here; real signing in meok-attestation-api |
| C | Policy Engine (PDCA) | MOCK — `evaluate()` returns ALLOW |
| D | Cross-regional Handoff | MOCK — always SUCCESS |
| E | Micropayment Pre-check | **LOGIC REAL** |
| F | Blockchain Audit | MOCK — fabricated hashes |
| G | HITL Escalation | MOCK here; real BFT ships as `bft-progress-council-mcp` |
| H | Legacy Bridge (COBOL→MCP) | MOCK |

**Verdict:** Layer 0 is **architecture + a few real anchors**, not a fully running production substrate. The real anchors are BFT council, attestation/SIGIL, the 271-MCP corpus, and x402 middleware.

---

## 2. openmoe.ai / OPENMOE

### 2.1 Codebase
| Asset | Path | Repo / Hosting |
|---|---|---|
| openmoe-bft | `/Users/nicholas/openmoe-bft` | `CSOAI-ORG/OPENMOE` (public) |
| Clawd copy | `/Users/nicholas/clawd/openmoe` | submodule |
| Vercel landing | `/Users/nicholas/clawd/openmoe-deploy` | `https://openmoe.ai` |
| meok-cross-post | `/Users/nicholas/clawd/meok-cross-post` | scoreboard / distribution engine |
| Router | `/Users/nicholas/openmoe-bft/router/` | provider router |

### 2.2 MCP inventory
| Server / Tool set | Location | Tools | Status |
|---|---|---|---|
| **openmoe-bft** | `server.py` | `evaluate_eu_ai_act`, `validate_agent_card`, `red_team_scan`, `bft_quorum` | **Implemented** |
| **meok-cross-post** | `server.py` | `audit_repo`, `cross_post_metadata`, `manual_checklist` | **Implemented** |
| **openmoe-router** | `router/openmoe_router/mcp.py` | `openmoe_rank_providers`, `openmoe_provider_health` | **Partial** — `openmoe_route_completion` referenced but missing |

Discovery manifests (`server.json`, `smithery.yaml`, `glama.json`, `.well-known/mcp/server-card.json`) are present.

### 2.3 Live probes (24 Jun)
| Endpoint | Result |
|---|---|
| `https://openmoe.ai/` | **200** ✅ |
| `https://openmoe.ai/.well-known/mcp.json` | **200** ✅ (CSOAI MCP catalog) |
| `https://mcp.openmoe.ai/mcp` | **404** ❌ — no compute behind the domain |
| PyPI `openmoe-bft` | **Not found** ❌ |
| npm `@csoai-org/openmcp` | **Not found** ❌ |

### 2.4 Layer 0 fit
| Requirement | Fulfilled? | Gap |
|---|---|---|
| BFT council integration | Partial | `bft_quorum` tool exists; not wired to live `bft-progress-council-mcp` |
| EU AI Act verifier | Yes | `evaluate_eu_ai_act` covers Articles 9–15 |
| A2A agent card | Partial | `.well-known/agent.json` present; `did:csoai` stub |
| Attestation / SIGIL | Partial | Receipts module exists; no live SOV3 trigger |
| x402 payment | Config | Middleware written but not deployed |

### 2.5 Critical gaps
1. **No public MCP server** — `mcp.openmoe.ai` is DNS-only.
2. **Auth middleware not mounted** — `auth_middleware.py` exists but unused.
3. **Not on PyPI / npm** — install claims in README are false.
4. **Router has hardcoded provider stubs** — no live benchmark feed.
5. **No openmoe-specific tools on SOV3** — only generic `mcp_bridge_*` and `sigil_*` tools live.

---

## 3. openpatent.ai / OpenPatent Hive

### 3.1 Codebase
| Asset | Path | Hosting |
|---|---|---|
| Primary hive | `/Users/nicholas/clawd/openpatent-hive` | `CSOAI-ORG/openpatent-hive` |
| Co-work mirror | `/Users/nicholas/meok-sovereign-memory/12-co-work-repos/openpatent-hive` | synced copy |
| Landing deploy | `/Users/nicholas/clawd/openpatent-ai-deploy` | Vercel |
| Proof registry | `/Users/nicholas/clawd/proofof-site/openpatent` | static |

### 3.2 MCP inventory
| Server | Location | Tools | Status |
|---|---|---|---|
| **`@openpatent/mcp-server`** | `services/openpatent-mcp/` | 23 tools incl. `disclose_invention`, `verify_disclosure`, `search_prior_art`, `draft_patent_claims`, `attest_bft`, `get_checkout_link`, `ai_generate` | **Complete / packaged** (`openpatent-mcp-server-1.3.0.tgz`) |
| **PatentMCP Python** | `services/patentmcp_source/`, `/_ingest/patentmcp/` | `patentmcp.disclose`, `.verify`, `.search`, `.get_statistics` | **Complete** (port 3210) |
| **MCP Manifest** | `services/mcp-manifest/manifest.py` | 27 tools in `/.well-known/mcp.json` | **Complete** (port 3214) |
| **Sovereign-Temple BFT MCP** | `services/sovereign-temple-bft-mcp/` | 10 tools (per tests) | **Built** (TS stdio) |
| **openpatent-{search,scoreboard,draft,lab,whitepaper}-mcp** | `/Users/nicholas/_intake/openpatent-mcp/` | Manifests claim 10/8/12/10/8 tools | **STUBS** — empty `tools/list` |

### 3.3 Live probes (24 Jun)
| Endpoint | Result |
|---|---|
| `https://openpatent.ai/` | **200** ✅ |
| `https://api.openpatent.ai/health` | **000 / SSL_ERROR** ❌ |
| `https://mcp.openpatent.ai/.well-known/mcp.json` | **000 / SSL_ERROR** ❌ |
| `https://verify.openpatent.ai/health` | **SSL_ERROR** ❌ |
| npm `@openpatent/mcp-server` | **404** ❌ |

### 3.4 Layer 0 fit
| Requirement | Fulfilled? | Gap |
|---|---|---|
| IP & Provenance | Strong | SIGIL module, Ed25519 keys, attestation API tested live |
| BFT council | Partial | `attest_bft`, BFT council code present; not exposed via SOV3 |
| Compliance verifier | Partial | Patentability/consult tools; not wired to regulation corpus |
| A2A / DID | Partial | Agent card / manifest exist; DID is stub |
| x402 payment | Partial | Pricing tools; checkout links are placeholders |

### 3.5 Critical gaps
1. **Backend not deployed** — only the marketing landing page is live.
2. **TLS/DNS missing for `api.` / `mcp.` / `verify.`** subdomains.
3. **5 scaffold MCP servers are empty** — manifests overstate capability.
4. **`docker-compose.yml` references non-existent services** (`x402-router/`, `openpatent-primitives/`).
5. **npm package status unknown / not published**.
6. **No openpatent tools on SOV3** `tools/list`.
7. **Worker OTS upgrade is simulated**; Polygon/IPFS not functional.
8. **Stripe links are placeholders**.

---

## 4. OPENMCP / MCPscoreboard

### 4.1 Concept vs. reality
| Concept | Spec / Claim | Reality |
|---|---|---|
| **OpenMCP CLI** | `npm i -g @csoai-org/openmcp` — audit, publish, self-report | **Package does not exist on npm** ❌ |
| **Scoreboard UI** | `scoreboard.meok.ai` — ranked discovery of 18,400+ MCPs | **404** ❌ |
| **5-dimension scoring** | Popularity / Security / Maintenance / Docs / Sovereign | **Spec only** for cross-ecosystem; internal fleet scorecard covers 7 surfaces for 340 CSOAI MCPs |
| **x402 priority listing** | Pay for rank / badges | **Spec only** |
| **OpenMCP sovereign coordinator** | `openmcp-scoreboard-mcp` on SOV3 | **Stub** in `_intake/openpatent-mcp/` |

### 4.2 What actually exists
| Asset | Location | Status |
|---|---|---|
| Fleet scorecard engine | `clawd/mcp-marketplace/_scorecard/measure_surfaces.py` | Real — measures 7 discovery surfaces |
| Scoreboard snapshot | `clawd/_TABS/_inventory/scoreboard_2026-06-13.json` | 340/340 CSOAI MCPs, 7/7 surfaces covered |
| Gap map | `clawd/revenue/mcp_scoreboard_2026-06-06_GAP_MAP.md` | Real analysis; top gaps: monetization rails, HTTP transport, distribution, examples, docs |
| meok-cross-post scoreboard | `clawd/meok-cross-post/fleet.py` | Real — audits repos 0-100, emits ranked markdown/JSON |
| Ship CLI | claimed at `mcp-marketplace/_tooling/ship.py` | **Not found on disk** ❌ |
| Registry publisher | claimed at `mcp-marketplace/_scorecard/publish_registry_v2.py` | **Not found on disk** ❌ |

### 4.3 Honest registry status (per 13-Jun truth)
- **0 CSOAI-ORG packages in the Anthropic MCP registry** (`/v0.1/servers` full list).
- 340 CSOAI MCPs have **perfect 7/7 discovery surfaces** (server.json, A2A agent, ACP, llms.txt, glama.json, smithery.yaml, README badge).
- **Blockers:** GitHub token expiry, PyPI new-project throttling, npm `csga_global` squatters.

### 4.4 Critical gaps
1. **No runnable OpenMCP product** — CLI, API, and UI are all spec or missing.
2. **Scoreboard UI 404** — the public-facing scoreboard does not exist.
3. **No live cross-registry scoring** — no data ingestion from Smithery/Glama/PulseMCP/MCP.so.
4. **No x402 payment integration** for priority listing.
5. **No SOV3 coordinator tool** for the scoreboard.
6. **CSOAI-ORG has zero presence in the official MCP registry** — the 340 packages are not discoverable there.

---

## 5. CROSS-CUTTING PROTOCOLS

| Protocol | What exists | What's missing |
|---|---|---|
| **MCP stdio** | 271+ Python/Node MCPs in `mcp-marketplace/` | HTTP/SSE transport across the fleet (only 1/282 had HTTP per 06-06 gap map) |
| **A2A** | Agent cards in `.well-known/agent.json` for some hives | No live A2A message router; DID is stub |
| **x402** | Middleware / config in stack.yml, `x402_gateway_wrap/server.py` real | Settlement mock; not deployed as public gateway |
| **BFT / PBFT** | `bft-progress-council-mcp` proven (23/25 votes) | Not wired as a SOV3 tool for openmoe/openpatent decisions |
| **SIGIL / Attestation** | meok-attestation-api live; 177-record SIGIL chain | Most top MCPs have **no attestation** (only 68/282) |
| **DID / Identity** | `did:csoai` typed class | No real DID resolution or registry |

---

## 6. MASTER GAP MATRIX

| Need | openmoe.ai | openpatent.ai | OPENMCP | Layer 0 |
|---|---|---|---|---|
| Public MCP server endpoint | ❌ 404 | ❌ SSL down | ❌ CLI/UI missing | N/A |
| Published to PyPI / npm | ❌ | ❌ (unclear) | ❌ npm missing | N/A |
| Auth middleware mounted | ❌ written, not wired | ⚠️ exists but backend down | N/A | ❌ DID stub |
| Live SOV3 tools | ❌ none specific | ❌ none specific | ❌ none | ⚠️ generic bridges only |
| BFT council wired | ⚠️ tool exists, not live | ⚠️ code exists, not live | ❌ | ✅ real pkg |
| Attestation / SIGIL | ⚠️ receipts module | ✅ strong rails | ❌ | ✅ real rails |
| x402 payment deployed | ❌ | ❌ placeholders | ❌ spec | ⚠️ middleware real |
| A2A / DID | ⚠️ card only | ⚠️ card only | N/A | ❌ stub |
| HTTP/SSE transport | ❌ stdio only | ❌ stdio only | N/A | ❌ fleet-wide gap |
| Registry presence (Anthropic) | ❌ | ❌ | ❌ 0 CSOAI-ORG | N/A |
| Scoreboard / discovery UI | ⚠️ catalog JSON only | ⚠️ manifest only | ❌ UI 404 | N/A |

---

## 7. WHAT'S NEEDED TO SHIP

### Immediate (P0)
1. **Fix openpatent.ai backend deploy** — TLS + DNS for `api.`, `mcp.`, `verify.` subdomains on VM or GCP.
2. **Deploy openmoe-bft MCP server** — give `mcp.openmoe.ai` a real Vercel/Cloud Run service.
3. **Fix csoai.org EU AI Act hub** (from 24-Jun alignment audit) — same Layer-0 credibility risk.

### Short term (P1)
4. **Publish packages** — clear PyPI/npm blockers and release `openmoe-bft`, `meok-cross-post`, `@openpatent/mcp-server`, `@csoai-org/openmcp`.
5. **Mount auth middleware** in openmoe-bft / openpatent-mcp before public exposure.
6. **Deprecate or implement the 5 empty openpatent scaffold MCPs**.
7. **Build the OpenMCP scoreboard UI** — even a static Next.js read of `fleet_scorecard.json` would unblock the narrative.
8. **Wire BFT council into SOV3** as a reusable tool so openmoe/openpatent can call `bft_progress_council`.

### Medium term (P2)
9. **Add HTTP/SSE transport** to the top 15 compliance MCPs (biggest revenue ceiling per gap map).
10. **Attest the flagship MCPs** — apply shared meter/attestation decorator to top 15.
11. **Real DID registry** — replace `did:csoai` stub with actual resolution.
12. **Live cross-registry ingestion** for OpenMCP scoreboard (Smithery/Glama/PulseMCP/MCP.so).

---

## 8. BOTTOM LINE

- **openmoe.ai** has a solid BFT/EU-AI-Act research codebase but **no public MCP server and no package distribution**.
- **openpatent.ai** has the most complete product surface (23-tool MCP server, BFT, SIGIL) but **the production backend is offline**; only marketing pages are live.
- **OPENMCP / MCPscoreboard** is **mostly a specification** — the internal fleet scorecard for 340 CSOAI MCPs is real, but the public CLI/UI/scoreboard and cross-registry scoring do not exist.
- **Layer 0** has real anchors (BFT council, attestation/SIGIL, 271-MCP corpus, x402 middleware) but the broader identity/policy/audit/bridge capabilities are mocked.

**Highest-leverage fixes:** deploy the openpatent backend, deploy the openmoe MCP server, publish the npm packages, and stand up a minimal scoreboard UI. Those four moves turn spec into revenue-bearing surface.

---

*Audit closed 2026-06-24. Task `task_69fbfeb0` to be completed in SOV3 coord ledger.*
