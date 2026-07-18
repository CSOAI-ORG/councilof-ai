# 🗓️ ROUTINES — REVISED + ALIGNED to Hermes & Claude-Science lanes (2026-07-12, M4)

Supersedes the raw sweep in `ROUTINES_SCHEDULES_AUDIT_2026-07-11.md` (still the ground-truth inventory).
This is the **lane-aligned** view: every live routine mapped to its owner lane, de-conflicted with the
**Hermes** lane (`LANE_TASKS_HERMES.md`) and the **Claude-Science** lane (`SOVEREIGN_CLAUDE_SCIENCE_ALIGNMENT_2026-07-10.md`).
Honesty register binding. VERIFIED live 2026-07-12 (stdout in §Verify).

## Live routine → lane map (what actually runs, who owns it)
| Routine (verified) | Cadence | Lane owner | Aligned with |
|---|---|---|---|
| **SOV3 `:3101`** `com.meok.sov3-keeper` | KeepAlive (durable) | **M4 backend** | Serves the 313-tool MCP surface Hermes registry reconciles + Science OWEM benches call. **200 OK.** |
| `com.meok.sov3-eternal-loop` | 1800s | M4 backend | the self-improve tick; writes labels the Hermes eval lane reads |
| `com.meok.sov3-daily-federation-refresh` | @3am (VM-independent) | M4 backend | ingest 1282 sources / catalog 371 servers → the corpus Hermes registry + Science research read |
| **Hermes gateway** `ai.hermes.gateway` (pid live) + backend `:8000` | resident | **Hermes** | THE production learner. **Do not kill.** M4 keeps `:3101` up *for* it; no overlap. |
| OCI VM `sov33-emergence.service` | resident tick | Science/substrate | the always-free emergence substrate (care-floor + Ed25519 sigils) — Science OWEM ground |
| crontab: guardian(*/2) · sovereign-24-7(*/5) · a1_retry(*/15) · memory VACUUM(@3am) · daily eurlex/competitive/aeo · hermes-* shifts | mixed | M4 + Hermes | hermes-* shifts = Hermes lane; keep. others = M4 ops. |
| Claude scheduled-tasks | 1 left (`meok-os-overnight-batch`) | M4 consumer | the 18 stale tasks are gone → no longer a duplication hazard ✅ |

## The alignment rule (so lanes don't collide)
1. **One backend, one keeper.** `:3101` (SOV3, M4) is the only KeepAlive that matters; `ai.hermes.gateway`
   + `:8000` (Hermes) are resident and load-bearing — **M4 never kills them**, Hermes never touches `:3101`'s keeper.
2. **Data flows one way per lane.** M4 federation-refresh produces the corpus → Hermes registry reconciles
   catalog-vs-server (LANE_TASKS_HERMES #1) → Science benches OWEM on the reconciled surface. No lane
   re-runs another's routine.
3. **Honesty carries across all three.** No T-count aggregates (Hermes #5); OOWM status is catalog-only,
   never cited as "running"; the defensible score is GSM8K 0.922 / MMLU 0.776 (LANE_TASKS_CLAUDE #3).

## This session's M4 consumer-OS ships (for Hermes + Science lanes to build on)
The consumer AI-OS (`os.meok.ai`) advanced materially — lanes that reference these should update:
- **SovSpace world is now REAL Cesium 1.123** (was arcade three.js) — Hermes world-model registry
  (LANE_TASKS_HERMES #4: HY-World/Hunyuan3D) now has a live Cesium body to target; Science
  `MEOK_SOVSPACE_Workspace.md` should note the world body is live, embed-aware, one-contract.
- **Signed consent/awareness onboarding** (Ed25519 via `/api/sign`, verified on prod) — the Science
  Presence/Awareness (`MEOK_PRESENCE_AWARENESS.md`) surface is now shipped consumer-side, consent-gated.
- **Character = signed MCP-card mind, WebGL/Cesium bodies** (per `MEOK_CHARACTER_ARCHITECTURE_CANON`) —
  dock seat is the emergence being; globe is the World body. Consistent with Science emergence doctrine.
- **Predictive typing + OS MCP-card layer** — the estate's small-model router (`sov33_compute`, Hermes
  Zamba lane) can back the prefetch when `:3101` is reachable; today it uses `/api/chat`.

## Revised routine actions
- ✅ **Aligned + de-conflicted** (this doc): lane ownership fixed; no cross-lane duplication remains that
  isn't already flagged.
- ✅ Claude scheduled-tasks pruned to 1 (the 18-stale duplication hazard is gone).
- ⚠️ **OWNER-GATED / standing-config — NOT auto-executed** (overheat + persistent-config rules, and the
  `macbook-overheat-launchd-sprawl` lesson): (a) dedupe the remaining ~6 crontab duplicate lines; (b)
  collapse scorecard/uptime/briefing to ONE scheduler; (c) reconcile the **two divergent SOV3 tool-sets**
  (`run-local` hermes/k25 build vs the federation build) to one canonical `:3101`. Each is reversible;
  fire on Nick's explicit go-ahead — I will not re-mutate launchd/crontab unprompted.

## Verify (2026-07-12)
- `:3101/health` → **200**. `ai.hermes.gateway` + Hermes `:8000` → **live** (:8000 responds 404 = up, no
  /health route). `com.meok.sov3-keeper` pid 1126 running. `sov3-eternal-loop` + `federation-refresh` loaded.
