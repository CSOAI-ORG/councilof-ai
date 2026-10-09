# SOVOS Open Sovereign Stack — independent readback and routing repair

Checked 23 September 2026 on existing RunPod `rp-3090-now`. This is an execution receipt, not a public launch claim.

## Verified baseline

- `/workspace/SOVOS/architecture/open-sovereign-stack-20260923/` and `/workspace/SOVOS/packages/sovos-product-spine/` exist.
- Baseline Product Spine: 13/13 tests pass. Constitutional Harness: 11/11 tests pass. All seven named JSON configuration/evidence files parse.
- The stored demo's embedded `bundle_sha256` (`5616c92542d6e4b1dd6b0751e4603f1b415b878acecbce7c4c7f069568eb2c0a`) matches a canonical JSON digest **excluding that field**. The raw `demo-e2e-result.json` file SHA-256 is `23a15fa131daa6bf136e8ae76e3e28697d6b3fdad88e05a4415bef054fef4a75`, so the embedded digest is not an exact-file-byte digest. Its single constitutional receipt log independently verifies to head `2412a59bf198e9cf1561d3db20a7620341184a3366e8c0be25431df48406b8f8`.
- A fresh replay was run from a private `/tmp` directory. Its receipt chain verified, with both CSOAI evidence states `UNMEASURED` and `executed_side_effect=false`.

## Material defects in the baseline

- First keyword match misroutes `draft and send customer email` to cognition; `publish evidence card` and `delete old evidence` to evidence-only; and `fix and deploy production patch` to remediation. These routes are inappropriate as an authorization boundary.
- Baseline remediation route omits SOVOS. Baseline incident route lists ASISecurity before AGISafe and SOVOS.
- The demo records the route but does not execute each plane. CSOAI and ASISecurity entries are synthetic dictionaries; AGISafe is a projection of the constitutional result, not a called AGISafe service. It emits one constitutional receipt, not a receipt at every authority boundary.
- The demo's `simulate` runtime mode is absent from `defoneos-v2.profile.json`. The configured corrections-ledger path does not exist on this pod. Plugin catalogue rows remain inventory, not admitted modules.

## Prepared repair, isolated from shared source

Local review copy: `/Users/nicholas/clawd/codex-sovos-spine-review-20260923/`.

RunPod review copy: `/workspace/lanes/codex-sovos-spine-review-20260923/`.

Reviewable patch: `/Users/nicholas/clawd/_alignment/SOVOS_SPINE_ROUTING_GATES_2026-09-23.patch`. It applies cleanly to the verified baseline copy.

The patch prioritizes mutation terms over read/draft terms, accepts an explicit effect declaration, rejects contradictory read-only declarations, and makes manifest validation reject enforcement routes missing prior AGISafe/SOVOS gates or a later CSOAI receipt. The manifest now places both gates before simulated enforcement on incident and remediation routes. The demo uses the declared `observe` mode and explicitly marks the AGISafe and ASISecurity services as uninvoked.

RunPod review-copy tests: **22/22 pass**. A fresh private-directory demo replay passes with `simulation_only=true`, `mode=observe`, `adapter_invoked=false`, `agisafe.service_invoked=false`, `executed_side_effect=false`, and a valid constitutional receipt chain. Reproduced routes:

| Request | Review-copy route |
| --- | --- |
| `draft customer email` | cognition |
| `draft and send customer email` | consequential action, all declared gates |
| `publish evidence card` | consequential action, all declared gates |
| `delete old evidence` | consequential action, all declared gates |
| `fix and deploy production patch` | consequential action, all declared gates |
| `contain compromised agent and revoke token` | incident, AGISafe then SOVOS then ASISecurity then CSOAI |

Review-copy SHA-256: `spine.py` `766a8f5f6ec26d912f1ad6bdb81e412814b7efb30bbbfc17541dc499126aca19`; `stack-manifest.json` `91b57e3468f377ffb1a05824ba4054feb061b448d5f07ed069db1b4a9e088ab8`; `demo_e2e.py` `ae42db68bfd94ea459a682b273e3433fc23ee530a9b891ffe5b0cd785837d543`. Mac and RunPod copies match. The shared original `spine.py` and manifest remain at baseline hashes `db5f4af02524defcfda3987b3f47209801e5a1c3c4eabdad3fffb8cf8faf093b` and `d5c31fc30da0d3211dde5223bda8761af6d27f2ff339c9f2551e0d0a94585599`.

## Release boundary

This repair is **prepared and tested**, not promoted into the shared SOVOS files, a live executor, or the public site. Free-text routing still cannot authorize a tool by itself. Real execution requires a structured effect/capability intent, AGISafe and constitutional checks at the tool boundary, real adapters with per-boundary receipts, a valid correction source, and readback of the exact public bytes. Do not describe the existing demo as a completed remediation or an independently measured result.
