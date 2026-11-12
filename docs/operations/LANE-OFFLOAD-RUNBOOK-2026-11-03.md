# Lane offload runbook — how an agent lane works without a fat local clone (2026-11-03)

The owner's standing direction (2026-11-02): **the Mac is not the substrate.** Lanes run in
GitHub Actions; heavy loops run on HF Jobs / Kaggle; pod workspaces follow the RunPod pattern.
This is the lane-side manual — how to work that way, with the measured numbers from the
hygiene lane that ran exactly so on 2–3 Nov 2026. The substrate side (pod supervisors, the
volume, the tunnel, Desktop Commander) is recorded separately in
[CSOAI-SUBSTRATE-AND-OFFLOAD-2026-11-02.md](./CSOAI-SUBSTRATE-AND-OFFLOAD-2026-11-02.md).

## 1. The problem, measured

The Data volume sat at 99–100% for most of 2 Nov (718 MB free of 228 GB) while four-plus
lane trees each held ~3 GB checkouts, browser caches re-downloaded ~1.1 GB (Playwright +
Cypress, refilled within hours of purging), and `/tmp` repro clones reached 7.5 GB — all
touched within a single hour, none deletable because an active lane owned them. Nothing
moved to Trash: every candidate checkout was mid-work (evidence per path in the lane's
disk manifest). Deleting was never the fix.

## 2. The pattern that works (worked example: the hygiene lane)

**a. Sparse partial clone — 430 MB, not 2.8 GB.**

```bash
git clone --filter=blob:none --single-branch --branch master --sparse \
  https://github.com/CSOAI-ORG/councilof-ai.git <lane-dir>
cd <lane-dir> && git checkout -b lane/<name>-<date>
git sparse-checkout set client/src scripts functions e2e docs
# individual files, when a whole dir is too much:
git sparse-checkout add --skip-checks public/_redirects
```

85% smaller, blobs fetched on demand, everything else identical (branch, push, PR, gh CLI).
Know its two blind spots: (i) the local pre-push content gates fail on files the sparse tree
lacks (`.github/`, SBOM bytes, Chromium) — pushing with `--no-verify` is the documented
emergency bypass, and CI's pr-gates is the real gate, so watch it; (ii) filesystem-existence
assertions in guards can false-fail locally — verify against git (`git cat-file -e
HEAD:<path>`) before believing a "missing file" report.

**b. GitHub-side work needs no clone at all.** Queue surgery (close superseded PRs, delete
debris branches, comment, merge) is pure `gh` — the 2026-11-02 pass closed 34 PRs and
deleted 34 branches without touching a working tree. Now automated twice daily by
`hygiene-sweeper.yml`.

**c. Generated files are regenerated, never hand-merged.** When master moves under a lane
(three churn windows on 2 Nov), resolve conflicts in generated artefacts by taking either
side and re-running the generator that owns them (`generate-redirects.mjs`,
`generate-sitemap.mjs`, `build-axis-reports.mjs`), then let the guard prove the result.

**d. Land through PRs with the gates you need.** Lane PRs ride `pr-gates` like everyone's;
a fully green PR (CLEAN, zero failing/pending) can merge the moment a merge window opens —
under heavy churn, poll for CLEAN rather than forcing: master moved four times under one PR
in a day, and each window came within minutes.

## 3. Where compute lives

| Work | Runs on | Entry point |
|---|---|---|
| Lane work: sweeps, guards, generators, docs | GitHub Actions | the lane's own workflow (see `hygiene-sweeper.yml`) or plain PR gates |
| **Board mirrors + storage (HF-first, 2026-11-04 revision)** | **Hugging Face** — datasets (snapshot storage), Spaces (served mirrors), private scratch datasets | `hf-gspc-surface-sync.yml` (2×/day, verified live); board mirror: [`csoai/gspc-board`](https://huggingface.co/datasets/csoai/gspc-board) dataset + Space; lane scratch: private `csoai/lane-hygiene-scratch` |
| Measurement batches (CPU) | **HF CPU (free tier)** | per the Antigravity week plan (`docs/operations/ANTIGRAVITY-LANE-WEEK-PLAN-2026-11-03.md`) |
| Measurement batches (GPU/CPU) | Kaggle | `kaggle-gspc-batch.yml`, `gspc-one-publish.yml` |
| Measurement mill (HF Jobs GPU) | HF Jobs, 4×/day | `hf-jobs-mill-launch.yml` → `mill-jobs-land.yml` — **both `disabled_manually` since 23/24 Oct; re-enabling is owner-gated (tracked on #3746)** |
| Busabase substrate (legacy, running) | RunPod | `runpod-intake` / `runpod-land` + the RUNPOD-GSPC-* docs; durable state on `/workspace`, never `/opt` or `/root` (see the substrate doc for why). **Legacy: new lane work goes to HF first; the pod serves the existing substrate only.** |

**The 2026-11-04 revision (owner word: "moving from RunPod to HuggingFace Spaces and
buckets")**: HF is the primary lane substrate. The credentials are plumbed (B7: the working
HF token synced into `HF_TOKEN` / `HUGGINGFACE_TOKEN` / `HF_INFERENCE_TOKEN`, and the board
parity across HF dataset + Space + Kaggle + GitHub is EXTERNALLY_VERIFIED per the
Antigravity lane). RunPod keeps only the live Busabase substrate; lane scratch goes to
private HF datasets, batch work to HF CPU / Kaggle, and the petabyte `/workspace` volume is
inherited by the existing pod workloads rather than grown.

A lane that needs a pod does NOT clone the repo onto the Mac to reach it: the workflows
dispatch the pod; the lane reads results from PRs and artifacts.

## 4. Local footprint policy

- **One sparse checkout per machine per lane.** No second full clone "just to check
  something" — `git ls-remote` and `gh api` answer from anywhere.
- **Caches are rented, not owned**: Playwright/Cypress re-download on demand; purge freely
  when disk pinches, and expect the next e2e run to re-fetch.
- **Anything removed moves to Trash with a manifest** (path, HEAD sha, why-safe, restore
  command) — the 2026-11-02 pass moved nothing because nothing qualified; the manifest's
  re-check commands make the next pass one command per candidate.
- **Scratch belongs in repo CI or a private HF dataset**, not `/tmp` on the Mac — `/tmp`
  repro clones are how 7.5 GB vanished overnight.

## 5. Human steps that remain owner-gated

1. **Desktop Commander Authorize** — the one-time OAuth click in the DC dashboard; until it
   happens, DC coordination rides issues + `LANE_COORDINATION.md` like everything else.
2. **Mill workflows re-enable** — `disabled_manually` is a human decision; the sweeper's
   green-mill auto-merge arms itself the moment they run again.
3. **Apply-mode flip confirmation** — the sweeper schedule applies from 2026-11-03; say the
   word and it reverts to dry-run in one line.
