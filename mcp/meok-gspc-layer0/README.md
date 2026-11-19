# Existing MEOK bridge: source recovery candidate

This is an unregistered review candidate for the existing local stdio bridge. It preserves the seven existing tools and adds one read-only public evidence tool. It does not install itself, change client configuration, restart the active bridge, restore a producer, or add tools to the public GSPC server. Main Claude on M4 owns review and any separately qualified installation. Production website changes still ship only through protected master and deploy.yml.

The imported source fingerprint is retained in `recovery-source.json`. The active unversioned file is unchanged. This source makes the existing work-step and snapshot failure states explicit:

- An omitted exit code is null/UNCHECKABLE. Supplied codes must be safe integers. PASS/FAIL refers only to a caller-reported command exit, with task correctness NOT_ASSESSED.
- The legacy telemetry receiver envelope is preserved, including its producer-preparation timestamp. It is not a canonical evidence event, signed receipt, benchmark result or GSPC card. No local fallback store is created.
- A 2xx response is HTTP_ACCEPTED with persistence UNVERIFIED. A transport error, timeout or non-2xx response is UNCONFIRMED. A server could have written before an error, so there is no automatic retry and no assertion of absence. A durable-write claim requires a qualified acknowledgement/readback contract that is not present here.
- Telemetry redirects are refused. A redirected login page cannot establish acceptance by the configured receiver. Invalid JSON and null request envelopes return protocol errors without terminating stdio.
- Snapshot readers report UNCHECKABLE with null data for missing, invalid or unrelated files. A readable snapshot is STATIC_OBSERVED, carrying the actual byte digest and its declared epoch. File modification time is separate. A snapshot does not prove current compute, a completed job, execution of a catalogue or scientific validity.
- Snapshot reads use nonblocking, no-follow opens and a four-MiB byte cap, including files that grow during reading. Non-regular files are rejected; unsupported platforms remain UNCHECKABLE.
- Descriptions retain existing tool identifiers while removing unsupported fleet, suite/session counts and signing claims. The workstream projection is reported telemetry, not a Council ranking or admitted measurement.

`MEOK_CAPABILITY_DIR` may explicitly select an operator-qualified artifact directory. The default remains the existing local capability-record path. Do not select a directory merely because it contains similarly named files: first establish its producer, subject lineage, epoch, rights, retained-store generation and current ownership. No authoritative producer for the three reports was found in the bounded source review; no replacement reports are fabricated here.

The routing and Desktop Commander tools retain existing authority. This candidate grants no new permission to contact people, run paid compute or execute tools. Operator acceptance must qualify those paths independently before installation. Process evidence must reuse `csoai.evidence-event/0.1` and `csoai.hitl-authority-effect/0.1`; this repair adds no case or decision store and no measurement admission path.

Run the offline regression suite from the canonical checkout:

```sh
npx vitest run mcp/meok-gspc-layer0/core.test.ts
```

The stdio fixture uses a temporary local HTTP receiver and explicit temporary capability directory. It never calls the active coordinator, model, signer, Desktop Commander, or real telemetry store. Before adoption, run a separately authorised receiver compatibility/readback check, qualify the artifact producer, and retain the exact installed source digest and rollback copy. Source tests alone do not establish live operation.

## Public evidence reference tool

`meok_read_gspc_evidence({"axis":"governance"})` reads only two fixed public GET sources:
`https://councilof.ai/api/gspc` and the retained daily-signal index. It projects the
selected published axis and shared daily briefing metadata. It hashes the exact
retrieved bytes, keeps measurement time separate from retrieval time, and preserves
unmeasured, unavailable and stale states. Redirects, extra caller arguments and
responses above two million bytes are refused. Source text is untrusted reference
data; unknown fields and alleged authority are not projected.

The daily index's declared report ID is not a verified digest of report contents:
the reader does not fetch report bodies. A recent index does not make a measurement
current. Current-task applicability, issuer authentication, independent reproduction,
human review and authority remain unestablished. The output creates no canonical
event, case store, model-weight update, durable memory admission or legal finding.
The tool is available in this source candidate, not automatically in an installed
MEOK runtime. Default chat routing is unchanged; no model provider receives data
as a side effect of reading this tool.

Run its dependency-free fixtures with:

```sh
node --test mcp/meok-gspc-layer0/evidence-context.node-test.mjs
```

`evidence-context.test.ts` runs that same suite inside the existing required bridge
Vitest gate. Fixtures make no live public-source, model, signer or private-gateway
requests. Installation must retain the shared `public/evidence-learning` modules
and complete the existing runtime acceptance process.

Measurement, not certification.

## Optional Cosmos chat provider

`meok_route_to_clan` can now use an explicitly configured Cosmos-compatible
endpoint through `chat-provider.mjs`. H.I.M. remains the default. `him_say` and
work-step telemetry continue to use the coordinator even when Cosmos chat is
enabled. A Cosmos bearer is never sent to that coordinator by this adapter.

Set `MEOK_CHAT_BACKEND=cosmos`, `MEOK_CHAT_BASE_URL` and `MEOK_CHAT_MODEL` to
activate the candidate after qualifying its endpoint. Supply the application
bearer through `MEOK_CHAT_API_KEY` in the host's secret store. Optional limits are
`MEOK_CHAT_TIMEOUT_MS` (default 30000, maximum 90000) and
`MEOK_CHAT_MAX_TOKENS` (default 1024, maximum 4096).

The adapter makes one bounded request, refuses redirects, accepts HTTPS or
loopback HTTP for Cosmos, caps prompts at 64,000 UTF-8 bytes and responses at two
MiB, and preserves a deadline while reading the body. It does not retry or
switch paid providers after an uncertain result. Cosmos nonempty text is reported
as `ANSWER_RECEIVED` with request/response hashes and provider observations;
this is neither task completion nor verified model identity. H.I.M. retains
its exact legacy `{answer, provenance}` envelope, including a deliberately
empty string, and its existing malformed-JSON error code. Provider provenance
remains an unverified assertion. Native tool-call proposals
are rejected as unsupported; this first integration is text inference.

The [Cosmos Space profile](cosmos-space/README.md) contains the pinned model,
runtime, hardware estimate, secret configuration, storage mapping and activation
checks. It is a source candidate until the GPU runtime and actual MEOK tasks
have been exercised. This change does not enroll other agents automatically or
start model training.

Run the bounded provider and actual stdio routing fixtures with:

```sh
node --test mcp/meok-gspc-layer0/chat-provider.node-test.mjs mcp/meok-gspc-layer0/chat-routing.node-test.mjs
```

`chat-provider.test.ts` invokes those same fixtures in the monorepo Vitest gate.
They use mocked fetches and temporary loopback servers, with no external model,
GPU, payment, coordinator or telemetry call.

## Optional existing Hugging Face situation worker

`hf-situation.mjs` adds `meok_reason_situation` to this same stdio bridge only
when `MEOK_HF_ENABLED=1`. This is a review candidate, not an installed route.
It adapts the existing private Gradio Cosmos3-Edge worker; it does not create
another model server, Space, memory store, decision store or event schema.

The input is one text-only `goal`, `situation`, and explicit
`consent_to_send=true`. This pass-through flag is not authenticated human
identity, source-rights clearance or approval for an external action. The host
must qualify those separately before sending real information. Use fictional
inputs during deployment acceptance. The tool consumes ZeroGPU quota and
creates temporary remote session state, so its annotations are non-read-only
and non-idempotent.

The operator must configure these through the host's approved configuration
and secret mechanism, never through a model's tool arguments:

```dotenv
MEOK_HF_ENABLED=1
MEOK_HF_SPACE_ID=OWNER/QUALIFIED_PRIVATE_SPACE
MEOK_HF_ORIGIN=https://QUALIFIED-SUBDOMAIN.hf.space
MEOK_HF_SPACE_SHA=EXACT_40_HEX_SERVING_SOURCE_REVISION
MEOK_HF_MODEL_SHA=EXACT_40_HEX_MODEL_REVISION
MEOK_HF_TOKEN=SET_IN_YOUR_SECRET_STORE
MEOK_HF_TIMEOUT_MS=60000
MEOK_HF_CALL_LIMIT=1
```

Use a least-privilege token able to read only the intended private worker where
available. Its application inputs and recent session content remain subject to
the Space's own access and retention behaviour; this adapter does not make a
private service public.

The adapter verifies the declared Space identity, private status, exact source
revision, runtime source revision, running state and existing ZeroGPU hardware;
it checks the pinned model-lock document before submitting. The lock must name
Cosmos3-Edge, the expected model revision, reasoner-only mode, no paid upgrades,
at most 192 generated tokens and at most 45 GPU seconds per request. These are
metadata checks, not attestation of the actual GPU's loaded weights.

One POST is followed by a bounded result stream and a source-metadata recheck.
Redirects, oversized data, unexpected messages, changed source/hardware,
unsupported outputs and grants of execution/training authority are refused.
Hugging Face raw JSON source files may use `text/plain`; this exception is
limited to the exact pinned model-lock URL and still requires valid JSON.
The raw Gradio Blocks result includes its leading null State output; it is not
the Python client's four-value view. Non-null state or an unexpected output
shape is rejected, never forwarded. The reaction record must remain at most
3,072 UTF-8 bytes with synthetic-hypothesis and HOLD states retained.

The result hashes bind received input/output bytes. Neither receipt, schema
validation, hash nor the text `ANSWER_RECEIVED` establishes answer correctness,
card-content-ID verification, independent measurement or model improvement.
No automatic retry, provider fallback, tool execution, payment, durable memory
admission, training or GSPC write is added. A timeout after submission is
`MAY_HAVE_RUN`, not proof of cancellation. The per-process call cap defaults to
one and is not a durable quota or spending ledger. Restarting the bridge resets
that counter; production budgets require the existing authoritative controls.

Run offline checks:

```sh
node --test mcp/meok-gspc-layer0/hf-situation.node-test.mjs
```

The Vitest wrapper includes these fixtures in the existing bridge directory
gate. The adapter's live candidate reached a worker but rejected its output;
the source-informed raw-State-slot correction is covered offline. A successful
post-correction live roundtrip, runtime installation, session lifecycle and
actual task quality remain activation requirements. This change does not
repair the previously observed model judgement error by itself.

See [the process consolidation research](../../docs/integrations/meok-process-consolidation-20261109.md)
for protocol boundaries, reuse targets and the measured-improvement experiment.
