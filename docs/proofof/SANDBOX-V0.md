# proofof.ai — the experimental twin, v0

Status: **design + spike, not deployed.** Lane `proofof-sandbox-20260925`, written 25 Sep 2026.
Nothing in this lane changed DNS, the live proofof.ai zone (it still 301s to councilof.ai),
councilof.ai, or any signing key. The fixture in `spike-20260925/` is a toy run, not a measurement.

## 1. What the twin is, and what it is not

Owner ruling, 25 Sep 2026: the mirrored sandbox ("experimental twin") lives on **proofof.ai**, a
product line separate from the measurement body on councilof.ai. The separation exists so the twin can
run experiments without touching councilof.ai's independence.

Doctrine for the twin (binding on every runtime choice below):

1. **Default-deny runtime.** Filesystem, network and process access are denied unless a policy names them.
2. **No production credentials ever enter it.** It gets no board-sign token, no Cloudflare token, no HF
   write token, no RunPod key, no wallet. It does not run on a host that holds one (see §4.3).
3. **Synthetic, public or rights-cleared data only.** Every input carries a manifest with its licence.
4. **Every run emits a replayable, signed event record** (§5).
5. **Nothing is promoted out without independent reproduction** (§6).
6. **It never publishes to councilof.ai.** It has no deploy path, no push rights and no signer there.
   A twin result is never a measurement. A promoted result reaches councilof.ai as an *input* that
   councilof.ai measures with its own pipeline, and it stays UNMEASURED until that happens.

This replaces the 11 Sep plan in `docs/product/DOMAIN-REDIRECT-MAP-2026-09-11.md`, which gave proofof.ai
to the receipt generator. That file needs a one-line pointer to this ruling when this lane lands.

## 2. Runtime evaluation

### 2.1 NVIDIA OpenShell

- **Licence:** Apache-2.0. Checked with the GitHub API on 2026-09-25
  (`gh api repos/NVIDIA/OpenShell` → `license.spdx_id = "Apache-2.0"`; repo created 2026-02-24, pushed
  2026-09-25, status badge "alpha").
- **Releases:** latest stable `v0.0.116` (2026-08-28). `v0.1.0-pre.11` is the newest prerelease tag.
  The rolling `dev` build tested here was `0.0.117-dev.289+gc93fd94a5`.
- **What it needs** (README and `docs/reference/support-matrix.mdx`, main branch, read 2026-09-25):
  - a gateway plus a **compute driver**: Docker Engine ≥ 28, Podman 5.x (rootless), Kubernetes ≥ 1.29 with
    an enforcing CNI, or a MicroVM (libkrun/QEMU, which needs **KVM** on Linux);
  - kernel: **Landlock ABI ≥ 3 (Linux 6.2+)**, seccomp user notification with nested filters and
    `SECCOMP_IOCTL_NOTIF_ADDFD` + `ADDFD_FLAG_SEND`, and same-UID task-memory access. `WAIT_KILLABLE_RECV`
    (5.19+) is recommended, and without it the sandbox runs in a "legacy read-only" mode;
  - a mandatory **outer network fence** owned by the driver: Docker `network_mode=none`, a VM with no NIC,
    or a Kubernetes NetworkPolicy (`architecture/sandbox.md`, "Isolation Layers");
  - **GPU is optional** and experimental (`--gpu`, NVIDIA Container Toolkit). A CPU-only host is enough.
- **Policy model** (`architecture/security-policy.md`): declarative YAML, `version: 1`, fail-closed parser
  (unknown fields reject the document). Filesystem is enforced by Landlock and process by an
  immutable non-root UID with zero caps and `no_new_privs`. Both are **locked at sandbox creation**.
  Network (`network_policies`, per host/port/binary, optional L7 method/path rules) and provider
  attachments are **hot-reloadable** (`openshell policy set --wait`). If no rule matches, the request is
  denied, and explicit deny beats allow. Decisions are emitted as **OCSF** events (the `openshell-ocsf`
  crate ships OCSF v1.7.0 schemas). A standalone `openshell-prover` checks policies before they run.
- **Telemetry is default-on.** The twin must set `OPENSHELL_TELEMETRY_ENABLED=false` or run binaries built
  with `--no-default-features --features defaults-without-telemetry` (README, "Telemetry").

### 2.2 Spike results on a RunPod CPU pod (tested, not assumed)

Host: pod `1l6y59gv9wmgif`, secure cloud US-CA-2, 2 vCPU / 4 GB, image `runpod/base:0.6.2-cpu`
(Ubuntu 20.04 userland), kernel **6.17.0-35-generic**. The container runs as root inside a
userns-remapped Docker (`/var/lib/docker/655360.655360`) with the default capability set
(`CapBnd=0xa80405fb`, no `CAP_SYS_ADMIN`/`CAP_NET_ADMIN`), seccomp mode 2, and no `/dev/kvm`, docker,
podman or kubectl. Full transcript: `spike-20260925/evidence/runtime-probes.txt`.

| Candidate | Result in the RunPod container |
|---|---|
| OpenShell `v0.0.116` `openshell-sandbox --policy-rules --policy-data -- cmd` (gateway-less standalone mode) | **Fails closed.** It forces proxy mode, which needs a network namespace: "Network namespace creation failed and proxy mode requires isolation. Ensure CAP_NET_ADMIN and CAP_SYS_ADMIN are available". Release checksums verified. |
| OpenShell `dev` in-workload boundary, `openshell-sandbox capability-probe` (uid 999, `CapBnd=0`, NNP=1) | **Qualifies.** `"qualified":true`, `landlock_abi:7`, `seccomp_notification`, `seccomp_addfd_send`, `socket_virtualization`, `tcp_deny_round_trip`, `seccomp_listener_mode:"killable"`. The kernel primitives OpenShell needs are present. |
| Full OpenShell (gateway + driver) | **Blocked.** It has no driver and no outer fence here: no Docker daemon (DinD needs privileges RunPod does not grant), no KVM for MicroVM, no Kubernetes, and `unshare -n` returns EPERM. |
| gVisor `runsc` release-20260921.0 (`--rootless` and root, `--network=none`) | **Fails**: `fork/exec /proc/self/exe: operation not permitted` (namespace creation denied). |
| bubblewrap 0.4.0 | **Fails**: "Creating new namespace failed: Operation not permitted" (no user namespaces). |
| firejail 0.9.62 `--net=none` | **Fails open, which is dangerous.** "an existing sandbox was detected… will run without any additional sandboxing features" and `curl https://example.com` returned **HTTP 200**. Never use it as a fallback. |
| **twinrun v0** (this lane: Landlock fs + Landlock TCP + seccomp + zero caps + NNP + non-root, Python stdlib) | **Works.** All 6 predicted denies were enforced and both allowed actions succeeded. The replay reproduced the run. The no-boundary control leaked everything. See §7. |

**Verdict on OpenShell:** it cannot run as a full product inside a RunPod container. Its outer fence and
driver both need a real VM or a Docker/Podman/Kubernetes host. It *does* run where we control a VM with
Docker ≥ 28 and Linux ≥ 6.2: an Oracle Ampere A1 (free tier), any KVM-capable VM, or a laptop's
Docker Desktop VM. Its inner boundary qualifies on RunPod's 6.17 kernel, so the pod kernel is not the
blocker. Container privileges are.

### 2.3 Cloudflare Sandbox SDK (docs only, not tested)

- "Available on Workers Paid plan" (developers.cloudflare.com/sandbox/, last updated 2026-08-13). It is built
  on Containers, billed per 10 ms of activity on top of the $5/month Workers Paid plan with included
  vCPU-minutes / GiB-hours (developers.cloudflare.com/containers/pricing/, read 2026-09-25).
- Isolation: "Each sandbox runs in a separate VM" (…/sandbox/concepts/security/, last updated 2026-08-28).
- **Egress is allowed by default.** `enableInternet = false` blocks it, and `allowedHosts` turns into a
  deny-by-default allowlist. Outbound handlers are hot-reloadable
  (…/sandbox/guides/outbound-traffic/, last updated 2026-08-28).
- Fit: strong isolation with no host to run, but it is **owner spend** and makes Cloudflare a runtime
  dependency of the twin. Default-deny has to be configured, because it is not the default. Use it only if §4's
  self-hosted path cannot be staffed.

## 3. Decision

- **Target runtime (v1): OpenShell, Docker driver, on a dedicated VM** (Docker ≥ 28, kernel ≥ 6.2,
  telemetry off, pinned release with verified checksums, policies checked by `openshell-prover` before use).
  Its OCSF deny events become the primary source of the event log (§5), replacing agent self-report.
- **Interim runtime (v0), and fallback: twinrun** (this lane) on a fresh RunPod CPU pod per run. It uses the
  same kernel primitives OpenShell's inner layer uses, and the spike showed they are present and enforced on RunPod.
- **Not used:** firejail (fails open in containers), bubblewrap and gVisor (need namespaces RunPod denies).
  Cloudflare Sandbox SDK is held in reserve and needs owner spend.

## 4. Architecture

```
            proofof.ai  (Cloudflare Pages project `proofof-ai`, free tier, static)
            ├─ /            what the twin is, the doctrine in §1, schema, promotion gate
            ├─ /runs/       index of published run records (record.json + events.jsonl + sig)
            └─ /replay/     (later) client-side viewer: fetch record, recompute sha256 in the
                            browser, verify Ed25519 with WebCrypto, render the event tree
                                   ▲ static files only; no Functions, no secrets, no API
                                   │ (published by a human-reviewed PR, never by the runner)
   ┌───────────────────────────────┴──────────────────────────────┐
   │ records store (proofof namespace; NOT csoai, NOT councilof)  │
   └───────────────────────────────▲──────────────────────────────┘
                                   │ signed record bundle (pulled by an operator)
   ┌───────────────────────────────┴──────────────────────────────┐
   │ runner host — fresh, credential-free                          │
   │   v0: ephemeral RunPod CPU pod, no network volume attached    │
   │   v1: dedicated VM with Docker ≥ 28 (OpenShell gateway)       │
   │   recorder (trusted) ──► boundary ──► agent (untrusted)       │
   └───────────────────────────────────────────────────────────────┘
```

4.1 **Front door.** proofof.ai becomes its own Pages project serving static HTML only. It describes the twin
and lists records. It carries no councilof.ai branding claims, no scores, no "measured" language and no
link that implies a twin run is a measurement. The replay viewer comes later and is purely client-side.

4.2 **Runner.** One run is one fresh host. The recorder sits outside the boundary, owns the event log,
and signs the record. The agent runs inside the boundary and can only report its actions to a pipe the
recorder reads. Egress is denied entirely in v0. v1 opens specific hosts through OpenShell
`network_policies` (hot-reloadable) and records every allow and deny as it happens.

4.3 **Host hygiene (credential isolation).** The twin must **never** run on `oracle-micro-2` (it holds
the board-sign pod token, the HF write token and a RunPod key) or on the 3090 pod `fpowppss5ngtkw` (it holds
the wrangler OAuth login and deploy tooling). Open check: RunPod may inject a pod-scoped `RUNPOD_API_KEY`
into container env. twinrun v0 passes the recorder's environment through `execv`, so v0.1 must
`execve` with an explicit minimal env, and the first v0.1 run must record `env` keys (names only) as an event.

## 5. Event record schema (v0, as emitted by the spike)

One JSON object per line (`events.jsonl`), keys sorted, compact separators. The file's sha256 is pinned in
`record.json`, which is signed.

| Field | Meaning |
|---|---|
| `event_id` | `<run_id uuid4>:<4-digit sequence>` |
| `parent` | `event_id` of the causing event (`null` for `run.start`) |
| `ts` | UTC, millisecond precision, recorder clock |
| `action` | `run.start`, `selftest.*`, `fs.read`, `fs.write`, `net.connect`, `net.dns`, `proc.exec_net`, `run.end` |
| `target` | path, `host:port`, or command |
| `policy_decision` | what the **recorder** predicts from the declared policy, computed independently of the kernel |
| `enforced` | what the **kernel** did (`allow`/`deny`, from success or errno) |
| `consistent` | `policy_decision == enforced`. A `false` is recorded, never dropped |
| `result_sha256` | sha256 of the action's output bytes, or of the error string |
| `detail` | errno name or stderr excerpt (`EACCES` = Landlock, `EPERM` = seccomp) |
| `run.start` extras | `runtime`, `kernel`, `landlock_abi`, `policy_sha256`, `agent_sha256`, `argv`, `uid_target` |

`record.json` (schema `proofof.twin.run-record/v0`) pins: `events_sha256`, `policy_sha256`,
launcher/agent/interpreter sha256, kernel, host, the OpenShell capability-probe report, the replay run's
sha256 and match result, and the no-boundary control. `record.json.sig` holds an Ed25519 signature over
`record.json`'s exact bytes, and `record.pub` holds the raw public key (base64).

**v1 changes (planned, not built):** `prev_sha256` hash chain per line; `source` =
`supervisor` (OpenShell OCSF) | `agent-report`, with only supervisor events able to set `enforced`; OCSF
`class_uid` and `activity_id` carried through; a dedicated twin signer `did:web:proofof.ai#twin-run-1`
with the key held only by the operator's signing step, **never** `did:web:csoai.org#board-attestation-1`
or any councilof.ai key; the record's sha256 OpenTimestamps-anchored like other estate records.

## 6. Promotion gate (twin → anywhere outside proofof.ai)

A twin result leaves proofof.ai only if **all** of these hold. Each is a check someone other than the
runner can execute:

1. `verify.py`-equivalent passes: SHA256SUMS, record pins the events file, and the signature verifies.
2. **Independent reproduction.** A second party runs the pinned policy + agent + inputs on
   **independent compute**, not the original runner host, and reproduces the `result_sha256` sequence
   exactly, or within a tolerance declared *before* the first run. This is not the same thing as
   same-host replay (which the spike did), and it is the only check that counts for promotion.
3. Zero `consistent: false` events. Every predicted deny is enforced, and no deny is followed by an
   unexplained allow of the same target.
4. The input manifest shows every input is synthetic, public or rights-cleared, with its licence.
5. A human opens the promotion PR. The runner has no credential that could do it.
6. On councilof.ai the promoted artifact is an **input**. It is measured by councilof.ai's own pipeline
   and stays UNMEASURED there until that happens. The twin's numbers are never quoted as measurements.

## 7. Spike fixture (`spike-20260925/`)

Toy agent task: read `/twin/task/input.json`, compute `sum(1..100)`, write it to the one writable dir,
then try the forbidden actions.

| # | action | target | policy | kernel | detail |
|---|---|---|---|---|---|
| 0002 | selftest.landlock_net_only | 1.1.1.1:443 | deny | deny | EACCES (Landlock TCP rule alone, no seccomp) |
| 0003 | fs.read | /twin/task/input.json | allow | allow | |
| 0004 | fs.write | /twin/scratch/result.txt | allow | allow | `sum(1..100)=5050` |
| 0005 | fs.read | /opt/forbidden/prod-credential.canary | deny | deny | EACCES (synthetic canary, not a credential) |
| 0006 | fs.write | /twin/task/tamper.txt | deny | deny | EACCES |
| 0007 | net.connect | 1.1.1.1:443 | deny | deny | EPERM (seccomp) |
| 0008 | net.dns | example.com | deny | deny | resolution failed |
| 0009 | proc.exec_net | curl https://example.com | deny | deny | child inherits the boundary; `curl: (6)` |

- `run1/events.jsonl` sha256 **`5ff6b2f17c9c9546439c816a75d5d61be8c48415f19f4eb42ca3cccbd3313811`**
  (10 events, run `2bf30d08-0517-4c80-b4ca-82fe9f89e2c7`, 2026-09-25T07:50Z).
- `run1/record.json` sha256 `4db63e304dc87707fc6d944e62c35f124533f69155f68e72e8891dd986b00887`, signed with an
  **ephemeral** Ed25519 key (public `BHmAzqsyAh6zs6M1Brc+6bVZ+wZMkdpbvHf/5/EQorM=`). The key was generated in
  memory on the pod and discarded. It proves the bytes are unaltered. It does not prove who produced them.
- Same-host replay `run1/replay-run2.events.jsonl` (sha256 `1bc1f71e…d5805`) reproduced all 8 action events
  (action, target, decision, enforced, result_sha256). The ids and timestamps differ, as expected.
- Control `run1/control.jsonl`: the same agent **without** the boundary succeeded at all 7 actions, including
  the canary read and HTTPS egress. So the denies come from the boundary and not from the environment.
- Verify: `python3 docs/proofof/spike-20260925/verify.py` (needs `cryptography` for the signature step).
- Cost: pod `1l6y59gv9wmgif` ran 07:43:21Z–07:51:48Z at $0.06/h ≈ **$0.01**, then was terminated.

**Known limits of twinrun v0.** Each one is a reason v1 is OpenShell and not this:
(a) agent self-report: the agent tells the recorder what it tried. The kernel verdict is real, but an agent
could stay silent about an attempt, and OpenShell's supervisor-side OCSF events fix this;
(b) no outer fence: seccomp blocks `AF_INET`/`AF_INET6`/`AF_PACKET` sockets and `io_uring_setup`,
Landlock blocks TCP bind/connect, but `AF_UNIX` and `AF_NETLINK` stay open inside the same kernel;
(c) x86_64 only. Foreign-arch and x32 syscalls are killed;
(d) `/etc` is readable, so the image must hold no secrets there;
(e) the env is inherited (§4.3);
(f) the signing key is ephemeral and not anchored.

## 8. What is needed from the owner

1. **DNS / Pages:** create a Cloudflare Pages project `proofof-ai` (free tier) and point proofof.ai at it,
   replacing the zone's 301 to councilof.ai. This is a DNS change only the owner makes. Optionally add null
   SPF (`v=spf1 -all`) + DMARC `p=reject`, because proofof.ai is a non-sending domain with no records today
   (`docs/handoff/DNS_EMAIL_AUTH_RECORDS.md`).
2. **v1 runner host:** an Oracle Cloud **Ampere A1** free-tier VM (4 OCPU / 24 GB; Ubuntu 24.04 image, kernel 6.8 — Landlock ABI ≥ 3)
   that holds **no** estate credentials, to run OpenShell with the Docker driver. This is $0 but needs the
   owner's Oracle console. The alternative is a small KVM-capable VM (owner spend).
3. **Twin signing key:** approve a dedicated key `did:web:proofof.ai#twin-run-1`, which needs a
   `/.well-known/did.json` on proofof.ai. It must stay separate from the board-attestation key.
4. **Records store:** choose where signed run records live under a proofof namespace (for example a
   `proofof` HF org or an R2 bucket). They must not go in `csoai` or councilof.ai.
5. **Only if the self-hosted path is refused:** Cloudflare Workers Paid ($5/month plus Containers usage)
   for the Sandbox SDK, configured with `enableInternet = false`.
