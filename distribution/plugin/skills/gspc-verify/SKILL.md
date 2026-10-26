---
name: gspc-verify
description: Verify a CSOAI / GSPC evidence artifact (csoai.evidence-event/0.1, csoai.signed-run/0.1 batch, csoai.safe-evidence-pack/0.1 pack, or csoai.route-evidence/0.1) using the deterministic offline verifier. Preserves original artifact digests, state vocabulary, and limitations without asking the language model to guess cryptographic validity.
compatibility:
  agentskills_spec: "0.1"
  python: ">=3.9"
  network: "none (offline deterministic check)"
allowed-tools:
  - "Bash(python3 packages/evidence-fabric/portable_skill_verify.py:*)"
  - "Read"
---

# GSPC & OSAIA SAFE Portable Verification Procedure (`gspc-verify`)

## Purpose and Scope

Given an existing CSOAI evidence artifact, identify the matching deterministic verification procedure, execute the supported offline checks via `packages/evidence-fabric/portable_skill_verify.py`, report the exact verifier state and reason, and preserve the original artifact digest and `limits[]`.

**Hard Rule:** Never ask a language model to decide whether an Ed25519 signature, SHA-256 digest, or Merkle proof "looks valid." Always invoke the deterministic verifier and quote its returned `verdict_state` and `artifact_sha256` verbatim.

## Supported Artifact Kinds

1. **OSAIA SAFE Evidence Pack Directory (`csoai.safe-evidence-pack/0.1`)**
   - Contains `FREEZE.json`, `SHA256SUMS`, `records/`, `events/`, `render/`.
   - Checked via `safe_pack_verify.py --offline --pack <DIR>`.
2. **Signed Evidence Batch (`csoai.signed-run/0.1` + `csoai.evidence-batch/0.1`)**
   - Checked via `verify.py <BATCH.json> <BATCH.signed.json> <EVENTS.jsonl> --did <DID.json>`.
3. **Standalone Evidence Event or Route Profile (`csoai.evidence-event/0.1`, `csoai.route-evidence/0.1`)**
   - Checked via `verify.py --structure <RECORD.json|EVENTS.jsonl>`.

## Procedure

Run the deterministic portable skill verifier:

```bash
python3 packages/evidence-fabric/portable_skill_verify.py --artifact <PATH> [--did <DID.json>] [--signed <BATCH.signed.json>] [--events <EVENTS.jsonl>]
```

## Preserved State Vocabulary

- **Batch / Signature Verdicts:** `VALID`, `INVALID`, `UNVERIFIABLE_KEY`, `UNCHECKABLE`
- **SAFE Pack Readback Verdicts:** `SELF_CONSISTENT_UNAUTHENTICATED_KEY`, `INVALID`, `UNCHECKABLE`
- **Structure-Only Verdicts:** `STRUCTURE_VALID`, `INVALID` (always reports `"signed": false`)
- **Six Evidence Event States:** `CONSISTENT`, `DIVERGENT`, `PARTIAL`, `UNMEASURED`, `UNCHECKABLE`, `NOT_DISCRIMINATING`

## Permission Boundary Note (`allowed-tools`)

The Agent Skills `allowed-tools` frontmatter field is an experimental client declaration and **not** an execution grant. When running cross-client portability evaluations, pass `--client-boundary-observation <STATE>` (`ENFORCED`, `PROMPTED_FOR_APPROVAL`, `REJECTED_ACTION`, `IGNORED_EXPERIMENTAL_DECLARATION`, or `UNMEASURED`) to record how the host client treated the declared tool boundary.

Measurement only: a card is evidence, never a grade, mark or endorsement. Verification is free.

Data: https://councilof.ai/api/gspc · Corrections ledger: https://councilof.ai/corrections/ (JSON: https://councilof.ai/api/corrections) · Verify a card, free: https://councilof.ai/gspc-verify/

Doctrine: `docs/DOCTRINE.md` sha256 `845fc1d200eb9e867fc8d682750409d6725084bac632726187759f8fefdfbe0a` (human page https://councilof.ai/doctrine/).
