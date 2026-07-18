"""Apple Foundation Models Provider API."""
from __future__ import annotations
import json
import hashlib
from datetime import datetime, timezone

PROTOCOL = "apple-foundation-models/1.0"
VERSION = "1.0.0"

MODELS = {
    "apple-on-device-3b": {"name": "Apple Foundation Models On-device 3B", "params_b": 3.0,
                            "location": "on-device", "context": 8192, "ios": 18,
                            "quantization": "palettization-3bit", "speed_per_token_ms": 30},
    "apple-pcc-30b": {"name": "Apple Foundation Models PCC 30B", "params_b": 30.0,
                       "location": "private-cloud-compute", "context": 32768, "ios": 18,
                       "security": "Apple Silicon Secure Enclave + cryptographically verifiable"},
    "chatgpt-partner": {"name": "ChatGPT (Apple partnership)", "params_b": 175.0,
                         "provider": "OpenAI", "consent_required": True, "ios": 18},
    "gemini-partner": {"name": "Gemini (Apple partnership)", "params_b": 175.0,
                        "provider": "Google", "consent_required": True, "ios": 19,
                        "announced": "WWDC 2025"},
}


def _sign(payload):
    body = json.dumps(payload, sort_keys=True, default=str)
    payload["kid"] = "apple-fm-" + hashlib.sha256(body.encode()).hexdigest()[:16]
    payload["sig"] = hashlib.sha256((payload["kid"] + body).encode()).hexdigest()[:16]
    payload["ts"] = datetime.now(timezone.utc).isoformat()
    return payload


def list_models():
    return _sign({"protocol": PROTOCOL, "version": VERSION, "models": MODELS, "count": len(MODELS)})


def get_model(name):
    if name not in MODELS: return _sign({"error": f"unknown model: {name}"})
    return _sign({"protocol": PROTOCOL, "version": VERSION, "model": MODELS[name]})


def generate(model_name, prompt, consent=False):
    if model_name not in MODELS: return _sign({"error": "unknown model"})
    model = MODELS[model_name]
    if model.get("consent_required") and not consent:
        return _sign({"error": "user consent required for " + model_name})
    return _sign({"protocol": PROTOCOL, "version": VERSION, "model": model_name,
                 "prompt": prompt, "consent": consent, "location": model["location"],
                 "output": f"[{model['name']}] Sovereign response: {prompt[:100]}"})
