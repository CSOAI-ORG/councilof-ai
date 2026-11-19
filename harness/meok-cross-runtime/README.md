# MEOK cross-runtime model replay

A bounded portability experiment, reusing the existing published 980-parameter synthetic process predictor unchanged. This is not a new foundation model, training run, independent capability benchmark, certification or source of execution authority.

## What is being tested

The same retained 560-row/70-episode test bank is evaluated with the original dependency-free Python predictor and original JavaScript core. A small Worker wrapper accepts at most eight feature rows/8192 bytes, checks the exact model pin, verifies the bundled original model bytes and returns predictions with request/response byte hashes. It has no AI, R2, D1, KV, queue, database, secret or external-fetch bindings. No customer source or personal input is needed.

The Cloudflare path is a separately named, non-production research Preview only. No councilof.ai or csoai-site Pages deployment, production alias, route, account plan or credit setting is changed. The handler refuses prediction after 2026-11-12T00:00:00Z; the health record makes expiry visible. That bounds this experiment rather than pretending to supply an always-on service. It is ordinary Worker CPU inference for this tiny model, not Workers AI GPU execution or support for arbitrary Cosmos weights.

All vendored numerical files retain exact upstream bytes and notices. `source-lock.json` identifies the already-public HF source revision and every input hash. `weights-text.mjs` is an exact-string embedding for the Worker bundle; startup checks the original JSON bytes against the model hash. No new HTTP call is made by the Worker.

## Checks

`node test-worker.mjs` exercises the actual handler across all 560 retained rows in 70 eight-row batches, verifies request/response byte hashes and includes 25 named contract checks. Refusals cover malformed JSON, booleans, strings, nonfinite/out-of-range features, wrong pins, wrong media/method, compressed input, empty/oversize batches, oversize streams and expiry. Successful recovery is checked. This local handler test is not Cloudflare-hosted execution.

`python replay.py --label M4 --out results` executes the original Python predictor and records every output. Add `--edge-url https://EXACT-PREVIEW.workers.dev` only for the explicitly qualified preview. The runner permits at most 82 requests and 240 seconds, follows no redirects and sends only the public synthetic rows. It checks raw body digests, request binding, numerical differences within a predeclared 1e-12 tolerance, six refusals and successful recovery. No Kaggle/HF/Cloudflare account credentials appear in the notebook or requests.

## Interpretation

Matching outputs across providers establishes portability only for this model and these cases. It does not repair the model's approximately 0.75 worst constrained component error. Known generator rules remain separate and are not called learned intelligence. This published bank is not a fresh holdout; no training or candidate selection occurs. Timing is sequential request wall time including transfer/verification, not a production latency guarantee or accelerator benchmark. SHA256 binds bytes, not truth or an independently authenticated actor.

## Intended platform roles

Hugging Face retains immutable model/data and this generated research mirror. Kaggle runs the reproducible CPU notebook. Cloudflare can supply bounded application/routing/verification and supported inference services; this specific experiment tests CPU Worker execution only. Full serving, data retention and professional/human review remain under the existing owners. The existing Academy notebook and private HF runtime are not replaced.

Source first in this canonical monorepo, mirrors after publication. No claim is made that nobody else has built cross-runtime inference; the missing item under test is an evidenced connection within this estate.

## Executed results

See REPORT.md and evidence/summary.json. Kaggle version2 completed and every retained prediction was checked. The live HF small-model route matched15 selected rows. The Cloudflare remote-development session matched560rows and passed six refusal controls; the separately created public Preview URLs still returned1042 and are not a qualified public service. The temporary remote session was stopped. Existing Academy, six-variant replay and static Cloudflare mirror are distinct preserved workstreams.
