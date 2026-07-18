#!/usr/bin/env python3
"""
SOV3³ Cascade Router — the escalation layer for the Sovereign backend.

Implements the 10/90 architecture, corrected by the 2026-07-07 empirical finding:
  - A small "conscious" model answers the majority of turns (fast, cheap).
  - Escalation to the large "subconscious" model is driven by an EXTERNAL signal
    (disagreement between two cheap passes, or a verifier), NOT by the small model's
    self-reported confidence — which was measured to be systematically overconfident
    (rated 95-100 even on wrong answers; 0 escalations fired; accuracy dropped).

Empirical basis (SOV3_Model_Consolidation_Scorecard_2026-07-07):
  self-confidence gate  -> 10/12 acc, 0% escalation   (FAILED)
  disagreement route    -> 12/12 acc, 25% escalation  (matches large-only accuracy)

This module is model-agnostic: pass any two callables (small_fn, large_fn) that take a
prompt and return text. It is pure-Python and unit-testable without live inference.
"""
from __future__ import annotations
from dataclasses import dataclass, field
from typing import Callable, Optional
import re


@dataclass
class CascadeResult:
    answer: str
    route: str                 # "small" | "escalated"
    escalated: bool
    small_passes: list = field(default_factory=list)
    reason: str = ""


def _normalize(text: str) -> str:
    """Lowercase, collapse whitespace, strip surrounding punctuation — for comparing answers.
    Punctuation-insensitivity avoids spurious escalations on 'paris' vs 'paris.'."""
    t = re.sub(r"\s+", " ", (text or "").strip().lower())
    return t.strip(".,!?;:'\"()[]")


def _key_token(text: str) -> str:
    """First meaningful token — a cheap agreement proxy for short answers."""
    t = _normalize(text)
    return t.split(" ")[0].strip(".,!?;:'\"()[]") if t else ""


def agreement(a: str, b: str) -> bool:
    """
    External escalation signal #1: do two cheap small-model passes agree?
    Agreement = normalized answers match OR share the same leading token.
    Disagreement is the escalation trigger (the finding that made 10/90 work).
    """
    na, nb = _normalize(a), _normalize(b)
    if not na or not nb:
        return False
    if na == nb:
        return True
    return _key_token(na) == _key_token(nb) and len(na) < 60 and len(nb) < 60


class Sov3CubeCascade:
    """
    conscious (small) → [external gate] → subconscious (large)

    small_fn / large_fn: Callable[[str], str] — plug in haiku/opus, or mamba/llama/kimi
    verifier: optional Callable[[str, str], bool] (prompt, answer) -> is_acceptable.
              If provided, a failing verify also triggers escalation.
    """
    def __init__(
        self,
        small_fn: Callable[[str], str],
        large_fn: Callable[[str], str],
        verifier: Optional[Callable[[str, str], bool]] = None,
        second_pass_suffix: str = " (be concise)",
    ):
        self.small_fn = small_fn
        self.large_fn = large_fn
        self.verifier = verifier
        self.second_pass_suffix = second_pass_suffix
        self.stats = {"total": 0, "escalated": 0}

    def route(self, prompt: str) -> CascadeResult:
        self.stats["total"] += 1
        a1 = self.small_fn(prompt)
        a2 = self.small_fn(prompt + self.second_pass_suffix)  # cheap second opinion
        passes = [a1, a2]

        agree = agreement(a1, a2)
        verified = True if self.verifier is None else self.verifier(prompt, a1)

        if agree and verified:
            return CascadeResult(answer=a1, route="small", escalated=False,
                                 small_passes=passes, reason="two small passes agree" +
                                 ("" if self.verifier is None else " and verified"))

        # escalate the hard minority to the large subconscious
        self.stats["escalated"] += 1
        reason = []
        if not agree:
            reason.append("small passes disagree")
        if not verified:
            reason.append("verifier rejected small answer")
        big = self.large_fn(prompt)
        return CascadeResult(answer=big, route="escalated", escalated=True,
                             small_passes=passes, reason="; ".join(reason))

    @property
    def escalation_rate(self) -> float:
        return self.stats["escalated"] / self.stats["total"] if self.stats["total"] else 0.0
