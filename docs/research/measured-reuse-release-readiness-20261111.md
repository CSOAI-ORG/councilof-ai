# Measured reuse: evidence consolidation and release boundaries

**As of:** 11 November 2026. **Scope:** research readback and a homepage copy correction. This is not a runtime release, model promotion, certification, new GSPC measurement or authorization to execute.

## What this publication changes

The homepage report band previously combined a hard-coded axis count with promises of complete daily coverage, a signed report each day and a report for today. The board and report archive are different sources with different dates and scopes. Changing the number alone would leave those other promises unqualified.

The band now says **Published measurement reports** and directs readers to inspect each report's date, scope, sources and evidence status. The existing report archive, board link, live board strip and subscription component are retained. The restored band also gets its own test selector, separate from HomeUpdates. No subscription request or delivery claim is introduced.

The source-copy regression suite is `scripts/surface/home-report-copy.node-test.mjs`. Run it with:

```sh
node --test scripts/surface/home-report-copy.node-test.mjs
```

It includes negative controls for both the old count and a superficial change to a different fixed count, as well as unsupported coverage, daily-signature and today claims. It is included in the existing `test:readers` file glob. These source checks do not replace a build, rendered-page review or browser acceptance.

## Canonical research and retained evidence

The already merged [measured-reuse consolidation, PR #4187](https://github.com/CSOAI-ORG/councilof-ai/pull/4187), remains the public research reference. Its refresh-retain experiment is not the same experiment as the later synthetic source-churn study. Results from distinct methods must not be pooled. [PR #4176](https://github.com/CSOAI-ORG/councilof-ai/pull/4176) is a separate model-research candidate; this change neither merges it nor adopts its model.

A fresh byte-integrity audit of the 17 locally retained r07-r23 evidence archives verified **538 declared entries with zero detected byte-length or SHA-256 mismatches**. The [qualification ledger](measured-reuse-qualification-ledger-20261111.json) records each archive digest and count. Nested archives are not recursively counted in that total. The complete private archives are not included in this publication. This is an index to retained evidence, not a training dataset or compressed model.

The audit establishes consistency with the archived manifests, not authenticated authorship, independent replication of all historical experiments, production safety or admission to the public board. These research artifacts are unsigned. The original frozen reference remains SHA-256 `08356e859a65597c6bec4e15c2384c3f0f366d77f61ab26ef3a576c3f8f8f91e`.

### Findings retained with their limits

The local synthetic CPU/SQLite sequence supports a conditional conclusion: expensive deterministic work can benefit from reuse, but request-body repetition is not sufficient. Authorized source revisions and actual reusable hits matter.

The retained r23 study repeated four request bodies across 16 calls under three source-revision schedules. Stable revisions gave 12 cache hits and 9 cache wins out of 9 paired trials. One change gave 8 hits and 6 wins out of 9. Three changes gave no hits and no wins out of 9. These are historical records, **not newly executed production or model-inference measurements**. They establish no universal reuse threshold.

The r24 documentary correction replaced three unexpanded source/runtime expressions in a separate readback. The original r23 report and archive remain unchanged. The runner digest is `c4edf5dbb59ec350289ab890032aeaf960e75cec7a103688961790b05d690ddb`; the recorded SQLite version was 3.46.1. The experiment used rollback/DELETE journaling, not concurrent WAL. No claim of concurrency or power-loss qualification is made.

Earlier negative findings remain: tiny-record caching was slower than direct reads; small-model quantization reduced payload size without demonstrating packed-kernel acceleration; a sequence negative control failed despite perfect AUROC; toy bounded memory reduced distance while increasing wrong-direction actions. Those results are not evidence of production readiness.

## Ordered qualification path

1. **Representative authorized workload.** The existing host and source owners must supply a rights-cleared workload, authenticated authorizer, exact dependency closure, revision chronology and replay eligibility. Candidate callbacks cannot grant themselves authority. Status: **NOT_RUN**.
2. **Whole-job comparison.** Freeze task, output-quality oracle, model/tokenizer/runtime pins and request trace before execution. Compare direct execution with reuse across initialization, cold and warm requests, owner checks, invalidation, worker restart and final close. Record safe hits, refusals, failures, tail latency and complete job time. Unique requests, source churn, stale revisions and revoked access are required negative controls. No performance threshold is inferred from synthetic tests alone.
3. **Actual low-bit serving at matched quality.** After runtime and workload qualification, pin real weights, tokenizer, quantization settings, backend, kernel, driver and hardware. Compare quality and complete-job latency/throughput with the unquantized baseline. Payload reduction is not a kernel-speedup result. Status: **NOT_RUN**.
4. **Owner-controlled release.** Keep the existing source owners, protected checks and single GitHub Actions production writer. No direct deployment, force-push, self-approval, score alteration, signing-key use or runtime promotion follows from this note.
5. **Exact-version acceptance.** After a successful protected deployment, check both the public apex and production alias against the released source; repeat readback to detect later replacement. Check the report destination and anonymous homepage-to-board-to-axis-to-verifier journeys. Test a real signed example, a single-field altered copy, clear/reset behavior, keyboard use and mobile layout. Retain exact inputs/results where permitted. A passing static worked example is not a live verification result. Mark any unperformed journey NOT_TESTED.

A pending check, inaccessible administrative setting or missing authorization is not a pass. Publication of this note is not proof that a production deployment succeeded. A release receipt must name the exact merged commit, deployment and observed readback separately.

## Preserved boundaries

This publication changes no measurements, signed records, board counts, model weights, private runtime, source permissions, orchestration, authority path, evidence projection or existing watches. It does not reproduce the full programme or claim complete research coverage. Monetary cost and energy are **UNKNOWN** where unmetered.
