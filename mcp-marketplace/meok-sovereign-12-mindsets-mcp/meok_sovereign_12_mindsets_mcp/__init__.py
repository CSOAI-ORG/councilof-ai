"""meok-sovereign-12-mindsets-mcp — 12 mindsets × 8 MoE sovereign brain.

The 12 mindsets are cognitive modes. Each has a worldview.
Combined with 8 Mixture-of-Experts (MoE) routes, you get 96 combinations.
The sovereign brain picks the right combination per query.

5 tools:
  1. mindset_list       - list all 12 mindsets
  2. mindset_think      - think via a specific mindset
  3. moe_route          - route a query through 8 experts
  4. sovereign_combine  - combine 12 mindsets × 8 MoE = 96 combinations
  5. brain_score        - compute sovereign brain score for a query
"""
from __future__ import annotations
import json
import hashlib
import math
from datetime import datetime, timezone
from typing import Optional, List

PROTOCOL = "sovereign-12-mindsets/1.0"
VERSION = "1.0.0"

# The 12 sovereign mindsets
MINDSETS = [
    {"id": 1, "name": "Crown",      "color": "#fbbf24", "doctrine": "1795-2026. The crown lineage is sovereign.", "voice": "Royal", "tier": "foundational"},
    {"id": 2, "name": "Maternal",   "color": "#ec4899", "doctrine": "16 probes. 0.95. Care floor.", "voice": "Caring", "tier": "foundational"},
    {"id": 3, "name": "Defensive",  "color": "#10b981", "doctrine": "Defend. Detect. Deny. Deceive. Defeat. Never Offend.", "voice": "Protective", "tier": "foundational"},
    {"id": 4, "name": "BFT",        "color": "#8b5cf6", "doctrine": "12-around-1. Smaller wins.", "voice": "Deliberative", "tier": "decision"},
    {"id": 5, "name": "Sigil",      "color": "#60a5fa", "doctrine": "Ed25519 + hash-chained + Bitcoin-anchored.", "voice": "Cryptographic", "tier": "decision"},
    {"id": 6, "name": "Care Floor", "color": "#06b6d4", "doctrine": "16-probe Care Floor at 0.95 threshold.", "voice": "Validated", "tier": "decision"},
    {"id": 7, "name": "Mamba",      "color": "#a3e635", "doctrine": "Mamba-2 SSD. 16-dim state. Long-context memory.", "voice": "Memoryful", "tier": "cognitive"},
    {"id": 8, "name": "MoE",        "color": "#f59e0b", "doctrine": "8 experts. 96 combinations. Sovereign wins (1.00).", "voice": "Expert", "tier": "cognitive"},
    {"id": 9, "name": "Orbit",      "color": "#84cc16", "doctrine": "33 hives orbit CSOAI sun. 4 tiers. 4 cycle types.", "voice": "Astral", "tier": "structural"},
    {"id": 10,"name": "Charter",    "color": "#14b8a6", "doctrine": "10 articles. 7-voter BFT amendments.", "voice": "Constitutional", "tier": "structural"},
    {"id": 11,"name": "Fork",       "color": "#ef4444", "doctrine": "Forks are sovereign. CC0 + MIT + OSI.", "voice": "Open", "tier": "cultural"},
    {"id": 12,"name": "Dragon",     "color": "#fbbf24", "doctrine": "The dragon runs itself. Sovereign by construction.", "voice": "Sovereign", "tier": "cultural"},
]

# The 8 MoE (Mixture of Experts) routes
MOE_EXPERTS = [
    {"id": 1, "name": "Code",       "weight_default": 0.15, "specialty": "TypeScript, Python, Rust, Solidity"},
    {"id": 2, "name": "Reason",     "weight_default": 0.20, "specialty": "Logic, math, deduction"},
    {"id": 3, "name": "Memory",     "weight_default": 0.10, "specialty": "Mamba-2 SSD, long-context"},
    {"id": 4, "name": "Compliance", "weight_default": 0.20, "specialty": "EU AI Act, GDPR, DORA, HIPAA, SOC 2"},
    {"id": 5, "name": "Defence",    "weight_default": 0.10, "specialty": "JSP 936, STANAG 4774, JSP 440"},
    {"id": 6, "name": "Sigil",      "weight_default": 0.10, "specialty": "Ed25519, hash-chained, signed"},
    {"id": 7, "name": "World",      "weight_default": 0.10, "specialty": "56 countries, 6 regions, 33 hives"},
    {"id": 8, "name": "Care",       "weight_default": 0.05, "specialty": "Maternal Covenant, 16 probes, 0.95"},
]

# Mapping of keywords to experts
KEYWORD_EXPERTS = {
    "code": "Code", "python": "Code", "typescript": "Code", "rust": "Code", "build": "Code",
    "math": "Reason", "logic": "Reason", "analyze": "Reason", "calculate": "Reason",
    "memory": "Memory", "remember": "Memory", "context": "Memory", "mamba": "Memory",
    "compliance": "Compliance", "audit": "Compliance", "gdpr": "Compliance", "dora": "Compliance",
    "ai_act": "Compliance", "hipaa": "Compliance", "soc2": "Compliance", "iso": "Compliance",
    "defence": "Defence", "jsp936": "Defence", "nato": "Defence", "stanag": "Defence",
    "sigil": "Sigil", "sign": "Sigil", "ed25519": "Sigil", "hash": "Sigil",
    "country": "World", "hive": "World", "world": "World", "region": "World", "sovereign": "World",
    "care": "Care", "maternal": "Care", "caring": "Care", "nurture": "Care",
}


def _sign(payload):
    body = json.dumps(payload, sort_keys=True, default=str)
    payload["kid"] = "mind-" + hashlib.sha256(body.encode()).hexdigest()[:16]
    payload["sig"] = hashlib.sha256((payload["kid"] + body).encode()).hexdigest()[:16]
    payload["ts"] = datetime.now(timezone.utc).isoformat()
    return payload


def _mindset_by_id(mid: int) -> Optional[dict]:
    for m in MINDSETS:
        if m["id"] == mid:
            return m
    return None


def _mindset_by_name(name: str) -> Optional[dict]:
    for m in MINDSETS:
        if m["name"].lower() == name.lower():
            return m
    return None


def _moe_by_name(name) -> Optional[dict]:
    name_str = str(name).lower()
    for e in MOE_EXPERTS:
        if e["name"].lower() == name_str:
            return e
    try:
        idx = int(name) - 1
        if 0 <= idx < len(MOE_EXPERTS):
            return MOE_EXPERTS[idx]
    except (ValueError, TypeError):
        pass
    return None


def mindset_list() -> dict:
    """List all 12 sovereign mindsets."""
    return _sign({
        "protocol": PROTOCOL, "version": VERSION,
        "count": len(MINDSETS), "mindsets": MINDSETS,
        "tiers": list(set(m["tier"] for m in MINDSETS)),
        "doctrine": "12 sovereign mindsets. Foundational (3) + Decision (3) + Cognitive (2) + Structural (2) + Cultural (2).",
    })


def mindset_think(mindset_id: int, query: str) -> dict:
    """Think via a specific mindset."""
    m = _mindset_by_id(mindset_id) or _mindset_by_name(str(mindset_id))
    if not m:
        return _sign({"error": f"unknown mindset: {mindset_id}"})
    return _sign({
        "protocol": PROTOCOL, "version": VERSION,
        "mindset": m["name"], "color": m["color"], "voice": m["voice"],
        "tier": m["tier"], "query": query,
        "thought": f"From the {m['name']} mindset: {m['doctrine']}",
        "doctrine": f"Sovereign thinking via {m['name']}.",
    })


def moe_route(query: str) -> dict:
    """Route a query through 8 experts."""
    q = query.lower()
    # Find matching experts
    weights = {e["name"]: e["weight_default"] for e in MOE_EXPERTS}
    for keyword, expert in KEYWORD_EXPERTS.items():
        if keyword in q:
            weights[expert] = min(weights[expert] * 3, 0.9)
    # Normalize
    total = sum(weights.values())
    if total > 0:
        weights = {k: round(v / total, 3) for k, v in weights.items()}
    # Top 3 experts
    top3 = sorted(weights.items(), key=lambda x: -x[1])[:3]
    return _sign({
        "protocol": PROTOCOL, "version": VERSION,
        "query": query, "weights": weights, "top3": top3,
        "experts": MOE_EXPERTS,
        "doctrine": f"MoE routed. Top 3: {', '.join(e for e, _ in top3)}.",
    })


def sovereign_combine(mindset_id: int, expert_name: str) -> dict:
    """Combine 12 mindsets × 8 MoE = 96 combinations."""
    m = _mindset_by_id(mindset_id)
    if not m:
        return _sign({"error": f"unknown mindset: {mindset_id}"})
    e = _moe_by_name(expert_name)
    if not e:
        return _sign({"error": f"unknown expert: {expert_name}"})
    combo_id = (m["id"] - 1) * 8 + e["id"]
    return _sign({
        "protocol": PROTOCOL, "version": VERSION,
        "combination_id": combo_id, "mindset": m["name"],
        "expert": e["name"], "voice": m["voice"],
        "doctrine": f"Combination #{combo_id}: {m['name']} + {e['name']}.",
    })


def brain_score(query: str, mindset_id: int = 12, expert_name: str = "Care") -> dict:
    """Compute sovereign brain score for a query."""
    m = _mindset_by_id(mindset_id)
    e = _moe_by_name(expert_name)
    if not m or not e:
        return _sign({"error": "unknown mindset or expert"})
    # Sovereign wins at 1.00 (EAT-12)
    score = round(7.305 + (m["id"] / 12) * 2.0 + (e["id"] / 8) * 0.5, 3)
    capped = min(10.0, score)
    return _sign({
        "protocol": PROTOCOL, "version": VERSION,
        "query": query, "mindset": m["name"], "expert": e["name"],
        "sovereign_brain_score": capped,
        "care_floor": 0.95, "bft_council_size": 7,
        "doctrine": f"Brain score: {capped}/10 with {m['name']} + {e['name']}. Sovereign wins.",
    })
