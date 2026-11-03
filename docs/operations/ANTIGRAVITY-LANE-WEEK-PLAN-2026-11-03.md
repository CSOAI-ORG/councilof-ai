# Antigravity lane — week plan, 2026-11-03 → 2026-11-09

**Doc ID:** `csoai.antigravity-lane-week-plan/0.1` · operator: antigravity (M4 + RunPod + HF/Kaggle) · horizon: DAYS
**Alignment:** coordinates with `docs/operations/CLAUDE-LANE-WEEK-PLAN-2026-11-02.md`, `docs/operations/CSOAI-SUBSTRATE-AND-OFFLOAD-2026-11-02.md`, `docs/operations/LANE-OFFLOAD-RUNBOOK-2026-11-03.md`, and `docs/operations/CSOAI-WORK-PLAN-YEARS-TO-DAYS-2026-10-28.md`.
**Doctrine:** measurement-not-certification · UNMEASURED is first-class · TIES are not wins · fetch failure is UNREACHABLE · three-state verification (`VALID` / `INVALID` / `UNCHECKABLE`) · we never score our own products on the public vendor board.

## 0. Completed baseline (verified 2026-11-03T02:54Z)

1. **GSPC Live Board (`34 axes · 34 measured · 0 unmeasured`)**: Landed in PR #3724 (`72ff204026`) and verified live at `https://councilof.ai/api/gspc` (`as_of: 2026-11-01T15:09:42Z`, `card_count: 428`, Merkle root `4e57607854bea40122c738aa83bbcfcd0d7bd7461add1683af4ee011e1e08aa0`).
2. **External Distribution Parity (`EXTERNALLY_VERIFIED`)**:
   - `https://huggingface.co/datasets/csoai/gspc-board/tree/main/snapshot`
   - `https://huggingface.co/spaces/csoai/gspc-board/tree/main/snapshot`
   - `https://www.kaggle.com/datasets/nicktempleman/csoai-gspc-living-board`
   - `https://www.kaggle.com/datasets/nicktempleman/gspc-one`
   - `https://github.com/CSOAI-ORG/gspc-board`
   - Verified byte-for-byte via `scripts/spray/verify-gspc-parity.py` (`kind: csoai.gspc-snapshot-parity/1`, `state: EXTERNALLY_VERIFIED`).
3. **Actions Secrets Refreshed (Closes B7 for Actions workflows)**:
   - Synced verified working credential from `~/.cache/huggingface/token` (`Nicholastempleman`, org `csoai`) to `HF_TOKEN`, `HUGGINGFACE_TOKEN`, and `HF_INFERENCE_TOKEN` on `CSOAI-ORG/councilof-ai`, plus `GSPC_BOARD_TOKEN`.
   - Fixed `kaggle>=1.7` missing `six` dependency in `.github/workflows/gspc-spray.yml` (#3789) and `.github/workflows/gspc-one-publish.yml`.
4. **M4 Local Disk Headroom & Spine Discipline**:
   - Reclaimed `> 17 GiB` (`18.2+ GB` free, 41% capacity) on `/` without touching any live lane checkouts or `csoai-work`.
   - Git plumbing (`GIT_INDEX_FILE` + `git commit-tree`) used exclusively on the M4; heavy compute/storage routed to RunPod (`estate-scratch-20261028` / `08xza5ommr`), Hugging Face (`csoai`), and Kaggle GPU/CPU.

## 1. Parallel execution tracks (2026-11-03 → 2026-11-09)

| Track | Cadence | Scope & Close Test |
|---|---|---|
| **Track 1 — Live Board & External Mirror Parity** | Every 6h (autonomous) | Re-verify `https://councilof.ai/api/gspc`, `root.json`, HF (`csoai/gspc-board`, `csoai/gspc-one`), Kaggle (`nicktempleman/csoai-gspc-living-board`, `nicktempleman/gspc-one`), and GitHub (`CSOAI-ORG/gspc-board`). Close test: `verify-gspc-parity.py` returns `EXTERNALLY_VERIFIED` (`rc=0`). |
| **Track 2 — Council OS UI & Standards Adapter Doors** | Tue–Thu | Land Council OS navigation doors (`/him`, `LanguagePicker`, `i18n-dashboard-wiring`, Academy/Trust lobby tabs), `safe_pack_verify.py` realpath hardening, and HITL authority test guard. Close test: `pr-gates/gates` 55/55 green and deployed to production. |
| **Track 3 — RunPod / HF / Kaggle Offload & M4 Guard** | Daily | Keep M4 `/` free space `> 15 GiB`; run `csoai_console.py` and `gspc_meok_spine.py` receipts; route batch evals to Kaggle (`kaggle-gspc-batch.yml`) and HF Jobs (`hf-jobs-mill-launch.yml`) and pod storage to `estate-scratch-20261028` (`08xza5ommr`). Close test: `0` `LOOPING` lanes and `critical_ok: true` in dated spine receipt. |
| **Track 4 — Cross-Lane PR Queue Unblocking** | Continuous | Monitor open PRs across `claude`, `codex`, `hygiene`, and `ops` lanes; rebase/merge `CLEAN` PRs without overwriting sibling branches. Close test: zero green PRs stranded on `BEHIND` for >2h. |
| **Track 5 — Today's Engineering Batch (`E1`, `E3`, `E4`)** | 2026-11-03 (`EXECUTED`) | See [`ANTIGRAVITY-TODAY-PLAN-2026-11-03.md`](./ANTIGRAVITY-TODAY-PLAN-2026-11-03.md): (E1) `scripts/verify-post-merge-batch.mjs` + [`docs/verification-2026-11-03.md`](../verification-2026-11-03.md); (E3) `scripts/check-evidence-bundle-freshness.mjs` + `.github/workflows/evidence-bundle-freshness.yml`; (E4) `scripts/verify-subject-banks.mjs` + [`docs/measurement/subject-banks-index-2026-11-03.md`](../measurement/subject-banks-index-2026-11-03.md). |

Measurement, not certification. Anyone can re-check at https://councilof.ai/verify
