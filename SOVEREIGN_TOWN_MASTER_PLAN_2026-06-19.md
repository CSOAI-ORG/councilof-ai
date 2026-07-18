# Sovereign Town — Master Plan (revised, 2026-06-19) · T-15 to July 4

_Single source of truth consolidating everything built this session. Supersedes scattered status notes;
points to the detailed spec (`SOVEREIGN_TOWN_POC_2026-06-19.md`, §1-14) + dispatch
(`FREE_COMPUTE_DISPATCH_2026-06-19.md`) + layer stack (`CSOAI_LAYER0_UP_MASTER_STACK_2026-06-19.md`)._

## What this is
A governed-vs-ungoverned agent-world ("the answer to emergence.ai") that is simultaneously: a **proof** of
CSOAI governance, a **data flywheel** for sovereign models, an **IP engine** (openpatent), a **research
publisher** (MEOK Labs), and a **growth engine** (Reality-AI-TV). Agent-47 / human-in-loop = the demo &
explainer only; the product is **many towns running 24/7, autonomous, flywheel never stopping**.

## LIVE NOW (the fleet is turning)
| Tier | State | Detail |
|---|---|---|
| **Mac** | 🟢 running clean | pid 19667, cycle 6+, **7.6M+ cum episodes, 0 governed crimes**, 5-min cadence |
| **VM (meok-backend)** | 🟢 running + `@reboot` | full daemon, advancing, gov 0; instance-hygiene needs one clean restart on the locked build |
| **Actions** | 🟡 armed | partitioned to 100M seed block; `git push` activates 20-runner nightly harvest |
Disjoint seed ranges (VM=0 / Actions=100M / Mac=200M) → every cycle is NEW data. Per-cycle Ed25519-signed
ledger; models retrain every 10 cycles. Live counters: `fleet_status_{vm,mac}.json`.

## Asset inventory (built this session, all in `~/clawd/sovereign-town/`)
- **Engine:** `p0_aqua/sim.py` (28-district), `batch.py` (~2.1M eps/run parallel), `flywheel_forever.py`
  (24/7 daemon, --seed-base partitions, singleton lock, resumable, Ed25519 ledger).
- **Models/moat:** `train_all_hives.py` → 28 per-hive threat models (acc 0.989-1.000), `moat_models.json`.
- **Attestation:** `sign_lib.py` (Ed25519), `verify_chain.py` (offline-verifiable, tamper-evident).
- **Rigor:** `sweep.py` (15-cell sensitivity — collapse is mechanism-driven, not tuning), 3 collapse axes
  (crime/commons/trust), `gate_live.py` (audited SOV3 prod care-NN = degenerate; flywheel fixes it).
- **IP:** 7 inventions in the live openpatent **6-layer registry** (`openpatent_6layer_receipts.json`);
  `disclose.py` one-call filing.
- **Research publishing (NEW):** `report.py` → **28 per-hive whitepapers + INDEX published onto MEOK Labs**
  (`~/clawd/meok-labs-engine/research/sovereign-town/`). Each finding: governed-vs-ungoverned result, model
  acc, Ed25519 attestation. **This closes the town → MEOK Labs reporting loop.**
- **Showcase:** `investor-deploy-v2/index.html` (A/B chart, robustness, 24/7 fleet, attestation).
- **Free-compute:** `.github/workflows/sovereign-town-sim-matrix.yml` (armed), 3-tier compute design.

## The flywheel (now fully wired)
```
24/7 towns (3 hosts) → self-labelled Ed25519 episodes → per-hive models (retrain/10 cycles)
        ↓                                                          ↓
  openpatent 6-layer disclosures              MEOK Labs per-hive whitepapers (report.py)
        ↓                                                          ↓
        └──────────────→ investor showcase + Reality-AI-TV (growth) ←┘
```

## Revised roadmap to July 4 (T-15)
**DONE:** P0 (attested A/B, 3 axes, sweep) · P1 (28-hive engine, 2.1M-eps batch, 28 models) · 24/7 fleet
(Mac+VM live, Actions armed) · openpatent 6-layer (7 filed) · MEOK Labs reporting (28 findings) · Kimi
v1/v2/v3 absorbed + integrated · Layer-0 absorbed.

**GATED ON NICK (deploys/credentials — explicit, not silent):**
1. **`git push`** → activate the Actions free-cloud tier (100M partition).
2. **GPU credit grants** (NVIDIA Inception / DigitalOcean Hatch — apply now, 7-10d lag) → the train tier at
   scale (Unsloth+DoRA, KTO on our binary signals, vLLM+S-LoRA; spec §14).
3. **Public openpatent push** (7 inventions live in local 6-layer; deploy to public registry).
4. **VM clean restart on the locked build** (one-time: pkill all, redeploy flywheel_forever.py with singleton
   lock, start one) — or approve a watchdog cron for crash-restart.

**NEW capability (2026-06-19 pm) — The Looking Glass (regional regulation simulation):** `jurisdiction.py`
+ engine `block_rate` knob. Models jurisdictions as enforcement regimes (EU/US/UK/none), pre-computes
company outcomes under each (EU 0 crimes/1.0 resilience → ungoverned 16k/0.0). Spec §15. Strategic: don't
wait for sign-ups — simulate entities, know the move. First vertical = **DORA digital-twin** (CTPP-outage
cascade across archetypal banks + 19 real CTPP nodes; Pillar-3 scenario testing + Art-29 concentration risk).
DORA market (from `_intake/dsrb_positioning.md`): honest SAM €5.5–55M ARR (NOT €110–330B "TAM"); wedge =
xBRL-CSV RoI export; partner-first (OneTrust/IBM/Deloitte, lead with prototype). Honesty: simulated
decision-support, parametric not per-entity, no non-public data, "DSRB" is not a real category.

**OPEN ENGINEERING (no creds — I can do):**
- Productize the Looking Glass: DORA digital-twin v1 (archetypes + 19 CTPP nodes, penalty scoring, resilience chart) → a sellable scenario-testing artifact + a regulator-facing wind-tunnel demo.
- Build the xBRL-CSV Register-of-Information export wedge (the #1 DORA pain) + the 6 quick-win repositionings (collateral, not code).
- Redeploy locked `flywheel_forever.py` to VM (kills the duplicate-instance class of bug permanently).
- Low-crime hives (agisafe/asisecurity/biasdetectionof) show model F1 0.0 — their profiles trigger no crime
  → nothing to learn. Either harsher per-hive profiles or accept them as genuinely low-risk (honest either way).
- Swap procedural personas → the real 27-character DB; wire the retrained models back into SOV3.
- Auto-run `report.py` each cycle so MEOK Labs stays live; auto-`disclose.py` new inventions.

## Honesty register (carried — the credibility moat)
27 personas (not 46/47) · 12-around-1 council (not 33) · 271 MCPs · ledger-only money · defensive-only
(no "worm") · "in-simulation P0/P1" scope on all claims · moat = models + attested ledger, not hoarded raw ·
drop "no precedent / $14.9B floor" hype · July-4 target = fundable ASSET, not a closed round.

## Controls
Stop Mac: `pkill -f flywheel_forever`. Stop VM: `ssh meok-backend pkill -f flywheel_forever` (+ remove
crontab `@reboot` line). Status: `fleet_status_*.json` + `meok-labs-engine/research/sovereign-town/INDEX.md`.
