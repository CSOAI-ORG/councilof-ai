# Committed mirror inputs

This repair consolidates the local generated-manifest exclusion and bounded-entrypoint work, then closes additional bypasses. It does not publish, certify or remeasure the existing estate by itself.

## Before any normal CLI probe or publish

- The root must be the top of a Git working tree, with HEAD equal to the local `origin/master` tracking ref.
- Tracked edits, missing Git state, untracked/ignored input files, duplicate inputs, noncanonical paths, symlinks and out-of-profile inputs are refused.
- Explicit `--artifact` selection follows the same checks; it is not an escape hatch.
- `mirror-manifest.json` is generated output, never an input. Output cannot overwrite tracked source or Git metadata.
- Every input must hash to its committed blob. Upload and readback expectations then use a temporary export of those blobs, not files that another worker can change mid-run.
- The manifest records the input commit. This is local Git-ref checking, not remote attestation; the operator must keep the tracking ref current through the authorised repository workflow.

## Offline preflight

`python3 scripts/mirror_fanout.py --check-inputs --no-write`

This validates inputs and exits before any provider upload or network readback. It does not establish that a mirror is reachable or complete. The normal artifact floor still applies to automatic discovery. Uncommitted source work must be reviewed and merged or moved by its owner; this script never deletes it.

## Tests

`python3 -m unittest discover -s scripts -p test_mirror_source_guard.py -v`
`python3 scripts/test_mirror_discovery.py`
`python3 scripts/mirror_fanout.py --selftest`

The first suite has 29 synthetic Git/CLI cases. The discovery entrypoint test uses a committed temporary fixture and a 30-second timeout, without external probes. The existing selftest uses loopback HTTP and injected fetchers. Passing these is not a live estate census, proof verification, successful publication or deployment.
