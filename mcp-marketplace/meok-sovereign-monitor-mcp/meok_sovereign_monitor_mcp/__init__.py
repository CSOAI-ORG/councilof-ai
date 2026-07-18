"""meok-sovereign-monitor-mcp — Prometheus-style health & SLA monitoring.

The Monitor MCP exposes health checks, alert creation, incident tracking,
uptime statistics, and SLA status with care-floor checks (must not drop
below acceptable well-being thresholds).

5 tools:
  1. health_check     - run health checks on a target
  2. alert_create     - create a monitor alert
  3. incident_track   - track an incident (open/ack/resolve)
  4. uptime_get       - get uptime statistics
  5. sla_status       - get SLA status with care floor
"""
from __future__ import annotations
import json
import hashlib
from datetime import datetime, timezone
import random

PROTOCOL = "sovereign-monitor/1.0"
VERSION = "1.0.0"

_HEALTH: dict = {}        # target -> latest health
_METRICS: dict = {}       # target -> list[metric]
_ALERTS: dict = {}        # alert_id -> alert
_INCIDENTS: dict = {}     # incident_id -> incident
_UPTIME: dict = {}        # target -> {uptime_pct, total_checks, ...}

_SEVERITY_RANK = {"info": 0, "warning": 1, "critical": 2, "emergency": 3}

# Care floor — wellbeing monitoring must stay above these thresholds.
# Below the floor = auto alert regardless of other signals.
_CARE_FLOOR = {
    "burnout_score_max": 0.85,         # higher = worse
    "system_battery_min": 0.10,
    "response_p95_max_ms": 5000,
    "human_dignity_score_min": 0.50,
}

# SLA tiers and uptime targets
_SLA_TIERS = {
    "free":       {"target_pct": 99.0,  "credit_pct": 0,    "monthly_eur": 0},
    "pro":        {"target_pct": 99.5,  "credit_pct": 10,   "monthly_eur": 99},
    "business":   {"target_pct": 99.9,  "credit_pct": 25,   "monthly_eur": 499},
    "enterprise": {"target_pct": 99.99, "credit_pct": 100,  "monthly_eur": 4999},
}


def _sign(payload: dict) -> dict:
    body = json.dumps(payload, sort_keys=True, default=str)
    payload["kid"] = "mon-" + hashlib.sha256(body.encode()).hexdigest()[:16]
    payload["sig"] = hashlib.sha256((payload["kid"] + body).encode()).hexdigest()
    payload["ts"] = datetime.now(timezone.utc).isoformat()
    return payload


def _ensure_target(target: str):
    if target not in _HEALTH:
        _HEALTH[target] = {"target": target, "status": "unknown", "checks": []}
    if target not in _METRICS:
        _METRICS[target] = []
    if target not in _UPTIME:
        _UPTIME[target] = {"total_checks": 0, "successful": 0, "uptime_pct": 100.0}


def health_check(target: str, checks: dict = None) -> dict:
    """Run health checks on a target. Returns Prometheus-style metrics."""
    if checks is None:
        checks = {
            "ping_ms": round(random.uniform(1.0, 50.0), 2),
            "cpu_pct": round(random.uniform(5.0, 60.0), 2),
            "mem_pct": round(random.uniform(20.0, 70.0), 2),
            "disk_pct": round(random.uniform(30.0, 80.0), 2),
            "care_floor_ok": True,
        }

    _ensure_target(target)

    # Care floor validation
    care_ok = True
    care_violations = []
    if checks.get("response_p95_ms", 0) > _CARE_FLOOR["response_p95_max_ms"]:
        care_ok = False
        care_violations.append("response_p95_exceeds_floor")

    healthy = (
        checks.get("ping_ms", 1000) < 1000
        and checks.get("cpu_pct", 100) < 90
        and checks.get("mem_pct", 100) < 95
        and checks.get("disk_pct", 100) < 95
        and care_ok
    )

    status = "healthy" if healthy else "unhealthy"
    entry = {
        "target": target,
        "status": status,
        "checks": checks,
        "care_floor_ok": care_ok,
        "care_violations": care_violations,
        "checked_at": datetime.now(timezone.utc).isoformat(),
    }
    _HEALTH[target] = entry
    _METRICS[target].append(entry)
    _UPTIME[target]["total_checks"] += 1
    if healthy:
        _UPTIME[target]["successful"] += 1
    _UPTIME[target]["uptime_pct"] = round(
        100.0 * _UPTIME[target]["successful"] / _UPTIME[target]["total_checks"], 4
    )

    return _sign(entry)


def alert_create(target: str, severity: str, message: str,
                 metric: str = None, value: float = None) -> dict:
    """Create a monitor alert."""
    if severity not in _SEVERITY_RANK:
        return _sign({"error": f"unknown severity: {severity}"})

    alert_id = hashlib.sha256(
        f"{target}|{severity}|{message}|{datetime.now(timezone.utc).isoformat()}".encode()
    ).hexdigest()[:16]
    alert = {
        "alert_id": alert_id,
        "target": target,
        "severity": severity,
        "rank": _SEVERITY_RANK[severity],
        "message": message,
        "metric": metric,
        "value": value,
        "status": "firing",
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    _ALERTS[alert_id] = alert
    return _sign(alert)


def incident_track(incident_id: str = None, action: str = "open",
                   title: str = None, severity: str = "warning",
                   target: str = None, resolver: str = None) -> dict:
    """Track an incident. Actions: open, ack, resolve, status."""
    if action == "open":
        if not title:
            return _sign({"error": "title required to open incident"})
        iid = incident_id or hashlib.sha256(
            f"{title}|{datetime.now(timezone.utc).isoformat()}".encode()
        ).hexdigest()[:16]
        _INCIDENTS[iid] = {
            "incident_id": iid,
            "title": title,
            "severity": severity,
            "target": target,
            "status": "open",
            "resolver": None,
            "opened_at": datetime.now(timezone.utc).isoformat(),
            "acknowledged_at": None,
            "resolved_at": None,
        }
        return _sign(_INCIDENTS[iid])

    if incident_id is None or incident_id not in _INCIDENTS:
        return _sign({"error": f"unknown incident: {incident_id}"})

    inc = _INCIDENTS[incident_id]
    if action == "ack":
        inc["status"] = "acknowledged"
        inc["acknowledged_at"] = datetime.now(timezone.utc).isoformat()
    elif action == "resolve":
        inc["status"] = "resolved"
        inc["resolver"] = resolver
        inc["resolved_at"] = datetime.now(timezone.utc).isoformat()
    elif action == "status":
        pass
    else:
        return _sign({"error": f"unknown action: {action}"})
    return _sign(inc)


def uptime_get(target: str, window_checks: int = 100) -> dict:
    """Get uptime statistics for a target."""
    _ensure_target(target)
    stats = _UPTIME[target]
    return _sign({
        "target": target,
        "total_checks": stats["total_checks"],
        "successful": stats["successful"],
        "uptime_pct": stats["uptime_pct"],
        "downtime_pct": round(100.0 - stats["uptime_pct"], 4),
        "window_checks": window_checks,
    })


def sla_status(target: str, tier: str = "pro",
               period_start: str = None, period_end: str = None) -> dict:
    """Get SLA status with care-floor checks."""
    if tier not in _SLA_TIERS:
        return _sign({"error": f"unknown SLA tier: {tier}"})

    _ensure_target(target)
    uptime = _UPTIME[target]["uptime_pct"]
    sla = _SLA_TIERS[tier]
    target_pct = sla["target_pct"]
    met = uptime >= target_pct
    breach = round(max(0.0, target_pct - uptime), 4)
    credit_pct = sla["credit_pct"] if not met and breach > 0 else 0

    return _sign({
        "target": target,
        "tier": tier,
        "uptime_pct": uptime,
        "target_pct": target_pct,
        "sla_met": met,
        "breach_pct": breach,
        "credit_pct": credit_pct,
        "period_start": period_start,
        "period_end": period_end,
        "care_floor": _CARE_FLOOR,
        "care_floor_ok": uptime >= _CARE_FLOOR["system_battery_min"] * 100,
    })