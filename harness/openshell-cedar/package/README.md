# csoai-openshell-harness

An **independent open example** (Apache-2.0) by CSOAI Ltd. It is not affiliated with or endorsed by NVIDIA,
and it is not part of OpenShell. OpenShell is an open-source agent sandbox published by NVIDIA under
Apache-2.0 (github.com/NVIDIA/OpenShell); this package only reads its published policy, prover and log formats.
Requalified against OpenShell v0.1.2.

It measures; it does not certify, grade or rank anything. When a question cannot be answered, the answer is
`UNMEASURED` or `UNCHECKABLE`, never a pass.

## What is in it

| Command | What it does |
|---|---|
| `csoai-openshell-compare` | For every egress, file and syscall attempt: what the policy declares, what the enforcer recorded (OCSF JSONL or shorthand), what an independent witness saw. Rows are signed as `signed-receipts/v1` (with a published **test** key unless you pass your own). Exit 0 CONSISTENT, 1 DIVERGENT, 3 UNMEASURED (no independent witness). |
| `csoai-openshell-declared-observed` | Puts OpenShell's own policy prover (`openshell-prover check --output json`) on the declared side and the comparison above on the observed side. Prover `unsupported`/`inconclusive`/`error`, a coverage gap, or no witness gives `UNMEASURED`. The prover's own README says a passing check "does not attest that a running sandbox installed its restrictions"; this is the other half. |
| `csoai-openshell-to-cedar` | OpenShell policy YAML to Cedar policies plus a Cedar schema, v0. Anything it does not fully understand (an unknown field, a field it does not model, a glob Cedar cannot express, audit mode, non-REST protocols) is reported `UNCHECKABLE` and **never becomes an allow**. Denies are widened, never dropped. |
| `csoai-openshell-cedar-roundtrip` | Runs the `cedar` CLI over a generated request grid and compares every decision with the declared model: OVER_ALLOW is never acceptable. |
| `csoai-openshell-observe` | OCSF to an observation record: what the enforcer says it did, counted, with every line accounted for. Self-report only; not a board axis. |

```sh
pip install csoai-openshell-harness
csoai-openshell-to-cedar policy.yaml --out cedar/
cedar validate --schema cedar/openshell.cedarschema --policies cedar/policy.cedar
csoai-openshell-declared-observed --policy policy.yaml --boundary boundary.yaml \
  --prover /path/to/openshell-prover --enforcer-log openshell-ocsf.log --witness flows.jsonl
```

## Limits

- The declared model is our Python re-implementation of OpenShell's policy rules (v0.1.2). Where it and
  OpenShell disagree, this package can be wrong.
- MCP, JSON-RPC, GraphQL and WebSocket request rules, `network_middlewares`, process identity and query
  matchers are not modelled.
- Enforcer records are self-report. Without a witness (flow log, packet capture, strace) nothing here can
  show that traffic did not leave.
- No full-sandbox capture has been run: the committed capture used the network-proxy role only.

## Contact, objections and corrections

Maintained by CSOAI Ltd. Questions, objections, re-check requests and corrections: nicholas@csoai.org.
Published corrections: https://councilof.ai/corrections/. An operator who objects to a probe or a
record can ask for it to be re-checked or withdrawn at the same address.

Source: the sdist of this package on PyPI carries every module it installs. The fixtures, tests and the
v0.1.1 to v0.1.2 requalification record live in the councilof.ai repository, which has no public browsable
copy at present (its GitHub organisation is unavailable); they are sent on request from nicholas@csoai.org.
