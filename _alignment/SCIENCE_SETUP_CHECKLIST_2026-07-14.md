# ✅ Claude Science + Sovereign — setup checklist (YOUR steps; keys are yours) 2026-07-14
_I built all the wiring. These remaining steps involve credentials/UI toggles — only you do those. I never
handle keys. Do each in ~2 minutes._

## 1. NVIDIA hosted big-brain — the real capability unlock (free, no GPU)
- Get a key at **build.nvidia.com** (starts `nvapi-`). It's free hosted access to 70B–405B models.
- **In Claude Science:** Customize → Credentials → **NVIDIA API** → paste the `nvapi-` key. Enable internet if prompted.
- **On your Mac** (so `sovereign.py` also uses the 70B): add to `~/.zshrc`:
  `export NVIDIA_API_KEY=nvapi-...`   then `source ~/.zshrc`.
  Now `sovereign.py ask "..."` fuses answers with a 70B, grounded + care-gated + signed. (No key = local fallback, still works.)
- ⚠️ Never paste the key into a chat. Only the credential field / your shell.

## 2. Connect Science to the internet + to all sov models
- **Internet:** Claude Science → Customize → enable web/compute access (its toggle).
- **All SOV models + pipeline:** Science already sees them — they live in this repo (`_alignment/sovereign_merge_kit/`),
  synced via `sync-lane.sh`. Point Science at `sovereign.py` (chat/ask), `sovereign_pipeline.py`, the OWEM router,
  the fusion + BFT proofs. Nothing to copy — it's all committed.

## 3. Free GPU / compute (honest — see COMPUTE_ACCESS_FOR_SCIENCE)
- **NVIDIA API (#1) is the best free "GPU" — hosted, no box needed.** Prefer it over SSH faff.
- **Modal** (real free GPU dispatch): `pip install modal && modal token new`.
- **SSH host that's live:** oracle-micro `145.241.232.16` user `ubuntu` (CPU-micro only) — add in Customize → Compute → SSH, paste your key there yourself.
- GCP box is DOWN (billing off); Colab/Kaggle stay manual (not SSH-able).

## What I already wired (done, committed)
- `sovereign_nvidia.py` — NVIDIA hosted-model client (key from env, never handled/logged by code).
- `sovereign_pipeline.py` — uses the NVIDIA brain when your key is set, else local; grounding + care-gate + signing unchanged.
- `sovereign.py` — one entry (`chat` guarded / `ask` grounded+signed).
- Compute pack + honest reachability in `COMPUTE_ACCESS_FOR_SCIENCE_2026-07-14.md`.

## The one-line truth
Set the NVIDIA key (step 1). That single free credential turns the Sovereign from a small local model into a
70B-backed, RAG-grounded, care-gated, signed system — the biggest capability jump available, no GPU, no SSH.
