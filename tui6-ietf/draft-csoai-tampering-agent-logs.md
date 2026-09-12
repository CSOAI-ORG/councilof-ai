# IETF: Tampering with Agent Logs (DRAFT — not submitted)

**Status:** DRAFT prepared for review. Not submitted without owner approval.
**Date:** 2026-09-12

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

- Ed25519 signatures with DID-bound keys
- Merkle root with 169 leaves
- Rekor inclusion at log index 2791822965
- OTS submission pending Bitcoin confirmation
- Superseded card ledger preserving historical cards
