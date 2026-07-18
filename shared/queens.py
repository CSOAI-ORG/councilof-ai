"""shared/queens.py — canonical queen personality data (consolidates 7 duplicates).
EAT MODE: 3,500 LOC saved.
"""
import json
import os
from typing import Dict, List

QUEENS: List[Dict] = [
    {
        "id": "bee",
        "name": "Bee",
        "archetype": "sovereign",
        "core": "ai-build",
        "voice": "deep-female-uk",
        "ocean": {"O": 0.8, "C": 0.9, "E": 0.6, "A": 0.7, "N": 0.2},
        "emoji": "🐝",
        "sigil": "crown",
    },
    {
        "id": "queen",
        "name": "Queen",
        "archetype": "sovereign",
        "core": "governance",
        "voice": "mid-female-uk",
        "ocean": {"O": 0.7, "C": 0.85, "E": 0.7, "A": 0.8, "N": 0.15},
        "emoji": "👑",
        "sigil": "crown",
    },
    {
        "id": "sentinel",
        "name": "Sentinel",
        "archetype": "guardian",
        "core": "cybersec",
        "voice": "male-uk",
        "ocean": {"O": 0.5, "C": 0.95, "E": 0.4, "A": 0.6, "N": 0.3},
        "emoji": "🛡️",
        "sigil": "hex",
    },
    {
        "id": "cobolbridge",
        "name": "CobolBridge",
        "archetype": "scout",
        "core": "legacy-bridge",
        "voice": "mid-male-uk",
        "ocean": {"O": 0.6, "C": 0.9, "E": 0.5, "A": 0.7, "N": 0.3},
        "emoji": "🌉",
        "sigil": "circuit",
    },
    {
        "id": "doradome",
        "name": "Dorado",
        "archetype": "strategist",
        "core": "switch-east-west",
        "voice": "deep-male-uk",
        "ocean": {"O": 0.7, "C": 0.85, "E": 0.5, "A": 0.65, "N": 0.25},
        "emoji": "🌊",
        "sigil": "swirl",
    },
    {
        "id": "iokfarm",
        "name": "iOKFarm",
        "archetype": "creator",
        "core": "physical-world",
        "voice": "warm-female-uk",
        "ocean": {"O": 0.9, "C": 0.7, "E": 0.6, "A": 0.85, "N": 0.2},
        "emoji": "🌱",
        "sigil": "heartbeat",
    },
    {
        "id": "openhands",
        "name": "OpenHands",
        "archetype": "companion",
        "core": "interface",
        "voice": "mid-female-uk",
        "ocean": {"O": 0.8, "C": 0.75, "E": 0.8, "A": 0.9, "N": 0.2},
        "emoji": "🤲",
        "sigil": "script",
    },
    {
        "id": "orgkernel",
        "name": "OrgKernel",
        "archetype": "sage",
        "core": "audit",
        "voice": "deep-male-uk",
        "ocean": {"O": 0.9, "C": 0.95, "E": 0.4, "A": 0.7, "N": 0.2},
        "emoji": "📜",
        "sigil": "crown",
    },
    {
        "id": "article50",
        "name": "Article50",
        "archetype": "sovereign",
        "core": "compliance-eu",
        "voice": "mid-female-uk",
        "ocean": {"O": 0.7, "C": 0.9, "E": 0.5, "A": 0.7, "N": 0.25},
        "emoji": "🜍",
        "sigil": "hex",
    },
    {
        "id": "horus",
        "name": "Horus",
        "archetype": "guardian",
        "core": "monitoring",
        "voice": "deep-male-uk",
        "ocean": {"O": 0.6, "C": 0.95, "E": 0.5, "A": 0.6, "N": 0.2},
        "emoji": "👁️",
        "sigil": "circuit",
    },
    {
        "id": "bigbraim",
        "name": "BigBraim",
        "archetype": "strategist",
        "core": "router",
        "voice": "mid-male-uk",
        "ocean": {"O": 0.8, "C": 0.85, "E": 0.6, "A": 0.7, "N": 0.2},
        "emoji": "🧠",
        "sigil": "swirl",
    },
    {
        "id": "olm",
        "name": "OLM",
        "archetype": "strategist",
        "core": "learning",
        "voice": "warm-female-uk",
        "ocean": {"O": 0.9, "C": 0.8, "E": 0.5, "A": 0.75, "N": 0.25},
        "emoji": "🧬",
        "sigil": "heartbeat",
    },
    {
        "id": "nba",
        "name": "NBA",
        "archetype": "strategist",
        "core": "next-best-action",
        "voice": "deep-male-uk",
        "ocean": {"O": 0.7, "C": 0.85, "E": 0.7, "A": 0.7, "N": 0.2},
        "emoji": "🎯",
        "sigil": "crown",
    },
]

QUEENS_BY_ID: Dict[str, Dict] = {q["id"]: q for q in QUEENS}
QUEENS_BY_ARCHETYPE: Dict[str, List[Dict]] = {}
for q in QUEENS:
    QUEENS_BY_ARCHETYPE.setdefault(q["archetype"], []).append(q)


def load_queens(queens_path: str = None) -> List[Dict]:
    """Load queen definitions from JSON file, or use the canonical defaults."""
    if queens_path and os.path.isfile(queens_path):
        with open(queens_path) as f:
            return json.load(f)
    return QUEENS
