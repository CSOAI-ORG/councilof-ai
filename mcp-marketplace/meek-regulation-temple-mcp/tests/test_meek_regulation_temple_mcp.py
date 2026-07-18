#!/usr/bin/env python3
"""Tests for meek-regulation-temple-mcp."""
import os, sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from meek_regulation_temple_mcp.server import regulations_as_temples, regulation_by_country, regulation_temple_details, regulations_zoom_to_user, regulations_count

def test_regulations_as_temples():
    r = regulations_as_temples()
    assert r["count"] == 10
    assert all("lat" in t and "lng" in t and "country" in t for t in r["temples"])
    print(f"✅ test_temples: {r['count']} regulations as temples on globe")

def test_regulation_by_country():
    r = regulation_by_country(country="UK")
    assert r["country"] == "UK"
    assert r["count"] >= 1
    print(f"✅ test_country: UK has {r['count']} temples")

def test_regulation_temple_details():
    r = regulation_temple_details(temple_id="EU-AI-ACT-001")
    assert r["temple_id"] == "EU-AI-ACT-001"
    assert len(r["inner_workflows"]) == 5
    print(f"✅ test_details: {r['temple_id']} with {len(r['inner_workflows'])} inner workflows")

def test_regulations_zoom_to_user():
    r = regulations_zoom_to_user(ip_country="UK")
    assert r["ip_country"] == "UK"
    assert r["zoom_to"] == "London, UK"
    assert "permission_asked" in r
    print(f"✅ test_zoom: zoom to {r['zoom_to']}, {r['temples_visible']} temples visible")

def test_regulations_count():
    r = regulations_count()
    assert r["total_regulations"] == 10
    assert r["total_countries"] == 5
    print(f"✅ test_count: {r['total_regulations']} regulations across {r['total_countries']} countries")

if __name__ == "__main__":
    test_regulations_as_temples()
    test_regulation_by_country()
    test_regulation_temple_details()
    test_regulations_zoom_to_user()
    test_regulations_count()
    print("\n🎉 ALL 5 TESTS PASSED — meek-regulation-temple-mcp v1.0.0 is sovereign. Every regulation is a temple.")