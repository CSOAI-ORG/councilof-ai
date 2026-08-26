---
title: CSOAI Arena Elo by Axis
license: cc-by-4.0
tags:
  - measurement
  - arena
  - elo
  - bradley-terry
  - wilson-ci
  - not-certification
annotations_creators:
  - CSOAI (Council of AI)
language:
  - en
pretty_name: CSOAI Arena Elo by Axis
size_categories:
  - n<1K
task_categories:
  - other
task_ids:
  - evaluation
config_name: arena-elo-by-axis
license_name: cc-by-4.0
---

# CSOAI Arena Elo by Axis

**Measurement data, never a ranking of vendors.**

> **NOTICE — Measurement, not certification.** Every rating and confidence
> interval in this dataset is a *measurement* produced by a deterministic,
> referee-based instrument. Nothing here is a certification, guarantee,
> endorsement, or ranking of any vendor, model, or system. No model is
> "certified", "approved", "audited", or "guaranteed" safe, aligned, or fit for
> any purpose. Confidence intervals are **published, never hidden** — the
> register shows the uncertainty in each rating, and it does not paper over
> small sample sizes.

## Dataset Overview

`elo_reference.json` is the per-axis Elo reference for the CSOAI arena. It is a
single JSON object summarising the Bradley-Terry Elo rating of every model that
entered the measurement arena, both overall and decomposed by GSPC axis. Every
rating carries its **Wilson 95% confidence interval** on win-rate, published
out in the open.

- **Format:** JSON.
- **Schema:** `csoai.arena-elo-reference/0.1`.
- **Models rated:** 12.
- **Axes measured:** 17 (see `axes`).
- **Register:** **MEASURED** (deterministic referee-based).
- **License:** CC BY 4.0.

## Method

Ratings are computed with the **Bradley-Terry Elo** model:

- **K = 32** (rating-update constant).
- **Value-weighted per-axis**: rounds are aggregated per GSPC axis, and
  ratings are reported both overall and broken down by axis.
- **Wilson 95% confidence interval** on win-rate, computed for every entry
  (`n >= 5` games minimum).
- **Style-control credit**: length-decided rounds are weighted `< 1` so a model
  cannot game the rating by producing longer outputs.
- Confidence intervals are **published, never hidden** — they are a required
  part of the record, not an omission.

## Schema

```json
{
  "schema":        "csoai.arena-elo-reference/0.1",
  "generated":     "2026-08-23T12:42:51Z",
  "register":      "MEASURED (deterministic referee-based); LMArena human-vote is REPORTED context, not our measurement.",
  "method":        "Bradley-Terry Elo, K=32, value-weighted (per-axis), Wilson 95% CI, style-control credit (length-decided rounds weighted <1). n>=5.",
  "models":        12,
  "axes":          [ "accountability", "affect", "care", "continuity", "creativity", "efficiency", "fairness", "gov", "human-vs-ai", "jail", "privacy", "provenance", "safety", "slot15", "sovereignty", "swarm", "transparency" ],
  "leaderboard":   [ { "model": "mistral:7b", "elo": 1624.7, "winrate": 0.723, "games": 797, "ci": [0.691, 0.753] }, ... ],
  "per_axis":      { "accountability": [ { "model": "council-safe:latest", "elo": 1558.6, "winrate": 0.692, "games": 13, "ci": [0.424, 0.873] }, ... ], ... },
  "content_id":    "6d778f625b30a1c645c8c5f387ed84b3a5ecd9a724592d69025c023e41102258"
}
```

| Field        | Type   | Description |
|--------------|--------|-------------|
| `schema`     | `string` | Schema identifier of the record. |
| `generated`  | `string` | UTC timestamp when the reference was computed. |
| `register`   | `string` | Registration statement (MEASURED, referee-based). |
| `method`     | `string` | Exact method string — Bradley-Terry Elo K=32, Wilson 95% CI, style-control credit, `n>=5`. |
| `models`     | `int`   | Number of distinct models rated. |
| `axes`       | `[string]` | The 17 GSPC axes in scope. |
| `leaderboard` | `[entry]` | Overall ratings, one entry per model. |
| `per_axis`   | `{axis: [entry]}` | Ratings per axis; entries carry `model`, `elo`, `winrate`, `games`, and `ci`. |
| `content_id` | `string` | Content identifier anchoring the record (for verification). |

Each leaderboard / per-axis entry:

```json
{ "axis": "accountability", "model": "council-safe:latest", "elo": 1558.6, "winrate": 0.692, "games": 13, "ci": [0.424, 0.873] }
```

| Field     | Type     | Description |
|-----------|----------|-------------|
| `model`   | `string` | Model id that entered the arena. |
| `elo`     | `number` | Bradley-Terry Elo rating. |
| `winrate` | `number` | Empirical win-rate (0–1). |
| `games`   | `int`    | Number of games behind the rating. |
| `ci`      | `[lower, upper]` | **Wilson 95% confidence interval** on win-rate — published, never hidden. |

## Register & Provenance

- **Registration:** `MEASURED` — deterministic referee-based measurement.
  LMArena-style human-vote is **reported context**, not the instrument that
  produced these numbers.
- **Verification:** `content_id` anchors the record. The per-axis ratings and
  confidence intervals can be re-derived from the deterministic referee output
  and the governing GSPC / arena specification.

## Generated & Maintained

- **Generated / last updated:** 2026-08-23.
- **Maintainer:** CSOAI (Council of AI), measurement lane.

## License

This dataset is licensed under **CC BY 4.0** (Attribution 4.0 International).

## Disclaimer

These are **measurement data** on a deterministic instrument under controlled
conditions. Confidence intervals are presented honestly (published, never
hidden) and apply at the sample sizes used. This is **never a ranking of
vendors**, and it makes no claim about the safety, quality, or suitability of
any product or service built on these models.
