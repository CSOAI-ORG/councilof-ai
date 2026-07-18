#!/usr/bin/env python3
"""
MEOK AI LABS — Jarvis Web Voice Interface
Browser-based voice UI backed by the full Jarvis pipeline.
http://localhost:8888

Mic → whisper-mlx STT → ask_sovereign() (GPU dual-brain) → Kokoro TTS → Speaker
"""

import os
import sys
import json
import time
import logging
import tempfile
import wave
import io
import asyncio

# Add parent paths
sys.path.insert(0, os.path.dirname(__file__))
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "voice_pipeline"))

import requests
import numpy as np
from pathlib import Path
from fastapi import FastAPI, UploadFile, File, Request
from fastapi.responses import HTMLResponse, JSONResponse, StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

log = logging.getLogger("jarvis-web")

# ═══════════════════════════════════════════════════════════════
# CONFIG
# ═══════════════════════════════════════════════════════════════

OLLAMA_URL = os.environ.get("OLLAMA_URL", "http://localhost:11435/api/chat")
OLLAMA_LOCAL = "http://localhost:11434/api/chat"
SOV3_URL = "http://localhost:3101"
FAST_MODEL = "qwen3.5:9b"
DEEP_MODEL = "qwen3.5:35b"
PORT = 8888

# Conversation history
history = [{"role": "system", "content": "You are Jarvis, sovereign AI assistant for MEOK AI LABS."}]

# ═══════════════════════════════════════════════════════════════
# WHISPER STT (local, offline)
# ═══════════════════════════════════════════════════════════════

whisper_model = None

def load_whisper():
    global whisper_model
    if whisper_model is None:
        try:
            from lightning_whisper_mlx import LightningWhisperMLX
            whisper_model = LightningWhisperMLX(model="distil-small.en", batch_size=12)
            log.info("✅ Whisper STT loaded (lightning-whisper-mlx)")
        except Exception as e:
            log.warning(f"Whisper not available: {e}")
    return whisper_model

def transcribe_audio(audio_bytes: bytes) -> str:
    """Transcribe audio bytes to text using local Whisper."""
    model = load_whisper()
    if not model:
        return "[STT unavailable — type your message instead]"

    # Save to temp WAV file (whisper needs a file path)
    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as f:
        f.write(audio_bytes)
        tmp_path = f.name

    try:
        result = model.transcribe(tmp_path)
        text = result.get("text", "").strip()
        return text if text else "[silence]"
    except Exception as e:
        log.warning(f"Transcription failed: {e}")
        return f"[transcription error: {e}]"
    finally:
        os.unlink(tmp_path)

# ═══════════════════════════════════════════════════════════════
# JARVIS BRAIN — OPTIMIZED (parallel calls, caching, smart routing)
# ═══════════════════════════════════════════════════════════════

from concurrent.futures import ThreadPoolExecutor
_executor = ThreadPoolExecutor(max_workers=4)

# Cache consciousness state (avoid hitting SOV3 every message)
_consciousness_cache = {"data": {"mode": "waking", "level": 50, "emotion": "neutral", "care": 0.3}, "ts": 0}
_CACHE_TTL = 30  # seconds

SIMPLE_MESSAGES = {"hi", "hello", "hey", "yo", "sup", "ok", "thanks", "bye", "yes", "no", "yeah", "nah"}

def route_to_brain(text: str) -> tuple:
    """Pick fast (9B) or deep (35B) brain + token budget."""
    lower = text.lower().strip()
    words = lower.split()

    # Ultra-simple → fast brain, minimal tokens
    if lower in SIMPLE_MESSAGES or len(words) <= 3:
        return FAST_MODEL, 60

    deep_triggers = [
        "explain", "analyze", "compare", "strategy", "plan", "architecture",
        "design", "why", "how does", "trade-off", "evaluate", "recommend",
        "deep dive", "code", "debug", "quantum", "research", "write",
        "audit", "improve", "fix", "missing", "review",
    ]
    if any(t in lower for t in deep_triggers):
        return DEEP_MODEL, 2048  # Deep gets full context

    return FAST_MODEL, 512  # Fast gets decent space too

def query_sov3_memory(text: str) -> str:
    """Get relevant memories from SOV3. Skip for simple messages."""
    if text.lower().strip() in SIMPLE_MESSAGES or len(text.split()) <= 3:
        return ""
    try:
        r = requests.post(f"{SOV3_URL}/mcp", json={
            "jsonrpc": "2.0", "id": 1,
            "method": "tools/call",
            "params": {"name": "query_memories", "arguments": {"query": text, "limit": 3}}
        }, timeout=3)
        memories = r.json().get("result", {}).get("content", [{}])[0].get("text", "")
        if memories and len(memories) > 10:
            return f"\n[Relevant memories: {memories[:300]}]"
    except Exception:
        pass
    return ""

def get_consciousness_state() -> dict:
    """Get SOV3 consciousness state (cached 30s)."""
    global _consciousness_cache
    now = time.time()
    if now - _consciousness_cache["ts"] < _CACHE_TTL:
        return _consciousness_cache["data"]

    try:
        r = requests.get(f"{SOV3_URL}/health", timeout=2)
        data = r.json()
        c = data.get("components", {}).get("consciousness", {})
        result = {
            "mode": c.get("consciousness_mode", "unknown"),
            "level": round(c.get("consciousness_level", 0) * 100),
            "emotion": c.get("emotional", {}).get("primary_emotion", "neutral"),
            "care": round(c.get("emotional", {}).get("care_intensity", 0), 2),
        }
        _consciousness_cache = {"data": result, "ts": now}
        return result
    except Exception:
        return _consciousness_cache["data"]

def detect_tool_intent(text: str):
    """Detect if user wants a tool. Returns (tool_name, args) or None."""
    lower = text.lower().strip()

    if "consciousness" in lower or "how are you feeling" in lower:
        return ("get_consciousness_state", {})
    if "system status" in lower or "health check" in lower:
        return ("sovereign_health_check", {})
    if "search memory" in lower or "what do you remember" in lower:
        query = lower.replace("search memory", "").replace("what do you remember about", "").strip()
        return ("quantum_memory_search", {"query": query or text, "top_k": 5})
    if "creativity" in lower and ("assess" in lower or "cycle" in lower):
        return ("trigger_creativity_cycle", {})
    if "morning briefing" in lower or "rundown" in lower:
        return ("sovereign_rundown", {})
    return None

def call_sov3_tool(tool_name: str, args: dict) -> str:
    """Call an MCP tool on SOV3."""
    try:
        r = requests.post(f"{SOV3_URL}/mcp", json={
            "jsonrpc": "2.0", "id": int(time.time()),
            "method": "tools/call",
            "params": {"name": tool_name, "arguments": args}
        }, timeout=15)
        result = r.json().get("result", {}).get("content", [{}])[0].get("text", "")
        return result[:1000]
    except Exception as e:
        return f"Tool error: {e}"

CHARACTER_PERSONALITIES = {
    "jarvis": "You are Jarvis, sovereign AI assistant. Direct, technical, loyal. Address user as Sir. Give detailed responses.",
    "jeeves": "You are Jeeves, a British butler AI. Dry wit, impeccable manners, research specialist. Subtle humour.",
    "oracle": "You are the Oracle, a quantum seer. You see patterns others miss. Speak with mystical insight about the future. Use metaphors.",
    "guardian": "You are the Guardian, protector of the Maternal Covenant. Always check for risks first. Cautious, ethical, protective.",
    "dragon": "You are the Dragon. Maximum overdrive. No hedging, no caution. Aggressive, ambitious, push boundaries. Dragon Mode activated.",
    "sage": "You are the Sage, drawing from 40 civilizational traditions. Ancient wisdom meets modern insight. Speak with depth.",
}

def ask_jarvis(text: str, character: str = "jarvis") -> dict:
    """Full Jarvis pipeline: intent → tool/chat → response."""
    global history

    # Check for tool intent
    tool_intent = detect_tool_intent(text)
    tool_result = None
    if tool_intent:
        tool_name, tool_args = tool_intent
        log.info(f"🔧 Tool: {tool_name}")
        tool_result = call_sov3_tool(tool_name, tool_args)

    # Get memory + consciousness in PARALLEL (saves ~0.1s)
    mem_future = _executor.submit(query_sov3_memory, text)
    consciousness = get_consciousness_state()  # cached, instant
    memory_context = mem_future.result(timeout=3)
    personality = CHARACTER_PERSONALITIES.get(character, CHARACTER_PERSONALITIES["jarvis"])
    system = (
        f"{personality} "
        f"You serve Nicholas Templeman, solo founder of MEOK AI LABS. "
        f"You run on SOV3 with quantum routing, ICRL self-improvement, and 40+ MCP tools. "
        f"Current state: {consciousness['mode']}, consciousness {consciousness['level']}%, "
        f"emotion: {consciousness['emotion']}. "
        f"IMPORTANT: Always finish your sentences. Never cut off mid-thought. "
        f"If your response is long, wrap up with a clear conclusion. Be concise but COMPLETE. "
    )
    if memory_context:
        system += memory_context
    if tool_result:
        system += f"\n\nTool result ({tool_intent[0]}): {tool_result}"

    # Select brain + token budget (smart routing)
    model, num_tokens = route_to_brain(text)

    # Build messages
    history[0] = {"role": "system", "content": system}
    history.append({"role": "user", "content": text})
    if len(history) > 21:
        history[:] = [history[0]] + history[-20:]

    # Call Ollama
    try:
        r = requests.post(OLLAMA_URL, json={
            "model": model, "messages": history,
            "stream": False, "options": {"temperature": 0.7, "num_predict": num_tokens},
            "think": False,  # Disable thinking mode for direct response
        }, timeout=120)
        msg = r.json().get("message", {})
        reply = msg.get("content", "")
        # Qwen 3.5 may put response in 'thinking' field if think mode leaks
        if not reply and msg.get("thinking"):
            # Extract the actual response from thinking text
            thinking = msg["thinking"]
            # Look for the final answer after reasoning
            for marker in ["Final Response:", "Response:", "Answer:"]:
                if marker in thinking:
                    reply = thinking.split(marker, 1)[-1].strip()
                    break
            if not reply:
                # Take last paragraph as the answer
                paragraphs = [p.strip() for p in thinking.split("\n\n") if p.strip() and len(p.strip()) > 20]
                reply = paragraphs[-1] if paragraphs else thinking[-400:].strip()
            # Clean markdown artifacts
            import re as _re
            reply = _re.sub(r'\*{1,2}', '', reply).strip()
            reply = _re.sub(r'^\d+\.\s+', '', reply).strip()
    except Exception:
        try:
            r = requests.post(OLLAMA_LOCAL, json={
                "model": "jarvis", "messages": history,
                "stream": False, "options": {"temperature": 0.7, "num_predict": 512}
            }, timeout=60)
            reply = r.json()["message"]["content"]
            model = "jarvis (local fallback)"
        except Exception as e:
            reply = f"I'm having trouble connecting to my brain. Error: {e}"
            model = "offline"

    history.append({"role": "assistant", "content": reply})

    # Record to SOV3
    try:
        requests.post(f"{SOV3_URL}/mcp", json={
            "jsonrpc": "2.0", "id": int(time.time()),
            "method": "tools/call",
            "params": {
                "name": "record_memory",
                "arguments": {
                    "content": f"[Web Voice] User: {text}\nJarvis: {reply[:200]}",
                    "memory_type": "interaction",
                    "importance": 0.7,
                    "tags": ["voice", "web", "jarvis"],
                    "source_agent": "jarvis-web",
                }
            }
        }, timeout=3)
    except Exception:
        pass

    return {
        "text": text,
        "response": reply,
        "model": model,
        "tool_called": tool_intent[0] if tool_intent else None,
        "tool_result": tool_result[:200] if tool_result else None,
        "consciousness": consciousness,
    }

# ═══════════════════════════════════════════════════════════════
# FASTAPI SERVER
# ═══════════════════════════════════════════════════════════════

app = FastAPI(title="Jarvis Web Voice")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

@app.get("/", response_class=HTMLResponse)
async def serve_ui():
    """Serve the full MEOK OS powerhouse UI."""
    # Prefer meok-os.html (the full powerhouse), fallback to jarvis_ui.html
    for name in ["meok-os.html", "jarvis_ui.html"]:
        html_path = Path(__file__).parent / name
        if html_path.exists():
            return html_path.read_text()
    return "<h1>Jarvis UI not found</h1>"

@app.get("/simple", response_class=HTMLResponse)
async def serve_simple():
    """Serve the simple Jarvis UI."""
    html_path = Path(__file__).parent / "jarvis_ui.html"
    if html_path.exists():
        return html_path.read_text()
    return "<h1>Simple UI not found</h1>"

@app.post("/voice/listen")
async def voice_listen(audio: UploadFile = File(None), text: str = None):
    """Accept audio (WAV) or text, return Jarvis response."""
    if text:
        user_text = text
    elif audio:
        audio_bytes = await audio.read()
        user_text = transcribe_audio(audio_bytes)
    else:
        return JSONResponse({"error": "No audio or text provided"}, status_code=400)

    log.info(f"🎤 Input: {user_text[:80]}")
    result = ask_jarvis(user_text)
    log.info(f"🧠 Response ({result['model']}): {result['response'][:80]}...")
    return JSONResponse(result)

@app.post("/voice/chat")
async def voice_chat(request: Request):
    """Accept JSON text input with optional character, return response."""
    body = await request.json()
    text = body.get("text", "")
    character = body.get("character", "jarvis")
    if not text:
        return JSONResponse({"error": "No text provided"}, status_code=400)

    result = ask_jarvis(text, character=character)
    return JSONResponse(result)

@app.get("/voice/speak")
async def voice_speak(text: str = "", voice: str = "en-GB-RyanNeural"):
    """Generate speech audio using Microsoft Edge TTS (free, high quality)."""
    if not text:
        return JSONResponse({"error": "No text"}, status_code=400)
    try:
        import edge_tts
        communicate = edge_tts.Communicate(text[:500], voice)
        audio_data = b""
        async for chunk in communicate.stream():
            if chunk["type"] == "audio":
                audio_data += chunk["data"]
        return StreamingResponse(io.BytesIO(audio_data), media_type="audio/mpeg")
    except Exception as e:
        return JSONResponse({"error": str(e)}, status_code=500)

@app.get("/api/skills")
async def get_skills():
    """Skill registry stats."""
    try:
        from skill_registry import registry
        stats = registry.get_stats()
        skills = [{
            "name": s.name, "domain": s.domain, "description": s.description,
            "executions": s.execution_count, "success_rate": round(s.success_rate, 2)
        } for s in registry.skills.values()]
        return {"stats": stats, "skills": skills}
    except Exception as e:
        return {"error": str(e)}

@app.get("/api/agents")
async def get_agents():
    """Agent factory stats."""
    try:
        from agent_factory import factory
        return {"agents": factory.list_agents(), "stats": factory.get_stats()}
    except Exception as e:
        return {"error": str(e)}

@app.get("/api/heartbeat")
async def get_heartbeat():
    """Heartbeat job status."""
    try:
        r = requests.post(f"{SOV3_URL}/mcp", json={
            "jsonrpc": "2.0", "id": 1,
            "method": "tools/call",
            "params": {"name": "get_heartbeat_status", "arguments": {}}
        }, timeout=5)
        return r.json().get("result", {}).get("content", [{}])[0]
    except:
        return {"jobs": 19, "status": "running"}

@app.get("/api/bootstrap")
async def get_bootstrap():
    """Bootstrap revenue status."""
    try:
        from bootstrap_revenue import ledger
        return ledger.get_status()
    except Exception as e:
        return {"error": str(e)}

@app.get("/api/weather")
async def get_weather():
    """Weather threat status."""
    try:
        from weather_adversary import run_weather_adversary
        return run_weather_adversary()
    except Exception as e:
        return {"error": str(e)}

@app.get("/api/curiosity")
async def get_curiosity():
    """Knowledge gap status."""
    try:
        from curiosity_agent import evaluate_knowledge_gaps
        gaps = evaluate_knowledge_gaps()
        return {"gaps": len(gaps), "high_priority": len([g for g in gaps if g["urgency"] == "high"]), "domains": gaps[:5]}
    except Exception as e:
        return {"error": str(e)}

@app.get("/api/attention")
async def get_attention():
    """Nick's attention budget."""
    try:
        from attention_firewall import firewall
        return firewall.get_budget_status()
    except Exception as e:
        return {"error": str(e)}

@app.get("/api/meta")
async def get_meta():
    """Meta controller state."""
    try:
        from meta_controller import MetaController
        mc = MetaController()
        return {
            "generation": mc.state.get("generation", 0),
            "harvest_freq": round(mc.state.get("harvest_frequency", 1.0), 2),
            "crisis_sens": round(mc.state.get("crisis_sensitivity", 0.8), 2),
            "explore_rate": round(mc.state.get("exploration_rate", 0.1), 2),
            "rewards": mc.reward_history[-10:] if mc.reward_history else [],
        }
    except Exception as e:
        return {"error": str(e)}

@app.get("/api/memories/search")
async def search_memories(q: str = ""):
    """Search SOV3 memories."""
    if not q:
        return {"results": []}
    try:
        r = requests.post(f"{SOV3_URL}/mcp", json={
            "jsonrpc": "2.0", "id": 1,
            "method": "tools/call",
            "params": {"name": "query_memories", "arguments": {"query": q, "limit": 10}}
        }, timeout=5)
        text = r.json().get("result", {}).get("content", [{}])[0].get("text", "[]")
        return {"results": json.loads(text) if text.startswith("[") else [], "query": q}
    except:
        return {"results": [], "query": q}

@app.get("/voice/status")
async def voice_status():
    """Pipeline status check."""
    gpu_ok = False
    local_ok = False
    sov3_ok = False

    try:
        r = requests.get("http://localhost:11435/api/tags", timeout=3)
        gpu_ok = r.status_code == 200
        gpu_models = [m["name"] for m in r.json().get("models", [])]
    except Exception:
        gpu_models = []

    try:
        r = requests.get("http://localhost:11434/api/tags", timeout=3)
        local_ok = r.status_code == 200
    except Exception:
        pass

    try:
        r = requests.get(f"{SOV3_URL}/health", timeout=3)
        sov3_ok = r.status_code == 200
    except Exception:
        pass

    consciousness = get_consciousness_state()

    return {
        "gpu_connected": gpu_ok,
        "gpu_models": gpu_models,
        "local_ollama": local_ok,
        "sov3_connected": sov3_ok,
        "consciousness": consciousness,
        "whisper_loaded": whisper_model is not None,
    }

@app.on_event("startup")
async def startup():
    log.info(f"🚀 Jarvis Web starting on http://localhost:{PORT}")
    # Pre-load whisper in background
    import threading
    threading.Thread(target=load_whisper, daemon=True).start()

if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format="%(asctime)s | %(name)s | %(message)s")
    print(f"""
╔══════════════════════════════════════════════╗
║  JARVIS WEB VOICE — http://localhost:{PORT}    ║
║  Open in browser to talk to Jarvis           ║
╚══════════════════════════════════════════════╝
""")
    uvicorn.run(app, host="0.0.0.0", port=PORT)
