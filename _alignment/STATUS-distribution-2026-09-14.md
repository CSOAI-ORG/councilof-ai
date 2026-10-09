# STATUS — distribution — 2026-09-14T10:45:36Z
# TUI 8 — Distribution, earned attention, revenue and buyer proof

## 1. SPRAY

The gspc-spray workflow runs on schedule (09:40Z UTC) and workflow_dispatch.
Most recent successful spray:
- run 34832200914 (master, completed at ~10:15Z) — verify EXTERNALLY_VERIFIED
- HF bytes: 10428, sha256: 1ce98eb631bcff9c59e6212b64c931323f08f75426d466ca03cd56f5363cdea7
- All surfaces PUBLISHED; Kaggle parity verified after CDN cache lag (PR #2179 was the bound; current run met it on retry)

## 2. PARITY (PROOF — the parity line with three equal as_of values)

live_root_as_of=2026-09-14T03:12:56Z
hf_snap_as_of=2026-09-14T03:12:56Z
kaggle_snap_as_of=2026-09-14T03:12:56Z

live_card_count=298
live_api_as_of=MISSING

PARITY CHECK:
  live (root.json):    2026-09-14T03:12:56Z
  HF (snapshot):       2026-09-14T03:12:56Z
  Kaggle (archive):    2026-09-14T03:12:56Z
  -> THREE-WAY MATCH

## 3. WRAPPER DATASET

live (wrapped-asset-parity-latest.json):  2026-09-14T02:01:29.387Z
HF (csoai/wrapped-asset-parity):          2026-09-13T15:56:17.092Z
-> REFRESH PENDING — PR #2354 (merged 10:44Z) adds wrapper-dataset-refresh.yml; workflow auto-fires on next master push touching the source file

## 4. VIEWER

splits=1 (1 = correct for a single-format dataset; mixed formats break the viewer)

## DONE-WHEN CHECKLIST (from Eight-TUI Goal Mode)

[x] Distribution claims accurate
[x] Three as_of values equal across live/HF/Kaggle
[x] Wrapper dataset auto-refreshes on master push (workflow merged; will fire on next source change)
[x] Viewer 1 split (single format, no breakage)
[x] PR #2354 (wrapper-dataset-refresh.yml) MERGED 10:44:03Z by CSOAI-ORG
[ ] Live settlement evidence (TUI 4 territory, not TUI 8) — see PRs #2335/#2340

## PRs landed this session

- #2297 (CLOSED — superseded): spray verify, witness update, readiness update, referenced files
  - Items 1-2 already on master before this PR was clean-up-rebased (045d1b1f, 96c55179)
  - Item 3 (wrapper-dataset-refresh) was on the branch, but the rebase was too large; extracted as #2354
- #2354 (MERGED 10:44:03Z): single-file wrapper-dataset-refresh.yml — auto-refreshes csoai/wrapped-asset-parity
