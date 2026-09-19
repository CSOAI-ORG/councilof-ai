# CSOAI claim-maintenance: retained-evidence integration

This directory absorbs the 19 September offline core into the existing CSOAI repository.
It is not a second MCP server, collector, scheduler, policy engine or signing service.
The core is unchanged from the Claim Maintenance/FIX input package. `run_retained.py`
is a narrow adapter over retained correction bytes, collector receipts and operator
contracts. Empty target lists remain zero readbacks, not successful propagation.

Run tests from the repository root:

```sh
python3 -B -m unittest discover -s scripts/claim_maintenance -p 'test_claim_maintenance.py'
python3 -B -m unittest discover -s scripts/claim_maintenance -p 'test_retained_integration.py'
python3 -B scripts/claim_maintenance/run_retained.py --bundle <operator-bundle.json> --inputs <read-only-input-directory> --output <new-private-output-directory>
```

The first suite replays the 52 prior core cases. The second contains 22 new synthetic
adapter cases. Counts are not independent validation, a new benchmark or production CI.
Use the same interpreter and bytes recorded in the execution receipt.

The local bundle contains exactly `schema`, `run_as_of`, `source`, `targets`.
The source contains `uri`, `body_file`, `receipt_file`. Each target contains `contract`,
`body_file`, `receipt_file`. A target contract has `contract_id`, `target_uri`,
`corrected_source_sha256`, `accepted_target_sha256`, `not_before`, `max_age_seconds`.
A complete successful receipt records requested/final URI, HTTP status, observed_at,
body_sha256, body_bytes and complete_body=true. Relative files only, max 2 MiB each,
max 32 declared targets. A missing target body remains unavailable. 304 reuse is not
implemented. Collector receipt origin is not authenticated by this plugin.

Operator input is not a permission token. A reviewed byte contract is not a claim of
scientific/legal correctness. The input tree must be immutable/read-only while reading;
path checks are not a race-proof sandbox against a concurrent malicious local user.
No untrusted source text is executed. All projections are internal, unsigned and inert.

Integration order: existing collector → retained input contract → this adapter → existing
review store. Only reviewed outcomes enter the existing read-only MCP/A2A/HTTP surface.
Live fetch/scheduling, authenticated host context, FIX execution and publication remain
separate operations. RunPod staging tests do not activate its production worker.
