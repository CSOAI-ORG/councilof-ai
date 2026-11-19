# Published-study reader acceptance

11 November 2026. This is a qualification route for the research published in PR
#4187, not a new cache policy, model result or production-readiness declaration.
The historical implementation, experiment runner and timing records are unchanged.

## One checked journey

From `harness/measured-reuse-refresh-20261110/`, using Python 3.13 and only its
standard library:

```sh
python verify_publication.py
python verify_publication.py --replay /absolute/path/to/new-reader-results
```

The first command verifies ten pinned inputs and reconciles the 36 historical CSV
rows with all twelve published timing totals and both disclosed speed ratios.
The second command additionally copies the verified sources into a new output
directory, constructs the exact candidate, executes the 49-test suite and replays
the 1,440 batches. It checks all 192 generated fixture files, recomputes their
integer-sum oracles and compares every batch with the expected output digest.
It checks all arms and phases, setup-cost inclusion, authorization-check counts,
computation counts and cache-hit counts. Missing or skipped unit tests are failures.

The output must be a new directory outside this source tree. Existing paths are
refused, including historical results. The receipt is `acceptance.json`; logs,
input bytes and full fresh batch results are retained beside it. No network,
provider credentials, installation or model download is used by the scripts.
The script is a local test driver, not a sandbox for arbitrary untrusted code.

## Checks on the checker

```sh
python -m unittest test_publication -v
```

Twenty-one test methods cover the unchanged publication and negative cases:
changed source bytes; wrong study or source pins; altered totals or ratios;
duplicate/missing histories; negative timings; incorrect denominators; fabricated
training/admission/energy fields; empty or skipped unit suites; missing results;
incomplete replay summary; path traversal; and output-directory reuse.
These are checker controls, not 21 new measurements of model capability.

## What the November 11 readback established

The pinned public document, its relative README link, the CSV, the summary and
merged PR were readable in a signed-out browser. A separately retained source
copy matched the published Git blob identities. The browser's generated prose
miscounted CSV rows; exact CSV parsing established 36 unique data rows. This is
why content validation uses bytes and records rather than a browser narrative.

The fresh local run passed all 49 original candidate tests without skips and all
576 original history assertions over 1,440 batches. The new checker independently
reconciled the outputs against 192 fixture files. Timing on a new host is a new
observation: historical timing values are not overwritten or required to repeat.

The retained owner's raw summary and the published derived summary use different
schemas. Their totals agree; a format difference is not a damaged-file finding.
`publication-pins.json` pins the *published derived* summary, not the raw one.

## Publication pipeline

The proposed `measured-reuse-publication` GitHub Actions workflow runs these
checks on relevant pull requests, relevant master pushes and merge-group events,
with a manual trigger available. It has read-only repository permissions, a
five-minute job limit, no secrets and no deployment step. It uploads the fresh
receipt and logs as a CI artifact. It does not change branch-protection rules or
make itself a required check. Existing protected release ownership remains intact.
A proposed workflow is not an active master workflow until merged; report the
actual run and merge status rather than inferring it from this file.

## Interpretation and remaining gates

Matching hashes establishes consistency with a reviewed snapshot, not authenticity
against a malicious publisher. This checker cannot establish true model answers,
independent organizational acceptance, actual user identity, GPU block isolation,
energy savings or performance on customer work. It does not validate every page,
private UI, model, axis, human decision or external effect in the wider system.

The research decision remains selective reuse as the comparator default, with
forced refresh only where separately justified. The next receiving gate remains
one representative read-only task using the existing authenticated authorizer and
source resolver, followed by actual matched-quality serving qualification. Preserve
cold starts, source churn, refusals and setup/maintenance costs in that evaluation.

References: [Python unittest](https://docs.python.org/3.13/library/unittest.html)
and [GitHub status checks](https://docs.github.com/en/pull-requests/reference/status-checks).
A successful CI status can reflect a skipped or narrow job, so the new route
checks actual discovery counts and outputs rather than treating a green icon as
proof of unexecuted work.
