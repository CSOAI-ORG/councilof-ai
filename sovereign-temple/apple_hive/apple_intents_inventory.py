"""Apple Intents Inventory."""
from __future__ import annotations
import json
import hashlib
from datetime import datetime, timezone

PROTOCOL = "apple-intents-inventory/1.0"
VERSION = "1.0.0"

INTENTS = [
    {"id": 1, "name": "Siri Send Message", "framework": "SiriKit", "category": "voice"},
    {"id": 2, "name": "Siri Set Alarm", "framework": "SiriKit", "category": "voice"},
    {"id": 3, "name": "App Intents Framework", "framework": "AppIntents", "category": "system"},
    {"id": 4, "name": "Foundation Models (On-device 3B)", "framework": "Foundation", "category": "llm"},
    {"id": 5, "name": "Foundation Models Provider (PCC)", "framework": "Foundation", "category": "llm"},
    {"id": 6, "name": "ChatGPT Provider", "framework": "ChatGPT", "category": "llm"},
    {"id": 7, "name": "Gemini Provider", "framework": "Gemini", "category": "llm"},
    {"id": 8, "name": "App Store Connect API", "framework": "AppStore", "category": "distribute"},
    {"id": 9, "name": "TestFlight API", "framework": "TestFlight", "category": "distribute"},
    {"id": 10, "name": "Core ML", "framework": "CoreML", "category": "ml"},
    {"id": 11, "name": "Vision Framework", "framework": "Vision", "category": "vision"},
    {"id": 12, "name": "NaturalLanguage", "framework": "NaturalLanguage", "category": "nlp"},
    {"id": 13, "name": "Speech Framework", "framework": "Speech", "category": "speech"},
    {"id": 14, "name": "SoundAnalysis", "framework": "SoundAnalysis", "category": "audio"},
    {"id": 15, "name": "VisionKit", "framework": "VisionKit", "category": "vision"},
    {"id": 16, "name": "ARKit", "framework": "ARKit", "category": "ar"},
    {"id": 17, "name": "RealityKit", "framework": "RealityKit", "category": "ar"},
    {"id": 18, "name": "CreateML", "framework": "CreateML", "category": "ml"},
    {"id": 19, "name": "Apple Translate", "framework": "Translation", "category": "language"},
    {"id": 20, "name": "Live Captions", "framework": "Speech", "category": "accessibility"},
    {"id": 21, "name": "Personal Voice", "framework": "Speech", "category": "accessibility"},
    {"id": 22, "name": "AppleScript", "framework": "AppleScript", "category": "macos"},
    {"id": 23, "name": "Shortcuts", "framework": "Shortcuts", "category": "user"},
    {"id": 24, "name": "App Clips", "framework": "AppClips", "category": "distribute"},
    {"id": 25, "name": "CarPlay", "framework": "CarPlay", "category": "automotive"},
    {"id": 26, "name": "HomeKit", "framework": "HomeKit", "category": "smart_home"},
    {"id": 27, "name": "HealthKit", "framework": "HealthKit", "category": "health"},
    {"id": 28, "name": "ResearchKit", "framework": "ResearchKit", "category": "research"},
    {"id": 29, "name": "ClassKit", "framework": "ClassKit", "category": "education"},
    {"id": 30, "name": "DeviceCheck", "framework": "DeviceCheck", "category": "security"},
    {"id": 31, "name": "App Attest", "framework": "AppAttest", "category": "security"},
    {"id": 32, "name": "Private Cloud Compute", "framework": "PrivateCloudCompute", "category": "compute"},
]


def _sign(payload):
    body = json.dumps(payload, sort_keys=True, default=str)
    payload["kid"] = "apple-inv-" + hashlib.sha256(body.encode()).hexdigest()[:16]
    payload["sig"] = hashlib.sha256((payload["kid"] + body).encode()).hexdigest()[:16]
    payload["ts"] = datetime.now(timezone.utc).isoformat()
    return payload


def list_intents(category=None):
    items = [i for i in INTENTS if category is None or i.get("category") == category]
    categories = sorted(set(str(i.get("category", "other")) for i in INTENTS))
    return _sign({"protocol": PROTOCOL, "version": VERSION, "intents": items,
                 "count": len(items), "total": len(INTENTS), "categories": categories})
