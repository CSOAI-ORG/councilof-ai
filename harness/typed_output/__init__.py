#!/usr/bin/env python3
"""Typed-output label parsers for the GSPC harness.

A parser turns a subject model's free text into one of a bank's labels, or into
nothing.  The deterministic grader then compares that label with the expected
one.  The two jobs are kept apart on purpose: see `base.py` for the boundary and
why crossing it would repeat a defect the estate has already caught once.

Default is `exact-label`, the parser behind every signed card on the board.
"""

from .base import (
    Extraction,
    LabelParser,
    MissingCredentialError,
    ParserError,
    ParserTransportError,
    REASONS,
    forbid_answer_key,
    looks_like_menu_echo,
    normalize_labels,
)
from .deterministic import ExactLabelParser, ReadLabelParser
from .ollama_schema import OllamaSchemaParser
from .qualify import qualify
from .registry import DEFAULT_PARSER, PARSER_NAMES, build_parser, describe_parser

__all__ = [
    "DEFAULT_PARSER",
    "PARSER_NAMES",
    "ExactLabelParser",
    "Extraction",
    "LabelParser",
    "MissingCredentialError",
    "OllamaSchemaParser",
    "ParserError",
    "ParserTransportError",
    "REASONS",
    "ReadLabelParser",
    "build_parser",
    "qualify",
    "describe_parser",
    "forbid_answer_key",
    "looks_like_menu_echo",
    "normalize_labels",
]
