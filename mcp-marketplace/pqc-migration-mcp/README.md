# Post-Quantum Cryptography Migration MCP

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)
[![Tests](https://img.shields.io/badge/tests-4%2F4-brightgreen)]()

**Quantum-safe migration for the SIGIL audit trail.** Ed25519 won't survive Shor's algorithm (estimated 2030-2035). This MCP provides a 5-phase migration plan to Dilithium/Falcon/SPHINCS+.

## Why This Matters

Our entire sovereign governance substrate — BFT council, SIGIL ledger, Ed25519 passport API — is vulnerable to a Cryptographically Relevant Quantum Computer (CRQC). NIST mandates PQC migration by 2030. We need to start NOW.

## Algorithms Supported

| Algorithm | NIST Standard | Public Key | Signature | Use Case |
|-----------|---------------|------------|-----------|----------|
| **ML-DSA-44 (Dilithium2)** | FIPS 204 | 1312 B | 2420 B | General use, balanced |
| **ML-DSA-65 (Dilithium3)** | FIPS 204 | 1952 B | 3309 B | High security |
| **FN-DSA-512 (Falcon512)** | FIPS 206 (draft) | 897 B | 666 B | Compact, bandwidth-sensitive |
| **SLH-DSA-SHA2-128s (SPHINCS+)** | FIPS 205 | 32 B | 7856 B | Ultra-conservative, hash-only |

## Tools

- `list_pqc_algorithms()` — Algorithm inventory + quantum threat timeline
- `generate_pqc_identity(algorithm, subject)` — New PQC keypair + W3C DID
- `sign_with_pqc(did, message, algorithm, private_key)` — Quantum-safe signature
- `verify_pqc(did, message, signature, algorithm, public_key)` — Offline verification
- `migration_plan(current_algorithm)` — 5-phase migration roadmap

## 5-Phase Migration Plan (Ed25519 → Dilithium2)

1. **Month 1-3:** Issue PQC identities for all sovereign agents
2. **Month 4-6:** Dual-sign all SIGIL entries (Ed25519 + Dilithium)
3. **Month 7-9:** Deploy PQC verification endpoints
4. **Month 10-12:** Sunset Ed25519, keep as legacy verification
5. **Year 2:** Hard cutover to PQC-only

## Quick Start

```python
from pqc_migration_mcp.server import (
    generate_pqc_identity, sign_with_pqc, verify_pqc, migration_plan
)

# Generate a PQC identity (Dilithium2)
identity = generate_pqc_identity("dilithium2", "sov3 agent")
# Returns: {did, public_key_b64, private_key_b64, nist_standard: "FIPS 204"}

# Sign with quantum-safe
sig = sign_with_pqc(identity["did"], "sovereign governance decision", "dilithium2", identity["private_key_b64"])

# Verify (offline-capable)
result = verify_pqc(identity["did"], "sovereign governance decision", sig["signature"], "dilithium2", identity["public_key_b64"])
# Returns: {valid: True, offline_verification: True}
```

## Regulatory Pressure

- **NIST:** Mandates PQC migration by 2030 (NIST SP 800-131A)
- **EU AI Act Art 12:** Requires forward-secure audit trails
- **UK NCSC:** Recommends PQC for critical infrastructure by 2028
- **NSA CNSA 2.0:** Mandates PQC for national security systems by 2033

## Production Note

The current implementation is a reference (using SHA-512-based signatures for testing). For production, install `noble-post-quantum`:

```bash
pip install noble-post-quantum
```

Then replace the reference functions with:
- `noble_dilithium.sign(msg, sk)` / `noble_dilithium.verify(sig, msg, pk)`
- `noble_falcon.sign(msg, sk)` / `noble_falcon.verify(sig, msg, pk)`
- `noble_sphincs.sign(msg, sk)` / `noble_sphincs.verify(sig, msg, pk)`

**MEOK AI Labs (CSOAI LTD)** — Quantum-ready. Sovereign. Forward-secure.
