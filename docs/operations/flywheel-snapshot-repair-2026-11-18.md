# Council Space artifact snapshot repair

This change repairs an existing derived presentation. It creates no event store,
review appointment, measurement, commercial result or execution authority.

The previous builder inferred run time from file modification time, emitted
hard-coded results when some files merely existed, counted knowledge entries as
verified and exported spawn-ledger rows as users. Its output default was under
client/public even though Vite serves the root public directory. Council Space
also retained bundled sample scores when a fetched snapshot was empty or failed.

## Behaviour

- Read the same nine named local artifact slots, with bounded input sizes and
  symlink containment. Unknown, missing and invalid inputs remain explicit.
- Only source-reported measured_at or run_at establishes a run time.
  generated_at describes the snapshot build. Copying files does not refresh them.
- Include the exact input SHA256, source status and a 14-day display freshness
  classification. This is separate from measurement admission and release gates.
- Render allowlisted aggregate fields as source-reported. Never infer signature
  verification from a flag, count stored entries as verified or type in a metric.
- Do not read or export a user ledger. The user count remains unmeasured.
- Start the galaxy with no result rows. Reject the old snapshot contract, show
  an unavailable state on failure and accept a valid empty result.

The checked-in replacement snapshot is a build with no benchmark inputs supplied.
Its missing-input rows describe that build only, not the availability of all
Council systems. No new model evaluations or running services are established.
The former static values remain in Git history.

## Reproduce

Use Python 3.12 and Node 24, with no package installation:

```sh
python3 -m unittest discover -s scripts -p test_build_flywheel_snapshot.py -v
node --test scripts/flywheel-snapshot.node-test.mjs
python3 build_flywheel_snapshot.py --bench-dir /your/approved/artifacts --output /tmp/flywheel-snapshot.json
```

For a repeatable preview, supply a timezone-aware --as-of value. The adapter
rejects booleans, strings and nonfinite numbers in numeric fields. It intentionally
does not infer measurements from filesystem timestamps or unrecognised schemas.

## Integrating the wider operating cycle

Keep evidence and human decisions in the existing csoai.evidence-event/0.1 and
csoai.hitl-authority-effect/0.1 records. Keep the Watchdog daily-index contract
for its own source availability and review reporting; do not treat this galaxy
projection as that index or a second case store.

Reuse the existing signed findings index, receipt toolkit and feed-delivery
checker for customer packets. Retain exact source dates, rights and limitations.
Measure one accepted case, its cost and reuse before expanding a service.

## Release acceptance

This source change is reviewable before production release. Full repository
checks and a deployed desktop/mobile check remain necessary. After release,
check the root /flywheel-snapshot.json, the galaxy's no-input state, a controlled
input build, fetch failure, empty results and the absence of per-user exports.
Actual measurement signing and independent reproduction remain separate work.
