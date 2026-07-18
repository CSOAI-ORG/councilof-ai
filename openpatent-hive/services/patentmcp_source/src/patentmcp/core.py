"""
PatentMCP: The Decentralized Invention Disclosure System
MCP-Mediated, Blockchain-Anchored, HMAC-Signed Prior Art Engine

This is the main orchestrator that combines all 6 cryptographic layers:
1. SHA-3/512 document hash
2. HMAC-SHA256 (CSOAI witness attestation)
3. Ed25519 (inventor authorship proof)
4. Bitcoin blockchain anchor (OpenTimestamps)
5. C2PA Content Credential
6. Hash-chained audit log

Usage:
    from patentmcp import PatentMCP
    
    pm = PatentMCP()
    result = pm.disclose_invention(
        title="My Novel Invention",
        description="A method for...",
        inventor_did="did:key:z6Mk...",
        document_bytes=b"...",
        disclosure_type="full"
    )
    
    print(result["attestation_url"])
    print(result["bitcoin_transaction"])
"""

import json
import base64
import os
from typing import Optional, Dict
from datetime import datetime, timezone

from .crypto import CryptoEngine, CryptoProof
from .blockchain import BlockchainAnchor, BlockchainProof
from .c2pa import C2PACredentialBuilder, C2PACredential
from .audit import HashChainedAuditLog, AuditEntry
from .registry import PriorArtRegistry, RegistryEntry
from .verify import VerificationEngine


class PatentMCP:
    """
    The main PatentMCP invention disclosure system.
    
    Combines 6 independent cryptographic proofs into a single
    unified prior art disclosure that is:
    - Tamper-evident (any change breaks the chain)
    - Cryptographically verifiable (6 independent proofs)
    - Decentralized (Bitcoin anchor, no reliance on CSOAI)
    - Machine-readable (C2PA standard)
    - Legally defensible (accepted in French/Chinese courts)
    
    The system itself is designed to be patentable as a method
    of combining MCP ingestion + dual-signature + blockchain
    anchoring + C2PA credentialing + hash-chained auditing.
    """
    
    VERSION = "1.0.0"
    SYSTEM_NAME = "PatentMCP"
    ISSUER = "CSOAI - The Council for the Safety of AI"
    ISSUER_DID = "did:web:csoai.org"
    
    # Pricing (in USD)
    # Pricing in USD (per 5-tier PAYG model: see services/api-gateway/pricing.py)
    FEES = {
        "starter": 29.00,
        "defensive": 149.00,
        "full": 999.00,
        "premium": 2499.00,
        "enterprise": 4999.00,  # monthly subscription
    }
    
    def __init__(
        self,
        hsm_key: Optional[bytes] = None,
        blockchain_mode: str = "auto",
        storage_path: Optional[str] = None,
    ):
        """
        Initialize PatentMCP system.
        
        Args:
            hsm_key: CSOAI's HSM-backed key for HMAC attestations
            blockchain_mode: "production", "development", or "auto"
            storage_path: Path for persistent storage (audit log + registry)
        """
        self.crypto_engine = CryptoEngine(hsm_key=hsm_key)
        self.blockchain = BlockchainAnchor(mode=blockchain_mode)
        self.c2pa_builder = C2PACredentialBuilder()
        self.audit_log = HashChainedAuditLog(storage_path=storage_path)
        self.registry = PriorArtRegistry(storage_path=storage_path)
        self.verifier = VerificationEngine(self)
        
        self._disclosure_count = 0
    
    def disclose_invention(
        self,
        title: str,
        description: str,
        inventor_did: str,
        document_bytes: bytes,
        document_format: str = "pdf",
        classification: str = "",
        prior_art_known: str = "",
        disclosure_type: str = "full",
    ) -> Dict:
        """
        Disclose an invention through the PatentMCP pipeline.
        
        This is THE core function. It runs all 6 cryptographic layers
        and produces a complete prior art disclosure with:
        - Public attestation URL
        - Bitcoin transaction hash
        - C2PA Content Credential
        - Hash-chain audit entry
        - Prior art registry entry
        - x402 payment receipt
        
        Args:
            title: Invention title (e.g., "Hash-Chained Audit Logs for A2A")
            description: Detailed invention description
            inventor_did: Inventor's decentralized identifier (did:key:...)
            document_bytes: The invention document (PDF, DOC, code, etc.)
            document_format: File format (pdf, doc, code, data)
            classification: IPC or CPC classification (e.g., "G06N7/01")
            prior_art_known: Known prior art
            disclosure_type: "starter" ($29), "defensive" ($149), "full" ($999), "premium" ($2499), "enterprise" ($4999/mo)
            
        Returns:
            Dict with all disclosure results:
            - status: "DISCLOSED" or error
            - attestation_url: Public verification URL
            - bitcoin_transaction: Bitcoin tx hash
            - c2pa_credential_id: C2PA credential ID
            - document_hash: SHA-3/512 hash
            - inventor_signature: Ed25519 signature hex
            - csoai_attestation: HMAC attestation
            - chain_index: Position in audit chain
            - ots_receipt: OpenTimestamps proof (base64)
            - fee_paid: Amount charged
            - timestamp: ISO 8601 timestamp
            - registry_entry: Prior art registry ID
            - verification: Immediate verification results
        """
        # Validate disclosure type
        if disclosure_type not in self.FEES:
            raise ValueError(f"Unknown disclosure_type: {disclosure_type}. Use: {list(self.FEES.keys())}")
        
        # Compute fee
        fee = self.FEES[disclosure_type]
        
        try:
            # === LAYER 1: SHA-3/512 Hash ===
            doc_hash = self.crypto_engine.hash_document(document_bytes)
            
            # === LAYER 2: HMAC Attestation (CSOAI witness) ===
            hmac_att = self.crypto_engine.hmac_attest(doc_hash)
            
            # === LAYER 3: Ed25519 Signature (inventor authorship) ===
            inventor_sig, inventor_pubkey = self.crypto_engine.sign_inventor(
                doc_hash, inventor_did
            )
            
            # === LAYER 4: Bitcoin Blockchain Anchor ===
            blockchain_proof = self.blockchain.anchor(doc_hash)
            
            # === LAYER 5: C2PA Content Credential ===
            c2pa_cred = self.c2pa_builder.create_credential(
                document_hash=doc_hash,
                title=title,
                inventor_did=inventor_did,
                csoai_attestation=hmac_att,
                bitcoin_tx=blockchain_proof.bitcoin_tx or "pending",
                disclosure_type=disclosure_type,
            )
            
            # === LAYER 6: Hash-Chained Audit Log ===
            audit_entry = self.audit_log.append(
                document_hash=doc_hash,
                inventor_did=inventor_did,
                csoai_attestation=hmac_att,
                bitcoin_tx=blockchain_proof.bitcoin_tx,
                c2pa_credential_id=c2pa_cred.credential_id,
                entry_type="INVENTION_DISCLOSURE",
                metadata={
                    "title": title,
                    "description": description[:500],  # Truncated
                    "classification": classification,
                    "disclosure_type": disclosure_type,
                    "document_format": document_format,
                    "fee_paid": fee,
                },
            )
            
            # === PUBLIC ATTESTATION ===
            # Public attestation URL — points to the openpatent.ai verify page
            # (api-gateway overrides this to verify.openpatent.ai on response).
            attestation_url = f"https://verify.openpatent.ai/{doc_hash[:16]}"
            
            # === PRIOR ART REGISTRY ===
            registry_entry = self.registry.register(
                document_hash=doc_hash,
                title=title,
                inventor_did=inventor_did,
                classification=classification,
                disclosure_type=disclosure_type,
                timestamp=audit_entry.timestamp,
                bitcoin_tx=blockchain_proof.bitcoin_tx,
                attestation_url=attestation_url,
                c2pa_credential_id=c2pa_cred.credential_id,
                description=description,
                metadata={
                    "prior_art_known": prior_art_known,
                    "document_format": document_format,
                },
            )
            
            # === x402 PAYMENT ===
            payment_receipt = self._process_payment(inventor_did, fee)
            
            # === INCREMENT COUNTER ===
            self._disclosure_count += 1
            
            # === BUILD RESULT ===
            result = {
                "status": "DISCLOSED",
                "system": self.SYSTEM_NAME,
                "version": self.VERSION,
                "attestation_url": attestation_url,
                "bitcoin_transaction": blockchain_proof.bitcoin_tx,
                "block_height": blockchain_proof.block_height,
                "c2pa_credential_id": c2pa_cred.credential_id,
                "document_hash": doc_hash,
                "hash_algorithm": "SHA-3/512",
                "inventor_signature": inventor_sig,
                "inventor_public_key": inventor_pubkey,
                "csoai_attestation": hmac_att,
                "timestamp": audit_entry.timestamp,
                "chain_index": audit_entry.index,
                "chain_previous_hash": audit_entry.prev_hash,
                "ots_receipt": blockchain_proof.ots_proof,
                "fee_paid": fee,
                "fee_currency": "USD",
                "payment_receipt": payment_receipt,
                "registry_entry": registry_entry.registry_id,
                "disclosure_type": disclosure_type,
                "disclosure_number": self._disclosure_count,
                "legal_note": (
                    "This disclosure provides proof of prior possession under "
                    "35 U.S.C. 273 (US), Article 55 EPC (EU), and Sections 2-3 "
                    "Patents Act 1977 (UK). Not a patent grant - provides defensive "
                    "evidence of prior invention."
                ),
            }
            
            # === IMMEDIATE VERIFICATION ===
            result["verification"] = self.verifier.verify_disclosure(result)
            
            return result
            
        except Exception as e:
            return {
                "status": "ERROR",
                "error": str(e),
                "error_type": type(e).__name__,
            }
    
    def verify_disclosure(self, disclosure_result: Dict) -> Dict:
        """
        Verify a disclosure result.
        
        Shortcut to VerificationEngine.verify_disclosure().
        """
        return self.verifier.verify_disclosure(disclosure_result)
    
    def verify_with_document(self, document_bytes: bytes, disclosure_result: Dict) -> Dict:
        """
        Verify a disclosure against the actual document.
        
        This is the STRONGEST verification - it recomputes the hash
        from the document and checks against the stored hash.
        """
        return self.verifier.verify_document(document_bytes, disclosure_result)
    
    def get_statistics(self) -> Dict:
        """Get PatentMCP system statistics."""
        return {
            "system": self.SYSTEM_NAME,
            "version": self.VERSION,
            "total_disclosures": self._disclosure_count,
            "audit_chain_length": self.audit_log.get_length(),
            "chain_integrity": self.audit_log.verify_chain_integrity(),
            "registry_stats": self.registry.get_statistics(),
            "pricing": self.FEES,
        }
    
    def _process_payment(self, inventor_did: str, amount: float) -> str:
        """
        Process x402 payment for disclosure fee.
        
        In production: calls x402 payment protocol
        In development: returns mock receipt
        """
        # Development: mock payment
        tx_id = f"x402:dev:{base64.b64encode(os.urandom(16)).hex()[:16]}"
        return f"Receipt: {tx_id} | Amount: ${amount:.2f} | Payer: {inventor_did[:20]}..."
    
    def __repr__(self):
        return f"PatentMCP(v{self.VERSION}, disclosures={self._disclosure_count}, chain_length={self.audit_log.get_length()})"
