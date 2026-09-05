# HF Signing / Attesting / Timestamping / Anchoring — extracted moves

**Source brief:** `~/Downloads/compass_artifact_wf-8ab69aa0-93af-5cf5-8bc7-16bd5a7f7824_text_markdown (1).md`
**Mined:** 2026-09-05, TUI-5 (research-intake lane)
**Rule:** the `already live?` column is a PROBE RESULT taken at mine time, never an assumption.
Probe commands are in the Evidence column so a stranger re-runs them.

| move | lane-doable? | owner-gated? | already live? (probed) | evidence |
|---|---|---|---|---|
| **`npm publish --provenance`** on csoai-gspc-mcp | no (CI + repo) | **YES** | **CONFIRMED MISSING** — `dist` has no `attestations` key on 0.2.1 | `curl -s https://registry.npmjs.org/csoai-gspc-mcp/latest` |
| PyPI Trusted Publishing + PEP 740 attestations | no (CI) | **YES** | `csoai` on PyPI 200; attestation state not probed — UNMEASURED | `curl -s https://pypi.org/pypi/csoai/json` |
| OpenTimestamps one Merkle root (not N leaves) — free calendars | no (CI) | **YES** | **MISSING** — no `ots`/`anchor` field on deployed `root.json` | `curl -s https://councilof.ai/root.json` |
| EAS on Base — SchemaRegistry.register then EAS.attest | no — wallet | **YES** | facts.json marks the EAS rail `planned`; code refuses to mint | `client/src/data/facts.json` rail `eas` |
| `actions/attest-build-provenance` over cards + root.json + snapshots | no (workflows) | **YES** | not probed | — |
| cosign sign Spaces/container images **by digest, not tag** | no | **YES** | not probed | — |
| Archive eval harness to **Software Heritage**, cite SWHID | no | **YES** | no `swh`/`software-heritage` slug | slug probe |
| Re-mint stale HF DOI on current commit; Zenodo concept/version DOIs | no | **YES** | Zenodo DOI resolves 200; staleness not probed | `curl -sIL https://doi.org/10.5281/zenodo.21991104` |
| **A `.well-known` door publishing the anchor posture** (what is signed, what is anchored, what is neither) | **YES** | no | **MISSING** | no anchor-posture door in 193 |

## The one gap this brief nails

The estate preaches *"signed, re-attested"* while its own deployed `root.json` carries an
`sig_ed25519` **and no anchor reference of any kind** — no OTS, no Rekor, no EAS. The brief's
phrasing is exact: *"Do not preach 'signed re-attest' while your own root lacks it."*

`facts.json` already models this honestly (3 live anchors; OTS in the `excluded` field as
*stamped, not anchored*; EAS `planned`). What is missing is a **public door that states the
anchor posture** so a stranger can read it without cloning the repo. That is lane-doable.
