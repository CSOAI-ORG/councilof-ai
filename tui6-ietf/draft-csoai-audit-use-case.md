# IETF AUDIT Use-Case Scope (DRAFT — submitted, awaiting datatracker publication)

**Status:** Submitted to the IETF Independent Submission queue 2026-09-12; not yet published on datatracker (verified 2026-09-13). This text is the review copy.
**Date:** 2026-09-13 (v2 — stale counts replaced with live references; §6 added)
**Author:** CSOAI Ltd (UK 16939677)

## Abstract

This draft describes the use of cryptographic receipts and measurement cards for AI governance audit trails. CSOAI operates a public measurement board covering 22 governance/safety/provenance/continuity axes, where each accepted measurement is issued as an Ed25519-signed card, included in a public Merkle root, and witnessed in the Rekor transparency log and the Bitcoin chain via OpenTimestamps.

Live state (re-fetch before citing — counts advance):
- Board: https://councilof.ai/api/gspc (22 axes, all measured)
- Public root: https://councilof.ai/root.json (leaf count, Merkle root, signature)
- Witness sidecar: https://councilof.ai/interop/root-witness-latest.json (Rekor index, OTS status)

## Motivation

Organizations deploying AI systems need auditable evidence of model behaviour. Current approaches lack:
1. Cryptographic binding between measurement and result
2. Independent verifiability without trusting the measurement provider
3. Reproducible provenance from source run to published card

## Proposed Scope

- Measurement card format (card-v0 schema)
- Ed25519 signature verification under DID-anchored keys (did:web:csoai.org)
- Merkle root inclusion proofs
- Rekor transparency-log witnessing and OpenTimestamps Bitcoin anchoring
- x402 payment-gated evidence delivery

## Evidence (verified 2026-09-13)

- Public root: 264 signed leaves, Merkle root and Ed25519 envelope signature verifiable at https://councilof.ai/root.json
- Bitcoin anchor: current and prior roots carry OpenTimestamps proofs with confirmed Bitcoin block attestations (verify: https://councilof.ai/interop/root-witness-latest.json)
- Rekor witnessing: every published root carries a Rekor inclusion (latest index in the witness sidecar)
- Historical corpus: 335 signed cards under a separate published key (did:web:csoai.org#card-attestation-1), a corpus deliberately separate from the public root (zero identifier overlap, by design)
- Verification guide: https://councilof.ai/signed/HOW-TO-VERIFY.md
- Corrections ledger (48 public corrections): https://councilof.ai/api/corrections

## 6. Decline Records (additive — responds to community review)

Reviewers of receipt-style audit formats (notably the vaara-receipt thread, draft-sirkkavaara-vaara-receipt) identified a gap this design explicitly addresses: a counter-based audit log cannot distinguish "the system declined to act at a boundary" from "no record exists."

This draft therefore requires: when a measurement pipeline refuses, declines, or cannot measure a subject (no live provider, transport failure, unverifiable identity), it MUST emit a decline record carrying the subject identity, the boundary hit, the reason code, and the same evidence binding as a measurement card. Decline records are first-class log entries — they enter the same Merkle tree, so the absence of a measurement is itself auditable, and a silent gap is distinguishable from a recorded refusal.

This section is additive: it extends the card format with a decline kind and changes nothing about measurement cards.

## Limitations

- This is measurement infrastructure, not a certification body
- Cards measure model behaviour against frozen banks, not deployed system compliance
- Regulatory crosswalks are mappings, not legal determinations
- A Bitcoin anchor proves the bytes existed by the named block; it says nothing about whether any measurement inside them is correct
