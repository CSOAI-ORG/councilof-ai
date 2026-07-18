# MEOK LIVING TOPOLOGY — 2026 PRODUCT ALIGNMENT
**Status:** REALIGNED 2026-06-12 | **Authority:** DEFONEOS PRIVATE GITHUB
**Sync Target:** https://github.com/CSOAI-ORG/clawd-workspace

> ⚠️ **REALIGNMENT 2026-06-12 (added by Mavis, MEOK orchestrator)**
> The "FULLY ALIGNED" claim above was true on 2026-05-30 (topology date) but
> is no longer accurate. The codebase has grown 17 additional meok-* products
> since the topology was written, and 4 of the named brands (GAMING, CHARACTERS,
> COUNCIL, GUARDIAN) are fragmented across 2-4 physical locations each. Two
> Express stubs at `/Users/nicholas/meok-gaming/` and `/Users/nicholas/meok-council/`
> were phantom-source drift (claimed "JAX-MuJoCo" and "total_seats: 33" without
> the real engine). Both stubs were realigned 2026-06-12 to:
>   (a) honestly identify as stubs,
>   (b) point clients at the real engine locations,
>   (c) return 410 GONE on the deprecated endpoints that produced the phantom.
> See §FRAGMENTED BRANDS at the bottom of this doc for the full realignment matrix.

---

## 🏛️ THE SOVEREIGN CORE (Brain & Governance)
| Brand | Physical Path | Purpose | GitHub Strategy |
|-------|---------------|---------|-----------------|
| **MEOK ONE** | `~/clawd/meok-one` | The primary autonomous consolidation layer. | Core Repo |
| **MEOK SOVEREIGN** | `~/meok-sovereign-api` | Unified logic & backend for marketing surfaces. | Bridge Layer |
| **MEOK MCP** | `~/meok-ai/mcp` | The glue connecting all 219+ tools. | Ecosystem Rail |
| **MEOK EI3** | `~/CSOAI-Research-Institute/ei3` | Emotional Intelligence & Charter alignment. | Policy Engine |
| **MEOK DEFONEOS** | `~/clawd/meok-oneos` | The private GitHub infrastructure & OS package. | Master Host |

---

## 🛠️ THE UTILITY FLEET (Tools & Automation)
| Brand | Physical Path | Purpose | GitHub Strategy |
|-------|---------------|---------|-----------------|
| **MEOK MAP** | `~/clawd/_private_dagon` | Geospatial intelligence for compliance (Sentinel/OSM). | Private Defence |
| **MEOK MESH** | `~/meok-mesh` | Edge computing & node-to-node connectivity. | Infrastructure |
| **MEOK SIGIL** | `~/clawd/meok-sigil` | 2.4x data compression & opcode minting. | Protocol Layer |
| **MEOK CLAW** | `~/clawd/meok-cli` | Monospace TUI & developer cockpit. | Public Terminal |
| **MEOK GUARDIAN** | `~/meok-security` | Care Membrane & Rainbow Sentinel monitoring. | Safety Layer |

---

## 💼 THE SECTOR VERTICALS (Revenue & Enterprise)
| Brand | Physical Path | Purpose | GitHub Strategy |
|-------|---------------|---------|-----------------|
| **MEOK ENTERPRISE** | `~/meok-active-systems` | Corporate landing & B2B compliance tools. | Sales Pipeline |
| **MEOK WORK** | `~/meok-work` | Productivity, task execution, and 'MEOK DONE'. | Pro Tier |
| **MEOK SMB** | `~/meok-smb` | Small business AI automation stack. | Growth Tier |
| **MEOK FAMILY** | `~/meok-family` | Household AI & wellbeing monitoring. | Consumer Tier |
| **MEOK GAMING** | `~/meok-gaming` | 3D VRM characters & in-game AI persistence. | Gaming Engine |

---

## 🃏 STRATEGIC SHADOWS (Tactical Layers)
| Brand | Physical Path | Purpose | GitHub Strategy |
|-------|---------------|---------|-----------------|
| **MEOK DELBOY** | `~/clawd/revenue/` | Tactical cost-tracking & high-margin arbitrage. | Internal Revenue |
| **MEOK BLACKSWAN** | `~/clawd/sovereign-temple` | Resilience logic for high-impact edge cases. | Crisis Engine |
| **MEOK DONE** | `~/meok-work` | The philosophy of zero-latency task completion. | UX Pattern |

---

## 🚀 THE MEOK EI3 MANIFESTO
**Every interaction is governed by the Maternal Covenant. No character leaves the Factory without an SBT (Soulbound Token) of trust. We don't build software; we build SOVEREIGNTY.**

---

## 📦 §ADDITIONAL PRODUCTS (real, emerged post-2026-05-30, not in original topology)

The 17 meok-* products below are LIVE in the codebase but were created after
MEOK_LIVING_TOPOLOGY.md was written. Each needs to be slotted into the right
category above. Tentative mapping:

| Brand | Physical Path | Tentative Category | Purpose |
|---|---|---|---|
| meok-3d-characters | `clawd/meok-3d-characters/` | Verticals (Gaming cluster) | Architecture docs + slides for 3D pipeline |
| meok-amica | `clawd/meok-amica/` | Utility Fleet | 3D mascot lib (the live 3D character runtime) |
| meok-api-gateway | `clawd/meok-api-gateway/` | Sovereign Core | Unified API gateway (the 3200 substrate) |
| meok-attestation-api | `clawd/meok-attestation-api/` | Sovereign Core | Public sign/verify surface (proofof.ai) |
| meok-auth | `clawd/meok-auth/` | Sovereign Core | Auth model (FastAPI dependency tree) |
| meok-brand | `clawd/meok-brand/` | Strategic Shadows | Brand assets + character-factory |
| meok-bridge | `clawd/meok-bridge/` | Sovereign Core | Service-to-service bridge (mTLS) |
| meok-compliance-gateway | `clawd/meok-compliance-gateway/` | Sovereign Core | Compliance-aware routing (33-framework crosswalk) |
| meok-council-worker | `clawd/meok-council-worker/` | Utility Fleet | Cloudflare Worker for public Council surface |
| meok-desktop | `clawd/meok-desktop/` | Sector Verticals | Desktop app shell (Tauri) |
| meok-godeye | `clawd/meok-godeye/` | Utility Fleet | Codebase grep / search utility |
| meok-integrations | `clawd/meok-integrations/` | Utility Fleet | Third-party integration adapters |
| meok-kits-host | `clawd/meok-kits-host/` | Sector Verticals | White-label kit hosting (domain portfolios) |
| meok-labs-engine | `clawd/meok-labs-engine/` | Sovereign Core | The agent stack engine (per MEOK_LAUNCH_READINESS) |
| meok-marketing | `clawd/meok-marketing/` | Strategic Shadows | Marketing site + copy + LLM-GEO |
| meok-mobile | `clawd/meok-mobile/` | Sector Verticals | iOS + Android app shell |
| meok-platform | `clawd/csoai-platform/` (subdir of monorepo) | Sovereign Core | The Next.js/Vite web app (csoai-platform client) |
| meok-quiz | `clawd/meok-quiz/` | Sector Verticals | EU AI Act readiness scorecard funnel |
| meok-sdk-{go,python,typescript} | `clawd/meok-sdk-*` | Utility Fleet | Client SDKs for the MEOK API |
| meok-setup | `clawd/meok-setup/` | Utility Fleet | First-run installer / bootstrapper |
| meok-sigil | `clawd/meok-sigil/` | Utility Fleet | 2.4x data compression + opcode minting (per topology) |
| meok-skills | `clawd/meok-skills/` | Utility Fleet | MEOK-flavored skills (e.g. /article-50-kit) |
| meok-slack-app | `clawd/meok-slack-app/` | Sector Verticals | Slack integration (per Compliance as a Service) |
| meok-teams-app | `clawd/meok-teams-app/` | Sector Verticals | MS Teams integration |
| meok-verify | `clawd/meok-verify/` | Sovereign Core | The /verify public signing+verification endpoint |
| meok-vscode-extension | `clawd/meok-vscode-extension/` | Utility Fleet | VS Code ext for inline MEOK |

---

## 🔧 §FRAGMENTED BRANDS — REALIGNMENT MATRIX (2026-06-12)

The 4 brands Nick named (GAMING, CHARACTERS, COUNCIL, GUARDIAN) are
fragmented across multiple physical locations. Each row shows where the
brand-name product ACTUALLY lives vs where the topology / stubs claim it is.

### MEOK GAMING (topology: "3D VRM characters & in-game AI persistence")
- **STUB at `/Users/nicholas/meok-gaming/`** (3 files, Express hello-world, claimed "JAX-MuJoCo-Active" without the engine — REALIGNED 2026-06-12 to honest stub)
- **REAL pipeline**: `/Users/nicholas/clawd/meok-brand/character-factory/` (FLUX.1 + TRELLIS.2 + ComfyUI + Wan 2.7, 7 archetypes, SBT)
- **Architecture**: `/Users/nicholas/clawd/meok-3d-characters/` (production pipeline + slides + reference renders)
- **3D mascot runtime**: `/Users/nicholas/clawd/meok-amica/` (Amica 3D)

### MEOK CHARACTERS (Soulbound Tokens / 3D chars)
- **No standalone dir** exists. The brand is a concept, not a code repo.
- **Manifesto reference**: "No character leaves the Factory without an SBT" (MEOK EI3)
- **Where the SBT code lives**: `/Users/nicholas/clawd/meok-sovereign-api/` (per MEOK_EARNINGS_SBT_DESIGN_2026-06-01.md)
- **Character generation**: `meok-brand/character-factory/`

### MEOK COUNCIL (BFT 36 nodes / public transparency)
- **STUB at `/Users/nicholas/meok-council/`** (3 files, returned `total_seats: 33` — the EXACT phantom-source drift from memory entry! REALIGNED 2026-06-12 to 410 GONE on /consensus/live)
- **REAL Python engine**: `/Users/nicholas/clawd/meok/council/bft_council.py` (380 lines, 36/12/22, 100% tested in __main__, 4-phase PBFT: pre-prepare / prepare / commit / committed)
- **PUBLIC Cloudflare worker**: `/Users/nicholas/clawd/meok-council-worker/` (council.meok.ai, routes /council/* /mcp/* /compliance/* /attestation/* → internal VM:3200)
- **Vercel substrate mirror**: `/Users/nicholas/clawd/meok-attestation-api/` (proofof.ai domain, /api/council/* endpoints)
- **Plan doc**: `MEOK_DOME_OPENCLAWWORLD_PLAN_2026-06-01.md`

### MEOK GUARDIAN (Care Membrane / Rainbow Sentinel)
- **NO `meok-guardian` dir exists** at the claimed path `/Users/nicholas/meok-guardian` — REALIGNMENT GAP
- **REAL impl**: `/Users/nicholas/clawd/sovereign-temple/guardian/` (gaming_protection, pihole_integration, telegram_notifications, wifi_security)
- **Browser extension**: `/Users/nicholas/clawd/meok/guardian-browser-extension/` (manifest.json + popup.html + popup.js + content.js)
- **Discord bot**: `/Users/nicholas/clawd/meok/discord-guardian-bot/`
- **Concept dir (sister)**: `sovereign-temple/care-membrane` (in the sovereign-temple repo)
- **Topology said `meok-security` but that dir also doesn't exist** — same fragmentation as GUARDIAN

### MEOK DELBOY (per topology: "Tactical cost-tracking & high-margin arbitrage")
- **PyPI LIVE as `delboy-mcp 1.0.0`** (5 FastMCP tools, 8/8 conformance, schema bundles)
- **Schema**: `/Users/nicholas/clawd/delboy/v1.0/delboy-attestation.schema.json`
- **Regime mapping**: `/Users/nicholas/clawd/delboy/v1.0/regime-mapping.json` (16 clause→field mappings, 4 conflict-flags)
- **Server**: `/Users/nicholas/clawd/delboy/server/delboy_mcp/` (5 tools: attest_pending_action, attest_completed_action, attest_terminal, verify_chain, delboy_info)
- **GitHub**: NOT YET (waiting on Nick to create empty CSOAI-ORG/delboy, cron check-delboy-github will push the bundle)

### MEOK BLACKSWAN (per topology: "Resilience logic for high-impact edge cases")
- **REAL impl**: `/Users/nicholas/clawd/sovereign-temple/` (per topology mapping) — but the BLACKSWAN PLAYBOOK 671K docx describes a 26-domain .ai portfolio
- **Note**: The brand name "MEOK BLACKSWAN" doesn't have a single top-level dir; it's the resilient-mode applied across the sovereign-temple substrate

---

## ✅ §REALIGNMENT ACTIONS TAKEN 2026-06-12

1. **Stub at `/Users/nicholas/meok-gaming/server.js`** REALIGNED: now returns 410 GONE on /game/spawn (was claiming "JAX-MuJoCo-Active"), 200 STUB on /health + / with honest metadata pointing to the real pipeline
2. **Stub at `/Users/nicholas/meok-council/server.js`** REALIGNED: now returns 410 GONE on /consensus/live (was returning `total_seats: 33` — the phantom source drift), 200 STUB on /health + / with honest metadata pointing to bft_council.py and meok-council-worker
3. **MEOK_LIVING_TOPOLOGY.md** (this doc) updated with REALIGNED status, fragmentation matrix, and the 17 "extra-in-codebase" products
4. **Memory** updated with the realignment truth (saved at /Users/nicholas/.mavis/agents/mavis/memory/MEMORY.md)

## ❌ §REALIGNMENT GAPS REQUIRING NICK'S CALL

1. **Symlinks or top-level docs**: Should `meok-guardian/` exist as a symlink to `sovereign-temple/guardian/`? Trade-off: discoverability vs monorepo import breakage
2. **Stub dir fate**: Keep `/Users/nicholas/meok-gaming/` and `/Users/nicholas/meok-council/` as stub-only Vercel deploy targets, or delete them?
3. **Topology → codebase naming convention**: Should we rename `meok-council-worker` to `meok-council-public` (or similar) to disambiguate from the stub?
4. **The 17 extra-in-codebase products**: Nick's call on the tentative mapping above; some may belong in multiple categories
5. **MEOK CHARACTERS**: Is this a real product line or just a manifesto concept? If real, where does the SBT code go (meok-sovereign-api/ as suggested, or new meok-characters/)?
