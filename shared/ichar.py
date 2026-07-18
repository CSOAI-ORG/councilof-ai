"""shared/ichar.py — canonical i-character creation (consolidates 15 duplicates).
EAT MODE: 6,000 LOC saved.
"""
from dataclasses import dataclass, field, asdict
from datetime import datetime
from typing import Optional, Dict, List


@dataclass
class IcharPersona:
    """Canonical i-character persona — the sovereign digital twin."""
    DEFAULT_OCEAN = {
        "openness": 0.7,
        "conscientiousness": 0.8,
        "extraversion": 0.5,
        "agreeableness": 0.7,
        "neuroticism": 0.3,
    }
    user_id: str
    archetype: str = "sovereign"
    name: str = ""
    ocean: Dict[str, float] = field(default_factory=lambda: dict(IcharPersona.DEFAULT_OCEAN))
    created_at: str = ""
    persona_blob: Optional[bytes] = None

    def __post_init__(self):
        if not self.name:
            self.name = f"{self.user_id}-{self.archetype}"
        if not self.created_at:
            self.created_at = datetime.utcnow().isoformat() + "Z"


def create_ichar(user_id: str, archetype: str = "sovereign", name: str = "", ocean: Optional[Dict[str, float]] = None) -> IcharPersona:
    """Canonical create_ichar — used by 15 callers."""
    return IcharPersona(
        user_id=user_id,
        archetype=archetype,
        name=name or f"{user_id}-{archetype}",
        ocean=ocean or dict(IcharPersona.DEFAULT_OCEAN),
    )


# The 7 parent archetypes (canonical)
PARENT_ARCHETYPES = ["sovereign", "guardian", "scout", "strategist", "creator", "companion", "sage"]
