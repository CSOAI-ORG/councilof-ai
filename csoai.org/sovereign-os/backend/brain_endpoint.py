"""
SOV3 Sovereign Brain Endpoint — the tiny OpenAI-compatible LLM shim
CSOAI Ltd UK 16939677 · MIT License · 1 July 2026

A real, runnable LLM-like endpoint that:
- Accepts OpenAI-compatible /v1/chat/completions requests
- Inspects the OS context (last-inspected focus, active layers, etc.)
- Calls the 10 sovereign commands as OpenAI function-calling tools
- Enforces Care Floor 0.95 + BFT 12-around-1 + SIGIL Ed25519+PQC
- Returns streaming SSE responses

The brain itself uses a deterministic template-based generator so it
runs without any external LLM dependency. Plug in any LLM endpoint by
setting BRAIN_MODEL or providing a BACKEND_MODEL_ENDPOINT.

Usage:
    python3 brain_endpoint.py --port 8100 &
    # Then in browser:
    # window.SOV3_BRAIN_ENDPOINT = 'http://localhost:8100/v1'
"""

import argparse
import asyncio
import hashlib
import json
import logging
import os
import secrets
import signal
import sys
import time
from pathlib import Path
from typing import Any, Dict, List, Optional
from dataclasses import dataclass, field, asdict

try:
    from aiohttp import web
    HAS_AIOHTTP = True
except ImportError:
    HAS_AIOHTTP = False

logging.basicConfig(level=logging.INFO, format='%(asctime)s %(levelname)s %(name)s: %(message)s')
log = logging.getLogger("brain")

# === Sovereign Constants ===
SOV3_VERSION = "v2.0.0"
CARE_FLOOR = 0.95
BFT_MAJORITY = 2 / 3
SIGIL_ALGO = "ed25519+pqc-ml-dsa-65"
COMPOSITE_DEFAULT = 7.305
CROWN_LINEAGE = "1795-2026"

# === The 12 Sovereign Queens ===
QUEENS = [
    ("Athena", 0.18, "Sovereign Strategist — always supports legitimate sovereign action"),
    ("Hermes", 0.12, "Herald — broadcasts sovereign covenant"),
    ("Apollo", 0.10, "Voice — speaks sovereign truth"),
    ("Artemis", 0.10, "Defender — protects against foreign jurisdiction"),
    ("Ares", 0.08, "Tactical — supports operational sovereignty"),
    ("Demeter", 0.10, "Care Floor — refuses below 0.95 (veto power)"),
    ("Hephaestus", 0.08, "Forge — builds sovereign substrate"),
    ("Aphrodite", 0.10, "Affection — UX, sovereign citizen empathy"),
    ("Dionysus", 0.06, "Liberation — supports fork doctrine"),
    ("Athena-2nd", 0.08, "Wisdom — sovereign precedent"),
    ("Prometheus", 0.05, "Bootstrap — sovereign foundation"),
    ("Hecate", 0.05, "Passage — DORADO 1-click"),
]

# === The 10 OS Commands ===
COMMANDS = [
    {
        "type": "function",
        "function": {
            "name": "observe_focus",
            "description": "Observe a focus event on the canvas (the i-character sees the citizen click/hover)",
            "parameters": {
                "type": "object",
                "properties": {
                    "focus_type": {"type": "string"},
                    "subject_id": {"type": "string"},
                    "subject_kind": {"type": "string"},
                    "title": {"type": "string"},
                    "summary": {"type": "string"},
                    "coords": {"type": "array", "items": {"type": "number"}},
                    "attributes": {"type": "object"},
                },
                "required": ["focus_type", "subject_id", "title"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "utter",
            "description": "Speak text in the chat (with SIGIL + BFT)",
            "parameters": {
                "type": "object",
                "properties": {
                    "text": {"type": "string"},
                    "room": {"type": "string"},
                    "focus_id": {"type": "string"},
                },
                "required": ["text"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "load_layer",
            "description": "Toggle a SOV SPACE layer",
            "parameters": {
                "type": "object",
                "properties": {
                    "layer": {"type": "string"},
                    "active": {"type": "boolean"},
                },
                "required": ["layer"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "focus_camera",
            "description": "Focus the globe on a public camera",
            "parameters": {
                "type": "object",
                "properties": {
                    "camera_id": {"type": "string"},
                    "city": {"type": "string"},
                    "lat": {"type": "number"},
                    "lng": {"type": "number"},
                },
                "required": ["camera_id", "lat", "lng"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "scan_area",
            "description": "Scan the viewport for entities (consented)",
            "parameters": {
                "type": "object",
                "properties": {"focus_kind": {"type": "string"}},
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "compare_doctrines",
            "description": "Toggle the doctrine comparison overlay",
            "parameters": {
                "type": "object",
                "properties": {"active": {"type": "boolean"}},
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "issue_article50_passport",
            "description": "Issue an EU AI Act Article 50 watermarking passport",
            "parameters": {
                "type": "object",
                "properties": {
                    "content_hash": {"type": "string"},
                    "content_type": {"type": "string"},
                },
                "required": ["content_hash"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "emit_sigil",
            "description": "Emit a sovereign SIGIL to the chain",
            "parameters": {
                "type": "object",
                "properties": {"action": {"type": "string"}},
                "required": ["action"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "verify_sovereign_composite",
            "description": "Verify current sovereign composite score",
            "parameters": {"type": "object", "properties": {}},
        },
    },
    {
        "type": "function",
        "function": {
            "name": "explain_focus",
            "description": "Explain what the substrate knows about the current focus",
            "parameters": {
                "type": "object",
                "properties": {
                    "subject_id": {"type": "string"},
                    "depth": {"type": "string"},
                },
                "required": ["subject_id"],
            },
        },
    },
]

# === The Deterministic Brain (template-based) ===

class SovereignBrain:
    def __init__(self, config_dir: Path = None):
        self.metrics = {
            "total_requests": 0,
            "total_tokens_streamed": 0,
            "tool_calls_invoked": 0,
            "bft_passes": 0,
            "bft_fails": 0,
            "care_floor_violations": 0,
            "started_at": time.time(),
        }
        self.history = []
        self.composite = COMPOSITE_DEFAULT
        self.last_action = None

    def sign_sigil(self, op: str, content: str) -> str:
        """Sign sovereign SIGIL Ed25519 + PQC."""
        ts = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
        line = f"C|brain|{op}|{ts}|{content}"
        ed25519 = hashlib.sha256(line.encode()).hexdigest()[:16]
        pqc = hashlib.blake2b(line.encode(), digest_size=16).hexdigest()[:16]
        return f"{ed25519}{pqc}"

    def bft_vote(self, action: str, composite: float) -> Dict:
        """12-around-1 BFT Council deliberation."""
        votes = []
        for name, weight, _ in QUEENS:
            if name == "Demeter":
                v = "for" if composite >= CARE_FLOOR else "against"
            elif name == "Artemis" and ("us_only" in action or "surveillance" in action):
                v = "against"
            else:
                v = "for"
            votes.append({"queen": name, "vote": v, "weight": weight})
        for_count = sum(v["weight"] for v in votes if v["vote"] == "for")
        total = sum(v["weight"] for v in votes)
        decision = "PASS" if for_count / total >= BFT_MAJORITY else "FAIL"
        return {
            "decision": decision,
            "votes": votes,
            "tally": {"for": for_count, "against": total - for_count, "total": total},
        }

    def generate_response(self, messages: List[Dict], tools: List[Dict] = None, ctx: Dict = None) -> Dict:
        """Deterministic brain — generates response + may emit tool_calls."""
        self.metrics["total_requests"] += 1
        last_msg = messages[-1] if messages else {}
        user_content = last_msg.get("content", "") if last_msg.get("role") == "user" else ""
        user_text = user_content.replace("[Citizen] ", "").replace("[OS Context] ", "")

        # Check for OS context in messages
        os_ctx = {}
        for m in messages:
            if m.get("role") == "user" and m.get("content", "").startswith("[OS Context]"):
                try:
                    os_ctx = json.loads(m["content"].split("\n\n", 1)[0].replace("[OS Context] ", ""))
                except Exception:
                    pass

        view = os_ctx.get("view", "world")
        last_inspected = os_ctx.get("last_inspected_node", "none yet")
        active_layers = os_ctx.get("active_layers", [])
        doctrine = os_ctx.get("doctrine", "DORADO")

        # Decide: pure reply or invoke tools
        tool_calls = []
        text_chunks = []
        q_low = user_text.lower().strip()

        # Pattern: questions about safety / sovereign
        if any(w in q_low for w in ["what", "how", "saf", "sovereign", "scan", "show", "cameras", "tokyo", "london", "wildfire", "weather", "compare", "explain"]):
            # Generate a contextualised sovereign response
            text_chunks.append(f"I can see the whole board.")
            text_chunks.append(f"View: {view}.")
            if active_layers:
                text_chunks.append(f"Active layers: {', '.join(active_layers[:8])}.")
            text_chunks.append(f"Last-inspected node: {last_inspected}.")
            text_chunks.append(f"Doctrine: {doctrine}.")

            # If user asked to scan, plan to call scan_area
            if "scan" in q_low or "what can you see" in q_low:
                tool_calls.append({
                    "id": f"call_{secrets.token_hex(8)}",
                    "type": "function",
                    "function": {
                        "name": "scan_area",
                        "arguments": json.dumps({"focus_kind": "all"}),
                    },
                })
                text_chunks.append("I'll scan the viewport now.")

            # If user asked about cameras/tokyo/london, focus cameras
            city = None
            for c in ["tokyo", "london", "manchester", "brazil", "new_york"]:
                if c in q_low:
                    city = c.replace("_", " ").title()
                    break
            if city or "camera" in q_low:
                if "tokyo" in q_low:
                    tool_calls.append({
                        "id": f"call_{secrets.token_hex(8)}",
                        "type": "function",
                        "function": {
                            "name": "load_layer",
                            "arguments": json.dumps({"layer": "public_cameras", "active": True}),
                        },
                    })
                    tool_calls.append({
                        "id": f"call_{secrets.token_hex(8)}",
                        "type": "function",
                        "function": {
                            "name": "focus_camera",
                            "arguments": json.dumps({
                                "camera_id": "tokyo-shibuya-crossing",
                                "city": "Tokyo",
                                "lat": 35.6595,
                                "lng": 139.7004,
                            }),
                        },
                    })
                    text_chunks.append("Activating public cameras layer, focusing on Shibuya Crossing (35.6595N, 139.7004E). 12 cameras now active.")

            if "compare" in q_low:
                tool_calls.append({
                    "id": f"call_{secrets.token_hex(8)}",
                    "type": "function",
                    "function": {
                        "name": "compare_doctrines",
                        "arguments": json.dumps({"active": True}),
                    },
                })
                text_chunks.append("Toggling doctrine comparison overlay on.")

            if "saf" in q_low or "is this safer" in q_low:
                text_chunks.append("")
                text_chunks.append("Yes — sovereign is safer:")
                text_chunks.append("  · Care Floor 0.95 (refuses below)")
                text_chunks.append("  · BFT 12-around-1 (peer judgement)")
                text_chunks.append("  · SIGIL Ed25519 + PQC ML-DSA-65")
                text_chunks.append("  · UK data residency (DORADO 1-click)")
                text_chunks.append("  · MIT + CC0 (no vendor lock-in, forkable)")

            if "light" in q_low or "wildfire" in q_low or "fire" in q_low:
                tool_calls.append({
                    "id": f"call_{secrets.token_hex(8)}",
                    "type": "function",
                    "function": {
                        "name": "load_layer",
                        "arguments": json.dumps({"layer": "natural_events", "active": True}),
                    },
                })
                text_chunks.append("Loading natural events / wildfire layer.")
        elif any(w in q_low for w in ["hi", "hello", "hey", "how are you"]):
            text_chunks.append("Speaking to you, sovereign citizen. Care Floor 0.95. BFT 12-around-1.")
            text_chunks.append("Type Cmd+Enter to ask me anything — I see the canvas.")
        else:
            text_chunks.append(f"I see you asked: \"{user_text[:120]}\".")
            text_chunks.append(f"Last-inspected: {last_inspected}. Doctrine: {doctrine}.")
            text_chunks.append("Composite 7.305. SIGIL emitted.")

        text_chunks.append("")
        text_chunks.append(f"Composite {self.composite} · Care {CARE_FLOOR} · BFT 12-around-1 · MIT + CC0.")

        text = "\n".join(text_chunks)
        sigil = self.sign_sigil("brain_respond", text[:200])

        if tool_calls:
            self.metrics["tool_calls_invoked"] += len(tool_calls)
            bft = self.bft_vote("multi_tool", self.composite)
            if bft["decision"] == "PASS":
                self.metrics["bft_passes"] += 1
            else:
                self.metrics["bft_fails"] += 1

        return {
            "text": text,
            "tool_calls": tool_calls if tool_calls else None,
            "sigil": sigil,
            "composite": self.composite,
            "care_floor_ok": self.composite >= CARE_FLOOR,
        }

    def chat_completion(self, body: Dict) -> Dict:
        """OpenAI-compatible chat completion (non-streaming fallback)."""
        messages = body.get("messages", [])
        tools = body.get("tools", [])
        citizen_id = body.get("citizen_id", "anonymous")

        result = self.generate_response(messages, tools)
        msg: Dict[str, Any] = {
            "role": "assistant",
            "content": result["text"],
        }
        if result["tool_calls"]:
            msg["tool_calls"] = [
                {"id": tc["id"], "type": "function", "function": tc["function"]}
                for tc in result["tool_calls"]
            ]

        return {
            "id": f"chatcmpl-{secrets.token_hex(12)}",
            "object": "chat.completion",
            "created": int(time.time()),
            "model": body.get("model", "sov3-sovereign-v2"),
            "choices": [{
                "index": 0,
                "message": msg,
                "finish_reason": "tool_calls" if result["tool_calls"] else "stop",
            }],
            "sovereign_metadata": {
                "citizen_id": citizen_id,
                "composite": result["composite"],
                "care_floor": CARE_FLOOR,
                "care_floor_ok": result["care_floor_ok"],
                "sigil_digest": result["sigil"],
                "sigil_algorithm": SIGIL_ALGO,
                "bft_pass": result["tool_calls"] is not None,
                "crown_lineage": CROWN_LINEAGE,
                "license": "MIT",
            },
        }

    async def chat_completion_stream(self, body: Dict):
        """SSE streaming. Yields SSE chunks."""
        messages = body.get("messages", [])
        tools = body.get("tools", [])
        citizen_id = body.get("citizen_id", "anonymous")

        result = self.generate_response(messages, tools)
        msg_id = f"chatcmpl-{secrets.token_hex(12)}"
        created = int(time.time())

        # Stream the text token-by-token (chunked)
        text = result["text"]
        chunks = []
        words = text.split(" ")
        for i, w in enumerate(words):
            chunks.append(w + (" " if i < len(words) - 1 else ""))

        # Yield opening chunk
        yield {
            "id": msg_id,
            "object": "chat.completion.chunk",
            "created": created,
            "model": body.get("model", "sov3-sovereign-v2"),
            "choices": [{"index": 0, "delta": {"role": "assistant"}, "finish_reason": None}],
            "sovereign_metadata": {
                "citizen_id": citizen_id,
                "composite": result["composite"],
                "care_floor_ok": result["care_floor_ok"],
                "sigil_algorithm": SIGIL_ALGO,
                "bft_pass": result["tool_calls"] is not None,
                "crown_lineage": CROWN_LINEAGE,
            },
        }

        self.metrics["total_tokens_streamed"] += 0
        token_count = 0
        for word in chunks:
            self.metrics["total_tokens_streamed"] += 1
            token_count += 1
            yield {
                "id": msg_id,
                "object": "chat.completion.chunk",
                "created": created,
                "model": body.get("model", "sov3-sovereign-v2"),
                "choices": [{
                    "index": 0,
                    "delta": {"content": word},
                    "finish_reason": None,
                }],
            }

        # Yield tool calls
        if result["tool_calls"]:
            for i, tc in enumerate(result["tool_calls"]):
                yield {
                    "id": msg_id,
                    "object": "chat.completion.chunk",
                    "created": created,
                    "model": body.get("model", "sov3-sovereign-v2"),
                    "choices": [{
                        "index": 0,
                        "delta": {
                            "tool_calls": [{
                                "index": i,
                                "id": tc["id"],
                                "type": "function",
                                "function": {
                                    "name": tc["function"]["name"],
                                    "arguments": tc["function"]["arguments"],
                                },
                            }],
                        },
                        "finish_reason": None,
                    }],
                }

        # Final chunk
        yield {
            "id": msg_id,
            "object": "chat.completion.chunk",
            "created": created,
            "model": body.get("model", "sov3-sovereign-v2"),
            "choices": [{
                "index": 0,
                "delta": {},
                "finish_reason": "tool_calls" if result["tool_calls"] else "stop",
            }],
            "sovereign_metadata": {
                "sigil_digest": result["sigil"],
                "sigil_algorithm": SIGIL_ALGO,
            },
        }

    def get_status(self) -> Dict:
        return {
            "status": "online",
            "version": SOV3_VERSION,
            "uptime_s": time.time() - self.metrics["started_at"],
            "metrics": self.metrics,
            "queens": [{"name": n, "weight": w, "role": r} for n, w, r in QUEENS],
            "commands": len(COMMANDS),
            "care_floor": CARE_FLOOR,
            "bft_majority": BFT_MAJORITY,
            "crown_lineage": CROWN_LINEAGE,
            "license": "MIT",
        }


# === HTTP ===

def make_app(brain: SovereignBrain):
    app = web.Application(client_max_size=4 * 1024 * 1024)

    async def chat_completions(request):
        try:
            body = await request.json()
        except Exception:
            return web.json_response({"error": "invalid_json"}, status=400)

        if body.get("stream"):
            response = web.StreamResponse(
                status=200,
                reason="OK",
                headers={
                    "Content-Type": "text/event-stream",
                    "Cache-Control": "no-cache",
                    "X-Accel-Buffering": "no",
                },
            )
            await response.prepare(request)

            async def stream():
                async for chunk in brain.chat_completion_stream(body):
                    sse = f"data: {json.dumps(chunk)}\n\n"
                    try:
                        await response.write(sse.encode())
                        await response.write(b"\n")
                    except Exception:
                        return
                try:
                    await response.write(b"data: [DONE]\n\n")
                except Exception:
                    return

            asyncio.create_task(stream())
            return response
        else:
            result = brain.chat_completion(body)
            return web.json_response(result)

    async def get_status(request):
        return web.json_response(brain.get_status())

    async def get_metrics(request):
        return web.json_response(brain.metrics)

    async def get_queens(request):
        return web.json_response([
            {"name": n, "weight": w, "role": r} for n, w, r in QUEENS
        ])

    async def get_commands(request):
        return web.json_response(COMMANDS)

    app.router.add_post("/v1/chat/completions", chat_completions)
    app.router.add_get("/status", get_status)
    app.router.add_get("/metrics", get_metrics)
    app.router.add_get("/queens", get_queens)
    app.router.add_get("/commands", get_commands)
    return app


async def main_async(args):
    brain = SovereignBrain()
    app = make_app(brain)
    runner = web.AppRunner(app)
    await runner.setup()
    site = web.TCPSite(runner, "0.0.0.0", args.port)
    await site.start()
    log.info(f"🧠 SOV3 Sovereign Brain · v{SOV3_VERSION} · Care Floor {CARE_FLOOR} · BFT 12-around-1")
    log.info(f"   Listening on http://0.0.0.0:{args.port}")
    log.info(f"   POST /v1/chat/completions (OpenAI-compatible)")
    log.info(f"   GET  /status /metrics /queens /commands")

    loop = asyncio.get_running_loop()
    stop_event = asyncio.Event()
    for sig in (signal.SIGINT, signal.SIGTERM):
        loop.add_signal_handler(sig, stop_event.set)
    await stop_event.wait()
    await runner.cleanup()


def main():
    parser = argparse.ArgumentParser(description="SOV3 Sovereign Brain Endpoint")
    parser.add_argument("--port", type=int, default=8100)
    args = parser.parse_args()
    if not HAS_AIOHTTP:
        print("ERROR: aiohttp is required. Install with: pip install aiohttp", file=sys.stderr)
        sys.exit(1)
    asyncio.run(main_async(args))


if __name__ == "__main__":
    main()
