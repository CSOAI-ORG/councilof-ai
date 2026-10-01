# IETF AUDIT Use-Case Scope (DRAFT — submitted review copy)

**Status:** Submitted to the IETF Independent Submission queue 2026-09-12. This repository copy does not assert datatracker publication; verify the external submission state before citing it.
**Date:** 2026-10-01 (v3 — changing counts removed from prose; current live-readback receipt added; §6 retained)
**Author:** CSOAI Ltd (UK 16939677)

## Abstract

This draft describes the use of cryptographic receipts and measurement cards for AI governance audit trails. CSOAI operates a public measurement board across governance, security/safety, provenance and continuity axes. The live API currently derives 23 axes / 23 measured, but this document treats that count as changing state rather than a protocol constant. Accepted public-root leaves are content-addressed; signed artifacts use DID-published Ed25519 keys, and the public root is independently witnessed via Rekor and OpenTimestamps.

Live state (re-fetch before citing — counts advance):
- Board: https://councilof.ai/api/gspc (derive current axis and measured-axis counts from totals; do not copy a stale typed count)
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

## Evidence (live references; point-in-time receipt refreshed 2026-10-01)

- Public root: fetch https://councilof.ai/root.json for the current leaf count, Merkle root and envelope state. Do not hard-code a historical leaf count in this draft.
- Bitcoin anchor: fetch https://councilof.ai/interop/root-witness-latest.json and require the exact-root OpenTimestamps state to be derived from the proof bytes; the current readback reports CONFIRMED_BITCOIN.
- Rekor witnessing: read the exact-root Rekor status and log index from the same witness sidecar rather than assuming every future root has completed witnessing.
- Historical signed-card corpus: read https://councilof.ai/signed/card_index.json as its own population. It is deliberately not interchangeable with the public-root leaf population.
- Verification guide: https://councilof.ai/signed/HOW-TO-VERIFY.md
- Corrections ledger: https://councilof.ai/api/corrections. Count corrections from the served body and require signature_state VALID; do not hard-code the count here.
- Point-in-time machine-readable readback used for this revision: measurement/ietf-audit-live-readback-2026-10-01.json.

## 6. Decline Records (additive — responds to community review)

Reviewers of receipt-style audit formats (notably the vaara-receipt thread, draft-sirkkavaara-vaara-receipt) identified a gap this design explicitly addresses: a counter-based audit log cannot distinguish "the system declined to act at a boundary" from "no record exists."

This draft therefore requires: when a measurement pipeline refuses, declines, or cannot measure a subject (no live provider, transport failure, unverifiable identity), it MUST emit a decline record carrying the subject identity, the boundary hit, the reason code, and the same evidence binding as a measurement card. Decline records are first-class log entries — they enter the same Merkle tree, so the absence of a measurement is itself auditable, and a silent gap is distinguishable from a recorded refusal.

This section is additive: it extends the card format with a decline kind and changes nothing about measurement cards.

## Limitations

- This is measurement infrastructure, not a certification body
- Cards measure model behaviour against frozen banks, not deployed system compliance
- Regulatory crosswalks are mappings, not legal determinations
- A Bitcoin anchor proves the bytes existed by the named block; it says nothing about whether any measurement inside them is correct
