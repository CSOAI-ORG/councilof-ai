# Council of AI decision rehearsal candidate

A working local integration (v0.2.0) of a synthetic globe, deterministic scenario queue,
scripted agent-role messaging, canonical evidence export, replay and controlled
comparison. This is one package in the existing Council monorepo. It is a
rehearsal workbench, not the completed production estate or a live agent society.

## Start

Requires Python 3.10+ and a browser. The app itself needs no pip/npm install,
API key, container runtime or paid model. From the repository or extracted
source archive root:

```sh
python3 packages/world-rehearsal/main.py serve
```

Open **http://127.0.0.1:8765**. Ctrl-C stops the process and removes its temporary
SwarmChat message store. Exported bundles remain wherever you save them.
The host binds only IPv4 loopback; do not expose this developer server publicly.
There is no production identity, tenant isolation or durable human approval here.

## Complete local journey

1. Choose **Keep the initial evidence snapshot**, population 1,000, seed 42. Run.
2. Explore the sampled globe, rotate it, inspect a record and move the timeline.
   The accessible table contains the full aggregate timeline.
3. Inspect three scripted machine-role records actually stored/read through the
   vendored SwarmChat Store/API. Save the evidence bundle.
4. Choose **Check evidence at decision time** with the same population and seed.
   Run and save its bundle.
5. Clear the view and reopen the saved original. Replay must match before its
   contents render. Edited data is refused; an old result is cleared immediately.
6. Select both saved files and compare. Only the intervention may differ.
   Change an input and the previous verdict ceases to apply.
7. Use **Timing and simulation permit** to test expiry before any update, expiry
   before revocation, and revocation outside the timeline. These cases explicitly
   report missing exposure rather than presenting zero new selections as success.
8. Export canonical JSONL events. The original bundle is replayed before export;
   keep it alongside the events because JSONL alone cannot reproduce the run.

Supplier A's evidence becomes revoked at logical tick 3. The baseline deliberately
keeps its initial snapshot; the other intervention checks current evidence.
The resulting difference follows declared fixture rules. It is not evidence of
real-world procurement effectiveness, human behavior or regulatory compliance.
The result table separates retained state from new permitted updates. If expiry
blocks an update, the earlier selection may remain displayed; it is not a new
decision. Comparison includes every tick, the update denominator and a named
assessment when revocation or decision exposure was absent. Counts are
record-tick updates, not unique people or accepted real executions.

## What was consolidated

| Component | Implementation | Boundary |
|---|---|---|
| Event queue | Actual MIT `Event`/`Tempo` code extracted from the pinned earth-scale notebook | No original-author code claim; no large population/model benchmark |
| Agent communication | Seven actual MIT SwarmChat library modules, unchanged | Explicit temporary Store; private in-process send/read adapter; no upstream HTTP server |
| Globe and learning | New small UI using the existing globe projection convention; timeline, sample inspector, trace and practice lesson | At most 120 illustrative records, not real people; not an academy enrollment or credential |
| Evidence | Existing `packages/evidence-fabric/event.py`, unchanged; replay-checked canonical JSONL export | `csoai.evidence-event/0.1`, unsigned, `UNMEASURED`, null value; no new case/decision store |
| Runtime probe | New opt-in Docker Engine API `GET /version` adapter | No Kiri source/binary copied; not connected by the app; real Kiri untested |
| Council OS integration | Portable candidate surface and existing public navigation links | No production dashboard tab, backend route, platform plugin or deployment added |

See [UPSTREAMS.json](UPSTREAMS.json) for hashes, exact commits and exclusions,
and [NOTICE](NOTICE) for attribution. GHOST code/assets, WVS survey data, model
weights, Cosign software and unverified research code are excluded.

## Evidence semantics

`REPLAY_MATCH` means that the complete unsigned bundle matches a deterministic
rerun using the exact local engine bytes. It is **not a verified signature**,
issuer authentication, an authenticated human decision, a witnessed external
effect, GSPC admission or certification. An unkeyed digest is not a signature.
Someone can produce another internally consistent synthetic scenario; replay
alone cannot establish who ran it or whether an asserted real event occurred.

The envelope `csoai.rehearsal-bundle/0.1` transports the existing canonical event.
Engine and vendor Python bytes plus the canonical event implementation are
fingerprinted. A changed implementation refuses old bundles; keep the exact
source archive for replay. Wall-clock timing and temporary chat identifiers
are deliberately outside the deterministic bundle.
If on-disk engine/dependency bytes change while the local host is running,
evidence creation and replay refuse until it is restarted. Cached modules must
not claim a newer implementation merely because its files replaced the old ones.
Version 0.2.0 adds decision-exposure accounting. Version 0.1.0 bundles still
require the retained 0.1.0 source; they are not silently migrated or re-labelled.
Reopening a current bundle restores its own scenario settings in the form.

The logical `SimulationPermit` permits only `advance-simulation`, binds one
scenario, rejects expired/revoked/scope-mismatched/replayed ticks, and affects
only in-memory fixture state. It is not the estate's human authority gate.

Population is bounded to 1–10,000 records and 1–50 logical ticks. Active model
agents, model calls, learned surrogate updates and human participants are zero.
Lookup updates are counted separately. No billion-agent scale claim is made.

## CLI and tests

```sh
python3 packages/world-rehearsal/main.py run --population 1000 --intervention evidence-aware > bundle.json
python3 packages/world-rehearsal/main.py verify bundle.json
python3 packages/world-rehearsal/main.py run --intervention baseline > first.json
python3 packages/world-rehearsal/main.py compare first.json bundle.json
python3 packages/world-rehearsal/main.py events bundle.json > events.jsonl
python3 packages/evidence-fabric/event.py validate events.jsonl
python3 packages/world-rehearsal/scripts/check_upstreams.py
python3 -B -m unittest discover -s packages/world-rehearsal/tests -p 'test_*.py'
python3 packages/world-rehearsal/scripts/smoke_candidate.py
```

The final command validates canonical event structure and identity, not producer
authentication, human authority or original-bundle replay. Export is local; it
does not submit to Council OS, the SAFE reader, a working group or a public board.
The CLI accepts bounded regular files and refuses nonregular or oversized input.
The smoke command builds this checkout's own archive, extracts it, checks source
hashes, runs the Python tests and CLI journeys, and requires a byte-identical
rebuild. It is not a tool for executing unknown uploaded source archives.
Timing can also be selected with `--rounds`, `--revocation-tick` and
`--permit-expires-tick` on the `run` command.

Optional, explicit, read-only runtime metadata request on a separately installed
Docker Engine compatible runtime (does not launch a container):

```sh
python3 packages/world-rehearsal/main.py runtime-status --socket /absolute/path/to/engine.sock
```

UI qualification uses separate development dependencies, not app dependencies:

```sh
npm install --prefix /tmp/council-rehearsal-tests --ignore-scripts --no-audit --no-fund jsdom@26.1.0 @playwright/test@1.57.0
NODE_PATH=/tmp/council-rehearsal-tests/node_modules node packages/world-rehearsal/tests/journey.cjs
NODE_PATH=/tmp/council-rehearsal-tests/node_modules node packages/world-rehearsal/tests/browser.cjs
```

Install Playwright Chromium for the last command if needed, or supply an installed
Chromium with `REHEARSAL_CHROMIUM_PATH`. The DOM journey uses real loopback HTTP
and exported bytes but stubs canvas and native downloading. It cannot validate
visual layout, native browser download behavior or accessibility conformance.
The separate browser test must pass in a browser-capable environment before UI
release. The runtime probe test is a protocol fixture, not a real Kiri test.

## Production integration still required

Version 0.2.0 validation on 8 November 2026: 34 Python tests, the 17-step
DOM/HTTP journey and 17 native Chromium checks pass. CI also qualifies fresh
archive extraction, the canonical consumer and a byte-identical rebuild.
[CI receipt](https://github.com/CSOAI-ORG/councilof-ai/actions/runs/42446519042).
See `QUALIFICATION.json` for exact scope and tested source.
This does not establish visual design perfection or accessibility conformance.
See [INTEGRATION.md](INTEGRATION.md) for the scoped connection and readiness map.

Use the existing Council OS route/pane and evidence handoff, not a second portal
or parallel authority store. Serve the surface and its API under one controlled
origin; the loopback server's CSP intentionally prevents cross-origin embedding.
Before public embedding, implement production authentication, request limits,
persistence/retention and the existing authority/effect profile. Preserve the
distinction between synthetic observations and independently accepted evidence.

The next proof remains one authenticated human approving one exact harmless
action, with executor scope/expiry/revocation checks, an independent observer
and a reproducible receipt. This fixture does not claim that proof. Live models,
learned-surrogate validation, academy workflows, daily index automation and
platform adapters need their own tested integration; links and scripted roles
do not establish that they are connected.

To create the dependency-complete source archive, use:

```sh
python3 packages/world-rehearsal/scripts/package_candidate.py --output /tmp/council-rehearsal-candidate.zip
```
