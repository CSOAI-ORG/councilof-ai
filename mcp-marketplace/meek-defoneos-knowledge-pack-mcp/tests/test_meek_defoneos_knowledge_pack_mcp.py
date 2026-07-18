"""Tests for meek-defoneos-knowledge-pack-mcp."""
import os, sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from meek_defoneos_knowledge_pack_mcp.server import whitepapers_list, datasheets_list, datasets_list, licensing_list, knowledge_pack_overview

def test_whitepapers_list():
    r = whitepapers_list()
    assert r["count"] == 3
    assert r["total_size_kb"] >= 22.5
    print(f"✅ test_whitepapers: {r['count']} whitepapers ({r['total_size_kb']} KB)")

def test_datasheets_list():
    r = datasheets_list()
    assert r["count"] == 18
    assert r["defoneos_count"] == 5
    assert r["legacy_bridge_count"] == 13
    print(f"✅ test_datasheets: {r['count']} datasheets ({r['defoneos_count']} DEFONEOS + {r['legacy_bridge_count']} Legacy Bridge)")

def test_datasets_list():
    r = datasets_list()
    assert r["total_size_gb"] >= 17.8
    print(f"✅ test_datasets: {r['total_size_gb']} GB ({r['license']})")

def test_licensing_list():
    r = licensing_list()
    assert r["count"] == 7
    print(f"✅ test_licensing: {r['count']} tiers")

def test_knowledge_pack_overview():
    r = knowledge_pack_overview()
    assert r["whitepapers"] == 3
    assert r["datasheets"] == 18
    assert r["datasets"] == 8
    assert r["licensing_tiers"] == 7
    print(f"✅ test_overview: {r['whitepapers']} WP + {r['datasheets']} DS + {r['datasets']} datasets + {r['licensing_tiers']} tiers")

if __name__ == "__main__":
    test_whitepapers_list()
    test_datasheets_list()
    test_datasets_list()
    test_licensing_list()
    test_knowledge_pack_overview()
    print("\n🎉 ALL 5 TESTS PASSED — meek-defoneos-knowledge-pack-mcp v1.0.0 is sovereign. Knowledge pack ready.")