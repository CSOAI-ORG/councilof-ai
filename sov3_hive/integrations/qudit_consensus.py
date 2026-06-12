"""
qudit_consensus.py — 12 qudit dimensions mapped to 12 Queen Ghives.
"""
from __future__ import annotations

import math
from dataclasses import dataclass
from typing import Dict, List


@dataclass
class QuditDimension:
    index: int
    name: str
    symbol: str
    queen: str
    description: str
    amplitude: float = 1.0
    phase: float = 0.0
    noise: float = 0.05


DIMENSIONS: List[QuditDimension] = [
    QuditDimension(0,  "Logic",        "L",  "code",      "code-level structure"),
    QuditDimension(1,  "Trust",        "T",  "audit",     "audit & integrity"),
    QuditDimension(2,  "Perception",   "P",  "vision",    "vision & signal"),
    QuditDimension(3,  "Ethics",       "E",  "ethics",    "charter & alignment"),
    QuditDimension(4,  "Inquiry",      "I",  "research",  "research & inquiry"),
    QuditDimension(5,  "Form",         "F",  "design",    "design & form"),
    QuditDimension(6,  "Tactics",      "X",  "strategy",  "strategy & tactics"),
    QuditDimension(7,  "Pattern",      "D",  "data",      "data & pattern"),
    QuditDimension(8,  "Speech",       "S",  "language",  "language & speech"),
    QuditDimension(9,  "Order",        "O",  "system",    "system & order"),
    QuditDimension(10, "Bridge",       "B",  "bridge",    "interop & bridge"),
    QuditDimension(11, "Dream",        "M",  "dream",     "dream & synthesis"),
]


def all_dimensions() -> List[QuditDimension]:
    return list(DIMENSIONS)


def compute_consensus_weights(votes: Dict[str, str], noise: float = 0.05) -> Dict[str, float]:
    out: Dict[str, float] = {}
    for d in DIMENSIONS:
        v = votes.get(d.queen, "abstain")
        sign = {"for": 1.0, "against": -1.0, "abstain": 0.0}.get(v, 0.0)
        proj = sign * d.amplitude * math.cos(d.phase) * (1.0 - noise)
        out[d.queen] = round(proj, 4)
    return out


def weighted_quorum(weights: Dict[str, float], threshold: float = 0.5) -> bool:
    pos = sum(max(0.0, w) for w in weights.values())
    neg = sum(max(0.0, -w) for w in weights.values())
    total = pos + neg
    if total == 0:
        return False
    return (pos / total) >= threshold
