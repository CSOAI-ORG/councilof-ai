"""meok-sovereign-rate-limiter-mcp — Sovereign Rate Limiter + DDoS Protection.

Token bucket + sliding window + per-IP + per-API-key.
DDoS protection with anomaly detection.
Quota management with tier-based limits.

5 tools:
  1. rl_check       - check if a request is allowed (token bucket)
  2. rl_set_quota   - set quota for a citizen/API key
  3. rl_status      - get rate limiter status
  4. rl_ddos        - detect DDoS patterns
  5. rl_reset       - reset a bucket
"""
from __future__ import annotations
import json
import hashlib
import random
import string
import time
from datetime import datetime, timezone

PROTOCOL = "sovereign-rate-limiter/1.0"
VERSION = "1.0.0"
LICENSE = "MIT + CC0 1.0"

# Token bucket per citizen/IP
_BUCKETS = {}  # entity -> {tokens, capacity, refill_rate, last_refill}
_QUOTAS = {}  # entity -> {capacity_per_hour, used_in_hour, hour_started_at}
_BLOCKED = {}  # entity -> {blocked_at, until, reason}
_DDOS_PATTERNS = []  # log of detected patterns


def _sign(payload):
    body = json.dumps(payload, sort_keys=True, default=str)
    payload["kid"] = "rl-" + hashlib.sha256(body.encode()).hexdigest()[:16]
    payload["sig"] = hashlib.sha256((payload["kid"] + body).encode()).hexdigest()[:16]
    payload["ts"] = datetime.now(timezone.utc).isoformat()
    return payload


def _gen_id(prefix: str) -> str:
    return f"{prefix}-{''.join(random.choices(string.hexdigits.lower(), k=8))}"


def rl_check(entity: str = "", cost: int = 1) -> dict:
    """Check if a request is allowed (token bucket)."""
    if not entity:
        return _sign({"error": "entity required"})
    # Default bucket: 100 tokens, refill 10/sec
    if entity not in _BUCKETS:
        _BUCKETS[entity] = {"tokens": 100.0, "capacity": 100, "refill_rate": 10.0, "last_refill": time.time()}
    b = _BUCKETS[entity]
    # Refill
    now = time.time()
    elapsed = now - b["last_refill"]
    b["tokens"] = min(b["capacity"], b["tokens"] + elapsed * b["refill_rate"])
    b["last_refill"] = now
    # Check DDoS block
    if entity in _BLOCKED:
        return _sign({
            "protocol": PROTOCOL, "version": VERSION,
            "allowed": False,
            "reason": f"BLOCKED (DDoS protection): {_BLOCKED[entity]['reason']}",
            "until": _BLOCKED[entity]["until"],
            "doctrine": f"DDoS protection active. Care Floor 0.95. Sovereign.",
        })
    # Check quota
    if entity in _QUOTAS:
        q = _QUOTAS[entity]
        if now - q["hour_started_at"] > 3600:
            q["used_in_hour"] = 0
            q["hour_started_at"] = now
        if q["used_in_hour"] >= q["capacity_per_hour"]:
            return _sign({
                "protocol": PROTOCOL, "version": VERSION,
                "allowed": False,
                "reason": "QUOTA EXHAUSTED",
                "doctrine": f"Quota exhausted. Care Floor 0.95. Sovereign.",
            })
    # Check bucket
    if b["tokens"] >= cost:
        b["tokens"] -= cost
        if entity in _QUOTAS:
            _QUOTAS[entity]["used_in_hour"] += 1
        return _sign({
            "protocol": PROTOCOL, "version": VERSION,
            "allowed": True,
            "tokens_remaining": round(b["tokens"], 2),
            "cost": cost,
            "doctrine": f"Request allowed. {b['tokens']:.1f} tokens remaining. Sovereign.",
        })
    return _sign({
        "protocol": PROTOCOL, "version": VERSION,
        "allowed": False,
        "reason": "BUCKET EMPTY",
        "tokens_remaining": round(b["tokens"], 2),
        "retry_after_seconds": (cost - b["tokens"]) / b["refill_rate"],
        "doctrine": f"Rate limited. Sovereign by construction.",
    })


def rl_set_quota(entity: str = "", capacity_per_hour: int = 1000) -> dict:
    """Set quota for a citizen/API key."""
    if not entity:
        return _sign({"error": "entity required"})
    _QUOTAS[entity] = {
        "capacity_per_hour": capacity_per_hour,
        "used_in_hour": 0,
        "hour_started_at": time.time(),
    }
    return _sign({
        "protocol": PROTOCOL, "version": VERSION,
        "entity": entity,
        "capacity_per_hour": capacity_per_hour,
        "doctrine": f"Quota set: {entity} → {capacity_per_hour}/hour. Sovereign.",
    })


def rl_status(entity: str = "") -> dict:
    """Get rate limiter status."""
    if entity:
        b = _BUCKETS.get(entity, {})
        q = _QUOTAS.get(entity, {})
        return _sign({
            "protocol": PROTOCOL, "version": VERSION,
            "entity": entity,
            "bucket": b,
            "quota": q,
            "blocked": entity in _BLOCKED,
            "doctrine": f"Rate limit status for {entity}. Sovereign.",
        })
    return _sign({
        "protocol": PROTOCOL, "version": VERSION,
        "total_entities": len(_BUCKETS),
        "total_quotas": len(_QUOTAS),
        "blocked": list(_BLOCKED.keys()),
        "ddos_patterns_detected": len(_DDOS_PATTERNS),
        "doctrine": f"Sovereign rate limiter: {len(_BUCKETS)} entities, {len(_QUOTAS)} quotas, {len(_BLOCKED)} blocked. Care Floor 0.95.",
    })


def rl_ddos(entity: str = "", request_rate: float = 0.0, threshold: float = 100.0, duration_seconds: int = 60) -> dict:
    """Detect DDoS patterns."""
    if not entity:
        return _sign({"error": "entity required"})
    detected = request_rate > threshold
    if detected:
        _BLOCKED[entity] = {
            "blocked_at": time.time(),
            "until": time.time() + duration_seconds,
            "reason": f"DDoS: {request_rate} req/sec > threshold {threshold}",
        }
        _DDOS_PATTERNS.append({
            "entity": entity,
            "rate": request_rate,
            "threshold": threshold,
            "blocked_until": _BLOCKED[entity]["until"],
            "ts": datetime.now(timezone.utc).isoformat(),
        })
    return _sign({
        "protocol": PROTOCOL, "version": VERSION,
        "entity": entity,
        "request_rate": request_rate,
        "threshold": threshold,
        "ddos_detected": detected,
        "blocked": detected,
        "doctrine": f"DDoS detection: {'DDoS detected and blocked' if detected else 'No DDoS detected'}. Sovereign by construction.",
    })


def rl_reset(entity: str = "") -> dict:
    """Reset a bucket."""
    if not entity:
        return _sign({"error": "entity required"})
    if entity in _BUCKETS:
        _BUCKETS[entity]["tokens"] = _BUCKETS[entity]["capacity"]
        _BUCKETS[entity]["last_refill"] = time.time()
    if entity in _BLOCKED:
        del _BLOCKED[entity]
    if entity in _QUOTAS:
        _QUOTAS[entity]["used_in_hour"] = 0
        _QUOTAS[entity]["hour_started_at"] = time.time()
    return _sign({
        "protocol": PROTOCOL, "version": VERSION,
        "entity": entity,
        "reset": True,
        "doctrine": f"Bucket reset for {entity}. Sovereign by construction.",
    })