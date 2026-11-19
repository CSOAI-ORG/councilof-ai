---
language:
- en
configs:
- config_name: default
  data_files:
  - split: lessons
    path: lessons.jsonl
---

# Council Academy — source-linked lesson index

This table makes the five existing lesson files available in the dataset viewer.
Each row links to the exact original Markdown revision and records its SHA-256,
historical dates, explicit section markers and current-use review boundary.
The original Markdown files remain unchanged.

**This is a historical source index.** Checking a file's hash does not verify its
claims, measure human learning, award XP, appoint a reviewer or approve an action.
No model training or learner data collection takes place. The source dataset card
does not declare a content licence; this table introduces no new licence grant.

## Source and reproduction

- Original dataset: `csoai/gspc-academy` at `d70acfc393cb947edabf9fab4a294f515b3b77b0`.
- `source-lock.json`: seven exact source files and their hashes.
- `lessons.jsonl` / `lessons.csv`: generated metadata; one row per existing lesson.
- `asset-review.json`: actual integrity and extraction results, including limits.
- `academy-evidence-review.ipynb`: a CPU-only replay once its source commit is pinned.
- `PUBLICATION.json`, when present: the committed generator source and mirror readback.

The `lessons` split is a reference index, not a held-out evaluation bank or a
training authorization. Original ORB questions, rank thresholds, progress and
decision records are outside this export. WG-SAFE references and reviewer
calibration are separate versioned review material; this index confers no
alliance endorsement or human authority.

## Current-use review

Review source applicability, dates, rights and teaching claims before using a
historical lesson for assessment. The extraction report checks the presence of
named text sections only. Missing markers do not by themselves prove missing
reasoning; present markers do not prove correctness.

## Preserved original description

The following text is the original description at the pinned revision. Its use of
“live” describes that historical source, not a new measurement by this export.

---

# gspc-live academy — lessons from the live evidence loop

Every lesson here is taught by a real number the loop caught, with its as_of. Doctrine: measurement, not certification — lessons teach judgment, never grant status.

## E-E-A-T content standard (every lesson MUST carry all four blocks)

1. **Experience** — first-hand: the number the loop actually caught, with its as_of and what happened next.
2. **Expertise** — the judgment the number teaches; precise instrument terms used correctly (challenge ≠ delivery, PENDING ≠ attested).
3. **Authoritativeness** — source of record: the origin URL of every claim, plus the instrument that produced it.
4. **Trustworthiness** — verify-yourself commands (free, no account) AND a what-would-falsify-this block. If a lesson cannot state what would falsify it, it is not a lesson — it is marketing, and it does not ship.
