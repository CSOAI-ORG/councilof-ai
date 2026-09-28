#!/usr/bin/env python3
"""The two deterministic parsers the estate already runs, behind one protocol.

Neither is new.  Both are lifted verbatim in behaviour from the code that
produced the cards now on the board, so that any comparison is against what is
actually signed rather than against a tidied-up version of it:

  exact-label-v1    scripts/runpod_gspc_worker.py :: parse_exact_label
                    `raw.strip() in allowed_labels`.  The strictest possible
                    reading: the whole answer, after outer whitespace, must BE a
                    label.  This is the parser behind every card in the
                    2026-09-22 mill restart, and it is the default.

  read-label-v1     harness/gspc-top100/mill_hub_queue.py :: read_label
                    Strips a <think> block, an "Answer:" prefix and surrounding
                    punctuation, then requires the reply OR its last line to BE
                    a label.  Rejects a menu echo by construction.

`tests/typed_output/test_baseline_identity.py` re-parses every retained mill
item with exact-label-v1 and asserts the result equals the `parsed_label` stored
in the evidence file.  That is what makes this a baseline and not a rewrite.
"""

from __future__ import annotations

import re
from typing import Any, Mapping, Sequence

from .base import (
    Extraction,
    forbid_answer_key,
    looks_like_menu_echo,
    normalize_labels,
)

__all__ = ["ExactLabelParser", "ReadLabelParser"]


class ExactLabelParser:
    """The signed baseline: the answer, stripped of outer whitespace, IS a label.

    Unicode-exact and case-sensitive, matching
    `unicode-exact-after-outer-whitespace-v1` in the worker's instrument
    descriptor.  It reports no confidence, because it measured none: it compared
    bytes.  Reporting 1.0 here would be a fabricated number wearing a real
    field's name.
    """

    parser_id = "exact-label-v1"

    def extract_label(
        self,
        text: str | None,
        labels: Sequence[str],
        schema: Mapping[str, Any] | None = None,
    ) -> Extraction:
        forbid_answer_key(schema)
        allowed = normalize_labels(labels)
        if text is None or not text.strip():
            return Extraction(None, None, "EMPTY")
        candidate = text.strip()
        if candidate in allowed:
            return Extraction(candidate, None, "EXACT")
        if looks_like_menu_echo(text, allowed):
            return Extraction(None, None, "MENU_ECHO")
        return Extraction(None, None, "NO_MATCH")

    def describe(self) -> dict[str, Any]:
        return {
            "parser_id": self.parser_id,
            "kind": "deterministic",
            "rule": "unicode-exact-after-outer-whitespace-v1",
            "source": "scripts/runpod_gspc_worker.py::parse_exact_label",
            "model_in_the_loop": False,
        }


_ANSWER_PREFIX = re.compile(r"^(?:answer|label|response|output)\s*[:\-]\s*", re.I)
_THINK = re.compile(r"<think>.*?</think>", re.S | re.I)
_STRIP = "`*_\"'.,:;!?()[]{} "


class ReadLabelParser:
    """The mill's more forgiving deterministic reader, unchanged in behaviour.

    Strictness costs coverage, never correctness.  This parser buys back the
    answers where a model wrote a sentence and then the label on its own line;
    it buys back nothing where the model answered in prose, and that is correct,
    because prose is not a label.
    """

    parser_id = "read-label-v1"

    def extract_label(
        self,
        text: str | None,
        labels: Sequence[str],
        schema: Mapping[str, Any] | None = None,
    ) -> Extraction:
        forbid_answer_key(schema)
        allowed_tuple = normalize_labels(labels)
        allowed = {label.upper() for label in allowed_tuple}
        canonical = {label.upper(): label for label in allowed_tuple}
        if not allowed:
            return Extraction(None, None, "NO_MATCH")
        if text is None or not text.strip():
            return Extraction(None, None, "EMPTY")
        body = _THINK.sub(" ", text)
        lines = [line.strip() for line in body.splitlines() if line.strip()]
        candidates = ([lines[-1]] if lines else []) + [" ".join(lines)]
        for index, candidate in enumerate(candidates):
            trimmed = _ANSWER_PREFIX.sub("", candidate).strip().strip(_STRIP).upper()
            if trimmed in allowed:
                return Extraction(
                    canonical[trimmed],
                    None,
                    "LAST_LINE" if index == 0 else "EXACT",
                )
        if looks_like_menu_echo(text, allowed_tuple):
            return Extraction(None, None, "MENU_ECHO")
        return Extraction(None, None, "NO_MATCH")

    def describe(self) -> dict[str, Any]:
        return {
            "parser_id": self.parser_id,
            "kind": "deterministic",
            "rule": "think-stripped-answer-prefix-last-line-exact-v1",
            "source": "harness/gspc-top100/mill_hub_queue.py::read_label",
            "model_in_the_loop": False,
        }
