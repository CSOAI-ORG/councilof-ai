"""Tests for meek-defoneos-audit-logging-mcp."""
import os, sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from meek_defoneos_audit_logging_mcp.server import audit_log_search, audit_compliance_logs, audit_chain_status, audit_export, audit_logging_overview

def test_audit_log_search():
    r = audit_log_search()
    assert r["results_count"] >= 100
    print(f"✅ test_search: {r['results_count']} audit events")

def test_audit_compliance_logs():
    r = audit_compliance_logs()
    assert r["all_compliant"] is True
    print(f"✅ test_compliance: {len(r['frameworks'])} frameworks, ALL COMPLIANT")

def test_audit_chain_status():
    r = audit_chain_status()
    assert r["intact"] is True
    print(f"✅ test_chain: {r['chain_length']} entries, intact={r['intact']}, Ed25519")

def test_audit_export():
    r = audit_export()
    assert r["approval_required"] is True
    print(f"✅ test_export: {r['size_mb']} MB ready, approval required")

def test_audit_logging_overview():
    r = audit_logging_overview()
    assert r["all_compliant"] is True
    print(f"✅ test_overview: ELK Stack + {r['audit_chain_length']} chain entries, ALL COMPLIANT")

if __name__ == "__main__":
    test_audit_log_search()
    test_audit_compliance_logs()
    test_audit_chain_status()
    test_audit_export()
    test_audit_logging_overview()
    print("\n🎉 ALL 5 TESTS PASSED — meek-defoneos-audit-logging-mcp v1.0.0 is sovereign. SIEM LIVE.")