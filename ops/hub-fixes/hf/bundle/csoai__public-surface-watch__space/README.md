---
title: CSOAI public-surface watcher
emoji: 🛰️
colorFrom: blue
colorTo: red
sdk: docker
app_file: app.py
pinned: false
license: mit
"on":
  schedule:
    - cron: "7 */6 * * *"
      command: "python /app/app.py"
short_description: The estate's public-surface watch, on HF CPU
---

# CSOAI public-surface watcher

**The estate's front door, checked on a schedule, from free Hugging Face CPU.**

This Space runs the estate's own **cold-start stranger-path survey** — work-plan row **W9**: every
published artefact gets the 60-second path a stranger runs, and the verdict is recorded as
PASS / FAIL / UNCHECKABLE with the seconds it took.

It exists because the watch used to live on a rented box. On 4 Nov 2026 the RunPod account
balance went negative, RunPod refused to rent pods, and the estate's reclaim deleted every pod
**and** the Oracle micro — so the watch stopped for nineteen hours, and the lane that would have
warned about the balance had itself been reclaimed. A check on the public front should not depend
on a rented box, and should not be able to be emptied by the thing it watches.

## What a run does

1. runs `cold_start_survey.py` (standard library only) against `https://councilof.ai`;
2. writes a JSON receipt to `receipts/cold-start-survey-<stamp>.json` in this repository — the
   public receipt of record, versioned by the Space itself;
3. uploads the same receipt to the private lane dataset `csoai/estate-lane-ops-20261103`.

## What a PASS means, and what it does not

A PASS records that the artefact **answered** and was internally **self-describing at read
time**. It is not certification of the underlying measurement, and not an endorsement. A FAIL is
named, and an UNCHECKABLE is recorded as UNCHECKABLE rather than as a pass or a failure.

## The source

`cold_start_survey.py` is the estate's own script, mirrored from
`CSOAI-ORG/councilof-ai` → `tools/sites/cold_start_survey.py`. One source of truth; this Space
runs it, it does not re-implement it.

<!-- csoai-card-fixes:start -->

## Citation

```bibtex
@misc{csoai_public_surface_watch_2026,
  title        = {CSOAI public-surface watcher},
  author       = {{CSOAI Ltd (Council of AI)}},
  year         = {2026},
  publisher    = {Hugging Face},
  howpublished = {\url{https://huggingface.co/spaces/csoai/public-surface-watch}},
  url          = {https://huggingface.co/spaces/csoai/public-surface-watch}
}
```

<!-- csoai-card-fixes:end -->
