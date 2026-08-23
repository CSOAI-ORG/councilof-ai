# Mine Harness — councilof.ai estate measurement CI

Lives in the monorepo per owner directive 2026-08-23 ("get all work onto mono repo
harness and volumes — we work from there, not the MacBook"). Canonical copies also
mirror to the RunPod RAG volume (`/workspace/RAG/mac-migrate/mine-harness`) every
15 min via `com.meok.mac-work-mirror`.

## Contents

- `test_mine.py` — 23/23 mine assertions (canon coverage, corrections, signing).
- `e2e_test.py` — 18-surface live scoreboard (councilof.ai + csoai.org + HF/zenodo/openalex).
- `mine_ci.sh` — CI wrapper (runs both, emits `mine-ci-result.json`).
- `cards/` — 335 signed measurement cards + MANIFEST.
- `auto_sweep.py`, `carder.py` — mining/card pipeline tools.

## Run

```bash
# Monorepo / CI (no Mac volume)
MINE_CI_REPO_ONLY=1 bash mine_ci.sh
python3 test_repo_assets.py

# Full mine lane (A100 / Mac with ~/.grokbot volume)
python3 test_mine.py          # 23/23
python3 e2e_test.py           # 18/18 when canonical build is live
bash mine_ci.sh               # combined
```

Set `MINE_ROOT` to this directory when running from the monorepo copy.

## Doctrine

- Measurement, not certification.
- Guards against live (councilof.ai) will FAIL during the lane's direct-deploy
  clobber window; re-verify against the canonical deployment URL.
