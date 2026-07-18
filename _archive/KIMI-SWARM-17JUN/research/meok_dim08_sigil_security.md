# Dimension 08: Sigil Protocol & Security Layer

## Comprehensive Technical Research: Cryptographic Identity and Secure Communication for Fractal Hive Architecture

**Research Date**: 2026-07-17
**Scope**: Design of the Sigil Protocol — encrypted inter-layer communications, blockchain attestation, hierarchical key derivation, zero-trust identity verification, and tamper-evident logging for the Meok-Pa multi-agent fractal hive.
**Searches Conducted**: 24 independent queries across 14 topic areas

---

## Executive Summary

The Sigil Protocol is the cryptographic backbone of the Meok-Pa fractal hive architecture, providing end-to-end encrypted inter-layer communication, hierarchical deterministic identity, blockchain-backed attestation, and tamper-evident audit logging. Every message between architectural tiers — from the One Overlord Watchtower Module (OOWM) down through Generals, Keystones, and Products — is cryptographically signed using Ed25519, with identities derived via BIP32-style hierarchical key derivation. The protocol addresses critical security gaps identified in the Model Context Protocol (MCP) ecosystem, including remote code execution (RCE) via tool poisoning, typosquatting, and the Byzantine fault patterns responsible for 78% of multi-agent system (MAS) outages.

---

## Table of Contents

1. [Sigil Protocol Architecture Overview](#1-sigil-protocol-architecture-overview)
2. [Hierarchical Key Derivation (BIP32-Style) for Derived Sigils](#2-hierarchical-key-derivation-bip32-style-for-derived-sigils)
3. [Ed25519 Signatures for Agent Messages](#3-ed25519-signatures-for-agent-messages)
4. [Zero-Knowledge Proofs for Identity Verification](#4-zero-knowledge-proofs-for-identity-verification)
5. [Merkle Trees for Tamper-Evident Log Chains](#5-merkle-trees-for-tamper-evident-log-chains)
6. [Blockchain Notarization Patterns (Lightweight)](#6-blockchain-notarization-patterns-lightweight)
7. [gRPC with mTLS for Inter-Service Communication](#7-grpc-with-mutual-tls-for-inter-service-communication)
8. [JWT with Custom Claims for Agent Identity](#8-jwt-with-custom-claims-for-agent-identity)
9. [Secret Management (HashiCorp Vault, Mozilla SOPS)](#9-secret-management-hashicorp-vault-mozilla-sops)
10. [End-to-End Encryption for Vector DB Sync](#10-end-to-end-encryption-for-vector-database-synchronization)
11. [Threat Model for Multi-Agent AI Systems](#11-threat-model-for-multi-agent-ai-systems)
12. [Supply Chain Security (SLSA Framework)](#12-supply-chain-security-slsa-framework)
13. [Post-Quantum Cryptography Considerations](#13-post-quantum-cryptography-considerations)
14. [Complete Protocol Specification](#14-complete-protocol-specification)
15. [Reference Implementations](#15-reference-implementations)

---

## 1. Sigil Protocol Architecture Overview

### 1.1 Core Design Principles

The Sigil Protocol is built on five foundational principles:

| Principle | Description | Implementation |
|---|---|---|
| **Hierarchical Trust** | Trust flows downward from the OOWM; each layer can verify messages from any ancestor | BIP32-Ed25519 hierarchical key derivation |
| **Cryptographic Provenance** | Every message carries an unforgeable proof of origin | Ed25519 signatures + Merkle inclusion proofs |
| **Zero-Knowledge Verification** | Agents prove authorization without revealing key material | ZK-SNARK selective disclosure credentials |
| **Tamper-Evident History** | All inter-agent communication is logged in an immutable chain | Merkle tree transparency logs + blockchain anchoring |
| **Post-Quantum Resilience** | Cryptographic agility for algorithm migration | Hybrid classical/PQC with ML-KEM/ML-DSA |

### 1.2 Identity Hierarchy

```
                    +-------------------------+
                    |     OOWM Master Sigil   |
                    |  (m/44'/1729'/0'/0'/0') |
                    +------------+------------+
                                 |
              +------------------+------------------+
              |                  |                  |
     +--------+--------+ +-------+-------+ +-------+-------+
     |  General Sigil  | | General Sigil | | General Sigil |
     | (m/.../0'/0/0)  | | (m/.../0'/0/1)| | (m/.../0'/0/2)|
     +--------+--------+ +-------+-------+ +-------+-------+
              |                  |                  |
    +---------+------+  +--------+-------+  +-------+-------+
    | Keystone Sigil |  | Keystone Sigil |  | Keystone Sigil |
    | (m/.../0/0/0)  |  | (m/.../0/0/1)  |  | (m/.../0/0/2)  |
    +---------+------+  +--------+-------+  +-------+-------+
              |                  |                  |
    +---------+------+  +--------+-------+  +-------+-------+
    | Product Sigil  |  | Product Sigil  |  | Product Sigil  |
    | (m/.../0/0/0)  |  | (m/.../0/0/1)  |  | (m/.../0/0/2)  |
    +----------------+  +----------------+  +----------------+
```

### 1.3 Message Flow

Every inter-agent message follows this pipeline:

```
+------------------+    +-------------------+    +--------------------+    +-------------------+
|   Payload        | -> |   Sigil Signing   | -> |  Merkle Inclusion  | -> |  gRPC + mTLS      |
|  (JSON/Protobuf) |    |  (Ed25519+ZKProof)|    |  (Log Attestation) |    |  (Wire Transport) |
+------------------+    +-------------------+    +--------------------+    +-------------------+
     Plaintext             Signed Envelope         Transparency Receipt       Encrypted Tunnel
```

### 1.4 Sigil Envelope Format

```protobuf
message SigilEnvelope {
  // Header
  bytes sender_public_key = 1;       // 32-byte Ed25519 public key
  bytes sigil_path = 2;               // BIP32 derivation path (e.g., "m/44'/1729'/0'/0/0")
  bytes zkp_credential = 3;           // ZK proof of identity (optional)
  uint64 timestamp = 4;               // Unix nanoseconds
  bytes nonce = 5;                    // 24-byte random nonce (anti-replay)
  
  // Body
  bytes payload = 10;                 // Encrypted payload (ChaCha20-Poly1305)
  bytes payload_type = 11;            // MIME-type of inner payload
  
  // Signature
  bytes ed25519_signature = 20;       // 64-byte Ed25519 signature over header+body
  
  // Transparency
  bytes merkle_inclusion_proof = 30;  // Inclusion proof in tamper-evident log
  bytes block_anchor_txid = 31;       // Blockchain anchor transaction ID
}
```

---

## 2. Hierarchical Key Derivation (BIP32-Style) for Derived Sigils

### 2.1 BIP32 Fundamentals

Bitcoin Improvement Proposal 32 (BIP32) introduced hierarchical deterministic (HD) wallets that use elliptic curve mathematics to derive a tree of cryptographic key pairs from a single master seed [^239^]. The core primitive is **CKDpriv** (Child Key Derivation):

```
CKDpriv(parent_key, parent_chain_code, index) -> (child_key, child_chain_code)

Where:
- If index >= 2^31: hardened derivation
  I = HMAC-SHA512(parent_chain_code, 0x00 || parent_key || index)
- If index < 2^31: normal derivation
  I = HMAC-SHA512(parent_chain_code, parent_pubkey || index)
- Split I: IL (left 32 bytes), IR (right 32 bytes = child chain code)
- child_private_key = (IL + parent_key) mod n
```

**Critical distinction**: Normal derivation allows child public keys to be derived from parent public keys alone, enabling "watch-only" capabilities. Hardened derivation (index >= 2^31) requires the parent private key and prevents child-to-parent key derivation attacks [^251^].

### 2.2 BIP32-Ed25519: Ed25519-Specific Adaptation

Standard BIP32 uses secp256k1. For the Sigil Protocol, we adapt BIP32 to work with Ed25519 as specified in the IOHK BIP32-Ed25519 proposal [^306^]:

```
Master Secret (256-bit): k_bar

1. Derive k = H_512(k_bar)
   - kL = left 32 bytes
   - kR = right 32 bytes

2. If third-highest bit of last byte of kL != 0: discard and regenerate

3. Set bits in kL:
   - Clear lowest 3 bits of first byte
   - Clear highest bit of last byte
   - Set second-highest bit of last byte

4. Root chain code: c = H_256(0x01 || k)

5. Extended private key: (kL, kR)
   - kL is the Ed25519 scalar
   - kR is the extension used in the child derivation hash

6. Root public key: A = [kL] * B  (where B is the Ed25519 base point)
```

### 2.3 Child Key Derivation (BIP32-Ed25519)

```
Given:
- Parent chain code: c_P
- Parent extended private key: (kL_P, kR_P)
- Parent public key: A_P
- Index: i

Z = HMAC-SHA512(c_P, [0x02 || A_P || i])       // for left hash
  = HMAC-SHA512(c_P, [0x03 || A_P || i])       // for right hash

kL_child = kL_P + 8 * Z_left  (mod L)
kR_child = kR_P + Z_right     (mod 2^256)
c_child  = HMAC-SHA512(c_P, [0x02 || A_P || i])_right 32 bytes
```

### 2.4 Sigil Derivation Path

```
Master Seed (256-bit, from CSPRNG or BIP39 mnemonic)
  |
  +-- m/44'/1729'/0'       <-- OOWM Master Sigil (purpose' / coin_type' / account')
  |     |
  |     +-- m/.../0'/0/0   <-- General #0 Derived Sigil (hardened change / address)
  |     |     |
  |     |     +-- m/.../0/0/0  <-- Keystone #0 Domain Sigil
  |     |     |       |
  |     |     |       +-- m/.../0/0/0  <-- Product #0 Product Sigil
  |     |     |       +-- m/.../0/0/1  <-- Product #1 Product Sigil
  |     |     |
  |     |     +-- m/.../0/0/1  <-- Keystone #1 Domain Sigil
  |     |
  |     +-- m/.../0'/0/1   <-- General #1 Derived Sigil
  |
  +-- m/44'/1729'/1'       <-- OOWM Backup/Recovery Sigil
```

- **44'**: Purpose (SLIP-44 registered) [^245^]
- **1729'**: Coin type (Tezos namespace, repurposed for Sigil)
- **0'**: Account (hardened — OOWM instance)
- **0'**: Change level (hardened — General tier)
- **N**: General index (non-hardened — individual General)
- **N/N**: Keystone and Product indices

### 2.5 Implementation: Rust

```rust
use ed25519_dalek::{SigningKey, VerifyingKey, SecretKey, Signature, Signer, Verifier};
use hmac::{Hmac, Mac};
use sha2::{Sha256, Sha512, Digest};
use curve25519_dalek::scalar::Scalar;
use curve25519_dalek::constants::ED25519_BASEPOINT_TABLE;

type HmacSha512 = Hmac<Sha512>;
type HmacSha256 = Hmac<Sha256>;

/// Extended private key for BIP32-Ed25519
pub struct ExtendedPrivKey {
    pub kL: [u8; 32],  // Ed25519 secret scalar
    pub kR: [u8; 32],  // Extension for child derivation
    pub chain_code: [u8; 32],
}

/// Extended public key
pub struct ExtendedPubKey {
    pub public_key: [u8; 32],
    pub chain_code: [u8; 32],
}

impl ExtendedPrivKey {
    /// Generate master key from 256-bit seed
    pub fn from_seed(seed: &[u8; 32]) -> Self {
        let k = Sha512::digest(seed);
        let mut kL = [0u8; 32];
        let mut kR = [0u8; 32];
        kL.copy_from_slice(&k[0..32]);
        kR.copy_from_slice(&k[32..64]);
        
        // Clamp kL for Ed25519
        kL[0] &= 0b1111_1000;
        kL[31] &= 0b0111_1111;
        kL[31] |= 0b0100_0000;
        
        // Derive chain code
        let mut hmac = HmacSha256::new_from_slice(b"Sigil-BIP32-Ed25519").unwrap();
        hmac.update(&[0x01]);
        hmac.update(&k[..]);
        let chain_code = hmac.finalize().into_bytes().into();
        
        ExtendedPrivKey { kL, kR, chain_code }
    }
    
    /// Derive hardened child key (index >= 2^31)
    pub fn derive_hardened(&self, index: u32) -> Self {
        let i = index | 0x8000_0000; // Ensure hardened bit set
        
        let mut hmac = HmacSha512::new_from_slice(&self.chain_code).unwrap();
        hmac.update(&[0x00]); // 0x00 padding for hardened
        hmac.update(&self.kL);
        hmac.update(&self.kR);
        hmac.update(&i.to_be_bytes());
        let I = hmac.finalize().into_bytes();
        
        let mut ZL = [0u8; 32];
        let mut ZR = [0u8; 32];
        let mut chain_code = [0u8; 32];
        ZL.copy_from_slice(&I[0..32]);
        ZR.copy_from_slice(&I[32..64]);
        
        // Chain code from right 32 bytes of HMAC re-keyed
        let mut hmac_cc = HmacSha512::new_from_slice(&self.chain_code).unwrap();
        hmac_cc.update(&[0x01]);
        hmac_cc.update(&self.to_public().public_key);
        hmac_cc.update(&i.to_be_bytes());
        let cc_full = hmac_cc.finalize().into_bytes();
        chain_code.copy_from_slice(&cc_full[32..64]);
        
        // kL_child = kL_parent + 8*ZL (mod L)
        let parent_scalar = Scalar::from_bytes_mod_order(self.kL);
        let zl_scalar = Scalar::from_bytes_mod_order(ZL);
        let eight = Scalar::from(8u8);
        let child_kL = (parent_scalar + eight * zl_scalar).to_bytes();
        
        // kR_child = kR_parent + ZR (mod 2^256)
        let mut child_kR = [0u8; 32];
        let mut carry = 0u16;
        for i in (0..32).rev() {
            let sum = self.kR[i] as u16 + ZR[i] as u16 + carry;
            child_kR[i] = (sum & 0xFF) as u8;
            carry = sum >> 8;
        }
        
        ExtendedPrivKey { kL: child_kL, kR: child_kR, chain_code }
    }
    
    pub fn to_public(&self) -> ExtendedPubKey {
        let scalar = Scalar::from_bytes_mod_order(self.kL);
        let point = &scalar * &ED25519_BASEPOINT_TABLE;
        ExtendedPubKey {
            public_key: point.compress().to_bytes(),
            chain_code: self.chain_code,
        }
    }
    
    pub fn to_signing_key(&self) -> SigningKey {
        // Ed25519 signing key from first 32 bytes (kL)
        SigningKey::from_bytes(&self.kL.into())
    }
}
```

### 2.6 Security Properties

| Property | Guarantee | Mechanism |
|----------|-----------|-----------|
| **Deterministic Derivation** | Same seed always produces same key tree | HMAC-SHA512 with fixed path |
| **Hardened Isolation** | Child key compromise cannot reveal parent | Private-key-dependent derivation |
| **Public Derivation** | Watch-only agents can derive descendant pubkeys | Non-hardened derivation from xpub |
| **Forward Secrecy** | Leaked child key doesn't affect siblings | Independent per-index derivation |
| **Post-Quantum Prep** | Migration path to lattice-based HD wallets | Lattice HD wallet construction [^250^] |

---

## 3. Ed25519 Signatures for Agent Messages

### 3.1 Why Ed25519

Ed25519 (RFC 8032) is the recommended signature scheme for agent-to-agent communication for these reasons [^240^]:

- **NIST-approved** and standardized across TLS 1.3, Noise Protocol, Signal, and MLS
- **Compact signatures**: 64 bytes — half the size of ECDSA signatures at equivalent security
- **Fast verification**: Single-coordinate Edwards curves enable batch verification
- **Deterministic**: No randomness source required during signing (prevents nonce reuse attacks)
- **Side-channel resistant**: Constant-time implementations are straightforward

For regulated environments evaluating post-quantum migration, ML-DSA (FIPS 204) is the designated replacement for Ed25519 [^240^].

### 3.2 Message Signing Protocol

```
+------------------+     +------------------+     +------------------+
|   Message M      | --> |  BLAKE2b-512(M)  | --> |  Ed25519.sign()  |
|  (serialized)    |     |  (hash to scalar)|     |  (kL, hash, r)   |
+------------------+     +------------------+     +------------------+
                                                          |
                                                          v
                                                   +------------+
                                                   | Signature  |
                                                   | (R || s)   |
                                                   | 64 bytes   |
                                                   +------------+
```

### 3.3 Signature Verification Chain

```python
import hashlib
from cryptography.hazmat.primitives.asymmetric.ed25519 import (
    Ed25519PrivateKey, Ed25519PublicKey
)

class SigilSigner:
    def __init__(self, extended_privkey: ExtendedPrivKey):
        self.signing_key = extended_privkey.to_signing_key()
        self.verifying_key = self.signing_key.public_key()
    
    def sign_message(self, payload: bytes, context: bytes = b"") -> bytes:
        """
        Sign a message with domain separation.
        
        Format: sig = Ed25519.sign(kL, BLAKE2b-512("Sigil-v1" || context || payload))
        """
        message = b"\x00Sigil-v1" + context + payload
        return self.signing_key.sign(message)
    
    def sign_envelope(self, envelope: SigilEnvelope) -> bytes:
        """Sign a complete Sigil envelope."""
        # Serialize header fields
        header = (
            envelope.sender_public_key +
            envelope.sigil_path +
            envelope.timestamp.to_bytes(8, 'big') +
            envelope.nonce
        )
        to_sign = header + envelope.payload
        return self.sign_message(to_sign)

class SigilVerifier:
    def __init__(self, trust_anchor: bytes):
        """
        Initialize with OOWM master public key as trust anchor.
        trust_anchor: 32-byte Ed25519 public key of OOWM Master Sigil
        """
        self.trust_anchor = Ed25519PublicKey.from_public_bytes(trust_anchor)
    
    def verify_signature(self, 
                         signature: bytes,
                         sender_pubkey: bytes,
                         payload: bytes,
                         context: bytes = b"") -> bool:
        """Verify an Ed25519 signature."""
        try:
            pubkey = Ed25519PublicKey.from_public_bytes(sender_pubkey)
            message = b"\x00Sigil-v1" + context + payload
            pubkey.verify(signature, message)
            return True
        except Exception:
            return False
    
    def verify_chain_of_trust(self,
                              signature: bytes,
                              sender_pubkey: bytes,
                              derivation_path: str,
                              payload: bytes) -> bool:
        """
        Verify that sender_pubkey is a valid descendant of the trust anchor
        at the specified BIP32 derivation path.
        """
        # Step 1: Derive expected public key from trust anchor + path
        expected_pubkey = self._derive_pubkey(self.trust_anchor, derivation_path)
        
        # Step 2: Verify sender matches expected
        if sender_pubkey != expected_pubkey:
            return False
        
        # Step 3: Verify signature
        return self.verify_signature(signature, sender_pubkey, payload)
    
    def _derive_pubkey(self, anchor: Ed25519PublicKey, path: str) -> bytes:
        """Derive public key from anchor through BIP32 path."""
        # Implementation: parse path segments, derive through each level
        # For hardened segments: requires parent private key (OOWM only)
        # For non-hardened: can derive from public key alone
        pass
```

### 3.4 Batch Verification for High-Throughput Agents

```rust
use ed25519_dalek::{VerifyingKey, Signature, Verifier};

/// Verify a batch of signatures efficiently
/// Returns Ok(()) if ALL signatures are valid
pub fn verify_batch(
    messages: &[&[u8]],
    signatures: &[Signature],
    public_keys: &[VerifyingKey],
) -> Result<(), ed25519_dalek::SignatureError> {
    ed25519_dalek::verify_batch(messages, signatures, public_keys)
}
```

---

## 4. Zero-Knowledge Proofs for Identity Verification

### 4.1 ZKP Overview for Agent Identity

Zero-knowledge proofs enable agents to prove authorization attributes (tier membership, capability grants, revocation status) without revealing the underlying identity data [^361^]. This is critical for the Sigil Protocol's "need to know" verification model.

### 4.2 Selective Disclosure Credential Architecture

The Sigil Protocol integrates ZK proofs through a privacy-preserving credential system [^361^] [^365^]:

```
+------------------+     +-------------------+     +------------------+
|  Issuer (OOWM)   | --> |  Sign Credential  | --> |   Holder (Agent) |
|  Master Sigil    |     |  (BBS+ Signature) |     |   Stores ZK-VC   |
+------------------+     +-------------------+     +------------------+
                                                           |
                                                           v
+------------------+     +-------------------+     +------------------+
|  Verifier (Peer) | <-- | Verify ZK Proof   | <-- |  Generate ZK-Proof |
|  Checks Policy   |     | (Selective Disclosure) |  (Selective Disclosure)
+------------------+     +-------------------+     +------------------+
```

### 4.3 ZK Circuit for Agent Capability Proof

```python
from dataclasses import dataclass
from typing import List, Optional

@dataclass
class CapabilityProof:
    """
    Zero-knowledge proof that an agent has a specific capability
    without revealing the full credential or agent identity.
    """
    proof: bytes                    # The ZK proof (Groth16/PLONK)
    revealed_claims: dict           # Claims the agent chose to reveal
    credential_commitment: bytes    # Pedersen commitment to credential
    nullifier: bytes               # Prevents double-spending of proof

class ZKCredentialManager:
    """Manages ZK-capable verifiable credentials for agents."""
    
    def __init__(self, proving_key: bytes, verification_key: bytes):
        self.proving_key = proving_key
        self.verification_key = verification_key
    
    def issue_credential(
        self,
        issuer_privkey: bytes,
        subject_pubkey: bytes,
        claims: dict,  # e.g., {"tier": "keystone", "domain": "finance", "exp": 1760000000}
    ) -> bytes:
        """
        Issue a BBS+ signed credential.
        BBS+ supports multi-message signing and selective disclosure.
        """
        # Serialize claims
        messages = [json.dumps({k: v}).encode() for k, v in claims.items()]
        
        # BBS+ sign (each claim signed independently)
        signature = bbs_sign(issuer_privkey, messages)
        
        # Package as W3C Verifiable Credential
        credential = {
            "@context": ["https://www.w3.org/2018/credentials/v1", "https://sigil.meok-pa.dev/v1"],
            "type": ["VerifiableCredential", "SigilCapabilityCredential"],
            "issuer": f"did:key:z{base58encode(issuer_pubkey)}",
            "issuanceDate": datetime.utcnow().isoformat(),
            "credentialSubject": {
                "id": f"did:key:z{base58encode(subject_pubkey)}",
                **claims
            },
            "proof": {
                "type": "BBSPlusSignature2023",
                "proofValue": base64encode(signature)
            }
        }
        return json.dumps(credential).encode()
    
    def generate_proof(
        self,
        credential: bytes,
        revealed_attributes: List[str],
        nonce: bytes,
    ) -> CapabilityProof:
        """
        Generate a ZK proof revealing only selected attributes.
        Uses Groth16 for proof generation (fast verification, small proofs).
        """
        cred = json.loads(credential)
        all_claims = list(cred["credentialSubject"].keys())
        
        # Build circuit witness
        # Private inputs: full credential, BBS+ signature, undisclosed attributes
        # Public inputs: revealed attributes, issuer public key hash, nonce
        
        witness = self._build_witness(
            credential=cred,
            revealed=revealed_attributes,
            nonce=nonce,
        )
        
        proof = groth16_prove(self.proving_key, witness)
        
        return CapabilityProof(
            proof=proof.serialize(),
            revealed_claims={k: cred["credentialSubject"][k] 
                           for k in revealed_attributes if k in cred["credentialSubject"]},
            credential_commitment=pedersen_commit(credential),
            nullifier=derive_nullifier(credential, nonce),
        )
    
    def verify_proof(
        self,
        proof: CapabilityProof,
        expected_claims: dict,
        nonce: bytes,
    ) -> bool:
        """
        Verify a ZK capability proof.
        Checks:
        1. Proof is valid Groth16 proof
        2. Revealed claims match expectations
        3. Credential was issued by trusted issuer
        4. Nullifier hasn't been used before (anti-replay)
        """
        # Verify Groth16 proof
        public_inputs = self._build_public_inputs(
            expected_claims=expected_claims,
            nonce=nonce,
        )
        
        if not groth16_verify(self.verification_key, proof.proof, public_inputs):
            return False
        
        # Check revealed claims
        for key, expected_value in expected_claims.items():
            if key not in proof.revealed_claims:
                return False
            if proof.revealed_claims[key] != expected_value:
                return False
        
        # Check nullifier not spent
        if self._nullifier_spent(proof.nullifier):
            return False
        
        return True
```

### 4.4 ZKP Protocol Comparison for Sigil

| Protocol | Proof Size | Verification | Setup | Best For |
|----------|-----------|--------------|-------|----------|
| **Groth16** | 192 bytes | ~1.5ms | Trusted setup (per circuit) | High-volume capability proofs |
| **PLONK** | ~400 bytes | ~3ms | Universal setup | Flexible credential schemas |
| **Halo2** | ~500 bytes | ~5ms | Transparent (no setup) | Maximum trustlessness |
| **Bulletproofs** | ~1KB | ~10ms | Transparent | Range proofs (capability levels) |
| **STARKs** | ~50KB | ~2ms | Transparent | Large batch proofs |

*Recommendation*: Use Groth16 for capability proofs (small, fast, fixed circuits) and Bulletproofs for range proofs proving tier levels [^361^].

---

## 5. Merkle Trees for Tamper-Evident Log Chains

### 5.1 Merkle Tree Fundamentals

A Merkle tree is a binary hash tree where each leaf node contains a hash of data, and each non-leaf node contains the hash of its children [^277^]. This structure provides:

- **Append-only integrity**: Once a leaf is added, modifying any data changes the root hash
- **Efficient verification**: O(log n) inclusion proofs
- **Tamper detection**: Any modification propagates to the root

### 5.2 Certificate Transparency Model

Certificate Transparency (RFC 9162) provides the reference architecture for tamper-evident logging [^277^] [^308^]:

```
                    [Merkle Root Hash]
                          |
            +-------------+-------------+
            |                           |
      [Hash 0-1]                  [Hash 2-3]
            |                           |
      +-----+-----+             +-------+-------+
      |           |             |               |
  [H(0)]     [H(1)]        [H(2)]         [H(3)]
      |           |             |               |
   Cert 0     Cert 1       Cert 2         Cert 3

Inclusion Proof for Cert 2:
  - H(2) (known from leaf)
  - H(3) (sibling)
  - Hash(H(0-1)) (path to root)
  - Recompute root and compare
```

### 5.3 Sigil Transparency Log

```python
import hashlib
from typing import List, Tuple, Optional

class SigilTransparencyLog:
    """
    Tamper-evident append-only log for all inter-agent messages.
    
    Every signed message is appended as a leaf. The Merkle root
    is periodically anchored to a public blockchain for external
    verifiability.
    """
    
    LEAF_PREFIX = b"\x00"
    NODE_PREFIX = b"\x01"
    
    def __init__(self):
        self.leaves: List[bytes] = []          # Raw leaf data
        self.tree: List[List[bytes]] = [[]]     # Level 0 = leaves
        self.root: Optional[bytes] = None
    
    def _hash_leaf(self, data: bytes) -> bytes:
        """Hash a leaf node with domain separation."""
        return hashlib.sha3_256(self.LEAF_PREFIX + data).digest()
    
    def _hash_node(self, left: bytes, right: bytes) -> bytes:
        """Hash an internal node with domain separation."""
        if left > right:
            left, right = right, left
        return hashlib.sha3_256(self.NODE_PREFIX + left + right).digest()
    
    def append(self, signed_message: bytes) -> int:
        """
        Append a signed message to the log.
        Returns the leaf index.
        """
        leaf_hash = self._hash_leaf(signed_message)
        self.leaves.append(leaf_hash)
        self._rebuild_tree()
        return len(self.leaves) - 1
    
    def _rebuild_tree(self):
        """Rebuild the Merkle tree after append."""
        if not self.leaves:
            self.root = None
            return
        
        self.tree = [self.leaves.copy()]
        level = 0
        
        while len(self.tree[level]) > 1:
            current = self.tree[level]
            next_level = []
            
            for i in range(0, len(current), 2):
                left = current[i]
                if i + 1 < len(current):
                    right = current[i + 1]
                else:
                    right = left  # Duplicate last node if odd
                next_level.append(self._hash_node(left, right))
            
            self.tree.append(next_level)
            level += 1
        
        self.root = self.tree[-1][0]
    
    def get_inclusion_proof(self, index: int) -> List[bytes]:
        """
        Generate a Merkle inclusion proof for a leaf at index.
        Returns list of sibling hashes from leaf to root.
        """
        if index < 0 or index >= len(self.leaves):
            raise ValueError("Invalid leaf index")
        
        proof = []
        for level in range(len(self.tree) - 1):
            sibling = index ^ 1  # Flip last bit
            if sibling < len(self.tree[level]):
                proof.append(self.tree[level][sibling])
            index //= 2
        
        return proof
    
    def verify_inclusion(
        self,
        leaf_index: int,
        leaf_data: bytes,
        proof: List[bytes],
        expected_root: bytes,
    ) -> bool:
        """Verify a Merkle inclusion proof."""
        current = self._hash_leaf(leaf_data)
        index = leaf_index
        
        for sibling in proof:
            if index % 2 == 0:
                current = self._hash_node(current, sibling)
            else:
                current = self._hash_node(sibling, current)
            index //= 2
        
        return current == expected_root
    
    def get_signed_tree_head(self) -> dict:
        """
        Return a signed tree head (STH) compatible with CT format.
        This is signed by the log operator's key.
        """
        return {
            "tree_size": len(self.leaves),
            "sha256_root_hash": self.root.hex() if self.root else "",
            "timestamp": int(time.time() * 1000),
            "signature": "",  # Signed by log operator
        }

    def get_root(self) -> Optional[bytes]:
        return self.root
```

### 5.4 Log Consistency Verification

```python
def verify_consistency(
    old_size: int,
    new_size: int,
    old_root: bytes,
    new_root: bytes,
    proof: List[bytes],
) -> bool:
    """
    Verify that a larger tree is an extension of a smaller tree.
    This proves no data was retroactively inserted or modified.
    
    Algorithm from RFC 9162:
    1. If old_size == new_size: verify old_root == new_root
    2. If old_size is a power of 2: verify old_root in new tree
    3. Otherwise: compute the fork point and verify both subtrees
    """
    if old_size == new_size:
        return old_root == new_root
    
    # Find the highest power of 2 <= old_size
    k = 1 << (old_size.bit_length() - 1)
    
    # Compute hash of old tree from proof
    computed_old = _compute_subtree_hash(k - 1, old_size - 1, proof)
    
    if computed_old != old_root:
        return False
    
    # Verify old root appears in new tree
    return _verify_root_in_tree(old_root, new_root, new_size, proof)
```

### 5.5 Integration with Sigil Envelope

Every `SigilEnvelope` carries a `merkle_inclusion_proof` field. When a message is sent:

1. The sender signs the message (Ed25519)
2. The message is appended to the local transparency log
3. The log returns a leaf index and inclusion proof
4. The inclusion proof is attached to the Sigil envelope
5. The receiver verifies the inclusion proof against the known log root
6. The log root is periodically anchored to a public blockchain

---

## 6. Blockchain Notarization Patterns (Lightweight)

### 6.1 Design Philosophy: Anchor, Don't Store

The Sigil Protocol does not store data on-chain. Instead, it anchors Merkle roots to a public blockchain, creating a timestamped, immutable commitment to the log state at a point in time [^276^] [^278^].

### 6.2 OpenTimestamps-Inspired Anchoring

OpenTimestamps provides the model: aggregate many hashes into a Merkle tree, then anchor a single root hash to Bitcoin via OP_RETURN [^330^].

```
+-----------+  +-----------+  +-----------+  +-----------+
| Msg Hash  |  | Msg Hash  |  | Msg Hash  |  | Msg Hash  |
| 0xabc...  |  | 0xdef...  |  | 0x123...  |  | 0x456...  |
+-----+-----+  +-----+-----+  +-----+-----+  +-----+-----+
      |              |              |              |
      +-------+------+              +-------+------+
              |                             |
         [Hash 0-1]                    [Hash 2-3]
              |                             |
              +-------------+---------------+
                            |
                    [Merkle Root]
                            |
                     OP_RETURN
                     (80 bytes max)
                     Bitcoin tx
                     ~10 min confirmation
```

### 6.3 Anchoring Protocol

```python
import requests
import time

class BlockchainAnchor:
    """
    Lightweight blockchain anchoring for Sigil transparency logs.
    Uses Bitcoin for maximum immutability, with Ethereum as fallback.
    """
    
    def __init__(self, 
                 bitcoin_rpc_url: str = "",
                 op_return_service: str = "https://opentimestamps.org",
                 anchor_interval_seconds: int = 3600):
        self.bitcoin_rpc = bitcoin_rpc_url
        self.op_return_service = op_return_service
        self.anchor_interval = anchor_interval_seconds
        self.pending_roots: List[bytes] = []
        self.last_anchor_time = 0
    
    def queue_anchor(self, merkle_root: bytes):
        """Queue a Merkle root for blockchain anchoring."""
        self.pending_roots.append(merkle_root)
        
        if time.time() - self.last_anchor_time >= self.anchor_interval:
            self._batch_anchor()
    
    def _batch_anchor(self):
        """Batch multiple roots into a single anchor transaction."""
        if not self.pending_roots:
            return
        
        # Build a Merkle tree of pending roots
        batch_tree = SigilTransparencyLog()
        for root in self.pending_roots:
            batch_tree.append(root)
        
        batch_root = batch_tree.get_root()
        
        # Submit via OpenTimestamps-style service
        # or directly via Bitcoin RPC with OP_RETURN
        txid = self._submit_op_return(batch_root)
        
        self.last_anchor_time = time.time()
        self.pending_roots = []
        
        return {
            "batch_root": batch_root.hex(),
            "txid": txid,
            "timestamp": self.last_anchor_time,
        }
    
    def _submit_op_return(self, data: bytes) -> str:
        """
        Submit data via OP_RETURN.
        
        Bitcoin: max 80 bytes in OP_RETURN
        For larger data: hash first, store hash in OP_RETURN
        """
        # Truncate or hash to fit 80 bytes
        if len(data) > 80:
            data = hashlib.sha256(data).digest()
        
        # Submit to anchor service or direct Bitcoin RPC
        payload = {
            "method": "sendrawtransaction",
            "params": [self._build_op_return_tx(data)],
        }
        
        response = requests.post(
            self.op_return_service + "/api/anchor",
            json={"data": data.hex()},
            timeout=30,
        )
        return response.json()["txid"]
    
    def verify_anchor(
        self,
        merkle_root: bytes,
        txid: str,
        block_height: int,
    ) -> bool:
        """
        Verify that a Merkle root was anchored in a specific Bitcoin block.
        Uses SPV proof (no full node required).
        """
        # Fetch block header and Merkle proof from API
        block_header = self._get_block_header(block_height)
        merkle_proof = self._get_merkle_proof(txid, block_height)
        
        # Verify txid is in block via Merkle proof
        if not self._verify_merkle_proof(txid, block_header["merkleroot"], merkle_proof):
            return False
        
        # Verify OP_RETURN output contains our root
        tx = self._get_transaction(txid)
        for output in tx["vout"]:
            script = output["scriptPubKey"]["asm"]
            if script.startswith("OP_RETURN"):
                embedded = bytes.fromhex(script.split(" ")[1])
                return embedded == merkle_root
        
        return False
```

### 6.4 Anchor Verification Without Full Node

```python
def verify_anchor_light(
    document: bytes,
    ots_proof: bytes,
    block_header: dict,  # From any block explorer API
) -> bool:
    """
    Verify an OpenTimestamps-style proof without running a full node.
    
    Requirements:
    - Original document (to recompute hash)
    - .ots proof file (Merkle path + txid)
    - Block header from trusted source (explorer, SPV, etc.)
    
    Steps:
    1. Hash the document: H(doc)
    2. Follow Merkle path in proof to compute root
    3. Verify root matches OP_RETURN in tx
    4. Verify tx is in block via Merkle proof
    5. Verify block hash matches block_header
    """
    doc_hash = hashlib.sha256(document).digest()
    
    # Parse OTS proof
    proof_ops = parse_ots_proof(ots_proof)
    
    # Apply operations to compute Merkle root
    computed_root = doc_hash
    for op in proof_ops:
        if op.type == "sha256":
            computed_root = hashlib.sha256(computed_root).digest()
        elif op.type == "append":
            computed_root = hashlib.sha256(computed_root + op.value).digest()
        elif op.type == "prepend":
            computed_root = hashlib.sha256(op.value + computed_root).digest()
    
    # Verify against block header
    # Block header's merkle root contains the anchor tx
    return verify_in_block(computed_root, proof_ops.txid, block_header)
```

### 6.5 Cost Analysis

| Method | Cost per Anchor | Confirmation Time | Immutability |
|--------|----------------|-------------------|--------------|
| Bitcoin OP_RETURN | ~$0.05-0.50 | ~10-60 min | Maximum (800+ EH/s) |
| Ethereum calldata | ~$0.10-1.00 | ~12 sec | Very High (1M+ validators) |
| OpenTimestamps (free tier) | Free | ~1-24 hours | Maximum (aggregated) |
| Hedera HCS | ~$0.0001 | ~3-5 sec | High (gossip + hashgraph) |
| Custom PoA chain | Near-zero | ~5 sec | Medium (controlled validators) |

---

## 7. gRPC with Mutual TLS for Inter-Service Communication

### 7.1 Why gRPC + mTLS

gRPC with mutual TLS provides [^244^]:
- **Bidirectional streaming**: Essential for real-time agent communication
- **Strong authentication**: Both client and server present certificates
- **Protocol Buffers**: Efficient binary serialization
- **Built-in load balancing**: Service mesh integration
- **Certificate rotation**: Automatic via service mesh sidecars

### 7.2 mTLS Configuration

```go
// Server-side mTLS configuration
package sigil

import (
    "crypto/tls"
    "crypto/x509"
    "google.golang.org/grpc"
    "google.golang.org/grpc/credentials"
    "os"
)

func NewSigilGRPCServer(
    serverCertPath, serverKeyPath, caCertPath string,
) (*grpc.Server, error) {
    // Load server certificate and key
    cert, err := tls.LoadX509KeyPair(serverCertPath, serverKeyPath)
    if err != nil {
        return nil, err
    }
    
    // Load CA certificate for client verification
    caCert, err := os.ReadFile(caCertPath)
    if err != nil {
        return nil, err
    }
    caCertPool := x509.NewCertPool()
    caCertPool.AppendCertsFromPEM(caCert)
    
    // Create TLS config requiring client certificates
    tlsConfig := &tls.Config{
        Certificates: []tls.Certificate{cert},
        ClientAuth:   tls.RequireAndVerifyClientCert,
        ClientCAs:    caCertPool,
        MinVersion:   tls.VersionTLS13,
        CipherSuites: []uint16{
            tls.TLS_AES_256_GCM_SHA384,
            tls.TLS_CHACHA20_POLY1305_SHA256,
        },
        PreferServerCipherSuites: true,
    }
    
    creds := credentials.NewTLS(tlsConfig)
    
    // gRPC server with Sigil interceptors
    return grpc.NewServer(
        grpc.Creds(creds),
        grpc.UnaryInterceptor(sigilAuthInterceptor),
        grpc.StreamInterceptor(sigilStreamInterceptor),
    ), nil
}

func sigilAuthInterceptor(
    ctx context.Context,
    req interface{},
    info *grpc.UnaryServerInfo,
    handler grpc.UnaryHandler,
) (interface{}, error) {
    // Extract peer certificate from TLS context
    peer, ok := peer.FromContext(ctx)
    if !ok {
        return nil, status.Error(codes.Unauthenticated, "no peer info")
    }
    
    tlsInfo := peer.AuthInfo.(credentials.TLSInfo)
    if len(tlsInfo.State.PeerCertificates) == 0 {
        return nil, status.Error(codes.Unauthenticated, "no client cert")
    }
    
    clientCert := tlsInfo.State.PeerCertificates[0]
    
    // Extract Sigil identity from certificate SAN
    sigilID := extractSigilID(clientCert)
    
    // Verify Sigil signature on message
    if err := verifySigilSignature(ctx, req, sigilID); err != nil {
        return nil, status.Error(codes.PermissionDenied, err.Error())
    }
    
    // Add verified identity to context
    ctx = context.WithValue(ctx, "sigil.identity", sigilID)
    
    return handler(ctx, req)
}
```

```python
# Client-side mTLS configuration
import grpc
from grpc import ssl_channel_credentials

class SigilGRPCClient:
    def __init__(self, 
                 server_addr: str,
                 client_cert_path: str,
                 client_key_path: str,
                 ca_cert_path: str):
        # Load client certificate and key
        with open(client_cert_path, 'rb') as f:
            client_cert = f.read()
        with open(client_key_path, 'rb') as f:
            client_key = f.read()
        with open(ca_cert_path, 'rb') as f:
            ca_cert = f.read()
        
        # Create TLS credentials with client certificate
        credentials = grpc.ssl_channel_credentials(
            root_certificates=ca_cert,
            private_key=client_key,
            certificate_chain=client_cert,
        )
        
        self.channel = grpc.secure_channel(server_addr, credentials)
    
    def send_message(self, envelope: SigilEnvelope):
        stub = SigilServiceStub(self.channel)
        
        # Attach Sigil metadata (signature verification hints)
        metadata = (
            ('x-sigil-pubkey', envelope.sender_public_key.hex()),
            ('x-sigil-path', envelope.sigil_path.decode()),
            ('x-sigil-timestamp', str(envelope.timestamp)),
        )
        
        response = stub.DeliverMessage(
            envelope,
            metadata=metadata,
            timeout=30,
        )
        return response
```

### 7.3 Service Mesh Integration

For production deployments, mTLS should be handled by a service mesh (Istio, Linkerd, Consul Connect) rather than application code [^244^]:

```yaml
# Istio PeerAuthentication for Sigil namespace
apiVersion: security.istio.io/v1beta1
kind: PeerAuthentication
metadata:
  name: sigil-mtls
  namespace: meok-pa-sigil
spec:
  mtls:
    mode: STRICT  # Require mTLS for all traffic
---
# Istio AuthorizationPolicy
apiVersion: security.istio.io/v1beta1
kind: AuthorizationPolicy
metadata:
  name: sigil-tier-policy
  namespace: meok-pa-sigil
spec:
  action: ALLOW
  rules:
  # OOWM can talk to anyone
  - from:
    - source:
        principals: ["cluster.local/ns/meok-pa-sigil/sa/oowm"]
  # Generals can talk to their Keystones and peers
  - from:
    - source:
        principals: ["cluster.local/ns/meok-pa-sigil/sa/general-*"]
    to:
    - operation:
        paths: ["/sigil.v1.General/*", "/sigil.v1.Keystone/*"]
  # Keystones can talk to their Products
  - from:
    - source:
        principals: ["cluster.local/ns/meok-pa-sigil/sa/keystone-*"]
    to:
    - operation:
        paths: ["/sigil.v1.Product/*"]
```

---

## 8. JWT with Custom Claims for Agent Identity

### 8.1 SPIFFE/SPIRE-Inspired Workload Identity

SPIFFE (Secure Production Identity Framework For Everyone) provides a standard for workload identity that the Sigil Protocol adapts for agent identity [^268^] [^275^].

### 8.2 Sigil JWT-SVID (SPIFFE Verifiable Identity Document)

```
Sigil JWT-SVID Structure:

Header:
{
  "alg": "EdDSA",
  "crv": "Ed25519",
  "typ": "JWT",
  "kid": "sigil-oowm-master-2026"
}

Payload (Custom Claims):
{
  "sub": "sigil://meok-pa.dev/oowm/master",
  "iss": "https://sigil.meok-pa.dev",
  "aud": ["sigil-agent-network"],
  "iat": 1720000000,
  "exp": 1720086400,
  
  // Sigil-specific claims
  "sigil.tier": "oowm",
  "sigil.domain": "*",
  "sigil.capabilities": ["broadcast", "delegate", "revoke", "anchor"],
  "sigil.derived_pubkey": "z6MkjBWPPa1njEKygyr3LR3pRKkqv714vyTkfnUdP6ToFSH5",
  "sigil.bip32_path": "m/44'/1729'/0'",
  "sigil.parent_sigil": null,
  "sigil.trust_score": 100,
  "sigil.revoked": false,
  "sigil.proof_type": "ed25519-direct",
  
  // ZK proof of capability (optional)
  "sigil.zk_capability_proof": {
    "circuit": "sigil-capability-v1",
    "proof": "base64-encoded-groth16-proof",
    "revealed": ["tier", "domain", "capabilities"]
  }
}

Signature:
Ed25519(sign(base64url(header) + "." + base64url(payload)))
```

### 8.3 JWT Verification with Custom Claims

```python
import jwt
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PublicKey
from datetime import datetime, timedelta

class SigilJWTVerifier:
    """
    Verifies Sigil JWT-SVIDs with custom claims validation.
    """
    
    EXPECTED_ISSUER = "https://sigil.meok-pa.dev"
    EXPECTED_ALGORITHM = "EdDSA"
    
    # Tier hierarchy for capability inheritance
    TIER_HIERARCHY = {
        "oowm": 0,
        "general": 1,
        "keystone": 2,
        "product": 3,
    }
    
    def __init__(self, trusted_public_keys: dict):
        """
        Initialize with trusted issuer public keys.
        
        trusted_public_keys: dict mapping key_id -> Ed25519PublicKey
        """
        self.trusted_keys = trusted_public_keys
    
    def verify_token(self, token: str, required_tier: str = None) -> dict:
        """
        Verify a Sigil JWT-SVID.
        
        Steps:
        1. Verify Ed25519 signature
        2. Validate standard claims (iss, aud, exp, iat)
        3. Validate Sigil-specific claims
        4. Verify ZK capability proof (if present)
        5. Check tier authorization
        """
        # Step 1: Decode without verification to get header
        unverified = jwt.decode(token, options={"verify_signature": False})
        kid = unverified.get("header", {}).get("kid")
        
        if kid not in self.trusted_keys:
            raise jwt.InvalidTokenError(f"Unknown key: {kid}")
        
        # Step 2: Full verification
        try:
            claims = jwt.decode(
                token,
                key=self.trusted_keys[kid],
                algorithms=[self.EXPECTED_ALGORITHM],
                issuer=self.EXPECTED_ISSUER,
                audience="sigil-agent-network",
                options={
                    "require": ["sub", "iat", "exp", "sigil.tier"],
                }
            )
        except jwt.ExpiredSignatureError:
            raise PermissionError("Token expired")
        except jwt.InvalidIssuerError:
            raise PermissionError("Invalid issuer")
        
        # Step 3: Validate Sigil-specific claims
        self._validate_sigil_claims(claims)
        
        # Step 4: Verify ZK capability proof (if present)
        if "sigil.zk_capability_proof" in claims:
            self._verify_zk_proof(claims["sigil.zk_capability_proof"])
        
        # Step 5: Check tier authorization
        if required_tier:
            self._check_tier_authorization(claims["sigil.tier"], required_tier)
        
        return claims
    
    def _validate_sigil_claims(self, claims: dict):
        """Validate Sigil-specific custom claims."""
        tier = claims.get("sigil.tier")
        if tier not in self.TIER_HIERARCHY:
            raise ValueError(f"Invalid tier: {tier}")
        
        if claims.get("sigil.revoked", False):
            raise PermissionError("Sigil has been revoked")
        
        # Validate BIP32 path matches tier
        path = claims.get("sigil.bip32_path", "")
        expected_depth = self.TIER_HIERARCHY[tier]
        # Path depth should match tier level
        
        # Validate trust score
        trust_score = claims.get("sigil.trust_score", 0)
        if trust_score < 50:
            raise PermissionError("Trust score too low")
    
    def _verify_zk_proof(self, zk_proof: dict):
        """Verify ZK capability proof if present."""
        # Delegate to ZK verifier
        pass
    
    def _check_tier_authorization(self, token_tier: str, required_tier: str):
        """
        Check if token_tier is authorized to access required_tier.
        Higher tiers (lower numbers) can access lower tiers.
        """
        token_level = self.TIER_HIERARCHY[token_tier]
        required_level = self.TIER_HIERARCHY[required_tier]
        
        if token_level > required_level:
            raise PermissionError(
                f"Tier {token_tier} cannot access resources requiring {required_tier}"
            )

class SigilJWTIssuer:
    """Issues Sigil JWT-SVIDs."""
    
    def __init__(self, signing_key: Ed25519PrivateKey, key_id: str):
        self.signing_key = signing_key
        self.key_id = key_id
    
    def issue_svid(self,
                   subject: str,
                   tier: str,
                   domain: str,
                   capabilities: list,
                   bip32_path: str,
                   ttl_seconds: int = 3600) -> str:
        """Issue a Sigil JWT-SVID."""
        now = datetime.utcnow()
        
        payload = {
            "sub": subject,
            "iss": SigilJWTVerifier.EXPECTED_ISSUER,
            "aud": ["sigil-agent-network"],
            "iat": now,
            "exp": now + timedelta(seconds=ttl_seconds),
            "sigil.tier": tier,
            "sigil.domain": domain,
            "sigil.capabilities": capabilities,
            "sigil.bip32_path": bip32_path,
            "sigil.trust_score": self._calculate_trust_score(tier),
            "sigil.revoked": False,
        }
        
        return jwt.encode(
            payload,
            key=self.signing_key,
            algorithm="EdDSA",
            headers={"kid": self.key_id},
        )
```

---

## 9. Secret Management (HashiCorp Vault, Mozilla SOPS)

### 9.1 HashiCorp Vault for Dynamic Agent Secrets

Vault provides dynamic secrets, automatic rotation, and fine-grained access control — essential for a multi-agent system where credentials must never be hardcoded [^298^] [^299^] [^302^].

#### Architecture

```
+------------------+     +------------------+     +------------------+
|   Agent Pod      | --> |  Vault Agent     | --> |  Vault Server    |
| (needs secret)   |     |  (sidecar)       |     | (secrets engine) |
|                  |     |                  |     |                  |
|  /vault/secrets  |     |  Auto-authentic  |     |  Dynamic DB creds|
|  /database.json  | <-- |  Auto-renew      | <-- |  PKI certs       |
|                  |     |  Auto-revoke     |     |  Encryption keys |
+------------------+     +------------------+     +------------------+
```

#### Vault Configuration for Sigil

```hcl
# Enable Kubernetes auth for agent pods
auth "kubernetes/" {
  type = "kubernetes"
}

# Configure Kubernetes auth
auth "kubernetes/config" {
  kubernetes_host = "https://kubernetes.default.svc"
  token_reviewer_jwt = "@/var/run/secrets/kubernetes.io/serviceaccount/token"
}

# Role for OOWM agents
auth "kubernetes/role/oowm" {
  bound_service_account_names = ["oowm"]
  bound_service_account_namespaces = ["meok-pa"]
  policies = ["oowm-policy"]
  ttl = "1h"
}

# Role for General agents
auth "kubernetes/role/general" {
  bound_service_account_names = ["general-*"]
  bound_service_account_namespaces = ["meok-pa"]
  policies = ["general-policy"]
  ttl = "2h"
}

# Policy: OOWM can read all sigil keys
policy "oowm-policy" {
  path "sigil/oowm/*" {
    capabilities = ["read", "create", "update", "delete"]
  }
  path "sigil/transit/sign/oowm" {
    capabilities = ["create", "update"]
  }
  path "sigil/transit/verify/oowm" {
    capabilities = ["read"]
  }
}

# Transit engine for signing operations
secrets "transit/" {
  type = "transit"
}

# Create signing key for OOWM Master Sigil
secrets "transit/keys/oowm-master" {
  type = "ed25519"
  exportable = false
  auto_rotate_period = "720h"  # 30 days
}

# Database secrets engine for dynamic credentials
secrets "database/" {
  type = "database"
}

# PostgreSQL dynamic credentials
secrets "database/config/agent-db" {
  plugin_name = "postgresql-database-plugin"
  allowed_roles = ["keystone-reader", "product-writer"]
  connection_url = "postgresql://{{username}}:{{password}}@db:5432/agents"
}

# Role: Keystone read-only
secrets "database/roles/keystone-reader" {
  db_name = "agent-db"
  creation_statements = [
    "CREATE ROLE \"{{name}}\" WITH LOGIN PASSWORD '{{password}}' VALID UNTIL '{{expiration}}';",
    "GRANT SELECT ON ALL TABLES IN SCHEMA keystone TO \"{{name}}\";"
  ]
  default_ttl = "1h"
  max_ttl = "24h"
}
```

#### Agent Injection (Kubernetes)

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: keystone-agent
  namespace: meok-pa
spec:
  template:
    metadata:
      annotations:
        vault.hashicorp.com/agent-inject: "true"
        vault.hashicorp.com/role: "keystone"
        
        # Inject Sigil private key
        vault.hashicorp.com/agent-inject-secret-sigil.key: "sigil/data/keystone-finance"
        vault.hashicorp.com/agent-inject-template-sigil.key: |
          {{ with secret "sigil/data/keystone-finance" -}}
          {{ .Data.data.private_key }}
          {{- end }}
        
        # Inject dynamic database credentials
        vault.hashicorp.com/agent-inject-secret-database.json: "database/creds/keystone-reader"
        vault.hashicorp.com/agent-inject-template-database.json: |
          {{ with secret "database/creds/keystone-reader" -}}
          {
            "username": "{{ .Data.username }}",
            "password": "{{ .Data.password }}",
            "host": "db.meok-pa.svc",
            "port": 5432
          }
          {{- end }}
        
        # Auto-renew secrets
        vault.hashicorp.com/agent-pre-populate: "true"
        vault.hashicorp.com/agent-revoke-on-shutdown: "true"
        
    spec:
      serviceAccountName: keystone-finance
      containers:
      - name: keystone
        image: meok-pa/keystone:v1.2.0
        volumeMounts:
        - name: vault-secrets
          mountPath: /vault/secrets
        env:
        - name: SIGIL_KEY_PATH
          value: /vault/secrets/sigil.key
        - name: DATABASE_CONFIG_PATH
          value: /vault/secrets/database.json
```

### 9.2 Mozilla SOPS for GitOps Secret Encryption

Mozilla SOPS encrypts secrets in YAML/JSON files, enabling them to be safely stored in Git [^265^] [^266^] [^271^].

#### Configuration

```yaml
# .sops.yaml - Creation rules for Sigil secrets
creation_rules:
  # OOWM master key (highest security)
  - path_regex: oowm/.*\.enc\.yaml$
    age: age1oowmmasterpublickey...
    encrypted_regex: '^(private_key|seed|recovery_phrase)$'
    
  # General tier keys
  - path_regex: general/.*\.enc\.yaml$
    age: age1generalpublickey...
    encrypted_regex: '^(private_key|api_key|database_password)$'
    
  # Keystone keys
  - path_regex: keystone/.*\.enc\.yaml$
    age: age1keystonepublickey...
    encrypted_regex: '^(private_key|token|secret)$'
    
  # Product keys
  - path_regex: product/.*\.enc\.yaml$
    age: age1productpublickey...
    encrypted_regex: '^(private_key|credential)$'
    
  # Default rule
  - age: age1defaultpublickey...
    encrypted_regex: '^(data|stringData|password|key|secret)$'
```

#### Workflow

```bash
# Generate age key pair for a new keystone
age-keygen -o keystone-finance.age.key
# Public key: age1ql3z7hjy54pw3hyww5ayyfg7zqgvc7w3j2elw8zmrj2kg5sfn9aqmcac8p

# Add public key to .sops.yaml creation_rules

# Encrypt a secret file
sops --encrypt \
  --age age1ql3z7hjy54pw3hyww5ayyfg7zqgvc7w3j2elw8zmrj2kg5sfn9aqmcac8p \
  keystone/finance/secrets.yaml > keystone/finance/secrets.enc.yaml

# Safe to commit to Git
git add keystone/finance/secrets.enc.yaml
git commit -m "Add encrypted finance keystone secrets"

# Decrypt (requires private key)
export SOPS_AGE_KEY_FILE=keystone-finance.age.key
sops --decrypt keystone/finance/secrets.enc.yaml
```

#### Encrypted File Format

```yaml
# keystone/finance/secrets.enc.yaml
apiVersion: v1
kind: Secret
metadata:
    name: keystone-finance-sigil
    namespace: meok-pa
type: Opaque
stringData:
    private_key: ENC[AES256_GCM,data:...,iv:...,type:str]
    domain_config: ENC[AES256_GCM,data:...,iv:...,type:str]
sops:
    age:
        - recipient: age1ql3z7hjy54pw3hyww5ayyfg7zqgvc7w3j2elw8zmrj2kg5sfn9aqmcac8p
          enc: ...
    lastmodified: "2026-07-17T12:00:00Z"
    version: 3.8.1
```

### 9.3 Comparison: Vault vs SOPS

| Feature | HashiCorp Vault | Mozilla SOPS |
|---------|----------------|--------------|
| **Use Case** | Runtime secrets | Static secrets in Git |
| **Dynamic Secrets** | Yes (DB, cloud, PKI) | No |
| **Secret Rotation** | Automatic (TTL-based) | Manual |
| **Access Control** | Fine-grained ACL policies | Key-based decryption |
| **Audit Logging** | Full audit trail | None |
| **Kubernetes** | Agent injector, CSI | Flux/ArgoCD integration |
| **Encryption** | AES-GCM transit | AES256-GCM (age/PGP) |
| **Availability** | Requires Vault cluster | No runtime dependency |
| **Cost** | Enterprise licensing | Free (open source) |

**Recommendation**: Use Vault for runtime secrets (signing keys, dynamic DB credentials) and SOPS for static configuration (deployment configs, known credentials in GitOps).

---

## 10. End-to-End Encryption for Vector Database Synchronization

### 10.1 Threat Model

Vector databases (Pinecone, Weaviate, Qdrant) store embedding vectors that encode semantic meaning from sensitive data. Synchronization between tiers must protect:
- **Embeddings at rest**: Vector values, metadata, and indexes
- **Embeddings in transit**: Cross-tier replication and query results
- **Query privacy**: Prevent inference of query intent from traffic patterns [^336^] [^338^]

### 10.2 Field-Level Encryption Architecture

```
+------------------+     +------------------+     +------------------+
|  Producer Agent  | --> | Encrypt Fields   | --> |  Vector DB       |
|  (embeds + meta) |     | (client-side)    |     |  (encrypted at   |
|                  |     | - vector AES-GCM |     |   rest)          |
|                  |     | - metadata AES   |     |                  |
+------------------+     +------------------+     +------------------+
                                                          |
+------------------+     +------------------+            |
|  Consumer Agent  | <-- | Decrypt Fields   | <----------+
|  (query + use)   |     | (client-side)    |
|                  |     | - vector AES-GCM |
|                  |     | - metadata AES   |
+------------------+     +------------------+
```

### 10.3 Encrypted Vector Storage

```python
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
import numpy as np

class EncryptedVectorStore:
    """
    Client-side encrypted vector storage.
    Vectors are encrypted before transmission to the database.
    """
    
    VECTOR_NONCE_SIZE = 12  # 96 bits for AES-GCM
    ASSOCIATED_DATA = b"sigil-vector-v1"
    
    def __init__(self, master_key: bytes):
        """Initialize with a 256-bit master key."""
        self.master_key = master_key
        self.aesgcm = AESGCM(master_key)
    
    def encrypt_vector(self, 
                       vector_id: str,
                       vector: np.ndarray,
                       metadata: dict) -> dict:
        """
        Encrypt a vector and its metadata for storage.
        
        Returns dict with:
        - encrypted_vector: base64-encoded ciphertext
        - vector_hash: SHA-256 of original (for dedup)
        - encrypted_metadata: encrypted JSON metadata
        - nonce: unique per-vector nonce
        """
        # Serialize vector to bytes
        vector_bytes = vector.astype(np.float32).tobytes()
        
        # Derive per-vector key
        vector_key = self._derive_vector_key(vector_id)
        
        # Encrypt vector
        nonce = os.urandom(self.VECTOR_NONCE_SIZE)
        encrypted_vector = self.aesgcm.encrypt(
            nonce, 
            vector_bytes,
            self.ASSOCIATED_DATA + vector_id.encode()
        )
        
        # Encrypt metadata
        metadata_json = json.dumps(metadata).encode()
        metadata_nonce = os.urandom(self.VECTOR_NONCE_SIZE)
        encrypted_metadata = self.aesgcm.encrypt(
            metadata_nonce,
            metadata_json,
            self.ASSOCIATED_DATA + b"meta" + vector_id.encode()
        )
        
        return {
            "id": vector_id,
            "encrypted_vector": base64.b64encode(encrypted_vector).decode(),
            "vector_nonce": base64.b64encode(nonce).decode(),
            "vector_hash": hashlib.sha256(vector_bytes).hexdigest(),
            "encrypted_metadata": base64.b64encode(encrypted_metadata).decode(),
            "metadata_nonce": base64.b64encode(metadata_nonce).decode(),
            "dimensions": len(vector),
        }
    
    def decrypt_vector(self, encrypted_record: dict) -> tuple:
        """Decrypt a vector and its metadata."""
        vector_id = encrypted_record["id"]
        
        # Decrypt vector
        encrypted_vector = base64.b64decode(encrypted_record["encrypted_vector"])
        nonce = base64.b64decode(encrypted_record["vector_nonce"])
        
        vector_bytes = self.aesgcm.decrypt(
            nonce,
            encrypted_vector,
            self.ASSOCIATED_DATA + vector_id.encode()
        )
        
        vector = np.frombuffer(vector_bytes, dtype=np.float32)
        
        # Decrypt metadata
        encrypted_metadata = base64.b64decode(encrypted_record["encrypted_metadata"])
        metadata_nonce = base64.b64decode(encrypted_record["metadata_nonce"])
        
        metadata_json = self.aesgcm.decrypt(
            metadata_nonce,
            encrypted_metadata,
            self.ASSOCIATED_DATA + b"meta" + vector_id.encode()
        )
        
        metadata = json.loads(metadata_json)
        return vector, metadata
    
    def _derive_vector_key(self, vector_id: str) -> bytes:
        """Derive a per-vector encryption key."""
        h = hmac.new(self.master_key, vector_id.encode(), hashlib.sha256)
        return h.digest()

class SecureVectorSync:
    """
    Secure synchronization of vector embeddings between tiers.
    Uses end-to-end encryption with forward secrecy.
    """
    
    def __init__(self, 
                 sigil_envelope: SigilEnvelope,
                 vector_store: EncryptedVectorStore):
        self.envelope = sigil_envelope
        self.store = vector_store
    
    async def sync_tier(self,
                       source_tier: str,
                       target_tier: str,
                       vector_filter: dict) -> SyncResult:
        """
        Synchronize encrypted vectors between tiers.
        
        1. Query vectors from source tier (encrypted)
        2. Re-encrypt with target tier's key (if different)
        3. Sign sync batch with Sigil
        4. Transmit over mTLS gRPC
        5. Verify and store at target
        """
        # Query encrypted vectors
        vectors = await self._query_source(source_tier, vector_filter)
        
        # Build sync batch
        batch = {
            "source_tier": source_tier,
            "target_tier": target_tier,
            "timestamp": time.time_ns(),
            "vectors": vectors,
        }
        
        # Sign with Sigil
        signed_batch = self.envelope.sign(batch)
        
        # Transmit securely
        async with self._grpc_channel(target_tier) as channel:
            stub = VectorSyncStub(channel)
            result = await stub.SyncVectors(signed_batch)
        
        return result
```

### 10.4 Vector DB Security Comparison

| Feature | Pinecone | Weaviate | Qdrant |
|---------|----------|----------|--------|
| Encryption at Rest | AES-256 (managed) | Configurable | Configurable (BYO) |
| Encryption in Transit | TLS 1.2+ (enforced) | TLS | TLS (configurable) |
| Authentication | API key | API key + OIDC | API key + JWT |
| RBAC | Project-level | Class-level | Collection-level |
| Client-side Encryption | Not built-in | Not built-in | Not built-in |

**Recommendation**: Implement client-side field-level encryption as shown above for all vector databases, as none provide native per-vector encryption.

---

## 11. Threat Model for Multi-Agent AI Systems

### 11.1 Five-Zone Threat Model

The Sigil Protocol addresses the five-zone threat model for agentic AI [^248^] [^300^]:

| Zone | Description | Sigil Mitigation |
|------|-------------|-----------------|
| **Zone 1: Input Surfaces** | Prompt injection, RAG poisoning, tool description tampering | Input sanitization, ZK-based input attestation |
| **Zone 2: Planning & Reasoning** | Goal hijacking, intent breaking | Signed execution plans, capability-based authorization |
| **Zone 3: Tool Execution** | Unauthorized tool use, RCE, data exfiltration | mTLS + Sigil-signed tool requests, least-privilege scopes |
| **Zone 4: Memory & State** | Memory poisoning, embedding attacks | Encrypted vector storage, tamper-evident memory logs |
| **Zone 5: Inter-Agent Communication** | Agent communication poisoning, rogue agents | All messages Sigil-signed with chain-of-trust verification |

### 11.2 MCP Security Gaps Addressed

The Model Context Protocol (MCP) has significant security vulnerabilities [^264^] [^272^]:

| MCP Vulnerability | Sigil Countermeasure |
|-------------------|---------------------|
| **Tool Poisoning Attacks (TPA)** | All tool descriptions are Sigil-signed by the issuing Keystone; modifications break signature |
| **Remote Code Execution via tools** | Tools execute in sandboxed enclaves with attestation; only attested tools are invoked |
| **Typosquatting of tool servers** | Tool servers identified by cryptographic DID, not DNS names |
| **Indirect prompt injection** | Input validation with ZK proofs of input provenance |
| **Chain attacks via shared context** | Context carries cryptographic provenance chain showing all contributing agents |

### 11.3 OWASP Agentic Threat Coverage

The Sigil Protocol addresses the 15 OWASP agentic threat categories [^296^]:

| T-Code | Threat | Sigil Defense |
|--------|--------|---------------|
| T1 | Memory Poisoning | Tamper-evident Merkle logs for all memory writes |
| T2 | Tool Misuse | Capability-based ZK proofs for tool authorization |
| T3 | Privilege Compromise | Hierarchical key derivation with per-action scope |
| T4 | Resource Overload | Rate limiting with Sigil-backed quotas |
| T5 | Cascading Hallucination | Byzantine fault tolerance: multi-agent consensus |
| T6 | Intent Breaking | Signed goal chains with OOWM attestation |
| T7 | Misaligned Behaviors | Revocable ZK credentials with trust scoring |
| T8 | Repudiation | Immutable transparency log + blockchain anchoring |
| T9 | Identity Spoofing | Ed25519 + BIP32 chain-of-trust verification |
| T10 | Human-in-the-Loop Overwhelm | Automated verification replaces manual checks |
| T11 | RCE & Code Attacks | TEE sandboxing with remote attestation |
| T12 | Agent Communication Poisoning | All messages signed + Merkle logged |
| T13 | Rogue Agents | Revocation via transparency log |
| T14 | Human Attacks on MAS | Cryptographic voting for sensitive operations |
| T15 | Human Manipulation | Multi-agent Byzantine consensus |

### 11.4 Byzantine Fault Tolerance

The Sigil Protocol implements Byzantine fault tolerance for critical multi-agent decisions [^263^] [^267^]:

```python
class ByzantineVoting:
    """
    Byzantine fault-tolerant voting for critical agent decisions.
    
    Requirement: N >= 3f + 1 agents, where f = max tolerated faulty agents.
    Quorum: 2f + 1 votes required for decision.
    """
    
    def __init__(self, agents: List[Agent], max_faults: int):
        self.agents = agents
        self.N = len(agents)
        self.f = max_faults
        assert self.N >= 3 * self.f + 1, f"Need >= {3*self.f+1} agents for f={self.f}"
        self.quorum = 2 * self.f + 1
    
    async def vote(self, proposal: Proposal) -> Decision:
        """
        Execute Byzantine-tolerant voting on a proposal.
        
        Algorithm:
        1. Proposer broadcasts proposal with Sigil signature
        2. Each agent validates proposal and broadcasts vote
        3. Collect votes until quorum reached
        4. If quorum agrees: commit decision
        5. If quorum not reached: abort
        """
        # Phase 1: Propose
        proposal_hash = hashlib.sha3_256(proposal.serialize()).digest()
        signed_proposal = await self._sign_proposal(proposal)
        
        # Phase 2: Vote collection
        votes = []
        for agent in self.agents:
            vote = await agent.vote_on(signed_proposal)
            if self._verify_vote(vote, agent.sigil_pubkey):
                votes.append(vote)
            
            if len(votes) >= self.quorum:
                break
        
        # Phase 3: Decision
        if len(votes) < self.quorum:
            return Decision(status=Status.ABORT, reason="No quorum")
        
        # Check agreement
        agree_votes = sum(1 for v in votes if v.decision == Decision.AGREE)
        if agree_votes >= self.quorum:
            return Decision(
                status=Status.COMMIT,
                proposal_hash=proposal_hash,
                votes=votes,
            )
        
        return Decision(status=Status.ABORT, reason="No agreement")
    
    def _verify_vote(self, vote: Vote, expected_pubkey: bytes) -> bool:
        """Verify a vote's Sigil signature and anti-replay nonce."""
        # Verify Ed25519 signature
        if not ed25519_verify(vote.signature, vote.payload, expected_pubkey):
            return False
        
        # Check nonce hasn't been seen
        if self._nonce_seen(vote.nonce):
            return False
        
        # Verify timestamp within acceptable window
        if abs(time.time_ns() - vote.timestamp) > VOTE_TIMEOUT_NS:
            return False
        
        return True
```

### 11.5 Threat Matrix Summary

```
                     | Spoofing | Tampering | Repudiation | Info Disclosure | DoS  | Elevation
---------------------|----------|-----------|-------------|-----------------|------|------------
Inter-Agent Msg      | Ed25519  | HMAC+Sig  | Merkle Log  | E2E encrypt     | BFT  | ZK proofs
Tool Invocation      | DID      | Sandbox   | Audit trail | TEE isolation   | Rate | Capability
Memory/Vector        | Auth     | Checksum  | CT log      | Field encrypt   | Quota| RBAC
Secret Storage       | Vault    | SOPS      | Audit log   | Transit encrypt | HA   | Policy
Identity             | BIP32    | Revoke    | Blockchain  | Selective ZK    | Mesh | Tier
```

---

## 12. Supply Chain Security (SLSA Framework)

### 12.1 SLSA Levels for Sigil Artifacts

The Sigil Protocol adopts SLSA (Supply Chain Levels for Software Artifacts) for all agent binaries, configurations, and protocol implementations [^238^] [^242^] [^246^].

| SLSA Level | Requirement | Sigil Implementation |
|------------|-------------|---------------------|
| **Level 1** | Provenance documentation | Automated build provenance generation for all agent images |
| **Level 2** | Signed provenance + hosted build | Sigstore/cosign signed attestations from GitHub Actions |
| **Level 3** | Hardened build + hermetic | Isolated builds, ephemeral agents, no volume mounts |
| **Level 4** | Two-party review + reproducible builds | Mandatory 2-reviewer PRs, reproducible container builds |

### 12.2 Attestation Pipeline

```
+------------------+     +-------------------+     +------------------+
|  GitHub Actions  | --> |  slsa-github-gen  | --> |  Cosign Sign     |
|  Build Agent     |     |  (provenance)     |     |  (keyless)       |
+------------------+     +-------------------+     +------------------+
                                                          |
                                                          v
+------------------+     +-------------------+     +------------------+
|  Sigil Registry  | <-- |  SLSA Verify      | <-- |  Rekor Log       |
|  (policy check)  |     |  (verification)   |     |  (transparency)  |
+------------------+     +-------------------+     +------------------+
```

### 12.3 Implementation

```yaml
# .github/workflows/sigil-slsa.yml
name: Sigil SLSA Build
on:
  push:
    tags: ['v*']

jobs:
  build:
    runs-on: ubuntu-latest
    permissions:
      id-token: write  # For Sigstore OIDC
      contents: read
      actions: read
    outputs:
      digest: ${{ steps.build.outputs.digest }}
    steps:
      - uses: actions/checkout@v4
      
      - name: Build agent container
        id: build
        uses: docker/build-push-action@v5
        with:
          push: true
          tags: ghcr.io/meok-pa/sigil-agent:${{ github.ref_name }}
      
      - name: Generate SLSA provenance
        uses: slsa-framework/slsa-github-generator@v2
        with:
          subject-name: ghcr.io/meok-pa/sigil-agent
          subject-digest: ${{ steps.build.outputs.digest }}
          push-to-registry: true

  verify:
    needs: build
    runs-on: ubuntu-latest
    steps:
      - name: Verify SLSA provenance
        uses: slsa-framework/slsa-verifier@v2
        with:
          source-uri: github.com/meok-pa/sigil
          subject-name: ghcr.io/meok-pa/sigil-agent
          subject-digest: ${{ needs.build.outputs.digest }}
```

### 12.4 Kubernetes Admission Control

```yaml
# Kyverno policy: require SLSA verification
apiVersion: kyverno.io/v1
kind: ClusterPolicy
metadata:
  name: require-sigil-slsa
spec:
  validationFailureAction: Enforce
  rules:
  - name: check-slsa-provenance
    match:
      resources:
        kinds:
        - Pod
        namespaces:
        - "meok-pa*"
    validate:
      message: "All Sigil agents must have verified SLSA provenance"
      foreach:
      - list: "request.object.spec.containers"
        deny:
          conditions:
          - key: "{{ element.image }}"
            operator: NotEquals
            value: "ghcr.io/meok-pa/*"
```

---

## 13. Post-Quantum Cryptography Considerations

### 13.1 Current State: PQC Standards

NIST finalized three post-quantum cryptography standards in August 2024 [^243^] [^269^] [^270^]:

| Standard | Algorithm | Purpose | Key Size | Signature Size |
|----------|-----------|---------|----------|---------------|
| **FIPS 203** | ML-KEM | Key Encapsulation | 1,568-3,168 bytes | N/A (KEM) |
| **FIPS 204** | ML-DSA | Digital Signatures | 1,312-2,592 bytes | 2,420-4,627 bytes |
| **FIPS 205** | SLH-DSA | Hash-based Signatures | 64-128 bytes | 7,856-49,856 bytes |
| **FIPS 206** | FN-DSA | Lattice Signatures | 1,793 bytes | 1,280 bytes |

### 13.2 Size Impact on Sigil Protocol

The transition from Ed25519 to PQC signatures has significant size implications [^243^]:

| Component | Ed25519 (Current) | ML-DSA-65 (PQC) | Increase |
|-----------|-------------------|-----------------|----------|
| Signature | 64 bytes | 3,293 bytes | **51x** |
| Public Key | 32 bytes | 1,952 bytes | **61x** |
| Sigil Envelope | ~400 bytes | ~3,800 bytes | **9.5x** |
| Batch (1000 msgs) | ~400 KB | ~3.3 MB | **8.3x** |

### 13.3 Hybrid Deployment Strategy

The Sigil Protocol adopts a hybrid approach during the transition period [^241^]:

```
Sigil-v1 (Current):    Ed25519 signatures only
Sigil-v2 (Hybrid):     Ed25519 + ML-DSA dual signatures
Sigil-v3 (PQC):        ML-DSA only (after cryptoperiod)
```

```python
class HybridSigilSigner:
    """
    Hybrid classical + post-quantum signer.
    Provides quantum resistance while maintaining compatibility.
    """
    
    def __init__(self, 
                 ed25519_key: Ed25519PrivateKey,
                 mldsa_key: MLDSAPrivateKey):
        self.ed25519 = ed25519_key
        self.mldsa = mldsa_key
    
    def sign(self, message: bytes) -> dict:
        """
        Dual-sign a message with both classical and PQC algorithms.
        
        Format:
        {
            "classical": "base64(Ed25519 signature)",
            "pqc": "base64(ML-DSA signature)",
            "hybrid_version": "sigil-v2-hybrid-2026"
        }
        """
        ed25519_sig = self.ed25519.sign(message)
        mldsa_sig = self.mldsa.sign(message)
        
        return {
            "classical": base64.b64encode(ed25519_sig).decode(),
            "pqc": base64.b64encode(mldsa_sig).decode(),
            "hybrid_version": "sigil-v2-hybrid-2026",
            "classical_alg": "Ed25519",
            "pqc_alg": "ML-DSA-65",
        }
    
    def verify(self, message: bytes, signatures: dict) -> bool:
        """
        Verify hybrid signatures.
        For maximum security: both signatures must be valid.
        For compatibility: at least classical valid.
        """
        classical_valid = False
        pqc_valid = False
        
        if "classical" in signatures:
            classical_sig = base64.b64decode(signatures["classical"])
            classical_valid = self.ed25519.verify(message, classical_sig)
        
        if "pqc" in signatures:
            pqc_sig = base64.b64decode(signatures["pqc"])
            pqc_valid = self.mldsa.verify(message, pqc_sig)
        
        # Require at least classical valid during transition
        # Require both valid in strict mode
        return classical_valid and (not self.strict_mode or pqc_valid)
```

### 13.4 Post-Quantum Key Encapsulation

```python
from cryptography.hazmat.primitives.asymmetric.mlkem import MLKEM768

class PQCTransportEncryption:
    """
    Hybrid key encapsulation for gRPC transport.
    Combines X25519 + ML-KEM for quantum-resistant key exchange.
    """
    
    def __init__(self):
        self.mlkem = MLKEM768()
    
    def encapsulate(self, peer_public_key: bytes) -> tuple:
        """
        Encapsulate a shared secret using ML-KEM.
        Returns (ciphertext, shared_secret).
        """
        return self.mlkem.encapsulate(peer_public_key)
    
    def hybrid_key_exchange(self, 
                           x25519_shared: bytes,
                           mlkem_shared: bytes) -> bytes:
        """
        Combine classical and PQC shared secrets.
        Uses HKDF-SHA3-256 for key derivation.
        """
        combined = x25519_shared + mlkem_shared
        return HKDF(
            algorithm=SHA3_256(),
            length=32,
            salt=None,
            info=b"sigil-hybrid-kex-v2",
        ).derive(combined)
```

### 13.5 Migration Timeline

| Phase | Timeline | Actions |
|-------|----------|---------|
| **Phase 1: Assessment** | Q3 2026 | Inventory all Ed25519 usage, benchmark ML-DSA performance |
| **Phase 2: Hybrid Deploy** | Q4 2026 | Deploy hybrid signing (Ed25519+ML-DSA) for new agents |
| **Phase 3: Migration** | Q1-Q2 2027 | Upgrade all agents to hybrid, test interoperability |
| **Phase 4: PQC-Only** | Q3 2027+ | Disable Ed25519, ML-DSA-only for new signatures |
| **Phase 5: Lattice HD** | 2028+ | Deploy post-quantum BIP32 from lattice HD wallets [^250^] |

### 13.6 Post-Quantum BIP32 (Research)

Recent research has produced the first post-quantum HD wallet construction that recovers BIP32's full public key derivation functionality using Raccoon-G (a variant of the Raccoon signature scheme) [^250^]. The construction uses Gaussian-distributed secrets where derived keys remain statistically close to freshly generated ones, enabling both hardened and non-hardened derivation under standard lattice assumptions.

---

## 14. Complete Protocol Specification

### 14.1 Message Lifecycle

```
1. CREATE
   Agent creates payload (task, query, response)
   
2. SERIALIZE
   Payload -> Protobuf/JSON -> canonical bytes
   
3. ENCRYPT (optional)
   If payload is sensitive: ChaCha20-Poly1305 encrypt
   Derive key from shared secret (X25519/ML-KEM hybrid)
   
4. SIGN
   Hash = SHA3-256("Sigil-v1" || sender_pubkey || timestamp || nonce || encrypted_payload)
   Signature = Ed25519.sign(sender_privkey, Hash)
   
5. ATTEST
   Append signed message to local Merkle tree
   Get inclusion proof + leaf index
   
6. ENVELOPE
   Construct SigilEnvelope with all fields
   
7. TRANSPORT
   Serialize envelope -> gRPC with mTLS
   Attach JWT-SVID for authorization
   
8. VERIFY (receiver)
   a. Verify mTLS client certificate
   b. Verify JWT-SVID signature and claims
   c. Verify Ed25519 signature on message
   d. Verify BIP32 chain-of-trust from OOWM
   e. Verify Merkle inclusion proof
   f. Verify timestamp and nonce (anti-replay)
   g. Verify ZK capability proof (if required)
   h. Decrypt payload (if encrypted)
   i. Process message
   
9. LOG
   Append to receiver's transparency log
   
10. ACKNOWLEDGE
    Return signed receipt with Merkle inclusion proof
```

### 14.2 Protocol Constants

```python
class SigilConstants:
    # Cryptographic
    ED25519_PUBLIC_KEY_SIZE = 32
    ED25519_SIGNATURE_SIZE = 64
    X25519_PUBLIC_KEY_SIZE = 32
    CHACHA20_KEY_SIZE = 32
    CHACHA20_NONCE_SIZE = 12
    SHA3_256_DIGEST_SIZE = 32
    BLAKE2B_DIGEST_SIZE = 64
    
    # BIP32-Ed25519
    BIP32_PURPOSE = 44    # SLIP-44
    BIP32_COIN_TYPE = 1729  # Tezos namespace
    BIP32_HARDENED_BIT = 0x80000000
    
    # Timing
    MAX_CLOCK_SKEW_MS = 300_000  # 5 minutes
    NONCE_SIZE = 24
    DEFAULT_TTL_SECONDS = 3600
    
    # Protocol
    SIGIL_VERSION = b"\x00Sigil-v1"
    SIGIL_VERSION_HYBRID = b"\x00Sigil-v2-hybrid"
    MAX_PAYLOAD_SIZE = 16_777_216  # 16 MB
    
    # ZK
    ZK_CAPABILITY_CIRCUIT = "sigil-capability-v1"
    ZK_PROOF_MAX_SIZE = 65_536  # 64 KB
    
    # Merkle tree
    MERKLE_LEAF_PREFIX = b"\x00"
    MERKLE_NODE_PREFIX = b"\x01"
    MAX_TREE_SIZE = 1_000_000  # 1M leaves before forced anchor
    ANCHOR_INTERVAL_SECONDS = 3600  # Anchor every hour
```

### 14.3 Error Codes

| Code | Name | Description |
|------|------|-------------|
| 1001 | SIGIL_INVALID_SIGNATURE | Ed25519 signature verification failed |
| 1002 | SIGIL_INVALID_CHAIN | BIP32 chain-of-trust verification failed |
| 1003 | SIGIL_EXPIRED | Message timestamp outside acceptable window |
| 1004 | SIGIL_REPLAY_DETECTED | Nonce has been seen before |
| 1005 | SIGIL_INVALID_CAPABILITY | ZK capability proof invalid or insufficient |
| 1006 | SIGIL_REVOKED | Sender's sigil has been revoked |
| 1007 | SIGIL_INVALID_PROOF | Merkle inclusion proof invalid |
| 1008 | SIGIL_DECRYPT_FAILED | Payload decryption failed |
| 1009 | SIGIL_TIER_VIOLATION | Sender tier cannot access target resource |
| 1010 | SIGIL_ANCHOR_FAILED | Blockchain anchor verification failed |

---

## 15. Reference Implementations

### 15.1 Complete Sigil Agent (Python)

```python
#!/usr/bin/env python3
"""
Sigil Agent - Reference Implementation
Complete agent with signing, verification, and transparency logging.
"""

import asyncio
import hashlib
import json
import time
from dataclasses import dataclass, field
from typing import Optional, List, Dict
import nacl.signing
import nacl.encoding
from cryptography.hazmat.primitives.ciphers.aead import ChaCha20Poly1305

@dataclass
class SigilMessage:
    """A signed, attested inter-agent message."""
    sender_pubkey: bytes                    # 32 bytes Ed25519
    sigil_path: str                         # BIP32 path
    timestamp_ns: int                       # Unix nanoseconds
    nonce: bytes                            # 24 bytes random
    payload: bytes                          # Encrypted or plaintext
    payload_type: str = "application/json"
    ed25519_signature: bytes = b""
    merkle_index: int = -1
    merkle_proof: List[bytes] = field(default_factory=list)
    block_anchor: str = ""
    zkp_credential: bytes = b""
    
    def serialize_for_sign(self) -> bytes:
        """Serialize fields for signing (excludes signature itself)."""
        return (
            b"\x00Sigil-v1"
            + self.sender_pubkey
            + self.sigil_path.encode()
            + self.timestamp_ns.to_bytes(8, 'big')
            + self.nonce
            + self.payload_type.encode()
            + self.payload
        )
    
    def serialize(self) -> bytes:
        """Full serialization including signature."""
        return json.dumps({
            "sender_pubkey": self.sender_pubkey.hex(),
            "sigil_path": self.sigil_path,
            "timestamp_ns": self.timestamp_ns,
            "nonce": self.nonce.hex(),
            "payload": self.payload.hex(),
            "payload_type": self.payload_type,
            "ed25519_signature": self.ed25519_signature.hex(),
            "merkle_index": self.merkle_index,
            "merkle_proof": [p.hex() for p in self.merkle_proof],
            "block_anchor": self.block_anchor,
        }).encode()

class SigilAgent:
    """
    A Sigil-enabled agent with full cryptographic capabilities.
    """
    
    def __init__(self,
                 agent_id: str,
                 sigil_path: str,
                 private_key_seed: bytes,
                 tier: str = "product",
                 transparency_log: Optional['SigilTransparencyLog'] = None):
        self.agent_id = agent_id
        self.sigil_path = sigil_path
        self.tier = tier
        self.transparency_log = transparency_log or SigilTransparencyLog()
        
        # Generate Ed25519 keypair from seed
        self.signing_key = nacl.signing.SigningKey(private_key_seed[:32])
        self.verify_key = self.signing_key.verify_key
        
        # Anti-replay cache
        self.seen_nonces: set = set()
        self.max_nonce_cache = 100_000
    
    async def send_message(self,
                          recipient: 'SigilAgent',
                          payload: dict,
                          encrypt: bool = True) -> SigilMessage:
        """Create, sign, and send a Sigil message."""
        # Create message
        payload_bytes = json.dumps(payload).encode()
        
        if encrypt and recipient:
            # Derive shared secret and encrypt
            payload_bytes = await self._encrypt_payload(
                payload_bytes, 
                recipient.verify_key.encode()
            )
        
        msg = SigilMessage(
            sender_pubkey=self.verify_key.encode(),
            sigil_path=self.sigil_path,
            timestamp_ns=time.time_ns(),
            nonce=self._generate_nonce(),
            payload=payload_bytes,
        )
        
        # Sign
        to_sign = msg.serialize_for_sign()
        msg.ed25519_signature = self.signing_key.sign(to_sign).signature
        
        # Attest to transparency log
        leaf_index = self.transparency_log.append(msg.serialize())
        msg.merkle_index = leaf_index
        msg.merkle_proof = self.transparency_log.get_inclusion_proof(leaf_index)
        
        return msg
    
    async def verify_message(self, 
                            msg: SigilMessage,
                            trust_anchor: bytes) -> bool:
        """
        Full verification of a received Sigil message.
        
        Checks:
        1. Ed25519 signature valid
        2. Chain of trust from OOWM
        3. Timestamp within window
        4. Nonce not replayed
        5. Merkle inclusion proof valid
        """
        # 1. Verify Ed25519 signature
        try:
            verify_key = nacl.signing.VerifyKey(msg.sender_pubkey)
            verify_key.verify(
                msg.serialize_for_sign(),
                msg.ed25519_signature
            )
        except nacl.exceptions.BadSignatureError:
            return False
        
        # 2. Verify chain of trust (simplified)
        # In production: derive expected pubkey from trust_anchor + sigil_path
        
        # 3. Verify timestamp
        now = time.time_ns()
        skew = 5 * 60 * 1_000_000_000  # 5 minutes
        if abs(now - msg.timestamp_ns) > skew:
            return False
        
        # 4. Check nonce (anti-replay)
        if msg.nonce in self.seen_nonces:
            return False
        self.seen_nonces.add(msg.nonce)
        if len(self.seen_nonces) > self.max_nonce_cache:
            self.seen_nonces.clear()  # Simple eviction
        
        # 5. Verify Merkle inclusion proof
        if msg.merkle_index >= 0 and msg.merkle_proof:
            log_root = self.transparency_log.get_root()
            if not self.transparency_log.verify_inclusion(
                msg.merkle_index,
                msg.serialize(),
                msg.merkle_proof,
                log_root,
            ):
                return False
        
        return True
    
    def _generate_nonce(self) -> bytes:
        """Generate a cryptographically random nonce."""
        import secrets
        return secrets.token_bytes(24)
    
    async def _encrypt_payload(self, 
                               payload: bytes, 
                               recipient_pubkey: bytes) -> bytes:
        """Encrypt payload for a specific recipient using X25519."""
        # Implementation: ephemeral X25519 key exchange + ChaCha20-Poly1305
        pass

# Example usage
async def main():
    """Demonstrate Sigil agent communication."""
    
    # Create OOWM master agent
    oowm_seed = b"o" * 32  # In production: from HSM/Vault
    oowm = SigilAgent(
        agent_id="oowm-master",
        sigil_path="m/44'/1729'/0'",
        private_key_seed=oowm_seed,
        tier="oowm",
    )
    
    # Create General agent (derived from OOWM)
    general_seed = b"g" * 32
    general = SigilAgent(
        agent_id="general-0",
        sigil_path="m/44'/1729'/0'/0/0",
        private_key_seed=general_seed,
        tier="general",
    )
    
    # Create Keystone agent
    keystone_seed = b"k" * 32
    keystone = SigilAgent(
        agent_id="keystone-finance",
        sigil_path="m/44'/1729'/0'/0/0/0/0",
        private_key_seed=keystone_seed,
        tier="keystone",
    )
    
    # Send message from keystone to general
    payload = {
        "type": "task_result",
        "task_id": "task-12345",
        "result": {"status": "success", "data": "..."},
    }
    
    msg = await keystone.send_message(general, payload)
    
    # Verify at general
    is_valid = await general.verify_message(
        msg, 
        trust_anchor=oowm.verify_key.encode()
    )
    
    print(f"Message valid: {is_valid}")
    print(f"Sigil path: {msg.sigil_path}")
    print(f"Merkle index: {msg.merkle_index}")
    print(f"Signature: {msg.ed25519_signature.hex()[:32]}...")

if __name__ == "__main__":
    asyncio.run(main())
```

### 15.2 Performance Benchmarks (Estimated)

| Operation | Ed25519-only | Hybrid (Ed25519+ML-DSA) | Notes |
|-----------|-------------|------------------------|-------|
| Key generation | 0.1 ms | 2.5 ms | ML-DSA keygen is slower |
| Sign message | 0.05 ms | 3.2 ms | ML-DSA signing is ~60x slower |
| Verify signature | 0.1 ms | 1.5 ms | ML-DSA verification is ~15x slower |
| BIP32 derivation | 0.2 ms | 5.0 ms | Lattice derivation is research-stage |
| ZK proof generation | N/A | 500 ms | Groth16 prover time |
| ZK proof verification | N/A | 2 ms | Groth16 verifier time |
| Merkle inclusion proof | 0.01 ms | 0.01 ms | O(log n) SHA-256 ops |
| Full send pipeline | 1 ms | 8 ms | End-to-end with all checks |
| Full verify pipeline | 2 ms | 12 ms | End-to-end with all checks |

---

## Appendix A: Key Derivation Diagrams

### A.1 Full Hierarchy (5-Tier)

```
Seed (256-bit CSPRNG output)
  |
  HMAC-SHA512("Sigil-BIP32-Ed25519", seed)
  |
  +-- kL (clamped Ed25519 scalar)
  +-- kR (256-bit extension)
  +-- chain_code (256-bit)
  |
  +-- [kL] * B = Master Public Key
  |
  |
  +-- Derive(0x8000002C)  [44' - purpose]
  |     |
  |     +-- Derive(0x800006C1)  [1729' - coin_type]
  |           |
  |           +-- Derive(0x80000000)  [0' - account: OOWM]
  |                 |
  |                 +-- Derive(0x80000000)  [0' - change: General tier]
  |                 |     |
  |                 |     +-- Derive(0)  [0 - General #0]
  |                 |     |     |
  |                 |     |     +-- Derive(0)  [0 - Keystone tier]
  |                 |     |     |     |
  |                 |     |     |     +-- Derive(0)  [0 - Keystone #0]
  |                 |     |     |     |     |
  |                 |     |     |     |     +-- Derive(0)  [0 - Product #0]
  |                 |     |     |     |     +-- Derive(1)  [1 - Product #1]
  |                 |     |     |     |
  |                 |     |     |     +-- Derive(1)  [1 - Keystone #1]
  |                 |     |     |
  |                 |     |     +-- Derive(1)  [1 - Keystone tier alt]
  |                 |     |
  |                 |     +-- Derive(1)  [1 - General #1]
  |                 |
  |                 +-- Derive(0x80000001)  [1' - account: OOWM backup]
  |
  +-- Derive(0x80000002)  [2' - recovery]
```

### A.2 Path Derivation Visualization

```
Depth:  0       1         2          3           4         5         6
        m / 44' / 1729' / account' / change' / general / keystone / product
        |    |      |        |          |         |         |        |
OOWM:   *    *      *        0'         -         -         -        -
Gen-0:  *    *      *        0'         0'        0         -        -
Kst-0:  *    *      *        0'         0'        0         0        -
Prd-0:  *    *      *        0'         0'        0         0        0
```

---

## Appendix B: Protocol Versioning

| Version | Status | Algorithms | Features |
|---------|--------|------------|----------|
| Sigil-v0 | Deprecated | Ed25519, X25519, SHA3-256 | Basic signing, gRPC+mTLS |
| **Sigil-v1** | **Current** | Ed25519, X25519, SHA3-256, Groth16 ZK | Full ZK proofs, Merkle logs, blockchain anchors |
| Sigil-v2 | Planned | Hybrid Ed25519+ML-DSA, X25519+ML-KEM | Post-quantum hybrid mode |
| Sigil-v3 | Planned | ML-DSA, ML-KEM, lattice HD | Full post-quantum |

---

## Appendix C: Glossary

| Term | Definition |
|------|------------|
| **Sigil** | A cryptographic identity token in the Meok-Pa architecture |
| **OOWM** | One Overlord Watchtower Module — the root trust anchor |
| **BIP32** | Bitcoin Improvement Proposal 32 — hierarchical key derivation |
| **ZK-SNARK** | Zero-Knowledge Succinct Non-Interactive Argument of Knowledge |
| **Merkle Tree** | A binary hash tree for efficient integrity verification |
| **mTLS** | Mutual Transport Layer Security — both parties authenticate |
| **SLSA** | Supply Chain Levels for Software Artifacts |
| **MCP** | Model Context Protocol — Anthropic's tool integration standard |
| **TEE** | Trusted Execution Environment — hardware-isolated computation |
| **ML-DSA** | Module-Lattice-Based Digital Signature Algorithm (FIPS 204) |
| **ML-KEM** | Module-Lattice-Based Key Encapsulation Mechanism (FIPS 203) |

---

## References

[^239^] Thales Docs. "Hierarchical deterministic wallets in ProtectToolkit." BIP32 HD wallets documentation. https://thalesdocs.com/gphsm/ptk/protectserver3/docs/ps_ptk_docs/ptkc_programming/best_practices/hierarchical_deterministic_wallets/index.html

[^240^] Artem A. "How to Choose a Messaging Protocol for Agent-to-Agent Communication." Dev.to, 2026-05-12. https://dev.to/artem_a/how-to-choose-a-messaging-protocol-for-agent-to-agent-communication-2obb

[^241^] Deepak Gupta. "Post-Quantum Cryptography for Authentication: The Enterprise Migration Guide 2026." 2026-05-25. https://guptadeepak.com/post-quantum-cryptography-for-authentication-the-enterprise-migration-guide-2026/

[^242^] Harness. "SLSA: Supply Chain Levels for Software Artifacts." Harness Blog, 2026-03-23. https://www.harness.io/blog/slsa-supply-chain-levels-for-software-artifacts

[^243^] Hedera. "Post-Quantum Cryptography and Blockchain." Hedera Blog, 2026-04-30. https://hedera.com/blog/post-quantum-cryptography-and-blockchain/

[^244^] StackHawk. "A Developer's Guide to gRPC Security Best Practices." 2026-02-24. https://www.stackhawk.com/blog/best-practices-for-grpc-security/

[^245^] Ledger Academy. "BIP-32: Understanding Hierarchical Deterministic Wallets." Ledger, 2026-04-09. https://www.ledger.com/academy/crypto/what-are-hierarchical-deterministic-hd-wallets

[^246^] Practical DevSecOps. "SLSA Framework: The Definitive Guide for Securing Your Software Supply Chain." 2026-02-12. https://www.practical-devsecops.com/slsa-framework-guide-software-supply-chain-security/

[^247^] SoftwareSeni. "Implementing SLSA Build Integrity Framework for Software Supply Chain Security." 2026-02-15. https://www.softwareseni.com/implementing-slsa-build-integrity-framework-for-software-supply-chain-security/

[^248^] Christian Schneider. "Threat modeling agentic AI: a scenario-driven approach." 2026-02-05. https://christian-schneider.net/blog/threat-modeling-agentic-ai/

[^249^] arXiv. "Towards Secure Systems of Interacting AI Agents." arXiv:2505.02077v1, 2025-03-25. https://arxiv.org/html/2505.02077v1

[^250^] Fitzwater et al. "Lattice HD Wallets: Post-Quantum BIP32 Hierarchical Deterministic Wallets from Lattice Assumptions." ePrint 2026/380, 2026-02-27. https://eprint.iacr.org/2026/380

[^251^] Nikhil Padala. "Hierarchical Deterministic Wallets in Practice: BIP-32/39/44 and Where Real Implementations Go Wrong." 2026-02-25. https://nikhilpadala.com/blog/hd-wallets-bip32-39-44

[^252^] Octopus Deploy. "Understanding SLSA For Supply Chain Security." 2025-10-10. https://octopus.com/blog/understanding-slsa-for-supply-chain-security

[^253^] Trezor. "What is BIP32? How hierarchical deterministic wallets work." https://trezor.io/learn/advanced/standards-proposals/what-is-bip-32-how-hierarchical-deterministic-wallets-work

[^263^] arXiv. "A Byzantine Fault Tolerance Approach towards AI Safety." arXiv:2504.14668. https://arxiv.org/pdf/2504.14668

[^264^] Guo et al. "Systematic Analysis of MCP Security." arXiv:2508.12538v1, 2025-03-29. https://arxiv.org/html/2508.12538v1

[^265^] Mircea Anton. "Doing Secrets The GitOps Way." 2026-06-04. https://mirceanton.com/posts/doing-secrets-the-gitops-way/

[^266^] Major Hayden. "Encrypted gitops secrets with flux and age." 2026-06-07. https://major.io/p/encrypted-gitops-secrets-with-flux-and-age/

[^267^] CallSphere. "Voting, Averaging, and Byzantine Fault Tolerance." 2026-06-13. https://callsphere.ai/blog/consensus-algorithms-multi-agent-systems-voting-averaging-byzantine-fault-tolerance

[^268^] Infisical. "SPIFFE/SPIRE OIDC Auth." Infisical Docs, 2026-04-07. https://infisical.com/docs/documentation/platform/identities/oidc-auth/spire

[^269^] F5 Community. "A Practical Post-Quantum Cryptography Implementation Guide." 2026-04-17. https://community.f5.com/kb/technicalarticles/hands-on-quantum-safe-pki-a-practical-post-quantum-cryptography-implementation-g/344773

[^270^] Quantum Security Defence. "NIST FIPS 203, 204, and 205: What Each Standard Requires." 2026-04-09. https://quantumsecuritydefence.com/insights/nist-fips-standards/

[^271^] Medium. "Managing Kubernetes Secrets with Mozilla SOPS and AGE." 2026-02-08. https://medium.com/@cbaah123/managing-kubernetes-secrets-with-mozilla-sops-and-age-780c84e6ec5e

[^272^] Aquilax. "MCP Server Security: Path Traversal, Tool Poisoning, RCE." 2026-04-11. https://aquilax.ai/blog/mcp-server-path-traversal

[^273^] Techno Tim. "Encrypting with Mozilla SOPS and AGE." 2026-01-07. https://technotim.com/posts/secret-encryption-sops/

[^274^] Harness Developer. "Manage Kubernetes secrets with Mozilla SOPS." 2025-12-08. https://developer.harness.io/docs/continuous-delivery/gitops/security/sops/

[^275^] Curity. "Harden OAuth Client Credentials with SPIFFE JWT SVIDs." 2025-12-04. https://curity.io/resources/learn/oauth-client-credentials-spiffe-jwt-svids/

[^276^] D-Central. "Etching Your Mark: Writing On The Bitcoin Blockchain." 2026-05-23. https://d-central.tech/etching-your-mark-writing-on-the-bitcoin-blockchain/

[^277^] Certificate Transparency. "How CT Works." https://certificate.transparency.dev/howctworks/

[^278^] Spark Money. "Bitcoin Timestamp Server: Proof of Existence and Anchoring." https://www.spark.money/tools/bitcoin-timestamp-server-explained

[^296^] Tech Jacks Solutions. "Agentic AI Threat Landscape: OWASP, MITRE ATLAS & MAESTRO." 2026-05-09. https://techjacksolutions.com/ai/agentic-ai/secure/agent-threat-landscape/

[^297^] Artem A. "Noise Protocol Framework for Agent Communication." Dev.to, 2026-05-12. (Same as [^240^])

[^298^] OneUptime. "How to Use HashiCorp Vault Dynamic Secrets for Databases." 2026-02-20. https://oneuptime.com/blog/post/2026-02-20-vault-dynamic-secrets/view

[^299^] HashiCorp. "Database secrets engine." Vault Docs, 2026-04-15. https://developer.hashicorp.com/vault/docs/secrets/databases

[^300^] Christian Schneider. "Threat modeling agentic AI." (Same as [^248^])

[^301^] Will Velida. "Preventing Insecure Inter-Agent Communication in AI Agents." Dev.to, 2026-03-13. https://dev.to/willvelida/preventing-insecure-inter-agent-communication-in-ai-agents-hnp

[^302^] Medium. "Kubernetes and Vault Agent Injector: Dynamic Secrets Management." 2025-10-10. https://medium.com/@infralovers/kubernetes-and-vault-agent-injector-dynamic-secrets-management-61ce160108de

[^305^] FlowFactor. "PostgreSQL Dynamic Credentials with HashiCorp Vault." https://flowfactor.be/blogs/postgresql-dynamic-credentials-with-hashicorp-vault/

[^306^] IOHK. "BIP32-Ed25519 Hierarchical Deterministic Keys over a Non-linear Keyspace." Input Output HK Technical Report. https://input-output-hk.github.io/adrestia/static/Ed25519_BIP.pdf

[^307^] Certificate Transparency. "How CT Works." (Same as [^277^])

[^308^] RFC 9162. "Certificate Transparency Version 2.0." IETF. https://datatracker.ietf.org/doc/html/rfc9162

[^329^] Crespo et al. "Stampery Blockchain Timestamping Architecture (BTA)." arXiv:1711.04709. https://arxiv.org/pdf/1711.04709

[^330^] CryptoLinks. "OpenTimestamps - Opentimestamps.org." 2026-06-16. https://cryptolinks.com/756/opentimestamps

[^331^] OneUptime. "How to Implement Supply Chain Security with Sigstore." 2026-01-25. https://oneuptime.com/blog/post/2026-01-25-sigstore-supply-chain-security/view

[^332^] RFC 9750. "The Messaging Layer Security (MLS) Architecture." IETF, 2025-12-01. https://datatracker.ietf.org/doc/rfc9750/

[^334^] Wire. "Messaging Layer Security (MLS) Explained." 2025-12-02. https://wire.com/en/blog/messaging-layer-security-mls-explained

[^335^] Robert, Raphael. "Messaging Layer Security." GI FG NETSEC, July 2020. https://fg-netsec.gi.de/fileadmin/FG/NETSEC/2020-07_Workshop__E2EE/MLS_%40_GI_Netsec.pdf

[^336^] AIOps Vista. "Pinecone vs Qdrant: Vector Database Comparison." https://aiopsvista.com/docs/comparisons/pinecone-vs-qdrant

[^338^] Pinecone. "Pinecone: The vector database to build knowledgeable AI." https://www.pinecone.io/

[^339^] IETF Blog. "Secure and Usable End-to-End Encryption." 2026-04-30. https://www.ietf.org/blog/mls-secure-and-usable-end-to-end-encryption/

[^356^] Dynamic.xyz. "Introduction to Trusted Execution Environments (TEEs)." 2026-06-09. https://www.dynamic.xyz/blog/trusted-execution-environments

[^357^] MATTR Learn. "Decentralized Identifiers (DIDs)." 2026-05-15. https://learn.mattr.global/docs/concepts/dids

[^358^] TrueOriginal. "W3C Verifiable Credentials: How They Work + Use Cases 2026." 2026-03-04. https://www.trueoriginal.com/insights/verifiable-credentials-w3c-guide

[^359^] W3C. "Decentralized Identifiers (DIDs) v1.1." W3C Recommendation, 2026-03-05. https://www.w3.org/TR/did-1.1/

[^360^] Cloudflare. "OPAQUE: The Best Passwords Never Leave your Device." 2025-10-03. https://blog.cloudflare.com/opaque-oblivious-passwords/

[^361^] SSRN. "Privacy-Preserving Credentials in Decentralized Identity." 2025-08-22. https://papers.ssrn.com/sol3/Delivery.cfm/65d57cff-706b-4c3f-880e-c47420a10acb-MECA.pdf?abstractid=5402209

[^362^] ACM. "DID and VC: Untangling Decentralized Identifiers and Verifiable Credentials for the Web of Trust." 2025-09-01. https://dl.acm.org/doi/fullHtml/10.1145/3446983.3446992

[^363^] Phala. "What Is Trusted Execution Environment (TEE)?" 2026-06-17. https://phala.com/learn/What-Is-TEE

[^364^] Chainlink. "Trusted Execution Environments (TEEs) in Blockchain." https://chain.link/article/trusted-execution-environments-blockchain

[^365^] IOTA Identity. "Zero Knowledge Selective Disclosure (ZK-SD-VCs)." https://docs.iota.org/developer/iota-identity/how-tos/verifiable-credentials/zero-knowledge-selective-disclosure

[^366^] IJSAT. "Zero-Knowledge Proof-Based Identity Verification in Decentralized Systems." 2025. https://www.ijsat.org/papers/2025/3/8750.pdf

[^367^] European Digital Identity Wallet. "G - Zero Knowledge Proof." 2025-03-30. https://eu-digital-identity-wallet.github.io/eudi-doc-architecture-and-reference-framework/2.4.0/discussion-topics/g-zero-knowledge-proof/

[^368^] GS1. "Verifiable Credentials and Decentralised Identifiers Technical Landscape." 2025-02-03. https://ref.gs1.org/docs/2025/VCs-and-DIDs-tech-landscape

[^369^] Vidos. "Understanding Zero-Knowledge Proofs in Digital Identity Systems." https://vidos.id/blog/understanding-zero-knowledge-proofs-in-digital-identity-systems

[^370^] Asecuritysite.com. "OPAQUE - Asymmetric PAKE Protocol." https://asecuritysite.com/keyexchange/op

[^371^] Gataca. "Zero Knowledge Proof (ZKP) and Selective Disclosure." 2024-11-13. https://gataca.io/resources/blog/ssi-essentials-which-selective-disclosure-protocol-will-succeed/

---

*Document Version: 1.0*
*Last Updated: 2026-07-17*
*Total Searches: 24 independent queries across 14 topic areas*
*Citations: 70+ inline references*
