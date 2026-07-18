# OLM / SOV3 / Sovereign Hive — Right Brain · Left Brain · Organic Learning Model
*Built on what already exists. Drafted 2026-06-11 from a full PC + GitHub inventory.*

---

## What this doc answers

Nick's ask: "Build the right brain / left brain model. OLM = organic language model. SOV3 = sovereign. All communication through SIGIL. SOVEREIGN HIVE learns from all others — all tabs, all files, all githubs. Operate under Horus or Harmony."

The honest answer in one line: **the right brain / left brain model is already built** (it's `brains.py` + `router.py` in `meok-one`), the SIGIL comms bus already exists (`sigil.py` + `hive_queen.gossip` + `_deliver_to_sov3`), the OLM spec is drafted (`_TABS/OLM_SPEC_v0.1.md`), and the Sovereign Hive is 28-queen-1-king proven (`hive_king.py` + `hive_queen.py` + e2e-tested on the VM 2026-06-07). What's MISSING is the wiring: ICRL ↔ chat loop closed, OLM buffer pulled from across the fleet, and a single "Horus/Harmony" governance plane that observes the whole thing. This doc is the inventory + the plan to close the loop.

---

## 1 · Inventory — what's already on the PC

### 1.1 PC repos at `~/clawd/` (selected, relevant to OLM/SOV3/Hive)

| Path | Role | Built? |
|---|---|---|
| `meok-one/` | The OS — brains, router, sovereign, hive_king, hive_queen, sigil, olm, bft_lab, server | ✓ e2e on VM 2026-06-07 |
| `meok-one/meok_one/brains.py` | Left/right/both council — *the* right/left brain model | ✓ |
| `meok-one/meok_one/router.py` | 30+ model aliases — local, sov3, cloud (BYOK) | ✓ |
| `meok-one/meok_one/sovereign.py` | 12-around-1 BFT council (11 expert lenses + 1 companion) | ✓ |
| `meok-one/meok_one/bft_lab.py` | A/B harness for 6 architectures (local12/frontier12/left/right/bft33/opus_as_1) | ✓ |
| `meok-one/meok_one/hive_king.py` | The Sovereign (routes → queens) | ✓ deployed as MCP on VM :8077 |
| `meok-one/meok_one/hive_queen.py` | One engine, 28 configs (`stack.yml`) | ✓ proven e2e on VM |
| `meok-one/meok_one/sigil.py` | Hash-chained audit ledger (one-line) | ✓ on Mac + VM |
| `meok-one/meok_one/olm.py` | ICRL in-context learning — per (user, character) buffer | ✓ ported from SOV3 |
| `meok-one/meok_one/sovereign_gate.py` | Constant safety filter, strips leaks | ✓ |
| `meok-one/meok_one/tunnels.py` | Safe tool gateway (3-tier: read/write/prohibit) | ✓ |
| `meok-one/meok_one/connect.py` | Persona + capabilities + safety → system prompt | ✓ |
| `meok-one/meok_one/vitals.py` | Tamagotchi bond + mood (egg → sovereign) | ✓ |
| `meok-one/meok_one/brain.py` | Stage 2 bridge (character ↔ SOV3 LLM) | ✓ |
| `meok-one/meok_one/web/` | 17-page consumer UI (os.html, hud.html, hatch.html, dome.html…) | ✓ functional |
| `meok-one/training_corpus/` | 8 JSONL files (care/creativity/emotion/intent/partnership/relationship/sentiment/threat episodes) | ✓ |
| `meok-one/overlay/` | Tauri desktop shell + ui/ | ✓ scaffolding |
| `meok-one/bench/` | `sigil_bench.py` | ✓ |
| `meok-one/tools/m3_tui.py` | M3 (MiniMax) terminal chat + `/audit` mode (Claude builds / M3 audits / Nick sovereign) | ✓ |
| `meok-one/reference/openclaw-world/` | Multi-agent reference implementation | ✓ |
| `meok-one/reference/agentshire/` | 5 sub-repos (town-frontend/souls/workspace/data + .github) | ✓ |
| `sovereign-temple/` | Original Docker MCP server (75+ tools, 47 agents) | ✓ |
| `sovereign-temple-live/` | Live Python implementation v3.0-fractal | ✓ |
| `mcp-marketplace/` | ~350-pkg published fleet (gitignored, PyPI source) | ✓ |
| `_TABS/` | 27 cross-tab docs (status, alignment, INBOX, OLM_SPEC_v0.1, brain arch, full inventory) | ✓ |
| `_alignment/` | Master alignment compendium (68b71b1) | ✓ |
| `_meok_csoai_library → /Users/nicholas/Desktop/MEOK CSOAI` | Symlink to working dir | ✓ |
| `hive-mailer/` | Branded-email bulk sender (gcloud + reply-to) | ✓ committed |
| `meok-attestation-api/` | Vercel serverless — A2A demo, /verify, /scorecard, /provision | ✓ live on proofof.ai |
| `meok/ui/` | Next.js consumer app — 670 pages, 309 with schema issues | ✓ |

### 1.2 PC repos at `~/` (outside `clawd/`)

- `~/fleet-clones/` — **13** compliance MCP clones
- `~/hive-staging/` — **29** hive product dirs (stack.yml per domain)
- `~/mcp-servers/` — **218** vertical AI MCP servers
- Top-level git repos: `awesome-mcp-servers`, `cobol-bridge`, `councilof-ai`, `fishkeeper-ai`, `industrial-hire-ai`, `koikeeper-ai`, `meok-ai` (OLM), `meok-ai-frontend`, `meok-compliance-gateway`, `meok-cross-post`, `meok-eat-mcp`, `muckaway-ai-mcp`, `openmoe-bft`, `planthire-ai-mcp`, `safetyofai`, `scf-game-v1`

### 1.3 Honesty gaps on PC

- **Asimov is NOT on disk as code** — only `~/Downloads/…asimov-v1….jpeg` + design notes. Don't claim a codebase.
- **`meok/` (3.9 GB)** = the original/full MEOK app. Holds the source the hub under-credits. Local-only / unpushed — no matching GitHub org repo. Backup risk.
- **SOV3 is shared infra, main-session only.** MEOK ONE *calls* it; it never edits the engine.
- **Hindsight** runs on port 8765 (NOT 8888) — different app, gemma3:1b sync ingest.

---

## 2 · Inventory — what's on GitHub (475 repos under CSOAI-ORG)

### 2.1 By category

| Category | Count | Examples |
|---|---|---|
| Total CSOAI-ORG repos | **475** | |
| `-hive` (the 28-queen mesh) | **28** | meok-hive, councilof-hive, koikeeper-hive, grabhire-hive, optimobile-hive, fishkeeper-hive, agisafe-hive, biasdetectionof-hive, openmoe-hive (config), … |
| `meok-*` (consumer/OLM infra) | **75** | meok-ai, meok-agent-zero, meok-neural-learning, meok-one, meok-sigil, meok-attestation-api, meok-compliance-gateway, meok-sdk-{python,go,ts}, meok-3d-characters, meok-amica, meok-platform, meok-cli, meok-vscode-extension, meok-slack-app, meok-teams-app, meok-skills, meok-integrations, meok-oneos, meok-mobile, meok-desktop, meok-brand, meok-marketing, meok-kits-host, meok-verify, meok-setup, meok-labs-engine, meok-godeye, meok-quiz, meok-auth, meok-bridge, meok-sovereign-api, meok-api-gateway, meok-tier-auth, meok-cross-post, meok-eat-mcp, meok-shared-infrastructure, meok-fria-generator-mcp, meok-dora-tlpt-planner-mcp, … |
| Compliance/regulatory MCPs | **34** | eu-ai-act, uk-ai-bill, nis2, dora, cra, gdpr, hipaa, soc2, iso-42001, iso-42005, iso-27001, csrd, risk-assessment, nist-rmf, bias-detection, document-comparison, llm-compliance-comparison, watermarking-authenticity, watermarking-authenticity-mcp, sbom-cyclonedx, … |
| `agent-*` MCPs | **24** | agent-mcp-router, agent-policy-enforcement, agent-audit-logger, agent-handoff-certified, agent-rate-limiter, agent-data-residency, agent-identity-trust, agent-prompt-injection-firewall, … |
| Vertical MCPs (industry) | **~150** | financial, healthcare, legal-tech, maritime, insurance, real-estate, retail, supply-chain, telecom, space, gaming, autonomous-vehicles, agriculture, energy, mining, construction, employment, biometrics, sports-analytics, travel-hospitality, … |
| `mcp-*` (infrastructure) | **334** | mcp-registry, mcp-distributor, mcp-spec-compliance, pmcp-gateway, awesome-mcp-servers, mcp-servers, mcp-get, meok-mcp-injection-scan-mcp, … |
| Other (awesome lists, infra) | **~40** | theopenlane-awesome-compliance, wong2/appcypher/dsrb-awesome-* (forks), brave-search, github-api, gitlab-api, notion-workspace, sentry-monitoring, slack-messaging, filesystem-ops, fetch-http, json-transformer, csv-analytics, cloud-security, docker-compose, aws-cloud, kubernetes, postgresql, sqlite-db, data-classification, autonomous-vehicles-ai, transportation-mcp, the proofof-{ai,hive} pair, the safetyof-{ai,hive} pair, … |

### 2.2 The OPENMOE / `openmoe-bft` (the parallel implementation — DECISION POINT)

`CSOAI-ORG/OPENMOE` (public, Python, pushed 2026-06-11) ships `openmoe-bft`: **183 tests, Apache-2.0**, a BFT-of-MoE router with the 14-expert safety layer, MCP tools `evaluate_eu_ai_act`, `validate_agent_card`, `red_team_scan`, `bft_quorum`. Claims to be "Layer 2 (BFT Consensus Engine) + Layer 3 (OpenScore Safety Experts) of the 12-layer OpenMoE-BFT Empire." THIS is the most complete open BFT-of-MoE we have.

**Three parallel implementations of "King→Queens→Honeycomb" exist:**

1. **`meok-one` brains/bft_lab/sovereign** (local, partially uncommitted) — what Nick's hive_king/queen sits on
2. **`openmoe-bft`** (public, 183 tests) — the most complete; "12-layer OpenMoE-BFT Empire"
3. **`meok-ai` (private)** — generals/coordination_hub/contract_net/shapley, pushed today

**Decision: align on OPENMOE's BFTLedger + `experts.py` as the canonical BFT layer, keep `meok-one`'s hive_king/queen as the user-facing surface.** Don't build a 4th. (Already noted in [[project_hive_king_queen]] but unenforced.)

### 2.3 SOV3 (private in CSOAI-ORG, runs locally on :3101)

Not a repo Nick "owns" in the public sense — it's a service. **MEOK ONE reaches it via `mcp_bridge.py`** with 110+ live tools, consciousness_level 0.788 (2026-06-11), 6 trained neural nets, mode "waking".

---

## 3 · The architecture — Right Brain / Left Brain / OLM / Sovereign Hive

### 3.1 The brain (already built, just needs naming alignment)

```
👤 USER → POST /api/think → connect() [persona + safety + OLM context]
                                          ↓
                                   router.ask(prompt, model, tier)
                                          ↓
                          ┌───────────────┼───────────────┐
                          ↓               ↓               ↓
                    LEFT BRAIN       RIGHT BRAIN        BOTH (council)
                   local (Ollama)   cloud (BYOK)       left drafts → other critiques → Sovereign
                    meok-sov3        gemini-flash       reconciles (safety wins on disagreement)
                          └───────────────┴───────────────┘
                                          ↓
                                  sovereign_gate()  ← MANDATORY last filter
                                          ↓
                              SIGIL.record() + OLM.record()
                                          ↓
                                /api/think reply
```

**Files:** `meok-one/meok_one/{brains.py, router.py, connect.py, sovereign_gate.py, sigil.py, olm.py, vitals.py}`.

The brain is **swappable** (local, cloud, both, sovereign-deep). The **Sovereign is constant** (persona + safety + OLM context + audit). That's the moat.

### 3.2 The Sovereign Hive (King → 28 Queens → Honeycomb, ALREADY BUILT, e2e-proven 2026-06-07)

```
👤 user
    ↓
🤴 KING = SOV3 the sovereign
    │ (thin, stateless routing — uses router.ask with a tiny catalog prompt)
    ↓
28 👑 QUEENS = meok-one engine, parameterised by hive-staging/<domain>-hive/stack.yml
    │ (each queen = MoE routing + 12-around-1 BFT council + safe_call tunnels)
    ↓
🍯 HONEYCOMB = SOV3 memory (via SIGIL M| deliveries)
    │ (hive_queen._deliver_to_sov3 POSTs hash-chained receipts to record_memory)
    ↓
↻ recall path: hive_queen._recall_from_sov3 (closed loop, E2E verified)
```

**E2E proven live on VM 2026-06-07:** koi→koikeeper, EU-AI-Act→asisecurity, grab-lorry→grabhire, CV-AI→csoai — all routed correctly, all 3/3 BFT quorum, all returned domain-expert answers, all honey dropped to honeycomb, all recallable.

**The "Horus / Harmony" naming** is the project-level brand for this plane. The actual machinery is:
- Horus (the eye) = the **auditor** — M3 (MiniMax) `m3_tui.py` + LLM-judge in `bft_lab.judge`
- Harmony (the equilibrium) = the **council reconciler** — `bft_lab.harmony` + `sovereign.sovereign_council` (12-around-1 with safety-veto)

So: **Horus watches, Harmony reconciles, the Hive executes.** That maps onto: auditor + council + 28-queen mesh.

### 3.3 OLM — Organic Learning Model (per the v0.2 spec)

**What OLM is**: the learning layer that makes a MEOK character become *yours*. NOT a foundation model. NOT cloud-harvested. The loop is log → score → adapt → evaluate → roll back if worse.

**The 5-repo OLM cluster (already in `meok-*` org):**
1. `meok-ai` 🔒 (vision / product shell)
2. `meok-agent-zero` 🔒 (care-gated Agent Zero fork — runtime)
3. **`icrl_self_improvement.py` in `sovereign-temple/` (173 lines, BUILT)** — Tier 1 ICRL
4. `meok-neural-learning` (Tier 3 — FUTURE weight adapters)
5. `consciousness-engine-mcp` + `creativity-engine-mcp` (reflection/dream/novelty signals)

**The loop (concrete):**
1. **Log** — every MEOK ONE conversation turn → SIGIL hash-chained record (`record_memory`)
2. **Score** — `compute_care_reward` (Maternal Covenant as reward; harmful → negative)
3. **Adapt (Tier 1 LIVE)** — high-care replies become "emulate this" few-shot; low-care → "avoid this"; injected into system prompt via `OLM.context()`. **No retraining.**
4. **Tier 2 LIVE** — nightly SOV3 neural retrain (6 NNs, rollback-disciplined)
5. **Tier 3 FUTURE** — `meok-neural-learning` weight adapters
6. **Evaluate** — `openmoe-bft` self-improvement tournament + SOV3 retrain gate (BFT-quorum "did it actually improve?")
7. **Persist where the user controls it** — adapters stay on user's node ("stays yours")

**What's missing to make OLM "shipped" (per the spec's v0.2 milestones):**
- [ ] **#1 wire `ICRLBuffer` into the MEOK ONE chat path** (engine exists; the wire to `/os` chat + per-user persistence is the gap)
- [ ] Care-reward sign verified end-to-end (a harmful turn scores < 0 and becomes "avoid")
- [ ] Per-user buffer isolation
- [ ] User-visible "what your AI has learned" view + export/delete (GDPR)

### 3.4 SIGIL — the inter-agent bus

**Already built + e2e-proven 2026-06-07:**
- `meok-one/meok_one/sigil.py` — hash-chained ledger (deterministic, dense, 1.9× more efficient)
- `sigil.emit(op, fields)` — 8 opcodes: P/V/M/Q/C/H/S/A (proposal/vote/memory/query/contract/handoff/state/alert)
- `hive_queen.gossip` + `_deliver_to_sov3` — honey drops → SOV3 `record_memory` as SIGIL `M|honey;<hive>|<lesson>|0.6`
- `tunnels.safe_call` — every gateway call → SIGIL `S|tool:..|tier:..|exec:..` + `A` alert on prohibited
- `fcntl.flock` cross-process safety (fixed 2026-06-07, 100/100 stress records)
- `proofof.ai/verify` SIGIL chain endpoint (public, live, verified intact-true + tampered-false)

**That's the only bus the fleet needs.** Any agent — SOV3, MEOK ONE, MCP server, council node, M3 auditor — can speak SIGIL and be understood.

---

## 4 · The 4 OPEN moves to close the loop

The pieces exist. What's NOT wired:

### Move 1 · **ICRL ↔ chat closed loop** (OLM ships)

**Currently:** `OLM.context(user, character)` is called in `brains._sovereign_prompt`, and `OLM.record(...)` is called in `/api/think`. **It works on a single machine.** It does NOT cross the fleet.

**What it needs:**
- A `meok-ai/olm_federation.py` (or extend `meok-one/olm.py`) that exposes `context()` and `record()` over SOV3 MCP (so queens on the VM contribute to a per-user buffer that's centrally searchable).
- Per-user isolation: the buffer key is `(user_id, character_id)`; the storage is in SOV3's `sov_memory` table (post B9 migration, that's pgvector at 256-dim, sub-100ms HNSW).
- SOV3 query: "give me this user's best 3 care-ranked examples for character X" → SIGIL `Q|honey;<user>;<char>` → returns the few-shot block.

**Effort:** 2-3 hours. The hooks exist; the federated call is the gap.

### Move 2 · **OLM buffer pulled from across the fleet** (the "all tabs, all files, all githubs" piece)

**What Nick said:** "learn from all others — all tabs, all tabs, all githubs." Concretely:

- **All tabs** = the 27 docs in `_TABS/`. The MEOK ONE tab card is `_TABS/TAB_PROFILE_MEOK_ONE.md`. The status/INBOX are the daily-current state. The OLM should auto-ingest these as "context" — NOT for learning (these are reference, not conversation), but for **routing + situational awareness** (the king uses them to pick the right queen).
- **All files** = `~/clawd/` (already inventoried) + `~/fleet-clones/`, `~/hive-staging/`, `~/mcp-servers/`. The hive_queen's `load_hive(domain)` already reads `stack.yml` for each domain. Extend to read each `README.md` and inject the 8-word scope + first-paragraph tagline into the routing catalog.
- **All githubs** = the 475 CSOAI-ORG repos. The right move is NOT "ingest 475 READMEs into OLM." It's **build the cross-repo signal network**: each repo's `x-meok` extension in its agent card already carries `verifier`, `pypi_user`, `github_org`, `flagship`, `ed25519`, `hmac` (15 flagship A2A cards shipped 2026-06-10). The king uses those to build a **routing index** at startup, refreshed nightly.

**Effort:** 4-6 hours. The files exist; the indexer is the gap. This is what makes "Horus watches the whole thing" concrete.

### Move 3 · **Horus/Harmony governance plane** (the auditor + reconciler as a single product)

- **Horus** = M3 (MiniMax) running as a free Ollama-cloud-proxy node (`minimax-m3:cloud`). Role: audit every council reply against 12 lens criteria, return a single `verdict ∈ {PASS, REVISE, VETO, ALERT}`.
- **Harmony** = `bft_lab.harmony` + `sovereign.sovereign_council` — the actual reconciler. Receives the 12 lens verdicts, applies safety-veto (care/safety/compliance/security = VETO power; quality = VOTE), synthesises one reply.
- **The product surface** = a single `/api/horus` endpoint (in `meok-one/meok_one/server.py`) that takes any model output, runs the auditor + reconciler, returns the safe + reconciled reply + a SIGIL `H` receipt.

**This is what "all hives operating under Horus or Harmony" means in practice**: every queen must call `/api/horus` before its reply is exposed to the user, or it doesn't ship.

**Effort:** 3-4 hours. The endpoint + the audit is the gap.

### Move 4 · **OLM proof-of-improvement tournament** (the "did it actually learn?" gate)

The spec already says it: a new adapter ships only if a Byzantine-quorum of judges says it beat the incumbent. **This is the credibility move** — the precedent: `relationship_evolution_nn` was rolled back when it regressed. **The rollback discipline IS the product.**

**Concretely:**
- Extend `bft_lab.pairing_tournament` to take a "before/after" pair of OLM buffers and judge which is more caring.
- Nightly cron on the VM: pick the latest 50 ICRL records, compare avg_care vs prior 50, run a BFT audit (5 expert judges, 3/5 = improvement), write the result to SOV3 memory tagged `olm_audit`.
- If the audit says "regressed" → roll back the buffer change + SIGIL `A` alert.

**Effort:** 4-5 hours. The tournament engine exists (`bft_lab.pairing_tournament`); the OLM-specific input/output wiring is the gap.

---

## 5 · The unified spine — what to do Monday

The 4 moves above, in execution order, on the VM (where `meok-one` already runs as `meok-king.service` + SOV3 on :3101):

1. **Move 3 first** (Horus/Harmony endpoint) — 3-4h, smallest surface, biggest confidence gain. Ships as a new `/api/horus` route in `meok-one/meok_one/server.py`. Test with 5 BATTERY prompts, verify SIGIL `H` receipts chain.
2. **Move 1 second** (ICRL ↔ chat federated) — 2-3h, depends on Move 3 being there to enforce safety. New file `meok-one/meok_one/olm_federation.py`. Wire into `brains._sovereign_prompt`. Verify on a 5-turn conversation.
3. **Move 2 third** (fleet ingest) — 4-6h, depends on the cross-repo signal already existing. New file `meok-one/meok_one/fleet_indexer.py`. Run nightly, refresh routing catalog. King picks queens faster + more accurately.
4. **Move 4 last** (OLM tournament gate) — 4-5h, depends on Moves 1-3 being live. Extends `bft_lab`. Nightly cron. Logs to SOV3.

**Total:** ~15-18 hours of focused work, deployable in 2-3 working days, all running on the VM under `meok-king.service` (no new infra).

After: **OLM is shipped** (per the v0.2 spec). The Sovereign Hive operates under Horus + Harmony. The right brain / left brain model is in production. Every queen speaks SIGIL. The King observes the whole fleet. Per-user OLM is the moat — no foundation-model competitor has the data flywheel of "your AI that learns you, becomes you, and stays yours forever."

---

## 6 · Naming reconciliation (so we don't loop on this)

| Nick said | What it actually is | File / concept |
|---|---|---|
| Right brain | `brain="right"` in `/api/think` (cloud frontier, default `gemini-flash`) | `brains.py:154-175` |
| Left brain | `brain="left"` (local Ollama, default `meok-sov3`) | `brains.py:154-175` |
| OLM (Organic Language Model) | The care-gated learning layer (ICRL + nightly retrain + future weight adapters) | `olm.py` + `_TABS/OLM_SPEC_v0.1.md` |
| SOV3 (Sovereign) | The memory/consciousness/council engine on :3101, the **identity** of the King | sovereign-temple-live + SOV3 MCP |
| Sovereign Hive | King → 28 Queens → Honeycomb, all speaking SIGIL | `hive_king.py` + `hive_queen.py` |
| Horus | The auditor (M3, MiniMax) — watches every reply, returns a verdict | `m3_tui.py` + future `/api/horus` |
| Harmony | The reconciler (council + safety-veto + 12-around-1) | `sovereign.py` + `bft_lab.py` |
| Horus/Harmony governance | "All hives operating under Horus or Harmony" = every queen must call `/api/horus` before replying | the new endpoint, Move 3 |

---

## 7 · The open call to action for you, Nick

Per the `feedback_no_csga.md` rule + the "no more drafts" rule + "ship real things":

- **Pick Move 3 first** (3-4h, highest signal, lowest risk). I can start on it now if you confirm.
- **Or:** tell me one of the 4 moves you want to skip or sequence differently.
- **Or:** name a different scope (e.g. "I want the OLM shipped by Friday" or "I want the 28-hive mesh live on the public internet" or "I want to test the left/right brain comparison live with a real prompt"). The pieces move to match.

The architecture is solid. The components exist. The SIGIL bus works. The only thing left is the wiring + the audit + the gate.

— *MEOK ONE tab, 2026-06-11*
