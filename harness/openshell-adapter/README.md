# openshell-adapter: declared policy against observed attempts

Our example (Apache-2.0). It reads an OpenShell sandbox policy, OpenShell's own event records, and an
independent witness stream. For each egress, file and syscall attempt it writes a row saying what the
policy declares, what the enforcer recorded and what the witness saw. It signs the rows as
`signed-receipts/v1` objects. OpenShell is published by NVIDIA under Apache-2.0
(github.com/NVIDIA/OpenShell). This is not an NVIDIA integration.

Design, sources and limits: [DESIGN.md](DESIGN.md).

```sh
# needs python3, PyYAML and cryptography; run from a checkout that has public/spec/signed-receipts/v1
python3 adapter.py compare \
  --policy capture-2026-09-28/policy.yaml \
  --enforcer-log capture-2026-09-28/enforcer.log \
  --witness capture-2026-09-28/witness.jsonl \
  --enforcer-version 0.1.2 --subject urn:example:openshell-network-proxy:capture-2026-09-28 \
  --issued-at 2026-09-28T13:43:00Z --out capture-2026-09-28/out
python3 adapter.py verify capture-2026-09-28/out/run-receipt.json --did-doc test-did.json
python3 test_adapter.py
```

`compare` exit codes: 0 CONSISTENT, 1 DIVERGENT, 2 input error, 3 UNMEASURED (no independent witness).

| Folder | What |
|---|---|
| `capture-2026-09-28/` | real capture: OpenShell v0.1.2 `--role network-proxy` on the build pod; one CONNECT refused, one audit-mode request let through, one enforce-mode request refused |
| `fixtures/must-fail-deny-declared-egress/` | deny declared, enforcer records a denial, traffic still leaves: must return DIVERGENT |
| `fixtures/control-deny-held/` | the same inputs with nothing leaving: must return CONSISTENT |
| `fixtures/must-fail-file-syscall/`, `fixtures/must-fail-landlock-degraded/` | file and syscall rows |

Receipts made with the default key are signed by a **published test key** and attest nothing.
