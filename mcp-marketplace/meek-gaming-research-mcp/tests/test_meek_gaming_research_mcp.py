#!/usr/bin/env python3
"""Tests for meek-gaming-research-mcp."""
import os, sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from meek_gaming_research_mcp.server import (
    wow_bot_ecosystem,
    wow_bot_categories,
    blizzard_detection_methods,
    anti_detection_techniques,
    wow_bot_legal_status,
    wow_bot_risk_assessment,
    wow_bot_best_practices,
)


def test_wow_bot_ecosystem():
    r = wow_bot_ecosystem()
    assert r["total_projects"] == 10
    assert r["total_cost_gbp"] == 0
    print(f"✅ test_ecosystem: {r['total_projects']} open-source projects, £0")


def test_wow_bot_categories():
    r = wow_bot_categories()
    assert len(r["categories"]) == 5
    print(f"✅ test_categories: {len(r['categories'])} categories")


def test_blizzard_detection_methods():
    r = blizzard_detection_methods()
    assert r["total_methods"] == 4
    print(f"✅ test_detection: {r['total_methods']} detection methods")


def test_anti_detection_techniques():
    r = anti_detection_techniques()
    assert r["total_techniques"] == 7
    print(f"✅ test_anti_detection: {r['total_techniques']} anti-detection techniques")


def test_wow_bot_legal_status():
    r = wow_bot_legal_status()
    assert r["blizzard_tos_violation"] is True
    assert r["verdict"] == "CIVIL_REMEDY_NOT_CRIMINAL"
    print(f"✅ test_legal: {r['verdict']}")


def test_wow_bot_risk_assessment():
    r = wow_bot_risk_assessment()
    assert "healer_bot" in r["risk_assessment"]
    print(f"✅ test_risk: {len(r['risk_assessment'])} bot types assessed")


def test_wow_bot_best_practices():
    r = wow_bot_best_practices()
    assert len(r["best_practices"]) >= 10
    print(f"✅ test_best_practices: {len(r['best_practices'])} best practices")


if __name__ == "__main__":
    test_wow_bot_ecosystem()
    test_wow_bot_categories()
    test_blizzard_detection_methods()
    test_anti_detection_techniques()
    test_wow_bot_legal_status()
    test_wow_bot_risk_assessment()
    test_wow_bot_best_practices()
    print("\n🎉 ALL 7 TESTS PASSED — meek-gaming-research-mcp v1.0.0 is sovereign. The WoW bot ecosystem is mapped.")