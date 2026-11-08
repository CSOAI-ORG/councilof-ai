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
MEOK runtime. Existing chat routing is unchanged; no model provider receives data
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

