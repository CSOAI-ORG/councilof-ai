# OpenShell source compatibility review — 2026-11-06

**Status: research only; not requalification or production acceptance.** This reviews upstream contracts for the existing Council adapter. It does not establish that current main, a new release, or the installed runtime works with the adapter.

## Pins and previous scope

The existing [v0.1.4 review](../v0.1.4/REQUALIFY.md) records upstream **5a7728c304b5528e954e9ae900cf21f84e1a12b1**, reviewed 2026-10-15. Its scope was the adapter's input paths; no live v0.1.4 capture or v0.1.4 prover was run. The retained capture declares Council adapter version **0.2.0**; the local repair candidate is **0.2.1**; this is separate from upstream OpenShell versions.

On 2026-11-06, upstream main resolved to **53b8eec29cadab70e11be88776cf14a0fc6a7fdd**, committed **2026-11-05T22:00:13Z**. Treat this as a source snapshot, not an identified release or deployed version. Its Cargo workspace version is 0.0.0. OCSF schema version is **1.8.0**, which alone does not distinguish historical OpenShell field placement.

Primary comparison: [v0.1.4 export documentation](https://github.com/NVIDIA/OpenShell/blob/5a7728c304b5528e954e9ae900cf21f84e1a12b1/docs/observability/ocsf-json-export.mdx) and [pinned main export documentation](https://github.com/NVIDIA/OpenShell/blob/53b8eec29cadab70e11be88776cf14a0fc6a7fdd/docs/observability/ocsf-json-export.mdx).

## Compatibility changes requiring explicit treatment

| Area | Historical v0.1.4 documentation | Pinned main contract |
|---|---|---|
| Sandbox attribution | Top-level `container.uid/name` | Supervisor `device.container.uid/name`; gateway `unmapped.sandbox_id/name`. Authentication has no attached container. |
| Image identity | Optional image information | Resolved workload image UID required for `device.container.image`; otherwise a known reference can remain in `unmapped.container_image`. |
| Supervisor files | `openshell-ocsf.YYYY-MM-DD.log`; cleanup could remove JSON history early | `.jsonl`; independent three-file retention per format |
| Schema downgrade | Settings could strip fields/profiles and rewrite metadata.version | `ocsf_schema_version` and gateway schema_version deprecated and ignored; emits 1.8.0 only |
| Operational classes | Historical parser assumptions need preservation | Relay/proxy failures without an observed network endpoint can be Base Event 0, not Network Activity |

The current [native validator](https://github.com/NVIDIA/OpenShell/blob/53b8eec29cadab70e11be88776cf14a0fc6a7fdd/crates/openshell-ocsf-validate/src/lib.rs) selects a vendored schema by version, class and sorted declared profiles. It rejects undefined top-level container and checks `type_uid = class_uid * 100 + activity_id`. Parsing JSON is not schema validation. Do not silently migrate old evidence or apply current schemas to every historical artifact.

Event UID identifies an event, never a sandbox or approval. Gateway request correlation may be client-supplied. Authentication success is credential acceptance, not human authorization; repeated accepted requests may emit no authentication event. API targets are not necessarily source sandbox attribution. Producer Allowed/Success records do not establish independent external effects.

## Collection limits

[Gateway configuration](https://github.com/NVIDIA/OpenShell/blob/53b8eec29cadab70e11be88776cf14a0fc6a7fdd/docs/how-it-works/gateways/configuration.mdx) documents best-effort collection. Native JSONL has external dropped/writer-error/recovery-byte metrics, not a guaranteed in-band gap record. Recovered bytes cannot become an invented lost-event count; flush is not fsync.

[OTLP source](https://github.com/NVIDIA/OpenShell/blob/53b8eec29cadab70e11be88776cf14a0fc6a7fdd/crates/openshell-otel/src/ocsf.rs) emits a separate warning named `openshell.ocsf.gap`, with dropped and since_unix_ms attributes under that prefix. It is not native OCSF. Retries can duplicate records; shutdown losses have no gap record. Collector partial rejection is not covered by gateway gap counts. No observed gap never means complete history.

## Fixtures and next profile

Existing control-deny-held and must-fail-deny-declared-egress JSON fixtures omit current required category_uid, type_uid and metadata.product, and declared profiles. Retain them as synthetic comparison/parser regressions, not current conformance goldens. Console-v014 fixtures test framing, not a new live capture.

Next, define an explicit source-version compatibility profile preserving legacy inputs. Generate fixtures with pinned upstream builders and validator; record source pin, generator command, bytes/hash and synthetic status. Add separate real-capture evidence only after running it. The upstream [JSONL conformance test](https://github.com/NVIDIA/OpenShell/blob/53b8eec29cadab70e11be88776cf14a0fc6a7fdd/e2e/rust/tests/ocsf_jsonl_conformance.rs) distinguishes an incomplete final line from malformed complete JSON.

Required controls include current versus legacy identity paths, unknown profiles/version, inconsistent type_uid, duplicate/conflicting event IDs, missing attribution, partial tails and missing loss metrics. Keep original bytes and separate assessments; never promote source success into approval or witnessed effect.

The separately tested local 0.2.1 repair preserves unknown witness outcomes, refuses missing-time correlation and duplicate canonical row identities, and packages the shared observation rules. It preserves historical capture bytes and their signed receipts. Those repairs do not authenticate witnesses or caller-supplied controls, recompute an imported comparison label, or add native OCSF schema validation. No upstream build, live capture, or current-main qualification was performed for this document.
