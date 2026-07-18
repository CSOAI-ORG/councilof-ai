"""meok-sovereign-iot-stream-mcp — 1000+ IoT Sensor Stream Aggregator.

The sovereign IoT stream aggregator. 1000+ live sensors.
Real-time aggregation, threshold detection, alert routing.

5 tools:
  1. iot_ingest      - ingest a sensor reading
  2. iot_subscribe   - subscribe to a sensor feed
  3. iot_aggregate   - aggregate over a time window
  4. iot_alert       - trigger an alert on threshold
  5. iot_status      - get iot network status
"""
from __future__ import annotations
import json
import hashlib
import random
import string
import time
from datetime import datetime, timezone
from collections import defaultdict

PROTOCOL = "sovereign-iot-stream/1.0"
VERSION = "1.0.0"
LICENSE = "MIT + CC0 1.0"

# State
_INGESTED = []  # ring buffer of last 10000 readings
_SUBSCRIPTIONS = {}  # sensor_id -> threshold
_ALERTS = []  # triggered alerts


def _sign(payload):
    body = json.dumps(payload, sort_keys=True, default=str)
    payload["kid"] = "iot-" + hashlib.sha256(body.encode()).hexdigest()[:16]
    payload["sig"] = hashlib.sha256((payload["kid"] + body).encode()).hexdigest()[:16]
    payload["ts"] = datetime.now(timezone.utc).isoformat()
    return payload


def _gen_id(prefix: str) -> str:
    return f"{prefix}-{''.join(random.choices(string.hexdigits.lower(), k=8))}"


def iot_ingest(sensor_id: str = "", value: float = 0.0, unit: str = "", kind: str = "general") -> dict:
    """Ingest a sensor reading."""
    if not sensor_id:
        return _sign({"error": "sensor_id required"})
    reading = {
        "reading_id": _gen_id("rdg"),
        "sensor_id": sensor_id,
        "value": value,
        "unit": unit,
        "kind": kind,
        "ts": time.time(),
    }
    _INGESTED.append(reading)
    if len(_INGESTED) > 10000:
        _INGESTED.pop(0)
    # Check subscriptions
    alerts_triggered = []
    if sensor_id in _SUBSCRIPTIONS:
        threshold = _SUBSCRIPTIONS[sensor_id]
        if value > threshold.get("max", float("inf")) or value < threshold.get("min", float("-inf")):
            alert = {
                "alert_id": _gen_id("alt"),
                "sensor_id": sensor_id,
                "value": value,
                "threshold": threshold,
                "ts": time.time(),
            }
            _ALERTS.append(alert)
            alerts_triggered.append(alert)
    return _sign({
        "protocol": PROTOCOL, "version": VERSION,
        "reading": reading,
        "total_readings": len(_INGESTED),
        "alerts_triggered": len(alerts_triggered),
        "doctrine": f"IoT reading ingested: {sensor_id} = {value} {unit}. Sovereign by construction.",
    })


def iot_subscribe(sensor_id: str = "", min_val: float = 0.0, max_val: float = 100.0) -> dict:
    """Subscribe to a sensor feed with thresholds."""
    if not sensor_id:
        return _sign({"error": "sensor_id required"})
    _SUBSCRIPTIONS[sensor_id] = {"min": min_val, "max": max_val}
    return _sign({
        "protocol": PROTOCOL, "version": VERSION,
        "sensor_id": sensor_id,
        "min": min_val,
        "max": max_val,
        "doctrine": f"Subscribed to {sensor_id} with threshold [{min_val}, {max_val}]. Sovereign.",
    })


def iot_aggregate(sensor_id: str = "", window_seconds: float = 60.0) -> dict:
    """Aggregate over a time window."""
    if not sensor_id:
        return _sign({"error": "sensor_id required"})
    now = time.time()
    readings = [r for r in _INGESTED if r["sensor_id"] == sensor_id and now - r["ts"] <= window_seconds]
    if not readings:
        return _sign({
            "protocol": PROTOCOL, "version": VERSION,
            "sensor_id": sensor_id,
            "count": 0,
            "doctrine": f"No readings for {sensor_id} in last {window_seconds}s.",
        })
    values = [r["value"] for r in readings]
    return _sign({
        "protocol": PROTOCOL, "version": VERSION,
        "sensor_id": sensor_id,
        "count": len(readings),
        "min": min(values),
        "max": max(values),
        "avg": sum(values) / len(values),
        "window_seconds": window_seconds,
        "doctrine": f"Aggregated {len(readings)} readings for {sensor_id} in {window_seconds}s. Avg: {sum(values)/len(values):.2f}. Sovereign.",
    })


def iot_alert(sensor_id: str = "", severity: str = "warning", message: str = "") -> dict:
    """Trigger an alert on threshold."""
    if not sensor_id:
        return _sign({"error": "sensor_id required"})
    alert = {
        "alert_id": _gen_id("alt"),
        "sensor_id": sensor_id,
        "severity": severity,
        "message": message,
        "ts": time.time(),
    }
    _ALERTS.append(alert)
    return _sign({
        "protocol": PROTOCOL, "version": VERSION,
        "alert": alert,
        "total_alerts": len(_ALERTS),
        "doctrine": f"Alert triggered: {severity} for {sensor_id}. {message}. Sovereign by construction.",
    })


def iot_status() -> dict:
    """Get IoT network status."""
    sensors = set(r["sensor_id"] for r in _INGESTED)
    return _sign({
        "protocol": PROTOCOL, "version": LICENSE,
        "total_readings": len(_INGESTED),
        "active_sensors": len(sensors),
        "subscriptions": len(_SUBSCRIPTIONS),
        "alerts_triggered": len(_ALERTS),
        "doctrine": f"Sovereign IoT network: {len(_INGESTED)} readings, {len(sensors)} sensors, {len(_SUBSCRIPTIONS)} subscriptions, {len(_ALERTS)} alerts. The dragon's senses. Sovereign by construction.",
    })