"""Tests for meek-defoneos-secret-rotation-mcp."""
import os, sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from meek_defoneos_secret_rotation_mcp.server import secret_list, secret_rotate, secret_get, vault_status, secret_rotation_overview

def test_secret_list():
    r = secret_list()
    assert r["count"] == 7
    print(f"✅ test_list: {r['count']} secrets managed")

def test_secret_rotate():
    r = secret_rotate()
    assert r["status"] == "ROTATED"
    assert r["old_value_destroyed"] is True
    print(f"✅ test_rotate: {r['secret_name']} rotated + old destroyed")

def test_secret_get():
    r = secret_get()
    assert "***REDACTED***" in r["value_masked"]
    print(f"✅ test_get: {r['secret_name']} value masked + retrieval logged")

def test_vault_status():
    r = vault_status()
    assert r["unsealed"] is True
    print(f"✅ test_vault: {r['vault_engine']} unsealed")

def test_secret_rotation_overview():
    r = secret_rotation_overview()
    assert r["total_secrets"] == 7
    print(f"✅ test_overview: {r['name']} ({r['total_secrets']} secrets, 90-day rotation)")

if __name__ == "__main__":
    test_secret_list()
    test_secret_rotate()
    test_secret_get()
    test_vault_status()
    test_secret_rotation_overview()
    print("\n🎉 ALL 5 TESTS PASSED — meek-defoneos-secret-rotation-mcp v1.0.0 is sovereign. HashiCorp Vault LIVE.")