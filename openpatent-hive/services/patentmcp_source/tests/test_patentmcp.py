"""
PatentMCP Test Suite
Tests all 6 cryptographic layers of the invention disclosure system.

Run: python -m pytest tests/test_patentmcp.py -v
"""

import pytest
import hashlib
import json
import base64
import os
import sys

# Add src to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src'))

from patentmcp import PatentMCP, CryptoEngine, VerificationEngine


class TestCryptoEngine:
    """Test Layer 1-3: Hash, HMAC, Ed25519"""
    
    def setup_method(self):
        self.crypto = CryptoEngine()
        self.test_doc = b"This is a test invention document for PatentMCP v1.0.0"
        self.test_did = "did:key:z6MkhaXg4kHbTKy8JrYBMPG3j7j3X7J9pK2v9X8j3j3j3j3"
    
    def test_sha3_512_hash(self):
        """Layer 1: SHA-3/512 produces correct 128-char hex hash"""
        h = self.crypto.hash_document(self.test_doc)
        assert len(h) == 128
        assert all(c in "0123456789abcdef" for c in h)
        # Deterministic
        h2 = self.crypto.hash_document(self.test_doc)
        assert h == h2
    
    def test_hmac_attestation(self):
        """Layer 2: HMAC-SHA256 produces 64-char hex attestation"""
        doc_hash = self.crypto.hash_document(self.test_doc)
        att = self.crypto.hmac_attest(doc_hash)
        assert len(att) == 64
        # Self-verification
        assert self.crypto.verify_hmac(doc_hash, att) is True
    
    def test_ed25519_signature(self):
        """Layer 3: Ed25519 signing and verification"""
        doc_hash = self.crypto.hash_document(self.test_doc)
        sig, pubkey = self.crypto.sign_inventor(doc_hash, self.test_did)
        assert len(sig) == 128  # 64 bytes hex
        assert len(pubkey) == 64  # 32 bytes hex
        # Verification
        assert self.crypto.verify_inventor_signature(doc_hash, sig, pubkey) is True
        # Wrong hash should fail
        assert self.crypto.verify_inventor_signature("wronghash" + "0"*118, sig, pubkey) is False
    
    def test_full_crypto_proof(self):
        """All 3 crypto layers together"""
        proof = self.crypto.create_full_proof(self.test_doc, self.test_did)
        assert proof.sha3_512_hash is not None
        assert proof.hmac_attestation is not None
        assert proof.ed25519_signature is not None
        assert proof.timestamp is not None
    
    def test_crypto_proof_verification(self):
        """Verify a crypto proof against original document"""
        proof = self.crypto.create_full_proof(self.test_doc, self.test_did)
        result = self.crypto.verify_proof(proof, self.test_doc)
        assert result["all_checks_pass"] is True
        assert result["hash_integrity"] is True
        assert result["hmac_attestation_valid"] is True
        assert result["ed25519_signature_valid"] is True


class TestBlockchainAnchor:
    """Test Layer 4: Bitcoin blockchain anchoring"""
    
    def setup_method(self):
        self.pm = PatentMCP(blockchain_mode="development")
        self.test_hash = "a" * 128
    
    def test_anchor_produces_proof(self):
        """Anchoring returns valid BlockchainProof"""
        proof = self.pm.blockchain.anchor(self.test_hash)
        assert proof.bitcoin_tx is not None
        assert proof.block_height > 0
        assert proof.ots_proof is not None
    
    def test_anchor_is_deterministic(self):
        """Same hash produces different proofs (different timestamps)"""
        proof1 = self.pm.blockchain.anchor(self.test_hash)
        proof2 = self.pm.blockchain.anchor(self.test_hash)
        # Different blocks (incrementing)
        assert proof2.block_height > proof1.block_height
    
    def test_verify_development_anchor(self):
        """Development anchor verification works"""
        proof = self.pm.blockchain.anchor(self.test_hash)
        result = self.pm.blockchain.verify(self.test_hash, proof)
        assert result["ots_structure_valid"] is True
        assert result["sufficient_confirmations"] is True


class TestC2PACredential:
    """Test Layer 5: C2PA Content Credential"""
    
    def setup_method(self):
        self.pm = PatentMCP()
    
    def test_credential_creation(self):
        """C2PA credential is created with all fields"""
        cred = self.pm.c2pa_builder.create_credential(
            document_hash="a" * 128,
            title="Test Invention",
            inventor_did="did:key:z6Mktest",
            csoai_attestation="b" * 64,
            bitcoin_tx="0x1234abcd",
            disclosure_type="full",
        )
        assert cred.credential_id.startswith("c2pa:patentmcp:")
        assert cred.title == "Test Invention"
        assert cred.document_hash == "a" * 128
        assert cred.signature is not None
    
    def test_credential_verification(self):
        """C2PA credential can be verified"""
        cred = self.pm.c2pa_builder.create_credential(
            document_hash="a" * 128,
            title="Test Invention",
            inventor_did="did:key:z6Mktest",
            csoai_attestation="b" * 64,
            bitcoin_tx="0x1234abcd",
            disclosure_type="full",
        )
        result = self.pm.c2pa_builder.verify_credential(cred)
        assert result["manifest_structure_valid"] is True
        assert result["signature_valid"] is True
        assert result["credential_id_valid"] is True


class TestAuditLog:
    """Test Layer 6: Hash-chained audit log"""
    
    def setup_method(self):
        self.pm = PatentMCP()
    
    def test_genesis_entry(self):
        """Chain starts with genesis entry"""
        entry = self.pm.audit_log.get_entry(0)
        assert entry is not None
        assert entry.entry_type == "GENESIS"
        assert entry.index == 0
    
    def test_append_creates_entry(self):
        """Appending creates linked entry"""
        entry = self.pm.audit_log.append(
            document_hash="a" * 128,
            inventor_did="did:key:test",
            csoai_attestation="b" * 64,
        )
        assert entry.index == 1  # After genesis
        assert entry.prev_hash == self.pm.audit_log.get_entry(0).this_hash
    
    def test_chain_integrity(self):
        """Chain integrity verification passes"""
        # Add a few entries
        for i in range(3):
            self.pm.audit_log.append(
                document_hash=f"{i}" * 128,
                inventor_did=f"did:key:test{i}",
                csoai_attestation="c" * 64,
            )
        
        result = self.pm.audit_log.verify_chain_integrity()
        assert result["valid"] is True
        assert result["genesis_valid"] is True
    
    def test_chain_length(self):
        """Chain length tracks correctly"""
        initial = self.pm.audit_log.get_length()
        self.pm.audit_log.append(
            document_hash="test" * 32,
            inventor_did="did:key:test",
            csoai_attestation="d" * 64,
        )
        assert self.pm.audit_log.get_length() == initial + 1


class TestFullDisclosure:
    """Test complete disclosure pipeline"""
    
    def setup_method(self):
        self.pm = PatentMCP(blockchain_mode="development")
        self.test_doc = (
            b"Novel Method for Byzantine Fault Tolerant Multi-Agent "
            b"Consensus in AI Governance Systems\n\n"
            b"Abstract: A system comprising 33 agents with Practical "
            b"Byzantine Fault Tolerance consensus for AI governance...\n\n"
            b"Claims: 1. A method comprising... 2. The method of claim 1..."
        )
    
    def test_full_disclosure(self):
        """Complete disclosure returns all expected fields"""
        result = self.pm.disclose_invention(
            title="BFT Multi-Agent Consensus for AI Governance",
            description="A 33-agent BFT council for AI governance decisions",
            inventor_did="did:key:z6MkfOZ9jS8kR8rK7hH4g9j2kPpQsT5uVwXyZ1234567890",
            document_bytes=self.test_doc,
            document_format="pdf",
            classification="G06N7/01,G06F21/60",
            disclosure_type="full",
        )
        
        assert result["status"] == "DISCLOSED"
        assert result["attestation_url"].startswith("https://verify.meok.ai/")
        assert len(result["document_hash"]) == 128
        assert len(result["inventor_signature"]) == 128
        assert len(result["csoai_attestation"]) == 64
        assert result["chain_index"] > 0
        assert result["fee_paid"] == 50.00
        assert result["disclosure_type"] == "full"
        assert "verification" in result
    
    def test_disclosure_verification(self):
        """Disclosed invention can be verified"""
        result = self.pm.disclose_invention(
            title="Hash-Chained Audit Log for A2A Communication",
            description="HMAC-signed audit trails for agent-to-agent calls",
            inventor_did="did:key:z6MkhaXg4kHbTKy8JrYBMPG3j7j3X7J9pK2v9X8j3j3j3j3",
            document_bytes=self.test_doc,
            disclosure_type="full",
        )
        
        verification = self.pm.verify_disclosure(result)
        assert verification["all_checks_pass"] is True
        assert verification["verified_count"] >= 3  # Core 3 always pass
        assert "legal_status" in verification
    
    def test_disclosure_with_document_verification(self):
        """Strongest verification: against actual document"""
        result = self.pm.disclose_invention(
            title="C2PA Watermarking for AI-Generated Content",
            description="C2PA content credentials for EU AI Act compliance",
            inventor_did="did:key:z6Mktest123",
            document_bytes=self.test_doc,
            disclosure_type="full",
        )
        
        v = self.pm.verify_with_document(self.test_doc, result)
        assert v["document_hash_match"] is True
        assert v["all_checks_pass"] is True
    
    def test_defensive_disclosure(self):
        """Defensive disclosure ($10) works"""
        result = self.pm.disclose_invention(
            title="Defensive Publication Test",
            description="Keep this invention open source",
            inventor_did="did:key:z6Mkdefensive",
            document_bytes=b"Open source prior art",
            disclosure_type="defensive",
        )
        
        assert result["status"] == "DISCLOSED"
        assert result["fee_paid"] == 10.00
    
    def test_disclosure_adds_to_registry(self):
        """Disclosure is added to prior art registry"""
        initial_total = self.pm.registry.get_statistics()["total_entries"]
        
        self.pm.disclose_invention(
            title="Registry Test Invention",
            description="Testing prior art registration",
            inventor_did="did:key:z6Mkregistry",
            document_bytes=b"Test document for registry",
            disclosure_type="full",
        )
        
        stats = self.pm.registry.get_statistics()
        assert stats["total_entries"] == initial_total + 1
    
    def test_statistics(self):
        """System statistics are accurate"""
        stats = self.pm.get_statistics()
        assert stats["system"] == "PatentMCP"
        assert stats["version"] == "1.0.0"
        assert stats["audit_chain_length"] > 0
        assert "pricing" in stats


class TestRegistry:
    """Test prior art registry"""
    
    def setup_method(self):
        self.pm = PatentMCP()
    
    def test_search_empty(self):
        """Search on empty registry returns empty"""
        result = self.pm.registry.search(query="nonexistent")
        assert result["total"] == 0
    
    def test_statistics_empty(self):
        """Empty registry has zero entries"""
        stats = self.pm.registry.get_statistics()
        assert stats["total_entries"] == 0


class TestErrorHandling:
    """Test error cases"""
    
    def setup_method(self):
        self.pm = PatentMCP()
    
    def test_invalid_disclosure_type(self):
        """Invalid disclosure type raises error"""
        with pytest.raises(ValueError):
            self.pm.disclose_invention(
                title="Test",
                description="Test",
                inventor_did="did:key:test",
                document_bytes=b"test",
                disclosure_type="invalid_type",
            )
    
    def test_empty_document(self):
        """Empty document still works"""
        result = self.pm.disclose_invention(
            title="Empty Doc Test",
            description="Testing with empty document",
            inventor_did="did:key:test",
            document_bytes=b"",
            disclosure_type="defensive",
        )
        assert result["status"] == "DISCLOSED"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
