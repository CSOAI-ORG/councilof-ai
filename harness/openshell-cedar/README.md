# openshell-cedar: OpenShell policy → Cedar (v0), and an OCSF observer

Our example (Apache-2.0); not part of OpenShell and not affiliated with NVIDIA. OpenShell is published by
NVIDIA under Apache-2.0 (github.com/NVIDIA/OpenShell). Backlog item M14 (2026-09-29).

| File | What |
|---|---|
| `translate.py` | OpenShell sandbox policy YAML → Cedar policies + `openshell.cedarschema`, with a report that marks every element TRANSLATED or UNCHECKABLE |
| `roundtrip.py` | YAML → Cedar → `cedar authorize` over a generated request grid, compared with the declared model in `../openshell-adapter/adapter.py` |
| `ocsf_observer.py` | OpenShell OCSF JSONL / shorthand → a `csoai.openshell.observation/0.1` record (enforcer self-report, counted; not a board axis) |
| `fixtures/` | allow, deny, conditional, unknown-field and unknown-top-level policies; two upstream OCSF example records (`SOURCES.md`) |
| `out/` | the generated Cedar for every fixture, `cedar-validate.log`, `roundtrip-summary.json` |
| `package/` | the `csoai-openshell-harness` PyPI package (this folder + the adapter) |

## The rule

**Nothing the translator does not fully understand becomes an allow.** An unknown field, a known field v0
does not model (`tls`, credential fields, `path`, …), a glob Cedar's `like` cannot express exactly,
`enforcement: audit` on a REST endpoint, a protocol other than REST, and `network_middlewares` each make
the element UNCHECKABLE, and it contributes no `permit`. Denies are emitted at least as wide as declared
(a deny whose path glob cannot be expressed is widened to every path; one whose binaries cannot be
expressed applies to every binary). Cedar is default-deny, like OpenShell's network policy, so an
UNCHECKABLE element costs access, never containment.

Exact equivalences used: a whole trailing `/**` → `like "<prefix>/*"`; host `**.x` → `like "*.x"`;
host `*.x` → `like "*.x" && !(like "*.*.x")`; ports, `allowed_ips` (Cedar `ipaddr`), presets, method
and path rules, deny-beats-allow (`forbid` overrides `permit`), the platform's always-blocked addresses
and control-plane ports, and Landlock path prefixes (a read-only path inside a read-write one gets a
`forbid` on writes).

## Run

```sh
python3 translate.py fixtures/deny.yaml --out out --name deny
cedar validate --schema out/openshell.cedarschema --policies out/deny.cedar --deny-warnings
CEDAR=$(command -v cedar) python3 roundtrip.py fixtures/conditional.yaml
CEDAR=$(command -v cedar) python3 test_translate.py
CEDAR=$(command -v cedar) PY=python3 sh validate_all.sh     # refreshes out/cedar-validate.log and roundtrip-summary.json
python3 ocsf_observer.py ../openshell-adapter/capture-2026-09-28/enforcer.log --policy ../openshell-adapter/capture-2026-09-28/policy.yaml
```

`cedar` is `cedar-policy-cli` (4.13.0 in the committed run), installed with `cargo install cedar-policy-cli`
on the lanes pod, not on the Mac.

## Results (2026-09-29, cedar-policy-cli 4.13.0)

All 9 generated policy sets pass `cedar validate --deny-warnings`. Over 3,767 generated requests there
is no OVER_ALLOW and no UNDER_ALLOW; the fully translated policies agree on every request, and the
UNCHECKABLE ones deny exactly where they say they cannot translate (FAIL_CLOSED). The must-catch test
turns the unknown-field protection off on purpose and requires the suite to fail; it does. Numbers per
policy: `out/roundtrip-summary.json`.

## Limits

- The reference for the round trip is our Python model of OpenShell's rego (`adapter.py`), not OpenShell
  itself. The suite proves the translation agrees with that model; it inherits the model's errors.
- The request grid is generated from the policy; it is broad, not exhaustive.
- v0 has no Cedar action for process identity, and none for MCP / JSON-RPC / GraphQL / WebSocket rules.
- The observer reports what the enforcer says about itself. It is MEASURED only for that narrow
  construct; containment needs a witness (`../openshell-adapter/declared_observed.py`).
