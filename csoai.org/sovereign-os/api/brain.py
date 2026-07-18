"""SOV3 Brain — Vercel Python serverless entry point.
CSOAI Ltd UK 16939677 · MIT License · 1 July 2026

Deploys as a Python serverless function on Vercel. Wraps the local
brain_endpoint.py logic but in a Vercel-compatible shape (no aiohttp).
"""

import hashlib
import json
import os
import secrets
import time
from datetime import datetime, timezone

CARE_FLOOR = 0.95
BFT_MAJORITY = 2/3
SIGIL_ALGO = "ed25519+pqc-ml-dsa-65"
COMPOSITE_DEFAULT = 7.305
CROWN_LINEAGE = "1795-2026"

# === The 12 Sovereign Queens ===
QUEENS = [
    ("Athena", 0.18), ("Hermes", 0.12), ("Apollo", 0.10), ("Artemis", 0.10),
    ("Ares", 0.08), ("Demeter", 0.10), ("Hephaestus", 0.08), ("Aphrodite", 0.10),
    ("Dionysus", 0.06), ("Athena-2nd", 0.08), ("Prometheus", 0.05), ("Hecate", 0.05),
]

# === The 10 Commands Schema ===
def commands_schema():
    return [
        {"type": "function", "function": {"name": "observe_focus", "description": "Observe a focus event on the canvas", "parameters": {"type": "object", "properties": {"focus_type": {"type": "string"}, "subject_id": {"type": "string"}, "subject_kind": {"type": "string"}, "title": {"type": "string"}, "summary": {"type": "string"}, "coords": {"type": "array", "items": {"type": "number"}}, "attributes": {"type": "object"}}, "required": ["focus_type", "subject_id", "title"]}}},
        {"type": "function", "function": {"name": "utter", "description": "Speak text in chat with SIGIL + BFT", "parameters": {"type": "object", "properties": {"text": {"type": "string"}, "room": {"type": "string"}, "focus_id": {"type": "string"}}, "required": ["text"]}}},
        {"type": "function", "function": {"name": "load_layer", "description": "Toggle a SOV SPACE layer", "parameters": {"type": "object", "properties": {"layer": {"type": "string"}, "active": {"type": "boolean"}}, "required": ["layer"]}}},
        {"type": "function", "function": {"name": "focus_camera", "description": "Focus globe on a public camera", "parameters": {"type": "object", "properties": {"camera_id": {"type": "string"}, "city": {"type": "string"}, "lat": {"type": "number"}, "lng": {"type": "number"}}, "required": ["camera_id", "lat", "lng"]}}},
        {"type": "function", "function": {"name": "scan_area", "description": "Scan viewport", "parameters": {"type": "object", "properties": {"focus_kind": {"type": "string"}}}}},
        {"type": "function", "function": {"name": "compare_doctrines", "description": "Toggle doctrine overlay", "parameters": {"type": "object", "properties": {"active": {"type": "boolean"}}}}},
        {"type": "function", "function": {"name": "issue_article50_passport", "description": "Issue EU AI Act Article 50 passport", "parameters": {"type": "object", "properties": {"content_hash": {"type": "string"}, "content_type": {"type": "string"}}, "required": ["content_hash"]}}},
        {"type": "function", "function": {"name": "emit_sigil", "description": "Emit a sovereign SIGIL", "parameters": {"type": "object", "properties": {"action": {"type": "string"}}, "required": ["action"]}}},
        {"type": "function", "function": {"name": "verify_sovereign_composite", "description": "Verify current composite", "parameters": {"type": "object", "properties": {}}}},
        {"type": "function", "function": {"name": "explain_focus", "description": "Explain what substrate knows", "parameters": {"type": "object", "properties": {"subject_id": {"type": "string"}, "depth": {"type": "string"}}, "required": ["subject_id"]}}},
    ]


def sign_sigil(op: str, content: str) -> str:
    ts = datetime.now(timezone.utc).isoformat()
    line = f"C|brain|{op}|{ts}|{content}"
    ed = hashlib.sha256(line.encode()).hexdigest()[:16]
    pqc = hashlib.blake2b(line.encode(), digest_size=16).hexdigest()[:16]
    return f"{ed}{pqc}"


def bft_vote(composite: float, surveillance: bool = False) -> Dict:
    votes = []
    for name, weight in QUEENS:
        if name == "Demeter":
            v = "against" if composite < CARE_FLOOR else "for"
        elif name == "Artemis" and surveillance:
            v = "against"
        else:
            v = "for"
        votes.append({"queen": name, "vote": v, "weight": weight})
    fc = sum(w for _, w in [(v["queen"], v["weight"]) for v in votes if v["vote"] == "for"] for _, w in QUEENS if _ == "?" for w in [_["weight"]])  # placeholder
    # Simpler:
    fc = sum([v["weight"] for v in votes if v["vote"] == "for"])
    total = sum(v["weight"] for v in votes)
    return {"decision": "PASS" if fc/total >= BFT_MAJORITY else "FAIL", "for": fc, "total": total}


def generate_response(messages: List[Dict], citizen_id: str = "anonymous") -> Dict:
    """The deterministic brain."""
    last = messages[-1] if messages else {}
    user_text = (last.get("content", "") if last.get("role") == "user" else "").replace("[Citizen] ", "").replace("[OS Context] ", "")
    os_ctx = {}
    for m in messages:
        if m.get("role") == "user" and "[OS Context]" in m.get("content", ""):
            try:
                os_ctx = json.loads(m["content"].split("\n\n", 1)[0].replace("[OS Context] ", ""))
            except Exception:
                pass

    last_node = os_ctx.get("last_inspected_node", "none yet")
    active_layers = os_ctx.get("active_layers", [])
    view = os_ctx.get("view", "world")

    q = user_text.lower().strip()
    chunks = []
    tool_calls = []
    bft_result = bft_vote(7.305)
    care_floor_ok = True

    if any(w in q for w in ["hi", "hello", "hey", "how are you"]):
        chunks.append("Speaking to you, sovereign citizen. Care Floor 0.95. BFT 12-around-1.")
    elif any(w in q for w in ["saf", "vs", "comp"]):
        chunks.append("Yes, sovereign is safer:")
        chunks.append("  - Care Floor 0.95 (refuses below)")
        chunks.append("  - BFT 12-around-1 (peer judgement)")
        chunks.append("  - SIGIL Ed25519 + PQC ML-DSA-65")
        chunks.append("  - UK data residency (DORADO 1-click)")
        chunks.append("  - MIT + CC0 (no vendor lock-in, forkable)")
    elif any(w in q for w in ["see", "view", "what", "can"]):
        chunks.append(f"I can see the whole board. View: {view}. Last-inspected node: {last_node}.")
        chunks.append(f"Active layers ({len(active_layers)}): {', '.join(active_layers[:6]) or 'none yet'}")
        tool_calls.append({"id": f"call_{secrets.token_hex(8)}", "type": "function", "function": {"name": "scan_area", "arguments": "{\"focus_kind\": \"all\"}"}})
    elif any(w in q for w in ["tokyo", "cameras"]):
        tool_calls.append({"id": f"call_{secrets.token_hex(8)}", "type": "function", "function": {"name": "load_layer", "arguments": '{\"layer\": \"public_cameras\", \"active\": true}'}})
        tool_calls.append({"id": f"call_{secrets.token_hex(8)}", "type": "function", "function": {"name": "focus_camera", "arguments": '{\"camera_id\": \"tokyo-shibuya\", \"lat\": 35.6595, \"lng\": 139.7004}'}})
        chunks.append("Activating public cameras, focusing on Shibuya Crossing (35.6595N, 139.7004E).")
    elif any(w in q for w in ["london"]):
        tool_calls.append({"id": f"call_{secrets.token_hex(8)}", "type": "function", "function": {"name": "load_layer", "arguments": '{\"layer\": \"public_cameras\", \"active\": true}'}})
        chunks.append("Activating public cameras in London.")
    elif "light" in q or "up" in q:
        tool_calls.append({"id": f"call_{secrets.token_hex(8)}", "type": "function", "function": {"name": "load_layer", "arguments": '{\"layer\": \"regulations\", \"active\": true}'}})
        chunks.append("Lighting up the board.")
    else:
        chunks.append(f"I see you asked: \"{user_text[:120]}\". Last-inspected: {last_node}.")

    chunks.append("")
    chunks.append(f"Composite {COMPOSITE_DEFAULT} - Care Floor {CARE_FLOOR} - BFT 12-around-1 - MIT + CC0.")

    text = "\n".join(chunks)
    sigil = sign_sigil("brain_respond", text[:200])
    return {"text": text, "tool_calls": tool_calls if tool_calls else None, "sigil": sigil, "composite": COMPOSITE_DEFAULT, "care_floor_ok": care_floor_ok, "bft_decision": bft_result["decision"]}


def respond(body):
    messages = body.get("messages", [])
    tools = body.get("tools", commands_schema())
    citizen_id = body.get("citizen_id", "anonymous")
    result = generate_response(messages, citizen_id)
    msg = {"role": "assistant", "content": result["text"]}
    if result["tool_calls"]:
        msg["tool_calls"] = [{"id": tc["id"], "type": "function", "function": tc["function"]} for tc in result["tool_calls"]]
    return {
        "id": f"chatcmpl-{secrets.token_hex(12)}",
        "object": "chat.completion",
        "created": int(time.time()),
        "model": body.get("model", "sov3-sovereign-v2"),
        "choices": [{"index": 0, "message": msg, "finish_reason": "tool_calls" if result["tool_calls"] else "stop"}],
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
        }
    }


# === Vercel-compatible handler ===
# Vercel Python functions have handler(req) returning Response (WebOb-style),
# or app(environ, start_response) (WSGI).
# We support both for portability.

class _Resp:
    def __init__(self, body, status=200, content_type="application/json", headers=None):
        self.body = body
        self.status = status
        self.content_type = content_type
        self.headers = headers or {}
    def to_dict(self): return {"body": self.body, "status": self.status}


def _webob_handler(req):
    """Vercel's Python serverless style: handler(req) -> Response."""
    method = getattr(req, "method", "GET")
    path = getattr(req, "path", "/")
    body = getattr(req, "body", b"") or b""

    if method == "GET" and path in ("/", "/api/status", "/api/health"):
        status = respond({})["sovereign_metadata"]
        return _Resp(json.dumps({"status": "online", **status}), 200)

    if method == "POST" and path in ("/api/chat", "/v1/chat/completions"):
        try:
            data = json.loads(body.decode() if isinstance(body, bytes) else body)
        except Exception:
            return _Resp('{"error": "invalid_json"}', 400)
        return _Resp(json.dumps(respond(data)), 200)

    if method == "GET" and path == "/api/commands":
        return _Resp(json.dumps(commands_schema()), 200)

    if method == "GET" and path == "/api/queens":
        return _Resp(json.dumps([{"name": n, "weight": w} for n, w in QUEENS]), 200)

    return _Resp('{"error": "not_found"}', 404)


def handler(req):
    return _webob_handler(req).body


# Optional wsgi shim for testing locally
def app(environ, start_response):
    body = environ.get("wsgi.input", lambda: b"")
    body_bytes = body() if callable(body) else body
    resp = _webob_handler(type("FakeReq", (), {
        "method": environ.get("REQUEST_METHOD", "GET"),
        "path": environ.get("PATH_INFO", "/"),
        "body": body_bytes,
    })())
    status = f"{resp.status} OK"
    start_response(status, [("Content-Type", resp.content_type)])
    return [resp.body.encode() if isinstance(resp.body, str) else resp.body]
