# IETF: Tampering with Agent Logs (DRAFT — not submitted)

**Status:** Submitted to the IETF Independent Submission queue 2026-09-12; not yet published on datatracker (verified 2026-09-13). This text is the review copy.
**Date:** 2026-09-13 (v2 — stale counts replaced with live references)

## Abstract

As AI agents interact with external services and execute transactions, their logs become critical audit evidence. This draft examines tampering risks in agent log systems and proposes cryptographic mitigations.

## Problem Statement

Agent logs record:
- Tool invocations and results
- Payment transactions (x402, A2A)
- Evidence delivery and receipt
- Measurement provenance chains

Tampering risks include:
1. Log deletion or modification by the agent operator
2. Replay attacks on signed receipts
3. Merkle tree manipulation to hide entries
4. Timestamp manipulation to alter freshness claims

## Proposed Mitigations

1. **Append-only logs**: Each log entry includes the hash of the previous entry
2. **External witnessing**: Periodic inclusion in transparency logs (Rekor, OTS)
3. **Multi-key signing**: Separate signing keys for measurement, board, and root
4. **Client-side receipts**: Callers retain their own copy of signed evidence

## CSOAI Evidence

- Ed25519 signatures with DID-bound keys (did:web:csoai.org)
- Public Merkle root: current leaf count and root at https://councilof.ai/root.json (264 leaves as of 2026-09-13; re-fetch before citing)
- Rekor inclusion on every published root (latest index in https://councilof.ai/interop/root-witness-latest.json)
- OpenTimestamps: current and prior roots carry CONFIRMED Bitcoin block attestations (verified 2026-09-13) — pending stamps are auto-upgraded on a schedule and the witness sidecar is regenerated from proof bytes, never typed
- Superseded card ledger preserving historical cards
- Decline records: refused/unmeasurable subjects are logged as first-class entries (see companion draft-csoai-audit-use-case §6)
