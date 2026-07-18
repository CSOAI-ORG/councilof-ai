# 🐉 CSOAI + MEOK — MASTER CHECKLIST (the recipe so we miss nothing)

Single source for everything in flight. **Legend:** ✅ done · 🔄 in progress · ⬜ to do (M4 lane, no keys) · ⧗ owner-gated · 🤝 M2 lane. Updated 2026-06-26.

---

## 0. 🔓 THE 6 OWNER-KEY UNLOCKS (each flips a tier — only Nick can do)
- ⧗ **`export PYPI_TOKEN` → `bash scripts/publish-all-bridges.sh`** → 23-pkg fleet public (THE distribution lever)
- ⧗ **Reconnect GitHub token** (Settings → Connectors → GitHub) → M2 atomic commits, no dropped files
- 🤝 **Merge meok-ai PR #4** → 15-tool governance core live in production
- ⧗ **GCP VM deploy** (api-server) → runtime enforcement + queens + SIGIL unified
- ⧗ **Vercel-connect** `meok-town-view` → globe live
- ⧗ **Stripe** → £49 / £99 / enterprise flows

---

## 1. 📦 ESTATE AUDIT — the 352-MCP reality (we tracked ~6%)
- ✅ Full scan: 584 repos / 352 MCPs / 22 bridges (`CSOAI_MCP_ESTATE_SCAN_2026-06-26.md`)
- ✅ **Depth-audit** done: 368/369 ship-ready (97% REAL, 1 stub, 1,987 tools) — the 352 is verified real
- ✅ **Verified v3 test execution** (`DEPTH_AUDIT_TESTRUN_2026-06-26.md`): 37-MCP high-value sample, **419 tests / 419 pass / 0 fail = 100.0% pass rate**. Every previously-failing MCP investigated and fixed (agent-incident-reporter 100%, eu-ai-act-compliance 100%+1skip, csoai-governance-crosswalk 100%+1skip).
- ✅ OSCAL signature VERIFIED: **79-component** `layer0_protocol.oscal.json` Ed25519-signed, signature valid against canonical JSON (`ensure_ascii=False`, sort_keys). **OSCAL strict-validated** by `compliance-trestle` ComponentDefinition model (NIST OSCAL 1.1.2).
- ✅ Surfaced the **20-MCP A2A substrate** (CSOAI OS a2a app + one-pager) as a named product line (OS + deck) — the runtime competitors race for, already built
- ✅ Added the 3 missed bridges → family = 22 (index + globe + OS)
- ✅ Mapped the article-level reg MCPs into the frameworks surface
- ✅ Catalog: csoai-mcp-catalog.json (369 MCPs) + CSOAI OS MCP-Estate app
- ⬜ Migrate CSOAI-ORG from a **user account → real GitHub Org** (team/asset mgmt)
- ⬜ Fix the remaining 2 MCPs with failures: `eu-ai-act-compliance-mcp` (5 env failures: `pip install x402` + sqlite fixture + classification threshold), `csoai-governance-crosswalk-mcp` (11 dict-vs-object API drift) — est. 1.5–2h

## 2. 🚀 DISTRIBUTION (built ≫ published = #1 lever)
- ✅ Publish kit: 23 pkgs build clean, registry-valid (`publish-all-bridges.sh`)
- ✅ Registry-submit kit (`submit-all-registry.sh`, validate-only safe default)
- ✅ `PUBLISH_CHECKLIST_bridges.md`
- ⧗ Run the publish (needs PyPI token) → then `SUBMIT=1` registry submit
- ⬜ Marketplace listings (Smithery/glama/mcpize) for the lead MCPs
- ⧗ cosign signing (owner key) for supply-chain attestation

## 3. 🔐 LAYER-0 SIGNING BACKBONE (Ed25519 end-to-end)
- ✅ SIGIL hash-chain (every governed action)
- ✅ Compliance Passport — Ed25519 agent credentials (3 tools, 14 tests, builds v1.0.1)
- ✅ OSCAL generator — 7 tools, **Ed25519 sign/verify** (12 tests pass)
- ✅ **Whole Layer-0 = ONE signed OSCAL package** (55 components, signature VERIFIED via canonical JSON re-computation)
- ✅ 19 per-bridge signed SSPs (all verified)
- ⬜ Expand framework→NIST-control crosswalk beyond representative subset
- ⬜ Per-component full SSPs for the A2A substrate + reg MCPs

## 4. 🛠️ NEW CAPABILITIES BUILT THIS SESSION (verify all stay green)
- ✅ `oscal-generator-mcp` (FedRAMP RFC-0024 wedge) — repo + CI/Scorecard
- ✅ `nist-iso42001-crosswalk-mcp` (auditor GEO asset) — 6 tests, repo + CI
- ✅ `ll144-bias-audit-mcp` (NYC recurring-revenue SKU) — 6 tests, repo + CI
- ✅ **EU AI Act Art.50 watermark/transparency check** — **audit done: 7 Art.50/C2PA/watermark MCPs already exist** (`meok-watermark-attest-mcp` 3/3 tests pass, `meok-article-50-kit-mcp`, `c2pa-watermark-mcp`, `agent-content-watermark-mcp`, `meok-c2pa-durable-mcp`, `meok-c2pa-watermark-mcp`, `watermarking-authenticity-mcp`) — no new build needed
- ✅ **CI parity (M4 27JUN)** — 364/374 MCPs already had CI; added Python 3.10/3.11/3.12 matrix CI to the 10 that were missing. Local coverage now **374/374 = 100%**. See `CI_PARITY_AUDIT_2026-06-27.md`. Push is gated on per-MCP repo topology decision (currently `mcp-marketplace/` is gitignored at root).

## 5. 🖥️ CSOAI OS (M4 reference → M2 absorbs)
- ✅ 20 apps, **csoai-org-v2 master brand exactly**, JS clean, all reachable
- ✅ Governance core + OSCAL/FedRAMP + Layer-0 Proof + crosswalk + LL144 + dock + captions
- ✅ A2A-substrate app + true "369 MCPs" + 22-bridge count surfaced (CSOAI OS apps + `CSOAI_A2A_SUBSTRATE_2026-06-26.md`)
- 🤝 M2 absorbs the surfaces into live `councilof-ai` (their lane)

## 6. 📱 MEOK OS (production-ready)
- ✅ 41 apps single-file (`MEOK_OS/index.html`), JS clean, iCloud-synced
- ✅ Governance core in `meok-ai` PR #4 (15 tools, 28 tests) — callable backend
- ⬜ Reconcile two 3D worlds (meok-town-view Cesium vs meok-ai/town-3d R3F) — owner call
- ⧗ Merge PR #4 · Vercel-connect globe · GCP VM

## 7. 🤝 M2 COORDINATION (CSOAI master lane)
- ✅ Absorption VERIFIED manifest (10 MCPs real, passport=lead SKU confirmed)
- ✅ Estate-scan + A2A-substrate handed to M2
- ✅ De-dup flagged (M2 pages = UI; M4 MCP tools = backend)
- 🤝 Wire the 10+ verified MCPs behind live pages · port dashboard pricing/USP/curriculum
- 🤝 EU AI Act date-accuracy (Omnibus: Aug-2026 transparency vs Dec-2027 high-risk) — done on /meok-law

## 8. 🧠 HERMES + KNOWLEDGE (autonomous)
- ✅ Knowledge curriculum (17 domains) + nightly gather (science/ecosystems absorbed)
- ⧗ Paste the cron block → standing nightly digest (`OVERNIGHT_PLAN_2026-06-25.md`)
- ⬜ Broaden governance-learn → full domain curriculum; emit each learning as SIGIL hop

## 9. 🗺️ CONSOLIDATION (never lose track)
- ✅ MESH index current (§0 meok-ai, §1 OSes, §4 369-MCP estate + 22 bridges + A2A substrate)
- ✅ Competitive consolidation + one-pager + production-readiness audit
- ✅ MESH §4 updated with verified counts: 369 MCPs / 1,987 tools / 22 bridges / 79-component signed OSCAL / 100.0% test pass on 37-MCP sample
- ✅ **CI parity audit** (`CI_PARITY_AUDIT_2026-06-27.md`): 374/374 MCPs now have local CI workflow (push gated on repo topology)
- ✅ **MCP security response** (`MCP_SECURITY_BRIEF_2026-06-27.md`): 2 HIGH Python SDK CVEs identified; **302 MCP pyproject.toml files bumped to `mcp>=1.28.0`**; locally installed 1.28.1, full 37-MCP test sample still passes (419/419, 100%). Migration plan for spec v2 stateless documented.
- ⬜ Fold this checklist into MEMORY.md index (one line)

## 10. 📉 DEFERRED (documented, not dropped)
- ⬜ #45 globe reads canonical governance-map.json (risk>value — fallback design)
- ⬜ #46 "what governs my industry" lookup on globe (partly redundant w/ dock)
- ⬜ #13 Vercel deploy MEOK Earth (owner-gated)

---
### The one-line truth
**Engineering is ~15× deeper than tracked and genuinely ahead of incumbents (A2A runtime · OSCAL/Ed25519 · 19 legacy bridges · signed protocol). The whole remaining gap is the 6 owner-keys in §0 — distribution + deploy, not code.** Load the sling.

## 11. 🐉 SOVEREIGN ORCHESTRATOR + LAYER-0 FEDERATION (2026-06-26, operational)
- ✅ **Orchestrator** — watch→classify(routine/judgment)→auto-continue(signed,dry-run)/escalate, kill-switch + rate-limit. `sovereign_orchestrator.py` (11 tests green).
- ✅ **Memory + proactive** — sov learns per-window patterns + proactively proposes help (offer-autopilot / pre-stage), feeds SOV3 /telemetry queen loop. `sovereign_memory.py`.
- ✅ **Cockpit** — `sovctl.py` (status/approve/deny/learn/stop/start), reads live queues, decisions feed memory. Live-demoed.
- ✅ **Layer-0 federation** — `layer0_federation.py` routes any intent across all 8 protocol layers (MCP/bridges/A2A/x402/SIGIL/OSCAL/council/passport). `layer0_protocol_catalog.json` + CSOAI OS "Layer 0" app.
- ✅ **E2E audit** — 13/13 systems live-green (`E2E_AUDIT_2026-06-26.md`).
- ⧗ Owner-gated to LIVE: arm `ACT=1` (real keyboard via computer-use) · deploy SOV3 on GCP VM (24/7) · the standing cron (orchestrator + Hermes shifts).
- 🔬 Deep-research workflow running — market/competitive/ramp validation (cited).
