# Escrow Key Rotation Procedure

This document details the procedure for rotating cryptographic keys used in the Sovereign Data Escrow Protocol, ensuring the long-term security and integrity of sensitive data.

## 1. Purpose
Regular key rotation is a fundamental security practice that minimizes the risk associated with compromised keys and enhances the overall cryptographic hygiene of the escrow system.

## 2. Key Types
- **Data Encryption Keys (DEKs):** Used for encrypting individual data records.
- **Key Encryption Keys (KEKs):** Used for encrypting DEKs.
- **Shamir Secret Sharing Keys:** Used for cryptographic destruction of data.

## 3. Rotation Process
- **Automated Rotation:** Scheduled automatic rotation of DEKs and KEKs.
- **Manual Trigger:** Ability to initiate manual rotation in response to security incidents or policy changes.
- **BFT Council Oversight:** Key rotation events are subject to BFT Council attestation and recorded in the SIGIL Ledger.

## 4. Verification and Audit
- **Post-Rotation Verification:** Comprehensive checks to ensure all data remains accessible and correctly encrypted with the new keys.
- **Audit Trail:** Detailed logs of all key rotation activities are maintained in the SIGIL Ledger, providing an immutable audit trail.
