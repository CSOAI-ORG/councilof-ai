"""Tests for meek-sov-os-permissions-mcp."""
import os, sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from meek_sov_os_permissions_mcp.server import permission_grant, permission_revoke, permission_list, permission_audit, permission_required_for, permission_revoke_all, permission_overview

def test_permission_grant():
    r = permission_grant(scope="company_data", duration_hours=24)
    assert r["status"] == "GRANTED"
    assert r["ed25519_signed"] is True
    print(f"✅ test_grant: {r['permission_id'][:20]}... scope={r['scope']}")

def test_permission_revoke():
    r = permission_revoke()
    assert r["status"] == "REVOKED"
    print(f"✅ test_revoke: {r['permission_id']}")

def test_permission_list():
    r = permission_list()
    assert r["count"] == 4
    print(f"✅ test_list: {r['count']} active permissions")

def test_permission_audit():
    r = permission_audit()
    assert r["total_actions"] == 5
    print(f"✅ test_audit: {r['total_actions']} actions logged")

def test_permission_required_for():
    r = permission_required_for(scope="company_data")
    assert r["requires_user_consent"] is True
    assert "May I learn" in r["consent_question"]
    print(f"✅ test_required: {r['scope']} requires consent")

def test_permission_revoke_all():
    r = permission_revoke_all()
    assert r["status"] == "ALL_REVOKED"
    print(f"✅ test_revoke_all: {r['status']}")

def test_permission_overview():
    r = permission_overview()
    assert "Ed25519" in r["system"]
    assert len(r["scopes"]) == 6
    print(f"✅ test_overview: {len(r['scopes'])} scopes available")

if __name__ == "__main__":
    test_permission_grant()
    test_permission_revoke()
    test_permission_list()
    test_permission_audit()
    test_permission_required_for()
    test_permission_revoke_all()
    test_permission_overview()
    print("\n🎉 ALL 7 TESTS PASSED — meek-sov-os-permissions-mcp v1.0.0 is sovereign. The permission system is live.")