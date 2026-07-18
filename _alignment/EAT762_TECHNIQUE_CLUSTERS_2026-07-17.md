# EAT-762 — Cluster + Composition + Gap Map (sibling Claude Science alignment)

**Date:** 2026-07-17 · **Lane:** Hermes/JEEVES · **Branch:** `m4-handoff-2026-06-24`

## What shipped

### Data files (in api/data/)
- `SOV4_TECHNIQUE_CLUSTERS_2026-07-17.json` — 233 papers → 32 named + 201 arxiv-harvest → 15 families
- `SOV4_COMPOSITION_GRAPH_2026-07-17.json` — compatible stacks + incompatible merges
- `SOV4_GAP_MAP_2026-07-17.json` — what we have + what field has + OWEM layer map

### API
- `/api/sov4/technique-clusters` (GET) — returns all 3 data files + synergy recipe

## Honest line held
- 233 paper TITLES, not weights/code
- Composition = stack compatible (different layers), not merge incompatible weights
- Per-model T counts (never summed — same hard line as frontier roster)
- Cluster + composition + gap = the 3 ways to look at the same ledger
