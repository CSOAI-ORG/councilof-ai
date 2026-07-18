"""Tests for meek-defoneos-smithery-mcp."""
import os, sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from meek_defoneos_smithery_mcp.server import smithery_publish_listing, smithery_publish_execute, smithery_status, smithery_overview

def test_smithery_publish_listing():
    r = smithery_publish_listing()
    assert r["package_count"] == 70
    print(f"✅ test_listing: {r['package_count']} packages, status={r['listing_status']}")

def test_smithery_publish_execute():
    r = smithery_publish_execute()
    assert r["approval_required"] is True
    print(f"✅ test_execute: approval_required={r['approval_required']}")

def test_smithery_status():
    r = smithery_status()
    assert r["published"] is False
    print(f"✅ test_status: published={r['published']}")

def test_smithery_overview():
    r = smithery_overview()
    assert r["packages_to_publish"] == 70
    print(f"✅ test_overview: {r['packages_to_publish']} packages")

if __name__ == "__main__":
    test_smithery_publish_listing()
    test_smithery_publish_execute()
    test_smithery_status()
    test_smithery_overview()
    print("\n🎉 ALL 4 TESTS PASSED — meek-defoneos-smithery-mcp v1.0.0 is sovereign. Smithery listing ready.")