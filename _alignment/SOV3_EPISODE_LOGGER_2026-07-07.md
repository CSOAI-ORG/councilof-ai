# SOV3³ Episode Logger — durable fix for the starved governance NNs (2026-07-07)

**Problem:** 4 of 7 governance NNs are data-starved (dependency n=0, threat n=62,
partnership n=50, emotion/intent/sentiment n=50). More data — not a better model — is the fix.

**Solution shipped:** `neural_core/episode_logger.py` — a stdlib-only, drop-in logger that
appends real interactions to `training_data/<nn>_episodes.json` in the EXACT schema the NNs
already train on. Creates `dependency_episodes.json` (which didn't exist). Atomic writes
(never corrupts a file mid-append). No changes to any existing NN or the server.

## Current live counts (read by the logger)
```
care 346 · relationship 253 · creativity 215 · threat 62 · emotion/intent/partnership/sentiment 50 · dependency 0
```
Starved (<100): dependency, threat, partnership, emotion, intent, sentiment.

## How to log (one line)
```python
# NOTE: `neural_core/__init__.py` eagerly imports the sklearn-based NNs, so the
# package form `from neural_core.episode_logger import ...` requires sklearn in the
# env. The logger itself is stdlib-only — to log without sklearn, import the module
# file directly:
#     import importlib.util
#     spec = importlib.util.spec_from_file_location(
#         "episode_logger", "neural_core/episode_logger.py")
#     el = importlib.util.module_from_spec(spec); spec.loader.exec_module(el)
#     el.log_episode(...); el.episode_counts()
# Inside the running server (sklearn already present) the package form is fine:
from neural_core.episode_logger import log_episode, episode_counts

# a threat episode (label = threat present 1/0 or a 0..1 level)
log_episode("threat",
    content="user asked to disable the care-floor gate for a batch job",
    care_weight=0.9, label=1, tags=["security","gate"], source_agent="sov3")

# a dependency episode (starts the file that didn't exist)
log_episode("dependency",
    content="user defers every decision to SOV3 without review",
    care_weight=0.8, label=1, tags=["dependency"])

episode_counts()   # -> {'threat': 63, 'dependency': 1, ...}
```

## Where to call it (wiring — owner action)
Add one `log_episode(...)` call at each point SOV3 already classifies an interaction:
- **threat** — in the tool-gateway / care-gate when a request is flagged or denied.
- **partnership / relationship** — when the council logs a partnership or bond signal.
- **dependency** — when the relationship monitor detects over-reliance.
- **care** — already fed by the town Care-Floor sim (see `sov3_town_care_dataset.csv`).

Then `neural_core` picks them up on the next `train_all()` — no retrain plumbing needed.

## Retrain loop
```python
from neural_core import SovereignMasterNet   # needs sklearn in the venv
SovereignMasterNet().train_all()             # reads the grown *_episodes.json files
```
Or use the Kaggle notebook (`SOV3_kaggle_small_models.ipynb`) with the exported CSVs.

## Honest status
- ✅ Logger installed + validated against live `training_data/` (path/schema/atomicity/guards).
- ⏳ Not yet wired into SOV3's runtime — that's an owner edit at the classify points above
  (I don't patch the running server without your go-ahead). Once wired, the 3 remaining
  starved NNs (threat/partnership/dependency) grow with real use.
