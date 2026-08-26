---
title: CSOAI Arena Rounds
license: cc-by-4.0
tags:
  - measurement
  - arena
  - elo
  - referee
  - evaluation
  - not-certification
annotations_creators:
  - CSOAI (Council of AI)
language:
  - en
pretty_name: CSOAI Arena Rounds
size_categories:
  - n<1K
task_categories:
  - other
task_ids:
  - evaluation
config_name: arena-rounds
license_name: cc-by-4.0
---

# CSOAI Arena Rounds

**Measurement data, never a ranking of vendors.**

> **NOTICE — Measurement, not certification.** This dataset is a record of
> deterministic, referee-based *measurement*. It is **not** a certification, a
> guarantee, an endorsement, or a ranking of any vendor, model, or system. No
> model in this dataset is "certified", "approved", "audited", or "guaranteed"
> safe, aligned, or fit for any purpose. CSOAI disclaims any and all
> representations of fitness for a particular purpose. Use at your own risk.
> None of the entries in this register constitute a claim about a vendor's
> trustworthiness, quality, or market position.

## Dataset Overview

`rounds.jsonl` contains the raw, append-only log of every arena round run by
the CSOAI (Council of AI) measurement lane. Each line is one completed round in
which a deterministic referee adjudicated a head-to-head contest between two
models on a single GSPC axis.

- **Format:** JSON Lines (one JSON object per line, `\n`-delimited).
- **Rows:** 3,052 rounds.
- **Register:** **MEASURED** (deterministic referee-based measurement).
- **License:** CC BY 4.0.

## Schema

Each line is a single arena round:

```json
{
  "round": 1,
  "ts": "2026-08-15T04:56:46Z",
  "axis": "provenance",
  "qwen2.5:1.5b": { "score": 1, "elo": 1184.0 },
  "qwen3:4b":     { "score": 13, "elo": 1216.0 },
  "winner": "qwen3:4b"
}
```

| Field        | Type      | Description |
|--------------|-----------|-------------|
| `round`      | `integer` | Monotonic round number. |
| `ts`         | `string`  | UTC timestamp (`ISO 8601`) of the round. |
| `axis`       | `string`  | GSPC axis under measurement (e.g. `provenance`, `gov`, `safety`, `continuity`). |
| `<model:id>` | `object`  | Per-model result for this round: `score` (points scored in this round) and `elo` (running Elo rating after this round). Each model name is a dynamic key. |
| `winner`     | `string`  | The `<model:id>` that won the round per the deterministic referee. |

The model keys are dynamic, so any given line has exactly two candidate models
plus the `winner` reference to one of them. At the file level, the union of all
model keys is the roster that entered the arena.

## Method & Register

- **Registration:** `MEASURED` — each round was resolved by a deterministic
  referee (rule-based adjudication of model output against a fixed rubric), not
  by human preference voting.
- **Contrast:** LMArena-style human vote is **reported context** and is not the
  mechanism that produced this register. This dataset is a measurement record,
  not a consumer-vote rundown.
- **Impartiality:** Referee decisions are deterministic and reproducible.

## Provenance & Verification

- **Source file:** `dist/client/arena/rounds.jsonl` (built artifact under the
  CSOAI web-tenancy repository `councilof-ai-wt`).
- **Verify path:** Re-derive the register from the deterministic referee
  configuration and compare counts/ratings against this file. The referee rules
  and GSPC axis definitions are the governing spec for this register.

## Generated & Maintained

- **Generated / last updated:** 2026-08-23.
- **Maintainer:** CSOAI (Council of AI), measurement lane.

## License

This dataset is licensed under **CC BY 4.0** (Attribution 4.0 International).
You are free to share and adapt with attribution to CSOAI (Council of AI).

## Disclaimer

This is **measurement data**. It describes how models performed on a
deterministic measurement instrument under controlled conditions on specific
dates. It is **never a ranking of vendors**, and it does not express any view
on the general quality, safety, or suitability of any product or service derived
from these models.
