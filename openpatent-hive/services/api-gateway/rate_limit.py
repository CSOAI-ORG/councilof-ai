#!/usr/bin/env python3
"""
Per-DID sliding-window rate limiter for the api-gateway.

Design:
  - In-memory sliding window with per-DID deques of timestamps.
  - 100 req/min for free-tier DIDs, 1000 req/min for premium-tier DIDs.
  - Sets X-RateLimit-Limit / X-RateLimit-Remaining / X-RateLimit-Reset on
    every response (including 429s).
  - Redis-fallback-ready: if REDIS_URL is set, attempts to use Redis
    INCR with EXPIRE; falls back to in-memory on any failure.

This module exports:
  - `RateLimiter`     — the core limiter (can be used without FastAPI)
  - `RateLimitMiddleware` — Starlette/FastAPI middleware wrapper
  - `check_rate_limit(did, tier)` — helper for manual checks
  - `TIER_LIMITS`     — the limit map (overridable via env)
"""

import os
import time
import threading
from collections import deque
from dataclasses import dataclass
from typing import Deque, Dict, Optional, Tuple

# Tier → requests per minute
TIER_LIMITS: Dict[str, int] = {
    "free": int(os.environ.get("RATE_LIMIT_FREE", "100")),
    "starter": int(os.environ.get("RATE_LIMIT_STARTER", "200")),
    "defensive": int(os.environ.get("RATE_LIMIT_DEFENSIVE", "500")),
    "full": int(os.environ.get("RATE_LIMIT_FULL", "750")),
    "premium": int(os.environ.get("RATE_LIMIT_PREMIUM", "1000")),
    "enterprise": int(os.environ.get("RATE_LIMIT_ENTERPRISE", "5000")),
}

# 60s window
WINDOW_SECONDS = 60


@dataclass
class RateLimitDecision:
    allowed: bool
    limit: int
    remaining: int
    reset_unix: int          # unix seconds when oldest entry leaves the window
    retry_after_seconds: int  # for 429s

    def to_headers(self) -> Dict[str, str]:
        return {
            "X-RateLimit-Limit": str(self.limit),
            "X-RateLimit-Remaining": str(max(0, self.remaining)),
            "X-RateLimit-Reset": str(self.reset_unix),
            "X-RateLimit-Policy": f"{self.limit};w={WINDOW_SECONDS}",
        }


class RateLimiter:
    """Thread-safe sliding-window limiter with optional Redis backend."""

    def __init__(self, tier_limits: Optional[Dict[str, int]] = None):
        self.tier_limits = dict(tier_limits or TIER_LIMITS)
        self._buckets: Dict[str, Deque[float]] = {}
        self._lock = threading.Lock()
        self._redis = None
        self._redis_checked = False
        redis_url = os.environ.get("REDIS_URL")
        if redis_url:
            self._init_redis(redis_url)

    def _init_redis(self, url: str) -> None:
        try:
            import redis  # type: ignore
            self._redis = redis.Redis.from_url(url, decode_responses=True)
            # ping to validate
            self._redis.ping()
        except Exception:
            self._redis = None  # fall back to in-memory

    @property
    def backend(self) -> str:
        return "redis" if self._redis is not None else "memory"

    def _tier_for(self, did: str, declared_tier: Optional[str] = None) -> str:
        if declared_tier and declared_tier in self.tier_limits:
            return declared_tier
        # Heuristic: DIDs starting with `did:web:` are typically premium.
        # DIDs starting with `did:key:` are free-tier by default.
        if did.startswith("did:web:") or did.startswith("did:csoai:"):
            return "premium"
        return "free"

    def _limit_for(self, tier: str) -> int:
        return self.tier_limits.get(tier, self.tier_limits.get("free", 100))

    def _decide_memory(
        self, did: str, tier: str, now: float
    ) -> RateLimitDecision:
        limit = self._limit_for(tier)
        cutoff = now - WINDOW_SECONDS
        with self._lock:
            bucket = self._buckets.setdefault(did, deque())
            # Evict expired entries
            while bucket and bucket[0] <= cutoff:
                bucket.popleft()
            used = len(bucket)
            if used >= limit:
                oldest = bucket[0]
                reset_unix = int(oldest + WINDOW_SECONDS)
                retry = max(1, int((oldest + WINDOW_SECONDS) - now))
                return RateLimitDecision(
                    allowed=False,
                    limit=limit,
                    remaining=0,
                    reset_unix=reset_unix,
                    retry_after_seconds=retry,
                )
            bucket.append(now)
            # Reset = when the oldest entry will expire
            if bucket:
                reset_unix = int(bucket[0] + WINDOW_SECONDS)
            else:
                reset_unix = int(now + WINDOW_SECONDS)
            return RateLimitDecision(
                allowed=True,
                limit=limit,
                remaining=limit - used - 1,
                reset_unix=reset_unix,
                retry_after_seconds=0,
            )

    def _decide_redis(
        self, did: str, tier: str, now: float
    ) -> Optional[RateLimitDecision]:
        """Redis-based fixed-window fallback. Returns None on failure."""
        if self._redis is None:
            return None
        try:
            limit = self._limit_for(tier)
            # 60-second bucket
            window_id = int(now // WINDOW_SECONDS)
            key = f"rl:{tier}:{did}:{window_id}"
            pipe = self._redis.pipeline()
            pipe.incr(key)
            pipe.expire(key, WINDOW_SECONDS + 1)
            count, _ = pipe.execute()
            count = int(count)
            remaining = max(0, limit - count)
            reset_unix = (window_id + 1) * WINDOW_SECONDS
            if count > limit:
                retry = max(1, reset_unix - int(now))
                return RateLimitDecision(
                    allowed=False, limit=limit, remaining=0,
                    reset_unix=reset_unix, retry_after_seconds=retry,
                )
            return RateLimitDecision(
                allowed=True, limit=limit, remaining=remaining,
                reset_unix=reset_unix, retry_after_seconds=0,
            )
        except Exception:
            return None

    def check(
        self,
        did: str,
        declared_tier: Optional[str] = None,
    ) -> RateLimitDecision:
        """Check (and atomically consume) one request slot for `did`."""
        now = time.time()
        tier = self._tier_for(did, declared_tier)
        if self._redis is not None:
            decision = self._decide_redis(did, tier, now)
            if decision is not None:
                return decision
        return self._decide_memory(did, tier, now)

    def peek(self, did: str, declared_tier: Optional[str] = None) -> RateLimitDecision:
        """Peek at the current state WITHOUT consuming a slot."""
        now = time.time()
        tier = self._tier_for(did, declared_tier)
        limit = self._limit_for(tier)
        with self._lock:
            bucket = self._buckets.get(did, deque())
            cutoff = now - WINDOW_SECONDS
            used = sum(1 for ts in bucket if ts > cutoff)
        return RateLimitDecision(
            allowed=used < limit,
            limit=limit,
            remaining=max(0, limit - used),
            reset_unix=int(now + WINDOW_SECONDS),
            retry_after_seconds=0,
        )


# ── Module-level singleton (overridable in tests) ───────────────────────────

_DEFAULT_LIMITER: Optional[RateLimiter] = None
_DEFAULT_LOCK = threading.Lock()


def get_default_limiter() -> RateLimiter:
    global _DEFAULT_LIMITER
    if _DEFAULT_LIMITER is None:
        with _DEFAULT_LOCK:
            if _DEFAULT_LIMITER is None:
                _DEFAULT_LIMITER = RateLimiter()
    return _DEFAULT_LIMITER


def set_default_limiter(limiter: RateLimiter) -> None:
    global _DEFAULT_LIMITER
    _DEFAULT_LIMITER = limiter


def check_rate_limit(did: str, tier: Optional[str] = None) -> RateLimitDecision:
    return get_default_limiter().check(did, tier)


# ── FastAPI / Starlette middleware ───────────────────────────────────────────


def _resolve_did(request) -> Tuple[str, Optional[str]]:
    """Pull the DID + tier from request headers (set by an upstream auth
    layer in the api-gateway) or fall back to client IP."""
    did = (
        request.headers.get("X-Inventor-DID")
        or request.headers.get("X-Hive-DID")
        or request.headers.get("X-Forwarded-For", "").split(",")[0].strip()
        or (request.client.host if request.client else "anonymous")
    )
    tier = request.headers.get("X-Pricing-Tier")
    return did, tier


class RateLimitMiddleware:
    """ASGI middleware that applies the rate limit and sets headers.

    Usage:
        from rate_limit import RateLimitMiddleware
        app.add_middleware(RateLimitMiddleware)
    """

    def __init__(self, app, limiter: Optional[RateLimiter] = None):
        self.app = app
        self.limiter = limiter or get_default_limiter()

    async def __call__(self, scope, receive, send):
        if scope["type"] != "http":
            # WebSocket / lifespan — let through
            return await self.app(scope, receive, send)

        # Build a minimal request-like object from the ASGI scope
        from starlette.requests import Request  # type: ignore
        request = Request(scope, receive)

        # Health/metrics/introspection should never be rate-limited
        path = scope.get("path", "")
        if path in (
            "/health", "/metrics", "/v1/traces",
            "/openapi.json", "/docs", "/docs/oauth2-redirect", "/redoc",
        ):
            return await self.app(scope, receive, send)

        did, tier = _resolve_did(request)
        decision = self.limiter.check(did, tier)

        if not decision.allowed:
            # Build 429 response with rate-limit headers
            from starlette.responses import JSONResponse  # type: ignore
            response = JSONResponse(
                status_code=429,
                content={
                    "error": "rate_limited",
                    "did": did,
                    "tier": tier or "free",
                    "limit": decision.limit,
                    "window_seconds": WINDOW_SECONDS,
                    "retry_after_seconds": decision.retry_after_seconds,
                },
            )
            for k, v in decision.to_headers().items():
                response.headers[k] = v
            response.headers["Retry-After"] = str(decision.retry_after_seconds)
            await response(scope, receive, send)
            return

        # Wrap send() to inject headers into the response
        async def send_with_headers(message):
            if message["type"] == "http.response.start":
                headers = list(message.get("headers", []))
                for k, v in decision.to_headers().items():
                    headers.append((k.lower().encode("latin-1"), v.encode("latin-1")))
                message["headers"] = headers
            await send(message)

        return await self.app(scope, receive, send_with_headers)


# ── CLI / diagnostics ────────────────────────────────────────────────────────


def _cli_status() -> None:
    """Print backend + limits to stdout."""
    limiter = get_default_limiter()
    import json
    sys = __import__("sys")
    sys.stdout.write(
        json.dumps(
            {
                "backend": limiter.backend,
                "tier_limits": limiter.tier_limits,
                "window_seconds": WINDOW_SECONDS,
            },
            indent=2,
        )
    )
    sys.stdout.write("\n")


if __name__ == "__main__":
    import sys
    if len(sys.argv) > 1 and sys.argv[1] == "status":
        _cli_status()
    else:
        sys.stdout.write("usage: rate_limit.py status\n")
        sys.exit(1)
