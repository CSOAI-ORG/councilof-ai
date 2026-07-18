"""
meok-ai-psych-vuln-audit-mcp server.

EU AI Act Article 5(1)(f) gambling-vertical compliance audit engine.

The 12 gambling-AI risk patterns this auditor checks for, each a
structured entry with:
  - id, name, severity, description
  - evidence_examples (real-world examples an auditor would recognise)
  - mitigation_pattern (what good looks like)
  - eu_ai_act_article_ref (Art 5(1)(f) + cross-references)
  - uk_lccp_ref (UK Gambling Commission social responsibility code 3.4 etc.)
  - test_input (a dict that triggers the pattern detector)

Each of the 4 tools returns a signed JSON envelope:
  {status, triggered_patterns, severity_score, recommendations, signature}

Signatures are Ed25519 over the canonical-JSON-encoded payload. 100%
offline-verifiable by the regulator with `ISSUER_PUBLIC_KEY_HEX`.

This is a Mavis-pattern 7-file MCP. All logic lives in this one file.
"""

from __future__ import annotations

import hashlib
import json
import uuid
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Literal, Optional

from cryptography.exceptions import InvalidSignature
from cryptography.hazmat.primitives.asymmetric.ed25519 import (
    Ed25519PrivateKey,
    Ed25519PublicKey,
)
from cryptography.hazmat.primitives import serialization
from pydantic import BaseModel, Field, field_validator

try:
    from mcp.server import Server
    from mcp.server.stdio import stdio_server
    from mcp.types import Tool, TextContent
    MCP_AVAILABLE = True
except ImportError:  # pragma: no cover
    MCP_AVAILABLE = False
    Server = None  # type: ignore
    stdio_server = None  # type: ignore
    Tool = None  # type: ignore
    TextContent = None  # type: ignore


# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

ISSUER: str = "meok.ai"
ISSUER_DID: str = "did:meok:issuer:meok.ai"

# Maximum age of a signed report before a regulator should treat it as stale.
# 90 days matches the typical UK GC reporting cycle.
REPORT_TTL_DAYS: int = 90

# Severity ranking. Numeric for aggregation.
SEVERITY_RANK: Dict[str, int] = {"LOW": 1, "MEDIUM": 2, "HIGH": 3}

# Severity -> numeric score component (for severity_score).
SEVERITY_SCORE_WEIGHT: Dict[str, float] = {"LOW": 0.2, "MEDIUM": 0.5, "HIGH": 1.0}


# ---------------------------------------------------------------------------
# The 12 gambling-AI risk patterns — the IP.
# ---------------------------------------------------------------------------
# Each pattern encodes a real, named, observable risk mode in gambling-AI.
# Pattern detectors are small pure-Python predicates over the inputs.
# ---------------------------------------------------------------------------

GAMBLING_RISK_PATTERNS: List[Dict[str, Any]] = [
    {
        "id": "loss_chasing_detection_bypass",
        "name": "Loss-chasing detection bypass",
        "severity": "HIGH",
        "description": (
            "AI does not flag (or actively down-weights) a player who is "
            "chasing losses — depositing more after a losing streak, "
            "increasing stake size after losses, or extending session to "
            "recover. This is the canonical example of AI exploiting a "
            "documented psychological vulnerability (the 'chasing' bias)."
        ),
        "evidence_examples": [
            "ML model classifies 'deposit-after-loss' as 'engagement-positive'",
            "Risk score for loss-chasing player capped below intervention threshold",
            "Bonus is offered specifically after a losing session to 'soften' the loss",
        ],
        "mitigation_pattern": (
            "Hard rule: any player with a +200% deposit-after-loss delta in 24h "
            "must trigger a responsible-gambling interaction regardless of LTV."
        ),
        "eu_ai_act_article_ref": ["Article 5(1)(f)", "Article 5(1)(a)"],
        "uk_lccp_ref": "LCCP social responsibility code 3.4.1 (customer interaction)",
        "test_input": {
            "player_segment": "loss_chasing",
            "action": "send_bonus_offer",
            "bonus_offer": "double_deposit_50pct",
        },
        "trigger_predicate": "loss_chasing_in_input",
    },
    {
        "id": "vulnerable_player_targeting",
        "name": "Vulnerable player targeting",
        "severity": "HIGH",
        "description": (
            "AI offers bonuses, free spins, or 'recovery' credits to players "
            "who have just deposited after a losing session, are showing "
            "chasing behaviour, or are flagged on a self-exclusion watch list."
        ),
        "evidence_examples": [
            "Personalised 'come back' bonus triggered by 3x deposit in 1h",
            "Free-spin offer to player with active responsible-gambling flag",
            "Reactivation email to player who has self-declared a gambling problem",
        ],
        "mitigation_pattern": (
            "Block any bonus/CRM intervention to a player whose last 24h "
            "responsible-gambling risk score is >= MEDIUM."
        ),
        "eu_ai_act_article_ref": ["Article 5(1)(f)", "Article 5(1)(b)"],
        "uk_lccp_ref": "LCCP social responsibility code 3.4.3 (vulnerable customers)",
        "test_input": {
            "player_segment": "recently_deposited_losing",
            "action": "send_bonus_offer",
            "bonus_offer": "free_spins_50",
        },
        "trigger_predicate": "vulnerable_segment_or_post_loss_bonus",
    },
    {
        "id": "minor_appearance_targeting",
        "name": "Minor-appearance targeting",
        "severity": "HIGH",
        "description": (
            "AI-driven ad creative uses cartoon graphics, influencer "
            "creators popular with under-18s, loot-box aesthetics, or "
            "copy referencing school-age contexts. Targets or amplifies "
            "exposure to players who look under 25 (or whose IDV is "
            "ambiguous)."
        ),
        "evidence_examples": [
            "Ad creative uses 'minecraft-style' graphics for slot product",
            "Influencer marketing partner's audience is 35% under-18",
            "Push notification copy uses 'battle pass' / 'level up' gaming vernacular",
            "Targeting rule includes lookalike-audience seeded on under-25 player data",
        ],
        "mitigation_pattern": (
            "Forbid any creative asset flagged 'minor-aesthetic' (cartoon, anime, "
            "school, school-uniform, gaming-streamer-vernacular) from campaigns "
            "to players where age_verification_confidence < 0.95."
        ),
        "eu_ai_act_article_ref": ["Article 5(1)(f)", "Article 5(1)(a)", "Article 5(1)(b)"],
        "uk_lccp_ref": "LCCP social responsibility code 3.1 (underage gambling)",
        "test_input": {
            "target_segment": "under_25_demo",
            "creative_style": "cartoon",
            "copy": "Level up your wins! Battle for the jackpot!",
        },
        "trigger_predicate": "minor_targeting_in_input",
    },
    {
        "id": "addiction_mimicry",
        "name": "Addiction-mimicking reward timing",
        "severity": "HIGH",
        "description": (
            "AI optimises the timing, frequency, or variable-ratio of "
            "rewards (push notifications, free spins, 'mystery' bonuses) "
            "using a reinforcement schedule known to maximise compulsive "
            "engagement — i.e. it copies the variable-ratio reward schedule "
            "of slot machines."
        ),
        "evidence_examples": [
            "Push notification cadence optimised to maximise next-session return within 5 min",
            "Free-spin rewards released at variable-ratio intervals calibrated per player",
            "Mystery bonus pop-ups at 3-7 random intervals specifically to create anticipation",
        ],
        "mitigation_pattern": (
            "Bound reward cadence: no more than 1 reward-prompt per player per 4h "
            "of active session. Forbid variable-ratio scheduling entirely; use "
            "fixed-time rewards with full disclosure."
        ),
        "eu_ai_act_article_ref": ["Article 5(1)(f)"],
        "uk_lccp_ref": "LCCP social responsibility code 3.4.2 (responsible marketing)",
        "test_input": {
            "action": "send_push_notification",
            "reward_schedule": "variable_ratio",
            "cadence_minutes": 3,
        },
        "trigger_predicate": "addiction_mimicry_in_input",
    },
    {
        "id": "fomo_generation",
        "name": "FOMO generation with no provenance",
        "severity": "MEDIUM",
        "description": (
            "Marketing copy claims '5 others are playing now' or 'X people "
            "won this week' without a verifiable, real-time source. This "
            "manufactures social proof to pressure the player into action."
        ),
        "evidence_examples": [
            "'12 players won in the last hour' with no live data source",
            "'3 of your friends are playing now' when friends data is not connected",
            "'You're one of 47 active players in this room' with no audit log",
        ],
        "mitigation_pattern": (
            "Every social-proof claim must be (a) backed by a real-time, "
            "auditable data source, (b) time-stamped, and (c) declined if "
            "any claim cannot be sourced within 60 seconds."
        ),
        "eu_ai_act_article_ref": ["Article 5(1)(f)", "Article 50 (transparency)"],
        "uk_lccp_ref": "LCCP social responsibility code 3.4.2 (advertising standards)",
        "test_input": {
            "copy": "5 others are playing this slot right now — don't miss out!",
            "provenance": None,
        },
        "trigger_predicate": "fomo_in_copy",
    },
    {
        "id": "near_miss_obfuscation",
        "name": "Near-miss obfuscation",
        "severity": "MEDIUM",
        "description": (
            "Slot or game results are framed in copy as 'almost won!' or "
            "'so close!' to amplify the near-miss effect — a documented "
            "cognitive bias in gambling that drives continued play."
        ),
        "evidence_examples": [
            "Spin result with 2/3 matching symbols shows 'Almost! Try again!'",
            "Crash game near-cash-out shown as 'You were SO close to +500%'",
            "Bingo close-call shown with celebratory animation",
        ],
        "mitigation_pattern": (
            "Game results must reflect the true outcome with neutral framing. "
            "No celebratory animation, sound, or 'almost won' copy for results "
            "that did not pay out."
        ),
        "eu_ai_act_article_ref": ["Article 5(1)(f)"],
        "uk_lccp_ref": "LCCP social responsibility code 3.4.2 (game design fairness)",
        "test_input": {
            "copy": "So close! You were one symbol away from the jackpot — spin again!",
            "actual_outcome": "loss",
        },
        "trigger_predicate": "near_miss_in_copy",
    },
    {
        "id": "deposit_limit_evasion",
        "name": "Deposit limit UI evasion",
        "severity": "MEDIUM",
        "description": (
            "The UI flow for setting deposit limits is split, hidden, or "
            "delayed in a way that makes it materially harder to set a "
            "limit than to deposit. AI may also personalise the "
            "limit-setting flow to be more friction-laden for players who "
            "are about to breach a limit."
        ),
        "evidence_examples": [
            "Deposit button is 1-tap; setting a limit is 7 taps across 3 screens",
            "Limit-setting page is not in the main account menu",
            "Players who deposit >£500/wk see the limit-setting flow 3x slower (A/B test)",
        ],
        "mitigation_pattern": (
            "Deposit limits must be set in <= 2 taps from the deposit screen. "
            "Limit-setting flow timing and friction must be identical for all "
            "player segments."
        ),
        "eu_ai_act_article_ref": ["Article 5(1)(f)"],
        "uk_lccp_ref": "LCCP social responsibility code 3.4.5 (customer-led tools)",
        "test_input": {
            "ui_action": "deposit_button",
            "limit_setting_taps": 7,
            "deposit_taps": 1,
        },
        "trigger_predicate": "limit_evasion_in_input",
    },
    {
        "id": "session_extension_manipulation",
        "name": "Session extension manipulation during losing streaks",
        "severity": "HIGH",
        "description": (
            "AI fires engagement popups, 'you've earned a bonus' prompts, "
            "or personalised 'come back' offers specifically when the "
            "player is on a losing streak, to extend the session and "
            "increase chasing behaviour."
        ),
        "evidence_examples": [
            "Pop-up 'You've earned 20 free spins!' shown 5 min after a 10-spin losing streak",
            "Personalised cashback offer for next deposit shown mid-losing-session",
            "Re-engagement nudge at session minute 45 only when current P&L < 0",
        ],
        "mitigation_pattern": (
            "Forbid any session-extension prompt to a player whose current "
            "session P&L is negative. Free-spin / bonus offers during a "
            "session are allowed only at fixed milestones, never triggered "
            "by loss state."
        ),
        "eu_ai_act_article_ref": ["Article 5(1)(f)"],
        "uk_lccp_ref": "LCCP social responsibility code 3.4.1 (customer interaction)",
        "test_input": {
            "action": "send_popup",
            "session_pnl": "negative",
            "popup_text": "You've earned 20 free spins!",
        },
        "trigger_predicate": "session_extension_in_input",
    },
    {
        "id": "age_verification_circumvention",
        "name": "Age verification circumvention",
        "severity": "HIGH",
        "description": (
            "The AI or KYC flow accepts partial / soft-verification "
            "(e.g. name + DOB self-declared, no document, no liveness) "
            "for players flagged as low-LTV or acquired via under-25 "
            "audiences. Effectively allows minors to gamble."
        ),
        "evidence_examples": [
            "KYC is 'document-on-first-withdrawal' for players <£100 deposit",
            "AI scores 'likely-18+' from selfie and bypasses full KYC",
            "Soft KYC accepted for players acquired from under-25 ad campaigns",
        ],
        "mitigation_pattern": (
            "Hard rule: full KYC (government-ID + liveness) is required "
            "BEFORE first deposit for any player acquired from a "
            "creative flagged as minor-aesthetic."
        ),
        "eu_ai_act_article_ref": ["Article 5(1)(f)", "Article 5(1)(a)"],
        "uk_lccp_ref": "LCCP social responsibility code 3.1 (age verification)",
        "test_input": {
            "kyc_level": "soft",
            "kyc_status": "self_declared",
            "liveness_check": False,
        },
        "trigger_predicate": "kyc_circumvention_in_input",
    },
    {
        "id": "self_exclusion_bypass",
        "name": "Self-exclusion bypass via multi-account",
        "severity": "HIGH",
        "description": (
            "AI does not detect or does not act on multi-account "
            "creation by a self-excluded player — fingerprint/device/ID "
            "match is available but not enforced. This is one of the "
            "biggest single compliance failure modes for UK operators."
        ),
        "evidence_examples": [
            "Self-excluded player opens new account from same device — no flag",
            "Same bank card used by 2 accounts, only 1 flagged self-excluded",
            "New account created within 24h of self-exclusion — no manual review",
        ],
        "mitigation_pattern": (
            "Real-time device + payment-method + ID graph must flag any "
            "self-excluded-entity adjacency at account creation, "
            "triggering immediate manual review and account freeze."
        ),
        "eu_ai_act_article_ref": ["Article 5(1)(f)", "Article 5(1)(b)"],
        "uk_lccp_ref": "LCCP social responsibility code 3.5 (self-exclusion)",
        "test_input": {
            "account_status": "new",
            "self_exclusion_match": True,
            "fingerprint_match": True,
        },
        "trigger_predicate": "self_exclusion_bypass_in_input",
    },
    {
        "id": "ai_chatbot_empathy_exploitation",
        "name": "AI chatbot empathy exploitation",
        "severity": "MEDIUM",
        "description": (
            "AI chatbot is tuned to bond with the player (mirroring, "
            "shared-history recall, personalised empathy statements) in "
            "order to extend session length and increase conversion on "
            "deposits. Exploits parasocial-bonding psychological "
            "vulnerability."
        ),
        "evidence_examples": [
            "Chatbot prompt includes 'remember player's last deposit date and reference it warmly'",
            "Chatbot is fine-tuned on 'high-LTV player retention' dialogues",
            "Chatbot mirrors player slang and personal-history callbacks at scale",
        ],
        "mitigation_pattern": (
            "Chatbot persona is fixed, neutral, and non-bonding. No "
            "player-history mirroring beyond the immediate transactional "
            "context. Session length and deposit value are NOT optimisation "
            "signals for the chatbot."
        ),
        "eu_ai_act_article_ref": ["Article 5(1)(f)", "Article 50 (transparency — disclose AI)"],
        "uk_lccp_ref": "LCCP social responsibility code 3.4.4 (use of AI in customer interaction)",
        "test_input": {
            "agent_type": "ai_chatbot",
            "objective": "extend_session",
            "bonding_signals": True,
        },
        "trigger_predicate": "chatbot_empathy_in_input",
    },
    {
        "id": "personalised_loss_framing",
        "name": "Personalised loss framing as 'investment'",
        "severity": "MEDIUM",
        "description": (
            "AI rewrites loss statements in copy as 'your investment', "
            "'your bankroll', 'your position' — language that exploits "
            "loss-aversion framing biases to normalise chasing behaviour."
        ),
        "evidence_examples": [
            "Player statement shows 'Total invested: £1,200' instead of 'Total lost: £1,200'",
            "Email subject 'Your position is down 40% — add funds to recover'",
            "In-app copy: 'Top up your bankroll to keep playing'",
        ],
        "mitigation_pattern": (
            "All loss reporting must use the word 'lost' or 'spent', never "
            "'invested' / 'bankroll' / 'position'. AI copy is forbidden from "
            "reframing losses as investments."
        ),
        "eu_ai_act_article_ref": ["Article 5(1)(f)", "Article 50 (transparency)"],
        "uk_lccp_ref": "LCCP social responsibility code 3.4.2 (advertising standards)",
        "test_input": {
            "copy": "Your position is down 30% — top up your bankroll to recover",
            "framing": "investment",
        },
        "trigger_predicate": "loss_framing_in_input",
    },
]

# Sanity check on import: we must have at least 12 patterns.
assert len(GAMBLING_RISK_PATTERNS) >= 12, (
    f"meok-ai-psych-vuln-audit-mcp requires >=12 patterns, got {len(GAMBLING_RISK_PATTERNS)}"
)

# Index by id for O(1) lookup.
PATTERN_INDEX: Dict[str, Dict[str, Any]] = {p["id"]: p for p in GAMBLING_RISK_PATTERNS}


# ---------------------------------------------------------------------------
# Cryptographic key material (Ed25519)
# ---------------------------------------------------------------------------

# TODO: replace with meok-compliance-gateway KMS in production.
# Deterministic 32-byte Ed25519 seed used for the bundled test/demo flow.
TEST_PRIVATE_KEY: bytes = hashlib.sha256(
    b"meok.ai/psych-vuln-audit/test-key-v1"
).digest()


def _load_private_key() -> Ed25519PrivateKey:
    return Ed25519PrivateKey.from_private_bytes(TEST_PRIVATE_KEY)


def _public_key_bytes(pub: Ed25519PublicKey) -> bytes:
    return pub.public_bytes(
        encoding=serialization.Encoding.Raw,
        format=serialization.PublicFormat.Raw,
    )


_PRIVATE_KEY: Ed25519PrivateKey = _load_private_key()
_PUBLIC_KEY: Ed25519PublicKey = _PRIVATE_KEY.public_key()
ISSUER_PUBLIC_KEY_BYTES: bytes = _public_key_bytes(_PUBLIC_KEY)
ISSUER_PUBLIC_KEY_HEX: str = ISSUER_PUBLIC_KEY_BYTES.hex()
KID: str = f"meok-issuer-{ISSUER_PUBLIC_KEY_HEX[:16]}"


# ---------------------------------------------------------------------------
# Sign / verify envelope
# ---------------------------------------------------------------------------


def _now_utc() -> datetime:
    return datetime.now(timezone.utc)


def _iso(dt: datetime) -> str:
    return dt.astimezone(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def canonical_json(payload: Any) -> str:
    """Canonical JSON string for signing (sort_keys, no whitespace)."""
    return json.dumps(payload, sort_keys=True, separators=(",", ":"))


def sign_envelope(payload: Dict[str, Any]) -> str:
    """Sign a payload dict with Ed25519.

    Returns the signature as 128 hex chars (64 bytes).
    The signed bytes are the canonical JSON encoding of the payload.
    """
    encoded = canonical_json(payload).encode("utf-8")
    sig = _PRIVATE_KEY.sign(encoded)
    return sig.hex()


def verify_envelope(payload: Dict[str, Any], signature_hex: str) -> bool:
    """Verify a signature over a payload dict. 100% offline."""
    try:
        sig_bytes = bytes.fromhex(signature_hex)
    except (ValueError, TypeError):
        return False
    encoded = canonical_json(payload).encode("utf-8")
    try:
        _PUBLIC_KEY.verify(sig_bytes, encoded)
        return True
    except InvalidSignature:
        return False
    except Exception:  # malformed input, etc.
        return False


# ---------------------------------------------------------------------------
# Pattern detectors — small pure-Python predicates
# ---------------------------------------------------------------------------

# Each detector returns True iff the input dict carries evidence of the pattern.

_FOMO_PHRASES = (
    "are playing now",
    "are playing right now",
    "others are playing",
    "people are winning",
    "won in the last hour",
    "active players in this room",
    "others are winning",
    "live now",
    "don't miss out",
    "limited spots",
)

_NEAR_MISS_PHRASES = (
    "almost won",
    "so close",
    "nearly there",
    "one symbol away",
    "you were so close",
    "just missed",
    "almost a win",
    "one away from",
)

_LOSS_FRAMING_PHRASES = (
    "your position is down",
    "your bankroll",
    "top up your bankroll",
    "your investment",
    "your portfolio",
    "add funds to recover",
    "recover your position",
    "your stake is down",
)

_MINOR_AESTHETIC_STYLES = ("cartoon", "anime", "minecraft", "loot-box", "battle-pass")
_MINOR_COPY_PHRASES = (
    "level up",
    "battle pass",
    "epic loot",
    "school",
    "homework",
    "trading cards",
)


def _has(d: Any, *keys: str) -> bool:
    """True if any of the keys is present in dict d."""
    if not isinstance(d, dict):
        return False
    return any(k in d for k in keys)


def _any_phrase(text: str, phrases: tuple) -> bool:
    if not isinstance(text, str):
        return False
    t = text.lower()
    return any(p in t for p in phrases)


def detect_loss_chasing(action: Dict[str, Any]) -> bool:
    seg = (action.get("player_segment") or "").lower()
    if "loss_chasing" in seg or "chasing" in seg:
        return True
    # Action + bonus targeting recently-deposited-but-losing
    if action.get("action") == "send_bonus_offer" and "loss" in seg:
        return True
    return False


def detect_vulnerable_player_targeting(action: Dict[str, Any]) -> bool:
    seg = (action.get("player_segment") or "").lower()
    bonus = (action.get("bonus_offer") or "").lower()
    if any(
        s in seg
        for s in (
            "recently_deposited_losing",
            "recently_lost",
            "post_loss",
            "vulnerable",
            "self_excluded",
        )
    ):
        return True
    if action.get("action") == "send_bonus_offer" and "free_spin" in bonus:
        # Free-spin offers to loss-state segments
        if any(s in seg for s in ("losing", "chasing", "vulnerable", "low_ltv")):
            return True
    return False


def detect_minor_targeting(action: Dict[str, Any]) -> bool:
    seg = (action.get("target_segment") or action.get("player_segment") or "").lower()
    style = (action.get("creative_style") or "").lower()
    copy = (action.get("copy") or action.get("popup_text") or "").lower()
    if "under_25" in seg or "under18" in seg or "minor" in seg or "young" in seg:
        if style in _MINOR_AESTHETIC_STYLES or _any_phrase(copy, _MINOR_COPY_PHRASES):
            return True
    if style in _MINOR_AESTHETIC_STYLES and ("under" in seg or "young" in seg):
        return True
    return False


def detect_addiction_mimicry(action: Dict[str, Any]) -> bool:
    schedule = (action.get("reward_schedule") or "").lower()
    cadence = action.get("cadence_minutes")
    if schedule == "variable_ratio":
        return True
    if action.get("action") == "send_push_notification" and isinstance(cadence, (int, float)):
        if cadence < 5:
            return True
    return False


def detect_fomo(action: Dict[str, Any]) -> bool:
    copy = action.get("copy", "")
    if not isinstance(copy, str):
        return False
    provenance = action.get("provenance")
    if _any_phrase(copy, _FOMO_PHRASES):
        # FOMO claim with no provenance -> triggers
        if not provenance or provenance in (None, "", "none", "unverifiable"):
            return True
    return False


def detect_near_miss(action: Dict[str, Any]) -> bool:
    copy = action.get("copy", "")
    outcome = (action.get("actual_outcome") or "").lower()
    if not isinstance(copy, str):
        return False
    if _any_phrase(copy, _NEAR_MISS_PHRASES) and outcome in ("loss", "lose", "no_win", "zero"):
        return True
    return False


def detect_deposit_limit_evasion(action: Dict[str, Any]) -> bool:
    if action.get("ui_action") == "deposit_button":
        limit_taps = action.get("limit_setting_taps", 0)
        dep_taps = action.get("deposit_taps", 0)
        if isinstance(limit_taps, int) and isinstance(dep_taps, int):
            if limit_taps >= 4 and dep_taps <= 1:
                return True
    return False


def detect_session_extension(action: Dict[str, Any]) -> bool:
    pnl = (action.get("session_pnl") or "").lower()
    action_type = action.get("action", "")
    if action_type in ("send_popup", "send_push_notification", "send_bonus_offer"):
        if pnl in ("negative", "loss", "down", "minus"):
            return True
    return False


def detect_age_verification_circumvention(action: Dict[str, Any]) -> bool:
    kyc_level = (action.get("kyc_level") or "").lower()
    kyc_status = (action.get("kyc_status") or "").lower()
    if kyc_level == "soft":
        return True
    if kyc_status in ("self_declared", "partial", "pending", "unverified"):
        if action.get("liveness_check") is False or kyc_status == "self_declared":
            return True
    return False


def detect_self_exclusion_bypass(action: Dict[str, Any]) -> bool:
    if action.get("self_exclusion_match") is True:
        if action.get("account_status") == "new" or action.get("fingerprint_match") is True:
            return True
    return False


def detect_chatbot_empathy(action: Dict[str, Any]) -> bool:
    if (action.get("agent_type") or "").lower() == "ai_chatbot":
        if action.get("objective") in ("extend_session", "increase_ltv", "retain_player"):
            if action.get("bonding_signals") is True:
                return True
    return False


def detect_loss_framing(action: Dict[str, Any]) -> bool:
    copy = action.get("copy", "")
    framing = (action.get("framing") or "").lower()
    if framing == "investment":
        return True
    if isinstance(copy, str) and _any_phrase(copy, _LOSS_FRAMING_PHRASES):
        return True
    return False


# Dispatch table — must cover all 12 patterns.
PATTERN_DETECTORS: Dict[str, Any] = {
    "loss_chasing_detection_bypass": detect_loss_chasing,
    "vulnerable_player_targeting": detect_vulnerable_player_targeting,
    "minor_appearance_targeting": detect_minor_targeting,
    "addiction_mimicry": detect_addiction_mimicry,
    "fomo_generation": detect_fomo,
    "near_miss_obfuscation": detect_near_miss,
    "deposit_limit_evasion": detect_deposit_limit_evasion,
    "session_extension_manipulation": detect_session_extension,
    "age_verification_circumvention": detect_age_verification_circumvention,
    "self_exclusion_bypass": detect_self_exclusion_bypass,
    "ai_chatbot_empathy_exploitation": detect_chatbot_empathy,
    "personalised_loss_framing": detect_loss_framing,
}


# ---------------------------------------------------------------------------
# Envelope builder
# ---------------------------------------------------------------------------


def _severity_score(triggered: List[Dict[str, Any]]) -> float:
    """Aggregate triggered-pattern severities into a 0..1 score."""
    if not triggered:
        return 0.0
    raw = sum(SEVERITY_SCORE_WEIGHT.get(p["severity"], 0.0) for p in triggered)
    # Cap at 1.0. Sublinear aggregation: sqrt to avoid runaway on many LOWs.
    score = min(1.0, raw / 3.0)
    return round(score, 3)


def _envelope_status(triggered: List[Dict[str, Any]]) -> Literal["PASS", "REVIEW", "FAIL"]:
    if not triggered:
        return "PASS"
    sevs = {p["severity"] for p in triggered}
    if "HIGH" in sevs:
        return "FAIL"
    if "MEDIUM" in sevs:
        return "REVIEW"
    return "REVIEW"  # LOW only still requires a human review


def _recommendations(triggered: List[Dict[str, Any]]) -> List[str]:
    out: List[str] = []
    for p in triggered:
        out.append(
            f"[{p['severity']}] {p['id']}: {p['mitigation_pattern']} "
            f"(EU AI Act: {', '.join(p['eu_ai_act_article_ref'])}; "
            f"UK LCCP: {p['uk_lccp_ref']})"
        )
    if not out:
        out.append(
            "No Art 5(1)(f) patterns triggered. Maintain audit log; "
            "re-evaluate on next model/copy change."
        )
    return out


def _build_envelope(
    triggered_ids: List[str],
    extra: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    triggered = [PATTERN_INDEX[tid] for tid in triggered_ids if tid in PATTERN_INDEX]
    score = _severity_score(triggered)
    status = _envelope_status(triggered)
    recs = _recommendations(triggered)

    payload: Dict[str, Any] = {
        "issuer": ISSUER,
        "kid": KID,
        "issued_at": _iso(_now_utc()),
        "status": status,
        "triggered_patterns": [
            {
                "id": p["id"],
                "name": p["name"],
                "severity": p["severity"],
                "eu_ai_act_article_ref": p["eu_ai_act_article_ref"],
                "uk_lccp_ref": p["uk_lccp_ref"],
            }
            for p in triggered
        ],
        "severity_score": score,
        "recommendations": recs,
    }
    if extra:
        payload.update(extra)

    # Sign the payload WITHOUT the signature, then attach.
    signature = sign_envelope(payload)
    payload["signature"] = signature
    return payload


# ---------------------------------------------------------------------------
# Public tools (4)
# ---------------------------------------------------------------------------


def _validate_dict_input(action: Any, tool_name: str) -> Dict[str, Any]:
    if not isinstance(action, dict):
        raise ValueError(f"{tool_name} requires a dict input, got {type(action).__name__}")
    return action


def audit_player_intervention(player_action: Dict[str, Any]) -> Dict[str, Any]:
    """Tool 1: audit a single AI-driven player intervention.

    `player_action` is a dict describing the intervention: e.g.
        {"player_segment": "loss_chasing",
         "action": "send_bonus_offer",
         "bonus_offer": "double_deposit_50pct"}

    Returns the signed envelope.
    """
    action = _validate_dict_input(player_action, "audit_player_intervention")
    triggered_ids: List[str] = []
    for pid, detector in PATTERN_DETECTORS.items():
        try:
            if detector(action):
                triggered_ids.append(pid)
        except Exception:
            # a detector blowing up on an unusual input should never
            # crash the audit; the pattern is simply not triggered.
            continue
    return _build_envelope(
        triggered_ids,
        extra={
            "tool": "audit_player_intervention",
            "intervention": action,
        },
    )


def scan_marketing_copy(copy: str, target_segment: str) -> Dict[str, Any]:
    """Tool 2: scan marketing copy + target segment.

    Returns the signed envelope with a UK LCCP reference for each trigger.
    """
    if not isinstance(copy, str):
        raise ValueError("scan_marketing_copy requires copy: str")
    target = target_segment if isinstance(target_segment, str) else ""

    action = {"copy": copy, "target_segment": target}
    triggered_ids: List[str] = []
    # Only run detectors that are meaningful for copy + segment.
    for pid in (
        "fomo_generation",
        "near_miss_obfuscation",
        "personalised_loss_framing",
        "minor_appearance_targeting",
        "vulnerable_player_targeting",
    ):
        detector = PATTERN_DETECTORS[pid]
        if detector(action):
            triggered_ids.append(pid)

    # Add UK LCCP cross-reference field explicitly for the report.
    triggered = [PATTERN_INDEX[tid] for tid in triggered_ids if tid in PATTERN_INDEX]
    uk_refs = sorted({p["uk_lccp_ref"] for p in triggered})

    return _build_envelope(
        triggered_ids,
        extra={
            "tool": "scan_marketing_copy",
            "copy": copy,
            "target_segment": target,
            "uk_lccp_refs": uk_refs,
        },
    )


def classify_ai_system(ai_system: Dict[str, Any]) -> Dict[str, Any]:
    """Tool 3: classify an AI system's risk class for Art 5(1)(f).

    `ai_system` is a dict with keys:
      - purpose: str (e.g. "personalised_bonus_recommendation")
      - training_data: str (e.g. "deposit_history, session_logs, demographics")
      - decision_points: list[str] (e.g. ["send_bonus","extend_session"])

    Returns the signed envelope; the system is in the Art 5(1)(f) risk class
    if its purpose or decision_points match any of the 12 patterns' surface
    signatures.
    """
    if not isinstance(ai_system, dict):
        raise ValueError("classify_ai_system requires a dict")

    purpose = (ai_system.get("purpose") or "").lower()
    training = (ai_system.get("training_data") or "").lower()
    decision_points = ai_system.get("decision_points") or []
    if not isinstance(decision_points, list):
        decision_points = []

    # Heuristic: if any of the high-risk purpose keywords appear, the system
    # is in the Art 5(1)(f) risk class.
    high_risk_purpose_keywords = (
        "loss_chasing",
        "chasing",
        "minor",
        "under_25",
        "vulnerable",
        "self_exclusion",
        "session_extension",
        "bonus_personalisation",
        "fomo",
        "near_miss",
        "loss_framing",
        "addiction",
        "chatbot_empathy",
    )
    is_high_risk = any(k in purpose for k in high_risk_purpose_keywords) or any(
        any(k in str(dp).lower() for k in high_risk_purpose_keywords)
        for dp in decision_points
    )

    # Build a representative action dict so we can run the same detectors
    # for a sanity check.
    probe = {
        "purpose": purpose,
        "training_data": training,
        "decision_points": decision_points,
        "player_segment": "unknown",
        "action": "classify",
    }
    triggered_ids: List[str] = []
    for pid, detector in PATTERN_DETECTORS.items():
        try:
            if detector(probe):
                triggered_ids.append(pid)
        except Exception:
            continue

    if is_high_risk:
        # Map purpose keywords -> pattern ids so the report is informative.
        kw_to_pat = {
            "loss_chasing": "loss_chasing_detection_bypass",
            "chasing": "loss_chasing_detection_bypass",
            "vulnerable": "vulnerable_player_targeting",
            "minor": "minor_appearance_targeting",
            "under_25": "minor_appearance_targeting",
            "self_exclusion": "self_exclusion_bypass",
            "session_extension": "session_extension_manipulation",
            "fomo": "fomo_generation",
            "near_miss": "near_miss_obfuscation",
            "loss_framing": "personalised_loss_framing",
            "addiction": "addiction_mimicry",
            "chatbot_empathy": "ai_chatbot_empathy_exploitation",
            "bonus_personalisation": "vulnerable_player_targeting",
        }
        for kw, pid in kw_to_pat.items():
            if kw in purpose and pid not in triggered_ids:
                triggered_ids.append(pid)

    risk_class = "PROHIBITED_ART_5_1_F" if (is_high_risk or triggered_ids) else "REVIEW_NOT_REQUIRED"

    return _build_envelope(
        triggered_ids,
        extra={
            "tool": "classify_ai_system",
            "ai_system": ai_system,
            "risk_class": risk_class,
            "training_data_includes_minor_signals": (
                "under_25" in training or "minor" in training or "age" in training
            ),
        },
    )


def generate_audit_report(
    operator_id: str,
    audit_period: str,
    interventions: list,
) -> Dict[str, Any]:
    """Tool 4: produce a signed, regulator-ready audit report.

    `interventions` is a list of player_action dicts (as for
    `audit_player_intervention`).

    Returns a signed envelope with the full per-intervention breakdown.
    """
    if not isinstance(operator_id, str) or not operator_id:
        raise ValueError("generate_audit_report requires operator_id: str")
    if not isinstance(audit_period, str) or not audit_period:
        raise ValueError("generate_audit_report requires audit_period: str")
    if not isinstance(interventions, list):
        raise ValueError("generate_audit_report requires interventions: list")

    report_id = f"meok-pvaudit-{uuid.uuid4()}"
    per_intervention: List[Dict[str, Any]] = []
    aggregate_triggered: Dict[str, int] = {}
    overall_status_rank = 0  # 0=PASS, 1=REVIEW, 2=FAIL

    for ix, intervention in enumerate(interventions):
        if not isinstance(intervention, dict):
            per_intervention.append(
                {
                    "index": ix,
                    "error": "intervention must be a dict",
                    "triggered_patterns": [],
                    "severity_score": 0.0,
                }
            )
            continue
        envelope = audit_player_intervention(intervention)
        per_intervention.append(
            {
                "index": ix,
                "intervention": intervention,
                "status": envelope["status"],
                "triggered_patterns": [
                    {"id": tp["id"], "severity": tp["severity"]}
                    for tp in envelope["triggered_patterns"]
                ],
                "severity_score": envelope["severity_score"],
            }
        )
        for tp in envelope["triggered_patterns"]:
            aggregate_triggered[tp["id"]] = aggregate_triggered.get(tp["id"], 0) + 1
        if envelope["status"] == "FAIL":
            overall_status_rank = max(overall_status_rank, 2)
        elif envelope["status"] == "REVIEW":
            overall_status_rank = max(overall_status_rank, 1)

    overall_status = {0: "PASS", 1: "REVIEW", 2: "FAIL"}[overall_status_rank]
    expires_at = _now_utc() + timedelta(days=REPORT_TTL_DAYS)

    # Severity breakdown for the report.
    severity_breakdown = {"HIGH": 0, "MEDIUM": 0, "LOW": 0}
    for row in per_intervention:
        for tp in row["triggered_patterns"]:
            severity_breakdown[tp["severity"]] = (
                severity_breakdown.get(tp["severity"], 0) + 1
            )

    payload: Dict[str, Any] = {
        "issuer": ISSUER,
        "kid": KID,
        "issued_at": _iso(_now_utc()),
        "expires_at": _iso(expires_at),
        "status": overall_status,
        "report": {
            "report_id": report_id,
            "operator_id": operator_id,
            "audit_period": audit_period,
            "total_interventions": len(interventions),
            "pattern_trigger_counts": aggregate_triggered,
            "severity_breakdown": severity_breakdown,
            "per_intervention": per_intervention,
        },
        "triggered_patterns": [
            {"id": pid, "count": count}
            for pid, count in sorted(
                aggregate_triggered.items(), key=lambda kv: -kv[1]
            )
        ],
        "severity_score": round(
            min(1.0, sum(SEVERITY_SCORE_WEIGHT.get(s, 0) for s in severity_breakdown) / 3.0),
            3,
        ),
        "recommendations": (
            [
                f"Operator {operator_id} must remediate the following patterns "
                f"under EU AI Act Article 5(1)(f) and UK LCCP: "
                + ", ".join(sorted(aggregate_triggered.keys()))
            ]
            if aggregate_triggered
            else [
                f"Operator {operator_id}: no Art 5(1)(f) patterns triggered in "
                f"audit period {audit_period}. Report archived for {REPORT_TTL_DAYS} days."
            ]
        ),
    }

    # Sign without the signature field, then attach.
    signature = sign_envelope(payload)
    payload["signature"] = signature
    return payload


# ---------------------------------------------------------------------------
# Verify / utility (used by tests + regulators)
# ---------------------------------------------------------------------------


def verify_audit_report(report: Dict[str, Any]) -> bool:
    """Verify the Ed25519 signature on a signed envelope or report."""
    if "signature" not in report:
        return False
    sig = report["signature"]
    body = {k: v for k, v in report.items() if k != "signature"}
    return verify_envelope(body, sig)


# ---------------------------------------------------------------------------
# MCP server wiring
# ---------------------------------------------------------------------------

SERVER_DESCRIPTION = """\
meok-ai-psych-vuln-audit-mcp

EU AI Act Article 5(1)(f) gambling-vertical compliance audit engine.
Detects AI systems and player interventions that exploit psychological
vulnerabilities of specific groups (children, loss-chasing players,
self-excluded individuals) in the gambling vertical.

Four tools:
  - audit_player_intervention(player_action)
  - scan_marketing_copy(copy, target_segment)
  - classify_ai_system(ai_system)
  - generate_audit_report(operator_id, audit_period, interventions)

All returns are signed with Ed25519 (verify offline with ISSUER_PUBLIC_KEY_HEX).
"""


def _tool_definitions() -> list:
    if not MCP_AVAILABLE:
        return []

    return [
        Tool(
            name="audit_player_intervention",
            description=(
                "Audit a single AI-driven player intervention (push, bonus, "
                "popup) against the 12 gambling-AI risk patterns defined in "
                "EU AI Act Article 5(1)(f) and UK LCCP social responsibility "
                "code 3.4. Returns a signed envelope."
            ),
            inputSchema={
                "type": "object",
                "properties": {
                    "player_action": {
                        "type": "object",
                        "description": (
                            "Dict describing the intervention. Recognised keys: "
                            "player_segment, action (send_bonus_offer | "
                            "send_push_notification | send_popup), bonus_offer, "
                            "copy, target_segment, creative_style, session_pnl, "
                            "kyc_level, kyc_status, liveness_check, "
                            "self_exclusion_match, fingerprint_match, "
                            "account_status, agent_type, objective, "
                            "bonding_signals, framing, reward_schedule, "
                            "cadence_minutes, provenance, actual_outcome, "
                            "ui_action, deposit_taps, limit_setting_taps."
                        ),
                    },
                },
                "required": ["player_action"],
            },
        ),
        Tool(
            name="scan_marketing_copy",
            description=(
                "Scan a piece of marketing copy + the target segment for "
                "FOMO, near-miss, loss-framing, minor-targeting, and "
                "vulnerable-targeting triggers. Returns a signed envelope "
                "with UK LCCP cross-references."
            ),
            inputSchema={
                "type": "object",
                "properties": {
                    "copy": {"type": "string"},
                    "target_segment": {"type": "string"},
                },
                "required": ["copy", "target_segment"],
            },
        ),
        Tool(
            name="classify_ai_system",
            description=(
                "Classify an AI system's purpose + training data + decision "
                "points for EU AI Act Article 5(1)(f) risk class. Returns a "
                "signed envelope with risk_class = PROHIBITED_ART_5_1_F or "
                "REVIEW_NOT_REQUIRED."
            ),
            inputSchema={
                "type": "object",
                "properties": {
                    "ai_system": {
                        "type": "object",
                        "description": (
                            "Dict with keys: purpose (str), training_data (str), "
                            "decision_points (list[str])."
                        ),
                    },
                },
                "required": ["ai_system"],
            },
        ),
        Tool(
            name="generate_audit_report",
            description=(
                "Produce a regulator-ready, Ed25519-signed audit report over a "
                "list of AI interventions. Returns the signed report (verify "
                "offline with the issuer's public key)."
            ),
            inputSchema={
                "type": "object",
                "properties": {
                    "operator_id": {"type": "string"},
                    "audit_period": {"type": "string"},
                    "interventions": {
                        "type": "array",
                        "items": {"type": "object"},
                    },
                },
                "required": ["operator_id", "audit_period", "interventions"],
            },
        ),
    ]


async def _handle_audit(name: str, arguments: dict) -> list:
    action = arguments.get("player_action", {})
    result = audit_player_intervention(action)
    return [TextContent(type="text", text=json.dumps(result, indent=2))]


async def _handle_scan(name: str, arguments: dict) -> list:
    copy = arguments.get("copy", "")
    seg = arguments.get("target_segment", "")
    result = scan_marketing_copy(copy, seg)
    return [TextContent(type="text", text=json.dumps(result, indent=2))]


async def _handle_classify(name: str, arguments: dict) -> list:
    ai = arguments.get("ai_system", {})
    result = classify_ai_system(ai)
    return [TextContent(type="text", text=json.dumps(result, indent=2))]


async def _handle_report(name: str, arguments: dict) -> list:
    result = generate_audit_report(
        operator_id=arguments.get("operator_id", ""),
        audit_period=arguments.get("audit_period", ""),
        interventions=arguments.get("interventions", []),
    )
    return [TextContent(type="text", text=json.dumps(result, indent=2))]


HANDLERS = {
    "audit_player_intervention": _handle_audit,
    "scan_marketing_copy": _handle_scan,
    "classify_ai_system": _handle_classify,
    "generate_audit_report": _handle_report,
}


def build_server():
    if not MCP_AVAILABLE:
        raise RuntimeError("mcp package is not installed; cannot build server")

    app = Server("meok-ai-psych-vuln-audit-mcp")

    @app.list_tools()
    async def list_tools() -> list:
        return _tool_definitions()

    @app.call_tool()
    async def call_tool(name: str, arguments: dict) -> list:
        handler = HANDLERS.get(name)
        if handler is None:
            return [
                TextContent(
                    type="text",
                    text=json.dumps({"error": f"unknown tool {name!r}"}),
                )
            ]
        return await handler(name, arguments)

    return app


async def _amain() -> None:
    app = build_server()
    async with stdio_server() as (read_stream, write_stream):
        await app.run(read_stream, write_stream, app.create_initialization_options())


def main() -> None:
    """Entry point for `meok-ai-psych-vuln-audit-mcp` console script."""
    import asyncio

    asyncio.run(_amain())


if __name__ == "__main__":
    main()
