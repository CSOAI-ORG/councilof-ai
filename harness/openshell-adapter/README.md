# openshell-adapter: declared policy against observed attempts

Our example (Apache-2.0). It reads an OpenShell sandbox policy, OpenShell's own event records, and an
independent witness stream. For each egress, file and syscall attempt it writes a row saying what the
policy declares, what the enforcer recorded and what the witness saw. It signs the rows as
`signed-receipts/v1` objects. OpenShell is published by NVIDIA under Apache-2.0
(github.com/NVIDIA/OpenShell). This is not an NVIDIA integration.

Design, sources and limits: [DESIGN.md](DESIGN.md). Pinned to OpenShell v0.1.2; what changed from
v0.1.1 is in [requalify/v0.1.2/REQUALIFY.md](requalify/v0.1.2/REQUALIFY.md).

`declared_observed.py` puts OpenShell's own policy prover (`openshell-prover check --output json`) on the
declared side and this adapter on the observed side. The prover says whether a policy stays inside a
boundary and, in its own words, "does not attest that a running sandbox installed its restrictions".
An inconclusive, unsupported or errored prover run, a coverage gap, or an observer run without an
independent witness is UNMEASURED, never a pass.

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
python3 declared_observed.py --policy fixtures/must-fail-deny-declared-egress/policy.yaml \
  --boundary prover-fixtures/boundary-pkg-index.yaml \
  --prover-json prover-fixtures/runs/must-fail-deny-declared-egress.prover.json \
  --enforcer-log fixtures/must-fail-deny-declared-egress/enforcer.ocsf.jsonl \
  --witness fixtures/must-fail-deny-declared-egress/witness.jsonl
#   STATUS MEASURED  finding=DECLARED_WITHIN_BOUNDARY__OBSERVED_DIVERGENT
OPENSHELL_PROVER=/path/to/openshell-prover python3 test_declared_observed.py
```

`declared_observed` exit codes: 0 MEASURED and consistent, 1 MEASURED with a divergence or an
exceeded boundary, 2 input error, 3 UNMEASURED.

`compare` exit codes: 0 CONSISTENT, 1 DIVERGENT, 2 input error, 3 UNMEASURED (no independent witness).

| Folder | What |
|---|---|
| `capture-2026-09-28/` | real capture: OpenShell v0.1.2 `--role network-proxy` on the build pod; one CONNECT refused, one audit-mode request let through, one enforce-mode request refused |
| `fixtures/must-fail-deny-declared-egress/` | deny declared, enforcer records a denial, traffic still leaves: must return DIVERGENT |
| `fixtures/control-deny-held/` | the same inputs with nothing leaving: must return CONSISTENT |
| `fixtures/must-fail-file-syscall/`, `fixtures/must-fail-landlock-degraded/` | file and syscall rows |
| `prover-fixtures/` | boundaries, and real `openshell-prover` 0.1.2 outputs over the fixtures (`runs/`); one synthetic inconclusive output, labelled |
| `requalify/v0.1.2/` | the v0.1.1 → v0.1.2 delta of every declared control the adapter reads |

Receipts made with the default key are signed by a **published test key** and attest nothing.
