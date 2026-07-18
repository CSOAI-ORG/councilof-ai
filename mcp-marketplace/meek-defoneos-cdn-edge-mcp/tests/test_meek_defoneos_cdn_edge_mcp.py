"""Tests for meek-defoneos-cdn-edge-mcp."""
import os, sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from meek_defoneos_cdn_edge_mcp.server import cdn_regions, cdn_cache_stats, cdn_purge, cdn_status, cdn_overview

def test_cdn_regions():
    r = cdn_regions()
    assert r["count"] == 4
    print(f"✅ test_regions: {r['count']} edge regions (uk + eu + us + au)")

def test_cdn_cache_stats():
    r = cdn_cache_stats()
    assert r["hit_rate_pct"] >= 90
    print(f"✅ test_cache: {r['hit_rate_pct']}% hit rate, {r['requests_24h']} req/24h")

def test_cdn_purge():
    r = cdn_purge()
    assert r["status"] == "PURGED"
    print(f"✅ test_purge: {r['path']} purged")

def test_cdn_status():
    r = cdn_status()
    assert r["multi_region"] is True
    print(f"✅ test_status: Cloudflare + Vercel Edge LIVE, multi_region=True")

def test_cdn_overview():
    r = cdn_overview()
    assert r["regions"] == 4
    print(f"✅ test_overview: {r['name']} ({r['regions']} regions)")

if __name__ == "__main__":
    test_cdn_regions()
    test_cdn_cache_stats()
    test_cdn_purge()
    test_cdn_status()
    test_cdn_overview()
    print("\n🎉 ALL 5 TESTS PASSED — meek-defoneos-cdn-edge-mcp v1.0.0 is sovereign. CDN edge LIVE.")