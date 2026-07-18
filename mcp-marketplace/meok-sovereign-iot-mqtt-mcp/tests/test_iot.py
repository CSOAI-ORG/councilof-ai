"""Tests for meok-sovereign-iot-mqtt-mcp (iOK Farm IoT bridge)."""
import os, tempfile
_TEST_DIR = tempfile.mkdtemp(prefix="sov_iot_test_")
os.environ["SOV_IOT_KEY"] = os.path.join(_TEST_DIR, "key.pem")
from meok_sovereign_iot_mqtt_mcp import (
    iot_publish, iot_subscribe, iot_history, iot_health, iot_alerts,
    TOPICS, _LATEST, _HISTORY,
)


def reset_iot():
    _LATEST.clear()
    _HISTORY.clear()


def test_9_topics():
    assert len(TOPICS) == 9


def test_publish_basic():
    reset_iot()
    r = iot_publish("iokfarm/pond/ph", 7.4, unit="log_scale")
    assert r["topic"] == "iokfarm/pond/ph"
    assert r["value"] == 7.4
    assert r["unit"] == "log_scale"


def test_publish_invalid_topic():
    r = iot_publish("invalid/topic", 1.0)
    assert "error" in r


def test_subscribe_returns_latest():
    reset_iot()
    iot_publish("iokfarm/pond/ph", 7.5)
    r = iot_subscribe("iokfarm/pond/ph")
    assert r["subscribed"] == "iokfarm/pond/ph"
    assert r["latest"]["value"] == 7.5


def test_subscribe_invalid_topic():
    r = iot_subscribe("invalid")
    assert "error" in r


def test_history_all():
    reset_iot()
    iot_publish("iokfarm/pond/ph", 7.4)
    iot_publish("iokfarm/pond/do", 8.0)
    iot_publish("iokfarm/pond/temp", 22.0)
    r = iot_history()
    assert r["count"] == 3


def test_history_filtered():
    reset_iot()
    iot_publish("iokfarm/pond/ph", 7.4)
    iot_publish("iokfarm/pond/do", 8.0)
    iot_publish("iokfarm/pond/ph", 7.5)
    r = iot_history(topic="iokfarm/pond/ph")
    assert r["count"] == 2


def test_history_limit():
    reset_iot()
    for i in range(10):
        iot_publish("iokfarm/pond/ph", 7.0 + i * 0.01)
    r = iot_history(limit=5)
    assert r["count"] == 5


def test_health_summary():
    reset_iot()
    iot_publish("iokfarm/pond/ph", 7.4)
    iot_publish("iokfarm/pond/do", 8.0)
    r = iot_health()
    assert r["total_topics"] == 9
    assert r["topics_with_data"] == 2
    assert r["total_readings"] == 2


def test_alerts_ph_low():
    reset_iot()
    iot_publish("iokfarm/pond/ph", 5.0)  # Below 5.5 → critical
    r = iot_alerts()
    assert any(a["alert"] == "ph_critically_low" for a in r["alerts"])


def test_alerts_ph_high():
    reset_iot()
    iot_publish("iokfarm/pond/ph", 9.0)
    r = iot_alerts()
    assert any(a["alert"] == "ph_high" for a in r["alerts"])


def test_alerts_do_critical():
    reset_iot()
    iot_publish("iokfarm/pond/do", 2.0)  # Below 3.0 → critical
    r = iot_alerts()
    assert any(a["alert"] == "do_critically_low" for a in r["alerts"])


def test_alerts_temp_high():
    reset_iot()
    iot_publish("iokfarm/pond/temp", 35.0)  # Above 32 → high
    r = iot_alerts()
    assert any(a["alert"] == "temp_high" for a in r["alerts"])


def test_alerts_healthy():
    reset_iot()
    iot_publish("iokfarm/pond/ph", 7.4)
    iot_publish("iokfarm/pond/do", 8.0)
    iot_publish("iokfarm/pond/temp", 22.0)
    r = iot_alerts()
    assert r["count"] == 0


def test_no_external_deps():
    import meok_sovereign_iot_mqtt_mcp as m
    src = open(m.__file__).read()
    assert "import ollama" not in src
    assert "import urllib" not in src
    assert "import requests" not in src


def test_signed_outputs():
    reset_iot()
    r1 = iot_publish("iokfarm/pond/ph", 7.4)
    assert "kid" in r1 and "sig" in r1 and "ts" in r1
    r2 = iot_subscribe("iokfarm/pond/ph")
    assert "kid" in r2 and "sig" in r2 and "ts" in r2
    r3 = iot_history()
    assert "kid" in r3 and "sig" in r3 and "ts" in r3
    r4 = iot_health()
    assert "kid" in r4 and "sig" in r4 and "ts" in r4
    r5 = iot_alerts()
    assert "kid" in r5 and "sig" in r5 and "ts" in r5


def test_full_simulation():
    """Simulate a full pond monitoring cycle."""
    reset_iot()
    readings = [
        ("iokfarm/pond/ph", 7.4, "log_scale"),
        ("iokfarm/pond/do", 8.2, "mg/L"),
        ("iokfarm/pond/temp", 22.1, "°C"),
        ("iokfarm/pond/humidity", 65.0, "%"),
        ("iokfarm/pond/ammonia", 0.01, "mg/L"),
    ]
    for topic, value, unit in readings:
        iot_publish(topic, value, unit)
    r = iot_health()
    assert r["topics_with_data"] == 5
    assert r["total_readings"] == 5
    a = iot_alerts()
    assert a["count"] == 0  # all healthy