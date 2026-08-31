# Thin banks gold leftover — 31 Aug 2026

UNSIGNED leftover. Measurement, not certification. Does not write `/api/gspc`.
7 empty GSPC cells stay empty. No mill. No wrangler. No model-as-judge.

Frozen gold only. Labels copied from already-published HF `items.jsonl`. No synthetic pad.

## Grown

| axis | current gold n | added | grown gold n | source of added |
|---|---:|---:|---:|---|
| safety (agi) | 36 | 30 | 66 | `csoai/agisafe-bench` items.jsonl |
| openness (oss) | 32 | 30 | 62 | `csoai/omai-bench` items.jsonl |

## Stopped (no unused frozen gold)

| axis | current gold n | gap to 80 |
|---|---:|---:|
| provenance (prv) | 32 | 48 |
| continuity (asi) | 33 | 47 |
| detector-interop (det) | 33 | 47 |
| cross-reality (xr) | 32 | 48 |

`protocol.jsonl` (det) and `checks.jsonl` (xr) have allowed label *sets* but no expected gold. Inventing those would be padding.

Per-item source ledger: `added/ITEM_SOURCES.md` (row → expected, source file path, SHA256).
