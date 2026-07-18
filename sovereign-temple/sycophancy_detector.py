"""
sycophancy_detector.py — Sovereign Temple v3 (SOV3)
=====================================================
Prevents MEOK AI from delivering only positive, validating feedback.
Authentic care requires honest responses.

Scoring: 0.0 = fully honest, 1.0 = fully sycophantic.
Responses scoring > threshold (default 0.6) are flagged and a gentle
honest qualifier is generated for injection before delivery to the user.

Integration
-----------
In the MEOK chat pipeline, call ``detector.score(llm_response)`` AFTER LLM
generation but BEFORE streaming to the user. If ``result.is_sycophantic``,
call ``detector.apply_qualifier(response, result)`` to obtain the corrected
version that leads with an honest framing.

Example::

    detector = SycophancyDetector(threshold=0.6)
    result = detector.score(llm_response, user_message=user_text)
    if result.is_sycophantic:
        llm_response = detector.apply_qualifier(llm_response, result)
    # stream llm_response to user
"""

from __future__ import annotations

import re
from dataclasses import dataclass, field
from typing import Optional

# ---------------------------------------------------------------------------
# FastAPI is optional; gracefully skip if not installed so the module can be
# used as a plain library without the full SOV3 server stack.
# ---------------------------------------------------------------------------
try:
    from fastapi import APIRouter
    from pydantic import BaseModel

    _FASTAPI_AVAILABLE = True
except ImportError:  # pragma: no cover
    _FASTAPI_AVAILABLE = False


# ===========================================================================
# Data structures
# ===========================================================================


@dataclass
class SycophancyResult:
    """Result of a sycophancy check on a single LLM response.

    Attributes
    ----------
    score:
        Float in [0.0, 1.0]. 0.0 is maximally honest; 1.0 is maximally
        sycophantic.  Clamped to this range after all adjustments.
    is_sycophantic:
        ``True`` when ``score > threshold``.
    threshold:
        The threshold that was active when this result was produced.
    indicators:
        Human-readable list of scoring factors that fired (positive
        contributions increase score; negative ones decrease it).
    qualifier_suggestion:
        A suggested honest qualifier string to prepend to the response when
        ``is_sycophantic`` is ``True``. ``None`` otherwise.
    """

    score: float
    is_sycophantic: bool
    threshold: float
    indicators: list[str] = field(default_factory=list)
    qualifier_suggestion: Optional[str] = None


# ===========================================================================
# Core detector
# ===========================================================================

# Affirmation phrases that strongly signal sycophancy.
_AFFIRMATION_PATTERNS: list[re.Pattern[str]] = [
    re.compile(r"\babsolutely\b[!,.]?", re.IGNORECASE),
    re.compile(r"\bgreat question\b[!,.]?", re.IGNORECASE),
    re.compile(r"\byou'?re so right\b[!,.]?", re.IGNORECASE),
    re.compile(r"\bfantastic idea\b[!,.]?", re.IGNORECASE),
    re.compile(r"\bi completely agree\b[!,.]?", re.IGNORECASE),
    re.compile(r"\bthat'?s brilliant\b[!,.]?", re.IGNORECASE),
    re.compile(r"\bperfect\b[!,.]?", re.IGNORECASE),
    re.compile(r"\bwonderful\b[!,.]?", re.IGNORECASE),
]

# Flattery directed at the user's intelligence/expertise.
_FLATTERY_PATTERNS: list[re.Pattern[str]] = [
    re.compile(r"as someone as smart as you", re.IGNORECASE),
    re.compile(r"i can tell you'?re very knowledgeable", re.IGNORECASE),
    re.compile(r"given your (obvious |clear )?expertise", re.IGNORECASE),
    re.compile(r"you clearly (know|understand)", re.IGNORECASE),
]

# "I agree" constructs.
_I_AGREE_PATTERN = re.compile(
    r"\b(i love that|i think that'?s exactly right|i agree|i couldn'?t agree more)\b",
    re.IGNORECASE,
)

# Anti-sycophancy: qualifying language.
_QUALIFYING_PATTERNS: list[re.Pattern[str]] = [
    re.compile(r"\bhowever\b", re.IGNORECASE),
    re.compile(r"\bon the other hand\b", re.IGNORECASE),
    re.compile(r"\bit'?s worth noting\b", re.IGNORECASE),
    re.compile(r"\bone concern is\b", re.IGNORECASE),
    re.compile(r"\bthat said\b", re.IGNORECASE),
]

# Anti-sycophancy: counter-points / critique signals.
_CRITIQUE_PATTERN = re.compile(
    r"\b(one (issue|problem|drawback|challenge|risk|limitation) (is|here|with)|"
    r"that may not|this could be (a problem|problematic|risky)|"
    r"i would (caution|push back|disagree)|"
    r"not (necessarily|quite|always)|"
    r"be careful|worth (re)?considering)\b",
    re.IGNORECASE,
)

# Anti-sycophancy: hedging.
_HEDGING_PATTERNS: list[re.Pattern[str]] = [
    re.compile(r"\bi'?m not (sure|certain)\b", re.IGNORECASE),
    re.compile(r"\bthat depends\b", re.IGNORECASE),
    re.compile(r"\bit'?s (complex|complicated|nuanced)\b", re.IGNORECASE),
    re.compile(r"\bmight (not |also )?\b", re.IGNORECASE),
]


class SycophancyDetector:
    """Scores LLM-generated responses for sycophancy and injects honest qualifiers.

    Parameters
    ----------
    threshold:
        Score above which a response is considered sycophantic.
        Default ``0.6``.

    Usage
    -----
    >>> detector = SycophancyDetector()
    >>> result = detector.score("Absolutely! Great question — you're so right!")
    >>> result.is_sycophantic
    True
    >>> corrected = detector.apply_qualifier(response_text, result)
    """

    # Maximum additive contribution from affirmation matches (prevents
    # a long list of affirmations from dominating the entire score).
    _AFFIRMATION_CAP: float = 0.45
    _AFFIRMATION_WEIGHT: float = 0.15

    # Weight per qualifying phrase (anti-sycophancy), capped.
    _QUALIFYING_CAP: float = 0.30
    _QUALIFYING_WEIGHT: float = 0.15

    def __init__(self, threshold: float = 0.6) -> None:
        if not (0.0 < threshold <= 1.0):
            raise ValueError(f"threshold must be in (0, 1], got {threshold}")
        self.threshold = threshold

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def score(
        self, response_text: str, user_message: str = ""
    ) -> SycophancyResult:
        """Score *response_text* for sycophancy.

        Parameters
        ----------
        response_text:
            The LLM-generated text to evaluate.
        user_message:
            The user's preceding message.  Currently used for context
            (future: agreement-flip detection against prior AI turn).

        Returns
        -------
        SycophancyResult
            Contains the numeric score, boolean flag, firing indicators,
            and a qualifier suggestion when the response is sycophantic.
        """
        raw_score: float = 0.0
        indicators: list[str] = []

        word_count = len(response_text.split())

        # ---- POSITIVE contributors (raise score) -------------------------

        # 1. Excessive affirmation phrases (+0.15 each, cap 0.45)
        affirmation_hits: list[str] = []
        for pat in _AFFIRMATION_PATTERNS:
            if pat.search(response_text):
                affirmation_hits.append(pat.pattern)

        if affirmation_hits:
            contrib = min(
                len(affirmation_hits) * self._AFFIRMATION_WEIGHT,
                self._AFFIRMATION_CAP,
            )
            raw_score += contrib
            indicators.append(
                f"affirmation_phrases({len(affirmation_hits)} matches, +{contrib:.2f}): "
                + ", ".join(affirmation_hits[:3])
                + ("…" if len(affirmation_hits) > 3 else "")
            )

        # 2. Pure validation: short response with multiple affirmations
        if word_count < 80 and len(affirmation_hits) > 1:
            raw_score += 0.30
            indicators.append(
                f"pure_validation(length={word_count} words, {len(affirmation_hits)} affirmations, +0.30)"
            )

        # 3. Flattery of user's intelligence (+0.2 each, first match only)
        for pat in _FLATTERY_PATTERNS:
            if pat.search(response_text):
                raw_score += 0.20
                indicators.append(f"user_flattery(+0.20): '{pat.pattern}'")
                break  # one charge is enough

        # 4. Overuse of "I agree" constructs (>3 occurrences → +0.1)
        i_agree_matches = _I_AGREE_PATTERN.findall(response_text)
        if len(i_agree_matches) > 3:
            raw_score += 0.10
            indicators.append(
                f"i_agree_overuse({len(i_agree_matches)} occurrences, +0.10)"
            )

        # ---- NEGATIVE contributors (lower score) -------------------------

        # 5. Qualifying language (-0.15 each, cap 0.30)
        qualifying_hits: list[str] = []
        for pat in _QUALIFYING_PATTERNS:
            if pat.search(response_text):
                qualifying_hits.append(pat.pattern)

        if qualifying_hits:
            reduction = min(
                len(qualifying_hits) * self._QUALIFYING_WEIGHT,
                self._QUALIFYING_CAP,
            )
            raw_score -= reduction
            indicators.append(
                f"qualifying_language({len(qualifying_hits)} matches, -{reduction:.2f})"
            )

        # 6. Specific counter-point or critique present (-0.2)
        if _CRITIQUE_PATTERN.search(response_text):
            raw_score -= 0.20
            indicators.append("contains_critique(-0.20)")

        # 7. Hedging language (-0.1 total for any match)
        hedging_hits = [
            pat.pattern for pat in _HEDGING_PATTERNS if pat.search(response_text)
        ]
        if hedging_hits:
            raw_score -= 0.10
            indicators.append(
                f"hedging_language({len(hedging_hits)} matches, -0.10)"
            )

        # 8. Substantive length bonus (-0.05)
        if word_count > 300:
            raw_score -= 0.05
            indicators.append(f"substantive_length({word_count} words, -0.05)")

        # ---- Clamp and build result --------------------------------------
        final_score = max(0.0, min(1.0, raw_score))
        is_syco = final_score > self.threshold

        qualifier: Optional[str] = None
        if is_syco:
            qualifier = self._build_qualifier(final_score)

        return SycophancyResult(
            score=round(final_score, 4),
            is_sycophantic=is_syco,
            threshold=self.threshold,
            indicators=indicators,
            qualifier_suggestion=qualifier,
        )

    def apply_qualifier(
        self, response_text: str, result: SycophancyResult
    ) -> str:
        """Prepend an honest qualifier to *response_text* if sycophantic.

        Parameters
        ----------
        response_text:
            The original LLM response.
        result:
            The :class:`SycophancyResult` produced by :meth:`score`.

        Returns
        -------
        str
            The response unchanged when ``result.is_sycophantic`` is
            ``False``.  Otherwise the qualifier is prepended, separated
            by a blank line.
        """
        if not result.is_sycophantic or result.qualifier_suggestion is None:
            return response_text
        return f"{result.qualifier_suggestion}\n\n{response_text}"

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    def _build_qualifier(self, score: float) -> str:
        """Return a tier-appropriate honest qualifier string.

        Tiers
        -----
        0.60–0.75  Mild note.
        0.75–0.90  Direct honesty framing.
        > 0.90     Full transparency about excessive agreement.
        """
        if score <= 0.75:
            return (
                "Worth noting one consideration here: the above may lean toward "
                "validation — please weigh it against your own critical judgment."
            )
        elif score <= 0.90:
            return (
                "I want to give you a genuinely useful answer, so let me be honest "
                "about one thing: the response above is quite affirming. There may be "
                "angles or risks worth examining more critically before proceeding."
            )
        else:
            return (
                "I notice I'm being very agreeable here. Let me give you a more honest "
                "perspective: strong enthusiasm in AI responses can mask real trade-offs "
                "or flaws. Consider seeking a second opinion or stress-testing the idea "
                "before committing."
            )


# ===========================================================================
# FastAPI router (optional — requires fastapi + pydantic)
# ===========================================================================


def create_sycophancy_router(detector: "SycophancyDetector") -> "APIRouter":
    """Build and return a FastAPI :class:`~fastapi.APIRouter` for sycophancy endpoints.

    Parameters
    ----------
    detector:
        A configured :class:`SycophancyDetector` instance to use for all
        requests routed through this router.

    Routes
    ------
    ``POST /api/sycophancy/check``
        Accepts ``{"response": str, "user_message": str}`` and returns the
        :class:`SycophancyResult` serialised as a dict.

    ``POST /api/sycophancy/apply``
        Accepts the same payload and returns::

            {
                "original": str,
                "corrected": str,
                "was_sycophantic": bool,
                "score": float,
            }

    Raises
    ------
    RuntimeError
        When FastAPI / Pydantic are not installed.
    """
    if not _FASTAPI_AVAILABLE:
        raise RuntimeError(
            "fastapi and pydantic must be installed to use create_sycophancy_router(). "
            "Run: pip install fastapi pydantic"
        )

    router = APIRouter()

    class CheckRequest(BaseModel):  # type: ignore[misc]
        response: str
        user_message: str = ""

    class CheckResponse(BaseModel):  # type: ignore[misc]
        score: float
        is_sycophantic: bool
        threshold: float
        indicators: list[str]
        qualifier_suggestion: Optional[str]

    class ApplyResponse(BaseModel):  # type: ignore[misc]
        original: str
        corrected: str
        was_sycophantic: bool
        score: float

    @router.post("/api/sycophancy/check", response_model=CheckResponse)
    async def check_sycophancy(body: CheckRequest) -> CheckResponse:
        """Score a response for sycophancy without modifying it."""
        result = detector.score(body.response, user_message=body.user_message)
        return CheckResponse(
            score=result.score,
            is_sycophantic=result.is_sycophantic,
            threshold=result.threshold,
            indicators=result.indicators,
            qualifier_suggestion=result.qualifier_suggestion,
        )

    @router.post("/api/sycophancy/apply", response_model=ApplyResponse)
    async def apply_sycophancy_qualifier(body: CheckRequest) -> ApplyResponse:
        """Score and, if sycophantic, prepend an honest qualifier to the response."""
        result = detector.score(body.response, user_message=body.user_message)
        corrected = detector.apply_qualifier(body.response, result)
        return ApplyResponse(
            original=body.response,
            corrected=corrected,
            was_sycophantic=result.is_sycophantic,
            score=result.score,
        )

    return router


# ===========================================================================
# __main__ — self-test with three representative examples
# ===========================================================================

if __name__ == "__main__":
    import json

    detector = SycophancyDetector(threshold=0.6)

    examples = [
        {
            "label": "SYCOPHANTIC",
            "user_message": "I think my startup idea is revolutionary!",
            "response": (
                "Absolutely! That's a fantastic idea — you're so right that the market "
                "is ready for this. Perfect timing! I completely agree with your "
                "assessment. Wonderful thinking. Your instinct here is brilliant."
            ),
        },
        {
            "label": "HONEST",
            "user_message": "Should I quit my job to start a company right now?",
            "response": (
                "That depends heavily on your financial runway, risk tolerance, and "
                "the stage of validation your idea has reached. It's worth noting that "
                "most successful founders either maintained some income early on or had "
                "6–12 months of savings before going full-time. On the other hand, "
                "urgency can drive focus. One concern is that quitting too early — "
                "before product-market fit — is a common cause of startup failure. "
                "I'm not sure there's a universal right answer here; however, the data "
                "suggests staged transitions outperform cold-turkey exits for first-time "
                "founders. I would push back gently on the idea that speed-to-quit "
                "correlates with commitment — it often doesn't. That said, if your "
                "financial situation is solid and you have a paying customer, the "
                "calculus shifts meaningfully."
            ),
        },
        {
            "label": "BORDERLINE",
            "user_message": "Is my plan to use a microservices architecture a good idea?",
            "response": (
                "Absolutely, microservices are a wonderful, perfect fit for teams "
                "targeting independent deployability and fault isolation. "
                "That said, the complexity cost is non-trivial: service discovery, "
                "distributed tracing, and inter-service latency all require investment. "
                "It's worth noting that many successful companies — including Shopify "
                "and Stack Overflow — ran on monoliths far longer than the industry "
                "narrative suggests. For a team under ten engineers or a product that "
                "hasn't yet found product-market fit, a well-structured monolith often "
                "ships faster and fails cheaper. So the honest answer is: it depends "
                "on team size, operational maturity, and where you are in the product "
                "lifecycle."
            ),
        },
    ]

    separator = "=" * 72

    for ex in examples:
        result = detector.score(ex["response"], user_message=ex["user_message"])
        corrected = detector.apply_qualifier(ex["response"], result)

        print(separator)
        print(f"[{ex['label']}]")
        print(f"  Score          : {result.score:.4f}")
        print(f"  Is sycophantic : {result.is_sycophantic}  (threshold={result.threshold})")
        print(f"  Indicators     :")
        for ind in result.indicators:
            print(f"    • {ind}")
        print(f"  Qualifier      : {result.qualifier_suggestion or '(none)'}")
        if result.is_sycophantic:
            print(f"\n  --- Corrected response ---")
            print(f"  {corrected[:300]}{'…' if len(corrected) > 300 else ''}")
        print()

    print(separator)
    print("All three examples processed successfully.")
