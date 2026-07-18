"""meok-sovereign-observability-mcp — Sovereign Metrics + Traces + Logs + Alerts.

Metrics (counters/gauges/histograms) + Traces + Logs + Alerts.
Sovereign by construction.

5 tools:
  1. obs_record_metric  - record a metric
  2. obs_record_trace   - record a trace span
  3. obs_log            - log an event
  4. obs_alert          - create an alert
  5. obs_status         - get observability status
"""
from __future__ import annotations
import json
import hashlib
import random
import string
import time
from datetime import datetime, timezone

PROTOCOL = "sovereign-observability/1.0"
VERSION = "1.0.0"
LICENSE = "MIT + CC0 1.0"

# State
_METRICS = {}  # metric_name -> {type, value/timer series}
_TRACES = []  # spans
_LOGS = []  # log entries
_ALERTS = []  # active alerts
_ALERT_RULES = {}  # rule_name -> {threshold, condition}


def _sign(payload):
    body = json.dumps(payload, sort_keys=True, default=str)
    payload["kid"] = "obs-" + hashlib.sha256(body.encode()).hexdigest()[:16]
    payload["sig"] = hashlib.sha256((payload["kid"] + body).encode()).hexdigest()[:16]
    payload["ts"] = datetime.now(timezone.utc).isoformat()
    return payload


def _gen_id(prefix: str) -> str:
    return f"{prefix}-{''.join(random.choices(string.hexdigits.lower(), k=8))}"


def obs_record_metric(name: str = "", value: float = 0.0, kind: str = "counter", tags: str = "") -> dict:
    """Record a metric (counter, gauge, or histogram)."""
    if not name:
        return _sign({"error": "name required"})
    tag_dict = {p.split("=")[0]: p.split("=")[1] for p in tags.split(",") if "=" in p} if tags else {}
    if kind == "counter":
        if name not in _METRICS:
            _METRICS[name] = {"type": "counter", "value": 0.0, "tags": tag_dict, "history": []}
        _METRICS[name]["value"] += value
        _METRICS[name]["history"].append({"value": _METRICS[name]["value"], "ts": time.time()})
    elif kind == "gauge":
        _METRICS[name] = {"type": "gauge", "value": value, "tags": tag_dict, "history": [{"value": value, "ts": time.time()}]}
    elif kind == "histogram":
        if name not in _METRICS:
            _METRICS[name] = {"type": "histogram", "values": [], "tags": tag_dict, "history": []}
        _METRICS[name]["values"].append(value)
        _METRICS[name]["history"].append({"value": value, "ts": time.time()})
    else:
        return _sign({"error": f"unknown kind: {kind}. Use: counter/gauge/histogram"})
    return _sign({
        "protocol": PROTOCOL, "version": VERSION,
        "metric": name,
        "value": value,
        "kind": kind,
        "doctrine": f"Metric {name} recorded. Sovereign by construction.",
    })


def obs_record_trace(trace_id: str = "", span_name: str = "", parent: str = "", duration_ms: float = 0.0) -> dict:
    """Record a trace span."""
    if not trace_id or not span_name:
        return _sign({"error": "trace_id and span_name required"})
    span_id = _gen_id("span")
    _TRACES.append({
        "trace_id": trace_id,
        "span_id": span_id,
        "span_name": span_name,
        "parent": parent,
        "duration_ms": duration_ms,
        "started_at": datetime.now(timezone.utc).isoformat(),
    })
    return _sign({
        "protocol": PROTOCOL, "version": VERSION,
        "trace_id": trace_id,
        "span_id": span_id,
        "span_name": span_name,
        "duration_ms": duration_ms,
        "doctrine": f"Trace span {span_name} recorded. Sovereign.",
    })


def obs_log(level: str = "info", message: str = "", source: str = "") -> dict:
    """Log an event."""
    if not message:
        return _sign({"error": "message required"})
    if level not in ("debug", "info", "warn", "error", "fatal"):
        return _sign({"error": f"invalid level: {level}. Use: debug/info/warn/error/fatal"})
    log_id = _gen_id("log")
    _LOGS.append({
        "log_id": log_id,
        "level": level,
        "message": message,
        "source": source,
        "ts": datetime.now(timezone.utc).isoformat(),
    })
    return _sign({
        "protocol": PROTOCOL, "version": VERSION,
        "log_id": log_id,
        "level": level,
        "message": message,
        "doctrine": f"Log recorded at {level}. Sovereign by construction.",
    })


def obs_alert(rule: str = "", threshold: float = 0.0, condition: str = "above") -> dict:
    """Create an alert rule."""
    if not rule:
        return _sign({"error": "rule required"})
    _ALERT_RULES[rule] = {
        "rule": rule,
        "threshold": threshold,
        "condition": condition,  # above / below
        "created_at": datetime.now(timezone.utc).isoformat(),
        "active": False,
        "fired_count": 0,
    }
    return _sign({
        "protocol": PROTOCOL, "version": VERSION,
        "rule": rule,
        "threshold": threshold,
        "condition": condition,
        "doctrine": f"Alert rule {rule} created. Sovereign.",
    })


def obs_status() -> dict:
    """Get observability status."""
    return _sign({
        "protocol": PROTOCOL, "version": LICENSE,
        "metrics": _METRICS,
        "traces_count": len(_TRACES),
        "logs_count": len(_LOGS),
        "alert_rules": _ALERT_RULES,
        "doctrine": f"Sovereign observability: {len(_METRICS)} metrics, {len(_TRACES)} traces, {len(_LOGS)} logs, {len(_ALERT_RULES)} alert rules. Care Floor 0.95.",
    })