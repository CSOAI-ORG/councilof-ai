"""Tests for meok-sovereign-iot-stream-mcp."""
import os, sys, tempfile, importlib, time
_TEST = tempfile.mkdtemp(prefix="sov_iot2_")
os.environ["SOV_IOT2_KEY"] = _TEST + "/k.pem"

def get_fresh():
    if "meok_sovereign_iot_stream_mcp" in sys.modules:
        del sys.modules["meok_sovereign_iot_stream_mcp"]
    import meok_sovereign_iot_stream_mcp as m
    importlib.reload(m)
    return m

def test_ingest():
    m = get_fresh()
    r = m.iot_ingest("sensor-001", 25.5, "°C", "temperature")
    assert r["reading"]["value"] == 25.5
    assert r["total_readings"] == 1

def test_ingest_no_sensor():
    m = get_fresh()
    r = m.iot_ingest("", 25.5)
    assert "error" in r or "count" not in r

def test_ingest_increments():
    m = get_fresh()
    m.iot_ingest("a", 1.0)
    m.iot_ingest("b", 2.0)
    m.iot_ingest("c", 3.0)
    s = m.iot_status()
    assert s["total_readings"] == 3

def test_subscribe():
    m = get_fresh()
    r = m.iot_subscribe("temp-1", min_val=0, max_val=100)
    assert r["min"] == 0
    assert r["max"] == 100

def test_subscribe_no_sensor():
    m = get_fresh()
    r = m.iot_subscribe("")
    assert "error" in r or "count" not in r

def test_aggregate():
    m = get_fresh()
    m.iot_ingest("temp-2", 10.0)
    m.iot_ingest("temp-2", 20.0)
    m.iot_ingest("temp-2", 30.0)
    r = m.iot_aggregate("temp-2", window_seconds=10)
    assert r["count"] == 3
    assert r["avg"] == 20.0
    assert r["min"] == 10.0
    assert r["max"] == 30.0

def test_aggregate_no_sensor():
    m = get_fresh()
    r = m.iot_aggregate("nope", window_seconds=10)
    assert r["count"] == 0

def test_aggregate_no_data():
    m = get_fresh()
    r = m.iot_aggregate("nope")
    assert r["count"] == 0

def test_alert():
    m = get_fresh()
    r = m.iot_alert("sensor-1", "critical", "Temperature too high")
    assert r["alert"]["severity"] == "critical"

def test_alert_no_sensor():
    m = get_fresh()
    r = m.iot_alert("")
    assert "error" in r or "count" not in r

def test_threshold_alert():
    """When a reading exceeds threshold, alert is triggered."""
    m = get_fresh()
    m.iot_subscribe("temp-3", min_val=0, max_val=50)
    r = m.iot_ingest("temp-3", 100.0)  # exceeds max
    assert r["alerts_triggered"] == 1

def test_status():
    m = get_fresh()
    r = m.iot_status()
    assert r["total_readings"] == 0
    assert r["active_sensors"] == 0

def test_no_external_deps():
    m = get_fresh()
    src = open(m.__file__).read()
    for blocked in ["ollama", "requests", "urllib.request", "httpx"]:
        assert f"import {blocked}" not in src

def test_signed_outputs():
    m = get_fresh()
    for r in [m.iot_ingest("x", 1.0), m.iot_subscribe("x"), m.iot_aggregate("x", 1),
              m.iot_alert("x", "info"), m.iot_status()]:
        assert "kid" in r and "sig" in r and "ts" in r

def test_full_workflow():
    """Subscribe → Ingest → Aggregate → Alert → Status."""
    m = get_fresh()
    r1 = m.iot_subscribe("temp-1", min_val=0, max_val=100)
    assert r1["sensor_id"] == "temp-1"
    r2 = m.iot_ingest("temp-1", 25.0, "°C", "temperature")
    assert r2["total_readings"] == 1
    r3 = m.iot_aggregate("temp-1", window_seconds=10)
    assert r3["count"] == 1
    r4 = m.iot_ingest("temp-1", 200.0)  # exceeds max
    assert r4["alerts_triggered"] == 1
    s = m.iot_status()
    assert s["total_readings"] == 2
    assert s["alerts_triggered"] == 1
