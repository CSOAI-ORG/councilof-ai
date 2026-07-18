# MEOK Product Improvements — deep research synthesis (2026-06-06)

*5 parallel analyst passes (core platform · MCP catalogue · CSOAI/compliance · vertical SaaS · robotics), each pulling 2026 news + open-source code to adopt. Honest-first: real wins separated from hype. Full per-cluster reports were returned to the session; this is the consolidated, prioritized version.*

---

## ⚠️ Cross-cutting CORRECTIONS the research surfaced (fix these regardless of priorities)
These are factual fixes to assumptions we've been operating on — high value because acting on wrong facts is expensive:

1. **SOV3 memory runs on the Weaviate **v3** Python client, which is END-OF-LIFE** (security-fixes-only; gone in v4). Not pgvector as assumed. This is a latent security/maintenance liability — the single highest risk-reduction item in the stack.
2. **C2PA is v2.3 (final, Jan 2026) / v2.4 (published, Apr 2026) — NOT v2.2.** And it is **NOT an ISO standard** (ISO/IEC 22144 is still draft). A blog claiming "C2PA ratified as ISO" is wrong — never repeat it.
3. **The £0 revenue cause is discoverability + reason-to-pay, NOT the payment rail.** Our ~271 MCPs are **not in the official MCP Registry** (the upstream feed for Glama/PulseMCP/Cursor/VS Code/Claude discovery). Backfilling is nearly free and is the highest-reach fix.
4. **Don't bet on x402/crypto micropayments or literal £0.05 Stripe charges** — card economics break below ~£0.30; use prepaid credit packs / monthly metering. x402 is an agent-to-agent rail (2027 bet), not a 2026 human-buyer fix.
5. **HARVI's £45k motor line (£3,750/motor) is ~10× inflated.** A whole AGILOped humanoid is $6,380; moteus controllers ~$100. Rebuild the budget on real numbers.
6. **Asimov v1 cannot be FDM-printed as designed** (its own manual requires CNC 7075 alu + SLM 316L steel + MJF PA12; FDM "won't meet tolerances"). Re-base on Berkeley Humanoid Lite / AGILOped (~10–12 actuators, cycloidal gears).
7. **Aquaponics commercial is a graveyard (~31% of firms profitable) — but that is NOT our play (Nick, 2026-06-06).** The 24,000 sqft IOK farm build is a **microgreens operation (top 8 microgreens)** — fast 7-21 day cycles, high £/sqft, real B2B demand (restaurants/retail). Re-scope this vertical to **controlled-environment microgreens**: compliance wedge = food-safety **HACCP + SALSA/BRCGS** + traceability (not fish welfare); tech wedge = grow-room climate monitoring + yield optimisation (the OSS HA/ESPHome/MQTT+Grafana stack still applies, for climate not aquaria). Trout-welfare/aquaponics = de-prioritised.
8. **COBOL migration is the clearest near-term CASH** (Anthropic-vs-IBM, 23 Feb 2026 catalyst). Sell the "equivalence/golden-master testing" 80% that AI *doesn't* solve.
9. **PA6-CF loses ~44% strength when damp** — explains "strong day 1, fails in a month" printed gears. Heated dry box mandatory for the WOLF set.
10. **EU AI Act high-risk moved to Dec 2027 / Aug 2028** (Digital Omnibus). Aim urgency at **Art 50 (2 Aug 2026)** + **watermarking (2 Dec 2026)** only — manufacturing high-risk urgency now is misleading.

---

## UNIFIED PRIORITY LIST (highest leverage across the whole portfolio)

| # | Move | Cluster | Effort | Why |
|---|---|---|---|---|
| 1 | **Migrate SOV3 off EOL Weaviate-v3 → pgvector 0.9 + FSRS decay score** | Core | M | Kills a real security/EOL liability + upgrades memory quality (pure-Python `fsrs`). Highest risk-reduction/hr. |
| 2 | **Backfill ~271 MCPs into the official MCP Registry** (`mcp-name` README + `server.json` + `mcp-publisher`) | MCP | M | The actual £0 fix — discoverability. Bolt into `sweep_catalogue.py`. Highest reach/cost. |
| 3 | **Ed25519 + RFC-3161 timestamping in attestation-api** (HMAC→verifiable) + emit **OSCAL** | CSOAI | S→M | "Verify me + here's proof of when" = the moat sentence; OSCAL turns advice into evidence artifacts. |
| 4 | **stdlib JSON-locale + `data-i18n` i18n for MEOK ONE** | Core | S→M | One route + ~30 lines vanilla JS; honours zero-dep rule; unlocks the multi-region story. Best value/effort. |
| 5 | **ruflo patterns → SOV3** (Queen/worker + DDD + Aegis gate) | Core | — | ✅ **DONE 2026-06-06** — `swarm_coordinator.py`, 2 live MCP tools. |
| 6 | **Own the 2 Dec 2026 watermarking cliff with C2PA** (`c2pa-python` 0.32.12, pin 2.3/2.4) | CSOAI | M | Nearest hard generative-AI deadline; the actual Article-50 product. |
| 7 | **COBOL "Estate Understanding + Equivalence-Testing" fixed-fee offer** | Vertical | M | Clearest near-term CASH; rides Feb-2026 hype; sells the 80% AI can't do. |
| 8 | **Care-home DSPT/MODS compliance pack** (1 Jul 2026 deadline; Templeman = first customer) | Vertical | S→M | Fastest first pound; captive reference site. |
| 9 | **SO-101 + LeRobot + SmolVLA care-loop** (runs on a MacBook/CPU) | Robotics | M | A complete runnable manipulation pipeline today; ties to SOV3 safety tiers. |
| 10 | **llama.cpp GBNF / Outlines for SOV3's 110-tool structured calls** | Core | M | Reliability win for every agent; Ollama's weakest area. |

---

## Per-cluster TOP moves + key OSS

### Core platform (MEOK ONE / DOME / LAW / SOV3)
- **TOP 3:** (1) Weaviate-v3 → **pgvector 0.9 + `fsrs` 6.x** retrievability score; (2) **stdlib JSON-locale i18n**; (3) **llama.cpp GBNF** structured tool-calls + a **Pipecat + mlx-audio** local voice pipeline (parakeet/whisper → Gemma → Kokoro) on the Mac.
- **Orchestration:** wrap only branching/looping flows in **LangGraph (standalone install)**; trial **microsoft/conductor** for token-free batch. Don't migrate to CrewAI (lateral); skip Temporal until paying SLAs.
- **SKIP:** CrewAI rewrite, Temporal now, Mem0-self-host (April CVE on pgvector backend), Moshi full-duplex (research-grade), chasing "best vector DB", any LoCoMo "we beat X" claim.

### MCP catalogue + monetization
- **TOP 3:** (1) **Registry backfill** (the £0 fix); (2) **host ~15 flagships as remote Streamable-HTTP FastMCP + auth behind one billing gateway** (PayMCP/Stripe metered + prepaid credits; x402 additive); (3) **GEO/AEO** (`llms.txt` + Bing/Brave sitemaps + ~15 deep flagship pages) + **PyPI Trusted Publishing + Sigstore attestations** ("our own packages are attested" — on-brand for a compliance vendor).
- **Adopt:** `uv` (10× faster harness → gate *all* 271, not 5), FastMCP 2.0 standardization, structured `outputSchema` on flagships.
- **SKIP:** x402 as primary, literal £0.05 Stripe charges, 271 thin SEO pages, adding more niche servers (95% of MCPs earn £0; more ≠ revenue). **Keep the gate harness** — just speed it up.

### CSOAI / compliance / attestation
- **TOP 3:** (1) **Ed25519 + RFC-3161** (PyCA `cryptography` + `rfc3161-client`) — copy the Ed25519 pattern already in `watermarking-authenticity-mcp`/`eudi-wallet-mcp`; (2) **OSCAL** output via `compliance-trestle` 4.0.2 + ingest NIST↔ISO-42001 crosswalk; (3) **C2PA product** for the 2 Dec 2026 cliff.
- **Exploitable gap:** nobody serves the <£1k/yr SME; none are MCP/agent-native; none lead with "verifiable artifact." Vanta ISO-42001 = $7.5–10k/yr add-on; Credo AI = $30–150k/yr.
- **DON'T-claim:** "C2PA is ISO", "v2.2 current", "high-risk urgent", "accredited certification" (we do self/independent attestation + audit-ready evidence).

### Vertical SaaS
- **Clearest cash = COBOL** (fixed-fee equivalence-testing; GnuCOBOL + COBOLEval-pattern + Claude). **Fastest pound = care-home DSPT pack** (1 Jul 2026, Templeman captive customer). **GOS claim-reconciliation** add-on for opticians (3-month claim window pain) — don't fight Optix/Ocuco on PMS.
- **Demote to lead-magnets:** construction (saturated + distressed customers), aquaponics-as-IoT (OSS hobby stack kills willingness-to-pay; only ~290-farm welfare niche has signal).

### Robotics + embodiment
- **TOP 3:** (1) **SO-101 + LeRobot v0.5.1 + SmolVLA** care-loop now (~$230, prints on your machines, runs on a MacBook); (2) **re-base humanoid on Berkeley Humanoid Lite / AGILOped** (~10–12 actuators, cycloidal — drop Asimov-as-designed); (3) **harden meok-amica** → fully-local VRM-1.0 talking-head (three-vrm 3.5.2 WebGPU + amica v1.2 emotion engine + Piper/Coqui local TTS).
- **Printing:** build123d 0.10 + Strecs3D (FEA-driven infill) + OrcaSlicer CF-nylon profiles; **dry box mandatory**.
- **SKIP/physics-fail:** HARVI £45k motor line (10× inflated), Asimov-as-FDM, WOLF high-ratio gears in PA12-CF for dynamic load (use cycloidal), Genesis "10-80×" benchmark (debunked), "ODrive is open" (newest FW closed), "$999 humanoid" (toy), "AI slicers" (marketing).

---

## What shipped TODAY alongside this research
- **ruflo → SOV3** integration (priority #5): `multi_agent/swarm_coordinator.py` + 2 live MCP tools (`swarm_orchestrate`, `swarm_review`). Verified.
- **Pake-wrap** of MEOK ONE → `meok-one/desktop/MEOKONE.dmg` (validated the robotics/core report's #1 adopt-rec).
- **Morris-II worm-guard** (`security/worm_guard.py` + wiring) — feeds directly into the Aegis gate above.
- **C2PA commitment** doc (`MEOK_C2PA_COMMITMENT_2026-06-06.md`) — priority #6 plan.
