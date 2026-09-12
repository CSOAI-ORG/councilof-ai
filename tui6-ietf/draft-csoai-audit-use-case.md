# IETF AUDIT Use-Case Scope (DRAFT — not submitted)

**Status:** DRAFT prepared for review. Not submitted without owner approval.
**Date:** 2026-09-12
**Author:** CSOAI Ltd (UK 16939677)

## Abstract

This draft describes the use of cryptographic receipts and measurement cards for AI governance audit trails. CSOAI produces Ed25519-signed measurement cards covering 22 governance axes across 155 models, with Merkle root inclusion and Rekor transparency-log witnessing.

## Motivation

Organizations deploying AI systems need auditable evidence of model behaviour. Current approaches lack:
1. Cryptographic binding between measurement and result
2. Independent verifiability without trusting the measurement provider
3. Reproducible provenance from source run to published card

## Proposed Scope

- Measurement card format (card-v0 schema)
- Ed25519 signature verification
- Merkle root inclusion proofs
- Rekor transparency-log witnessing
- x402 payment-gated evidence delivery

## Evidence

- 1,493 signed measurement cards on councilof.ai
- 169-card public Merkle root
- Rekor log index 2791822965
- 335-card historical corpus with separate signing key

## Limitations

- This is a measurement infrastructure, not a certification body
- Cards measure model behaviour, not deployed system compliance
- Regulatory crosswalks are mappings, not legal determinations
