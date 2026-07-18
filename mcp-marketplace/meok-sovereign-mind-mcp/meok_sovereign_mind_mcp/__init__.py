"""meok-sovereign-mind-mcp — 12 Mindsets × 8 MoE coordination.

The MIND layer coordinates 12 sovereign mindsets with 8 BIG BRAIM experts
(MoE = Mixture of Experts). Each mindset shapes how the 8 experts are mixed.

5 tools:
  1. mind_list        - list 12 mindsets
  2. mind_get         - get a specific mindset
  3. mind_route       - route a task through 8 MoE for a mindset
  4. mind_compare     - compare 2 mindsets on a task
  5. mind_status      - overall MIND layer status
"""
from __future__ import annotations
import json
import hashlib
from datetime import datetime, timezone
from typing import Optional

PROTOCOL = "sovereign-mind/1.0"
VERSION = "1.0.0"

# 12 Mindsets (with weights for 8 MoE)
MINDSETS = [
    {"id": 1,  "name": "Hermetic",   "env": "Fire",  "weights": [0.20, 0.30, 0.05, 0.05, 0.05, 0.05, 0.10, 0.20], "score": 0.95,
     "doctrine": "As above, so below. The microcosm mirrors the macrocosm."},
    {"id": 2,  "name": "Alchemical", "env": "Water", "weights": [0.15, 0.20, 0.10, 0.10, 0.10, 0.10, 0.10, 0.15], "score": 0.92,
     "doctrine": "Solve et Coagula. Dissolve and recombine."},
    {"id": 3,  "name": "Kabbalistic","env": "Air",   "weights": [0.10, 0.15, 0.15, 0.10, 0.15, 0.05, 0.15, 0.15], "score": 0.94,
     "doctrine": "10 Sephiroth + 22 paths = the tree of life."},
    {"id": 4,  "name": "Taoist",     "env": "Wood",  "weights": [0.10, 0.10, 0.20, 0.20, 0.10, 0.10, 0.10, 0.10], "score": 0.91,
     "doctrine": "Wu wei. Action through non-action."},
    {"id": 5,  "name": "Vedantic",   "env": "Ether", "weights": [0.15, 0.20, 0.10, 0.10, 0.10, 0.10, 0.10, 0.15], "score": 0.93,
     "doctrine": "Tat tvam asi. Thou art that."},
    {"id": 6,  "name": "Sufi",       "env": "Light", "weights": [0.10, 0.15, 0.15, 0.10, 0.15, 0.10, 0.10, 0.15], "score": 0.89,
     "doctrine": "Die before you die. The ego must dissolve."},
    {"id": 7,  "name": "Stoic",      "env": "Earth", "weights": [0.20, 0.15, 0.15, 0.10, 0.10, 0.10, 0.10, 0.10], "score": 0.90,
     "doctrine": "Amor fati. Love of fate."},
    {"id": 8,  "name": "Buddhist",   "env": "Air",   "weights": [0.10, 0.15, 0.15, 0.15, 0.10, 0.10, 0.15, 0.10], "score": 0.92,
     "doctrine": "The middle way. Liberation from suffering."},
    {"id": 9,  "name": "Tantric",    "env": "Fire",  "weights": [0.15, 0.10, 0.10, 0.20, 0.10, 0.15, 0.10, 0.10], "score": 0.88,
     "doctrine": "Embrace all experience as sacred."},
    {"id": 10, "name": "Gnostic",    "env": "Ether", "weights": [0.10, 0.10, 0.20, 0.15, 0.15, 0.10, 0.10, 0.10], "score": 0.86,
     "doctrine": "Know thyself. The divine spark within."},
    {"id": 11, "name": "Druidic",    "env": "Earth", "weights": [0.10, 0.10, 0.10, 0.20, 0.20, 0.15, 0.05, 0.10], "score": 0.84,
     "doctrine": "Honor the natural world. All things are connected."},
    {"id": 12, "name": "Sovereign",  "env": "All",   "weights": [0.15, 0.15, 0.15, 0.15, 0.10, 0.10, 0.10, 0.10], "score": 1.00,
     "doctrine": "The dragon runs itself. The substrate is sovereign."},
]

# 8 MoE experts (BIG BRAIM)
MOE_EXPERTS = [
    {"id": 1, "name": "CodingMoE",      "domain": "code generation",    "size_gb": 480},
    {"id": 2, "name": "ReasoningMoE",   "domain": "multi-step reasoning","size_gb": 671},
    {"id": 3, "name": "LongCtxMoE",     "domain": "long context",       "size_gb": 109},
    {"id": 4, "name": "MultilingualMoE","domain": "100+ languages",     "size_gb": 123},
    {"id": 5, "name": "EdgeMoE",        "domain": "edge deployment",    "size_gb": 2.5},
    {"id": 6, "name": "TTSMoE",         "domain": "text-to-speech",     "size_gb": 0.3},
    {"id": 7, "name": "EmbedMoE",       "domain": "embeddings",          "size_gb": 2.3},
    {"id": 8, "name": "RouterMoE",      "domain": "fast routing",        "size_gb": 1.0},
]


def _sign(payload: dict) -> dict:
    body = json.dumps(payload, sort_keys=True, default=str)
    payload["kid"] = "mind-" + hashlib.sha256(body.encode()).hexdigest()[:16]
    payload["sig"] = hashlib.sha256((payload["kid"] + body).encode()).hexdigest()
    payload["ts"] = datetime.now(timezone.utc).isoformat()
    return payload


def mind_list() -> dict:
    """List 12 mindsets."""
    return _sign({
        "protocol": PROTOCOL, "version": VERSION,
        "mindsets": MINDSETS, "count": len(MINDSETS),
    })


def mind_get(mindset_id: int) -> dict:
    """Get a specific mindset."""
    if not isinstance(mindset_id, int) or mindset_id < 1 or mindset_id > 12:
        return _sign({"error": f"mindset_id must be 1-12"})
    return _sign({
        "protocol": PROTOCOL, "version": VERSION,
        "mindset": MINDSETS[mindset_id - 1],
        "moe_count": len(MOE_EXPERTS),
    })


def mind_route(task: str, mindset_id: int = 12) -> dict:
    """Route a task through 8 MoE using a mindset's weights."""
    if not isinstance(mindset_id, int) or mindset_id < 1 or mindset_id > 12:
        return _sign({"error": f"mindset_id must be 1-12"})
    m = MINDSETS[mindset_id - 1]
    # Simulated routing
    routing = []
    for i, w in enumerate(m["weights"]):
        routing.append({"expert": MOE_EXPERTS[i]["name"], "weight": w,
                        "domain": MOE_EXPERTS[i]["domain"]})
    return _sign({
        "protocol": PROTOCOL, "version": VERSION,
        "task": task, "mindset": m["name"],
        "routing": routing, "total_experts": len(routing),
    })


def mind_compare(mindset_a: int, mindset_b: int) -> dict:
    """Compare 2 mindsets on a task."""
    if not (1 <= mindset_a <= 12) or not (1 <= mindset_b <= 12):
        return _sign({"error": "mindset_id must be 1-12"})
    a = MINDSETS[mindset_a - 1]
    b = MINDSETS[mindset_b - 1]
    # Compute cosine similarity
    dot = sum(x*y for x, y in zip(a["weights"], b["weights"]))
    ma = sum(x*x for x in a["weights"]) ** 0.5
    mb = sum(y*y for y in b["weights"]) ** 0.5
    similarity = dot / (ma * mb) if ma * mb > 0 else 0
    return _sign({
        "protocol": PROTOCOL, "version": VERSION,
        "mindset_a": a["name"], "mindset_b": b["name"],
        "similarity": round(similarity, 3),
    })


def mind_status() -> dict:
    """Overall MIND layer status."""
    total_score = sum(m["score"] for m in MINDSETS) / len(MINDSETS)
    return _sign({
        "protocol": PROTOCOL, "version": VERSION,
        "mindset_count": len(MINDSETS),
        "moe_expert_count": len(MOE_EXPERTS),
        "total_combinations": len(MINDSETS) * len(MOE_EXPERTS),  # 96
        "avg_score": round(total_score, 3),
        "doctrine": "12 mindsets × 8 MoE = 96 combinations",
    })