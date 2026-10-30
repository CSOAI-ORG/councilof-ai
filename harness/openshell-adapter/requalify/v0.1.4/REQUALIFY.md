# OpenShell v0.1.2 → v0.1.4: requalification of the declared-vs-observed adapter

Read 2026-10-15 from the public repository (github.com/NVIDIA/OpenShell), anonymously, through a blobless clone. v0.1.2 = `6648bd0c`,
v0.1.4 = `5a7728c3`. The machine-readable version is [`controls-diff.json`](controls-diff.json). **Scope: qualified for the adapter's input paths only**:
the policy fields it reads, the shorthand log, the OCSF JSONL file, the OCSF-JSON console stream and the prover JSON (schema 1). It does not qualify
MCP, credential or other rule types the adapter leaves UNMODELLED. No v0.1.4 prover binary or live v0.1.4 capture was run. The committed prover
outputs are still from 0.1.2.

## What changed that matters
1. **Console OCSF-JSON (new in v0.1.4).** With `ocsf_json_enabled=true`, supervisors write `<UTC ts> OCSF-JSON {json}` to stderr
   (`OcsfJsonlLayer::with_console_format`). The adapter dropped these lines, so a control returned CONSISTENT with 0 records parsed.
   It now accepts the prefix. Fixture: `fixtures/console-ocsf-json-v014/`.
2. **sandbox-policy.rego** `4a17fe93…` → `f60349dc…`. L7 admission was refactored into `_admitted_l7_endpoints` (the global deny still wins).
   `allowed_token_grant_owners` was added (credentials), along with MCP method classification and fixed deny reasons. These are all rule types the adapter leaves UNMODELLED.
3. **Unchanged:** `openshell-prover-cli/src/main.rs` (the JSON contract), the prover-cli README, the shorthand NET/HTTP formats (unmapped fields are now sorted,
   and CONFIG suffixes are escaped), and the policy fields the adapter reads.
