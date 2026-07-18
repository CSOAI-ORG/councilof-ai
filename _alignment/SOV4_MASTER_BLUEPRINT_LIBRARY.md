# SOV4 MASTER BLUEPRINT & LIBRARY — the single source, honest status
_Generated 2026-07-16 by MEOK-SOV3. Status tags: ✅ RUNNING (verified this session) · 🔄 IN-PROGRESS · 🧩 DESIGNED (spec, not built) · 🔌 STAGED (built, needs owner action to go live)_

This is the "lose no progress" reference. Every row is a real file/module or a named gap. Cross-check against MEOK_BUILD_TRACKER.md (live status) — this is the deeper library.

## 0. THE GOAL (unchanged, honest framing)
A **base-agnostic GOVERNED stack** — not a T-parameter model. 3 decorrelated brains fused around 1 governance integrator ("3 around 1"). The moat is governance + attestation + sovereignty, not raw size. Stays current by re-tuning onto whatever the open frontier ships. Sovereign-for-owner, NOT open-sourced.

## 1. THE 3 BRAINS (the emergence path)
| # | base | arch | status | evidence |
|---|------|------|--------|----------|
| 1 | Qwen3.6-35B-A3B | Transformer MoE | ✅ TRAINED | loss 4.02→1.69, adapter `baa3985a`, Modal job a7b261a7 |
| 3 | Bamba-9B-v2 | SSM / Mamba-2 | 🔄 TRAINING | Modal job 3217a29f (A100, the decorrelated SSM leg) |
| 2 | DeepSeek/GLM | Transformer MoE | 🧩 NEXT | ~$15, owner-gated GPU spend |
Emergence claim = FORBIDDEN until measured fused>best-single, gated by ρ (rule-aware gate, validated 10/10).

## 2. ARUM — THE LAYER SPINE (✅ WIRED 14/14, sov33_arum.py)
L0 SIGIL signs every layer output into one verifiable hash-chain ("L0 connects it all"). Order:
- **L0** SIGIL attestation (Ed25519) ✅
- **L0a** Rainbow security — IP-rotation, worm/probe/DDoS evasion ✅ (rainbow_rotate.py)
- **L0b** BFT threat council — 75 nodes, tolerate f=24 Byzantine ✅ (bft_threat_council.py)
- **L1** Memory (fixed identity) ✅
- **L2** Fluid routing — ρ-driven fuse-vs-route per task ✅ (sov33_fluid_router.py)
- **L3** Care gate — 0.35 floor, framed-harm recall 1.00 ✅ (sov33_care_local.py)
- **L4** KRUM aggregation — Byzantine-robust, 58.9× vs mean ✅ (sov33_governed_training.py)
- **L5** Conformal veto — Pr[allow&harmful]≤α ✅ (sov33_conformal_veto.py)
- **L6** Evolve/IMPROVE — propose-only, human-gated ✅ (sov33_evolve_layer.py)
- **L6b** Gated executor — propose→DORADO→guard→care→sign→run ✅ (sov33_gated_executor.py)
- **L7** BFT hive — DRUM quorum + N-version sensing ✅ (sov33_bft_hive.py)
- audit / 7-NN bus / fusion-gate ✅

## 3. THE 3 SPINES
- **DRUM** = TIME (9-stage flow + clock; 30 entities, f=9, quorum=21) ✅
- **KRUM** = TRUST (Byzantine aggregation, verified 58.9×) ✅
- **ARUM** = LAYER (14/14 wired, L0-up) ✅

## 4. SECURITY (behavioral + network, honest boundaries)
- **DORADO hard-stops** ✅ — absolute refusals: kinetic/surveillance/weapons/minor/WMD/severed + **EXFILTRATION** (anti-spy: refuse shipping corpus/weights/keys out). Battery 5/5. Behavioral, not crypto.
- **SIGIL** ✅ — signs every decision; a stolen copy is provably-not-yours (doesn't PREVENT copying).
- **Rainbow + threat council** ✅ — network evasion + 75-node threat scoring.
- **action_guard** ✅ — fail-closed catastrophic-op veto (13/13).
- HONEST GAP: no crypto DRM on the weights themselves — sovereignty = keep private + never publish + air-gap the sovereign tier.

## 5. GOVERNANCE NNs (7 planets)
✅ 3 strong: creativity, care_pattern, relationship (0.75-0.80)
✅ threat FIXED this session: 0.954 held-out vs 0.548 baseline (was overfit)
🧩 3 data-gated (NOT faked): dependency (leaky), care_validation (no labels), partnership (thin)

## 6. HIVE / INFRA
- **king_hive.py** ✅ (154 lines) — A/B keystone competition (KING/Dragon vs QUEEN/Turtle), judge-scored, SIGIL-signed. Runs on Ollama today; Tailscale mesh to split M4/M2 — no code change. 99 real verdicts logged.
- **GCP VM / meok-backend** 🔌 — :3101 hive, :8888 keystone, :8889 EU-gate etc. UNREACHABLE from this sandbox (no tunnel); needs owner SSH / live mesh. Status = STAGED not verified-live.
- **Local :3101** 🔌 — sandbox blocks loopback; run via ./run-local.sh in real terminal.

## 7. SELF-IMPROVEMENT (bounded, this IS the safety)
- **Evolve loop** (code/scaffolding): propose→test-held-out→HUMAN RATIFY ✅
- **Retrain loop** (weights): SovSpace record→periodic LoRA→ρ-gate→HUMAN APPROVE swap 🧩
- **TTT** (test-time training): real+published, but ephemeral fast-weights only; same SSM family as Bamba. NOT weights self-rewriting mid-thought (that stays mirage).
- HARD LINE: both loops PROPOSE+TEST autonomously; commit to charters/money/deploy/identity stays HUMAN-GATED.

## 8. OPEN THREADS (ranked, all owner-gated)
1. 🔄 Brain #3 Bamba lands → run emergence test (one function call, validated to work)
2. 🧩 Brain #2 DeepSeek/GLM (~$15) → 3 brains → measure real ρ + fusion
3. 🔌 GCP mesh live (owner SSH) · local :3101 (real terminal) · Kaggle bench print
4. 🧩 3 data-gated NNs need labeled datasets

## 9. THE OPERATING LOOP (perpetual currency)
New frontier open model → LoRA on corpus → ρ-gate (add if decorrelated) → swappable proposer under same governance. "Most advanced GOVERNED stack that stays current + improves under ratification." NOT out-parametering the frontier.

## AUDIT CORRECTIONS (2026-07-16)
- Commit e5796954d's message said "wired into ARUM as L6b" but an insertion bug left it 11/11 at that commit; fixed to 12/12 in a later commit (whitespace fix). Git history not rewritten; this note is the correction.
- Brain #3 Bamba: auto-harvest failed; adapter retrieved manually from remote sandbox (now terminated). final_loss 1.464, artifact c7265669.
- signed_chain E2E now runs over all 14 real layers (was a 3-4 entry mock earlier).
- GCP VM "unreachable": the earlier `timeout` probe never ran (missing binary); conclusion stands from prior-session context, but no live probe executed this session.

## ORACLE GENAI — STATUS UPDATE (2026-07-16, supersedes "not auth-tested")
✅ VERIFIED LIVE this session (two independent calls): meta.llama-3.3-70b-instruct answered via OCI
request-signing (DEFAULT profile, tenancy ...3bc..., region uk-london-1), round-trips 0.5s and 0.59s.
Endpoint inference.generativeai.uk-london-1.oci.oraclecloud.com reachable from sandbox. This SUPERSEDES
the earlier oracle_config_fixed_not_auth_tested constraint. ROLE: serving/teacher brain (rented Meta weights,
NOT owned) — belongs in the ONLINE/federation tier + distillation, NOT the owned-weights emergence fusion.

## SYSTEMIC PATH BUG (2026-07-16) — honest count
37 modules (verified via exhaustive grep, NOT a truncated sample) hardcode `~/.sovereign`, which does
not exist and is not writable in the sandbox -> their state-writes silently failed. This is the real
reason memory/consolidation/flywheel never populated. FIXED inline: sov33_memory_bridge.py,
sov33_memory_consolidation.py. Shared resolver sov33_paths.py (SOV_DIR / sov_path()) now available;
35 modules remain to migrate to it. Env-first (SOV33_SIGIL_DIR), safe TMPDIR fallback.
