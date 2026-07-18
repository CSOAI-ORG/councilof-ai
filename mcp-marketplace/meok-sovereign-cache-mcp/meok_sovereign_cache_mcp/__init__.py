"""meok-sovereign-cache-mcp — Sovereign Cache Layer.

In-memory cache with LRU eviction + TTL.
Sovereign by construction.

5 tools:
  1. cache_set      - set a key with optional TTL
  2. cache_get      - get a key (auto-eviction + TTL check)
  3. cache_delete   - delete a key
  4. cache_invalidate - invalidate by prefix
  5. cache_status   - get cache status
"""
from __future__ import annotations
import json
import hashlib
import random
import string
import time
from datetime import datetime, timezone

PROTOCOL = "sovereign-cache/1.0"
VERSION = "1.0.0"
LICENSE = "MIT + CC0 1.0"

# Cache: dict (ordered for LRU)
_CACHE = {}  # key -> {value, expires_at, hits, last_accessed}
_HITS = 0
_MISSES = 0
MAX_CACHE_SIZE = 1000


def _sign(payload):
    body = json.dumps(payload, sort_keys=True, default=str)
    payload["kid"] = "cache-" + hashlib.sha256(body.encode()).hexdigest()[:16]
    payload["sig"] = hashlib.sha256((payload["kid"] + body).encode()).hexdigest()[:16]
    payload["ts"] = datetime.now(timezone.utc).isoformat()
    return payload


def _evict_lru():
    """Evict least-recently-used entry."""
    if len(_CACHE) < MAX_CACHE_SIZE:
        return
    lru_key = min(_CACHE.keys(), key=lambda k: _CACHE[k].get("last_accessed", 0))
    del _CACHE[lru_key]


def _is_expired(entry):
    return entry.get("expires_at") and entry["expires_at"] < time.time()


def cache_set(key: str = "", value: str = "", ttl_seconds: int = 0) -> dict:
    """Set a key with optional TTL."""
    if not key:
        return _sign({"error": "key required"})
    _evict_lru()
    _CACHE[key] = {
        "value": value,
        "expires_at": time.time() + ttl_seconds if ttl_seconds > 0 else None,
        "hits": 0,
        "last_accessed": time.time(),
        "created_at": time.time(),
    }
    return _sign({
        "protocol": PROTOCOL, "version": VERSION,
        "key": key,
        "ttl_seconds": ttl_seconds,
        "size": len(_CACHE),
        "doctrine": f"Cache set: {key}. Sovereign by construction.",
    })


def cache_get(key: str = "") -> dict:
    """Get a key."""
    global _HITS, _MISSES
    if not key:
        return _sign({"error": "key required"})
    if key not in _CACHE:
        _MISSES += 1
        return _sign({"hit": False, "key": key, "doctrine": "Cache miss. Sovereign."})
    entry = _CACHE[key]
    if _is_expired(entry):
        del _CACHE[key]
        _MISSES += 1
        return _sign({"hit": False, "key": key, "doctrine": "Cache miss (expired). Sovereign."})
    entry["hits"] += 1
    entry["last_accessed"] = time.time()
    _HITS += 1
    return _sign({
        "protocol": PROTOCOL, "version": VERSION,
        "hit": True,
        "key": key,
        "value": entry["value"],
        "hits": entry["hits"],
        "doctrine": "Cache hit. Sovereign.",
    })


def cache_delete(key: str = "") -> dict:
    """Delete a key."""
    if not key:
        return _sign({"error": "key required"})
    if key in _CACHE:
        del _CACHE[key]
        return _sign({"protocol": PROTOCOL, "version": VERSION, "key": key, "deleted": True, "doctrine": "Cache deleted. Sovereign."})
    return _sign({"protocol": PROTOCOL, "version": VERSION, "key": key, "deleted": False, "doctrine": "Key not found."})


def cache_invalidate(prefix: str = "") -> dict:
    """Invalidate by prefix."""
    if not prefix:
        return _sign({"error": "prefix required"})
    keys_to_remove = [k for k in _CACHE if k.startswith(prefix)]
    for k in keys_to_remove:
        del _CACHE[k]
    return _sign({
        "protocol": PROTOCOL, "version": VERSION,
        "prefix": prefix,
        "invalidated": len(keys_to_remove),
        "doctrine": f"Invalidated {len(keys_to_remove)} keys. Sovereign.",
    })


def cache_status() -> dict:
    """Get cache status."""
    hit_rate = (_HITS / (_HITS + _MISSES) * 100) if (_HITS + _MISSES) > 0 else 0
    return _sign({
        "protocol": PROTOCOL, "version": LICENSE,
        "total_keys": len(_CACHE),
        "max_size": MAX_CACHE_SIZE,
        "utilization": round(len(_CACHE) / MAX_CACHE_SIZE * 100, 2),
        "hits": _HITS,
        "misses": _MISSES,
        "hit_rate": round(hit_rate, 2),
        "doctrine": f"Sovereign cache: {len(_CACHE)}/{MAX_CACHE_SIZE} keys, {hit_rate:.1f}% hit rate. Care Floor 0.95.",
    })