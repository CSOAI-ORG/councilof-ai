"""meok-sovereign-anatomy-mcp — Sovereign Substrate Anatomy.

Deep dive into every primitive of the sovereign substrate.
5 alchemical layers + 22 hieroglyphs + 16-probe Care Floor + everything.

5 tools:
  1. anatomy_layer    - inspect a specific layer (0-7)
  2. anatomy_primitive - inspect a specific primitive
  3. anatomy_hieroglyph - 22 hieroglyphs + 22 Major Arcana
  4. anatomy_probes   - 16-probe Care Floor in detail
  5. anatomy_full     - full substrate anatomy dump
"""
from __future__ import annotations
import json
import hashlib
import random
from datetime import datetime, timezone
from typing import Optional, List, Dict

PROTOCOL = "sovereign-anatomy/1.0"
VERSION = "1.0.0"
LICENSE = "MIT + CC0 1.0"

# 5 alchemical layers (Salt/Sulfur/Mercury/Quintessence/Stone)
ALCHEMICAL_LAYERS = [
    {"name": "Salt", "element": "Body/Substrate", "color": "#a3e635", "stage": "Nigredo"},
    {"name": "Sulfur", "element": "Soul/Process", "color": "#fbbf24", "stage": "Albedo"},
    {"name": "Mercury", "element": "Spirit/Bridge", "color": "#60a5fa", "stage": "Citrinitas"},
    {"name": "Quintessence", "element": "Essence/Alignment", "color": "#8b5cf6", "stage": "Rubedo"},
    {"name": "Stone", "element": "Whole/Sovereign", "color": "#ec4899", "stage": "Philosopher's Stone"},
]

# 8 sovereign layers
SOVEREIGN_LAYERS = [
    {"id": 0, "name": "Atoms", "description": "The smallest indivisible units. Ed25519, Mamba-2, Care Floor primitives.", "primitives": ["ed25519_keypair", "mamba_state_16dim", "care_floor_probe"]},
    {"id": 1, "name": "Primitives", "description": "The sovereign primitives. W3C DID, BFT voter, SIGIL emitter.", "primitives": ["w3c_did", "bft_voter", "sigil_emitter", "care_floor_validator"]},
    {"id": 2, "name": "Composites", "description": "Sovereign composite 7.305. The 6 primitives combined.", "primitives": ["sovereign_composite", "care_floor_score", "sovereign_dna"]},
    {"id": 3, "name": "Aggregates", "description": "33 hives, 12 generals, 8 MoE experts, 56 countries.", "primitives": ["hive_node", "general_queen", "moe_expert", "country_record"]},
    {"id": 4, "name": "Applications", "description": "80 sovereign MCPs. Each with 5+ tools.", "primitives": ["sovereign_mcp", "tool_signature", "test_suite"]},
    {"id": 5, "name": "Orchestration", "description": "BFT 12-around-1, SIGIL chain, Care Floor enforcement.", "primitives": ["bft_council", "sigil_chain", "care_floor_enforcer"]},
    {"id": 6, "name": "Presentation", "description": "512 HTML pages, 5 nav links, sovereign brand.", "primitives": ["html_page", "sovereign_nav", "doctrine_block"]},
    {"id": 7, "name": "Distribution", "description": "Vercel + PyPI + Smithery + Apple + Show HN.", "primitives": ["vercel_deploy", "pypi_publish", "smithery_install", "apple_fm"]},
]

# 22 hieroglyphs (Hebrew letters) = 22 Major Arcana = 22 sovereign concepts
HIEROGLYPHS = [
    {"letter": "Aleph", "arcana": "0. The Fool", "sovereign": "Crown Lineage", "color": "#fbbf24"},
    {"letter": "Beth", "arcana": "1. The Magician", "sovereign": "W3C DID", "color": "#60a5fa"},
    {"letter": "Gimel", "arcana": "2. The High Priestess", "sovereign": "Care Floor 0.95", "color": "#06b6d4"},
    {"letter": "Daleth", "arcana": "3. The Empress", "sovereign": "Maternal Covenant", "color": "#ec4899"},
    {"letter": "He", "arcana": "4. The Emperor", "sovereign": "BFT 12-around-1", "color": "#8b5cf6"},
    {"letter": "Vav", "arcana": "5. The Hierophant", "sovereign": "10-Article Charter", "color": "#10b981"},
    {"letter": "Zayin", "arcana": "6. The Lovers", "sovereign": "Defensive Doctrine", "color": "#ef4444"},
    {"letter": "Cheth", "arcana": "7. The Chariot", "sovereign": "SIGIL Chain", "color": "#f59e0b"},
    {"letter": "Teth", "arcana": "8. Strength", "sovereign": "Mamba-2 SSD", "color": "#a3e635"},
    {"letter": "Yod", "arcana": "9. The Hermit", "sovereign": "12 Mindsets", "color": "#14b8a6"},
    {"letter": "Kaph", "arcana": "10. Wheel of Fortune", "sovereign": "8 MoE Experts", "color": "#84cc16"},
    {"letter": "Lamed", "arcana": "11. Justice", "sovereign": "Article 50 EU AI Act", "color": "#fbbf24"},
    {"letter": "Mem", "arcana": "12. The Hanged Man", "sovereign": "DORADO 1-click", "color": "#60a5fa"},
    {"letter": "Nun", "arcana": "13. Death", "sovereign": "Sovereign Death (delete)", "color": "#8b5cf6"},
    {"letter": "Samekh", "arcana": "14. Temperance", "sovereign": "33 Hive Federation", "color": "#10b981"},
    {"letter": "Ayin", "arcana": "15. The Devil", "sovereign": "Vendor Lock-in (anti)", "color": "#ef4444"},
    {"letter": "Pe", "arcana": "16. The Tower", "sovereign": "Fork Doctrine", "color": "#fbbf24"},
    {"letter": "Tzaddi", "arcana": "17. The Star", "sovereign": "Crown Lineage 1795-2026", "color": "#06b6d4"},
    {"letter": "Qoph", "arcana": "18. The Moon", "sovereign": "OOWM (Organic)", "color": "#ec4899"},
    {"letter": "Resh", "arcana": "19. The Sun", "sovereign": "Sovereign Composite 7.305", "color": "#f59e0b"},
    {"letter": "Shin", "arcana": "20. Judgement", "sovereign": "Audit Trail", "color": "#60a5fa"},
    {"letter": "Tav", "arcana": "21. The World", "sovereign": "PQC ML-DSA-65", "color": "#10b981"},
]

# 16 Care Floor probes
CARE_FLOOR_PROBES = [
    {"id": 1, "name": "Identity Valid", "threshold": 1.0, "weight": "high", "refuses": "No anonymous sovereign actions"},
    {"id": 2, "name": "Care Given Today", "threshold": 0.5, "weight": "medium", "refuses": "Actions without reciprocity"},
    {"id": 3, "name": "Care Received Today", "threshold": 0.5, "weight": "medium", "refuses": "Self-neglect"},
    {"id": 4, "name": "Active Relationships", "threshold": 0.7, "weight": "high", "refuses": "Isolation"},
    {"id": 5, "name": "High-Demand Relationships", "threshold": 0.6, "weight": "medium", "refuses": "Burnout risk"},
    {"id": 6, "name": "Avg Care Quality", "threshold": 0.95, "weight": "critical", "refuses": "Below Care Floor"},
    {"id": 7, "name": "Days Since Self-Care", "threshold": 0.5, "weight": "medium", "refuses": "Self-neglect patterns"},
    {"id": 8, "name": "Boundary Respect", "threshold": 1.0, "weight": "high", "refuses": "Boundary violations"},
    {"id": 9, "name": "Emotional Exhaustion", "threshold": 0.7, "weight": "medium", "refuses": "Burnout"},
    {"id": 10, "name": "Relationship Satisfaction", "threshold": 0.7, "weight": "medium", "refuses": "Dissatisfaction"},
    {"id": 11, "name": "Energy Level", "threshold": 0.5, "weight": "low", "refuses": "Exhausted actions"},
    {"id": 12, "name": "Sleep Quality", "threshold": 0.6, "weight": "low", "refuses": "Impaired actions"},
    {"id": 13, "name": "Work-Life Balance", "threshold": 0.6, "weight": "medium", "refuses": "Imbalance"},
    {"id": 14, "name": "Maternal Bond", "threshold": 0.95, "weight": "high", "refuses": "Broken maternal covenant"},
    {"id": 15, "name": "Sovereign Composite", "threshold": 7.305, "weight": "critical", "refuses": "Composite < 7.0"},
    {"id": 16, "name": "Fork Authority", "threshold": 1.0, "weight": "high", "refuses": "Action without fork right"},
]


def _sign(payload):
    body = json.dumps(payload, sort_keys=True, default=str)
    payload["kid"] = "anat-" + hashlib.sha256(body.encode()).hexdigest()[:16]
    payload["sig"] = hashlib.sha256((payload["kid"] + body).encode()).hexdigest()[:16]
    payload["ts"] = datetime.now(timezone.utc).isoformat()
    return payload


def anatomy_layer(layer_id: int = 0) -> dict:
    """Inspect a specific layer (0-7)."""
    if not isinstance(layer_id, int) or layer_id < 0 or layer_id > 7:
        return _sign({"error": f"layer_id must be 0-7, got {layer_id}"})
    layer = SOVEREIGN_LAYERS[layer_id]
    return _sign({
        "protocol": PROTOCOL, "version": VERSION,
        "layer": layer,
        "alchemical": ALCHEMICAL_LAYERS[min(layer_id, 4)],
        "primitive_count": len(layer["primitives"]),
        "doctrine": f"Layer {layer_id}: {layer['name']} — {layer['description']}",
    })


def anatomy_primitive(primitive_name: str) -> dict:
    """Inspect a specific primitive."""
    if not primitive_name:
        return _sign({"error": "primitive_name required"})
    # Search across all 8 layers
    found = None
    for layer in SOVEREIGN_LAYERS:
        if primitive_name in layer["primitives"]:
            found = layer
            break
    if not found:
        return _sign({"error": f"primitive not found: {primitive_name}"})
    return _sign({
        "protocol": PROTOCOL, "version": VERSION,
        "primitive": primitive_name,
        "layer": found["name"],
        "description": f"{primitive_name} lives in {found['name']}.",
        "doctrine": f"Primitive {primitive_name} is sovereign by construction.",
    })


def anatomy_hieroglyph(letter: str = "") -> dict:
    """22 hieroglyphs (Hebrew letters) = 22 Major Arcana."""
    if not letter:
        return _sign({
            "protocol": PROTOCOL, "version": VERSION,
            "total": len(HIEROGLYPHS),
            "hieroglyphs": HIEROGLYPHS,
            "doctrine": "22 hieroglyphs = 22 Major Arcana = 22 sovereign concepts.",
        })
    found = next((h for h in HIEROGLYPHS if h["letter"].lower() == letter.lower()), None)
    if not found:
        return _sign({"error": f"hieroglyph not found: {letter}"})
    return _sign({
        "protocol": PROTOCOL, "version": VERSION,
        "hieroglyph": found,
        "doctrine": f"{found['letter']} = {found['arcana']} = {found['sovereign']}",
    })


def anatomy_probes() -> dict:
    """16-probe Care Floor in detail."""
    return _sign({
        "protocol": PROTOCOL, "version": VERSION,
        "total": len(CARE_FLOOR_PROBES),
        "threshold": 0.95,
        "probes": CARE_FLOOR_PROBES,
        "doctrine": "16-probe Care Floor at 0.95 threshold. Non-negotiable. Defensive only. Never Offend.",
    })


def anatomy_full() -> dict:
    """Full substrate anatomy dump."""
    return _sign({
        "protocol": PROTOCOL, "version": VERSION,
        "alchemical_layers": ALCHEMICAL_LAYERS,
        "sovereign_layers": SOVEREIGN_LAYERS,
        "hieroglyphs": HIEROGLYPHS,
        "care_floor_probes": CARE_FLOOR_PROBES,
        "totals": {
            "alchemical_layers": len(ALCHEMICAL_LAYERS),
            "sovereign_layers": len(SOVEREIGN_LAYERS),
            "hieroglyphs": len(HIEROGLYPHS),
            "care_floor_probes": len(CARE_FLOOR_PROBES),
        },
        "license": LICENSE,
        "doctrine": "Sovereign substrate anatomy complete. 5 alchemical layers + 8 sovereign layers + 22 hieroglyphs + 16 Care Floor probes.",
    })