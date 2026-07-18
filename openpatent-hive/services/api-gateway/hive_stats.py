#!/usr/bin/env python3
"""
Hive-wide /v1/stats endpoint for the api-gateway.

Aggregates live health from all 9 hive services in parallel and returns
a single JSON document describing the state of the openpatent.ai swarm.

Services polled (per the spec):
  1. patentmcp     — 6-layer disclosure engine         (port 3210)
  2. api-gateway   — public REST entry                 (port 3211)
  3. worker        — async disclosure + BFT queue     (port 3212)
  4. bft-council   — 33-agent Byzantine review         (port 3215)
  5. x402          — payment router (60/25/15)         (port 3214)
  6. drafting-fork — AI claim drafting                  (port 3216)
  7. primitives    — sovereign primitives service      (port 3217)
  8. verify-page   — public attestation page            (port 3213)
  9. mcp-manifest  — .well-known/mcp.json              (port 3219)

The endpoint is mounted by the gateway via:
    from hive_stats import mount_stats
    mount_stats(app)
"""

import os
import time
import asyncio
from dataclasses import dataclass, field, asdict
from typing import Any, Dict, List, Optional

import httpx
from fastapi import FastAPI
from fastapi.responses import JSONResponse


HIVE_VERSION = "1.0.0"
HIVE_NAME = "openpatent"

# Service registry. `health_path` is what we GET; `display` is the public
# service name; `critical` means the service is in the hot path.
SERVICES: List[Dict[str, Any]] = [
    {
        "name": "patentmcp",
        "display": "PatentMCP (6-layer core)",
        "url_env": "PATENTMCP_URL",
        "default_url": "http://patentmcp:3210",
        "health_path": "/health",
        "critical": True,
    },
    {
        "name": "api-gateway",
        "display": "API Gateway",
        "url_env": "API_GATEWAY_URL",
        "default_url": "http://api-gateway:3211",
        "health_path": "/health",
        "critical": True,
        "self_ref": True,
    },
    {
        "name": "worker",
        "display": "Disclosure + BFT Worker",
        "url_env": "WORKER_URL",
        "default_url": "http://worker:3212",
        "health_path": "/health",
        "critical": True,
    },
    {
        "name": "bft-council",
        "display": "BFT Council (33 agents)",
        "url_env": "BFT_URL",
        "default_url": "http://bft-council:3215",
        "health_path": "/health",
        "critical": False,
    },
    {
        "name": "x402",
        "display": "x402 Payment Router",
        "url_env": "X402_URL",
        "default_url": "http://x402-router:3214",
        "health_path": "/health",
        "critical": False,
    },
    {
        "name": "drafting-fork",
        "display": "AI Drafting Fork",
        "url_env": "DRAFTING_URL",
        "default_url": "http://drafting-fork:3216",
        "health_path": "/health",
        "critical": False,
    },
    {
        "name": "primitives",
        "display": "Sovereign Primitives",
        "url_env": "PRIMITIVES_URL",
        "default_url": "http://primitives:3217",
        "health_path": "/health",
        "critical": False,
    },
    {
        "name": "verify-page",
        "display": "Verify Page",
        "url_env": "VERIFY_URL",
        "default_url": "http://verify-page:3213",
        "health_path": "/health",
        "critical": False,
    },
    {
        "name": "mcp-manifest",
        "display": "MCP Manifest",
        "url_env": "MCP_MANIFEST_URL",
        "default_url": "http://mcp-manifest:3219",
        "health_path": "/health",
        "critical": False,
    },
]


@dataclass
class ServiceHealth:
    name: str
    display: str
    url: str
    critical: bool
    status: str = "unknown"      # healthy | degraded | down | unknown | skipped
    latency_ms: Optional[float] = None
    http_status: Optional[int] = None
    detail: Optional[Dict[str, Any]] = None
    error: Optional[str] = None
    checked_at_unix: float = field(default_factory=time.time)

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


def _resolve_url(svc: Dict[str, Any]) -> str:
    base_raw = os.environ.get(svc["url_env"], svc["default_url"])
    base = (base_raw or svc["default_url"]).rstrip("/")
    return f"{base}{svc['health_path']}"


async def _check_one(
    client: httpx.AsyncClient,
    svc: Dict[str, Any],
    skip_self: bool = False,
) -> ServiceHealth:
    url = _resolve_url(svc)
    health = ServiceHealth(
        name=svc["name"],
        display=svc["display"],
        url=url,
        critical=svc["critical"],
    )
    if skip_self and svc.get("self_ref"):
        health.status = "skipped"
        health.detail = {"reason": "self reference — caller already on this service"}
        return health
    start = time.time()
    try:
        r = await client.get(url, timeout=3.0)
        elapsed = (time.time() - start) * 1000.0
        health.latency_ms = round(elapsed, 2)
        health.http_status = r.status_code
        if 200 <= r.status_code < 300:
            health.status = "healthy"
            try:
                health.detail = r.json()
            except Exception:
                health.detail = {"raw": r.text[:200]}
        elif 300 <= r.status_code < 500:
            health.status = "degraded"
            health.detail = {"http_status": r.status_code}
        else:
            health.status = "down"
            health.error = f"HTTP {r.status_code}"
    except httpx.TimeoutException:
        health.latency_ms = round((time.time() - start) * 1000.0, 2)
        health.status = "down"
        health.error = "timeout"
    except Exception as e:
        health.latency_ms = round((time.time() - start) * 1000.0, 2)
        health.status = "down"
        health.error = f"{type(e).__name__}: {e}"
    return health


async def collect_hive_health(skip_self: bool = False) -> Dict[str, Any]:
    """Probe all 9 services in parallel and return an aggregate report."""
    async with httpx.AsyncClient() as client:
        results: List[ServiceHealth] = await asyncio.gather(
            *[_check_one(client, svc, skip_self=skip_self) for svc in SERVICES]
        )

    by_status: Dict[str, int] = {}
    for r in results:
        by_status[r.status] = by_status.get(r.status, 0) + 1

    critical_down = [r.name for r in results if r.critical and r.status == "down"]
    noncritical_down = [r.name for r in results if (not r.critical) and r.status == "down"]

    if critical_down:
        overall = "down"
    elif any(r.status == "degraded" for r in results if r.critical) or noncritical_down:
        overall = "degraded"
    elif all(r.status in ("healthy", "skipped") for r in results):
        overall = "healthy"
    else:
        overall = "degraded"

    return {
        "hive": HIVE_NAME,
        "version": HIVE_VERSION,
        "overall": overall,
        "checked_at_unix": time.time(),
        "services_total": len(results),
        "services_healthy": by_status.get("healthy", 0),
        "services_degraded": by_status.get("degraded", 0),
        "services_down": by_status.get("down", 0),
        "services_skipped": by_status.get("skipped", 0),
        "critical_down": critical_down,
        "noncritical_down": noncritical_down,
        "by_status": by_status,
        "services": [r.to_dict() for r in results],
    }


def mount_stats(app: FastAPI) -> None:
    """Mount the /v1/stats endpoint on a FastAPI app.

    If a previous mount is detected, this is a no-op.
    """
    if getattr(app, "_hive_stats_mounted", False):
        return
    app._hive_stats_mounted = True  # type: ignore[attr-defined]

    @app.get("/v1/stats", include_in_schema=False)
    async def hive_stats():
        report = await collect_hive_health(skip_self=True)
        # Match the overall status with the HTTP code (per Prometheus convention)
        status_code = 200
        if report["overall"] == "degraded":
            status_code = 200  # still served — degraded is informational
        elif report["overall"] == "down":
            status_code = 503
        return JSONResponse(report, status_code=status_code)


# ── CLI ──────────────────────────────────────────────────────────────────────


async def _cli() -> None:
    import json
    import sys
    report = await collect_hive_health(skip_self=False)
    sys.stdout.write(json.dumps(report, indent=2, default=str))
    sys.stdout.write("\n")


if __name__ == "__main__":
    asyncio.run(_cli())
