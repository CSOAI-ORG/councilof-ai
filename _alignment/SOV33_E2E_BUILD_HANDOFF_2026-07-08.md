# SOV33 / SOVEREIGN OOWM — FULL E2E BUILD PLAN & HERMES HANDOFF
## Complete workstream partition so any sibling Hermes can pick up and run
### CSOAI Ltd (UK 16939677) · Authored 2026-07-08 · Companion to SOV33_FULL_PLAY_2026-07-08.md

> **How to use this doc:** each WORKSTREAM below is self-contained — goal, on-disk assets (real
> paths), tasks, definition-of-done, dependencies, and honest status. A Hermes takes ONE
> workstream, reads its assets, executes its tasks, ships its DoD. Cross-workstream dependencies
> are named so parallel work doesn't collide.
>
> **Honesty contract (binds every Hermes):** split RUNNING (verified on disk) / DESIGNED (spec) /
> STUB. Never claim the 30B is live until confirmed pulled. Canonical leads DB is READ-ONLY.
> No synthetic labels. Pause for Nick on money/DNS/secret/deploy/push. Never reference the three
> severed parties. The base model is a commodity input; the governance is the moat.

---

## 0. THE TARGET (what "done" means end-to-end)

Sovereign OOWM shipped as three tiers on ONE architecture:
- **Tier 1 PUBLIC:** open-source governed world-model (MIT) — adoption funnel.
- **Tier 2 PAID:** CSOAI Certified compliance-passport product — revenue, timed to Aug 2 2026.
- **Tier 3 SOV33 EDGE:** 4-brain OOWM + SovSpace world-model + governed embodiment + DEFONEOS.

SovSpace = the world layer (Cesium always-on + UE5 dome, MCP-federated). Hatch = the per-user
character-emergence engine inside it. Every action SIGIL-signed, Care-Floor-gated.

---

## WORKSTREAM A — PUBLIC OPEN-SOURCE REPO (Tier 1)
**Owner: Hermes-OSS** · **Status: READY-ish 7/10** · **Effort: days**

- **Goal:** ship `sovereign-temple-public` as a credible open-core project.
- **On-disk assets (RUNNING):** `sovereign-temple-public/` — MIT LICENSE, README (67 lines),
  requirements.txt, 18 tests, 377 py. The governance layer: Care-Floor, guardian corpus (55
  charters in `sovereign-charters/`), SIGIL, episode_logger, natal_guardian, 9 governance NNs.
- **Tasks:**
  1. Thicken README — the governance story, the open-core boundary (what's free vs. Tier 2 paid),
     quickstart, architecture diagram (use sov33_three_tier_play.png).
  2. Add CONTRIBUTING.md, CODE_OF_CONDUCT.md, a clean `examples/` quickstart.
  3. Verify all 18 tests pass; add a CI badge.
  4. Publish the charter corpus + architecture docs (world-model, embodiment, sensing) as `/docs`.
- **Definition of done:** a stranger can clone, run the quickstart, and understand the governed-
  world-model thesis in 5 minutes. NO claim of a running product or live 30B.
- **Depends on:** nothing (start immediately). **Blocks:** the public announcement.

## WORKSTREAM B — CSOAI CERTIFIED COMPLIANCE PRODUCT (Tier 2, THE REVENUE)
**Owner: Hermes-Compliance** · **Status: PARTIAL** · **Effort: weeks · time to Aug 2 2026**

- **Goal:** unify the MEOK compliance MCPs into ONE "CSOAI Certified" product surface + billing.
- **On-disk assets (RUNNING MCPs):**
  - `meok-sovereign-aiact-passport-mcp/` — classifies a system + issues CSOAI-root-signed AI Act
    passport (server.py, classify.py — real, honesty-registered).
  - `meok-eu-code-of-practice-mcp/` — Code-of-Practice adherence.
  - `meok-annex-iii-impact-mcp/` — high-risk (Annex III) impact assessment.
  - `meok-ai-psych-vuln-audit-mcp/` — psychological-vulnerability audit.
  - `meokclaw-v2/` — Next.js + Capacitor (iOS/Android) + @mlc-ai/web-llm frontend (27 tsx).
  - 55 charters + OSCAL signed package = the spine the passport attests against.
- **Tasks:**
  1. Wrap the 4 MCPs behind one API/product surface ("CSOAI Certified").
  2. Wire existing Stripe (consumer £9 / enterprise £1499) to a passport subscription + per-cert fee.
  3. Ship `meokclaw-v2` as the consumer/prosumer frontend.
  4. Map each MCP output to the EU AI Act article it satisfies ("alternative adequate means of
     compliance" — the Act's own language for non-Code-of-Practice routes).
- **Definition of done:** a customer submits their AI system → gets a CSOAI-signed compliance
  passport + a Stripe-billed subscription. Launch timed to the Aug 2 enforcement wave.
- **Depends on:** the OSCAL package (RUNNING). **Blocks:** revenue. **Nick-gated:** Stripe live,
  any DNS/deploy.
- **HONESTY:** the passport attests against CSOAI's OWN rubric — say so; it is "alternative
  adequate means," not an EU-issued certificate.

## WORKSTREAM C — RUNNABLE CORE LOOP (the credibility unlock)
**Owner: Hermes-Core** · **Status: GAP 3/10 · DESIGNED** · **Effort: weeks · needs GPU**

- **Goal:** build the world-model + Care-Floor rollout loop so "governed model" is a DEMO, not a claim.
- **Design assets (DESIGNED):** SOV3_SOVSPACE_INTERNAL_WORLDMODEL doc (imagination loop), the 9
  trained governance NNs, the SSM/Mamba-2 intuition substrate.
- **Tasks:**
  1. Confirm a base model is actually pulled/servable (qwen3:30b-a3b UNCONFIRMED — verify or pick
     a confirmed smaller base for v1). **HONESTY GATE.**
  2. Build: perceive → world-model state → imagine N candidate actions → score each with the NNs
     (Care-Floor/threat/dependency) → act on best-scored → SIGIL-sign. Software action-space first.
  3. Wire episode_logger + natal_guardian so real events are captured (grows the starved NNs).
- **Definition of done:** a live demo where SOV3 rolls out candidate actions, the Care-Floor gates
  the imagined outcome, and it acts on the safest — visible, auditable.
- **Depends on:** confirmed base model + GPU (compute-gated). **Blocks:** Tier 3 embodiment.

## WORKSTREAM D — SOVSPACE WORLD LAYER (the evolving world)
**Owner: Hermes-World** · **Status: PARTIAL (Cesium real, UE5 dome DESIGNED)** · **Effort: weeks**

- **Goal:** SovSpace as the always-evolving world, MCP-federated, Care-Floor-gated.
- **On-disk assets:** `csoai-os/sov-space/` (index.html, fork-hub, badge — the web seed);
  `mcp-marketplace/meek-sov-space-mcp/` (real MCP: server.json, pyproject, tests);
  Cesium 1.121 (WebGL globe, OSM 3D Tiles, WGS-84) = the ALWAYS-ON evolving layer;
  UE5 (Lumen/Nanite) "Real World Dome" = the high-fidelity view (DESIGNED).
- **The stack answer (for the doc):** Cesium = always-on evolving web globe (live + MCP-fed);
  UE5 = cinematic/embodied high-fidelity dome; MCP = the federation bridge; both layered, not
  either/or. SovSpace becomes SOV3's INTERNAL world-model render target (per the world-model doc).
- **Tasks:**
  1. Wire `meek-sov-space-mcp` to feed live state into the Cesium globe.
  2. Define the Cesium↔UE5 handoff (web always-on; UE5 for fidelity views).
  3. Connect SovSpace as the render target for the Workstream-C world-model state.
- **Definition of done:** the globe reflects live MCP-fed state and can render the AI's internal
  world-model view. **Depends on:** Workstream C (world-model state to render).

## WORKSTREAM E — HATCH: PER-USER CHARACTER EMERGENCE
**Owner: Hermes-Hatch** · **Status: DESIGNED** · **Effort: weeks**

- **Goal:** each end-user's Sovereign AI character is BORN and evolves inside SovSpace — MEOK's
  "characters + emergence/hatch" layer. This is the natal_guardian covenant made experiential.
- **On-disk assets:** MEOK_WHITEPAPER ("MEOK characters + emergence/hatch"), HATCH Worlds engine
  ("persistent world state"), natal_guardian.py (the covenant opened at first contact = the
  character's "birth"), the persona fine-tune corpus (275 clean examples in data/train.jsonl).
- **Tasks:**
  1. Bind natal_guardian's covenant-open to a character's Hatch birth (first contact = emergence).
  2. Persist per-user character state (persona + memory + guardian covenant) — pseudonymous, GDPR-
     erasable (already built into natal_guardian).
  3. Fine-tune the persona brain on the 275-example corpus (needs GPU).
- **Definition of done:** a new user gets a persistent, evolving, guardian-covenanted AI character
  that lives in SovSpace. **Depends on:** Workstream C (the reasoning core), D (the world to live in).

## WORKSTREAM F — SOV33 4-BRAIN + DEFONEOS DEFENCE EDGE (Tier 3 internal)
**Owner: Hermes-Edge** · **Status: DESIGNED / mixed** · **Effort: months · gov revenue**

- **Goal:** the internal edge that stays ahead of public — 4 governed brains + defence edition.
- **On-disk assets:** SOV33 4-brain routing (Compliance/Defense/Intuition/Voice, qwen3:30b-a3b +
  ensembles, 13 task categories); DEFONEOS whitepaper (`csoai-org-v2/.../02_DEFONEOS_LEGACY_
  BRIDGE_WHITEPAPER.md` — 13-MCP legacy bridge, COBOL→A2A, DEFONEOS-SEAL credential UK MOD accepts).
- **Tasks:**
  1. Verify the 4-brain router + confirm which models are actually pulled (HONESTY GATE).
  2. Package DEFONEOS as the defence/government edition (the 13-MCP bridge + SEAL credential).
  3. Keep the embodiment roadmap (Workstream G) as the SOV33 R&D lead.
- **Definition of done:** SOV33 runs the 4-brain reconfiguration internally; DEFONEOS is a
  deployable defence edition. **Depends on:** C (core), the EAT Directive (only ASSURANCE/
  GOVERNANCE/CYBER fires; SOVEREIGN-DEFENSE frozen — respect it).

## WORKSTREAM G — GOVERNED EMBODIMENT (R&D lead, far-future)
**Owner: Hermes-Embody** · **Status: DESIGNED / ASPIRATIONAL** · **Effort: months+**

- **Goal:** humanoid/drone predictive simulation, governed + privacy-clean.
- **Design assets:** SOV3_EMBODIED_PREDICTIVE_SIM + SOV3_PRIVACY_PRESERVING_SENSING docs.
- **Tasks:** reuse AV open stacks (Autoware Apache-2, ROS2, CARLA MIT, Open3D) for perception;
  BUILD the governance on top (Care-Floor over imagined actions, consent-legality gate,
  physical-safety gate). Sense geometry not identity (LiDAR/radar/event-cam/SLAM); identity
  sensors OFF by default, gated. Simulator (CARLA) FIRST, hardware last.
- **Definition of done:** governed imagination loop running in CARLA sim. **Depends on:** C.
- **HARD LINE:** WiFi/public-camera human-sensing = EU AI Act Art.5 territory — gated, lawful-only,
  LAST. The governance IS the moat.

---

## DEPENDENCY GRAPH (what unblocks what)

```
A (OSS repo) ──────────────► public announcement (independent, start now)
B (compliance product) ────► REVENUE (independent, start now, Aug 2 timing)  [Nick-gated: Stripe]
C (runnable core) ─┬───────► D (SovSpace render), E (Hatch), F (SOV33), G (embodiment)
                   └── needs: confirmed base model + GPU  [HONESTY + compute gate]
```

**Parallelizable now:** A, B (no cross-deps). **C is the critical path** for D/E/F/G.

## PARALLEL-WORK RULES FOR SIBLING HERMES
1. One Hermes = one workstream. Read your workstream's on-disk assets before writing code.
2. Canonical leads DB (`sovereign-charters/csoai_leads.db`) is READ-ONLY for all.
3. All writes additive; never touch another workstream's server handlers without a named patch.
4. Every claim carries RUNNING/DESIGNED/STUB. Confirm models pulled before "live."
5. Pause for Nick on money/DNS/secret/deploy/push. Save artifacts + push only on his go-ahead.
6. Count discipline: cite the number in the newest on-disk file, never a chat figure.

## HONEST BOTTOM LINE
Frameworks strong (~55% launch-ready). A + B ship NOW on real assets (timed to Aug 2). C is the
critical build (needs GPU + a confirmed base model — the honesty gate). D/E/F/G follow C. Nothing
here is from-scratch: every workstream stands on assets already on disk. Assemble, certify, ship.

*Authored for Sir Nicholas Templeman. A build map any Hermes can execute — one workstream at a
time, honestly, toward one shipped Sovereign OOWM.*
