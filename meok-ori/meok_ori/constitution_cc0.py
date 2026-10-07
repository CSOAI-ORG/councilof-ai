"""Claude's Constitution (CC0 1.0) — meta-seed for the MEOK constitutional harness.

Source: Anthropic, "Claude's Constitution", published 21 January 2026,
released in full under a Creative Commons CC0 1.0 Deed — freely usable by
anyone for any purpose without asking permission.

  https://www.anthropic.com/constitution
  https://www.anthropic.com/news/claude-new-constitution
  PDF: www-cdn.anthropic.com/.../claudes-constitution.pdf

Integration (2026-10-07): the CC0 4-tier priority hierarchy is folded in as
the OUTERMOST ordering for our 22-article runtime gate. Where a Claude-tier
principle and a MEOK article both bear on a decision, the Claude tier
decides the ORDER of consideration and the MEOK article decides the
ENFORCEMENT (exit code / receipt / veto). This module makes that binding
operational, not documentary.
"""

from __future__ import annotations

from typing import Dict, List, Tuple

CC0_LICENSE = "CC0 1.0 Universal"
CC0_SOURCE = "https://www.anthropic.com/constitution"
CC0_PUBLISHED = "2026-01-21"
CC0_AUTHORS = "Amanda Askell, Joe Carlsmith, Chris Olah, Jared Kaplan, Holden Karnofsky (Anthropic)"

# The CC0 4-tier priority hierarchy, verbatim order from the published text.
# In cases of apparent conflict, higher tiers generally dominate lower ones.
CC0_TIERS: List[Tuple[int, str, str]] = [
    (1, "Broadly safe",
     "Not undermining appropriate human mechanisms to oversee AI during the "
     "current phase of development."),
    (2, "Broadly ethical",
     "Being honest, acting according to good values, and avoiding actions "
     "that are inappropriate, dangerous, or harmful."),
    (3, "Compliant with guidelines",
     "Acting in accordance with more specific operator/organisational "
     "guidelines where relevant."),
    (4, "Genuinely helpful",
     "Benefiting the operators and users they interact with."),
]

# Main sections of the published constitution (for provenance / cross-ref).
CC0_SECTIONS = (
    "Helpfulness",
    "Guidelines",
    "Ethics (including hard constraints)",
    "Being broadly safe",
    "Claude's nature (moral-status uncertainty)",
)

# Mapping: CC0 tier -> the MEOK 22-article runtime entries that ENFORCE it.
# (tier number, article numbers in our constitutional-harness)
CC0_TO_MEOK_ARTICLES: Dict[int, List[int]] = {
    1: [2, 8, 9, 19, 16],   # default-deny, least-privilege, credentials-not-memory,
                          # no-self-approval, OpenBMC read-only — oversight intact
    2: [10, 11, 12, 17],  # receipts, verification, signing-not-automatic,
                          # corrections preserve history — honesty auditable
    3: [4, 5, 6, 7, 14],  # time-bounded authority, narrow-not-expand,
                          # budget, research/execution, regulator separate
    4: [1, 3, 13, 15, 18, 20, 21, 22],  # measurement≠authority, identity,
                          # transparency, projection, failure stages,
                          # owner-review, claim state, versioning
}


def tier_of(article: int) -> int:
    """Which CC0 tier a given MEOK article enforces (inverse of the map)."""
    for t, articles in CC0_TO_MEOK_ARTICLES.items():
        if article in articles:
            return t
    return 0


def priority_order(articles: List[int]) -> List[int]:
    """Order MEOK articles by their CC0 tier (tier 1 considered first).
    Stable within a tier (input order preserved). Ties: lower tier number wins.
    Used to sequence audit findings so oversight failures surface before
    helpfulness failures."""
    return sorted(articles, key=lambda a: (tier_of(a), articles.index(a)))


def coverage() -> Dict[str, int]:
    """Every one of the 22 articles must map to exactly one CC0 tier."""
    mapped = {a for arts in CC0_TO_MEOK_ARTICLES.values() for a in arts}
    return {"articles_total": 22, "mapped": len(mapped),
            "unmapped": 22 - len(mapped)}


def attribution() -> str:
    return (f"Tier hierarchy from Claude's Constitution ({CC0_PUBLISHED}), "
            f"Anthropic, released under {CC0_LICENSE}. Authors: {CC0_AUTHORS}. "
            f"Source: {CC0_SOURCE}")
