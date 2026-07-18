"""UE5 → SOV3 bridge: serves the 33 hives data + calls all 13 sovereign MCPs.
Runs on M2 Mac at :8765. UE5 (on M4 or any UE5 client) calls this.

Endpoints:
  GET  /hives                           → 33 hives from hives.json
  GET  /hive/<id>                       → specific hive
  POST /mcp/<mcp_name>/<tool>           → forward to sovereign MCP
  GET  /iot/pond                        → iOK farm pond live data
  GET  /ollama/tags                     → list M2 Ollama models
  POST /ollama/chat                     → M2 Ollama chat (SOV3 dragon)
  POST /avatar/say                      → sovereign dragon avatar speak
  GET  /worm/status                     → MEOK WORM doctrine status
  POST /worm/scan                       → Morris-II defensive scan
  GET  /worm/tunnels                    → 6 canonical protocol tunnels
  GET  /worm/audit                      → recent audit events
  GET  /health                          → health check
"""
import json
import os
import time
import hashlib
import hmac
from pathlib import Path

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
import httpx
import uvicorn

app = FastAPI(title="UE5 → SOV3 Bridge", version="0.1.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

# === Paths ===
HIVES_JSON = Path("/Users/nicholas/Documents/MEOK_BUILD/sov-town/Content/Hives/hives.json")
SOVEREIGN_MCPS_DIR = Path("/Users/nicholas/clawd/mcp-marketplace")
SOV3_DIR = Path("/Users/nicholas/clawd/sovereign-town")
OLLAMA_URL = "http://localhost:11434"

BRIDGE_SECRET = "sovereign-bridge-2026-csoai-uk-16939677"
VALID_TOKENS = {hmac.new(BRIDGE_SECRET.encode(), b"ue5-client", hashlib.sha256).hexdigest()[:32]}


def _auth(request: Request) -> bool:
    auth = request.headers.get("Authorization", "")
    if not auth.startswith("Bearer "):
        return False
    return auth[7:] in VALID_TOKENS


# === Hive Registry ===
@app.get("/hives")
async def get_hives():
    if HIVES_JSON.exists():
        with open(HIVES_JSON) as f:
            return json.load(f)
    return {"hives": [], "error": "hives.json not found"}


@app.get("/hive/{hive_id}")
async def get_hive(hive_id: str):
    data = await get_hives()
    for h in data.get("hives", []):
        if h["id"] == hive_id:
            return h
    raise HTTPException(404, f"hive not found: {hive_id}")


# === MCP bridge ===
@app.post("/mcp/{mcp_name}/{tool_name}")
async def call_mcp(mcp_name: str, tool_name: str, request: Request):
    if not _auth(request):
        raise HTTPException(401, "invalid bearer token")
    payload = await request.json() if request.headers.get("content-type") == "application/json" else {}

    pkg_map = {
        "passport": "meok_sovereign_passport_mcp",
        "guardrails": "meok_sovereign_guardrails_mcp",
        "receipt": "meok_sovereign_receipt_mcp",
        "governance": "meok_sovereign_governance_mcp",
        "x402-payment": "meok_sovereign_x402_payment_mcp",
        "supply-chain": "meok_supply_chain_attestation_mcp",
        "globe": "meok_sovereign_globe_mcp",
        "council": "meok_sovereign_council_mcp",
        "memory": "meok_sovereign_memory_mcp",
        "avatar": "meok_sovereign_avatar_mcp",
        "skills": "meok_sovereign_skills_mcp",
        "eu-ai-act-kit": "meok_sovereign_eu_ai_act_kit_mcp",
        "worm": "meok_sovereign_worm_mcp",
        "defence": "meok_sovereign_defence_mcp",
        "satellite": "meok_sovereign_satellite_mcp",
        "honour": "meok_sovereign_honour_mcp",
        "immortal": "meok_sovereign_immortal_mcp",
        "dora": "meok_sovereign_dora_mcp",
        "iso42001": "meok_sovereign_iso42001_mcp",
        "iot": "meok_sovereign_iot_mcp",
        "pond": "meok_sovereign_pond_mcp",
        "intuition": "meok_sovereign_intuition_mcp",
    }
    pkg = pkg_map.get(mcp_name)
    if not pkg:
        raise HTTPException(404, f"unknown MCP: {mcp_name}")
    try:
        module = __import__(pkg, fromlist=[""])
        tool_func_name = f"sov_{tool_name.replace('-', '_')}"
        if not hasattr(module, tool_func_name):
            return {"error": f"tool {tool_name} not found in {pkg}"}
        result = getattr(module, tool_func_name)(**payload)
        return {"mcp": mcp_name, "tool": tool_name, "result": result, "ts": time.time()}
    except Exception as e:
        raise HTTPException(500, f"MCP call failed: {str(e)}")


# === iOK Farm IoT ===
IOT_POND_STATE = {"ph": 7.4, "do_mg_l": 8.2, "temp_c": 22.1, "humidity": 65.0, "ts": "mock"}


@app.get("/iot/pond")
async def get_pond():
    return {"hive_id": "iok-pond-001", "lat": 52.7917, "lon": -0.0500, **IOT_POND_STATE}


@app.post("/iot/pond/update")
async def update_pond(request: Request):
    if not _auth(request):
        raise HTTPException(401, "invalid bearer token")
    data = await request.json()
    IOT_POND_STATE.update({k: v for k, v in data.items() if k in ["ph", "do_mg_l", "temp_c", "humidity"]})
    IOT_POND_STATE["ts"] = time.time()
    return {"ok": True, "state": IOT_POND_STATE}


# === Ollama ===
@app.get("/ollama/tags")
async def ollama_tags():
    async with httpx.AsyncClient() as client:
        try:
            r = await client.get(f"{OLLAMA_URL}/api/tags", timeout=5)
            return r.json()
        except Exception as e:
            return {"error": str(e)}


@app.post("/ollama/chat")
async def ollama_chat(request: Request):
    if not _auth(request):
        raise HTTPException(401, "invalid bearer token")
    data = await request.json()
    model = data.get("model", "qwen3:0.6b")
    messages = data.get("messages", [])
    async with httpx.AsyncClient() as client:
        try:
            r = await client.post(f"{OLLAMA_URL}/api/chat",
                                  json={"model": model, "messages": messages, "stream": False},
                                  timeout=60)
            return r.json()
        except Exception as e:
            return {"error": str(e)}


# === Sovereign dragon avatar ===
SOV3_SPEECH_LOG = []


@app.post("/avatar/say")
async def dragon_speak(request: Request):
    if not _auth(request):
        raise HTTPException(401, "invalid bearer token")
    data = await request.json()
    text = data.get("text", "")
    mood = data.get("mood", "neutral")
    if not text:
        raise HTTPException(400, "text required")

    async with httpx.AsyncClient() as client:
        try:
            r = await client.post(f"{OLLAMA_URL}/api/chat",
                                  json={"model": "meok-sov3:latest",
                                        "messages": [{"role": "system",
                                                      "content": "You are SOV3, the sovereign dragon. Speak briefly (under 50 words) in the MEOK voice."},
                                                     {"role": "user", "content": text}],
                                        "stream": False},
                                  timeout=30)
            llm_response = r.json()
            spoken = llm_response.get("message", {}).get("content", text)
        except Exception as e:
            spoken = f"[SOV3] {text} (ollama error: {e})"

    speech_id = hashlib.sha256(f"{spoken}|{mood}|{time.time()}".encode()).hexdigest()[:16]
    speech_entry = {
        "speech_id": speech_id,
        "text_input": text,
        "text_spoken": spoken,
        "mood": mood,
        "model": "meok-sov3:latest",
        "ts": time.time(),
        "verify_url": f"https://proofof.ai/avatar/speech/{speech_id}",
    }
    SOV3_SPEECH_LOG.append(speech_entry)
    return speech_entry


@app.get("/avatar/log")
async def dragon_log():
    return {"count": len(SOV3_SPEECH_LOG), "speeches": SOV3_SPEECH_LOG[-50:]}


# === MEOK WORM (defensive) ===
@app.get("/worm/status")
async def worm_status():
    """MEOK WORM doctrine status (what's deployed, what's defensive)."""
    try:
        from meok_sovereign_worm_mcp import sov_worm_status
        return sov_worm_status()
    except Exception as e:
        return {"error": str(e)}


@app.post("/worm/scan")
async def worm_scan(data: dict):
    """Scan text for Morris-II self-replicating-prompt patterns (defensive)."""
    text = data.get("text", "")
    source = data.get("source", "ue5")
    try:
        from meok_sovereign_worm_mcp import sov_worm_scan
        return sov_worm_scan(text, source=source)
    except Exception as e:
        return {"error": str(e)}


@app.get("/worm/tunnels")
async def worm_tunnels():
    """List all registered + canonical known protocol tunnels."""
    try:
        from meok_sovereign_worm_mcp import sov_tunnel_list
        return sov_tunnel_list()
    except Exception as e:
        return {"error": str(e)}


@app.get("/worm/audit")
async def worm_audit(limit: int = 50):
    """Get the most recent audit events."""
    try:
        from meok_sovereign_worm_mcp import sov_audit_recent
        return sov_audit_recent(limit=limit)
    except Exception as e:
        return {"error": str(e)}


# === MEOK WORM (defensive) ===
@app.get("/worm/status")
async def worm_status():
    """MEOK WORM doctrine status (what's deployed, what's defensive)."""
    try:
        from meok_sovereign_worm_mcp import sov_worm_status as _fn
        return _fn()
    except Exception as e:
        return {"error": str(e)}


@app.post("/worm/scan")
async def worm_scan(data: dict):
    """Scan text for Morris-II self-replicating-prompt patterns (defensive)."""
    text = data.get("text", "")
    source = data.get("source", "ue5")
    try:
        from meok_sovereign_worm_mcp import sov_worm_scan as _fn
        return _fn(text, source=source)
    except Exception as e:
        return {"error": str(e)}


@app.get("/worm/tunnels")
async def worm_tunnels():
    """List all registered + canonical known protocol tunnels."""
    try:
        from meok_sovereign_worm_mcp import sov_tunnel_list as _fn
        return _fn()
    except Exception as e:
        return {"error": str(e)}


@app.get("/worm/audit")
async def worm_audit(limit: int = 50):
    """Get the most recent audit events."""
    try:
        from meok_sovereign_worm_mcp import sov_audit_recent as _fn
        return _fn(limit=limit)
    except Exception as e:
        return {"error": str(e)}


# === Health check ===
@app.get("/health")
async def health():
    flywheel_cycles = 0
    flywheel_ledger = SOV3_DIR / "p0_aqua" / "flywheel_ledger_mac.jsonl"
    if flywheel_ledger.exists():
        with open(flywheel_ledger) as f:
            flywheel_cycles = sum(1 for _ in f)
    return {
        "status": "healthy",
        "version": "0.1.0",
        "hives_loaded": HIVES_JSON.exists(),
        "sovereign_mcps_dir": str(SOVEREIGN_MCPS_DIR),
        "ollama_local": OLLAMA_URL,
        "flywheel_cycles": flywheel_cycles,
        "dragon_speeches": len(SOV3_SPEECH_LOG),
    }


@app.get("/")
async def root():
    return {
        "name": "UE5 → SOV3 Bridge",
        "version": "0.1.0",
        "endpoints": {
            "GET /hives": "33 hives from iOK Farm + SOV3 substrate",
            "POST /mcp/<name>/<tool>": "Call any of the 13 sovereign MCPs (auth required)",
            "GET /iot/pond": "iOK Farm pond live data",
            "POST /iot/pond/update": "ESP32 firmware update (auth required)",
            "GET /ollama/tags": "M2 Ollama model registry",
            "POST /ollama/chat": "M2 Ollama chat (auth required)",
            "POST /avatar/say": "SOV3 dragon speak (auth required)",
            "GET /avatar/log": "Dragon speech history",
            "GET /worm/status": "MEOK WORM doctrine status (defensive only)",
            "POST /worm/scan": "Morris-II defensive scan (defensive)",
            "GET /worm/tunnels": "6 canonical protocol tunnels + registered",
            "GET /worm/audit": "Recent sigil-signed audit events",
            "GET /health": "Bridge + substrate health",
        },
        "bearer_token": hmac.new(BRIDGE_SECRET.encode(), b"ue5-client", hashlib.sha256).hexdigest()[:32],
        "ts": time.time(),
    }


if __name__ == "__main__":
    print("=" * 70)
    print("UE5 → SOV3 BRIDGE on M2 Mac")
    print("=" * 70)
    print(f"  Listening on: http://0.0.0.0:8765")
    print(f"  Hives JSON: {HIVES_JSON}")
    print(f"  Sovereign MCPs: {SOVEREIGN_MCPS_DIR}")
    print(f"  Ollama: {OLLAMA_URL}")
    print(f"  Bearer token: {hmac.new(BRIDGE_SECRET.encode(), b'ue5-client', hashlib.sha256).hexdigest()[:32]}")
    print("=" * 70)
    uvicorn.run(app, host="0.0.0.0", port=8765, log_level="info")
