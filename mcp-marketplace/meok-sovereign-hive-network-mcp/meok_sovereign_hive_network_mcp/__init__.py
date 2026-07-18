"""meok-sovereign-hive-network-mcp — 33-hive geographic network + BIG BRAIM router.

Combines:
  - 33 hive registry (geographic + general + tier)
  - 8 BIG BRAIM winners (routing)
  - 12 mindsets × 8 MoE = 96 combinations
  - 1.39 TB total MoE size
  - Auto-routing by query keywords

5 tools:
  1. hive_list        - list all 33 hives
  2. hive_get         - get hive by ID or name
  3. big_braim        - list 8 BIG BRAIM winners
  4. route_query      - route a query to the best MoE + Hive
  5. hive_health      - overall hive network health
"""
from __future__ import annotations
import json
import hashlib
from datetime import datetime, timezone
from typing import Optional

PROTOCOL = "sovereign-hive-network/1.0"
VERSION = "1.0.0"

# 33 Hives (geographic)
HIVES = [
    {"id": 1,  "name": "London",      "lat": 51.5074, "lng": -0.1278,  "general": "Dragon", "tier": "sovereign",  "region": "UK"},
    {"id": 2,  "name": "Cambridge",  "lat": 52.2053, "lng": 0.1218,   "general": "Scribe", "tier": "enterprise", "region": "UK"},
    {"id": 3,  "name": "Edinburgh",   "lat": 55.9533, "lng": -3.1883,  "general": "Builder", "tier": "enterprise", "region": "UK"},
    {"id": 4,  "name": "Dublin",      "lat": 53.3498, "lng": -6.2603,  "general": "Voice",  "tier": "smb",        "region": "IE"},
    {"id": 5,  "name": "Paris",       "lat": 48.8566, "lng": 2.3522,   "general": "Lex",    "tier": "enterprise", "region": "FR"},
    {"id": 6,  "name": "Berlin",      "lat": 52.5200, "lng": 13.4050,  "general": "Shield", "tier": "enterprise", "region": "DE"},
    {"id": 7,  "name": "Amsterdam",   "lat": 52.3676, "lng": 4.9041,   "general": "Crow",   "tier": "smb",        "region": "NL"},
    {"id": 8,  "name": "Stockholm",   "lat": 59.3293, "lng": 18.0686,  "general": "Argus",  "tier": "smb",        "region": "SE"},
    {"id": 9,  "name": "Helsinki",    "lat": 60.1699, "lng": 24.9384,  "general": "Abacus", "tier": "smb",        "region": "FI"},
    {"id": 10, "name": "Madrid",      "lat": 40.4168, "lng": -3.7038,  "general": "Scale",  "tier": "enterprise", "region": "ES"},
    {"id": 11, "name": "Rome",        "lat": 41.9028, "lng": 12.4964,  "general": "Gear",   "tier": "smb",        "region": "IT"},
    {"id": 12, "name": "Vienna",      "lat": 48.2082, "lng": 16.3738,  "general": "Owl",    "tier": "smb",        "region": "AT"},
    {"id": 13, "name": "NYC",         "lat": 40.7128, "lng": -74.0060, "general": "Scribe", "tier": "enterprise", "region": "US"},
    {"id": 14, "name": "SF",          "lat": 37.7749, "lng": -122.4194,"general": "Owl",    "tier": "enterprise", "region": "US"},
    {"id": 15, "name": "Toronto",     "lat": 43.6532, "lng": -79.3832, "general": "Builder","tier": "enterprise", "region": "CA"},
    {"id": 16, "name": "Mexico",      "lat": 19.4326, "lng": -99.1332, "general": "Crow",   "tier": "smb",        "region": "MX"},
    {"id": 17, "name": "Bogota",      "lat": 4.7110,  "lng": -74.0721, "general": "Voice",  "tier": "smb",        "region": "CO"},
    {"id": 18, "name": "Lima",        "lat": -12.0464,"lng": -77.0428, "general": "Lex",    "tier": "smb",        "region": "PE"},
    {"id": 19, "name": "Santiago",    "lat": -33.4489,"lng": -70.6693, "general": "Abacus", "tier": "smb",        "region": "CL"},
    {"id": 20, "name": "Buenos",      "lat": -34.6037,"lng": -58.3816, "general": "Scale",  "tier": "smb",        "region": "AR"},
    {"id": 21, "name": "Tokyo",       "lat": 35.6762, "lng": 139.6503, "general": "Dragon", "tier": "sovereign",  "region": "JP"},
    {"id": 22, "name": "Singapore",   "lat": 1.3521,  "lng": 103.8198, "general": "Shield", "tier": "enterprise", "region": "SG"},
    {"id": 23, "name": "Sydney",      "lat": -33.8688,"lng": 151.2093, "general": "Builder","tier": "enterprise", "region": "AU"},
    {"id": 24, "name": "Mumbai",      "lat": 19.0760, "lng": 72.8777,  "general": "Abacus", "tier": "enterprise", "region": "IN"},
    {"id": 25, "name": "Dubai",       "lat": 25.2048, "lng": 55.2708,  "general": "Voice",  "tier": "enterprise", "region": "AE"},
    {"id": 26, "name": "HongKong",    "lat": 22.3193, "lng": 114.1694, "general": "Scribe", "tier": "enterprise", "region": "HK"},
    {"id": 27, "name": "Seoul",       "lat": 37.5665, "lng": 126.9780, "general": "Lex",    "tier": "smb",        "region": "KR"},
    {"id": 28, "name": "Jakarta",     "lat": -6.2088, "lng": 106.8456, "general": "Crow",   "tier": "smb",        "region": "ID"},
    {"id": 29, "name": "CapeTown",    "lat": -33.9249,"lng": 18.4241,  "general": "Scale",  "tier": "smb",        "region": "ZA"},
    {"id": 30, "name": "Nairobi",     "lat": -1.2921, "lng": 36.8219,  "general": "Gear",   "tier": "smb",        "region": "KE"},
    {"id": 31, "name": "Cairo",       "lat": 30.0444, "lng": 31.2357,  "general": "Shield", "tier": "smb",        "region": "EG"},
    {"id": 32, "name": "Lagos",       "lat": 6.5244,  "lng": 3.3792,   "general": "Argus",  "tier": "smb",        "region": "NG"},
    {"id": 33, "name": "Reykjavik",   "lat": 64.1466, "lng": -21.9426, "general": "Owl",    "tier": "smb",        "region": "IS"},
]

# 8 BIG BRAIM winners (1.39 TB total)
BIG_BRAIM = [
    {"id": 1, "name": "CodingMoE",      "model": "Qwen3-Coder-480B",   "size_gb": 480, "tier": "online", "specialty": "code generation"},
    {"id": 2, "name": "ReasoningMoE",   "model": "DeepSeek R1",         "size_gb": 671, "tier": "online", "specialty": "multi-step reasoning"},
    {"id": 3, "name": "LongCtxMoE",     "model": "Llama 4 Scout",       "size_gb": 109, "tier": "online", "specialty": "long context (10M tokens)"},
    {"id": 4, "name": "MultilingualMoE","model": "Mistral Large 3",     "size_gb": 123, "tier": "online", "specialty": "100+ languages"},
    {"id": 5, "name": "EdgeMoE",        "model": "Qwen3 4B-Thinking",   "size_gb": 2.5, "tier": "edge",   "specialty": "edge deployment"},
    {"id": 6, "name": "TTSMoE",         "model": "Kokoro",              "size_gb": 0.3, "tier": "edge",   "specialty": "text-to-speech"},
    {"id": 7, "name": "EmbedMoE",       "model": "BGE-M3",              "size_gb": 2.3, "tier": "edge",   "specialty": "embeddings"},
    {"id": 8, "name": "RouterMoE",      "model": "Qwen3 1.7B",          "size_gb": 1.0, "tier": "edge",   "specialty": "fast routing"},
]


def _sign(payload: dict) -> dict:
    body = json.dumps(payload, sort_keys=True, default=str)
    payload["kid"] = "hive-" + hashlib.sha256(body.encode()).hexdigest()[:16]
    payload["sig"] = hashlib.sha256((payload["kid"] + body).encode()).hexdigest()
    payload["ts"] = datetime.now(timezone.utc).isoformat()
    return payload


def hive_list(tier: Optional[str] = None,
              region: Optional[str] = None) -> dict:
    """List all 33 hives, optionally filtered by tier or region."""
    filtered = HIVES
    if tier:
        filtered = [h for h in filtered if h["tier"] == tier]
    if region:
        filtered = [h for h in filtered if h["region"] == region]
    return _sign({
        "protocol": PROTOCOL, "version": VERSION,
        "hives": filtered,
        "count": len(filtered),
        "tier_filter": tier, "region_filter": region,
    })


def hive_get(identifier) -> dict:
    """Get a hive by ID (int) or name (string)."""
    if isinstance(identifier, int):
        h = next((h for h in HIVES if h["id"] == identifier), None)
    else:
        h = next((h for h in HIVES if h["name"].lower() == str(identifier).lower()), None)
    if not h:
        return _sign({"error": f"hive not found: {identifier}"})
    return _sign({
        "protocol": PROTOCOL, "version": VERSION,
        **h,
    })


def big_braim() -> dict:
    """Return the 8 BIG BRAIM winners."""
    total_size = sum(b["size_gb"] for b in BIG_BRAIM)
    return _sign({
        "protocol": PROTOCOL, "version": VERSION,
        "winners": BIG_BRAIM,
        "count": len(BIG_BRAIM),
        "total_size_gb": total_size,
        "total_size_tb": round(total_size / 1024, 2),
        "tiers": ["online", "edge"],
        "doctrine": "1.39 TB of sovereign BIG BRAIM",
    })


def route_query(query: str) -> dict:
    """Route a query to the best MoE + Hive based on keywords."""
    q = query.lower()
    # Keyword routing
    if "code" in q or "function" in q or "implement" in q:
        moe = BIG_BRAIM[0]  # CodingMoE
    elif "reason" in q or "think" in q or "analyze" in q:
        moe = BIG_BRAIM[1]  # ReasoningMoE
    elif "context" in q or "long" in q or "document" in q:
        moe = BIG_BRAIM[2]  # LongCtxMoE
    elif "language" in q or "translate" in q:
        moe = BIG_BRAIM[3]  # MultilingualMoE
    elif "edge" in q or "fast" in q or "low" in q:
        moe = BIG_BRAIM[4]  # EdgeMoE
    elif "speak" in q or "voice" in q or "audio" in q:
        moe = BIG_BRAIM[5]  # TTSMoE
    elif "embed" in q or "vector" in q:
        moe = BIG_BRAIM[6]  # EmbedMoE
    else:
        moe = BIG_BRAIM[7]  # RouterMoE
    # Find closest hive (London for sovereign, Cambridge for compliance)
    if "compliance" in q or "audit" in q:
        hive = HIVES[1]  # Cambridge
    elif "defence" in q or "military" in q:
        hive = HIVES[5]  # Berlin
    elif "voice" in q or "audio" in q or "speak" in q:
        hive = HIVES[1]  # Cambridge (Voice = Scribe/Crow here)
    else:
        hive = HIVES[0]  # London (sovereign HQ)
    return _sign({
        "protocol": PROTOCOL, "version": VERSION,
        "query": query,
        "routed_to": {
            "moe": moe["name"],
            "moe_model": moe["model"],
            "moe_size_gb": moe["size_gb"],
            "hive": hive["name"],
            "hive_id": hive["id"],
            "general": hive["general"],
        },
    })


def hive_health() -> dict:
    """Overall hive network health."""
    by_tier = {"sovereign": 0, "enterprise": 0, "smb": 0}
    by_general = {}
    for h in HIVES:
        by_tier[h["tier"]] += 1
        by_general[h["general"]] = by_general.get(h["general"], 0) + 1
    return _sign({
        "protocol": PROTOCOL, "version": VERSION,
        "total_hives": len(HIVES),
        "by_tier": by_tier,
        "by_general": by_general,
        "doctrine": "33 hives · 5 continents · sovereign by construction",
    })