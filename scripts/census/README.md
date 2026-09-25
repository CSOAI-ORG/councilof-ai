# Speed 0 Hub census

Cursor-preserving collector for a complete Hugging Face listing walk.
Metadata only. No weight download. No GPU. Every row is `DISCOVERED` /
`UNMEASURED`. A listing is not a grade.

```text
source listing
-> immutable source revision
-> artefact-manifest digest
-> lineage
-> runtime variant
-> GSPC measurement
```

## Commands

```bash
# 10,000-record restart test against the in-process Hub stand-in
python3 scripts/census/hub_census.py restart-test \
  --out-dir /tmp/hub-census-restart --total 10000

# Live 10,000-record restart test (authenticated Hub API)
python3 scripts/census/hub_census.py restart-test \
  --out-dir /tmp/hub-census-live-10k --total 10000 --live --page-size 1000

# Resume or start the complete baseline (do not stamp MEASURED)
python3 scripts/census/hub_census.py collect \
  --out-dir /tmp/hub-census-baseline --mode baseline --resume --page-size 1000

# Daily overlapping changed-model sweep
python3 scripts/census/hub_census.py collect \
  --out-dir /tmp/hub-census-delta --mode delta \
  --since 2026-08-30T00:00:00Z --overlap-hours 6

# Rewrite SUMMARY.json + sha256 of listings.jsonl (census digest, not a GSPC cell)
python3 scripts/census/hub_census.py digest --out-dir /tmp/hub-census-baseline

# Counts-only 22-axis buckets + lab/org register (synthetic Hub, no probes)
python3 scripts/census/hub_census.py collect \
  --out-dir /tmp/hub-census-counts --fresh --synthetic --synthetic-total 32 --limit 32 \
  --publish-dir public/interop/hf-census
```

Counts-only artifacts (`axis-sources.json`, `org-register.json`, `SUMMARY.json`)
live at `public/interop/hf-census/`. `n` is the unique id count of the fetch
that wrote the file. `n_measured` is 0. The org register is who-runs-what
(card links), never a lab grade. Agent-facing copy:

- https://councilof.ai/api/gspc
- https://councilof.ai/interop/x402-trust/latest.json
- https://councilof.ai/signed/HOW-TO-VERIFY.md

`cursor.json` stores the exact Hub `rel=next` URL after every page. A crash
re-fetches the current page; the seen-set skips ids already written.

The 31 Aug 2026 baseline digest is committed as
`public/signed/hub-census-baseline.json` (quoted by `/api/state` and
`/api/compute`) and `spaces/gspc-board/census-manifest.json`. Operator copy:
`scripts/census/baseline-2026-08-31.SUMMARY.json`. Do not commit `listings.jsonl`.

Hub webhooks are limited to 1,000 events/day and cannot replace this census.
SOV3 registration is out of band (port 3101).

## Census frame (`frame.py`) — every public agent-endpoint catalogue, read to exhaustion or labelled

```bash
python3 scripts/census/frame.py --out /evac-bulk/census-frame-YYYY-MM-DD   # ~10 min, 1 req/s
python3 scripts/census/frame.py --top20 --frame /evac-bulk/census-frame-YYYY-MM-DD   # plan only
python3 scripts/census/frame.py --self-test        # offline: truncated page -> null totals
python3 -m unittest scripts/census/test_frame.py   # offline, fixtures in fixtures/frame/
```

Sources: official MCP registry (`version=latest`, cursor), HF Spaces `filter=mcp-server`
(Link header), a2aregistry.org (offset, declared total), docker/mcp-registry (tree + tarball
of one commit), Smithery (anonymous cap: always PARTIAL). x402 bazaars are read by
`x402-bazaar-conformance.py`, not here.

Each source ends `EXHAUSTED`, `PARTIAL` or `FAILED`; `population_total` is `null` unless
`EXHAUSTED`, and the union total is `null` unless every source is. An error body, a non-200,
a cut page or a repeated cursor is never an end. Raw pages are kept gzipped under `raw/<source>/`
with per-page sha256 and a `page_set_sha256`. Outputs: `summary.json`, `endpoints.jsonl.gz`
(one row per canonical endpoint, with every catalogue that lists it), `entries.jsonl.gz`.
Every row is DISCOVERED / UNMEASURED. `--top20` joins npm weekly downloads and writes
`plan-top20.json(l.gz)`; it contacts no endpoint.

`read_state.py` is the shared fail-closed predicate; `build-agent-interop-census.py` uses it
(see `docs/measurement/CORRECTION-agent-interop-census-2026-09-25.md`).
