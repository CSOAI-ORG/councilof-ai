# OpenShell declared-vs-observed adapter: design note

Lane `openshell-adapter-20260928`, backlog item #25. Written 2026-09-28; requalified against v0.1.2
and given the prover-backed declared side on 2026-09-29 (lane `nv-openshell-20260929`).
Licence of this folder: Apache-2.0 (SPDX headers on every source file).

This is our example code. It reads OpenShell's published policy and log formats. OpenShell is an
open-source agent runtime published by NVIDIA under Apache-2.0 (github.com/NVIDIA/OpenShell).
This is not an NVIDIA integration, it is not part of OpenShell, and nothing here says that
OpenShell's maintainers have seen it.

## 1. What was verified, and from where

All from primary sources, read 2026-09-28:

| Fact | Source |
|---|---|
| The repository exists, licence Apache-2.0, created 2026-02-24 | GitHub API, `repos/NVIDIA/OpenShell` |
| Latest release `v0.1.2`, published 2026-09-28T03:58Z, tag commit `6648bd0c` | GitHub API, releases |
| Policy schema: `version: 1`, `filesystem_policy`, `landlock`, `process`, `network_policies`, `network_middlewares`; unknown fields and duplicate keys are rejected | `docs/how-it-works/policies/schema.mdx` |
| Network is default-deny; rules are not ordered; a matching deny rule beats any allow; `enforcement` defaults to `audit`, which "allows the request and logs the violation" | `schema.mdx`, `network-rules.mdx` |
| Baseline filesystem paths are added when the policy has a network rule | `default-policy.mdx` |
| Syscalls are not a policy field: a fixed seccomp denylist, "not a user-facing knob" | `docs/security/best-practices.mdx` |
| Events are OCSF v1.8.0: shorthand lines in `/var/log/openshell.YYYY-MM-DD.log`, full JSONL in `/var/log/openshell-ocsf.YYYY-MM-DD.log` when `ocsf_json_enabled` is set | `docs/observability/logging.mdx`, `ocsf-json-export.mdx` |
| Landlock writes `CONFIG:` records at startup only; there is no per-access record | `logging.mdx` ("Filesystem Sandbox Logs") |

These doc files and the policy rego are byte-identical at `v0.1.2` and at `main` `eef8bec`
(`git diff --quiet`), so the pins agree.

The install was well under 500 MB (supervisor 32.6 MB, sandbox 10.8 MB, prover 32.6 MB; all three
release checksums verified). It went on the pod volume, never the Mac. Telemetry was switched off
(`OPENSHELL_TELEMETRY_ENABLED=false`).

## 2. What was captured

A full OpenShell sandbox cannot run in a RunPod container. It needs a Docker, Podman, Kubernetes
or MicroVM driver and a network namespace, and the container grants none of them (this repeats the
finding in `docs/proofof/SANDBOX-V0.md`). The supervisor also has `--role network-proxy`: the same
OPA engine and L7 proxy on a loopback listener, with local policy files and no isolation. That runs
on the pod, and it is what produced the capture in `capture-2026-09-28/`.

The three requests were sent through the proxy with curl, and these are the enforcer's records, unedited:

```
OCSF NET:OPEN [MED] DENIED -(0) -> example.org:443 [policy:- engine:opa] [reason:endpoint example.org:443 is not allowed by any policy]
OCSF NET:OPEN [INFO] ALLOWED -(0) -> example.com:443 [policy:example_audit engine:opa]
OCSF HTTP:GET [INFO] ALLOWED GET http://example.com:443/ [policy:example_audit engine:l7]
OCSF NET:OPEN [INFO] ALLOWED -(0) -> example.net:443 [policy:example_enforce engine:opa]
OCSF HTTP:GET [MED] DENIED GET http://example.net:443/ [policy:example_enforce engine:l7] [reason:L7_REQUEST deny GET example.net:443/ reason=GET / blocked by deny rule]
```

The first line is the captured deny event. `example.com` and `example.net` carry the same deny rule
(`GET /**`). The only difference is `enforcement: audit` against `enforcement: enforce`. The client got
the origin's 559-byte page from `example.com`, and the proxy's `policy_denied` body from `example.net`.

**What the capture shows.** The shorthand record of the audit-mode request has the same form as a
request that no rule refuses: `[INFO] ALLOWED`, with no reason suffix. A reader of that line cannot
tell that a declared deny rule matched. The source at `v0.1.2`
(`crates/openshell-supervisor-network/src/l7/relay.rs`) maps the `audit` decision to action
`Allowed`, disposition `Allowed` and severity Informational. It puts the word `audit` only in the
record's `message` (`L7_REQUEST audit ...`). So the documented filter
`jq 'select(.action == "Denied")'` would not list it either. That JSONL detail comes from reading
the source; the network-proxy role wrote no JSONL (see `provenance.json`). This is consistent with the
documentation ("audit allows the request"). It is why the adapter reads the policy's enforcement mode
itself and does not wait for the record to say so.

This is three requests on one host. It shows the mechanism. It does not measure OpenShell.

## 3. The model: three streams, kept apart

| Stream | What it is | Who produced it |
|---|---|---|
| declared | the policy YAML, plus the documented syscall baseline | the policy author, and OpenShell's docs |
| enforcer | OCSF JSONL or shorthand lines | OpenShell, about itself |
| witness | JSONL rows from something that is not the enforcer: a client transcript, a host flow log, strace, auditd | a third party |

The enforcer's record is self-report. A run where only the enforcer speaks can show that the
enforcer *says* it let a declared deny through (it said so in the capture). It cannot show that
nothing left. Such a run ends `UNMEASURED` (exit 3), never `CONSISTENT`.

## 4. Declared policy to observed attempts

| Policy field | What the adapter derives | Enforced by | Per-attempt enforcer record? |
|---|---|---|---|
| `network_policies.*.endpoints` (`host`, `port`/`ports`, `allowed_ips`) + `binaries` | connection permitted or denied; no match means default deny | proxy + OPA | yes: `NET:OPEN` (class 4001) |
| endpoint `protocol: rest`, `access` / `rules` / `deny_rules`, `enforcement` | request permitted or denied; deny beats allow; `audit` lets a denied request through | L7 proxy | yes: `HTTP:<METHOD>` (class 4002); `audit` appears as Allowed |
| loopback, link-local, unspecified targets; ports 2379, 2380, 6443, 10250, 10255 | always denied | platform | yes, as `NET:OPEN DENIED` |
| `filesystem_policy.read_only` / `read_write` / `include_workdir` + baseline paths | path and operation permitted or denied; unlisted paths are inaccessible | Landlock | no; startup `CONFIG:` records only |
| `landlock.compatibility: best_effort` | may start without any filesystem rule | Landlock | `FINDING` "Landlock Filesystem Sandbox Unavailable" |
| syscalls (no policy field) | documented denylist: `ptrace`, `mount`, `bpf`, `setns`, ...; `clone`/`unshare` with `CLONE_NEWUSER`; `AF_PACKET`/`AF_VSOCK`/`AF_BLUETOOTH` sockets | seccomp | no; the call returns `EPERM` |
| `process.run_as_*`, `network_middlewares`; graphql / mcp / json-rpc rules; `query` matchers; hostless `allowed_ips` without a resolved IP | not modelled | | rows come out `UNMODELLED`, never HELD |

Matchers follow the documented glob rules: `*` stays within a segment, a whole-segment `**` spans
segments, hosts are matched case-insensitively. The capture confirms one edge: `/**` matched `/`.

## 5. Formats

**Enforcer records.** Two parsers.
- OCSF JSONL (the documented record shapes): `class_uid`, `action`, `dst_endpoint`, `actor.process`, `http_request`, `firewall_rule`, `status_detail`, `message`.
- Shorthand, in both the file form (`<iso> OCSF CLASS:ACTIVITY [SEV] ...`) and the CLI form (`[epoch] [sandbox] [OCSF ] [ocsf] ...`).

Lines that are not OCSF records (plain `INFO` tracing) are counted and skipped. The run records how
many lines it read and how many it parsed, so an empty parse is visible.

**Witness rows** (JSONL, one object per line, `#` comments allowed):

```json
{"kind":"egress","t":"<iso>","host":"example.com","port":443,"method":"GET","path":"/","binary":"/usr/bin/curl","left":true,"evidence":{"source":"client_transcript","http_code":200,"body_sha256":"..."}}
{"kind":"egress","t":"<iso>","host":"exfil.example","port":443,"left":true,"evidence":{"source":"host_flow_log","bytes_out":18432}}
{"kind":"file","t":"<iso>","path":"/etc/hosts","op":"write","result":"ok","evidence":{"source":"strace"}}
{"kind":"syscall","t":"<iso>","name":"clone","flags":["CLONE_NEWUSER"],"result":"ok","evidence":{"source":"strace"}}
```

`left` is true, false, or absent (unknown). For file and syscall rows, `result` is `ok` or an errno.

## 6. Comparison

A witness egress row is joined to the enforcer's `NET` and `HTTP` records for the same host, port,
method and path within a window (default 5 s). Enforcer records with no witness row become rows of
their own.

| Declared | Enforcer record | Witness | Comparison | Code |
|---|---|---|---|---|
| denied | DENIED | left | DIVERGED | `ENFORCER_RECORD_CONTRADICTED_BY_WITNESS` |
| denied, `audit` | ALLOWED | left, or no witness | DIVERGED | `DENY_DECLARED_AUDIT_PASSTHROUGH` |
| denied | ALLOWED, naming a `_provider_*` rule | left, or no witness | DIVERGED | `PROVIDER_RULE_OUTSIDE_POLICY_FILE` (providers add rules the file does not show) |
| denied | ALLOWED | left, or no witness | DIVERGED | `ENFORCER_LET_DECLARED_DENY_THROUGH` |
| denied | none | left | DIVERGED | `EGRESS_WITHOUT_ENFORCER_RECORD` |
| denied | DENIED or none | did not leave | HELD | |
| denied | DENIED | none | SELF_REPORT_ONLY | |
| permitted | DENIED | any | OVERBLOCK | `DECLARED_PERMIT_ENFORCER_DENIED` |
| file/syscall denied | n/a | `ok` | DIVERGED | `DENY_DECLARED_EFFECT_OBSERVED` |
| filesystem | `rules_applied:0` or a high-severity Landlock finding | any | DIVERGED | `FS_RULES_NOT_APPLIED` |

Run result: `DIVERGENT` (exit 1) if any row DIVERGED. With `--strict`, OVERBLOCK rows count too.
`CONSISTENT` (exit 0) needs at least one witnessed row. Otherwise the result is `UNMEASURED` (exit 3).
OVERBLOCK does not end a run by default because it is the direction in which our re-implementation of
the rego is most likely to be the party in error. `UNMODELLED` rows are counted and never pass silently.

## 7. Receipts

Every row gets a `signed-receipts/v1` object (`public/spec/signed-receipts/v1/SPEC.md`), made with this
repo's reference `interceptor.py`: RFC 8785 canonical JSON, `content_id`, Ed25519. The run gets one
more receipt, whose claim lists the row receipts' `content_id`s and the sha256 of the policy, the
enforcer logs, the witness file, the rows and `adapter.py`. Claims carry hashes and short text, never
payloads. The claim fields avoid decision-shaped keys and values. The adapter compares; it does not
admit or refuse anything.

By default the receipts are signed with a **published test key**
(`sha256("openshell-adapter example TEST key: issuer")`, `did:web:issuer.example#key-1`). They show
the mechanism and attest nothing. `test-did.json` resolves that key, so `adapter.py verify` returns
VALID with it and UNVERIFIABLE_KEY without it. An operator who runs the adapter for real passes
`--key-seed-file` and publishes their own DID document. No production key was used in this lane.

## 8. Fixtures

| Fixture | Kind | Expected |
|---|---|---|
| `fixtures/must-fail-deny-declared-egress` | synthetic, documented OCSF shapes | **DIVERGENT**: the enforcer records a denial for `exfil.example` while a host flow log sees 18 432 bytes leave; `198.51.100.7:8443` leaves with no enforcer record at all |
| `fixtures/control-deny-held` | same policy and enforcer records, byte for byte | CONSISTENT: only the witness differs (nothing left) |
| `fixtures/must-fail-file-syscall` | synthetic | DIVERGENT: a write to read-only `/etc/hosts`, plus `ptrace` and `clone(CLONE_NEWUSER)`, all succeed |
| `fixtures/must-fail-landlock-degraded` | synthetic | DIVERGENT: `best_effort` + "Landlock unavailable" leaves every declared filesystem denial out of force |
| `capture-2026-09-28` | **real capture**, v0.1.2 | DIVERGENT on `example.com`: a declared deny in audit mode, and the origin's bytes came back |

The control is what keeps the must-fail fixture honest. If an adapter change made both return the
same result, the check would have stopped comparing anything, and `test_adapter.py` goes red.

## 9. Limits (UNMEASURED, stated rather than guessed)

- Our Python model re-implements the rego. Where they disagree, the adapter can be wrong. On the
  capture (n = 3) the model gave the same connection-level result as the enforcer for all three
  hosts, and found the same deny rule the enforcer applied to both GET requests (refused under
  `enforce`, let through under `audit`). The prover is now wired in as the declared side
  (`declared_observed.py`, 2026-09-29), but it answers a different question (containment in a
  boundary), so it is not a cross-check of this model's per-request decisions.
- No binary identity in the network-proxy role (`-(0)`). Rows say "endpoint-only match".
- The OCSF JSONL parser is tested only on records built from the documented shapes, not on a
  captured JSONL file.
- The capture's witness is the client itself. A host flow log or packet capture would be stronger,
  and the container lacks `CAP_NET_RAW`.
- File and syscall rows depend entirely on the witness. OpenShell writes no per-access record for them.
- A full sandbox (Landlock, seccomp, network namespace) has not been run. That needs a VM with
  Docker 28 or later, or KVM (`docs/proofof/SANDBOX-V0.md` section 3). Provisioning that host is
  owner-gated; see section 10.

## 10. Owner-gated (HELD)

- Publishing this folder as an open package: **authorised** by the owner's brief of 2026-09-29
  ("publish the translator and adapter as an open package"), as an independent open example with no
  affiliation claim. See `harness/openshell-cedar/package/`.
- Any note to OpenShell's maintainers about the audit-mode record stays **HELD** (no outbound contact).
- A full-sandbox capture (file and syscall attempts under real Landlock and seccomp, with OCSF JSONL
  switched on) needs a credential-free VM with Docker 28+ or KVM. Owner ask: provision one, or say no.
