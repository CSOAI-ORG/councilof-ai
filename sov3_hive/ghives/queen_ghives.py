"""
queen_ghives.py — the 12 Queen Ghives.

3-safety-ring (ethics/audit/system) / 7-regional / 2-special pattern.
Each ghive has a weight; the safety ring carries higher BFT vote weight.
"""
from __future__ import annotations

import time
import uuid
from dataclasses import dataclass, field
from enum import Enum
from typing import Any, Callable, Dict, List, Optional


class GhiveDomain(str, Enum):
    CODE = "code"
    AUDIT = "audit"
    VISION = "vision"
    ETHICS = "ethics"
    RESEARCH = "research"
    DESIGN = "design"
    STRATEGY = "strategy"
    DATA = "data"
    LANGUAGE = "language"
    SYSTEM = "system"
    BRIDGE = "bridge"
    DREAM = "dream"


SAFETY_RING = {GhiveDomain.ETHICS, GhiveDomain.AUDIT, GhiveDomain.SYSTEM}


@dataclass
class Ghive:
    domain: GhiveDomain
    name: str
    emoji: str
    weight: float = 1.0
    in_safety_ring: bool = False
    last_active: float = 0.0
    votes_cast: int = 0
    trust_score: float = 1.0

    def vote(self) -> "QueenVote":
        self.votes_cast += 1
        self.last_active = time.time()
        return QueenVote(ghive=self.domain.value, vote="ack", weight=self.weight)


@dataclass
class QueenVote:
    ghive: str
    vote: str
    weight: float
    confidence: float = 1.0
    rationale: str = ""
    timestamp: float = field(default_factory=time.time)


GHIVE_REGISTRY: List[Ghive] = [
    Ghive(GhiveDomain.CODE,      "Code Queen",      "🧬", weight=1.0),
    Ghive(GhiveDomain.AUDIT,     "Audit Queen",     "🛡",  weight=1.5, in_safety_ring=True),
    Ghive(GhiveDomain.VISION,    "Vision Queen",    "👁",  weight=1.0),
    Ghive(GhiveDomain.ETHICS,    "Ethics Queen",    "⚖",  weight=1.5, in_safety_ring=True),
    Ghive(GhiveDomain.RESEARCH,  "Research Queen",  "🔬", weight=1.0),
    Ghive(GhiveDomain.DESIGN,    "Design Queen",    "🎨", weight=1.0),
    Ghive(GhiveDomain.STRATEGY,  "Strategy Queen",  "♟",  weight=1.0),
    Ghive(GhiveDomain.DATA,      "Data Queen",      "📊", weight=1.0),
    Ghive(GhiveDomain.LANGUAGE,  "Language Queen",  "🗣", weight=1.0),
    Ghive(GhiveDomain.SYSTEM,    "System Queen",    "🛠",  weight=1.5, in_safety_ring=True),
    Ghive(GhiveDomain.BRIDGE,    "Bridge Queen",    "🌉", weight=1.0),
    Ghive(GhiveDomain.DREAM,     "Dream Queen",     "🌙", weight=1.0),
]


class QueenSwarm:
    def __init__(self, registry: Optional[List[Ghive]] = None) -> None:
        self.queens: Dict[str, Ghive] = {
            g.domain.value: g for g in (registry or GHIVE_REGISTRY)
        }

    def all(self) -> List[Ghive]:
        return list(self.queens.values())

    def safety_ring(self) -> List[Ghive]:
        return [g for g in self.queens.values() if g.in_safety_ring]

    def get(self, domain: str) -> Optional[Ghive]:
        return self.queens.get(domain.lower())

    def delegate(self, domain: str, task: str,
                 context: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        q = self.get(domain)
        if not q:
            return {"status": "error", "error": f"unknown domain: {domain}"}
        q.last_active = time.time()
        return {
            "status": "delegated", "domain": domain, "queen": q.name,
            "task": task, "context": context or {}, "ts": q.last_active,
        }

    def cast_votes(self, ticket: str,
                   decide: Callable[[Ghive], QueenVote]) -> List[QueenVote]:
        votes: List[QueenVote] = []
        for g in self.queens.values():
            try:
                v = decide(g)
                v.ghive = g.domain.value
                v.weight = g.weight
                v.timestamp = time.time()
                votes.append(v)
                g.votes_cast += 1
            except Exception as e:
                votes.append(QueenVote(
                    ghive=g.domain.value, vote="error", weight=g.weight,
                    rationale=f"voter raised {type(e).__name__}: {e}",
                ))
        return votes
