# EAT: consume the existing Memory Venturi correction

12 November 2026. Source integration, composed qualification and actual HF research readback.

## Delivered result

The prior r49 lane had reproduced and qualified a targeted-invalidation repair but left it in the Linux evidence directory. This pass consumed that exact cache-source candidate, integrated it into the existing Council PR4176 and the existing private HF research application, and checked the deployed tool. No second cache, model server or permanent user store was created.

The M4 was offline. The authorised Linux worker replayed the existing qualification; M2 handled the exact-source adoption and publication; Hugging Face ran a bounded CPU qualification and the real existing MCP tool. Neither M4 files nor unrelated source worktrees were changed.

## The defect, in ordinary terms

A result could finish after its dependency had been explicitly invalidated. The old cache removed stored results but did not retain a per-source invalidation generation when computation was still in flight. Likewise, a previously loaded cache result could survive an invalidation during its validation callback. The old 34-test source suite passed despite those two deterministic cases.

The consumed correction records per-tenant/source impact generations even when no result row exists. A request binds those generations and checks them again before reuse or retention. Matching invalidation refuses the outdated result. Unrelated sources and tenants keep their reuse behaviour, and a new post-invalidation request can compute a fresh result.

## Evidence, without adding incomparable counts

- Fresh cache/adoption suite: 53 methods, including all34 original source tests,12 targeted regressions and7 installed-tool checks. The exact original cache fails the intended in-flight-result assertion; the consumed candidate passes.
- Full HF base application: 340 methods passed. The exact composed candidate: 359 passed. The separately retained specialist suite:87 passed. These are regression methods, not independent capability measurements.
- Live account-authenticated MCP: four successful memory calls, two invalid-input refusals, successful recovery and preserved status tool. Each valid memory call executed five explicit invalidation controls and the original small-neural replay. Total observed:20 targeted control outcomes,32 existing small-network evaluations and16 exact replay hits. Four existing event output hashes/schema checks passed; events remain unsigned.
- Seven deployed file payloads read back exactly;100 other source-manifest entries preserved. Existing model, hardware, arithmetic/task contracts, conversation, learning, saved-copy and specialist functions remain.

The same Memory Venturi tab/API now includes a `targeted_invalidation` field with the actual installed cache-code digest and the observed controls. It still deletes its temporary SQLite directory after each research call. The success is adoption of an exercised correction, not production authority or permanent personal memory.

## A separate completion gate was also checked

The previous Cloudflare research preview had a fixed12November00:00UTC deadline. A live readback after that deadline returned `EXPIRED_RESEARCH_PREVIEW` for health and HTTP410/`PREVIEW_EXPIRED` for prediction. The exact response hashes matched. The deadline was not extended and no production route was changed. Earlier successful Kaggle/Cloudflare records remain dated history, not a promise that the expired preview is an ongoing service.

## Limits and next dependent work

The patch addresses the tested ordering before its final generation recheck. It does not make source authority, response delivery and database operations one distributed atomic transaction. SQLite isolation between connections is not a proof of a whole multi-service approval/revocation protocol: see https://www.sqlite.org/isolation.html and https://www.sqlite.org/lang_transaction.html .

The generation table can grow with distinct tenant/source pairs. In this deployed tool it belongs to a temporary database removed at the end of the call. A durable production lifecycle/retention policy is still required. No existing user database was migrated.

Real-user access/source callbacks remain a separate host integration. The representative four-way whole-job comparison (full direct, source-filtered direct, conventional cache and Memory Venturi) remains unrun here. Regression suite duration is not a latency benefit; no new prediction-quality, model-learning or GSPC score is asserted. The original small predictor remains limited to its declared synthetic process.

## Reproduce the source repair

Unpack the source archive and run `python -B qualify_adoption.py`. It creates a fresh temporary directory, uses standard-library source/tests, requires53 executed methods and reproduces the intended failure on the pinned original cache. It uses no account, model-provider call or downloaded dependency. Full composed HF tests require the authorised existing source snapshot and its pinned CPU/UI dependency set; those are recorded separately in HF-QUALIFICATION.json.

## Source and custody

Canonical lane: https://github.com/CSOAI-ORG/councilof-ai/pull/4176 .
The immutable candidate source is recorded in RESULT.json and SOURCE.json. The existing source build/history records remain intact; a new MEMORY_INVALIDATION_RELEASE.json identifies this overlay instead of falsely rewriting an older full build's provenance. The public evidence is a generated mirror, not a second source owner.
