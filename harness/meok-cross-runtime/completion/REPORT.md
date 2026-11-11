# MEOK cross-runtime completion: public route and stronger acceptance

11 November 2026. Bounded research release; original model and data unchanged.

## What is now complete

The previously failing public Cloudflare Preview now serves the exact original process predictor. Both the M4 and Kaggle version 3 each completed 560 transition comparisons through 78 direct public HTTP requests. Each client verified 6,720 scalar outputs across raw neural, constrained neural and exact-rule outputs, with six invalid-request refusals and recovery. Maximum observed numerical difference was 5.551115123125783e-16, below the predeclared 1e-12 tolerance. This is actual public application execution, not merely deployment metadata or a localhost remote-development proxy.

The Kaggle notebook completed, its results were downloaded, and its published code/markdown cells were pulled back and matched. No private credentials are embedded in the notebook. Earlier versions and failures remain historical evidence.

## Routing recovery, without exposing a production model endpoint

The same public Preview and Version URLs returned Cloudflare 404/error 1042 before the operation. An ordinary version upload alone did not repair it. Applying a minimal deny-all base deployment to only the isolated `csoai-process-replay` Worker restored the Preview routes. That base has no model, data or bindings and always returns 503 if called. Its normal production hostname remains disabled; direct checks returned 404 after the recovery. No councilof.ai/csoai-site deployment, domain route, private binding or account security control was changed.

This creates one base deployment record for the research Worker. It would be inaccurate to continue saying there were no deployment records at all. The existing original Preview model version remains unchanged. The operation is an observed account-specific recovery, not a proven general explanation of Cloudflare's platform behaviour. Official docs require applying preview-host configuration; an upstream issue reports a similar symptom but its automated triage did not reproduce it elsewhere.

The endpoint remains a dated research Preview. Predictions expire at **12 November 2026, 00:00 UTC**. After that, the intended result is HTTP410 with `PREVIEW_EXPIRED`. It is not a promise of perpetual service.

## A real false-pass gap was repaired

The previous response checker verified declared counts and the values it happened to receive, but did not require the outputs list to contain the declared number of rows. A local simulated responder could return the right request/model pins and a matching response hash, claim all rows, supply an empty outputs list, and cause the exact old client to report `CROSS_RUNTIME_PARITY_PASSED` with zero compared rows.

The simulation made no provider requests and is explicitly labelled. It does not negate historical successful runs, whose retained reports explicitly show 560 compared rows. It does show that the old validator could be fooled by a different response.

The new contract requires exact top-level fields, integer row counts, exact output cardinality, vector shapes, finite numerical values, expected model/input/expiry bindings, correct synthetic-rule values and literal false research/authority flags. Duplicate JSON keys, non-finite constants, wrong limits, partial output and even correctly rehashed empty output are refused. **Forty negative-response cases pass**, alongside the original **25 Worker-handler checks** and the complete numerical bank.

## Keep the checks real on future changes

`qualification_runner.py` copies only source and fixtures into a fresh temporary directory. It does not copy old PASS files. It runs the actual Node/Python tests and requires newly generated result files with the expected counts. A deliberately no-op test runner is refused. A scoped GitHub Actions workflow uses read-only repository permissions and pinned actions; its model tests need no provider account, secrets, package installation or live network request. The workflow's actual remote result is reported separately, not inferred from creating its YAML.

## Completion versus production readiness

The research route, client contract and external replay are evidenced. A permanent service still needs a deliberately approved lifetime, ownership, cost/abuse limits, availability objective and rollback. Authenticated private-memory/source control, named human review and approval-to-effect are distinct owner gates. They are not established by model hashes or passing numerical comparisons.

A useful next model change must start from a real task and an evaluation bank that has not been used for development. The current public synthetic model retains mean absolute error 0.0028797331109599016 and worst component error 0.7499076603275624. This pass does not improve those figures, train a new model, establish real-world generalisation or admit a GSPC score.

## Reproduce and inspect

- Full public replay: `python replay.py --label your-replay --out results --edge-url https://0e29bc3e-csoai-process-replay.nicholastempleman.workers.dev` before the fixed expiry.
- Offline contract gate: `python qualification_runner.py`.
- Executed notebook: https://www.kaggle.com/code/nicktempleman/meok-cross-runtime-replay (version 3).
- Exact current outcome: RESULT.json. Remaining owner gates: READINESS.json.
- Prior rejection reproduction: legacy-false-pass-proof.json. No real-server fault is invented.
- Primary platform references: https://developers.cloudflare.com/workers/previews/custom-domains/ and https://developers.cloudflare.com/workers/versions-and-deployments/version-urls/ . Upstream report: https://github.com/cloudflare/developer-platform/issues/81 .

No sensitive learner data, production authority, paid GPU upgrade, arbitrary model downloads or protected-master merge occurs here. Hashes establish the checked bytes, not independent human approval or truth.

## Final acceptance readback

The new GitHub Actions contract job actually ran and passed at source 122476aba28fe086b39e2ffea65baf9be3a753b5 (run 42972692338, job 130364603860). Its log contains the 25 handler checks,40 negative-response cases,560-row reference replay, prior false-pass reproduction and no-op-runner refusal. This is not merely a workflow file or a retained local PASS.

Post-publication checks matched 34 changed pinned-repository files and eight selected served artifacts, including the notebook and source archive. A separate anonymous browser opened the current report, structured records, completed Kaggle notebook and live health JSON; download initiation is not claimed as browser-byte verification. The separate HTTP readback did verify the archive bytes.

The archive is an immutable source snapshot prepared before this final CI/readback supplement. Its source code is exactly the code the contract job tested; dated pending fields inside that snapshot are superseded by CI-ACCEPTANCE.json and POST-PUBLICATION.json, not silently overwritten. Model values, reference data and all historical failure reports remain unchanged.
