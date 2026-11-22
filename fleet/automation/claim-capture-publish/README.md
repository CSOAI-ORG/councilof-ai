# claim-capture-publish: "Input revision mismatch" (M4, hourly)

Job: `com.csoai.claim-capture-publish` (M4 LaunchAgent, StartInterval 3600) runs
`~/.csoai/claim-capture-bridge/publish_all_verified.py`. Its fifth child, `ras_intake/run_intake.py`, runs
`intake.py -> build_work_products.py -> acceptance/run_release_chain.py -> automatic_deltas_20260925/watch_release_changes.py`
and stops at the first non-zero exit.

The code lives only on the M4 (`~/.csoai/claim-capture-bridge`, not a git checkout). This folder carries the
fix as a patch plus a regression test. Nothing here changes the Mac by itself.

## Diagnosis (read-only, from the M4 files)

* `run_release_chain.py` line 77 requires, for each of strands-harness, langgraph and a2a-sdk, that
  (a) the request-queue revision equals the version in the pinned `state/release-inspection/inspection.json`, and
  (b) the live intake's PyPI-metadata hash equals the pinned `source_metadata_sha256`.
* The intake refreshes `state/latest.json` and `state/request-queue.jsonl` from **latest-on-PyPI** metadata every
  day. The inspection is a one-off pin, written 2026-10-14T09:40Z (as_of in inspection.json). It matched that day's
  intake, and the chain completed then (acceptance/latest.json, fingerprint 062bde3e…).
* Intake run 20261015T000356Z recorded strands-harness 0.3.0 on PyPI (pin 0.2.0). From the next hourly run
  (2026-10-15T00:04Z) the chain raised `Input revision mismatch` every time it was reached: 688 exit-2 results and
  0 successes in `scheduled-publish.log` up to 2026-11-22T02:52Z, and 689 identical lines in `scheduled-publish.err`.
  The failures began on 15 Oct, not 7 Nov.
* State on 2026-11-22 (intake run 20261122T005128Z): pinned 0.2.0 / 1.2.15 / 1.2.2, requested 0.4.0 / 1.2.24 / 1.3.1.
  The metadata hash differs for all three.
* Because `run_intake.py` stops at the first failure, `watch_release_changes.py` (deepagents / pydantic-ai delta
  maintenance) has not run since 2026-10-14T23:03Z.

Root cause: the check compares a version-pinned historical result with the live latest release. Any routine
upstream release therefore turns into a hard failure. The reports' own freshness policy says otherwise: "Version-pinned historical
result; reevaluate on dependency or method change", and a changed dependency should mean HOLD_UNTIL_RECHECKED for that
report. Re-pinning alone does not last; the 14 Oct re-pin held for about 14 hours.

## Fix (`run_release_chain.patch`, 1 file, 19 changed lines)

* `input_drift()` reports each target whose request revision or metadata hash no longer matches the pin.
* If any target drifted, `retained_hold()` re-verifies the retained result (the pointer's manifest hash and every
  listed file hash). It returns `NOOP_UPSTREAM_SUPERSEDED_HOLD_UNTIL_RECHECKED`, with the per-target drift, exit 0.
  It writes nothing and makes no network requests.
* These still fail with exit 2, as before: no retained result, a retained manifest or output that changed, a pin
  missing or ambiguous, a routing or authority change, and the concurrent-change guard.
* sha256 of `ras_intake/acceptance/run_release_chain.py`: before `11f1be80dead3cbf01b494a225d0bcecfd1ec9b912c17ad0b795b007a171d018`,
  after `9fac77d373ed5d14f4d7ec89a60e08284893e418de27c706bbb99f0074ae0dcb`.
* `pipeline_sha256` is part of the method fingerprint. After a later re-pin, the first run will therefore write a new
  result directory rather than NOOP; that is expected.

## Tests

`test_run_release_chain_drift.py` is stdlib only. It runs a chain file (`RAS_RELEASE_CHAIN`) in a temporary mirror
with stub Condor, contract, catalogue and checker modules. Fixture versions and hashes are the real 14/15 Oct values.

* Patched file: 7/7 pass.
* Original file: 4 fail (the drift and hold cases, failing with the live error) and 3 pass (the cases that must keep failing).
* Replay on a copy of the real 22 Nov state and the real 14 Oct retained outputs (only Condor, contract and catalogue
  stubbed): the original exits 2 with `Input revision mismatch`. The patched file exits 0 with
  `NOOP_UPSTREAM_SUPERSEDED_HOLD_UNTIL_RECHECKED`, 3 targets superseded, the retained manifest verified, and no new results.

Not covered: Condor's `LayerOContract` and `SovSpaceGraph` were stubbed, so the full evaluation path after a re-pin is
not exercised here. `watch_release_changes.py` has not run for 5 weeks, so its next result is unmeasured.

## Owner step (M4; not done by this PR)

```sh
cd ~/.csoai/claim-capture-bridge
shasum -a 256 ras_intake/acceptance/run_release_chain.py   # expect 11f1be80…d018
cp ras_intake/acceptance/run_release_chain.py ras_intake/acceptance/run_release_chain.before-drift-hold.py
patch -p1 --dry-run < /path/to/run_release_chain.patch && patch -p1 < /path/to/run_release_chain.patch
shasum -a 256 ras_intake/acceptance/run_release_chain.py   # expect 9fac77d3…0dcb
RAS_RELEASE_CHAIN=$PWD/ras_intake/acceptance/run_release_chain.py \
  /opt/homebrew/opt/python@3.14/bin/python3.14 -B /path/to/test_run_release_chain_drift.py   # expect OK (7 tests)
```

The next hourly run should log `run_release_chain.py` exit 0, followed by the first `watch_release_changes.py` run since 14 Oct.
Optional: to evaluate the newer releases rather than hold, re-pin with
`/opt/homebrew/opt/python@3.14/bin/python3.14 -B ras_intake/inspect_release_archives.py`. That makes 3 downloads from
files.pythonhosted.org; run it after that day's intake. It needs exactly one wheel per package, otherwise the chain
fails with "Pinned input inspection missing or ambiguous".
Rollback: `cp ras_intake/acceptance/run_release_chain.before-drift-hold.py ras_intake/acceptance/run_release_chain.py`.

Scope: measurement only. A HOLD means the retained static release-integrity result was not re-checked against
the newer releases. It is not a statement about those releases.
