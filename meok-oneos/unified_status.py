"""
MEOK ONE Unified Status Aggregator
Polls all services and returns a single health/status snapshot.

Services monitored:
- SOV3 (3101) — Sovereign Temple orchestration
- MEOK_MCP (3102) — MCP server
- MEOK_API (3200) — Main API
- MEOK_UI (3000) — Frontend
- Farm_Vision (8888) — Vision/agriculture API
- Trust Registry — PostgreSQL + Solana index
"""

import asyncio
import json
import time
from datetime import datetime
from typing import Dict, Any, List, Optional
from dataclasses import dataclass, field, asdict

try:
    import httpx
    HTTPX_AVAILABLE = True
except ImportError:
    HTTPX_AVAILABLE = False
    import urllib.request

# ── Config ───────────────────────────────────────────────────────────────────

SERVICES = {
    "sov3": {"url": "http://localhost:3101/health", "name": "SOV3 Orchestrator"},
    "meok_mcp": {"url": "http://localhost:3102/health", "name": "MEOK MCP Server"},
    "meok_api": {"url": "http://localhost:3200/health", "name": "MEOK API"},
    "meok_ui": {"url": "http://localhost:3000", "name": "MEOK UI", "check_type": "status_code"},
    "farm_vision": {"url": "http://localhost:8888/health", "name": "Farm Vision / Sovereign API"},
    "trust_registry": {"url": "http://localhost:3001/health", "name": "Trust Registry", "optional": True},
}

# ── Data Models ──────────────────────────────────────────────────────────────

@dataclass
class ServiceStatus:
    name: str
    url: str
    healthy: bool
    response_time_ms: float
    status_code: Optional[int] = None
    error: Optional[str] = None
    data: Dict[str, Any] = field(default_factory=dict)

@dataclass
class UnifiedStatus:
    timestamp: str
    overall_healthy: bool
    services: Dict[str, ServiceStatus]
    healthy_count: int
    total_count: int
    version: str = "1.0.0"

# ── Polling ──────────────────────────────────────────────────────────────────

async def _check_service_httpux(client: httpx.AsyncClient, key: str, config: Dict[str, Any]) -> ServiceStatus:
    url = config["url"]
    name = config["name"]
    start = time.time()
    
    try:
        response = await client.get(url, timeout=5.0)
        elapsed = (time.time() - start) * 1000
        
        healthy = response.status_code < 400
        data = {}
        
        if response.headers.get("content-type", "").startswith("application/json"):
            try:
                data = response.json()
            except:
                pass
        
        return ServiceStatus(
            name=name,
            url=url,
            healthy=healthy,
            response_time_ms=round(elapsed, 2),
            status_code=response.status_code,
            data=data,
        )
    except Exception as e:
        elapsed = (time.time() - start) * 1000
        return ServiceStatus(
            name=name,
            url=url,
            healthy=False,
            response_time_ms=round(elapsed, 2),
            error=str(e),
        )


def _check_service_urllib(key: str, config: Dict[str, Any]) -> ServiceStatus:
    url = config["url"]
    name = config["name"]
    start = time.time()
    
    try:
        req = urllib.request.Request(url, method="GET")
        response = urllib.request.urlopen(req, timeout=5.0)
        elapsed = (time.time() - start) * 1000
        
        data = {}
        if response.headers.get("content-type", "").startswith("application/json"):
            try:
                data = json.loads(response.read().decode())
            except:
                pass
        
        return ServiceStatus(
            name=name,
            url=url,
            healthy=response.status < 400,
            response_time_ms=round(elapsed, 2),
            status_code=response.status,
            data=data,
        )
    except Exception as e:
        elapsed = (time.time() - start) * 1000
        return ServiceStatus(
            name=name,
            url=url,
            healthy=False,
            response_time_ms=round(elapsed, 2),
            error=str(e),
        )


async def get_unified_status() -> UnifiedStatus:
    """Poll all services and return unified status."""
    services: Dict[str, ServiceStatus] = {}
    
    if HTTPX_AVAILABLE:
        async with httpx.AsyncClient() as client:
            tasks = {
                key: _check_service_httpux(client, key, config)
                for key, config in SERVICES.items()
            }
            results = await asyncio.gather(*tasks.values(), return_exceptions=True)
            for key, result in zip(tasks.keys(), results):
                if isinstance(result, Exception):
                    config = SERVICES[key]
                    services[key] = ServiceStatus(
                        name=config["name"],
                        url=config["url"],
                        healthy=False,
                        response_time_ms=0,
                        error=str(result),
                    )
                else:
                    services[key] = result
    else:
        for key, config in SERVICES.items():
            services[key] = _check_service_urllib(key, config)
    
    healthy_count = sum(1 for s in services.values() if s.healthy)
    total_count = len(services)
    overall = healthy_count == total_count
    
    return UnifiedStatus(
        timestamp=datetime.utcnow().isoformat(),
        overall_healthy=overall,
        services=services,
        healthy_count=healthy_count,
        total_count=total_count,
    )


# ── CLI ──────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    status = asyncio.run(get_unified_status())
    print(json.dumps({
        "timestamp": status.timestamp,
        "overall_healthy": status.overall_healthy,
        "healthy_count": status.healthy_count,
        "total_count": status.total_count,
        "services": {
            k: {
                "name": v.name,
                "healthy": v.healthy,
                "response_time_ms": v.response_time_ms,
                "status_code": v.status_code,
                "error": v.error,
            }
            for k, v in status.services.items()
        }
    }, indent=2))
