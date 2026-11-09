
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
