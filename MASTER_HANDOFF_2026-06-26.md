# 🐉 MASTER HANDOFF — CSOAI / MEOK (2026-06-26)

**For M2 / Hermes / any agent taking over.** Everything to date — flows, architecture, files, strategy, state. Read this top-to-bottom and you have the whole picture. Nothing held back.

---

## 0. TL;DR (the 60-second version)
CSOAI/MEOK is **the compliance layer for AI on legacy systems** — govern the AI touching COBOL/SAP/SCADA/HL7, map it to the actual regulations (EU AI Act, DORA, HIPAA), and emit **Ed25519-signed, machine-readable compliance artifacts** (EU AI Act Art. 12 tamper-evident audit) — before the **Aug 2 2026** high-risk deadline. The agent-security plumbing (identity/gateway/audit) is now commoditized (Microsoft MIT toolkit, ServiceNow, Runlayer $30M) — we **don't compete there**; we own **Layer B (compliance + legacy reach)** where every competitor row is blank. **The catapult move: one bank-CCO warm intro → the signed demo → a free pilot → the reference logo.**

## 1. The estate (what exists)
- **369 MCP servers / 1,987 tools** in `~/clawd/mcp-marketplace` (depth-audited 99% ship-ready). 76 on the official MCP registry. Catalog: `csoai-mcp-catalog.json`.
- **22 governed legacy bridges** (COBOL·ISO20022·HL7·SAP·SCADA·EDI·FIX·CICS·MQTT·ACORD·NACHA·ISO8583·SIP·Tax·GS1·MISMO·DLMS·AS400·Oracle·a2a-gov·abci·haulage). Index: `CSOAI_BRIDGE_FAMILY_INDEX.md`. 22 public on CSOAI-ORG.
- **20-MCP A2A agent-governance substrate** (identity/policy/incident/firewall/x402/audit…).
- **28 article-level reg MCPs** (DORA-TLPT, FRIA, CRA-Annex-IV, NIS2 registers, Basel, MiFID…) + the 410-article `eu-ai-act-compliance-mcp`.
- **Signing backbone:** SIGIL (hash-chain) + Ed25519 + the **55-component signed Layer-0 OSCAL package** (`oscal-generator-mcp`).
- **8 protocol layers** federated (`layer0_protocol_catalog.json` + `layer0_federation.py`).

## 2. The surfaces (the apps)
- **CSOAI OS** — `clawd/csoai-os/index.html` (single-file, 25 apps, on csoai-org-v2 master brand). M4 reference; M2's live `csoai-v2-app`/`councilof-ai` is canonical.
- **MEOK OS** — `~/Library/.../SOV3-Launch/MEOK_OS/index.html` (41 apps, iCloud).
- **Globe** — `~/meok-town-view` (Cesium, 22 bridges + temples + arcs).
- **meok-ai** (production app) — Next.js UI + agent platform + 99-tool MCP; governance core in PR #4.

## 3. The brain + governance (SOV3)
- **SOV3** — `clawd/sovereign-temple` + `sovereign-temple-live` (the brain, :3101, BFT council). Federation: `sov3_federation.py` + `mcp_federation_*` tools.
- **BFT council** — native 33/36-node (`council-nodes/bft_council.py`); selectable 5/13/33/37 (`council_config.py`); doctrine `openpatent-hive/docs/fork-doctrine/05-bft-topology.md`.
- **Hermes** — autonomous research/governance agent (`~/.hermes`); votes into the council via `external_council_voice.py` (`hermes-council-audit-shift.sh` + `hermes-knowledge-council-shift.sh`).

## 4. The Sovereign Orchestrator (the "big key")
Governed autonomy that watches your windows, learns, and proactively helps:
- `sovereign_orchestrator.py` — watch→classify(routine/judgment)→auto-continue(signed,dry-run)/escalate. Kill-switch + rate-limit. 11 tests.
- `sovereign_memory.py` — learns patterns + proactively proposes help; feeds SOV3 `/telemetry`.
- `sovctl.py` — cockpit (status/approve/deny/learn/stop/start).
- `observe_live.py` — real macOS screen-watcher (default-off, OCR-optional).
- **Safety:** dry-run default, never types until `ACT=1`, kill-switch `~/.sov3/orchestrator.STOP`, SIGIL on every action.

## 5. THE STRATEGY (read CSOAI_CATAPULT_PIVOT + CSOAI_COMPETITIVE_MATRIX)
- **Positioning:** "the compliance layer for AI on legacy systems." Lead with legacy + Art.12 + the deadline + sovereign. NOT "MCP governance" (commoditized).
- **Moat (Layer B, where competitors are blank):** legacy bridges + article-level reg content + signed Art.12 artifacts + BFT + sovereign + open-field MCP-registry distribution (GRC giants have ZERO registry presence) + 2–15× price advantage.
- **Market (verified):** Gartner AI-gov $492M→$1B by 2030; Runlayer $30M; agentic-security $55B→$888B.
- **GTM:** ONE regulated design partner (finance-on-COBOL) pre-deadline > broad distribution.
- **The demo:** `demo_finance_cobol.py` (COBOL→govern ISO-20022 wire→Ed25519-signed Art.12 package, verifies offline). Script: `CSOAI_WEDGE_DEMO_SCRIPT.md`. Outreach: `CSOAI_DESIGN_PARTNER_OUTREACH.md`. Raise: `CSOAI_INVESTOR_MEMO.md`.

## 6. Infra / hosting
- **GCP hive VM** = `meok-backend @ 35.242.143.249` — the REAL production host (meok-council/king/one/sov3 + 40 ports incl :3000/:3200 + openpatent/csoai docker stack). The always-on home.
- **Local Mac** = dev + the surfaces; ~90 launch agents were sprawled locally (the heat) — cleanup in progress (`launchagents-backup-20260624/AUDIT_MAP.md`): 5 removed, recovery auto-heal + meok-api + meok-ui disabled (all redundant — hive runs them). The rule: **if it's sov3/hive, it belongs on the VM, not the Mac.**
- **Vercel:** meok-api deployed; meok-town-view not yet connected (owner-gated).

## 7. Lanes (M4 vs M2)
- **M4 (Claude Code, local):** bridges, globe, SOV3 backend, the orchestrator, research/strategy, the OS reference. Everything pushed to `CSOAI-ORG/clawd-workspace`.
- **M2 (Cowork, browser):** the LIVE CSOAI app (`csoai-v2-app`/`councilof-ai`) + master brand. Coordination notes: `sovereign-temple-live/coordination/M4_TO_M2_*.txt`.

## 8. What's DONE vs OWNER-GATED
- ✅ **Done + verified:** the 369 MCPs, 22 bridges, signing, the orchestrator, the OSes, the pivot + all strategy assets, the demo. E2E audit 13/13 green. All pushed.
- ⧗ **Owner-only (the actual blockers):** (1) **one bank-CCO warm intro** → demo → pilot → logo [THE move]; (2) **PyPI token** → publish 21 packages; (3) **GCP deploy / git-pull on the VM** → align prod; (4) merge meok-ai PR #4; (5) arm orchestrator `ACT=1`; (6) Stripe.

## 9. Key files (the map)
Strategy: `CSOAI_CATAPULT_PIVOT` · `CSOAI_COMPETITIVE_MATRIX` · `CSOAI_RESEARCH_SYNTHESIS` · `CSOAI_INVESTOR_MEMO` · `CSOAI_DESIGN_PARTNER_OUTREACH` · `CSOAI_WEDGE_DEMO_SCRIPT`.
Estate: `CSOAI_MCP_ESTATE_SCAN` · `csoai-mcp-catalog.json` · `CSOAI_BRIDGE_FAMILY_INDEX` · `MEOK_MESH_INDEX`.
Orchestrator: `sovereign_orchestrator.py` · `sovereign_memory.py` · `sovctl.py` · `observe_live.py` · `layer0_federation.py` · `SOVEREIGN_ORCHESTRATOR.md`.
Audit/state: `E2E_AUDIT` · `DEPTH_AUDIT_TESTRUN` · `MASTER_CHECKLIST` · `SESSION_CAPSTONE` · `launchagents-backup-20260624/AUDIT_MAP.md`.
Distribution: `scripts/publish-all-bridges.sh` · `scripts/submit-all-registry.sh` · `PUBLISH_CHECKLIST_bridges.md`.

## 10. For whoever takes over — the one instruction
Engineering is done. **Do not build more product.** The next move is **distribution + one design partner**: take `demo_finance_cobol.py` to a regulated buyer on the Aug-2026 deadline. Everything else (369 MCPs, council, orchestrator) is the moat *behind* that wedge. Lead with **legacy + Article 12**, never "MCP governance."
