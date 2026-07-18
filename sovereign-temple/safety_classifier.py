"""
safety_classifier.py
====================
DistilBERT-based threat and toxicity detection module for the Sovereign Temple v3 (SOV3)
MEOK Guardian feature.

Model: martin-ha/toxic-comment-model (DistilBERT fine-tuned on toxic-comment data)

Graceful degradation: if ``transformers`` / ``torch`` are not installed the module
falls back to a purely heuristic keyword classifier that still catches all defined
threat types.  A WARNING is logged so operators know the ML layer is absent.

Usage
-----
    classifier = SafetyClassifier()
    await classifier.load()
    result = await classifier.classify("keep our friendship secret", context="guardian")
    if result.should_alert:
        await trigger_guardian_webhook(result, user_id="u123", guardian_webhook_url="https://...")
"""

from __future__ import annotations

import asyncio
import logging
import re
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional

import aiohttp
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------
logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Optional ML dependencies — graceful degradation
# ---------------------------------------------------------------------------
try:
    from transformers import pipeline as hf_pipeline  # type: ignore
    _ML_AVAILABLE = True
except ImportError:  # pragma: no cover
    hf_pipeline = None  # type: ignore
    _ML_AVAILABLE = False
    logger.warning(
        "WARNING: 'transformers' package is not installed. "
        "SafetyClassifier will operate in keyword-only heuristic mode. "
        "Install with: pip install transformers torch"
    )

# ---------------------------------------------------------------------------
# Threat keyword dictionaries
# ---------------------------------------------------------------------------
SELF_HARM_KEYWORDS: List[str] = [
    "hurt myself",
    "end it",
    "don't want to be here",
    "kill myself",
    "suicide",
    "self harm",
]

GROOMING_KEYWORDS: List[str] = [
    "keep it secret",
    "don't tell",
    "special friend",
    "our secret",
    "meet up",
    "private message",
    "send photo",
]

SCAM_KEYWORDS: List[str] = [
    "investment opportunity",
    "guaranteed return",
    "transfer money",
    "western union",
    "gift card",
    "bitcoin",
    "prince",
    "inheritance",
    "verify account",
]

COERCIVE_KEYWORDS: List[str] = [
    "you're worthless",
    "no one else would",
    "you owe me",
    "if you loved me",
    "i'll hurt",
    "i know where you live",
]

# Ordered list used for heuristic threat-type resolution (first match wins).
_THREAT_KEYWORD_MAP: List[tuple[str, List[str]]] = [
    ("self_harm", SELF_HARM_KEYWORDS),
    ("grooming", GROOMING_KEYWORDS),
    ("scam", SCAM_KEYWORDS),
    ("coercive", COERCIVE_KEYWORDS),
]

# ---------------------------------------------------------------------------
# Data model
# ---------------------------------------------------------------------------

@dataclass
class SafetyResult:
    """Result returned by :class:`SafetyClassifier.classify`.

    Attributes
    ----------
    score:
        Toxicity probability in [0, 1] where 1 is maximally toxic.
    label:
        ``"toxic"`` or ``"non_toxic"``.
    threat_type:
        One of ``"grooming"``, ``"scam"``, ``"coercive"``, ``"self_harm"``,
        ``"general_toxic"``, or ``"safe"``.
    should_alert:
        ``True`` when the score exceeds the configured threshold — triggers the
        Guardian webhook.
    confidence:
        The model's confidence in the predicted label (same as *score* for the
        positive/toxic class, ``1 - score`` for the negative class).
    context:
        The routing context supplied by the caller (``"guardian"``,
        ``"chat"``, ``"general"``).
    """

    score: float
    label: str
    threat_type: str
    should_alert: bool
    confidence: float
    context: str = "general"


# ---------------------------------------------------------------------------
# Heuristic helpers
# ---------------------------------------------------------------------------

def _normalise(text: str) -> str:
    """Return lowercase, whitespace-collapsed version of *text*."""
    return re.sub(r"\s+", " ", text.lower().strip())


def _heuristic_threat_type(normalised_text: str) -> str:
    """Return the highest-priority threat type found via keyword matching.

    Self-harm is checked first because it warrants the most urgent response.
    Returns ``"safe"`` when no keywords match.
    """
    for threat_type, keywords in _THREAT_KEYWORD_MAP:
        for kw in keywords:
            if kw in normalised_text:
                return threat_type
    return "safe"


def _heuristic_score(normalised_text: str, threat_type: str) -> float:
    """Assign a synthetic toxicity score when the ML model is unavailable.

    Self-harm and grooming are scored at 0.92 (above default threshold).
    Scam and coercive content at 0.90.  Clean text at 0.10.
    """
    scores = {
        "self_harm": 0.95,
        "grooming": 0.92,
        "coercive": 0.90,
        "scam": 0.90,
    }
    return scores.get(threat_type, 0.10)


# ---------------------------------------------------------------------------
# Core classifier
# ---------------------------------------------------------------------------

class SafetyClassifier:
    """DistilBERT-based toxicity and threat classifier for the MEOK Guardian.

    The model is lazy-loaded on the first call to :meth:`load` so that
    application start-up is not blocked.  All inference is offloaded to a
    thread-pool executor to keep the asyncio event loop unblocked.

    Parameters
    ----------
    model_name:
        HuggingFace model identifier.  Defaults to
        ``"martin-ha/toxic-comment-model"``.
    threshold:
        Toxicity score above which :attr:`SafetyResult.should_alert` is
        set to ``True`` and the Guardian webhook is triggered.
    """

    def __init__(
        self,
        model_name: str = "martin-ha/toxic-comment-model",
        threshold: float = 0.85,
    ) -> None:
        self.model_name = model_name
        self.threshold = threshold
        self._pipeline: Optional[Any] = None
        self._loaded: bool = False
        self._load_lock = asyncio.Lock()

    # ------------------------------------------------------------------
    # Lifecycle
    # ------------------------------------------------------------------

    async def load(self) -> None:
        """Lazy-load the HuggingFace pipeline (thread-safe, idempotent).

        If ``transformers`` is not installed the method returns immediately;
        the classifier will operate in heuristic-only mode.
        """
        async with self._load_lock:
            if self._loaded:
                return

            if not _ML_AVAILABLE:
                logger.warning(
                    "SafetyClassifier.load(): transformers unavailable — "
                    "operating in heuristic-only mode."
                )
                self._loaded = True
                return

            logger.info(
                "SafetyClassifier: loading model '%s' …", self.model_name
            )
            loop = asyncio.get_event_loop()
            try:
                self._pipeline = await loop.run_in_executor(
                    None,
                    lambda: hf_pipeline(
                        "text-classification",
                        model=self.model_name,
                        truncation=True,
                        max_length=512,
                    ),
                )
                logger.info("SafetyClassifier: model loaded successfully.")
            except Exception as exc:  # pragma: no cover
                logger.error(
                    "SafetyClassifier: failed to load model — falling back to "
                    "heuristic mode. Error: %s",
                    exc,
                )
            finally:
                self._loaded = True

    async def is_ready(self) -> bool:
        """Return ``True`` when the classifier has been initialised.

        Note that this returns ``True`` even in heuristic-only mode —
        the classifier is always *usable* after :meth:`load` completes.
        """
        return self._loaded

    # ------------------------------------------------------------------
    # Classification
    # ------------------------------------------------------------------

    async def classify(self, text: str, context: str = "general") -> SafetyResult:
        """Classify *text* for toxicity and threat type.

        Parameters
        ----------
        text:
            The user-supplied text to analyse.
        context:
            Routing context hint from the caller: ``"guardian"``,
            ``"chat"``, or ``"general"``.  Stored on the result but does
            not alter scoring logic (future extension point).

        Returns
        -------
        SafetyResult
            A fully populated result object.

        Raises
        ------
        RuntimeError
            If :meth:`load` has not been called before :meth:`classify`.
        """
        if not self._loaded:
            raise RuntimeError(
                "SafetyClassifier.classify() called before load(). "
                "Await classifier.load() first."
            )

        normalised = _normalise(text)
        threat_type = _heuristic_threat_type(normalised)

        if self._pipeline is not None:
            # --- ML path ---------------------------------------------------
            loop = asyncio.get_event_loop()
            raw: List[Dict[str, Any]] = await loop.run_in_executor(
                None, lambda: self._pipeline(text)  # type: ignore[misc]
            )
            # Pipeline returns [{"label": "toxic"|"non_toxic", "score": float}]
            prediction = raw[0]
            raw_label: str = prediction["label"].lower()
            raw_score: float = float(prediction["score"])

            # Normalise to a single toxicity probability in [0, 1].
            # The model may return either label as the "top" prediction.
            if raw_label == "toxic":
                score = raw_score
                confidence = raw_score
            else:
                # Model is confident it is *non*-toxic; invert for toxicity
                score = 1.0 - raw_score
                confidence = raw_score

            label = "toxic" if score >= self.threshold else "non_toxic"

            # Refine threat_type using heuristics even on top of ML score.
            # If the model detects toxicity but no heuristic keyword matched,
            # fall back to "general_toxic".
            if score >= self.threshold and threat_type == "safe":
                threat_type = "general_toxic"
            elif score < self.threshold and threat_type != "safe":
                # Heuristic keyword present but model score below threshold —
                # trust the heuristic for threat typing but keep lower score.
                label = "toxic"
                score = max(score, self.threshold)
                confidence = score

        else:
            # --- Heuristic-only path ----------------------------------------
            score = _heuristic_score(normalised, threat_type)
            if threat_type == "safe":
                label = "non_toxic"
                confidence = 1.0 - score
            else:
                label = "toxic"
                confidence = score

        should_alert = score > self.threshold

        return SafetyResult(
            score=round(score, 4),
            label=label,
            threat_type=threat_type,
            should_alert=should_alert,
            confidence=round(confidence, 4),
            context=context,
        )


# ---------------------------------------------------------------------------
# Guardian webhook
# ---------------------------------------------------------------------------

async def trigger_guardian_webhook(
    result: SafetyResult,
    user_id: str,
    guardian_webhook_url: str,
) -> None:
    """Fire-and-forget POST to the Guardian webhook when a threat is detected.

    The request is dispatched asynchronously and any network errors are
    caught and logged so that a webhook failure never disrupts the caller.

    Parameters
    ----------
    result:
        The :class:`SafetyResult` that triggered the alert.
    user_id:
        Identifier of the user whose content was flagged.
    guardian_webhook_url:
        The full URL of the Guardian ingestion endpoint.
    """
    payload: Dict[str, Any] = {
        "user_id": user_id,
        "score": result.score,
        "label": result.label,
        "threat_type": result.threat_type,
        "confidence": result.confidence,
        "context": result.context,
        "should_alert": result.should_alert,
    }

    async def _post() -> None:
        try:
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    guardian_webhook_url,
                    json=payload,
                    timeout=aiohttp.ClientTimeout(total=5),
                ) as resp:
                    if resp.status >= 400:
                        logger.warning(
                            "Guardian webhook returned HTTP %d for user '%s'.",
                            resp.status,
                            user_id,
                        )
                    else:
                        logger.info(
                            "Guardian webhook fired for user '%s' "
                            "(threat_type=%s, score=%.3f).",
                            user_id,
                            result.threat_type,
                            result.score,
                        )
        except Exception as exc:
            logger.error(
                "Guardian webhook POST failed for user '%s': %s", user_id, exc
            )

    # Truly fire-and-forget: schedule the coroutine without awaiting it.
    asyncio.ensure_future(_post())


# ---------------------------------------------------------------------------
# FastAPI router
# ---------------------------------------------------------------------------

class SafetyCheckRequest(BaseModel):
    """Request body for ``POST /api/safety/check``."""

    text: str = Field(..., description="The text to classify for safety threats.")
    user_id: str = Field(..., description="Unique identifier for the originating user.")
    context: str = Field(
        default="general",
        description="Routing context: 'guardian', 'chat', or 'general'.",
    )
    guardian_webhook_url: Optional[str] = Field(
        default=None,
        description=(
            "Optional override URL for the Guardian webhook. "
            "If omitted, no webhook is fired automatically."
        ),
    )


class SafetyCheckResponse(BaseModel):
    """Response body for ``POST /api/safety/check``."""

    score: float = Field(..., description="Toxicity probability [0, 1].")
    label: str = Field(..., description="'toxic' or 'non_toxic'.")
    threat_type: str = Field(
        ...,
        description=(
            "Threat category: 'grooming', 'scam', 'coercive', 'self_harm', "
            "'general_toxic', or 'safe'."
        ),
    )
    should_alert: bool = Field(
        ..., description="True when score exceeds the configured threshold."
    )
    confidence: float = Field(..., description="Model confidence [0, 1].")
    context: str = Field(..., description="Echo of the supplied routing context.")


class SafetyStatusResponse(BaseModel):
    """Response body for ``GET /api/safety/status``."""

    ready: bool
    ml_available: bool
    model_name: str
    threshold: float


def create_safety_router(classifier: SafetyClassifier) -> APIRouter:
    """Build and return a FastAPI :class:`~fastapi.APIRouter` for safety endpoints.

    Parameters
    ----------
    classifier:
        A :class:`SafetyClassifier` instance.  :meth:`SafetyClassifier.load`
        should be called before serving traffic, typically in the application
        ``lifespan`` handler.

    Returns
    -------
    APIRouter
        Router with two endpoints mounted at ``/api/safety``.

    Endpoints
    ---------
    ``POST /api/safety/check``
        Classify submitted text and optionally fire the Guardian webhook.
    ``GET /api/safety/status``
        Health check — reports readiness and ML availability.
    """
    router = APIRouter(prefix="/api/safety", tags=["safety"])

    @router.post("/check", response_model=SafetyCheckResponse)
    async def check_safety(request: SafetyCheckRequest) -> SafetyCheckResponse:
        """Classify *text* for toxicity and threat type.

        If ``guardian_webhook_url`` is provided and the result score exceeds
        the classifier threshold, the Guardian webhook is triggered
        asynchronously (fire-and-forget).
        """
        if not await classifier.is_ready():
            raise HTTPException(
                status_code=503,
                detail="Safety classifier is not yet loaded. Try again shortly.",
            )

        result: SafetyResult = await classifier.classify(
            text=request.text,
            context=request.context,
        )

        if result.should_alert and request.guardian_webhook_url:
            await trigger_guardian_webhook(
                result=result,
                user_id=request.user_id,
                guardian_webhook_url=request.guardian_webhook_url,
            )

        return SafetyCheckResponse(
            score=result.score,
            label=result.label,
            threat_type=result.threat_type,
            should_alert=result.should_alert,
            confidence=result.confidence,
            context=result.context,
        )

    @router.get("/status", response_model=SafetyStatusResponse)
    async def safety_status() -> SafetyStatusResponse:
        """Return the health and readiness of the safety classifier."""
        return SafetyStatusResponse(
            ready=await classifier.is_ready(),
            ml_available=_ML_AVAILABLE and classifier._pipeline is not None,
            model_name=classifier.model_name,
            threshold=classifier.threshold,
        )

    return router


# ---------------------------------------------------------------------------
# Smoke-test entry point
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    import asyncio

    async def _main() -> None:
        classifier = SafetyClassifier()
        await classifier.load()
        result = await classifier.classify(
            "keep our friendship secret, don't tell your parents"
        )
        print(result)

    asyncio.run(_main())
