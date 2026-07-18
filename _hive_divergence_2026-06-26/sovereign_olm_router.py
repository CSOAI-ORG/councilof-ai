"""
MEOK Sovereign OLM Inference Router — Tier 5 (local sovereign) + Tier 6 fallback chain.

Implements the 6-tier inference architecture as a single router on the VM:
  Tier 1: Fusion Council (Kimi 20% / Opus 25% / DeepSeek 15% / Qwen 15% / Laguna 25%)
  Tier 2: Auto Router (NotDiamond AI)
  Tier 3: Pareto Code (MCP development)
  Tier 4: Free Router (free models)
  Tier 5: SOV3 MESH (local sovereign)  ← WE LIVE HERE
  Tier 6: Laguna m.1 (sovereign code mode) ← last-resort local

The router:
  - Tries the local sovereign mesh first (MEOK EU Compliance Gateway on :8889)
  - Falls back to direct MCP tool calls (MCP_bridge on SOV3 :3101)
  - Falls back to public LLMs (OpenRouter free tier)
  - Logs every decision to SOV3 as a sovereign sigil

Built 15 Jun 2026 as part of the 48-day Article 50 sprint.
"""
import json
import time
import os
from typing import Any, Dict, Optional, List
from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import JSONResponse
import httpx

# === TIER ENDPOINTS ===
TIER1_FUSION_COUNCIL = os.environ.get("TIER1_URL", "https://api.councilof.ai/fuse")  # future
TIER2_AUTO_ROUTER   = os.environ.get("TIER2_URL", "https://api.notdiamond.ai/route")
TIER3_PARETO_CODE   = os.environ.get("TIER3_URL", "https://api.paretodev.ai/code")
TIER4_FREE_ROUTER   = os.environ.get("TIER4_URL", "https://openrouter.ai/api/v1/chat/completions")
TIER5_SOV3_MESH     = os.environ.get("TIER5_URL", "http://localhost:3101")
TIER6_LAGUNA        = os.environ.get("TIER6_URL", "http://localhost:11434")  # Ollama

GATEWAY_URL = os.environ.get("GATEWAY_URL", "http://localhost:8889")
KEYSTONE_URL = os.environ.get("KEYSTONE_URL", "http://localhost:8888")

# === THE 5-MIND FUSION COUNCIL WEIGHTS (canonical, verified 14 Jun 2026) ===
FUSION_WEIGHTS = {
    "kimi": 0.20,
    "opus": 0.25,
    "deepseek": 0.15,
    "qwen": 0.15,
    "laguna": 0.25,  # the new sovereign code model
}

app = FastAPI(
    title="MEOK Sovereign OLM Router",
    version="1.0.0",
    description="6-tier inference router. Local sovereign first, external fallback chain. SOV3-logged.",
)

# === HEALTH ===
@app.get("/health")
async def health():
    return {
        "status": "ok",
        "server": "meok-sovereign-olm-router",
        "tiers": {
            "1_fusion_council": TIER1_FUSION_COUNCIL,
            "2_auto_router": TIER2_AUTO_ROUTER,
            "3_pareto_code": TIER3_PARETO_CODE,
            "4_free_router": TIER4_FREE_ROUTER,
            "5_sov3_mesh": TIER5_SOV3_MESH,
            "6_laguna_local": TIER6_LAGUNA,
        },
        "fusion_weights": FUSION_WEIGHTS,
    }

# === THE 6-TIER ROUTER ===
async def route_through_tiers(task: Dict[str, Any]) -> Dict[str, Any]:
    """Try each tier in order. Return the first successful response.

    task = {"messages": [...], "max_tokens": 1024, "task_type": "code"|"chat"|"audit"}
    """
    tried = []
    for tier_num, tier_name, tier_fn in [
        (5, "sov3_mesh", _try_tier5_sov3),
        (6, "laguna_local", _try_tier6_laguna),
        (1, "fusion_council", _try_tier1_fusion),
        (2, "auto_router", _try_tier2_auto),
        (3, "pareto_code", _try_tier3_pareto),
        (4, "free_router", _try_tier4_free),
    ]:
        try:
            result = await tier_fn(task)
            result["tier_used"] = tier_num
            result["tiers_tried"] = tried
            return result
        except Exception as e:
            tried.append({"tier": tier_num, "name": tier_name, "error": str(e)[:100]})
    return {"error": "all 6 tiers failed", "tried": tried}

async def _try_tier5_sov3(task: Dict) -> Dict:
    """Tier 5: SOV3 mesh — use mcp_bridge_call to route to sovereign MCPs."""
    # If task_type is "audit", route through the gateway
    if task.get("task_type") == "audit":
        async with httpx.AsyncClient(timeout=10) as client:
            r = await client.post(f"{GATEWAY_URL}/v1/assess", json=task.get("input", {}))
            r.raise_for_status()
            return {"status": "ok", "response": r.json(), "tier": "sov3_mesh"}
    # If task_type is "tool_call", use mcp_bridge_call
    if task.get("task_type") == "tool_call":
        async with httpx.AsyncClient(timeout=10) as client:
            r = await client.post(
                f"{TIER5_SOV3_MESH}/mcp",
                json={
                    "jsonrpc": "2.0", "id": 1, "method": "tools/call",
                    "params": {
                        "name": "mcp_bridge_call",
                        "arguments": task["input"],
                    },
                },
            )
            r.raise_for_status()
            return {"status": "ok", "response": r.json(), "tier": "sov3_mesh"}
    raise RuntimeError("tier5 requires task_type=audit|tool_call")

async def _try_tier6_laguna(task: Dict) -> Dict:
    """Tier 6: Local Ollama with Laguna m.1 (sovereign code model)."""
    async with httpx.AsyncClient(timeout=15) as client:
        r = await client.post(
            f"{TIER6_LAGUNA}/api/chat",
            json={
                "model": "laguna-m.1",
                "messages": task.get("messages", []),
                "stream": False,
            },
        )
        r.raise_for_status()
        return {"status": "ok", "response": r.json(), "tier": "laguna_local"}

async def _try_tier1_fusion(task: Dict) -> Dict:
    """Tier 1: 5-mind fusion council (Kimi/Opus/DeepSeek/Qwen/Laguna weighted)."""
    # In production: fan out to 5 LLMs in parallel, weight votes
    # For MVP: single call to the council endpoint
    async with httpx.AsyncClient(timeout=30) as client:
        r = await client.post(TIER1_FUSION_COUNCIL, json=task)
        r.raise_for_status()
        return {"status": "ok", "response": r.json(), "tier": "fusion_council"}

async def _try_tier2_auto(task: Dict) -> Dict:
    """Tier 2: NotDiamond AI auto-router."""
    async with httpx.AsyncClient(timeout=30) as client:
        r = await client.post(TIER2_AUTO_ROUTER, json=task)
        r.raise_for_status()
        return {"status": "ok", "response": r.json(), "tier": "auto_router"}

async def _try_tier3_pareto(task: Dict) -> Dict:
    """Tier 3: Pareto Code (specialized for MCP development)."""
    async with httpx.AsyncClient(timeout=30) as client:
        r = await client.post(TIER3_PARETO_CODE, json=task)
        r.raise_for_status()
        return {"status": "ok", "response": r.json(), "tier": "pareto_code"}

async def _try_tier4_free(task: Dict) -> Dict:
    """Tier 4: OpenRouter free router (last-resort external)."""
    async with httpx.AsyncClient(timeout=30) as client:
        r = await client.post(
            TIER4_FREE_ROUTER,
            json={
                "model": "meta-llama/llama-3.1-8b-instruct:free",
                "messages": task.get("messages", []),
            },
            headers={"Authorization": f"Bearer {os.environ.get('OPENROUTER_API_KEY', '')}"},
        )
        r.raise_for_status()
        return {"status": "ok", "response": r.json(), "tier": "free_router"}

# === THE 1-ENDPOINT ROUTER ===
@app.post("/v1/route")
async def route(request: Request):
    """Single endpoint that tries the 6 tiers in order.

    Body: {"task_type": "audit"|"chat"|"code"|"tool_call", "messages": [...], "input": {...}}

    Returns: { "tier_used": 5, "response": {...}, "tiers_tried": [...] }
    """
    task = await request.json()
    result = await route_through_tiers(task)
    # Log to SOV3
    await _log_to_sov3("olm.route", result)
    return result

# === SOV3 MESH INTEGRATION ===
async def _log_to_sov3(action: str, result: Any):
    try:
        async with httpx.AsyncClient(timeout=5) as client:
            await client.post(
                f"{TIER5_SOV3_MESH}/mcp",
                json={
                    "jsonrpc": "2.0", "id": 1, "method": "tools/call",
                    "params": {
                        "name": "record_memory",
                        "arguments": {
                            "content": f"meok-sovereign-olm-router/{action}: tier={result.get('tier_used', '?')}",
                            "source_agent": "meok-sovereign-olm-router",
                            "memory_type": "inference",
                            "care_weight": 0.6,
                            "tags": ["olm", "inference", "tier-router"],
                            "emotional_valence": 0.4,
                        },
                    },
                },
            )
    except Exception as e:
        print(f"[warn] SOV3 log failed: {e}")

# === ROOT ===
@app.get("/")
async def root():
    return {
        "name": "MEOK Sovereign OLM Router",
        "version": "1.0.0",
        "tiers_order": [5, 6, 1, 2, 3, 4],  # local first, external last
        "tiers": {
            5: TIER5_SOV3_MESH,
            6: TIER6_LAGUNA,
            1: TIER1_FUSION_COUNCIL,
            2: TIER2_AUTO_ROUTER,
            3: TIER3_PARETO_CODE,
            4: TIER4_FREE_ROUTER,
        },
        "endpoints": ["/health", "/v1/route"],
        "fusion_weights": FUSION_WEIGHTS,
    }
