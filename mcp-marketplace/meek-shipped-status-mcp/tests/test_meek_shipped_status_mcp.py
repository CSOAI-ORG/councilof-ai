#!/usr/bin/env python3
"""Tests for meek-shipped-status-mcp."""
import os, sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from meek_shipped_status_mcp.server import (
    shipped_sovereign_mcps,
    shipped_docs,
    shipped_seals,
    shipped_git_commits,
    shipped_tests_verified,
)


def test_shipped_sovereign_mcps():
    r = shipped_sovereign_mcps()
    assert r["status"] == "VERIFIED"
    assert r["count"] == 46
    print(f"✅ test_mcps: {r['count']} MCPs verified")


def test_shipped_docs():
    r = shipped_docs()
    assert r["status"] == "VERIFIED"
    assert r["count"] > 0
    print(f"✅ test_docs: {r['count']} docs found")


def test_shipped_seals():
    r = shipped_seals()
    assert r["status"] == "VERIFIED"
    assert r["count"] > 0
    print(f"✅ test_seals: {r['count']} seals found")


def test_shipped_git_commits():
    r = shipped_git_commits()
    assert r["status"] == "VERIFIED"
    assert r["total_commits"] > 0
    print(f"✅ test_commits: {r['total_commits']} commits verified")


def test_shipped_tests_verified():
    r = shipped_tests_verified()
    assert r["status"] == "VERIFIED"
    assert r["total_test_cases"] == 373
    assert r["all_passing"] is True
    print(f"✅ test_tests: {r['total_test_cases']} tests verified ALL PASS")


if __name__ == "__main__":
    test_shipped_sovereign_mcps()
    test_shipped_docs()
    test_shipped_seals()
    test_shipped_git_commits()
    test_shipped_tests_verified()
    print("\n🎉 ALL 5 TESTS PASSED — meek-shipped-status-mcp v1.0.0 is honest. The truth is real.")