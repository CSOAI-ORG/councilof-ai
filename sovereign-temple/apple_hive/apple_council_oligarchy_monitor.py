"""Apple Council Oligarchy Risk Monitor."""
from __future__ import annotations
import json
import hashlib
from datetime import datetime, timezone

PROTOCOL = "apple-oligarchy-monitor/1.0"
VERSION = "1.0.0"

RISKS = [
    {"risk": "App Store single-vendor lock-in", "severity": 0.85, "mitigation": "DMA alt app store, sideloading"},
    {"risk": "PCC dependency for >50B questions/day", "severity": 0.55, "mitigation": "On-device 3B for most queries"},
    {"risk": "ChatGPT partnership lock-in", "severity": 0.62, "mitigation": "Gemini partnership (WWDC 2025), open model future"},
    {"risk": "Foundation Models only Apple Silicon", "severity": 0.45, "mitigation": "PCC supports Intel/AMD via PCC nodes"},
    {"risk": "CLOUD Act US exposure", "severity": 0.78, "mitigation": "EU data residency, sovereign deployment"},
    {"risk": "App Store 30% commission", "severity": 0.72, "mitigation": "Small Business Program 15%, EU DMA"},
]


def _sign(payload):
    body = json.dumps(payload, sort_keys=True, default=str)
    payload["kid"] = "apple-olig-" + hashlib.sha256(body.encode()).hexdigest()[:16]
    payload["sig"] = hashlib.sha256((payload["kid"] + body).encode()).hexdigest()[:16]
    payload["ts"] = datetime.now(timezone.utc).isoformat()
    return payload


def scan():
    return _sign({"protocol": PROTOCOL, "version": VERSION, "risks": RISKS, "count": len(RISKS),
                 "avg_severity": sum(r["severity"] for r in RISKS) / len(RISKS),
                 "doctrine": "Apple Intelligence oligarchy monitor."})


def mitigation_for(risk_id):
    if risk_id < 1 or risk_id > len(RISKS): return _sign({"error": "unknown risk_id"})
    return _sign({"protocol": PROTOCOL, "version": VERSION, "risk": RISKS[risk_id - 1]})
