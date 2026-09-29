# OpenShell v0.1.1 → v0.1.2: requalification of the declared-vs-observed adapter

Read 2026-09-29 from the public repository (github.com/NVIDIA/OpenShell), anonymously: the releases
API and a blobless clone on the lanes pod. The machine-readable version is
[`controls-diff.json`](controls-diff.json). The adapter is now pinned to v0.1.2
(`adapter.OPENSHELL_PIN`, adapter 0.2.0).

## What changed that matters

1. **Loopback wording (PR 3740, docs only).** v0.1.1 said loopback, link-local and unspecified
   addresses "are always blocked". v0.1.2 says network policy never *authorizes an outbound
   endpoint* there, and that this "does not apply to sandbox-local loopback connections". The rego
   is byte-identical (`4a17fe93…`), so the behaviour did not change; the declaration did. The
   adapter used to call any witnessed loopback connection DIVERGED. It now leaves one with no
   enforcer record UNMODELLED (`LOOPBACK_OFF_POLICY_PATH`), because it cannot tell a sandbox-local
   service from an escape. Link-local (including 169.254.169.254) is unchanged.
2. **Mediated CONNECT fix (PR 3745).** Bytes a workload sent right behind the synthesized CONNECT
   header could be dropped. No declared control changed, but a v0.1.1 witness could see a
   permitted request fail. Captures must state `--enforcer-version`.
3. **Unchanged:** the policy rego, the prover, OCSF, policy and policy-schema crates, and every
   other declared control the adapter reads.

On `main` (not released): MCP method classification in the rego, 403 on Upgrade for MCP/JSON-RPC,
and the MCP 2026-07-28 revision. They touch only rule types this harness leaves UNMODELLED /
UNCHECKABLE; requalify when a release carries them.

## Baseline

The committed capture (`capture-2026-09-28/`) was already made with the v0.1.2 supervisor. What was
missing was this record of the v0.1.1 → v0.1.2 delta.

## Prover outputs

`prover-fixtures/runs/*.prover.json` are outputs of the published `openshell-prover` 0.1.2 release
binary (tarball sha256 `e1c9db66…`, checksum-verified; binary sha256 `3e80c0d0…`), run on the lanes pod
with `prover-fixtures/capture.sh`.
