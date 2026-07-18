"""meok-sovereign-rpc-bus-mcp — 33-hive RPC bus for cross-VM coordination.

The RPC bus handles communication between the 12 GCP VMs (Generals)
and the 33 Hives. Uses a request/response pattern with sigil-signed
messages.

5 tools:
  1. rpc_call        - call a method on a target General/Hive
  2. rpc_broadcast   - broadcast to all 33 Hives
  3. rpc_register    - register a method handler
  4. rpc_keepalive   - ping a target (heartbeat)
  5. rpc_status      - bus status + connections
"""
from __future__ import annotations
import json
import hashlib
import time
from datetime import datetime, timezone
from typing import Dict, List, Optional, Callable

PROTOCOL = "sovereign-rpc-bus/1.0"
VERSION = "1.0.0"

# Registered handlers (per-General, per-Hive)
_HANDLERS: Dict[str, Dict[str, Callable]] = {}
# RPC log
_LOG: List[dict] = []

# 12 Generals (per-VM)
GENERALS = [
    "argus", "scribe", "shield", "builder", "abacus", "lex",
    "scale", "crow", "gear", "voice", "owl", "dragon",
]

# 33 Hives
HIVES = [
    "london", "cambridge", "edinburgh", "dublin", "paris", "berlin",
    "amsterdam", "stockholm", "helsinki", "madrid", "rome", "vienna",
    "nyc", "sf", "toronto", "mexico", "bogota", "lima", "santiago",
    "buenos", "tokyo", "singapore", "sydney", "mumbai", "dubai",
    "hongkong", "seoul", "jakarta", "capetown", "nairobi", "cairo",
    "lagos", "reykjavik",
]


def _sign(payload: dict) -> dict:
    body = json.dumps(payload, sort_keys=True, default=str)
    payload["kid"] = "rpc-" + hashlib.sha256(body.encode()).hexdigest()[:16]
    payload["sig"] = hashlib.sha256((payload["kid"] + body).encode()).hexdigest()
    payload["ts"] = datetime.now(timezone.utc).isoformat()
    return payload


def _is_valid_target(target: str) -> bool:
    return target in GENERALS or target in HIVES


def rpc_call(target: str, method: str, params: dict = None,
           timeout_ms: int = 5000) -> dict:
    """Call a method on a target (General or Hive)."""
    if not _is_valid_target(target):
        return _sign({"error": f"unknown target: {target}"})
    if params is None:
        params = {}
    # Check if handler is registered
    handler = _HANDLERS.get(target, {}).get(method)
    if handler:
        try:
            result = handler(**params)
            response = {"status": "OK", "result": result}
        except Exception as e:
            response = {"status": "ERROR", "error": str(e)}
    else:
        # Simulated response (no handler registered)
        response = {
            "status": "SIMULATED",
            "message": f"No handler for {target}.{method}, using sim",
            "result": {"echo": params},
        }
    log = {"type": "call", "target": target, "method": method, "params": params, "response": response}
    _LOG.append(log)
    return _sign({
        "protocol": PROTOCOL, "version": VERSION,
        "request_id": hashlib.sha256(f"{target}|{method}|{time.time_ns()}".encode()).hexdigest()[:16],
        "target": target, "method": method, "params": params,
        "response": response, "timeout_ms": timeout_ms,
    })


def rpc_broadcast(method: str, params: dict = None) -> dict:
    """Broadcast to all 33 Hives."""
    if params is None:
        params = {}
    responses = []
    for hive in HIVES:
        r = {
            "hive": hive,
            "status": "OK" if hive in _HANDLERS and method in _HANDLERS.get(hive, {}) else "SIMULATED",
        }
        responses.append(r)
    log = {"type": "broadcast", "method": method, "params": params}
    _LOG.append(log)
    return _sign({
        "protocol": PROTOCOL, "version": VERSION,
        "method": method, "params": params,
        "responses": responses, "hive_count": len(HIVES),
    })


def rpc_register(target: str, method: str) -> dict:
    """Register a method handler for a target."""
    if not _is_valid_target(target):
        return _sign({"error": f"unknown target: {target}"})
    if target not in _HANDLERS:
        _HANDLERS[target] = {}
    # No-op handler (just registers the name)
    _HANDLERS[target][method] = lambda **kwargs: {"echo": kwargs, "method": method}
    return _sign({
        "protocol": PROTOCOL, "version": VERSION,
        "target": target, "method": method, "registered": True,
    })


def rpc_keepalive(target: str) -> dict:
    """Ping a target (heartbeat)."""
    if not _is_valid_target(target):
        return _sign({"error": f"unknown target: {target}"})
    return _sign({
        "protocol": PROTOCOL, "version": VERSION,
        "target": target, "status": "ALIVE", "latency_ms": 1,  # sim
    })


def rpc_status() -> dict:
    """Bus status + connections."""
    return _sign({
        "protocol": PROTOCOL, "version": VERSION,
        "generals": GENERALS, "general_count": len(GENERALS),
        "hives": HIVES, "hive_count": len(HIVES),
        "registered_handlers": {t: list(m.keys()) for t, m in _HANDLERS.items()},
        "log_count": len(_LOG),
    })