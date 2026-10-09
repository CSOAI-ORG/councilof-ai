# GSPC one-product job contract — 30 September 2026

GSPC is the product and measurement authority. Council OS is its human and agent workspace. Plugin X is a distributable GSPC endpoint. Layer O routes inside GSPC; Harness X supplies bounded tests; specialist hives, claim maintenance, corrections and RAS delivery are internal capabilities. None is a separate board, signer, cashier or authority.

This change adds `ras_hive_os.gspc_job`: one validated request creates one unique `gspcjob:` identity and a stable `gspcreq:` scope key. A bounded free-source read can attach an exact-byte SHA-256 and observation ID. Local projections for Council OS, Plugin X, API, MCP, SDK, A2A, A2UI, AG-UI and AX carry the **same job ID and evidence state**. The projections are a shared contract, not deployed protocol adapters.

The 30 September public smoke read is in [`../build/gspc-public-job-readback-20260930.json`](../build/gspc-public-job-readback-20260930.json). It read `https://councilof.ai/api/gspc` at `2026-09-30T09:39:57.404038Z`, 120,911 bytes, SHA-256 `2789c1b072a2aec041016e6922beb95dfd90fdffe04c21929279b5113f28b7c7`. That is a source observation, **not** a new measurement, card, signature, anchor or subscriber event. The served API itself states that the Zenodo methodology DOI is currently unavailable and points to a live alternative that is not byte-identical to the deposit.

Current operational boundaries:

| Capability | State shown by this change |
| --- | --- |
| Public GSPC board read | Exact bytes observed once; digest recorded |
| Same local job across nine channel projections | Tested |
| Existing GSPC MCP/API/A2A transports | Public `board_totals` MCP `tools/call` returned HTTP 200 and `isError:false` at `2026-09-30T09:43:21Z`, reporting 23 measured axes and 0 of 14 model-comparison axes with a separated leader. This new job ID is **not** wired into the live handlers yet; A2A was not exercised here. |
| Council OS interactive runtime | Public dashboard says **NOT LIVE**; no account PDCA cycle recorded |
| RAS subscription/sharing | `NOT_BOUND`. The public revenue API on 30 September still reports one non-self payer, one non-zero settlement and 20,000 USDC atomic units (0.02 USDC), with no repeat-payer evidence. Use the existing per-artefact x402 rails for bounded work; do not invent a tier or new SKU before the repeat-payer gate. |
| Five Alliance member seams | Documented public interfaces only; no tenant integration, acceptance or endorsement |
| SAFE RFC submission | Separate community action; local code is not an RFC contribution receipt |

Next acceptance slice: wire one *existing* Council OS action and one *existing* MCP `tools/call` to this job ID, store the resulting record, and replay it through the API. Then add A2A and agent-UI renderers against that same stored record. Prove a controlled negative and acceptable case through one owned runtime, admit it only through GSPC's existing evidence gate, and independently verify any signed/anchored receipt. Bind claim-maintenance dependencies only after the exact subject and rights are known. RAS payment remains a separate, bounded work event and cannot change a GSPC verdict.

For the 7 October SAFE work, the five vendor profiles remain honest test plans. A synthetic controlled pair can demonstrate our method; a real partner integration requires a scoped authorized tenant or runtime and observed inputs/outputs. Publish only reviewed non-confidential evidence through the normal release gate, then record the actual public readback and RFC submission/acknowledgement separately.

## Evidence-bounded capability routing slice

`ras_hive_os.measured_route` adds a local **route planner**, not a live router. For the same GSPC job ID it compares only declared estimated cost and latency among options that pass explicit operation, data locality, read-only effect, budget, freshness, sample-size, quality-lower-bound and control-evidence gates. It abstains when none qualifies. A Jev or other fast classifier may propose an option, but its proposal has no authority over the gates. A route failure opens a correction and remeasurement hold; it does not execute a fallback or repair a customer system.

The 25 September `typesafe/jev-router` listing describes a hosted model-routing API. We have not established that service's source code or licence. Community routers are different projects and cannot be treated as its implementation. Their mixed reports also do not establish savings for our tasks. The local GSPC planner is original code; it does not call Jev or copy those projects.

**Critical boundary:** this planner accepts admission records as input and does not verify signatures itself. A string saying `verification: VALID` is forgeable if supplied by an untrusted caller. It must be connected only to GSPC's trusted admission/verifier store before any route can be relied on. The current public GSPC board does not provide task-specific comparative admissions for this router, so a production job should currently abstain. The code is not a signed receipt, a deployed MCP/A2A transport, a compliance judgement, or evidence that a selected option is actually cheapest after billing.

The next measurable gate is one existing read-only operation with two real candidates, frozen task data, a fixed-route baseline, a random-route control, actual cost/latency readback, negative and acceptable controls, and independently checked admission. Only then can the selector be shadow-tested against the baseline and considered for bounded live execution. The five Alliance vendor seams remain documented interfaces until each has an authorized runtime and an observed round trip. A future RAS subscription can purchase ongoing work and claim maintenance, but it cannot buy a better GSPC verdict.
