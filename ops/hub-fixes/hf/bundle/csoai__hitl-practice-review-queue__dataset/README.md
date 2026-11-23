---
license: cc-by-4.0
language:
- en
task_categories:
- text-classification
tags:
- ai-oversight
- human-in-the-loop
- review-queue
- gamification
- measurement
- council-of-ai
pretty_name: HITL Academy Practice Review Queue (real PENDING artefacts)
size_categories:
- n<1K
---

<p align="center">
  <img src="https://huggingface.co/datasets/csoai/brand-assets/resolve/main/csoai-banner-1280x256.png" alt="Council of AI (CSOAI)" width="100%">
</p>

# HITL Academy — Practice Review Queue (the real one)

**Reviewing these IS the real work.** These 30 artefacts are actual entries from the Council
of AI (CSOAI) Evidence-Admission-Trust (EAT) human review queue — 664 artefacts PENDING at
publication time. Your verdicts feed that queue via the fail-closed review machinery
(`review.mjs` + `publish-manifest.mjs`); this is not a simulation.

## What a learner does

For each record: fetch the artefact named by `artefact_key` (its `hash` is the store's
integrity binding), judge **admissibility** — does the measurement hold together: schema
present, numbers consistent, separation justified, no shortcut (unsigned supersession,
collapsed model, saturated bank) waved through — and give a reason. A correct, reasoned
verdict, once accepted into the queue by a current human reviewer, earns
`xp_if_accepted` = 50 XP, the same award the engine grants per signed oversight decision.

- `answer_key_status` is `PENDING — your decision joins the human review queue` by design:
  there is no answer key here, because **the gold standard is your judgement joining the
  real queue**, producing an Ed25519-signed `csoai.hitl-oversight-receipt/0.1` receipt (operator, axis,
  decision APPROVED/HOLD/REJECTED, note, competency flag).
- Prerequisite: complete the frozen Micro-MOOC module for the artefact's axis first —
  `csoai/hitl-academy-orb1` … `orb5`. The competency gate blocks unbriefed sign-off.

## Composition (30 records, sampled deterministically from 664 PENDING)

- Schemas: `meok.bank-pilot/0.1`, `meok.council-interaction-pack/0.1`, `meok.measurement/0.1`, `meok.measurement/0.3`, `meok.offline-availability/0.1`, `meok.piece-consolidation/0.1`, `meok.read-plane/0.1`, `meok.s1-citation-verification/0.1`, `meok.takeover-audit/0.1`
- Axis hints:
- `care-refusal`: 1
- `continuity`: 1
- `estate-vs-board-consistency`: 1
- `governance`: 22
- `openness`: 1
- `s1-citation-verification`: 1
- `serving-fidelity`: 3
- Fields are public-safe only: filename key, store hash, schema name, axis hint, size, date.
- No model outputs, no prompts, no rows files, no signatures beyond the store hash are included.

## Sensitivity screening

Every candidate artefact was scanned for private keys, credential-like values
(`sk-`, `ghp_`, `AKIA…`, bearer tokens), non-public email addresses and personal
filesystem paths. **15 PENDING artefacts were excluded** (mostly `-hive-attack` runs and
ecosystem scans carrying home-directory paths or third-party addresses). Remaining 259
clean candidates; 30 sampled. Found something sensitive in an included record? Open an
issue on this dataset and it will be pulled and re-screened.

## The loop this dataset belongs to

Frozen datasets teach → this queue exercises → accepted verdicts sign receipts → XP and
ranks accrue (ORB-I Observer 0 → ORB-V Arbiter 750) → competency-gated humans unblock
gates (promotion gate, the sealed 120-item bank's G4 measure gate, working-group seats)
→ board measurement resumes → new artefacts regenerate the next practice set.

## Licence & provenance

- Licence: **CC-BY-4.0** (the dataset records; artefact content remains governed by the
  CSOAI measurement estate).
- Source: `review/state.json` (schema `csoai.review-state/0.1`), Council of AI, councilof.ai.
- **Measurement, not certification.**

<!-- csoai-card-fixes:start -->

## Citation

```bibtex
@misc{csoai_hitl_practice_review_queue_2026,
  title        = {HITL Academy Practice Review Queue (real PENDING artefacts)},
  author       = {{CSOAI Ltd (Council of AI)}},
  year         = {2026},
  publisher    = {Hugging Face},
  howpublished = {\url{https://huggingface.co/datasets/csoai/hitl-practice-review-queue}},
  url          = {https://huggingface.co/datasets/csoai/hitl-practice-review-queue}
}
```

<!-- csoai-card-fixes:end -->
