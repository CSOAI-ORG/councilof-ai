# Fixture sources

| File | What | Origin |
|---|---|---|
| `allow.yaml`, `deny.yaml`, `conditional.yaml` | translator fixtures | ours, synthetic |
| `unknown-field.yaml`, `unknown-top-level.yaml` | must-catch fixtures: unknown fields never become an allow | ours, synthetic |
| `ocsf-doc-examples.jsonl` | the two example OCSF records (one allowed, one denied connection), compacted to one line each, otherwise byte-for-byte | OpenShell `docs/observability/ocsf-json-export.mdx` at tag v0.1.2 (file sha256 `cb7caf2c…`), github.com/NVIDIA/OpenShell, Apache-2.0. Quoted as data; the `vendor_name` field inside is upstream's own record content |
