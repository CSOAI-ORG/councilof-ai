# SOV33 SIGIL Format Specification

**Version:** 1.0.0  
**Date:** 14 July 2026

---

## What is SIGIL?

**SIGIL** = **S**overeign **I**ntegrity **G**uard for **I**nterchangeable **L**ogging

A cryptographic provenance trail using **Ed25519** signatures. Every SOV33 response is SIGIL-signed before delivery.

## Format

```
{signer_did}:{role}:{timestamp}:{content_hash}:{prev_hash}:{sig_bytes}
```

### Fields

| Field | Type | Description |
|-------|------|-------------|
| `signer_did` | string | W3C DID of the signer (e.g., `did:csoai:nicholas-001`) |
| `role` | string | Signer role (e.g., `sov_brain_v2`, `owem_compliance`, `bft_33_council`) |
| `timestamp` | ISO 8601 | UTC timestamp with microsecond precision |
| `content_hash` | hex | SHA-256 hash of the response content (64 chars) |
| `prev_hash` | hex | SHA-256 hash of the previous SIGIL in the chain (or `0`*64 for genesis) |
| `sig_bytes` | hex | Ed25519 signature over (content_hash + prev_hash) (128 chars) |

### Example

```
did:csoai:nicholas-001:sov_brain_v2:2026-07-14T05:30:00.123456Z:a3f5b8c2d1e9f4a7b6c3d8e1f5a9b2c4d7e1f3a8b5c9d2e4f6a8b1c3d5e7f9a1:b8c4d7e1f3a8b5c9d2e4f6a8b1c3d5e7f9a1b8c4d7e1f3a8b5c9d2e4f6a8b1c3:7e2a4b8c1d9f3a5e7b2c8d4f1a9b6c3e5d8f2a4b7c1e9d3f5a8b2c6e4d9f1a3b5c7e2a4b8d1f9a3c5e7b2c8d4f1a9b6c3e5d8f2a4b7c1e9d3f5a8b2c6e4d9f1a3b5c
```

## Chain Integrity

Each SIGIL includes the **prev_hash** of the previous SIGIL. This makes the chain **tamper-evident**:

- **No one** can modify a past SIGIL without breaking all subsequent SIGILs
- **Verification**: walk the chain, confirm each prev_hash matches the previous content_hash + sig
- **BFT-33 attestation**: critical decisions get cross-signed by 23+ voters

## Verification

```python
import hashlib
from nacl.signing import VerifyKey

def verify_sigil(sigil, prev_sigil):
    parts = sigil.split(':')
    signer, role, ts, content_hash, prev_hash, sig = parts
    
    # Verify chain
    if prev_sigil:
        prev_parts = prev_sigil.split(':')
        if prev_parts[3] != prev_hash:
            return False, "Chain broken"
    
    # Verify signature
    message = (content_hash + prev_hash).encode()
    verify_key = VerifyKey(bytes.fromhex(signer_pubkey(signer)))
    try:
        verify_key.verify(message, bytes.fromhex(sig))
        return True, "OK"
    except:
        return False, "Signature invalid"
```

## Use Cases

1. **Audit trail**: every SOV33 response is provably traceable
2. **Repudiation prevention**: SOV33 cannot deny what it said
3. **Tamper detection**: any modification to past responses breaks the chain
4. **BFT consensus**: 23+ voters cross-sign critical decisions
5. **W3C DID compliance**: every signer has a sovereign identity

## Sovereign Wallet

- **Public key**: `QD595cz6iQaEaYOjwwgLmMdoz1mtm1pzKBb9ygvMvf3xhQ28`
- **W3C DID**: `did:csoai:nicholas-001`
- **Algorithm**: Ed25519
- **Curve**: Ed25519 (RFC 8032)
- **Key size**: 32 bytes (public), 64 bytes (private)

## Retention

- **Sovereign memory (L3)**: 7+ years (UK regulation)
- **SIGIL chain**: permanent (unless BFT-33 + human escalation)
- **Audit trail**: queryable, citable, exportable

## Standards

- **W3C DID**: https://www.w3.org/TR/did-core/
- **Ed25519**: https://www.rfc-editor.org/rfc/rfc8032
- **NIST SP 800-186**: Recommendations for Discrete Logarithm-Based Cryptography
- **ISO/IEC 27001**: Information security management

## Tools

- **Generate**: `sov33_sign.py --message "..." --signer did:csoai:nicholas-001`
- **Verify**: `sov33_verify.py --sigil <sig>`
- **Chain walk**: `sov33_audit.py --start <ts> --end <ts>`
- **W3C DID resolver**: https://resolver.csoai.org/did:csoai:nicholas-001

---

**Sovereign by design. Audit-grade by default.**
