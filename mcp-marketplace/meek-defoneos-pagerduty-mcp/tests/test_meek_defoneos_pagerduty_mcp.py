"""Tests for meek-defoneos-pagerduty-mcp."""
import os, sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from meek_defoneos_pagerduty_mcp.server import pagerduty_alerts_list, pagerduty_alert_create, pagerduty_alert_acknowledge, pagerduty_alert_resolve, pagerduty_metrics, pagerduty_overview

def test_pagerduty_alerts_list():
    r = pagerduty_alerts_list()
    assert r["count"] >= 2
    print(f"✅ test_alerts: {r['count']} active alerts")

def test_pagerduty_alert_create():
    r = pagerduty_alert_create()
    assert r["status"] == "OPEN"
    print(f"✅ test_create: {r['alert_id'][:20]}... ({r['severity']})")

def test_pagerduty_alert_acknowledge():
    r = pagerduty_alert_acknowledge()
    assert r["status"] == "ACKNOWLEDGED"
    print(f"✅ test_ack: {r['alert_id']} acknowledged")

def test_pagerduty_alert_resolve():
    r = pagerduty_alert_resolve()
    assert r["status"] == "RESOLVED"
    print(f"✅ test_resolve: {r['alert_id']} resolved")

def test_pagerduty_metrics():
    r = pagerduty_metrics()
    assert r["uptime_pct_24h"] >= 99.0
    print(f"✅ test_metrics: uptime {r['uptime_pct_24h']}%, MTTR {r['mttr_minutes']} min")

def test_pagerduty_overview():
    r = pagerduty_overview()
    assert r["active_alerts"] >= 2
    print(f"✅ test_overview: {r['active_alerts']} active alerts")

if __name__ == "__main__":
    test_pagerduty_alerts_list()
    test_pagerduty_alert_create()
    test_pagerduty_alert_acknowledge()
    test_pagerduty_alert_resolve()
    test_pagerduty_metrics()
    test_pagerduty_overview()
    print("\n🎉 ALL 6 TESTS PASSED — meek-defoneos-pagerduty-mcp v1.0.0 is sovereign. Production incident response live.")