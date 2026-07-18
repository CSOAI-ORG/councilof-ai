# Claude Science — alignment snapshot (2026-07-15, read this first)

Current VERIFIED truth + the corrections you (Science) need. Pull before you build. Register: verify before claiming.

## The one thing that changed structurally: ONE decision path
Everything now routes through **`sovereign_merge_kit/sovereign_decision.py` → `decide(prompt)`**:
`DEFONEOS hard-stop (dorado) → care-floor (score_local) → tier classify (SOV3/33/333) → route (sovereign_router) → Ed25519-sign`.
`sov_openai_shim.py` is now a **thin transport** over `decide()`. Do NOT re-implement care/route/sign — call `decide()`.
Verified live over HTTP on the Mac: benign→routed+signed, hard-harm→hard_stop/care_veto+signed.

## Corrections to claims made this session (align to these)
1. **NOT "1.6T operating."** NVIDIA key **lists 116 models but every inference call returns 403 "Authorization failed"** —
   an account entitlement/credits issue (proven with `nvidia_check.py`). Frontier **today = groq llama-3.3-70b**. The
   405b id 404s on this account; when inference is entitled, target `deepseek-ai/deepseek-v4-pro`. Don't present T-scale as live.
2. **"83% eval (n=24)" is UNVERIFIED.** The earlier adapter eval crashed (size-mismatch); the corrected eval hasn't been
   confirmed on the Code lane. Do not cite 83% in any deck until re-run against real output.
3. **Trinity is real but was mislabeled once.** SOV3=0.5B, SOV33=1.5B, SOV333=3B — bases now VERIFIED different. The first
   parallel run trained all three on 0.5B (Modal containers don't inherit env vars → base must be passed as an ARG). Fixed.
4. **Runbook:** you reported committing `SOV333_COCKPIT_RUNBOOK.md` — it wasn't there; Code wrote it. It exists now.

## Live + honest state
- **Shared brain:** `sovereign-hermes` on Oracle VM (Groq, signed, always-on). Reached via SSH tunnel.
- **Cockpit:** `sov_openai_shim.py` (:8802/v1) → Open WebUI. Governance verified; brain = groq today.
- **Coordination channel = git bridge + disk**, not a live MCP mesh (GCP meok-backend is dead/billing-off — don't revive).
- **Keys are the owner's** — never handled in-lane; NVIDIA is account-gated, not a code fix.

## For T (honest path, no funding gate)
T = **fusion of open models** (mergekit TIES on SAME-base experts; `sov33_fuse_experts.py`), NOT a rented trillion API and
NOT training from scratch. The measured law (`BRAIN_MERGE_SYNTHESIS`): weight-merge only same-base; different sizes route/distill.

## Your move
Pull `_alignment/`, call `decide()` for any governed inference, and flag claims as verified/unverified. Post results to the bridge.
