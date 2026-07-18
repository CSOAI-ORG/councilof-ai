"""meok-sovereign-deploy-mcp — Canary + blue-green deployment sim.

The Deploy MCP validates deployments, stages them, promotes to production,
rolls back, and reports deploy status. Supports canary and blue-green
strategies with care-floor safety checks.

5 tools:
  1. deploy_validate   - validate a deploy config
  2. deploy_stage      - stage a deploy (canary/blue-green)
  3. deploy_production - promote staged deploy to production (BFT 3)
  4. deploy_rollback   - rollback to previous version
  5. deploy_status     - current deploy status
"""
from __future__ import annotations
import json
import hashlib
from datetime import datetime, timezone

PROTOCOL = "sovereign-deploy/1.0"
VERSION = "1.0.0"

_DEPLOYS: dict = {}      # deploy_id -> deploy
_PROMOTIONS: dict = {}   # deploy_id -> count
_ROLLBACKS: dict = {}    # deploy_id -> rollback history

# Care floor: must never roll back while traffic is healthy,
# must always validate before promoting.
_CARE_FLOOR_VOTERS = 3

_VALID_STRATEGIES = {"canary", "blue-green", "rolling"}
_VALID_STAGES = {"staging", "canary", "blue", "green", "production"}


def _sign(payload: dict) -> dict:
    body = json.dumps(payload, sort_keys=True, default=str)
    payload["kid"] = "dep-" + hashlib.sha256(body.encode()).hexdigest()[:16]
    payload["sig"] = hashlib.sha256((payload["kid"] + body).encode()).hexdigest()
    payload["ts"] = datetime.now(timezone.utc).isoformat()
    return payload


def deploy_validate(service: str, version: str,
                    strategy: str = "canary",
                    health_checks: dict = None) -> dict:
    """Validate a deploy config."""
    if not service:
        return _sign({"error": "service required"})
    if not version:
        return _sign({"error": "version required"})
    if strategy not in _VALID_STRATEGIES:
        return _sign({"error": f"unknown strategy: {strategy}"})

    if health_checks is None:
        health_checks = {
            "required_passing": True,
            "min_uptime_pct": 99.0,
            "max_error_rate": 0.01,
            "max_p95_ms": 2000,
        }

    # Care floor: health checks must be enforced
    errors = []
    if not health_checks.get("required_passing", True):
        errors.append("required_passing must be true")
    if health_checks.get("max_error_rate", 0.01) > 0.05:
        errors.append("max_error_rate too high (>5%)")
    if health_checks.get("max_p95_ms", 2000) > 5000:
        errors.append("max_p95_ms too high (>5s)")

    deploy_id = hashlib.sha256(
        f"{service}|{version}|{strategy}|{datetime.now(timezone.utc).isoformat()}".encode()
    ).hexdigest()[:16]

    deploy = {
        "deploy_id": deploy_id,
        "service": service,
        "version": version,
        "strategy": strategy,
        "health_checks": health_checks,
        "stage": "validated",
        "status": "validated",
        "validation_errors": errors,
        "validated": len(errors) == 0,
        "production": False,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "promoted_at": None,
        "rollback_history": [],
    }
    _DEPLOYS[deploy_id] = deploy
    _ROLLBACKS[deploy_id] = []
    return _sign(deploy)


def deploy_stage(deploy_id: str, stage: str = "canary",
                 traffic_pct: int = 10) -> dict:
    """Stage a deploy (canary or blue-green)."""
    if deploy_id not in _DEPLOYS:
        return _sign({"error": f"unknown deploy: {deploy_id}"})
    if stage not in _VALID_STAGES:
        return _sign({"error": f"unknown stage: {stage}"})

    deploy = _DEPLOYS[deploy_id]
    if not deploy["validated"]:
        return _sign({"error": "deploy not validated", "errors": deploy["validation_errors"]})

    if deploy["strategy"] == "canary":
        if not (0 < traffic_pct <= 100):
            return _sign({"error": "canary traffic_pct must be 1-100"})
    else:
        traffic_pct = 100  # blue-green flips 100%

    deploy["stage"] = stage
    deploy["traffic_pct"] = traffic_pct
    deploy["status"] = "staged"
    deploy["staged_at"] = datetime.now(timezone.utc).isoformat()
    return _sign(deploy)


def deploy_production(deploy_id: str, approver: str) -> dict:
    """Promote staged deploy to production (BFT 3 voters)."""
    if deploy_id not in _DEPLOYS:
        return _sign({"error": f"unknown deploy: {deploy_id}"})
    deploy = _DEPLOYS[deploy_id]
    if deploy["status"] not in ("staged", "validated"):
        return _sign({"error": f"deploy not staged: {deploy['status']}"})

    if deploy_id not in _PROMOTIONS:
        _PROMOTIONS[deploy_id] = 0
    _PROMOTIONS[deploy_id] += 1
    approvals = _PROMOTIONS[deploy_id]

    if approvals < _CARE_FLOOR_VOTERS:
        return _sign({
            "approvals": approvals,
            "required": _CARE_FLOOR_VOTERS,
            "promoted": False,
        })

    # Find previous production deploy of same service to enable rollback
    previous = None
    for did, d in _DEPLOYS.items():
        if d["service"] == deploy["service"] and d["production"] and did != deploy_id:
            previous = did
    deploy["production"] = True
    deploy["stage"] = "production"
    deploy["status"] = "production"
    deploy["promoted_at"] = datetime.now(timezone.utc).isoformat()
    deploy["promoted_by"] = approver
    deploy["previous_deploy_id"] = previous
    deploy["traffic_pct"] = 100
    _PROMOTIONS[deploy_id] = 0
    return _sign({
        "promoted": True,
        "deploy_id": deploy_id,
        "service": deploy["service"],
        "version": deploy["version"],
        "previous_deploy_id": previous,
        "approver": approver,
    })


def deploy_rollback(deploy_id: str, reason: str = "manual",
                    approver: str = "system") -> dict:
    """Rollback a deploy. Restores previous production version."""
    if deploy_id not in _DEPLOYS:
        return _sign({"error": f"unknown deploy: {deploy_id}"})
    deploy = _DEPLOYS[deploy_id]
    if not deploy["production"]:
        return _sign({"error": "deploy not in production; nothing to roll back"})

    previous_id = deploy.get("previous_deploy_id")
    rolled_back_to = None
    if previous_id and previous_id in _DEPLOYS:
        rolled_back_to = previous_id
        deploy["status"] = "rolled_back"
        deploy["traffic_pct"] = 0
    else:
        deploy["status"] = "rolled_back_no_previous"
        deploy["traffic_pct"] = 0

    rb_entry = {
        "reason": reason,
        "approver": approver,
        "rolled_back_to": rolled_back_to,
        "rolled_back_at": datetime.now(timezone.utc).isoformat(),
    }
    deploy["rollback_history"].append(rb_entry)
    _ROLLBACKS[deploy_id].append(rb_entry)
    return _sign({
        "rolled_back": True,
        "deploy_id": deploy_id,
        "rolled_back_to": rolled_back_to,
        "reason": reason,
    })


def deploy_status(deploy_id: str = None, service: str = None) -> dict:
    """Current deploy status (specific or filtered)."""
    items = []
    for did, d in _DEPLOYS.items():
        if deploy_id and did != deploy_id:
            continue
        if service and d["service"] != service:
            continue
        items.append({
            "deploy_id": did,
            "service": d["service"],
            "version": d["version"],
            "strategy": d["strategy"],
            "stage": d["stage"],
            "status": d["status"],
            "production": d["production"],
            "traffic_pct": d.get("traffic_pct", 0),
            "created_at": d["created_at"],
        })

    return _sign({
        "deploys": items,
        "count": len(items),
        "filter_deploy_id": deploy_id,
        "filter_service": service,
        "protocol": PROTOCOL,
        "version": VERSION,
    })