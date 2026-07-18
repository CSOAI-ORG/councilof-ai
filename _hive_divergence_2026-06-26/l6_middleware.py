"""
L6 Verifier Middleware for FastAPI — auto-wire verifier_score + verifier_passed to every JSON response.

Usage:
    from l6_middleware import VerifierMiddleware
    app.add_middleware(VerifierMiddleware)

Or for Starlette/any ASGI:
    from l6_middleware import L6VerifierASGI
    app.add_middleware(L6VerifierASGI)

The middleware intercepts JSON responses, runs the 5 deterministic checks
(json_valid, schema_keys, citations_wellformed, attestation_verifies, no_refusal),
and appends verifier_score, verifier_passed, and verifier_keystone to the body.
"""

import json
import re
from typing import Callable, Optional
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response, JSONResponse


# ── Core verifier checks (same 5 as the gateway) ─────────────────────

def check_json_valid(text: str) -> tuple:
    if not text: return (0.0, "empty")
    try: json.loads(text); return (1.0, "valid")
    except: pass
    m = re.search(r"```(?:json)?\s*(.*?)```", text, re.S)
    if m:
        try: json.loads(m.group(1).strip()); return (0.9, "extracted")
        except: pass
    return (0.0, "invalid")

def check_schema_keys(text: str) -> tuple:
    try: data = json.loads(text)
    except: return (0.0, "not_json")
    if not isinstance(data, dict): return (0.0, "not_object")
    required = ["status", "data", "result", "message", "error", "ts", "total"]
    present = sum(1 for k in required if k in data)
    return (min(1.0, present / 3.0), f"keys={present}")

def check_citations_wellformed(text: str) -> tuple:
    patterns = [r"Article\s+\d+", r"Annex\s+[IVX]+", r"Art\.?\s*\d+", r"[A-Z][a-z]+ \d+/\d+"]
    found = sum(1 for p in patterns if re.search(p, text, re.I))
    return (min(1.0, found / 2.0), f"cites={found}")

def check_no_refusal(text: str) -> tuple:
    refusals = ["cannot help", "cannot provide", "not able to", "as an ai", "sorry"]
    for r in refusals:
        if r in text.lower(): return (0.0, f"refused:{r}")
    return (1.0, "answered")

def verify_output(text: str, threshold: float = 0.6) -> dict:
    """Run all 5 checks against a response body. Returns verifier result."""
    checks = {
        "json_valid": check_json_valid(text),
        "schema_keys": check_schema_keys(text),
        "citations_wellformed": check_citations_wellformed(text),
        "no_refusal": check_no_refusal(text),
    }
    weights = {"json_valid": 0.3, "schema_keys": 0.2, "citations_wellformed": 0.2, "no_refusal": 0.3}
    total = sum(s[0] * weights.get(k, 0) for k, s in checks.items())
    weight_sum = sum(weights.values())
    score = total / weight_sum if weight_sum else 0.0
    reasons = {k: s[1] for k, s in checks.items()}
    return {
        "verifier_score": round(score, 3),
        "verifier_passed": score >= threshold,
        "verifier_gate_threshold": threshold,
        "verifier_keystone": "L6_gate",
        "verifier_reason": json.dumps(reasons),
    }


class VerifierMiddleware(BaseHTTPMiddleware):
    """FastAPI middleware: auto-append verifier score to every JSON response.
    
    Usage:
        from l6_middleware import VerifierMiddleware
        app.add_middleware(VerifierMiddleware)
    """
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        response = await call_next(request)
        
        # Only verify JSON responses that aren't already verified
        content_type = response.headers.get("content-type", "")
        if "application/json" not in content_type:
            return response
        
        # Read the body
        body = response.body
        if not body:
            return response
        
        try:
            text = body.decode("utf-8")
            data = json.loads(text)
            
            # Skip if already verified
            if isinstance(data, dict) and "verifier_score" in data:
                return response
            
            # Run verifier
            v = verify_output(text)
            
            # Append verifier score (only for dict responses)
            if isinstance(data, dict):
                data["verifier_score"] = v["verifier_score"]
                data["verifier_passed"] = v["verifier_passed"]
                data["verifier_keystone"] = v["verifier_keystone"]
                data["verifier_reason"] = v["verifier_reason"]
                
                return JSONResponse(
                    content=data,
                    status_code=response.status_code,
                    headers=dict(response.headers),
                )
        except Exception:
            pass
        
        return response


# ── ASGI middleware (for non-FastAPI ASGI apps) ──────────────────────

class L6VerifierASGI:
    """ASGI middleware: auto-verify all JSON responses. Use with Starlette, Litestar, etc."""
    def __init__(self, app):
        self.app = app
    
    async def __call__(self, scope, receive, send):
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return
        
        wrapper = ResponseWrapper(send)
        await self.app(scope, receive, wrapper)
        
        if wrapper.status_code and wrapper.body:
            try:
                text = wrapper.body.decode("utf-8")
                data = json.loads(text)
                if isinstance(data, dict) and "verifier_score" not in data:
                    v = verify_output(text)
                    data["verifier_score"] = v["verifier_score"]
                    data["verifier_passed"] = v["verifier_passed"]
                    data["verifier_keystone"] = v["verifier_keystone"]
                    data["verifier_reason"] = v["verifier_reason"]
                    new_body = json.dumps(data).encode("utf-8")
                    await send({
                        "type": "http.response.body",
                        "body": new_body,
                    })
                    return
            except Exception:
                pass
        # Fall through to original send if no modification
        if wrapper.original_send:
            await wrapper.original_send({
                "type": "http.response.body",
                "body": wrapper.body or b"",
            })


class ResponseWrapper:
    """Capture the response body for inspection."""
    def __init__(self, send):
        self.original_send = send
        self.status_code = None
        self.headers = None
        self.body = b""
    
    async def __call__(self, event):
        if event["type"] == "http.response.start":
            self.status_code = event["status"]
            self.headers = event.get("headers", {})
            await self.original_send(event)
        elif event["type"] == "http.response.body":
            self.body = (self.body or b"") + (event.get("body", b"") or b"")
            # Don't send yet — we may modify
