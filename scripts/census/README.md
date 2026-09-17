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

## Registry PRESENCE is not schema VALIDITY

A registry serving a record is one fact. That record being well-formed against
its own declared schema is a different fact. Recording the first in a field
readers take to mean the second launders somebody else's defect into our
evidence, so the two are kept as separate states and never collapsed.

The worked example is MCP Registry issue #1546: the registry serves
`ai.alpic.test/test-mcp-server@0.0.1` at HTTP 200 with `"repository": {}` while
the 2025-09-29 schema that record itself declares sets
`Repository.required = ["url", "source"]`. Reproduced 2026-09-17; pinned as
`fixtures/registry-records/empty-repository-mcp-1546.json`.

`registry_schema_validation.py` runs AFTER collection and never mutates the
collected record — the served bytes are preserved and the verdict sits beside
them, carrying `record_sha256`. States:

| state | meaning |
|---|---|
| `SOURCE_ACCEPTED` | the upstream served it. That, and nothing more. |
| `SCHEMA_VALID` | validates against the schema the record ITSELF declares |
| `SCHEMA_INVALID` | does not, with the specific violations named |
| `SCHEMA_UNDECLARED` | the record names no schema — neither a failure nor a pass |
| `SCHEMA_UNFETCHABLE` | a schema was declared but could not be retrieved or used |
| `RECORD_UNPARSEABLE` | the served bytes are not JSON, so they declare nothing |

JSON parsing successfully is never sufficient for `SCHEMA_VALID`. Schemas are
resolved from the URL the record declares — four different schema versions were
live in a single 500-record sample — and cached under `schema-cache/`, so the
test suite runs with no network at all.

```bash
# Offline. Proves each state fires, including that INVALID fires on repository:{}
python3 -m unittest scripts/census/test_registry_schema_validation.py -v

# One-off verdicts on served bytes
python3 scripts/census/registry_schema_validation.py \
  scripts/census/fixtures/registry-records/empty-repository-mcp-1546.json

# Bounded live sample (a SAMPLE — never extrapolate it to the population)
python3 scripts/census/validate-mcp-registry-sample.py --limit 500 --allow-network \
  --out /tmp/mcp-registry-validation-sample.json
```

Sample of 500 records, 2026-09-17 (convenience sample in pagination order, not
random, not the population): 496 `SCHEMA_VALID`, 4 `SCHEMA_INVALID`, 0
`SCHEMA_UNDECLARED`, 0 `SCHEMA_UNFETCHABLE`, 0 `RECORD_UNPARSEABLE`. Three of the
four invalid records carry the `repository: {}` defect, across two schema
versions, and two of those are not test records.
