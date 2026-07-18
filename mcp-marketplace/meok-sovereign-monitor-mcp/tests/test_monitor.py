"""Tests for meok-sovereign-monitor-mcp (health, alerts, incidents, SLA)."""
import meok_sovereign_monitor_mcp as m_mod
from meok_sovereign_monitor_mcp import (
    health_check, alert_create, incident_track,
    uptime_get, sla_status,
)


def reset_state():
    m_mod._HEALTH.clear()
    m_mod._METRICS.clear()
    m_mod._ALERTS.clear()
    m_mod._INCIDENTS.clear()
    m_mod._UPTIME.clear()


def test_health_check_healthy():
    reset_state()
    r = health_check("api-1")
    assert r["status"] == "healthy"
    assert r["care_floor_ok"] is True


def test_health_check_unhealthy_ping():
    reset_state()
    r = health_check("api-2", checks={"ping_ms": 5000, "cpu_pct": 10, "mem_pct": 10, "disk_pct": 10})
    assert r["status"] == "unhealthy"


def test_health_check_care_floor_violation():
    reset_state()
    r = health_check("api-3", checks={
        "ping_ms": 5, "cpu_pct": 10, "mem_pct": 10, "disk_pct": 10,
        "response_p95_ms": 9999,
    })
    assert r["status"] == "unhealthy"
    assert "response_p95_exceeds_floor" in r["care_violations"]


def test_alert_create_basic():
    reset_state()
    r = alert_create("api-1", "critical", "down")
    assert r["severity"] == "critical"
    assert r["status"] == "firing"
    assert r["rank"] == 2


def test_alert_create_emergency():
    reset_state()
    r = alert_create("api-1", "emergency", "paged")
    assert r["rank"] == 3


def test_alert_create_unknown_severity():
    r = alert_create("api-1", "panic", "msg")
    assert "error" in r


def test_incident_open():
    reset_state()
    r = incident_track(action="open", title="db down", severity="critical", target="db-1")
    assert r["status"] == "open"


def test_incident_lifecycle():
    reset_state()
    inc = incident_track(action="open", title="outage", severity="critical")
    iid = inc["incident_id"]
    ack = incident_track(iid, "ack")
    assert ack["status"] == "acknowledged"
    res = incident_track(iid, "resolve", resolver="oncall")
    assert res["status"] == "resolved"
    assert res["resolver"] == "oncall"


def test_incident_status_query():
    reset_state()
    inc = incident_track(action="open", title="x")
    iid = inc["incident_id"]
    r = incident_track(iid, "status")
    assert r["status"] == "open"


def test_incident_unknown_action():
    reset_state()
    inc = incident_track(action="open", title="x")
    r = incident_track(inc["incident_id"], "nope")
    assert "error" in r


def test_uptime_initial():
    reset_state()
    r = uptime_get("svc-1")
    assert r["uptime_pct"] == 100.0


def test_uptime_with_checks():
    reset_state()
    health_check("svc-2")
    health_check("svc-2")
    health_check("svc-2", checks={"ping_ms": 9999})
    r = uptime_get("svc-2")
    assert r["total_checks"] == 3
    assert r["successful"] == 2
    assert r["uptime_pct"] < 100.0


def test_sla_met():
    reset_state()
    for _ in range(10):
        health_check("svc-3")
    r = sla_status("svc-3", tier="pro")
    assert r["uptime_pct"] == 100.0
    assert r["sla_met"] is True
    assert r["target_pct"] == 99.5


def test_sla_breach():
    reset_state()
    health_check("svc-4")
    health_check("svc-4", checks={"ping_ms": 9999})
    r = sla_status("svc-4", tier="enterprise")
    assert r["sla_met"] is False
    assert r["breach_pct"] > 0


def test_sla_unknown_tier():
    r = sla_status("svc", tier="nope")
    assert "error" in r


def test_sla_includes_care_floor():
    reset_state()
    health_check("svc-5")
    r = sla_status("svc-5", tier="business")
    assert "care_floor" in r
    assert "care_floor_ok" in r


def test_no_external_deps():
    src = open(m_mod.__file__).read()
    assert "import ollama" not in src
    assert "import urllib" not in src
    assert "import requests" not in src


def test_signed_outputs():
    reset_state()
    health_check("svc-6")
    alert_create("svc-6", "warning", "msg")
    incident_track(action="open", title="t")
    for r in [
        health_check("svc-6"),
        uptime_get("svc-6"),
        sla_status("svc-6", tier="pro"),
    ]:
        assert "kid" in r and "sig" in r and "ts" in r


def test_full_lifecycle():
    """Health → alert → incident → resolve → SLA."""
    reset_state()
    for _ in range(5):
        health_check("prod")
    a = alert_create("prod", "warning", "slow")
    inc = incident_track(action="open", title="slow responses", target="prod")
    ack = incident_track(inc["incident_id"], "ack")
    res = incident_track(inc["incident_id"], "resolve", resolver="ops")
    sla = sla_status("prod", tier="pro")
    assert res["status"] == "resolved"
    assert sla["uptime_pct"] >= 0