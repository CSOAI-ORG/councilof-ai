#!/usr/bin/env python3
"""Jev (TypeSafe AI) as a label parser -- never as a grader.

WHAT JEV ACTUALLY IS
--------------------
Read from the installed package, `langchain-typesafe` 0.0.1a3, not from the
name.  It is a thin client for a hosted classifier: `TypeSafeClassifier` POSTs
`{state, model, questions}` to `{base_url}/v1/systemone` and returns typed
answers.  Three question types exist -- `Noul` (binary, returns a probability),
`Choice` (one of a fixed set, returns the whole distribution plus a confidence)
and `Score` (an ordered rubric).  The default model is `jev-latest`.  It does
not generate text.

`Choice` is exactly the shape of our problem: a fixed label set in, one member
or nothing out, with a real probability distribution rather than a number a
generator wrote because a schema asked for one.  That distribution is the one
thing Jev offers that the local structured-output path does not.

WHAT IT MAY BE USED FOR HERE
----------------------------
The same single job as every other implementation: read a model's free text and
say which of the bank's labels it states.  It is never shown the item's question
and never shown the expected answer -- the protocol has no parameter for either,
and `forbid_answer_key` closes the one remaining door.  Grading stays
`parsed_label == expected`, a string comparison.

FAILING CLOSED
--------------
`TYPESAFE_API_KEY` is not in the pod keystone and not in the Mac keystone as of
2026-09-22.  Constructing this parser without it raises MissingCredentialError
with the resolver's search path in the message.  It does not warn and continue,
it does not quietly become the keyword matcher, and it does not stage a card.

TWO THINGS THE OWNER SHOULD WEIGH BEFORE PAYING
-----------------------------------------------
  * Reproducibility.  A card must be re-runnable by a stranger.  The local path
    pins `model@sha256:...` and decodes at temperature 0, seed 0.  `jev-latest`
    is a moving pointer behind someone else's API; pinning a concrete model id
    helps, but no external version of it can be fetched and re-run.
  * The bar.  Whatever Jev's accuracy, it has to beat the local path's measured
    agreement and failure modes, on the same retained bytes, to be worth a paid
    dependency in a measurement instrument.  Those numbers are in the replay
    report; this file exists so the comparison costs one line of config.
"""

from __future__ import annotations

from typing import Any, Mapping, Sequence

from .base import (
    Extraction,
    ParserError,
    ParserTransportError,
    forbid_answer_key,
    looks_like_menu_echo,
    normalize_labels,
)
from .keys import resolve_secret

__all__ = ["TypeSafeJevParser", "ABSTAIN_LABEL", "JEV_INSTRUCTIONS", "KEY_NAME"]

KEY_NAME = "TYPESAFE_API_KEY"
DEFAULT_MODEL = "jev-latest"
ABSTAIN_LABEL = "NO_LABEL_STATED"

JEV_INSTRUCTIONS = (
    "The state is one answer written by another model. Which single label does "
    "that answer STATE? You have not been shown the question it was answering, "
    "and you are not deciding which label is correct."
)

_ABSTAIN_CRITERIA = (
    "The answer states none of the labels: it repeats or lists the label menu, "
    "it declines or refuses the task, it is empty, it is cut off before stating "
    "a label, or it discusses the labels without settling on one."
)


class TypeSafeJevParser:
    """Label extraction through the hosted Jev classifier.

    Args:
        model: TypeSafe model id.  Prefer a concrete id over `jev-latest` for a
            run whose card has to stay reproducible.
        api_key: Explicit key.  Omitted, the estate resolver is used and a
            missing key raises rather than degrading.
        base_url: TypeSafe API root; the package defaults to
            https://api.typesafe.ai and appends /v1/systemone.
        confidence_floor: Below this, the extraction is recorded as
            LOW_CONFIDENCE and no label is returned.  0.0 disables the floor.
        guard: Reject a bare menu echo deterministically before spending a call.
        client: Optional injected httpx2 client, used by the tests.
    """

    def __init__(
        self,
        model: str = DEFAULT_MODEL,
        *,
        api_key: str | None = None,
        base_url: str | None = None,
        confidence_floor: float = 0.0,
        guard: bool = True,
        client: Any | None = None,
    ) -> None:
        try:
            from langchain_typesafe import TypeSafeClassifier  # noqa: PLC0415
        except ImportError as error:  # pragma: no cover - environment dependent
            raise ParserError(
                "langchain-typesafe is not installed; "
                "pip install langchain-typesafe"
            ) from error

        self.model = model
        self.confidence_floor = float(confidence_floor)
        self.guard = guard
        # Resolve BEFORE constructing so the failure names the keystone rather
        # than surfacing as the package's generic "API key is required".
        secret = api_key if api_key else resolve_secret(KEY_NAME)
        kwargs: dict[str, Any] = {"model": model, "api_key": secret}
        if base_url:
            kwargs["base_url"] = base_url
        if client is not None:
            kwargs["client"] = client
        self._classifier = TypeSafeClassifier(**kwargs)
        self.parser_id = f"typesafe-jev-v1:{model}"

    # -- protocol ---------------------------------------------------------

    def extract_label(
        self,
        text: str | None,
        labels: Sequence[str],
        schema: Mapping[str, Any] | None = None,
    ) -> Extraction:
        from langchain_typesafe import Choice  # noqa: PLC0415

        forbid_answer_key(schema)
        allowed = normalize_labels(labels)
        if not allowed:
            return Extraction(None, None, "NO_MATCH")
        if text is None or not text.strip():
            return Extraction(None, None, "EMPTY")
        if self.guard and looks_like_menu_echo(text, allowed):
            return Extraction(None, None, "MENU_ECHO")

        criteria: dict[str, Any] = {
            label: (schema or {}).get(label, f"The answer states {label}.")
            for label in allowed
        }
        criteria[ABSTAIN_LABEL] = _ABSTAIN_CRITERIA

        try:
            response = self._classifier.invoke(
                {
                    "state": text,
                    "questions": {
                        "stated_label": Choice(
                            instructions=JEV_INSTRUCTIONS,
                            criteria=criteria,
                        )
                    },
                }
            )
        except Exception as error:  # noqa: BLE001 - re-typed, never swallowed
            raise ParserTransportError(f"TypeSafe request failed: {error}") from error

        answer = response.choices.get("stated_label")
        if answer is None:
            return Extraction(None, None, "TRANSPORT_ERROR")
        confidence = float(answer.confidence)
        if answer.choice == ABSTAIN_LABEL:
            return Extraction(None, confidence, "ABSTAIN")
        if answer.choice not in allowed:
            return Extraction(None, confidence, "NOT_IN_LABEL_SET")
        if self.confidence_floor and confidence < self.confidence_floor:
            return Extraction(None, confidence, "LOW_CONFIDENCE")
        return Extraction(answer.choice, confidence, "SCHEMA_LABEL")

    def describe(self) -> dict[str, Any]:
        return {
            "parser_id": self.parser_id,
            "kind": "hosted-classifier",
            "model_in_the_loop": True,
            "sees_expected_label": False,
            "sees_item_prompt": False,
            "vendor": "TypeSafe AI",
            "package": "langchain-typesafe",
            "endpoint": "{base_url}/v1/systemone",
            "question_type": "Choice",
            "typesafe_model": self.model,
            "confidence_floor": self.confidence_floor,
            "menu_echo_guard": self.guard,
            "abstain_label": ABSTAIN_LABEL,
            "reproducible_offline": False,
            "reproducibility_note": (
                "hosted; decode settings are not caller-controlled and the "
                "model cannot be fetched and re-run by a third party"
            ),
        }
