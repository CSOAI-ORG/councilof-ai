# Council of AI decision rehearsal candidate

A working local integration of a synthetic globe, deterministic scenario queue,
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

Supplier A's evidence becomes revoked at logical tick 3. The baseline deliberately
keeps its initial snapshot; the other intervention checks current evidence.
The resulting difference follows declared fixture rules. It is not evidence of
real-world procurement effectiveness, human behavior or regulatory compliance.

## What was consolidated

| Component | Implementation | Boundary |
|---|---|---|
| Event queue | Actual MIT `Event`/`Tempo` code extracted from the pinned earth-scale notebook | No original-author code claim; no large population/model benchmark |
| Agent communication | Seven actual MIT SwarmChat library modules, unchanged | Explicit temporary Store; private in-process send/read adapter; no upstream HTTP server |
| Globe and learning | New small UI using the existing globe projection convention; timeline, sample inspector, trace and practice lesson | At most 120 illustrative records, not real people; not an academy enrollment or credential |
| Evidence | Existing `packages/evidence-fabric/event.py`, unchanged | `csoai.evidence-event/0.1`, unsigned, `UNMEASURED`, null value; no new case/decision store |
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
python3 packages/world-rehearsal/main.py measure --population 1000 --seeds 42 43 44 --rounds 10 > measurement.json
python3 packages/world-rehearsal/main.py verify-measurement measurement.json
python3 packages/world-rehearsal/scripts/check_upstreams.py
python3 -B -m unittest discover -s packages/world-rehearsal/tests -p 'test_*.py'
```

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

The v0.1 predecessor passed 23 Python tests, 11 DOM/HTTP journeys and 10 native
Chromium checks ([historical CI receipt](https://github.com/CSOAI-ORG/councilof-ai/actions/runs/42444509465)).
For this v0.2 candidate, 36 Python tests passed locally. The paired-control UI
was exercised in a native browser; the automated browser journey now includes
measurement downloads, reopening and forged participation rejection. See the
current PR checks for qualification of the exact release head. Historical CI
does not qualify changed bytes. No accessibility conformance is claimed.

## Paired deterministic measurement

Section 5 runs both interventions on identical seeds and populations for four
declared cases: evidence revoked during a run, unchanged evidence, an expired
permit and evidence revoked at the start. Default inputs yield 12 paired cases,
24 episodes and 24,000 synthetic record instances, not 24,000 distinct people.
Actual model calls, response replays and consenting human participants are
separate counters and remain zero. Work is capped at 2,000,000 record-ticks.

The measurement distinguishes completed decisions, blocked decision slots and
retained selections. A retained selection after execution stops is not counted
as a new decision. An episode with no decisions has a null error-rate estimate;
abstaining everywhere cannot pass the equal-completion control. Passing controls
and observing a difference are separate results. The declared fixture deliberately
favors checking revocation; it establishes neither a novel capability nor a
prediction about a population. Seeds are not independent human samples.

The unsigned `csoai.rehearsal-measurement/0.1` wrapper carries the existing
canonical event, with `UNMEASURED` state and null board value. Reopening reruns
the complete suite against the pinned implementation and compares all fields.
Changing a count, score, limit or engine pin invalidates the report even if its
outer digest is recomputed. Changing engine Python bytes changes the fingerprint:
preserve the v0.1 archive for v0.1 bundles and the v0.2 archive for v0.2 reports.

## Bounded improvement research sequence

1. **Plumbing (implemented):** deterministic controls, preserved input/source
   pins, bounded work, explicit participation counters, exact replay and refusal
   to infer improvement from inactivity.
2. **Selected models (not implemented):** an opt-in adapter for one pinned model
   revision, with prompt/tool versions, token/time/cost ceilings, recorded call
   failures, request/response digests and separate live-call/replay counters.
   Freeze a baseline before testing. Separate model failure, policy refusal and
   useful completion. Keep held-out scenarios inaccessible to the proposing agent.
3. **Consenting humans (not implemented):** the existing identity/consent and
   authority/effect contracts, accessible explanations, withdrawal and a qualified
   reviewer. Training XP does not grant execution authority or certify competence.
   Count distinct consented participants separately from sessions and reviews.
4. **Candidate evolution (not implemented):** a proposer may produce a bounded
   patch in an isolated workspace. A separate evaluator checks regression, safety,
   completion and resource budgets. An authenticated authorized human approves an
   exact revision; the executor rechecks scope, expiry and revocation. Preserve
   rollback and independently observe the harmless effect. Never let the proposer
   rewrite its tests or approve its own promotion.
5. **Weight-space experiments (research only):** preserve original weights and
   license, hash each changed checkpoint, and evaluate each version independently
   on held-out and unrelated regression tasks. The referenced
   [weight-space programming article](https://rikiyat.github.io/blog/weight-space-programming/)
   reports limited experiments; it does not establish general automatic improvement
   of this system. No weights were downloaded or edited by this candidate.

For UK/EU/US-facing deployment, the engineering priorities are local processing,
data minimization, clear source rights, revocable authority, accessible controls,
audit exports and transparent corrections. Legal applicability depends on the
actual service and jurisdiction; a simulation pass is not a compliance finding.
Retrieval from permitted live reports and human-approved lessons should precede
any model fine-tuning. Synthetic reports cannot substitute for evidence of transfer.

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

