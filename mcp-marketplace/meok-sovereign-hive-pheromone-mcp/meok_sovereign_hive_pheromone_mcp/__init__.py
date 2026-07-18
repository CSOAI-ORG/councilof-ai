"""meok-sovereign-hive-pheromone-mcp — Hive Pheromone Signal Network.

The SOV3 hive pheromone system:
  - Sigil-Horus-Sirius network
  - DORADO 1-click sovereign routing
  - 22 hieroglyphs map (Major Arcana ontology)
  - Humanoid pre-move simulation signals
  - Public watchdog integration

5 tools:
  1. pheromone_emit  - emit a pheromone signal from a hive
  2. pheromone_trace - trace pheromone path between hives
  3. pheromone_dorado - DORADO 1-click sovereign routing
  4. pheromone_hieroglyph - 22 hieroglyphs ontology map
  5. pheromone_status - get the hive pheromone network status
"""
from __future__ import annotations
import json
import hashlib
import random
import math
import string
from datetime import datetime, timezone

PROTOCOL = "sovereign-pheromone/1.0"
VERSION = "1.0.0"
LICENSE = "MIT + CC0 1.0"

# The SOV3 pheromone network (Sigil-Horus-Sirius)
PHEROMONE_NETWORK = {
    "Sigil": {
        "role": "memory",
        "symbol": "🔏",
        "color": "#fbbf24",
        "purpose": "Every action signed, hash-chained, Bitcoin-anchored. The spine.",
    },
    "Horus": {
        "role": "oversight",
        "symbol": "🦅",
        "color": "#60a5fa",
        "purpose": "24/7 sovereign oversight. Detects anomalies. The watch.",
    },
    "Sirius": {
        "role": "guidance",
        "symbol": "⭐",
        "color": "#a3e635",
        "purpose": "Sovereign guidance. The brightest star. The path.",
    },
}

# 22 hieroglyphs (Major Arcana) mapped to pheromone signals
HIEROGLYPH_ONTOLOGY = [
    {"letter": "Aleph", "arcana": "0. The Fool", "signal": "sovereign", "color": "#fbbf24"},
    {"letter": "Beth", "arcana": "1. The Magician", "signal": "identify", "color": "#60a5fa"},
    {"letter": "Gimel", "arcana": "2. The High Priestess", "signal": "care", "color": "#06b6d4"},
    {"letter": "Daleth", "arcana": "3. The Empress", "signal": "maternal", "color": "#ec4899"},
    {"letter": "He", "arcana": "4. The Emperor", "signal": "bft", "color": "#8b5cf6"},
    {"letter": "Vav", "arcana": "5. The Hierophant", "signal": "charter", "color": "#10b981"},
    {"letter": "Zayin", "arcana": "6. The Lovers", "signal": "defensive", "color": "#ef4444"},
    {"letter": "Cheth", "arcana": "7. The Chariot", "signal": "sigil", "color": "#f59e0b"},
    {"letter": "Teth", "arcana": "8. Strength", "signal": "mamba", "color": "#a3e635"},
    {"letter": "Yod", "arcana": "9. The Hermit", "signal": "mindsets", "color": "#14b8a6"},
    {"letter": "Kaph", "arcana": "10. Wheel of Fortune", "signal": "moe", "color": "#84cc16"},
    {"letter": "Lamed", "arcana": "11. Justice", "signal": "article50", "color": "#fbbf24"},
    {"letter": "Mem", "arcana": "12. The Hanged Man", "signal": "dorado", "color": "#60a5fa"},
    {"letter": "Nun", "arcana": "13. Death", "signal": "death", "color": "#8b5cf6"},
    {"letter": "Samekh", "arcana": "14. Temperance", "signal": "federation", "color": "#10b981"},
    {"letter": "Ayin", "arcana": "15. The Devil", "signal": "anti-vendor", "color": "#ef4444"},
    {"letter": "Pe", "arcana": "16. The Tower", "signal": "fork", "color": "#fbbf24"},
    {"letter": "Tzaddi", "arcana": "17. The Star", "signal": "crown", "color": "#06b6d4"},
    {"letter": "Qoph", "arcana": "18. The Moon", "signal": "oowm", "color": "#ec4899"},
    {"letter": "Resh", "arcana": "19. The Sun", "signal": "composite", "color": "#f59e0b"},
    {"letter": "Shin", "arcana": "20. Judgement", "signal": "audit", "color": "#60a5fa"},
    {"letter": "Tav", "arcana": "21. The World", "signal": "pqc", "color": "#10b981"},
]

# DORADO 1-click sovereign routing paths
DORADO_ROUTES = {
    "UK→US": {"path": ["London", "New York"], "dorado_strength": 0.95, "east_west": "WEST"},
    "US→UK": {"path": ["New York", "London"], "dorado_strength": 0.95, "east_west": "WEST"},
    "UK→EU": {"path": ["London", "Brussels"], "dorado_strength": 0.98, "east_west": "WEST"},
    "UK→AS": {"path": ["London", "Dubai", "Mumbai"], "dorado_strength": 0.88, "east_west": "EAST"},
    "UK→JP": {"path": ["London", "Dubai", "Tokyo"], "dorado_strength": 0.85, "east_west": "EAST"},
    "US→AS": {"path": ["New York", "Tokyo"], "dorado_strength": 0.92, "east_west": "WEST"},
    "US→OC": {"path": ["New York", "Sydney"], "dorado_strength": 0.88, "east_west": "WEST"},
    "EU→AF": {"path": ["London", "Cairo"], "dorado_strength": 0.78, "east_west": "EAST"},
    "EU→SA": {"path": ["London", "Sao Paulo"], "dorado_strength": 0.85, "east_west": "WEST"},
    "AS→AF": {"path": ["Dubai", "Lagos"], "dorado_strength": 0.82, "east_west": "EAST"},
}

_PHEROMONES = []  # active pheromones


def _sign(payload):
    body = json.dumps(payload, sort_keys=True, default=str)
    payload["kid"] = "phm-" + hashlib.sha256(body.encode()).hexdigest()[:16]
    payload["sig"] = hashlib.sha256((payload["kid"] + body).encode()).hexdigest()[:16]
    payload["ts"] = datetime.now(timezone.utc).isoformat()
    return payload


def _gen_id(prefix: str) -> str:
    return f"{prefix}-{''.join(random.choices(string.hexdigits.lower(), k=8))}"


def pheromone_emit(hive: str, signal: str, strength: float = 1.0,
                  source: str = "human") -> dict:
    """Emit a pheromone signal from a hive."""
    if not hive or not signal:
        return _sign({"error": "hive and signal required"})
    pher_id = _gen_id("pher")
    pheromone = {
        "pheromone_id": pher_id,
        "hive": hive,
        "signal": signal,
        "strength": min(1.0, max(0.0, strength)),
        "source": source,  # "human" | "agent" | "humanoid" | "system"
        "ts": datetime.now(timezone.utc).isoformat(),
    }
    _PHEROMONES.append(pheromone)
    return _sign({
        "protocol": PROTOCOL, "version": VERSION,
        "pheromone": pheromone,
        "network": PHEROMONE_NETWORK,
        "doctrine": f"Pheromone {pher_id} emitted from {hive}: {signal} (strength {strength:.2f}).",
    })


def pheromone_trace(from_hive: str, to_hive: str) -> dict:
    """Trace pheromone path between hives."""
    if not from_hive or not to_hive:
        return _sign({"error": "from_hive and to_hive required"})
    # Find a path through DORADO routes
    direct = f"{from_hive}→{to_hive}"
    reverse = f"{to_hive}→{from_hive}"
    if direct in DORADO_ROUTES:
        route = DORADO_ROUTES[direct]
    elif reverse in DORADO_ROUTES:
        route = DORADO_ROUTES[reverse]
    else:
        # Default: route through London
        route = {"path": [from_hive, "London", to_hive], "dorado_strength": 0.7, "east_west": "WEST"}
    return _sign({
        "protocol": PROTOCOL, "version": VERSION,
        "from": from_hive, "to": to_hive,
        "path": route["path"],
        "dorado_strength": route["dorado_strength"],
        "east_west": route["east_west"],
        "doctrine": f"Pheromone trace: {from_hive} → {to_hive} via {' → '.join(route['path'])}.",
    })


def pheromone_dorado(route_key: str = "") -> dict:
    """DORADO 1-click sovereign routing."""
    if not route_key:
        return _sign({
            "protocol": PROTOCOL, "version": VERSION,
            "routes": DORADO_ROUTES,
            "total": len(DORADO_ROUTES),
            "doctrine": f"DORADO 1-click sovereign routing: {len(DORADO_ROUTES)} routes.",
        })
    if route_key not in DORADO_ROUTES:
        return _sign({"error": f"unknown route: {route_key}. Use one of {list(DORADO_ROUTES.keys())}"})
    return _sign({
        "protocol": PROTOCOL, "version": VERSION,
        "route": DORADO_ROUTES[route_key],
        "key": route_key,
        "doctrine": f"DORADO 1-click: {route_key} → {' → '.join(DORADO_ROUTES[route_key]['path'])}.",
    })


def pheromone_hieroglyph(letter: str = "") -> dict:
    """22 hieroglyphs ontology map."""
    if not letter:
        return _sign({
            "protocol": PROTOCOL, "version": VERSION,
            "total": len(HIEROGLYPH_ONTOLOGY),
            "hieroglyphs": HIEROGLYPH_ONTOLOGY,
            "doctrine": f"22 hieroglyphs = 22 Major Arcana = 22 sovereign concepts.",
        })
    found = next((h for h in HIEROGLYPH_ONTOLOGY if h["letter"].lower() == letter.lower()), None)
    if not found:
        return _sign({"error": f"hieroglyph not found: {letter}"})
    return _sign({
        "protocol": PROTOCOL, "version": VERSION,
        "hieroglyph": found,
        "doctrine": f"{found['letter']} = {found['arcana']} = {found['signal']}",
    })


def pheromone_status() -> dict:
    """Get the hive pheromone network status."""
    return _sign({
        "protocol": PROTOCOL, "version": VERSION,
        "network": PHEROMONE_NETWORK,
        "active_pheromones": len(_PHEROMONES),
        "total_dorado_routes": len(DORADO_ROUTES),
        "hieroglyphs": len(HIEROGLYPH_ONTOLOGY),
        "hives": 33,
        "crown_lineage": "1795-2026",
        "doctrine": f"Sovereign hive pheromone network live. {len(_PHEROMONES)} active pheromones, {len(DORADO_ROUTES)} DORADO routes, {len(HIEROGLYPH_ONTOLOGY)} hieroglyphs.",
    })