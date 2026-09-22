#!/usr/bin/env python3
"""Name -> parser, so a run can select one by string and a card can record it.

`DEFAULT_PARSER` is the signed baseline and stays the default.  Nothing already
on the board changes meaning because this module exists; a run has to ask for a
different parser by name, and when it does, the name is written into the run
record and the card body.
"""

from __future__ import annotations

from typing import Any, Callable

from .base import LabelParser, ParserError
from .deterministic import ExactLabelParser, ReadLabelParser
from .ollama_schema import OllamaSchemaParser

__all__ = ["DEFAULT_PARSER", "PARSER_NAMES", "build_parser", "describe_parser"]

DEFAULT_PARSER = "exact-label"

_BUILDERS: dict[str, Callable[..., LabelParser]] = {
    "exact-label": ExactLabelParser,
    "read-label": ReadLabelParser,
    "ollama-schema": OllamaSchemaParser,
}

PARSER_NAMES: tuple[str, ...] = ("exact-label", "read-label", "ollama-schema", "jev")


def build_parser(name: str, **options: Any) -> LabelParser:
    """Construct a parser by name.

    Jev is imported lazily so that the absence of `TYPESAFE_API_KEY` -- or of
    the optional `langchain-typesafe` dependency -- cannot break a run that
    never asked for it.  Asking for it without the key raises; it never
    degrades to another implementation.
    """
    key = (name or "").strip().lower()
    if key == "jev":
        from .typesafe_jev import TypeSafeJevParser  # noqa: PLC0415

        return TypeSafeJevParser(**options)
    builder = _BUILDERS.get(key)
    if builder is None:
        raise ParserError(
            f"unknown label parser {name!r}; known: {', '.join(PARSER_NAMES)}"
        )
    return builder(**options)


def describe_parser(parser: LabelParser) -> dict[str, Any]:
    """The descriptor written into the run record and the card body."""
    described = dict(parser.describe())
    described.setdefault("parser_id", getattr(parser, "parser_id", "unknown"))
    return described
