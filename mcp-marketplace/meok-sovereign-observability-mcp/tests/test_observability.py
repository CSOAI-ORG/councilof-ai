"""Tests for meok-sovereign-observability-mcp."""
import os, sys, tempfile, importlib
_TEST = tempfile.mkdtemp(prefix="sov_obs_")
os.environ["SOV_OBS_KEY"] = _TEST + "/k.pem"

def get_fresh():
    if "meok_sovereign_observability_mcp" in sys.modules:
        del sys.modules["meok_sovereign_observability_mcp"]
    import meok_sovereign_observability_mcp as m
    importlib.reload(m)
    return m

def test_metric_counter():
    m = get_fresh()
    r = m.obs_record_metric("requests_total", 1.0, "counter")
    assert r["metric"] == "requests_total"

def test_metric_gauge():
    m = get_fresh()
    r = m.obs_record_metric("cpu_usage", 0.85, "gauge")
    assert r["metric"] == "cpu_usage"

def test_metric_histogram():
    m = get_fresh()
    r = m.obs_record_metric("latency_ms", 100.0, "histogram")
    assert r["metric"] == "latency_ms"

def test_metric_no_name():
    m = get_fresh()
    r = m.obs_record_metric("", 1.0, "counter")
    assert "error" in r

def test_metric_invalid_kind():
    m = get_fresh()
    r = m.obs_record_metric("x", 1.0, "bogus")
    assert "error" in r

def test_counter_increments():
    m = get_fresh()
    m.obs_record_metric("reqs", 1.0, "counter")
    m.obs_record_metric("reqs", 1.0, "counter")
    m.obs_record_metric("reqs", 1.0, "counter")
    # Counter is now at 3
    status = m.obs_status()
    assert "reqs" in status["metrics"]

def test_trace():
    m = get_fresh()
    r = m.obs_record_trace("trace-001", "span-1", "", 50.0)
    assert r["trace_id"] == "trace-001"

def test_trace_no_id():
    m = get_fresh()
    r = m.obs_record_trace("", "span")
    assert "error" in r

def test_trace_no_span():
    m = get_fresh()
    r = m.obs_record_trace("t", "")
    assert "error" in r

def test_log():
    m = get_fresh()
    r = m.obs_log("info", "hello world")
    assert r["message"] == "hello world"

def test_log_no_message():
    m = get_fresh()
    r = m.obs_log("info", "")
    assert "error" in r

def test_log_invalid_level():
    m = get_fresh()
    r = m.obs_log("bogus", "x")
    assert "error" in r

def test_alert():
    m = get_fresh()
    r = m.obs_alert("high_cpu", 0.95, "above")
    assert r["rule"] == "high_cpu"

def test_alert_no_rule():
    m = get_fresh()
    r = m.obs_alert("", 0.95, "above")
    assert "error" in r

def test_status():
    m = get_fresh()
    r = m.obs_status()
    assert "metrics" in r
    assert r["logs_count"] == 0

def test_no_external_deps():
    m = get_fresh()
    src = open(m.__file__).read()
    for blocked in ["ollama", "requests", "urllib.request", "httpx"]:
        assert f"import {blocked}" not in src

def test_signed_outputs():
    m = get_fresh()
    for r in [m.obs_record_metric("x", 1, "counter"), m.obs_record_trace("t", "s"),
              m.obs_log("info", "msg"), m.obs_alert("rule", 0.5, "above"),
              m.obs_status()]:
        assert "kid" in r and "sig" in r and "ts" in r

def test_full_workflow():
    """Metric → Trace → Log → Alert → Status."""
    m = get_fresh()
    m.obs_record_metric("cpu_usage", 0.5, "gauge")
    m.obs_record_metric("cpu_usage", 0.92, "gauge")
    m.obs_record_trace("trace-001", "render-page", "", 50.0)
    m.obs_log("info", "Page rendered in 50ms")
    m.obs_alert("cpu_above_90", 0.9, "above")
    s = m.obs_status()
    assert "cpu_usage" in s["metrics"]
    assert s["traces_count"] == 1
    assert s["logs_count"] == 1
    assert "cpu_above_90" in s["alert_rules"]
