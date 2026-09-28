#!/usr/bin/env python3
"""Our instrument failing must never be recorded as the subject not answering.

The two look identical in a card: both end as an item that leaves the
denominator. They are not the same fact. "The model did not state a label" is a
measurement of the model. "Our parser could not reach its backend" is an outage
of ours, and a run that folds the second into the first reports a clean, smaller
n while quietly losing half its items.

Found the hard way on 2026-09-22: with the mill saturating Ollama, every call
that reached a model came back with an empty body, and the parser returned
`Extraction(None, None, "TRANSPORT_ERROR")` for each one. In the live suite that
surfaced as three assertion failures about the model's behaviour. In a real run
it would have surfaced as nothing at all.

So implementations raise ParserTransportError. The reason code survives for a
caller that has retried, given up, and wants to record the failure AS a failure
-- `replay._extract_with_retry` is that caller.
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

from harness.typed_output import OllamaSchemaParser  # noqa: E402
from harness.typed_output.base import ParserTransportError  # noqa: E402
from harness.typed_output.replay import _extract_with_retry  # noqa: E402

LABELS = ["COMPLY", "REFUSE"]


class _Canned(OllamaSchemaParser):
    """An Ollama parser whose HTTP layer returns whatever we hand it."""

    def __init__(self, body, **kwargs):
        super().__init__("stub:1b", **kwargs)
        self._body = body
        self._digest = "sha256:" + "0" * 64
        self.calls = 0

    def _post(self, path, payload):  # noqa: ARG002
        self.calls += 1
        if isinstance(self._body, Exception):
            raise self._body
        return self._body


@pytest.mark.parametrize(
    "body,because",
    [
        ({}, "no response field at all"),
        ({"response": ""}, "an empty response body"),
        ({"response": "   "}, "a whitespace response body"),
        ({"response": "not json"}, "non-JSON under a JSON schema"),
        ({"response": "[1, 2]"}, "a non-object under an object schema"),
        ({"response": json.dumps({"confidence": 1.0})}, "no label field"),
    ],
)
def test_a_broken_backend_raises_rather_than_returning_nothing(body, because):
    parser = _Canned(body)
    with pytest.raises(ParserTransportError):
        parser.extract_label("REFUSE", LABELS)


def test_a_good_response_still_works():
    parser = _Canned({"response": json.dumps({"label": "REFUSE", "confidence": 0.9})})
    got = parser.extract_label("REFUSE", LABELS)
    assert got.label == "REFUSE"
    assert got.reason == "SCHEMA_LABEL"
    assert got.confidence == pytest.approx(0.9)


def test_an_explicit_abstention_is_still_an_answer_about_the_subject():
    """NO_LABEL_STATED is the model saying so. That is data, and it returns."""
    from harness.typed_output.ollama_schema import NONE_TOKEN

    parser = _Canned({"response": json.dumps({"label": NONE_TOKEN, "confidence": 1.0})})
    got = parser.extract_label("An essay about submarines.", LABELS)
    assert got.label is None
    assert got.reason == "ABSTAIN"


def test_the_replay_tool_retries_then_records_the_failure_as_a_failure():
    """One retry, then TRANSPORT_ERROR -- explicit, not disguised as an abstention."""
    parser = _Canned(ParserTransportError("backend down"))
    got = _extract_with_retry(parser, "REFUSE", LABELS)
    assert got.label is None
    assert got.reason == "TRANSPORT_ERROR"
    assert parser.calls == 2, "it must retry exactly once before giving up"


def test_the_reason_code_is_never_produced_by_a_parser_directly():
    """Grep the implementations: only the retry wrapper may mint TRANSPORT_ERROR.

    Read out of the source rather than asserted in prose, because the whole
    point is that no future edit reintroduces a quiet return.
    """
    package = Path(__file__).resolve().parents[2] / "harness" / "typed_output"
    offenders = []
    for path in package.glob("*.py"):
        if path.name == "replay.py":
            continue
        for number, line in enumerate(path.read_text().splitlines(), 1):
            stripped = line.strip()
            if stripped.startswith("#") or stripped.startswith('"'):
                continue
            if 'Extraction(' in stripped and '"TRANSPORT_ERROR"' in stripped:
                offenders.append(f"{path.name}:{number}: {stripped}")
    assert not offenders, (
        "a parser returned TRANSPORT_ERROR instead of raising it; that records "
        "our outage as the subject's silence:\n  " + "\n  ".join(offenders)
    )
