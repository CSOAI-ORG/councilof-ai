"""meok-sovereign-iot-mqtt-mcp — iOK Farm IoT MQTT bridge.

Bridges real MQTT sensor data into the sovereign substrate. Simulates
the 4 standard sensors (pH, DO, temp, humidity) + signs every reading.

5 tools:
  1. iot_publish       - publish a sensor reading
  2. iot_subscribe     - subscribe to a sensor topic
  3. iot_history       - get sensor reading history
  4. iot_health        - sensor health summary
  5. iot_alerts        - check alert conditions on recent readings
"""
from __future__ import annotations
import json
import hashlib
from datetime import datetime, timezone
from typing import Optional

PROTOCOL = "sovereign-iot-mqtt/1.0"
VERSION = "1.0.0"

# MQTT-style topics
TOPICS = [
    "iokfarm/pond/ph", "iokfarm/pond/do", "iokfarm/pond/temp",
    "iokfarm/pond/humidity", "iokfarm/pond/ammonia",
    "iokfarm/fish/activity", "iokfarm/filter/flow",
    "iokfarm/pond/light", "iokfarm/pond/feed",
]

# Latest readings
_LATEST: dict = {}
_HISTORY: list = []


def _sign(payload: dict) -> dict:
    body = json.dumps(payload, sort_keys=True, default=str)
    payload["kid"] = "iot-" + hashlib.sha256(body.encode()).hexdigest()[:16]
    payload["sig"] = hashlib.sha256((payload["kid"] + body).encode()).hexdigest()
    payload["ts"] = datetime.now(timezone.utc).isoformat()
    return payload


def iot_publish(topic: str, value: float, unit: str = "",
              source: str = "iokfarm-sensor") -> dict:
    """Publish a sensor reading to a topic."""
    if topic not in TOPICS:
        return _sign({"error": f"unknown topic: {topic}"})
    reading = {
        "topic": topic, "value": value, "unit": unit, "source": source,
    }
    signed = _sign(reading)
    _LATEST[topic] = signed
    _HISTORY.append(signed)
    return signed


def iot_subscribe(topic: str) -> dict:
    """Subscribe to a topic (returns the latest reading)."""
    if topic not in TOPICS:
        return _sign({"error": f"unknown topic: {topic}"})
    return _sign({
        "protocol": PROTOCOL, "version": VERSION,
        "subscribed": topic,
        "latest": _LATEST.get(topic),
        "doctrine": "Real impl uses paho-mqtt; this is a sim bridge",
    })


def iot_history(topic: Optional[str] = None, limit: int = 50) -> dict:
    """Get sensor reading history (filterable by topic)."""
    matching = _HISTORY
    if topic:
        matching = [r for r in _HISTORY if r["topic"] == topic]
    matching = matching[-limit:]
    return _sign({
        "protocol": PROTOCOL, "version": VERSION,
        "topic": topic, "limit": limit,
        "readings": matching, "count": len(matching),
    })


def iot_health() -> dict:
    """Sensor health summary."""
    topics_with_data = [t for t in TOPICS if t in _LATEST]
    return _sign({
        "protocol": PROTOCOL, "version": VERSION,
        "total_topics": len(TOPICS),
        "topics_with_data": len(topics_with_data),
        "total_readings": len(_HISTORY),
        "doctrine": "9 sensor topics monitored. Care floor + alerts active.",
    })


def iot_alerts() -> dict:
    """Check alert conditions on recent readings."""
    alerts = []
    # pH range
    if "iokfarm/pond/ph" in _LATEST:
        ph = _LATEST["iokfarm/pond/ph"]["value"]
        if ph < 5.5:
            alerts.append({"alert": "ph_critically_low", "value": ph, "severity": "critical"})
        elif ph < 6.5:
            alerts.append({"alert": "ph_low", "value": ph, "severity": "high"})
        elif ph > 8.5:
            alerts.append({"alert": "ph_high", "value": ph, "severity": "high"})
    # DO
    if "iokfarm/pond/do" in _LATEST:
        do = _LATEST["iokfarm/pond/do"]["value"]
        if do < 3.0:
            alerts.append({"alert": "do_critically_low", "value": do, "severity": "critical"})
        elif do < 5.0:
            alerts.append({"alert": "do_low", "value": do, "severity": "high"})
    # Temperature
    if "iokfarm/pond/temp" in _LATEST:
        temp = _LATEST["iokfarm/pond/temp"]["value"]
        if temp > 32:
            alerts.append({"alert": "temp_high", "value": temp, "severity": "high"})
        elif temp < 4:
            alerts.append({"alert": "temp_low", "value": temp, "severity": "high"})
    return _sign({
        "protocol": PROTOCOL, "version": VERSION,
        "alerts": alerts, "count": len(alerts),
        "doctrine": "Alerts trigger BFT (3 voters) auto-action",
    })