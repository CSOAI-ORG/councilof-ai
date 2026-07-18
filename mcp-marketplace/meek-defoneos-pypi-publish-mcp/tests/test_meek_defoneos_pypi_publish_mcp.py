"""Tests for meek-defoneos-pypi-publish-mcp."""
import os, sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from meek_defoneos_pypi_publish_mcp.server import pypi_packages_ready, pypi_publish_execute, pypi_status, pypi_overview

def test_pypi_packages_ready():
    r = pypi_packages_ready()
    assert r["ready_count"] == 70
    assert r["all_license"] == "MIT"
    print(f"✅ test_packages: {r['ready_count']} packages ready")

def test_pypi_publish_execute():
    r = pypi_publish_execute()
    assert r["approval_required"] is True
    print(f"✅ test_execute: {r['package_name']} (approval_required={r['approval_required']})")

def test_pypi_status():
    r = pypi_status()
    assert r["published"] is False
    print(f"✅ test_status: {r['package_name']} published={r['published']}")

def test_pypi_overview():
    r = pypi_overview()
    assert r["packages_to_publish"] == 70
    print(f"✅ test_overview: {r['packages_to_publish']} packages, all MIT")

if __name__ == "__main__":
    test_pypi_packages_ready()
    test_pypi_publish_execute()
    test_pypi_status()
    test_pypi_overview()
    print("\n🎉 ALL 4 TESTS PASSED — meek-defoneos-pypi-publish-mcp v1.0.0 is sovereign. 70 packages ready.")