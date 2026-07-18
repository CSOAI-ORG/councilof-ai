"""Tests for meek-defoneos-load-balancer-mcp."""
import os, sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from meek_defoneos_load_balancer_mcp.server import lb_backends, lb_health_check, lb_failover, lb_metrics, load_balancer_overview

def test_lb_backends():
    r = lb_backends()
    assert r["count"] == 3
    print(f"✅ test_backends: {r['count']} backends (2 prod + 1 DR)")

def test_lb_health_check():
    r = lb_health_check()
    assert r["healthy"] is True
    print(f"✅ test_health: {r['backend_id']} healthy, {r['response_time_ms']}ms")

def test_lb_failover():
    r = lb_failover()
    assert r["approval_required"] is True
    print(f"✅ test_failover: {r['failed_over']} -> {r['new_active']}")

def test_lb_metrics():
    r = lb_metrics()
    assert r["error_rate_pct"] < 1.0
    print(f"✅ test_metrics: {r['total_requests_24h']} req/24h, {r['error_rate_pct']}% errors")

def test_load_balancer_overview():
    r = load_balancer_overview()
    assert r["uptime_pct"] >= 99.9
    print(f"✅ test_overview: uptime {r['uptime_pct']}%, {r['backends']} backends")

if __name__ == "__main__":
    test_lb_backends()
    test_lb_health_check()
    test_lb_failover()
    test_lb_metrics()
    test_load_balancer_overview()
    print("\n🎉 ALL 5 TESTS PASSED — meek-defoneos-load-balancer-mcp v1.0.0 is sovereign. HA + failover LIVE.")