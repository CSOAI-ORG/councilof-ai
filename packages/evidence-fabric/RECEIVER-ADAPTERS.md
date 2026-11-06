# Offline adapters for Turing TEA, Langfuse and Moonshot

Status: **implemented local format projections; external acceptance not established**. TEA here means the Alan Turing Institute's **Trustworthy and Ethical Assurance Platform**. It does not mean the unrelated Transparency Exchange API. No upload, model call, account operation, receiver import or measurement admission is performed.

## Implemented boundaries

| System | Executable adapter | Scope and limits |
|---|---|---|
| Turing TEA | Reads a retained public Discover JSON response; pins its complete delivered bytes; validates the nested case export core against the unchanged official v1.0 schema; extracts evidence-node IDs, argument-tree positions, parent links and source digests. | Capture metadata and local file bindings are caller declarations. Evidence descriptions, assertion status and URLs remain authored declarations. No external URL, case correctness or argument validity is evaluated. An empty evidence tree or unresolved reference remains `UNCHECKABLE`. |
| Langfuse | Validated native `POST /api/public/scores` request body. Every existing evidence state is a `CATEGORICAL` string; event ID, digest and method metadata remain attached. The pinned current API accepts a single request object or a batch array. | The caller supplies the receiver trace binding. No trace, numeric category mapping, configuration ID, human annotation or internal `EVAL` source is fabricated. No external receiver has accepted the payload. |
| Moonshot | Reads the pinned native `ResultArguments.to_dict()` fields and lifecycle states, binding retained result bytes to explicit toolkit, method, input and subject pins. Emits an existing evidence event with no numeric value. | Upstream `COMPLETED` remains a quoted lifecycle state. Complete source pins yield `PARTIAL`; missing or null pins yield `UNCHECKABLE`; mismatched result bytes yield `DIVERGENT`. Recipe/metric semantics and genuine execution require separate qualification. |

All observations reuse `csoai.evidence-event/0.1`. No new canonical Council event profile or case store is introduced. The earlier two-release fixture's generic references remain source links; these adapters add documented format transformations without establishing accepted external integrations.

## Exact source contracts

- **Turing TEA:** commit `0fd1084df5399645275b03bfc09ed58c905fe02c`. The unchanged `lib/schemas/json-schema-v1.0.json` validates the nested `{version, exportedAt, case, tree}` export core. `app/api/public/discover/[slug]/route.ts`, `lib/services/discover-transforms.ts` and `lib/api-response.ts` establish the direct public response containing summary fields and `content`; there is no `data` wrapper. `lib/services/publish-service.ts` adds optional `pluginData` and `caseInformation` to the core. [Pinned schema](https://github.com/alan-turing-institute/AssurancePlatform/blob/0fd1084df5399645275b03bfc09ed58c905fe02c/lib/schemas/json-schema-v1.0.json), [public route](https://github.com/alan-turing-institute/AssurancePlatform/blob/0fd1084df5399645275b03bfc09ed58c905fe02c/app/api/public/discover/%5Bslug%5D/route.ts), [publishing guide](https://assuranceplatform.azurewebsites.net/docs/platform-guide/publishing-and-discover).
- **Langfuse:** commit `69181812b87169df157841fce1314ec96ecd2c5a`, `web/public/generated/api-client/openapi.yml`, full `CreateScoresRequest` closure. The native batch wrapper and its items are validated. [Pinned source](https://github.com/langfuse/langfuse/blob/69181812b87169df157841fce1314ec96ecd2c5a/web/public/generated/api-client/openapi.yml), [official score guide](https://langfuse.com/docs/evaluation/evaluation-methods/scores-via-sdk).
- **Moonshot:** commit `03e9344dc9fc949ae05b1f38580611fce36528ab`, `moonshot/src/results/result_arguments.py`, `result.py` and `moonshot/src/runs/run_status.py`; the inspected repository identifies version 0.7.6. [Result fields](https://github.com/aiverify-foundation/moonshot/blob/03e9344dc9fc949ae05b1f38580611fce36528ab/moonshot/src/results/result_arguments.py), [lifecycle states](https://github.com/aiverify-foundation/moonshot/blob/03e9344dc9fc949ae05b1f38580611fce36528ab/moonshot/src/runs/run_status.py).

`receiver-contracts/upstream-source-pins.json` records exact source URLs and digests. The Turing schema is retained byte-for-byte. The Langfuse schema contains its transitive local references without changing fields or constraints. MIT notices for Turing and Langfuse are retained beside those contracts. These files identify the inspected contract versions.

## Run and inspect

Requires Python 3.10+, `jsonschema==4.26.0`, `rfc3339-validator==0.1.4` and `rfc3986-validator==0.1.1`. Missing date-time, URI or UUID format validators cause an error rather than silently skipped checks.

```sh
python3 -B -m unittest discover -s packages/evidence-fabric/tests -p test_receiver_adapters.py -v
python3 -B packages/evidence-fabric/receiver_adapters_examples.py --out /tmp/receiver-examples
```

The example command creates explicitly synthetic input files, executes all three native transformations and retains file digests. Its Turing case, Langfuse trace ID and Moonshot lifecycle times are development fixtures, not observed platform records or model executions. Tests exercise changed raw bytes, missing source/reference pins, null pins, ambiguous tree identities, bounded traversal, path escape, malformed native schemas and nonfinite/duplicate JSON input.

## Turing TEA snapshot input

```sh
python3 packages/evidence-fabric/receiver_adapters.py tea \
  --snapshot turing-public-response.json --capture capture.json \
  --evidence-map evidence-map.json --evidence-root retained-evidence \
  --out turing-evidence-events.jsonl
```

The input is the complete delivered response from `/api/public/discover/<slug>`, with `id`, `type`, `slug`, `title`, `publishedAt`, `archivedAt` and `content`. This reader accepts the inspected assurance-case response only. The published record ID is an opaque string; the official core schema itself constrains tree-node IDs to UUIDs.

Only the four core export fields undergo official core-schema validation. Remaining `content` fields, including plugin data and Case Information, are retained through digests without interpreting or copying their content. Whole-response hashing, core-contract validation and extra-field retention are distinct operations. The public transformation strips comments and resolves some presentation fields, so delivered JSON is not asserted byte-identical to the database's stored snapshot. A changed response digest alone does not establish an edit to the working case.

`capture.json` supplies `source_url`, `captured_at`, `snapshot_sha256`, `source_kind` and optional `evidence_pins`. Source kind is `SUPPLIED_FILE_UNAUTHENTICATED` or `SYNTHETIC_CONTRACT_FIXTURE` and is preserved in each event. Capture declarations do not authenticate an HTTP source or receiver. The URL must name the response's declared public slug. The slug can be reused for later publications; retain raw response bytes, their digest and the published record ID.

`evidence-map.json` maps evidence-node IDs to relative local filenames. Each `evidence_pins[nodeId]` binds the declared URL through `url_sha256` and retained artifact bytes through `content_sha256`. The adapter never follows the node URL. Missing expected snapshot pins, missing reference pins, absent URLs or unavailable linked files remain `UNCHECKABLE` with unknown fields left null. Observed digest disagreements are `DIVERGENT`. Even complete local pin agreement yields only `PARTIAL`: evidence truth, signature validity, argument soundness, publisher identity and current applicability remain unestablished.

This bounded reader refuses duplicate node IDs or ambiguous parent bindings rather than asserting a unique link; it does not claim support for every possible platform export. Traversal is limited to 2,048 nodes and depth 48. Empty evidence trees produce an explicit `UNCHECKABLE` observation rather than a successful empty result. Paths cannot escape the evidence root or traverse symlinks. Text, authors, comments, plugin bodies and URL values are not copied into the event.

## Langfuse and Moonshot commands

```sh
python3 packages/evidence-fabric/receiver_adapters.py langfuse \
  --events events.jsonl --trace-map trace-map.json --out langfuse-body.json

python3 packages/evidence-fabric/receiver_adapters.py moonshot \
  --result moonshot-result.json --pins run-pins.json --out moonshot-event.json
```

The trace map keys are canonical event IDs with receiver-supplied `trace_id` and optional `observation_id`. The adapter accepts nonzero lowercase 32-hex trace IDs and 16-hex observation IDs, without verifying their existence remotely. It emits the documented current batch request shape with `source: API`. Version-specific batch 202/207 responses require receiver read-back; there is no automatic retry or upload here.

Moonshot pins include `result_sha256`, the inspected `toolkit_commit`, `method_sha256`, `inputs_sha256`, `subject_ref` and `source_kind`. Source kind is `SUPPLIED_FILE_UNAUTHENTICATED` or `SYNTHETIC_CONTRACT_FIXTURE`; neither declares authenticated execution. Raw result/parameter sections are hashed without copying their contents or converting lifecycle completion into accuracy. A different toolkit revision needs a separately inspected contract.

All inputs are bounded. Nonfinite numbers, including JSON exponent overflow, and duplicate keys are refused. Existing output files are not overwritten.

## External acceptance still required

For Turing TEA, retain an authorized real public response, capture/source identity, exact published revision and separately qualified evidence links; any import or publication needs the platform owner's authority. For Langfuse, the authorized account owner must choose real trace bindings, import the complete payload and retain receiver read-back. For Moonshot, execute a version-pinned test with the actual method, inputs, model/environment and recipe/metric interpretation. These actions are not established by the local examples.

Council measures third-party behaviour. Verification is free at https://councilof.ai/verify
