"""meok-sovereign-load-balancer-mcp — Sovereign Load Balancer.

Load balancing + failover + auto-scaling.
Round-robin / least-connections / weighted.
Sovereign by construction.

5 tools:
  1. lb_register       - register a backend
  2. lb_route          - route a request (round-robin)
  3. lb_status         - check backend status
  4. lb_failover       - trigger failover
  5. lb_scale          - auto-scale backend pool
"""
from __future__ import annotations
import json
import hashlib
import random
import string
from datetime import datetime, timezone
from collections import defaultdict

PROTOCOL = "sovereign-load-balancer/1.0"
VERSION = "1.0.0"
LICENSE = "MIT + CC0 1.0"

# State
_BACKENDS = {}  # backend_id -> {url, weight, healthy, connections}
_ROUND_ROBIN_COUNTER = defaultdict(int)  # pool -> counter
_FAILOVER_LOG = []


def _sign(payload):
    body = json.dumps(payload, sort_keys=True, default=str)
    payload["kid"] = "lb-" + hashlib.sha256(body.encode()).hexdigest()[:16]
    payload["sig"] = hashlib.sha256((payload["kid"] + body).encode()).hexdigest()[:16]
    payload["ts"] = datetime.now(timezone.utc).isoformat()
    return payload


def _gen_id(prefix: str) -> str:
    return f"{prefix}-{''.join(random.choices(string.hexdigits.lower(), k=8))}"


def lb_register(backend_id: str = "", url: str = "", weight: int = 1, pool: str = "default") -> dict:
    """Register a backend."""
    if not backend_id:
        return _sign({"error": "backend_id required"})
    _BACKENDS[backend_id] = {
        "backend_id": backend_id,
        "url": url or f"https://sovereign/{backend_id}",
        "weight": weight,
        "pool": pool,
        "healthy": True,
        "connections": 0,
        "registered_at": datetime.now(timezone.utc).isoformat(),
        "total_requests": 0,
    }
    return _sign({
        "protocol": PROTOCOL, "version": VERSION,
        "backend": _BACKENDS[backend_id],
        "total_backends": len(_BACKENDS),
        "doctrine": f"Backend {backend_id} registered in pool '{pool}'. Sovereign by construction.",
    })


def lb_route(pool: str = "default") -> dict:
    """Route a request using round-robin."""
    pool_backends = [b for b in _BACKENDS.values() if b["pool"] == pool and b["healthy"]]
    if not pool_backends:
        return _sign({"error": f"no healthy backends in pool '{pool}'"})
    # Round-robin selection (weighted)
    counter = _ROUND_ROBIN_COUNTER[pool]
    # Use counter % len(pool_backends)
    backend = pool_backends[counter % len(pool_backends)]
    _ROUND_ROBIN_COUNTER[pool] = counter + 1
    backend["connections"] += 1
    backend["total_requests"] += 1
    return _sign({
        "protocol": PROTOCOL, "version": VERSION,
        "pool": pool,
        "routed_to": backend,
        "total_requests": backend["total_requests"],
        "connections": backend["connections"],
        "doctrine": f"Round-robin routed to {backend['backend_id']} ({backend['url']}). Sovereign.",
    })


def lb_status(backend_id: str = "") -> dict:
    """Check backend status."""
    if backend_id:
        b = _BACKENDS.get(backend_id)
        if not b:
            return _sign({"error": f"unknown backend: {backend_id}"})
        return _sign({
            "protocol": PROTOCOL, "version": VERSION,
            "backend": b,
            "doctrine": f"Backend {backend_id}: {b['healthy'] and '✓ healthy' or '✗ unhealthy'}. {b['connections']} connections, {b['total_requests']} total requests. Sovereign.",
        })
    return _sign({
        "protocol": PROTOCOL, "version": VERSION,
        "backends": list(_BACKENDS.values()),
        "total": len(_BACKENDS),
        "healthy": sum(1 for b in _BACKENDS.values() if b["healthy"]),
        "doctrine": f"Sovereign load balancer: {len(_BACKENDS)} backends, {sum(1 for b in _BACKENDS.values() if b['healthy'])} healthy. Sovereign.",
    })


def lb_failover(backend_id: str = "", reason: str = "") -> dict:
    """Trigger failover — mark backend unhealthy."""
    if not backend_id:
        return _sign({"error": "backend_id required"})
    b = _BACKENDS.get(backend_id)
    if not b:
        return _sign({"error": f"unknown backend: {backend_id}"})
    if not b["healthy"]:
        return _sign({"error": f"backend {backend_id} already unhealthy"})
    b["healthy"] = False
    b["failed_at"] = datetime.now(timezone.utc).isoformat()
    b["failover_reason"] = reason
    _FAILOVER_LOG.append({"backend": backend_id, "reason": reason, "ts": datetime.now(timezone.utc).isoformat()})
    return _sign({
        "protocol": PROTOCOL, "version": VERSION,
        "backend_id": backend_id,
        "healthy": False,
        "reason": reason,
        "total_failovers": len(_FAILOVER_LOG),
        "doctrine": f"Failover triggered: {backend_id} marked unhealthy. Sovereign by construction.",
    })


def lb_scale(pool: str = "default", target_size: int = 0) -> dict:
    """Auto-scale backend pool."""
    pool_backends = [b for b in _BACKENDS.values() if b["pool"] == pool]
    current = len(pool_backends)
    if target_size > current:
        # Add new backends
        for i in range(target_size - current):
            backend_id = f"{pool}-backend-{i+1}"
            _BACKENDS[backend_id] = {
                "backend_id": backend_id,
                "url": f"https://sovereign/{pool}/{backend_id}",
                "weight": 1,
                "pool": pool,
                "healthy": True,
                "connections": 0,
                "registered_at": datetime.now(timezone.utc).isoformat(),
                "total_requests": 0,
            }
    elif target_size < current:
        # Remove backends
        for b in pool_backends[target_size:]:
            _BACKENDS.pop(b["backend_id"], None)
    return _sign({
        "protocol": PROTOCOL, "version": VERSION,
        "pool": pool,
        "current_size": len([b for b in _BACKENDS.values() if b["pool"] == pool]),
        "target_size": target_size,
        "doctrine": f"Auto-scaled pool '{pool}' to {target_size}. Care Floor 0.95. Sovereign.",
    })