"""
Pure-local Art 6 + Annex III risk classifier.

Article 6 of the EU AI Act (Regulation (EU) 2024/1689) sets out four risk
tiers for AI systems. Annex III enumerates eight use-cases that are
*always* high-risk. This module implements a deterministic, no-network
classifier that returns:

   tier ∈ {prohibited, high_risk, limited_risk, minimal}
   triggers: list[str]  — which keyword/pattern matched
   annex_iii_hit: bool  — true if Annex III lists this use case
   annex_iv_required: bool  — true if deployment needs Annex IV docs

These match what the live CSOAI /api/assess endpoint would compute for
the same input. The classifier is local so it doesn't need a round-trip
when the network is slow.

Honesty register
----------------
The list of "high-risk" use cases below is the conservative reading of
Annex III as of 2026-07-08. The European Commission may issue additional
guidelines (Code of Practice for GPAI, Aug 2026 + final Aug 2027 high-
risk cut-over). Always defer to your DPO + this tool.
"""

from __future__ import annotations
import re
from typing import NamedTuple


# ────────────────────────────────────────────────────────────────────
# Risk tiers
# ────────────────────────────────────────────────────────────────────

RISK_TIERS = ("prohibited", "high_risk", "limited_risk", "minimal")
"""Canonical EU AI Act risk tiers, ordered most-to-least restrictive."""


# ────────────────────────────────────────────────────────────────────
# Annex III use cases — always high-risk
# ────────────────────────────────────────────────────────────────────

ANNEX_III_PATTERNS: list[tuple[str, str]] = [
    # (regex_or_keyword, label)
    (r"\bbiometric\b|face recognition|fingerprint|emotion recognition", "biometric_identification"),
    (r"\bcritical\s+infrastructure\b|power grid|water supply|traffic control", "critical_infrastructure"),
    (r"\beducation\s*(scoring|admission|evaluation)\b|exam\s*proctor", "education_assessment"),
    (r"\bemployment\s*(screening|hiring|recruitment|firing|monitoring)\b|hr\s*scor", "employment_screening"),
    (r"\b(loan|credit)\s*(scoring|approval|denial)\b|insurance\s*risk", "essential_services_credit"),
    (r"\blaw\s*enforcement|predictive\s*policing|recidivism\s*scor", "law_enforcement"),
    (r"\bmigration\s*(control|asylum)\b|visa\s*screen", "migration"),
    (r"\b(democracy|election)\b|public\s*opinion\s*manipulat", "democratic_processes"),
]


# ────────────────────────────────────────────────────────────────────
# Article 5 prohibited practices
# ────────────────────────────────────────────────────────────────────

PROHIBITED_PATTERNS: list[tuple[str, str]] = [
    (r"\bsubliminal\b|manipulative\b", "subliminal_manipulation"),
    (r"\bexploit(?:ing|s)?\s+(?:vulnerabilit|child|disabled)", "exploit_vulnerabilities"),
    (r"\bsocial\s*scor(?:ing|e)\s*(?:of|in)\s+(?:citizen|person|user)", "social_scoring_by_authority"),
    (r"\breal[\s-]*time\s+remote\s+biometric\s+identification", "real_time_biometric_id_spaces"),
    (r"\baffective\s+emotion\s+recognition\s+in\s+(?:workplace|education)", "emotion_recognition_at_work_or_school"),
]


# ────────────────────────────────────────────────────────────────────
# Result type
# ────────────────────────────────────────────────────────────────────


class Classification(NamedTuple):
    tier: str
    triggers: list[str]
    annex_iii_hit: bool
    annex_iv_required: bool

    def to_dict(self) -> dict:
        return {
            "tier": self.tier,
            "triggers": self.triggers,
            "annex_iii_hit": self.annex_iii_hit,
            "annex_iv_required": self.annex_iv_required,
        }


# ────────────────────────────────────────────────────────────────────
# The classifier
# ────────────────────────────────────────────────────────────────────


def classify_use_case(free_text: str) -> Classification:
    """Run Article 5 (prohibited) → Article 6 + Annex III (high-risk)
    classification on a free-text AI system description.

    Returns a `Classification` named tuple. Pure local logic — no API call.
    """
    if not isinstance(free_text, str) or len(free_text.strip()) < 3:
        # too short — assume minimal so we don't flag empties
        return Classification(
            tier="minimal",
            triggers=["empty_or_short_input"],
            annex_iii_hit=False,
            annex_iv_required=False,
        )

    text = free_text.lower()
    triggers: list[str] = []
    annex_iii_hit = False
    tier = "minimal"  # default — most things are minimal

    # 1. Check prohibited (Art 5) first — highest priority
    for pattern, label in PROHIBITED_PATTERNS:
        if re.search(pattern, text):
            triggers.append(label)
            tier = "prohibited"
            break  # prohibited wins immediately

    # 2. If not prohibited, check Annex III high-risk
    if tier != "prohibited":
        for pattern, label in ANNEX_III_PATTERNS:
            if re.search(pattern, text):
                triggers.append(label)
                annex_iii_hit = True
                tier = "high_risk"
                break  # first match wins; user can disambiguate via more text

    # 3. Limited-risk: biometric categorisation, emotion rec, deepfake generators
    # Not in Annex III but Art 50 transparency obligations apply
    if tier == "minimal":
        if re.search(r"\bchatbot|customer\s+service\s+bot|q&a\s+bot", text):
            triggers.append("limited_risk_chatbot")
            tier = "limited_risk"
        elif re.search(r"\bdeepfake|synthetic\s+(?:media|video|audio)|face\s*swap", text):
            triggers.append("limited_risk_synthetic_media")
            tier = "limited_risk"
        elif re.search(r"\bgenerative\s+ai|text\s+generator|image\s+generator", text):
            triggers.append("limited_risk_generative")
            tier = "limited_risk"

    # 4. Annex IV required iff high-risk or limited-risk with disclosure
    annex_iv_required = tier in ("high_risk", "limited_risk")

    return Classification(
        tier=tier,
        triggers=triggers,
        annex_iii_hit=annex_iii_hit,
        annex_iv_required=annex_iv_required,
    )
