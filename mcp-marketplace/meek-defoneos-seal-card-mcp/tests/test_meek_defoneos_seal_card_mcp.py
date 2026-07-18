"""Tests for meek-defoneos-seal-card-mcp."""
import os, sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from meek_defoneos_seal_card_mcp.server import seal_card_create, seal_card_verify, seal_card_revoke, seal_card_list, seal_card_overview

def test_seal_card_create():
    r = seal_card_create()
    assert r["sovereign"] is True
    assert r["uk_soil"] is True
    assert r["33_hive_bft_signers"] == 23
    print(f"✅ test_create: {r['seal_id']} for {r['holder_name']}")

def test_seal_card_verify():
    r = seal_card_verify()
    assert r["valid"] is True
    assert r["ed25519_signature_valid"] is True
    print(f"✅ test_verify: {r['seal_id']} valid")

def test_seal_card_revoke():
    r = seal_card_revoke()
    assert r["status"] == "REVOKED"
    print(f"✅ test_revoke: {r['seal_id']} {r['status']}")

def test_seal_card_list():
    r = seal_card_list()
    assert r["count"] == 3
    print(f"✅ test_list: {r['count']} SEALs active")

def test_seal_card_overview():
    r = seal_card_overview()
    assert r["algorithm"] == "Ed25519 SIGIL-signed + 33-hive BFT-signed"
    print(f"✅ test_overview: {r['name']} ({r['algorithm']})")

if __name__ == "__main__":
    test_seal_card_create()
    test_seal_card_verify()
    test_seal_card_revoke()
    test_seal_card_list()
    test_seal_card_overview()
    print("\n🎉 ALL 5 TESTS PASSED — meek-defoneos-seal-card-mcp v1.0.0 is sovereign. DEFONEOS-SEAL is live.")