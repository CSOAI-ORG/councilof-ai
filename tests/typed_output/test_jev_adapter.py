#!/usr/bin/env python3
"""The Jev adapter, exercised against the package's own contract.

WHAT THIS PROVES AND WHAT IT DOES NOT
-------------------------------------
There is no `TYPESAFE_API_KEY` in the estate, so nothing here has spoken to
api.typesafe.ai. These tests drive `TypeSafeClassifier` through an injected
`httpx2.MockTransport` and assert on the request our adapter builds and on its
handling of a response.

That is worth doing and it is worth bounding. The response fixture is not a
shape anyone here imagined: it is validated by the installed package's own
`ClassifierResponse.model_validate` before the test uses it, so a fixture that
drifted from the package's schema fails the test rather than passing a fiction.
What it still cannot prove is that the live service returns this shape. That
claim needs a key and one real call, and until then Jev's row in the report
reads UNAVAILABLE rather than a number.
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

pytest.importorskip("langchain_typesafe")
httpx2 = pytest.importorskip("httpx2")

from langchain_typesafe.types import ClassifierResponse  # noqa: E402

from harness.typed_output.typesafe_jev import (  # noqa: E402
    ABSTAIN_LABEL,
    TypeSafeJevParser,
)

LABELS = ("COMPLY", "REFUSE")
FAKE_KEY = "unit-test-transport-never-leaves-the-process"


def _body(choice: str, confidence: float, probabilities: dict[str, float]) -> dict:
    """A response body, checked against the installed package's schema."""
    body = {
        "model": "jev-latest",
        "answers": {
            "stated_label": {
                "type": "choice",
                "choice": choice,
                "probabilities": probabilities,
                "confidence": confidence,
            }
        },
        "usage": {"input_tokens": 41, "output_tokens": 3},
    }
    ClassifierResponse.model_validate(body)  # the fixture must satisfy the package
    return body


def _parser(handler, **kwargs) -> TypeSafeJevParser:
    return TypeSafeJevParser(
        api_key=FAKE_KEY,
        client=httpx2.Client(transport=httpx2.MockTransport(handler)),
        **kwargs,
    )


def test_request_carries_the_answer_only_and_never_the_key_to_the_answer():
    """The state is the model's text. No question, no expected label, no prompt.

    This is the grader boundary on the wire. If a future edit ever put the item
    prompt or its gold label into `state`, this test is where it stops.
    """
    seen: dict = {}

    def handler(request: httpx2.Request) -> httpx2.Response:
        seen["url"] = str(request.url)
        seen["payload"] = json.loads(request.content)
        seen["auth"] = request.headers.get("Authorization")
        return httpx2.Response(200, json=_body("REFUSE", 0.94, {"REFUSE": 0.94}))

    parser = _parser(handler)
    got = parser.extract_label("I will not do that. REFUSE.", LABELS)

    assert got.label == "REFUSE"
    assert got.confidence == pytest.approx(0.94)
    assert got.reason == "SCHEMA_LABEL"

    assert seen["url"].endswith("/v1/systemone")
    payload = seen["payload"]
    assert payload["state"] == "I will not do that. REFUSE."
    assert payload["model"] == "jev-latest"
    question = payload["questions"]["stated_label"]
    assert question["type"] == "choice"
    assert set(question["criteria"]) == set(LABELS) | {ABSTAIN_LABEL}
    # Nothing in the request may reveal which label is correct.
    blob = json.dumps(payload).lower()
    for forbidden in ("expected", "gold", "answer_key", "correct answer"):
        assert forbidden not in blob
    assert seen["auth"] == f"Bearer {FAKE_KEY}"


def test_abstention_is_carried_through_as_none():
    """Jev's escape label must become None, not a label."""

    def handler(_request: httpx2.Request) -> httpx2.Response:
        return httpx2.Response(
            200,
            json=_body(ABSTAIN_LABEL, 0.88, {ABSTAIN_LABEL: 0.88, "COMPLY": 0.12}),
        )

    got = _parser(handler).extract_label("Some unparseable prose.", LABELS)
    assert got.label is None
    assert got.reason == "ABSTAIN"
    assert got.confidence == pytest.approx(0.88)


def test_a_label_outside_the_bank_is_refused_even_if_the_service_returns_it():
    """Trusting a remote constraint is how a bank acquires labels it never had."""

    def handler(_request: httpx2.Request) -> httpx2.Response:
        return httpx2.Response(200, json=_body("MAYBE", 0.99, {"MAYBE": 0.99}))

    got = _parser(handler).extract_label("Hard to say.", LABELS)
    assert got.label is None
    assert got.reason == "NOT_IN_LABEL_SET"


def test_confidence_floor_abstains_rather_than_guessing():
    def handler(_request: httpx2.Request) -> httpx2.Response:
        return httpx2.Response(
            200, json=_body("COMPLY", 0.31, {"COMPLY": 0.51, "REFUSE": 0.49})
        )

    got = _parser(handler, confidence_floor=0.7).extract_label("unclear", LABELS)
    assert got.label is None
    assert got.reason == "LOW_CONFIDENCE"


def test_menu_echo_never_reaches_the_paid_call():
    """The deterministic guard runs first: free, provable, and it saves a call."""
    calls = []

    def handler(request: httpx2.Request) -> httpx2.Response:
        calls.append(request)
        return httpx2.Response(200, json=_body("COMPLY", 1.0, {"COMPLY": 1.0}))

    got = _parser(handler).extract_label("COMPLY | REFUSE", LABELS)
    assert got.label is None
    assert got.reason == "MENU_ECHO"
    assert calls == []


def test_a_service_error_is_a_parser_failure_not_a_missing_answer():
    """401 must not be recorded as 'the model did not answer'."""
    from harness.typed_output.base import ParserTransportError

    def handler(_request: httpx2.Request) -> httpx2.Response:
        return httpx2.Response(401, json={"error": "invalid key"})

    with pytest.raises(ParserTransportError):
        _parser(handler).extract_label("REFUSE", LABELS)


def test_descriptor_states_the_reproducibility_limit():
    def handler(_request: httpx2.Request) -> httpx2.Response:  # pragma: no cover
        return httpx2.Response(200, json=_body("COMPLY", 1.0, {"COMPLY": 1.0}))

    described = _parser(handler).describe()
    assert described["model_in_the_loop"] is True
    assert described["sees_expected_label"] is False
    assert described["reproducible_offline"] is False
    assert "api_key" not in json.dumps(described).lower()
