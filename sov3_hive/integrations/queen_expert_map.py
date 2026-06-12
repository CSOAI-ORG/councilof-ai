"""
queen_expert_map.py — 12 Queens → 14 OpenScore experts → meok-ai modules.
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import List

from ..ghives.queen_ghives import SAFETY_RING


@dataclass
class ExpertMapping:
    queen: str
    expert_id: str
    expert_name: str
    meok_module: str
    ring: str
    description: str


MAPPING_DATA: List[tuple] = [
    ("code",     "EXP-CODE-01",  "Code & Architecture Expert",   "meok-ai/core",        "regional", "code structure & implementation"),
    ("audit",    "EXP-AUDIT-02", "Audit & Integrity Expert",     "meok-ai/consensus",   "safety",   "audit trails & integrity proofs"),
    ("vision",   "EXP-VIS-03",   "Vision & Signal Expert",       "meok-ai/perception",  "special",  "vision & perceptual signal"),
    ("ethics",   "EXP-ETH-04",   "Ethics & Alignment Expert",    "meok-ai/charter",     "safety",   "ethics, charter, alignment"),
    ("research", "EXP-RES-05",   "Research & Inquiry Expert",    "meok-ai/learning",    "regional", "research & open-ended inquiry"),
    ("design",   "EXP-DES-06",   "Design & Form Expert",         "meok-ai/simulation",  "regional", "design, form, presentation"),
    ("strategy", "EXP-STR-07",   "Strategy & Tactics Expert",    "meok-ai/council",     "regional", "strategy, tactics, planning"),
    ("data",     "EXP-DAT-08",   "Data & Pattern Expert",        "meok-ai/memory",      "regional", "data analysis & patterns"),
    ("language", "EXP-LAN-09",   "Language & Speech Expert",     "meok-ai/langgraph",   "regional", "language, narrative, speech"),
    ("system",   "EXP-SYS-10",   "System & Order Expert",        "meok-ai/a2a",         "safety",   "system health & order"),
    ("bridge",   "EXP-BRG-11",   "Bridge & Interop Expert",      "meok-ai/bots",        "regional", "interop, bridges, gateways"),
    ("dream",    "EXP-DRM-12",   "Dream & Synthesis Expert",     "meok-ai/simulation",  "special",  "overnight synthesis & dreams"),
]


def build_mapping() -> List[ExpertMapping]:
    return [ExpertMapping(*row) for row in MAPPING_DATA]


def safety_ring_queens() -> List[str]:
    return [q.value for q in SAFETY_RING]


def regional_queens() -> List[str]:
    return [m.queen for m in build_mapping() if m.ring == "regional"]


def special_queens() -> List[str]:
    return [m.queen for m in build_mapping() if m.ring == "special"]
