"""
MEOK ONE Unified API Gateway
Single entry point for all MEOK services.

Aggregates:
- SOV3 (3101) — Orchestration, SBT, A2A, Payments
- MEOK_API (3200) — Dashboard API, Council, Memory
- MEOK_MCP (3102) — MCP tool server
- Farm_Vision (8888) — Sovereign API, Auth, Characters
- Trust Registry — POAI verification (future)
"""

import os
import asyncio
import time
from datetime import datetime
from typing import Dict, Any, Optional, List
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

try:
    import httpx
    HTTPX_AVAILABLE = True
except ImportError:
    HTTPX_AVAILABLE = False

app = FastAPI(
    title="MEOK ONE Unified Gateway",
    description="Single API surface for the entire MEOK ecosystem",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Service Registry ─────────────────────────────────────────────────────────

SERVICES = {
    "sov3": {"url": "http://localhost:3101", "name": "SOV3 Orchestrator"},
    "meok_api": {"url": "http://localhost:3200", "name": "MEOK API"},
    "meok_mcp": {"url": "http://localhost:3102", "name": "MEOK MCP"},
    "sovereign_api": {"url": "http://localhost:8888", "name": "Sovereign API"},
}

# ── Data Models ──────────────────────────────────────────────────────────────

class UnifiedHealthResponse(BaseModel):
    timestamp: str
    overall_healthy: bool
    services: Dict[str, Any]

class SbtMintRequest(BaseModel):
    owner_wallet: str
    sbt_type: int = Field(..., ge=0, le=4)
    metadata_uri: str = ""
    charter_reference: str = ""
    risk_tier: int = 1

class A2ABridgeRequest(BaseModel):
    a2a_card: Dict[str, Any]
    owner_wallet: str
    auto_mint_identity: bool = True

class PaymentRequest(BaseModel):
    agent_id: str
    amount: float
    currency: str = "USDC"
    description: str = ""
    recipient_wallet: Optional[str] = None
    rail_preference: Optional[str] = None

class AgentTaskRequest(BaseModel):
    task: str
    agent_type: Optional[str] = None
    priority: str = "medium"
    context: Optional[Dict[str, Any]] = None

# ── Helpers ──────────────────────────────────────────────────────────────────

async def _proxy_request(service_key: str, method: str, path: str, **kwargs) -> Dict[str, Any]:
    if not HTTPX_AVAILABLE:
        raise HTTPException(status_code=503, detail="httpx not available")
    
    service = SERVICES.get(service_key)
    if not service:
        raise HTTPException(status_code=404, detail=f"Unknown service: {service_key}")
    
    url = f"{service['url']}{path}"
    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            response = await client.request(method, url, **kwargs)
            if response.headers.get("content-type", "").startswith("application/json"):
                return response.json()
            return {"status_code": response.status_code, "text": response.text}
        except Exception as e:
            raise HTTPException(status_code=503, detail=f"Service {service_key} unreachable: {str(e)}")

# ── Health & Status ──────────────────────────────────────────────────────────

@app.get("/health", response_model=UnifiedHealthResponse)
async def gateway_health():
    """Aggregate health from all services."""
    services_status = {}
    healthy_count = 0
    
    if HTTPX_AVAILABLE:
        async with httpx.AsyncClient() as client:
            for key, svc in SERVICES.items():
                start = time.time()
                try:
                    resp = await client.get(f"{svc['url']}/health", timeout=3.0)
                    healthy = resp.status_code < 400
                    if healthy:
                        healthy_count += 1
                    services_status[key] = {
                        "name": svc["name"],
                        "healthy": healthy,
                        "response_time_ms": round((time.time() - start) * 1000, 2),
                        "status_code": resp.status_code,
                    }
                except Exception as e:
                    services_status[key] = {
                        "name": svc["name"],
                        "healthy": False,
                        "response_time_ms": round((time.time() - start) * 1000, 2),
                        "error": str(e),
                    }
    else:
        for key, svc in SERVICES.items():
            services_status[key] = {
                "name": svc["name"],
                "healthy": None,
                "error": "httpx not available",
            }
    
    return UnifiedHealthResponse(
        timestamp=datetime.utcnow().isoformat(),
        overall_healthy=healthy_count == len(SERVICES),
        services=services_status,
    )


@app.get("/")
async def gateway_root():
    return {
        "name": "MEOK ONE Unified Gateway",
        "version": "1.0.0",
        "services": list(SERVICES.keys()),
        "endpoints": {
            "health": "/health",
            "sbt_mint": "/sbt/mint (POST)",
            "sbt_verify": "/sbt/verify/{token_id}",
            "a2a_bridge": "/a2a/bridge (POST)",
            "payments": "/payments/create (POST)",
            "chronicle_log": "/chronicle/log (POST)",
            "chronicle_search": "/chronicle/search (POST)",
            "storage_buckets": "/storage/buckets",
            "agent_task": "/agent/task (POST)",
            "sov3_proxy": "/proxy/sov3/{path}",
            "meok_api_proxy": "/proxy/meok-api/{path}",
        },
    }

# ── SBT Proxy ────────────────────────────────────────────────────────────────

@app.post("/sbt/mint")
async def proxy_sbt_mint(request: SbtMintRequest):
    """Proxy SBT mint request to SOV3."""
    return await _proxy_request(
        "sov3", "POST", "/sbt/mint",
        json=request.model_dump(),
    )

@app.get("/sbt/verify/{token_id}")
async def proxy_sbt_verify(token_id: str):
    """Proxy SBT verify request to SOV3."""
    return await _proxy_request("sov3", "GET", f"/sbt/verify/{token_id}")

@app.get("/sbt/{token_id}")
async def proxy_sbt_get(token_id: str):
    """Proxy SBT get request to SOV3."""
    return await _proxy_request("sov3", "GET", f"/sbt/{token_id}")

# ── A2A Proxy ────────────────────────────────────────────────────────────────

@app.post("/a2a/bridge")
async def proxy_a2a_bridge(request: A2ABridgeRequest):
    """Proxy A2A bridge request to SOV3."""
    return await _proxy_request(
        "sov3", "POST", "/a2a/bridge",
        json=request.model_dump(),
    )

@app.get("/a2a/card/{card_hash}")
async def proxy_a2a_card(card_hash: str):
    """Proxy A2A card get request to SOV3."""
    return await _proxy_request("sov3", "GET", f"/a2a/card/{card_hash}")

@app.get("/a2a/list")
async def proxy_a2a_list():
    """Proxy A2A list request to SOV3."""
    return await _proxy_request("sov3", "GET", "/a2a/list")

# ── Payments Proxy ───────────────────────────────────────────────────────────

@app.post("/payments/create")
async def proxy_payment_create(request: PaymentRequest):
    """Proxy payment create request to SOV3."""
    return await _proxy_request(
        "sov3", "POST", "/payments/create",
        json=request.model_dump(),
    )

@app.get("/payments/{session_id}/status")
async def proxy_payment_status(session_id: str):
    """Proxy payment status request to SOV3."""
    return await _proxy_request("sov3", "GET", f"/payments/{session_id}/status")

# ── Agent Task Dispatch ──────────────────────────────────────────────────────

@app.post("/agent/task")
async def dispatch_agent_task(request: AgentTaskRequest):
    """Dispatch a task to the agent swarm via SOV3."""
    # First, validate care membrane via SOV3
    care_check = await _proxy_request(
        "sov3", "POST", "/mcp",
        json={
            "jsonrpc": "2.0",
            "method": "tools/call",
            "params": {"name": "care_validation", "arguments": {"message": request.task}},
            "id": 1,
        },
    )
    
    # Then dispatch to MEOK API for council routing
    task_result = await _proxy_request(
        "meok_api", "POST", "/api/council/propose",
        json={"proposal": request.task, "priority": request.priority},
    )
    
    return {
        "care_check": care_check,
        "task_result": task_result,
        "dispatched_at": datetime.utcnow().isoformat(),
    }

# ── Generic Proxies ──────────────────────────────────────────────────────────

@app.api_route("/proxy/sov3/{path:path}", methods=["GET", "POST", "PUT", "DELETE"])
async def proxy_sov3(path: str, request: dict = None):
    """Generic proxy to SOV3."""
    method = "POST" if request else "GET"
    kwargs = {"json": request} if request else {}
    return await _proxy_request("sov3", method, f"/{path}", **kwargs)

@app.api_route("/proxy/meok-api/{path:path}", methods=["GET", "POST", "PUT", "DELETE"])
async def proxy_meok_api(path: str, request: dict = None):
    """Generic proxy to MEOK API."""
    method = "POST" if request else "GET"
    kwargs = {"json": request} if request else {}
    return await _proxy_request("meok_api", method, f"/{path}", **kwargs)


if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 3400))
    uvicorn.run(app, host="0.0.0.0", port=port)

# Health check proxies for bridge routers
@app.get("/payments/health")
async def proxy_payments_health():
    return await _proxy_request("sov3", "GET", "/payments/health")

@app.get("/chronicle/health")
async def proxy_chronicle_health():
    return await _proxy_request("sov3", "GET", "/chronicle/health")

@app.get("/storage/health")
async def proxy_storage_health():
    return await _proxy_request("sov3", "GET", "/storage/health")

@app.get("/a2a/health")
async def proxy_a2a_health():
    return await _proxy_request("sov3", "GET", "/a2a/health")
