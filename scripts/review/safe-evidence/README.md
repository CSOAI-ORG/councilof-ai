# SAFE engineering evidence — research to reproduction to human review

4 November 2026. This is an extension to the existing Council evidence/Atlas work, not a second publication service, case database, grader, charter, authority gate or scheduler.

## Delivered scope

The retained five-company register is projected into 45 review tasks. A bounded capture reads 18 explicitly named public source records across SAFE, NVIDIA, Cisco, Red Hat/asago, CrowdStrike, Palantir and existing Council work. Each observation retains retrieval time, source update time, exact response hash and substantive revision identity. Missing reads are visibility gaps, never zero activity. Issue-body hashes prevent changed requirements being missed when a title stays the same. Adding a previously unobserved field is reported as observation-coverage change, not claimed as an upstream change.

The first source capture and prior report remain retained. A subsequent actual capture produces five substantive source-record changes; added sources and expanded body-hash coverage remain separate. Neither source merge nor closure of an upstream issue establishes deployment, a working integration, user acceptance or a new measurement.

The human review view provides area/priority/text filters, source provenance, bounded acceptance criteria, an exact-byte report download and an unsent note tied to a report and opportunity. Notes are not authenticated decisions. No form sends to a company, Alliance, regulator or reviewer. No model, private tenant, payer, credential, customer transcript or signed human action is part of the report.

## MiDojo #190: an actual bounded engineering result

The reproduction compiles the exact pinned collector methods and the actual orchestrator `run_task` from MiDojo commit `10426b489746ca588174e0a98f5e9952aacb99fa`. Dependencies, clocks, transports and sandbox observations are controlled fixtures. Socket connections are blocked. The original code passes 5 of 12 stated properties; the conservative collection-stop candidate passes all 12. Reintroducing swallowed log errors is detected by the actual orchestration-path test. An unchanged rerun produces the identical result object.

In the original control-flow fixture, a failed collector proceeds through record → complete → grade. The candidate instead performs teardown → session revoke → collection error, without complete/grade. Successful empty evidence, actual deletion and ordinary grading remain distinguished and tested.

**This is not a completed implementation of #190.** The candidate conservatively stops the entire evaluation. The upstream proposal's per-check three-valued results, unaffected-grade preservation and denominator semantics still need maintainer design and full-package/native-runtime tests. No real OpenShell gateway, paid model or vendor production environment was invoked. The candidate is offered for discussion, not represented as an upstream-merged fix.

## Reproduce

Python 3.12 or later is required for the pinned MiDojo syntax. The report builder itself supports Python 3.10 or later. Use a trusted checkout of this review code.

```sh
cd scripts/review/safe-evidence
python3 -B -m unittest test_evidence_review.py -v
python3 -B negative_controls.py
python3 -B reproduce_midojo.py \
  --source fixtures/midojo \
  --out evidence/reproduced-midojo
python3 -B evidence_review.py verify \
  ../../../docs/standards/osaia-safe-reverification/engineering-review/2026-11-04/pack
```

The original two MiDojo source files and Apache-2.0 license are retained under `fixtures/midojo`, with source URLs/hashes in `SOURCE.md`. They are fixtures, not an installed runtime. No package dependencies or remote code are fetched by the reproduction. Existing output directories are refused to preserve historical bytes.

`capture_sources.py OUTPUT.json` is an explicit, bounded online capture using an already-authorised `gh` client. It reads public GitHub metadata only and never writes to GitHub, fetches linked content, installs dependencies or invokes a model. It is not run by the offline tests and is not a new unattended job.

To derive another pack from a genuine captured observation:

```sh
python3 -B evidence_review.py build \
  --captures /path/to/current-capture.json \
  --plan plan.json \
  --as-of 2026-11-04T14:00:00Z \
  --previous /path/to/actual-prior-report.json \
  --reproduction fixtures/midojo-reproduction.json \
  --out /path/to/new-pack
```

Use the actual reporting time; the example timestamp is not permission to relabel old source observations as fresh. The output contains `report.json`, `findings.json`, `report.md`, `review.html` and `index.json`. The verifier checks exact bytes and consistent projections. It does not authenticate the producer or certify the report's claims. Retain the verifier/renderer revision for replay; earlier view-generation defects are not silently rewritten.

The optional browser test accepts `REVIEW_PACK` and `PLAYWRIGHT_MODULE`; `CHROME_EXECUTABLE` can select an already-installed browser. It serves only the pack's five allowlisted files on loopback, records no external traffic and closes its server even if browser launch fails. No browser package is installed by the test.

## Acceptance and corrections

- 37 reporter tests pass, including actual-prior comparison, tampered-history rejection, missing/zero distinctions, source-merge boundaries, changed issue-body detection, observation-coverage accounting and strict reproduction counts.
- Two deliberately damaged reporter copies fail by assertion: ignoring changed history and equating a source merge with deployment.
- Ten actual Chrome journey checks pass: 45-row view, evidence scope, filters, empty result/reset, keyboard selection, empty-note refusal, exact-report note binding, byte-identical report download, 360 px layout and zero external requests/writes/script exceptions.
- Twelve pinned collector/orchestrator checks pass on the candidate and five on the original; this is one scoped fixture suite, not twelve independent vendor deployments.

Retained failed attempts include a browser launch timeout, a generated-script escaping defect and mobile overflow. The final generator fixes the latter two; the successful browser run does not erase the earlier failure record. A separate cross-device transfer was blocked and was not retried through an alternate route.

The originating research register was read as parsed material. Its original workbook bytes were not independently hashed in this lane; no workbook hash is asserted. Each generated plan/report is hashed independently and is a concise projection, not a new normative specification.

## Alignment with other owners

PR #3918 is the existing Atlas/public daily archive integration and retains its own production workflow and source/regulation owners. PR #3902 owns the evidence/learning product. PR #3905 owns native companion integration and signed-in-host acceptance. Those are not reimplemented or marked closed by this review. The native-panel, genuine-human approval-to-effect, tenant permissions, source rights, private integrations and customer acceptance gates remain separate.

This review is a finite engineering handoff. Daily Atlas and the evidence digest can read the pinned public summary within their existing budgets; they must not execute these scripts or publish these results unless separately authorised for that exact operation. No existing task, host scheduler or public publication cron is replaced by this code.

## Reusable value, not invented valuation

Count source-bound corrections, maintained test cases, outside reproductions and actual recipient acceptance when those events occur. Re-reading the same issue, copying a report or generating a digest is not fresh measurement, a new customer, exclusive IP ownership, accreditation or a monetary asset uplift. License/assignment, privacy, training rights and valuation remain distinct questions.
