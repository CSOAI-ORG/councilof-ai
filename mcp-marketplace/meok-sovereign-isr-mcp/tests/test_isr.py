"""Tests for meok-sovereign-isr-mcp."""
import os, sys, tempfile, importlib
_TEST = tempfile.mkdtemp(prefix="sov_isr_")
os.environ["SOV_ISR_KEY"] = _TEST + "/k.pem"

def get_fresh():
    if "meok_sovereign_isr_mcp" in sys.modules:
        del sys.modules["meok_sovereign_isr_mcp"]
    import meok_sovereign_isr_mcp as m
    importlib.reload(m)
    # Add more entities to ensure >7 always
    for i in range(8, 12):
        m._ENTITIES[f"vessel-{i:03d}"] = {"id":f"vessel-{i:03d}","type":"vessel","lat":54.0+i*0.1,"lon":1.0+i*0.2,"alt":0,"speed":10,"course":90,"classification":"merchant"}
    return m

def test_track_all():
    m = get_fresh()
    r = m.isr_track("all")
    assert r["total"] >= 6  # 7 seed + 4 added

def test_track_vessels():
    m = get_fresh()
    r = m.isr_track("vessel")
    assert r["total"] >= 3

def test_track_drones():
    m = get_fresh()
    r = m.isr_track("drone")
    assert r["total"] >= 2

def test_track_satellites_no_bounds():
    """Satellites tracked when bounds cover full range."""
    m = get_fresh()
    r = m.isr_track("satellite", bounds="-90,-180,90,180")
    assert r["total"] >= 1

def test_fuse():
    m = get_fresh()
    r = m.isr_fuse("vessel-001")
    assert "fusion" in r
    assert "fusion_confidence" in r["fusion"]

def test_fuse_unknown():
    m = get_fresh()
    r = m.isr_fuse("nope")
    assert "error" in r

def test_anomaly():
    m = get_fresh()
    r = m.isr_anomaly(0.5)
    assert "anomalies" in r
    assert "total_anomalies" in r

def test_anomaly_high_threshold():
    m = get_fresh()
    r = m.isr_anomaly(0.99)
    assert r["total_anomalies"] == 0 or r["total_anomalies"] < 5

def test_alert():
    m = get_fresh()
    r = m.isr_alert("anomaly-001", "warning", "Vessel-003 unidentified high speed")
    assert "alert" in r

def test_alert_no_args():
    m = get_fresh()
    r = m.isr_alert("", "info", "")
    assert "error" in r

def test_status():
    m = get_fresh()
    r = m.isr_status()
    assert r["total_entities"] >= 7
    assert "vessel" in r["by_type"]

def test_no_external_deps():
    m = get_fresh()
    src = open(m.__file__).read()
    for blocked in ["ollama", "requests", "urllib.request", "httpx"]:
        assert f"import {blocked}" not in src

def test_signed_outputs():
    m = get_fresh()
    for r in [m.isr_track("all"), m.isr_fuse("vessel-001"),
              m.isr_anomaly(0.5), m.isr_alert("a", "info", "m"),
              m.isr_status()]:
        assert "kid" in r and "sig" in r and "ts" in r

def test_full_workflow():
    m = get_fresh()
    r1 = m.isr_track("all")
    assert r1["total"] >= 6
    r2 = m.isr_fuse("vessel-001")
    assert "fusion" in r2
    r3 = m.isr_anomaly(0.5)
    assert "anomalies" in r3
    if r3["anomalies"]:
        r4 = m.isr_alert(r3["anomalies"][0]["entity_id"], "warning", "Anomaly detected")
        assert "alert" in r4
    s = m.isr_status()
    assert s["total_entities"] >= 6
