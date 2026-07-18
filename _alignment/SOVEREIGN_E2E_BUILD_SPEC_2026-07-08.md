# SOVEREIGN OOWM — SEQUENCED E2E BUILD SPEC
## Concrete steps, real paths, real commands, definition-of-done per phase
### CSOAI Ltd (UK 16939677) · Authored 2026-07-08 · Executes the 7-workstream handoff

> This is the ORDER-OF-OPERATIONS. Each phase: real assets → exact steps → DoD → gate. Verified
> against on-disk code this session. Honesty contract binds: RUNNING/DESIGNED/STUB; confirm models
> before "live"; Nick-gated on money/DNS/secret/deploy/push; canonical leads DB read-only.

---

## PHASE 0 — THE PROOF: "governance with a face" (days · start here)
**Why first:** smallest build that proves the whole thesis — a character delivers a real
compliance passport. De-risks everything downstream.

**Real assets (verified on disk this session):**
- Character **Justitia** — `meok-brand/character-factory/personalities/new_archetypes.json`:
  role "Legal/Regulatory Counsel", ethics "Framework-adherence (EU AI Act, NIST)", VRM avatar
  `/vrm/AvatarSample_B.vrm`.
- **Passport MCP** — `meok-sovereign-aiact-passport-mcp/` with 5 real tools (endpoints.py):
  `classify_use_case` → `issue_passport` → `verify_passport` → `list_active_passports` →
  `generate_annex_iv`. Output: `{tier, triggers, annex_iii_hit, annex_iv_required}`; passport is
  CSOAI-root Ed25519-signed (`ed25519_verify.py`).

**Steps:**
1. Stand up the passport MCP locally: `cd meok-sovereign-aiact-passport-mcp && python -m
   sovereign_aiact_passport.server` (stdio). Smoke-test `classify_use_case("<a real use case>")`.
2. Bind Justitia as the front: a thin UI/agent wrapper that takes a user's plain-English AI use
   case, calls `classify_use_case` → if `annex_iv_required`, calls `issue_passport` +
   `generate_annex_iv`, and RETURNS it in Justitia's voice (authoritative/clear/objective) with
   her avatar. The character narrates; the MCP does the real work.
3. Wire `verify_passport` as the public check (the Ed25519 signature is the real trust anchor).

**Definition of done:** a user describes their AI system to Justitia → receives a CSOAI-signed AI
Act compliance passport + Annex IV doc, delivered by the character. One end-to-end flow, real
signature, real classification. **This is the demo that sells Tier 2.**
**Gate:** none to build locally. Nick-gated before any public deploy.

---

## PHASE A — PUBLIC OSS REPO (days · parallel with Phase 0)
**Assets:** `sovereign-temple-public/` (MIT, README 67 lines, 18 tests, 377 py) + `sovereign-
charters/` (55) + architecture docs (world-model, embodiment, sensing).
**Steps:** (1) thicken README with the governance story + open-core boundary + quickstart +
`sov33_three_tier_play.png`; (2) add CONTRIBUTING + CODE_OF_CONDUCT + `examples/`; (3) verify 18
tests pass, add CI badge; (4) publish charters + arch docs as `/docs`.
**DoD:** a stranger clones, runs quickstart, gets the governed-world-model thesis in 5 min. No
running-product or live-30B claim. **Gate:** Nick-gated on the public push.

---

## PHASE B — CSOAI CERTIFIED PRODUCT (weeks · THE REVENUE · time to Aug 2)
**Assets:** 4 MEOK MCPs (`meok-sovereign-aiact-passport-mcp`, `meok-eu-code-of-practice-mcp`,
`meok-annex-iii-impact-mcp`, `meok-ai-psych-vuln-audit-mcp`), `meokclaw-v2/` frontend, Stripe
(£9/£1499), OSCAL signed pkg.
**Steps:** (1) wrap the 4 MCPs behind one "CSOAI Certified" API surface; (2) Phase-0's Justitia
flow becomes the passport UX; (3) wire Stripe to passport subscription + per-cert fee; (4) ship
`meokclaw-v2` as the frontend; (5) map each MCP output → the EU AI Act article it satisfies
("alternative adequate means of compliance").
**DoD:** customer submits system → CSOAI-signed passport + Stripe-billed subscription, live.
Launch timed to Aug 2 enforcement. **Gate:** Nick-gated — Stripe live, DNS, deploy.
**Honesty:** passport attests against CSOAI's OWN rubric — "alternative adequate means", not an
EU-issued certificate. Say so.

---

## PHASE C — RUNNABLE CORE LOOP (weeks · needs GPU · the credibility unlock · CRITICAL PATH)
**Assets:** SOV3_SOVSPACE_INTERNAL_WORLDMODEL doc, 9 governance NNs, SSM/Mamba-2 substrate.
**Steps:** (1) **HONESTY GATE — confirm a base model is actually pulled/servable**
(`ollama list` on M4; qwen3:30b-a3b UNCONFIRMED — verify or pick a confirmed smaller base for
v1); (2) build the loop: perceive → world-model state → imagine N candidate actions → score each
with the NNs (Care-Floor/threat/dependency) → act on best → SIGIL-sign; (3) wire episode_logger +
natal_guardian so real events are captured (grows the starved NNs).
**DoD:** live demo — SOV3 rolls candidate actions, Care-Floor gates the imagined outcome, acts on
safest, auditable. **Gate:** confirmed base model + GPU. **Blocks:** D/E/F/G.

---

## PHASE D-G — FOLLOW PHASE C (weeks-months)
- **D · SovSpace** (`csoai-os/sov-space/`, `meek-sov-space-mcp`, Cesium 1.121 + UE5): wire the
  MCP to feed live state into the Cesium globe; SovSpace renders Phase-C's world-model state. DoD:
  globe reflects live state + renders the AI's internal view.
- **E · Hatch** (natal_guardian + Character Factory + 275-example persona corpus): bind covenant-
  open to character birth; persist per-user character (persona+memory+covenant, GDPR-erasable);
  fine-tune persona on the 275 corpus (GPU). DoD: a user hatches a persistent, evolving,
  guardian-covenanted character. Uses the Phase-0 characters.
- **F · SOV33 + DEFONEOS** (4-brain router, DEFONEOS 13-MCP bridge): verify which models are
  pulled (HONESTY GATE); package DEFONEOS as the defence edition. Respect the EAT Directive
  (SOVEREIGN-DEFENSE frozen). DoD: 4-brain runs internally; DEFONEOS deployable.
- **G · Embodiment** (AV stacks Autoware/ROS2/CARLA + governance): perception reused, governance
  built on top; sense geometry not identity; CARLA sim FIRST. DoD: governed loop in CARLA.
  **HARD LINE:** WiFi/public-camera human-sensing gated, lawful-only, LAST.

---

## THE SEQUENCE AT A GLANCE

```
NOW (parallel):   PHASE 0 (proof) ─┐        PHASE A (OSS repo) ─┐
                                    ├─► these three run together, days-weeks
                  PHASE B (revenue, Aug 2) ─┘   [Nick-gated: Stripe/deploy]
                        │
CRITICAL PATH:    PHASE C (runnable core) ── needs GPU + confirmed base model [HONESTY GATE]
                        │
FOLLOWS C:        PHASE D (SovSpace) · E (Hatch+characters) · F (SOV33/DEFONEOS) · G (embodiment)
```

## THE FIRST THREE COMMANDS (literally where a Hermes starts)
1. `cd ~/clawd/meok-sovereign-aiact-passport-mcp && python -m sovereign_aiact_passport.server` —
   confirm the passport MCP runs, smoke-test `classify_use_case`.
2. `ollama list` on the M4 — the HONESTY GATE: what base model is ACTUALLY pulled? (unblocks C.)
3. `cd ~/clawd/sovereign-temple-public && python -m pytest` — confirm the 18 tests pass (Phase A).

## HONEST BOTTOM LINE
Phase 0 is the smallest thing that proves the whole thesis and it's buildable NOW on verified
assets. A+B ship in parallel timed to Aug 2. C is the critical path and its FIRST step is an
honesty check (`ollama list`), not code. D-G follow C. Nothing is from-scratch. Nick-gated on
every money/deploy step.

*Authored for Sir Nicholas Templeman. The order of operations — start with the proof, ship the
revenue, build the core, then the world. One step at a time, honestly.*
