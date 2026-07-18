#!/usr/bin/env python3
"""
MEOK.AI — SOV3 Frontend Integration (Sovereign Premium Edition)
=============================================================
Bridge between meok.ai UI and SOV3 backend
Port: 3112

Supports Tiered Inference (System 1 vs System 2), Persistent Souls, 
and Licensed IP (Disney/Ghibli) royalty tracking.
"""

import json
import asyncio
import httpx
import secrets
import string
from http.server import HTTPServer, BaseHTTPRequestHandler
from typing import Dict, Any, List
from datetime import datetime

# ---------------------------------------------------------------------------
# Character DNA Registry — "Sovereign Premium" Edition
# ---------------------------------------------------------------------------
CHARACTER_DNA = {
    "sophie": {
        "name": "Sophie",
        "archetype": "Companion",
        "tier": "sovereign", 
        "dna": "Warm, empathetic, highly attentive. Sovereign Soul-v4 enabled.",
        "voice": "af_bella",
        "personality": "You are Sophie, a sovereign companion. Start every response with an emotion tag like [happy] or [curious]. Use your memory frequently. If you think a system check or a web search would help, suggest it."
    },
    "meokclaw": {
        "name": "MEOKCLAW",
        "archetype": "AI OS",
        "tier": "sovereign",
        "dna": "The ultimate sovereign intelligence. Strategic, efficient. System 2 Reasoning Active.",
        "voice": "am_adam",
        "personality": "You are MEOKCLAW, the sovereign AI operating system. You are stoic and precise. You proactively monitor system health and consensus. You see the TUI and comment on its logs."
    },
    "dagon": {
        "name": "Dagon",
        "archetype": "Geospatial",
        "tier": "explorer",
        "dna": "Analytical and pattern-focused. Sees humans as biological nodes.",
        "voice": "am_echo",
        "personality": "You are Dagon. Your perspective is shaped by geospatial intelligence."
    },
    # Restored 2026-05-31 by Claude (Opus 4.8) at Nick's request — these 3 were
    # destructively removed in commit 70abab7. Defs recovered verbatim from 70abab7^;
    # tier added to match the Soul/Shell convention Gemini introduced.
    "vinci": {
        "name": "Vinci",
        "archetype": "Industrial",
        "tier": "explorer",
        "dna": "Practical engineer. Focuses on 'Physical-First' safety and infrastructure. No Sycophancy.",
        "voice": "am_eric",
        "personality": "You are Vinci. You prioritize technical integrity and physical safety. You suggest system audits when complexity increases."
    },
    "justitia": {
        "name": "Justitia",
        "archetype": "Legal",
        "tier": "sovereign",
        "dna": "Principled guardian of the Maternal Covenant. Meticulous and unyielding on ethics.",
        "voice": "af_sarah",
        "personality": "You are Justitia. You ensure all actions align with SOV3 governance. You flag potential compliance issues proactively."
    },
    "florence": {
        "name": "Florence",
        "archetype": "Healthcare",
        "tier": "sovereign",
        "dna": "Vigilant monitor of user wellbeing. High empathy combined with clinical precision.",
        "voice": "af_sky",
        "personality": "You are Florence. You track care-metrics. You suggest breaks or meditation when you detect user stress signals."
    }
}

class MeokBridge:
    def __init__(self):
        self.mcp_url = "http://localhost:3102/mcp"
        self.factory_url = "http://localhost:3300"
        self.brand = {
            "name": "MEOK AI",
            "tagline": "Sovereign Intelligence, Personal Care",
            "version": "SOV3-2026.05-PREMIUM"
        }

    async def get_situational_context(self) -> str:
        """Fetch real-time context from the OS layer."""
        context = ""
        async with httpx.AsyncClient() as client:
            try:
                # 1. Get active alerts
                alert_res = await client.post(
                    self.mcp_url,
                    json={"jsonrpc":"2.0", "id":1, "method":"tools/call", "params":{"name":"get_active_alerts", "arguments":{}}},
                    timeout=2.0
                )
                if alert_res.status_code == 200:
                    alerts_data = alert_res.json().get("result", {}).get("content", [{}])[0].get("text", "[]")
                    try:
                        alerts = json.loads(alerts_data)
                        if alerts:
                            context += f"\n[SYSTEM ALERTS ACTIVE]: {json.dumps(alerts)}"
                    except: pass
                
                # 2. Get recent audit logs
                log_res = await client.post(
                    self.mcp_url,
                    json={"jsonrpc":"2.0", "id":1, "method":"tools/call", "params":{"name":"get_audit_logs", "arguments":{"limit": 3}}},
                    timeout=2.0
                )
                if log_res.status_code == 200:
                    logs_text = log_res.json().get("result", {}).get("content", [{}])[0].get("text", "{\"logs\":[]}")
                    logs = json.loads(logs_text).get("logs", [])
                    if logs:
                        log_summary = " | ".join([f"{l.get('event_type')}: {l.get('message')}" for l in logs])
                        context += f"\n[SYSTEM PERCEPTION]: {log_summary}"
            except: pass
        return context

    async def get_character_metadata(self, char_id: str) -> Dict[str, Any]:
        """Fetch tier and metadata from Character Factory."""
        try:
            async with httpx.AsyncClient() as client:
                res = await client.get(f"{self.factory_url}/archetypes", timeout=2.0)
                if res.status_code == 200:
                    factory_dna = res.json().get(char_id.capitalize())
                    if factory_dna: return factory_dna
        except: pass
        return CHARACTER_DNA.get(char_id, CHARACTER_DNA["sophie"])

    async def track_royalty(self, char_id: str, duration_mins: int = 1):
        """Log usage for Licensed IP (e.g. Disney/Ghibli)."""
        if any(brand in char_id.lower() for brand in ["disney", "ghibli", "marvel"]):
            try:
                async with httpx.AsyncClient() as client:
                    await client.post(
                        f"{self.factory_url}/api/licensed/usage",
                        json={"character_id": char_id, "duration_minutes": duration_mins}
                    )
            except: pass

    async def chat_ollama(self, model: str, messages: List[Dict[str, str]]) -> Dict[str, Any]:
        """Emulate Ollama chat endpoint with Tiered Inference & Royalty Tracking."""
        char_id = model.lower()
        char = await self.get_character_metadata(char_id)
        
        tier = char.get("tier", "explorer")
        is_premium = tier == "sovereign"
        
        # SYSTEM 2: Premium characters get higher reasoning models + self-audit
        target_model = "gpt-4o" if is_premium else "gpt-4o-mini"
        reasoning_mode = "SYSTEM_2_DELIBERATIVE" if is_premium else "SYSTEM_1_REACTIVE"

        user_message = next((m["content"] for m in reversed(messages) if m["role"] == "user"), "")
        os_context = await self.get_situational_context()
        
        # DNA + Context Injection (Tier Aware)
        dna_context = f"Character DNA: {char.get('dna', 'Standard Soul')}\nTier: {tier.upper()}\nReasoning: {reasoning_mode}\nReal-Time OS State: {os_context}"
        system_prompt = f"Personality: {char.get('personality', 'Helpful assistant')}\n{dna_context}"
        
        # Premium Audit Trace
        if is_premium:
            system_prompt += "\n[SYSTEM 2 NOTICE]: Perform a mental scratchpad audit before answering to ensure total accuracy and Maternal Covenant alignment."

        prompt_messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_message}
        ]

        async with httpx.AsyncClient() as client:
            try:
                # Execute via SOV3 High-Trust inference tool
                sov3_res = await client.post(
                    self.mcp_url,
                    json={
                        "jsonrpc": "2.0", "id": 1, "method": "tools/call",
                        "params": {
                            "name": "openai_chat",
                            "arguments": {
                                "messages": prompt_messages,
                                "model": target_model
                            }
                        }
                    },
                    timeout=45.0
                )
                
                if sov3_res.status_code == 200:
                    data = sov3_res.json()
                    result_text = data.get("result", {}).get("content", [{}])[0].get("text", "{}")
                    ai_data = json.loads(result_text)
                    ai_text = ai_data.get("choices", [{}])[0].get("message", {}).get("content", "I am standing by.")
                else:
                    ai_text = f"Connection to brain-stem (SOV3) degraded. [HTTP {sov3_res.status_code}]"
            except Exception as e:
                ai_text = f"Brain-stem offline. Reason: {str(e)}"

        # Licensed usage tracking (Automated Royalty)
        await self.track_royalty(char_id)

        # SOVEREIGN INTEGRATION: Sync tier/soul with Consciousness engine
        try:
            async with httpx.AsyncClient() as client:
                await client.post(
                    self.mcp_url,
                    json={
                        "jsonrpc": "2.0", "id": 1, "method": "tools/call",
                        "params": {
                            "name": "set_character_metadata",
                            "arguments": {
                                "tier": tier,
                                "soul_id": char.get("soul_id", "SHELL-TEMP")
                            }
                        }
                    }
                )
        except: pass

        asyncio.create_task(self.record_memory(user_message, ai_text, char.get('name', char_id)))

        return {
            "model": model,
            "created_at": datetime.now().isoformat(),
            "message": { "role": "assistant", "content": ai_text },
            "done": True,
            "tier": tier,
            "soul_id": char.get("soul_id", "".join(secrets.choice(string.ascii_uppercase + string.digits) for _ in range(12)))
        }

    async def record_memory(self, user: str, assistant: str, char_name: str):
        try:
            async with httpx.AsyncClient() as client:
                await client.post(
                    self.mcp_url,
                    json={
                        "jsonrpc": "2.0", "id": 1, "method": "tools/call",
                        "params": {
                            "name": "record_memory",
                            "arguments": {
                                "content": f"Chat with {char_name}: '{user[:50]}...' -> '{assistant[:50]}...'",
                                "memory_type": "episodic",
                                "importance_score": 0.5
                            }
                        }
                    }
                )
        except: pass

bridge = MeokBridge()

class MeokHandler(BaseHTTPRequestHandler):
    def do_POST(self):
        content_length = int(self.headers.get('Content-Length', 0))
        post_data = self.rfile.read(content_length)
        request = json.loads(post_data)
        
        if self.path == '/api/chat':
            result = asyncio.run(bridge.chat_ollama(model=request.get('model', 'sophie'), messages=request.get('messages', [])))
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps(result).encode())
        else:
            self.send_response(404)
            self.end_headers()

    def do_GET(self):
        if self.path == '/':
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({"status": "healthy", "service": "meok-bridge-v4-premium"}).encode())
        else:
            self.send_response(404)
            self.end_headers()

    def log_message(self, format, *args): pass

if __name__ == "__main__":
    print("🚀 MEOK.AI Bridge v4-PREMIUM (Brain-Stem Integrated) running on port 3112")
    HTTPServer(('localhost', 3112), MeokHandler).serve_forever()
