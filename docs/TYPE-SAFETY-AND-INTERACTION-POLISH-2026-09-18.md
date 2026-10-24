# CSOAI — type safety and interaction polish

18 September 2026 · Private engineering checkpoint

## Verified outcome
The final complete API/client suite passed **2,573 test cases**, with zero failures or skipped tests. The exact source manifest was unchanged during that run. The whole API TypeScript check passes. The whole-client compiler now reports **134 diagnostics rather than 203**; it is improved, not clean. Its existing regression ceiling is reduced to134, with no weaker compiler options, suppressed errors, excluded files or invented router declarations.

## What was repaired
**Practice-quiz scoring.** Both old quiz implementations could count the last answer twice. They now use one validated question contract and one state machine. Duplicate submission/advance events cannot add points. Missing questions or answer keys produce an unavailable state rather than a learner failure or pass. A retry and a change of module identity clear prior answers. Exact score ratios determine passing; display percentages retain two decimals. The one-question correct case produces1/1 and100%, not200%.

The retained49module banks were tested for structural validity and preserved byte-for-byte. This did not validate their historical legal or factual content. The course routes previously placed under ContentReviewNotice remain there. These source repairs do not reopen training services, issue credentials or create real learner records. They are separate from GSPC model-measurement scoring.

**Shared disabled controls.** The active shared Button's asChild link branch used a native disabled attribute that a link does not implement. The revised control blocks pointer and Enter/Space activation, child and parent callbacks, and the disabled tab stop. Re-enabling restores normal handler/navigation behaviour. Native buttons retain real disabled semantics. This was exercised with the actual component in a synthetic browser harness.

**Regulator metadata.** The retained detail component now treats absent or malformed fine-tier metadata as not recorded or uncheckable. It does not infer that an organisation has no statutory fine or zero exposure. Fully populated source strings remain intact. This retired route was not reactivated.

**Verifier types and build contracts.** The quiz type alias now points at the same client type directory used by the actual bundler. Vite environment types and owned ArrayBuffer types match runtime behaviour. The detached signature verifier's transpiled JavaScript is identical before and after the type-only correction. Structured source-date handling remains covered by the packet tests.

## Test accounting
There are52new API/client test cases from quiz state/normalisation, quiz rendering, fine-tier handling and disabled-button semantics. Another24test cases result from restructuring one existing large corpus test into24batches plus a partition check. That is not24new measurements. Both independent verifier implementations still check every one of the2,377original mill-card files.

An intermediate source-bound suite timed out in the single five-second corpus case. Its receipt remains. The repair bounded each batch to100files, proved exact coverage without duplicate or omitted filenames, and kept the original timeout and validity assertions. The final suite passed.

Twelve synthetic browser checks passed, with zero external requests: disabled/enabled link and native controls, exact one-answer completion, retry, missing data, module reset, keyboard operation and375px layout. Ten existing final packaged-site checks also passed for the verifier, historical evidence, correction pages and unchanged root. These are automated engineering tests, not independent human accessibility acceptance.

## Complete private build and serving tree
The full renderer handled663records:640content snapshots,14deliberate client-only shells and9honest nonroute skips. Zero errors and zero thin pages were recorded. After the actual alias and launcher steps, the serving tree remains **19,916files**, leaving **84slots** beneath its configured20,000limit. Headroom is still narrow; this pass did not pretend that capacity risk was solved or raise the cap.

Thirteen packaging checks pass: brand, content promises, prices, machine-reference links, physical size, signed JSON, structured data, lazy asset graph, render-bound facts, root/proof integrity, serving boundary, OpenAPI consistency and prerender/filesystem agreement. The final private bundle still supports the existing packet inspector and exact historical URLs. No production deployment or remote binding write occurred.

## Integrity and recovery
Source manifest: `ba7dfe7829ce5b69f937830f275f4105d48e177c2fdd59cdf2f52190978871b5`.
Serving manifest: `45664d98ceef097a5732dcb09af55cb8fd46162f7aa62e0a25dd914a44f4630b`.
Unchanged signed-root file: `dedb49d05cf8a37a65a5eb19332881d804240ef741171edf153cbe053b1368e4`.

The final19,916files were individually checked on the second host. The retained candidate is `/workspace/csoai-review/gspc-v6-20260918/dist/prerendered-v11-type-closure`. Only owned redundant review copies were removed from the nearly-full Mac after digest verification. Canonical source files, production data and the existing observer scheduler were preserved. The temporary test server and its workerd child were stopped.

## Remaining boundary
The explicit main-site publication hold is unchanged. No push, merge, workflow dispatch, public release, email, signature issuance, wallet action or fresh model run was performed. There are still134client diagnostics and only84file slots of build headroom. Public release, independent user/inspector acceptance and a customer-accepted paid scope remain distinct completion requirements.

Canonical source: `/Users/nicholas/clawd/councilof-ai-work`.
Receipts on both hosts: existing operations `living-observatory/v11-type-closure`.
Programme readback: `~/.local/bin/csoai-control programme`.

The selected recovery package is not a full-estate backup or deployment authority.
