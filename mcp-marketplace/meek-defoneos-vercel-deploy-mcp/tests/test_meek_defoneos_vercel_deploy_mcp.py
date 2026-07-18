"""Tests for meek-defoneos-vercel-deploy-mcp."""
import os, sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from meek_defoneos_vercel_deploy_mcp.server import vercel_deploy_pages, vercel_deploy_execute, vercel_status, vercel_rollback, vercel_overview

def test_vercel_deploy_pages():
    r = vercel_deploy_pages()
    assert r["count"] == 5
    print(f"✅ test_pages: {r['count']} pages ready")

def test_vercel_deploy_execute():
    r = vercel_deploy_execute()
    assert r["approval_required"] is True
    print(f"✅ test_execute: {r['deploy_id'][:20]}... (approval_required={r['approval_required']})")

def test_vercel_status():
    r = vercel_status()
    assert r["live"] is False
    print(f"✅ test_status: {r['domain']} live={r['live']}")

def test_vercel_rollback():
    r = vercel_rollback()
    assert r["status"] == "ROLLBACK_READY"
    print(f"✅ test_rollback: {r['deploy_id']} ready")

def test_vercel_overview():
    r = vercel_overview()
    assert r["pages_to_deploy"] == 5
    print(f"✅ test_overview: {r['pages_to_deploy']} pages, {r['total_size_mb']} MB")

if __name__ == "__main__":
    test_vercel_deploy_pages()
    test_vercel_deploy_execute()
    test_vercel_status()
    test_vercel_rollback()
    test_vercel_overview()
    print("\n🎉 ALL 5 TESTS PASSED — meek-defoneos-vercel-deploy-mcp v1.0.0 is sovereign. 5 pages ready to deploy.")