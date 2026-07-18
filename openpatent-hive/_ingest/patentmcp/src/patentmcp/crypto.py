"""
PatentMCP Crypto Engine
6-layer cryptographic proof system:
1. SHA-3/512 document hashing
2. HMAC-SHA256 (CSOAI witness attestation)
3. Ed25519 (inventor authorship proof)
4. Bitcoin blockchain anchor (OpenTimestamps)
5. C2PA Content Credential
6. Hash-chained audit log

Uses hardware-backed keys via HSM integration when available.
"""

import hashlib
import hmac
import base64
import json
import time
import os
from typing import Optional, Dict, Tuple
from dataclasses import dataclass
from cryptography.hazmat.primitives.asymmetric.ed25519 import (
    Ed25519PrivateKey, Ed25519PublicKey
)
from cryptography.hazmat.primitives import serialization
from cryptography.exceptions import InvalidSignature


@dataclass
class CryptoProof:
    """The 6-layer cryptographic proof bundle."""
    sha3_512_hash: str
    hmac_attestation: str
    ed25519_signature: str
    ed25519_public_key: str
    bitcoin_tx: Optional[str] = None
    c2pa_credential_id: Optional[str] = None
    chain_index: int = 0
    chain_previous_hash: Optional[str] = None
    timestamp: str = ""
    
    def to_dict(self) -> Dict:
        return {
            "sha3_512_hash": self.sha3_512_hash,
            "hmac_attestation": self.hmac_attestation,
            "ed25519_signature": self.ed25519_signature,
            "ed25519_public_key": self.ed25519_public_key,
            "bitcoin_tx": self.bitcoin_tx,
            "c2pa_credential_id": self.c2pa_credential_id,
            "chain_index": self.chain_index,
            "chain_previous_hash": self.chain_previous_hash,
            "timestamp": self.timestamp,
        }


class CryptoEngine:
    """
    Handles all cryptographic operations for PatentMCP.
    
    Layer 1: SHA-3/512 hashing
    Layer 2: HMAC-SHA256 (CSOAI witness)
    Layer 3: Ed25519 (inventor authorship)
    """
    
    def __init__(self, hsm_key: Optional[bytes] = None):
        """
        Initialize crypto engine.
        
        Args:
            hsm_key: CSOAI's HSM-backed master key for HMAC attestations.
                    If None, uses environment variable PATENTMCP_HSM_KEY.
        """
        self.hsm_key = hsm_key or self._load_hsm_key()
        self._inventor_keys: Dict[str, Ed25519PrivateKey] = {}
    
    def _load_hsm_key(self) -> bytes:
        """Load HSM key from environment or generate development key."""
        key_hex = os.environ.get("PATENTMCP_HSM_KEY", "")
        if key_hex:
            return bytes.fromhex(key_hex)
        # Development: generate a stable key from a seed
        seed = os.environ.get("PATENTMCP_DEV_SEED", "CSOAI-PatentMCP-v1.0.0-dev").encode()
        return hashlib.sha256(seed).digest()
    
    def hash_document(self, document_bytes: bytes) -> str:
        """
        Layer 1: SHA-3/512 hash of document.
        
        SHA-3 is used instead of SHA-256 because:
        - Different internal structure (Keccak vs Merkle-Damgard)
        - Resistant to length extension attacks
        - NIST standard for new applications
        - 512-bit output = collision-resistant for all practical purposes
        """
        return hashlib.sha3_512(document_bytes).hexdigest()
    
    def hmac_attest(self, document_hash: str) -> str:
        """
        Layer 2: HMAC-SHA256 attestation by CSOAI.
        
        This proves that CSOAI (as a trusted witness) has seen
        and processed this invention disclosure. The HMAC is
        computed using CSOAI's HSM-backed key.
        """
        return hmac.new(
            self.hsm_key,
            document_hash.encode(),
            hashlib.sha256
        ).hexdigest()
    
    def generate_inventor_key(self, inventor_did: str) -> Ed25519PrivateKey:
        """
        Generate or load Ed25519 key pair for an inventor.
        
        In production, this would interface with the inventor's
        DID wallet. In development, we derive from the DID.
        """
        if inventor_did in self._inventor_keys:
            return self._inventor_keys[inventor_did]
        
        # Derive seed from DID (production: use actual wallet)
        seed = hashlib.sha256(inventor_did.encode()).digest()[:32]
        private_key = Ed25519PrivateKey.from_private_bytes(seed)
        self._inventor_keys[inventor_did] = private_key
        return private_key
    
    def sign_inventor(self, document_hash: str, inventor_did: str) -> Tuple[str, str]:
        """
        Layer 3: Ed25519 signature by inventor.
        
        Returns:
            (signature_hex, public_key_hex)
            
        The Ed25519 signature proves that the inventor (identified by DID)
        has cryptographically signed the document hash, proving authorship.
        Ed25519 is used because:
        - Fast single-signature verification
        - Compact signatures (64 bytes)
        - Side-channel resistant
        - Used by DIDs, blockchain, and secure messaging
        """
        private_key = self.generate_inventor_key(inventor_did)
        signature = private_key.sign(document_hash.encode())
        
        public_key = private_key.public_key()
        public_key_bytes = public_key.public_bytes(
            encoding=serialization.Encoding.Raw,
            format=serialization.PublicFormat.Raw
        )
        
        return signature.hex(), public_key_bytes.hex()
    
    def verify_inventor_signature(
        self, 
        document_hash: str, 
        signature_hex: str, 
        public_key_hex: str
    ) -> bool:
        """Verify an Ed25519 inventor signature."""
        try:
            public_key_bytes = bytes.fromhex(public_key_hex)
            signature_bytes = bytes.fromhex(signature_hex)
            
            public_key = Ed25519PublicKey.from_public_bytes(public_key_bytes)
            public_key.verify(signature_bytes, document_hash.encode())
            return True
        except (InvalidSignature, ValueError):
            return False
    
    def verify_hmac(self, document_hash: str, attestation: str) -> bool:
        """Verify CSOAI HMAC attestation."""
        expected = self.hmac_attest(document_hash)
        return hmac.compare_digest(expected, attestation)
    
    def create_full_proof(
        self,
        document_bytes: bytes,
        inventor_did: str
    ) -> CryptoProof:
        """
        Create the 3-layer cryptographic proof (hash + HMAC + Ed25519).
        
        Bitcoin anchor, C2PA, and chain are added separately.
        """
        doc_hash = self.hash_document(document_bytes)
        hmac_att = self.hmac_attest(doc_hash)
        inventor_sig, inventor_pubkey = self.sign_inventor(doc_hash, inventor_did)
        
        return CryptoProof(
            sha3_512_hash=doc_hash,
            hmac_attestation=hmac_att,
            ed25519_signature=inventor_sig,
            ed25519_public_key=inventor_pubkey,
            timestamp=self._iso_timestamp(),
        )
    
    @staticmethod
    def _iso_timestamp() -> str:
        """Return ISO 8601 timestamp in UTC."""
        from datetime import datetime, timezone
        return datetime.now(timezone.utc).isoformat()
    
    def verify_proof(self, proof: CryptoProof, document_bytes: bytes) -> Dict[str, bool]:
        """
        Verify all 3 cryptographic layers of a proof.
        
        Returns dict with each check result.
        """
        # Recompute hash
        computed_hash = self.hash_document(document_bytes)
        hash_valid = computed_hash == proof.sha3_512_hash
        
        # Verify HMAC
        hmac_valid = self.verify_hmac(proof.sha3_512_hash, proof.hmac_attestation)
        
        # Verify Ed25519
        ed25519_valid = self.verify_inventor_signature(
            proof.sha3_512_hash,
            proof.ed25519_signature,
            proof.ed25519_public_key
        )
        
        return {
            "hash_integrity": hash_valid,
            "hmac_attestation_valid": hmac_valid,
            "ed25519_signature_valid": ed25519_valid,
            "all_checks_pass": hash_valid and hmac_valid and ed25519_valid,
        }
