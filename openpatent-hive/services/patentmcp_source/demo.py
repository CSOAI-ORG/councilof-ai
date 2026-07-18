#!/usr/bin/env python3
"""
PatentMCP Demo Script
Demonstrates the complete invention disclosure pipeline.

Run: python demo.py
"""

import sys
import os

# Add src to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))

from patentmcp import PatentMCP


def print_banner():
    print("=" * 70)
    print("  PATENTMCP - Decentralized Invention Disclosure System")
    print("  MCP-Mediated, Blockchain-Anchored, HMAC-Signed Prior Art Engine")
    print("  v1.0.0 | CSOAI - The Council for the Safety of AI")
    print("=" * 70)
    print()


def demo_disclosure():
    """Demo: Disclose an invention through PatentMCP."""
    print("[DEMO 1] Invention Disclosure")
    print("-" * 50)
    
    # Initialize PatentMCP
    pm = PatentMCP(blockchain_mode="development")
    
    # The invention document (in production, this would be a real PDF)
    invention_doc = (
        b"TITLE: Hash-Chained HMAC-Signed Audit Logs for "
        b"Agent-to-Agent Communication in Multi-Agent AI Governance Systems\n\n"
        b"ABSTRACT:\n"
        b"A method for creating tamper-evident audit trails of "
        b"agent-to-agent communications using hash-chained log entries "
        b"with HMAC-SHA256 attestation, comprising:\n"
        b"1. Receiving an A2A communication event;\n"
        b"2. Computing a SHA-3/512 hash of the event data;\n"
        b"3. Generating an HMAC-SHA256 attestation with a witness key;\n"
        b"4. Writing to a hash-chained audit log where each entry "
        b"references the previous entry's hash;\n"
        b"5. Issuing a publicly-verifiable attestation.\n\n"
        b"CLAIMS:\n"
        b"1. A method for audit logging comprising...\n"
        b"2. The method of claim 1, wherein the hash chain uses SHA-3/512...\n"
        b"3. The method of claim 1, wherein the HMAC uses a hardware-backed key..."
    )
    
    # Disclose the invention
    print("Submitting invention disclosure...")
    result = pm.disclose_invention(
        title="Hash-Chained HMAC Audit Logs for A2A Communication",
        description="Tamper-evident audit trails for multi-agent A2A calls",
        inventor_did="did:key:z6MkhaXg4kHbTKy8JrYBMPG3j7j3X7J9pK2v9X8j3j3j3j3",
        document_bytes=invention_doc,
        document_format="pdf",
        classification="H04L9/32,G06F21/64",
        disclosure_type="full",
    )
    
    # Display results
    print(f"\n  Status: {result['status']}")
    print(f"  Disclosure #     {result['disclosure_number']}")
    print(f"  Fee Paid: ${result['fee_paid']:.2f}")
    print(f"\n  --- Cryptographic Proofs ---")
    print(f"  SHA-3/512 Hash:     {result['document_hash'][:32]}...")
    print(f"  HMAC Attestation:   {result['csoai_attestation'][:32]}...")
    print(f"  Ed25519 Signature:  {result['inventor_signature'][:32]}...")
    print(f"  Bitcoin Tx:         {result['bitcoin_transaction'][:32]}...")
    print(f"  C2PA Credential:    {result['c2pa_credential_id'][:40]}...")
    print(f"  Chain Index:        #{result['chain_index']}")
    print(f"\n  --- Public Verification ---")
    print(f"  Attestation URL:    {result['attestation_url']}")
    print(f"  Registry Entry:     {result['registry_entry']}")
    print(f"  Timestamp:          {result['timestamp']}")
    
    # Verification
    print(f"\n  --- Verification ---")
    v = result['verification']
    print(f"  All Checks Pass:    {v['all_checks_pass']}")
    print(f"  Verified:           {v['verified_count']}/6")
    print(f"  Confidence:         {v['confidence_level']}")
    print(f"  Legal Status:       {v['legal_status'][:60]}...")
    
    return result, pm


def demo_verification(result, pm):
    """Demo: Verify the disclosure."""
    print("\n[DEMO 2] Disclosure Verification")
    print("-" * 50)
    
    v = pm.verify_disclosure(result)
    print(f"Overall: {'PASS' if v['all_checks_pass'] else 'FAIL'}")
    print(f"\nIndividual checks:")
    for check, status in v['checks'].items():
        icon = "PASS" if status is True else ("PEND" if isinstance(status, str) else "FAIL")
        print(f"  [{icon}] {check}: {status}")


def demo_registry_search(pm):
    """Demo: Search prior art registry."""
    print("\n[DEMO 3] Prior Art Registry Search")
    print("-" * 50)
    
    # Search for our disclosure
    results = pm.registry.search(query="audit", limit=5)
    print(f"Search 'audit': {results['total']} result(s)")
    for entry in results['entries']:
        print(f"  - {entry['title'][:50]}...")
        print(f"    {entry['attestation_url']}")


def demo_statistics(pm):
    """Demo: System statistics."""
    print("\n[DEMO 4] System Statistics")
    print("-" * 50)
    
    stats = pm.get_statistics()
    print(f"System:       {stats['system']} v{stats['version']}")
    print(f"Disclosures:  {stats['total_disclosures']}")
    print(f"Chain Length: {stats['audit_chain_length']}")
    print(f"Chain Valid:  {stats['chain_integrity']['valid']}")
    print(f"Registry:     {stats['registry_stats']['total_entries']} entries")
    print(f"\nPricing:")
    for dtype, price in stats['pricing'].items():
        print(f"  {dtype:12s} ${price:.2f}")


def main():
    print_banner()
    
    # Run demos
    result, pm = demo_disclosure()
    demo_verification(result, pm)
    demo_registry_search(pm)
    demo_statistics(pm)
    
    print("\n" + "=" * 70)
    print("  PatentMCP Demo Complete!")
    print("  This disclosure is now cryptographically protected.")
    print("  Visit the attestation URL to verify anytime.")
    print("=" * 70)


if __name__ == "__main__":
    main()
