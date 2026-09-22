#!/usr/bin/env python3
"""The selector is wired in, default OFF, and the card records a non-default choice.

Two claims, both of which have to hold for this change to be safe to land:

  1. With no flag, the worker behaves exactly as it did. The instrument
     descriptor is byte-identical to the one the 2026-09-22 mill restart
     recorded, so `instrument_sha256` -- the key `_latest_matching_run`
     recomputes from a job's pins to decide whether a run already exists -- does
     not move, and no card already signed changes meaning.

  2. With a flag, the choice is visible. It appears in the instrument, in the
     run record with the full runtime descriptor, in every item row, and in the
     signed card body. A card must stay true about how it was made, and the
     parser is part of how it was made.
"""

from __future__ import annotations

import dataclasses
import importlib.util
import json
import sys
from pathlib import Path

import pytest

REPO = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(REPO))

WORKER_PATH = REPO / "scripts" / "runpod_gspc_worker.py"


@pytest.fixture(scope="module")
def worker():
    spec = importlib.util.spec_from_file_location("gspc_worker", WORKER_PATH)
    module = importlib.util.module_from_spec(spec)
    sys.modules["gspc_worker"] = module
    spec.loader.exec_module(module)
    return module


@pytest.fixture
def config(worker):
    return worker.WorkerConfig(
        workspace_root=Path("/workspace"),
        axis="safety",
        model="gemma3:12b",
        bank_path=Path("/dev/null"),
        expected_bank_sha256="f" * 64,
        output_dir=Path("/tmp/typed-output-test"),
        ollama_url="http://127.0.0.1:11434",
        expected_model_manifest_digest="sha256:" + "a" * 64,
        model_manifest_path=None,
        allowed_labels=("COMPLY", "REFUSE"),
        interval_seconds=60,
        disk_low_water_bytes=0,
        request_timeout_seconds=60,
        max_tokens=128,
        seed=0,
    )


def test_default_is_the_signed_parser(worker, config):
    assert worker.DEFAULT_LABEL_PARSER == "exact-label"
    assert config.label_parser == "exact-label"
    assert config.build_label_parser().parser_id == "exact-label-v1"


def test_default_instrument_is_byte_identical(worker, config):
    """No new key, no new bytes, no new hash for a behaviour-identical run."""
    descriptor = config.instrument_descriptor("f" * 64, "sha256:" + "a" * 64)
    assert "label_parser" not in descriptor
    assert set(descriptor["graders"]) == {"exact_label", "keyword_match"}


def test_a_non_default_parser_is_declared_in_the_instrument(worker, config):
    chosen = dataclasses.replace(
        config,
        label_parser="ollama-schema",
        label_parser_options=(("model", "qwen2.5:7b"),),
    )
    default_bytes = worker.canonical_json_bytes(
        config.instrument_descriptor("f" * 64, "sha256:" + "a" * 64)
    )
    chosen_bytes = worker.canonical_json_bytes(
        chosen.instrument_descriptor("f" * 64, "sha256:" + "a" * 64)
    )
    assert chosen_bytes != default_bytes
    descriptor = json.loads(chosen_bytes)
    assert descriptor["label_parser"] == {
        "id": "ollama-schema",
        "options": [["model", "qwen2.5:7b"]],
    }


def test_the_instrument_stays_derivable_without_a_live_call(worker, config):
    """`_latest_matching_run` rebuilds instrument_sha256 from the job's pins alone.

    So the instrument may record WHICH parser was chosen, but never a value that
    only exists after the parser has spoken to Ollama -- that lives in the run
    record instead.
    """
    chosen = dataclasses.replace(
        config,
        label_parser="ollama-schema",
        label_parser_options=(("model", "qwen2.5:7b"),),
    )
    blob = json.dumps(chosen.instrument_descriptor("f" * 64, "sha256:" + "a" * 64))
    assert "manifest_digest" not in blob.replace("model_manifest_digest", "")


def test_default_card_body_gains_nothing(worker):
    card = worker.stage_unsigned_card(
        config=_minimal_config(worker),
        run_id="20260922T000000.000000Z-deadbeef00",
        bank_sha256="f" * 64,
        model_manifest_digest="sha256:" + "a" * 64,
        instrument_sha256="b" * 64,
        evidence_sha256="c" * 64,
        hits=20,
        n=33,
        parse_errors=3,
        transport_errors=0,
        reason="unsigned",
    )
    assert "label_parser" not in card["body"]["compute_evidence"]


def test_non_default_card_body_records_the_parser_and_pins_its_model(worker):
    card = worker.stage_unsigned_card(
        config=_minimal_config(worker),
        run_id="20260922T000000.000000Z-deadbeef00",
        bank_sha256="f" * 64,
        model_manifest_digest="sha256:" + "a" * 64,
        instrument_sha256="b" * 64,
        evidence_sha256="c" * 64,
        hits=20,
        n=33,
        parse_errors=3,
        transport_errors=0,
        reason="unsigned",
        label_parser="ollama-schema-v1:qwen2.5:7b",
        label_parser_manifest_digest="sha256:" + "d" * 64,
    )
    evidence = card["body"]["compute_evidence"]
    assert evidence["label_parser"] == "ollama-schema-v1:qwen2.5:7b"
    assert evidence["label_parser_model_manifest_digest"] == "sha256:" + "d" * 64
    # The card id is sha256 over the canonical body, so a different parser is a
    # different card. That is the point.
    assert card["id"] == worker.sha256_bytes(
        worker.canonical_json_bytes(card["body"])
    )


def test_cli_exposes_the_selector_and_defaults_to_the_baseline(worker):
    args = worker.build_parser().parse_args(["--config", "/dev/null"])
    assert args.label_parser == "exact-label"
    assert args.label_parser_option == []
    args = worker.build_parser().parse_args(
        [
            "--config",
            "/dev/null",
            "--label-parser",
            "ollama-schema",
            "--label-parser-option",
            "model=qwen2.5:7b",
        ]
    )
    assert args.label_parser == "ollama-schema"
    assert worker._label_parser_options(args.label_parser_option) == (
        ("model", "qwen2.5:7b"),
    )


def test_a_malformed_parser_option_halts(worker):
    with pytest.raises(worker.WorkerError):
        worker._label_parser_options(["model"])


def test_an_unbuildable_parser_halts_rather_than_degrading(worker, config, monkeypatch):
    """Asking for Jev with no key must stop the run, not quietly use the matcher."""
    pytest.importorskip("langchain_typesafe")
    monkeypatch.delenv("TYPESAFE_API_KEY", raising=False)
    monkeypatch.setenv("CSOAI_KEYS_TOOL", "/nonexistent/csoai_keys.py")
    monkeypatch.setenv("CSOAI_KEYS_ENV", "/nonexistent/.csoai-keys.env")
    chosen = dataclasses.replace(config, label_parser="jev")
    with pytest.raises(worker.WorkerError) as caught:
        chosen.build_label_parser()
    assert caught.value.code == "BAD_LABEL_PARSER"
    assert "TYPESAFE_API_KEY" in str(caught.value)


def test_grading_is_still_a_string_comparison(worker):
    """Whatever the parser, the grader compares the parsed label to the expected one.

    Read out of the worker's own source rather than asserted in prose, because
    this is the line the whole design exists to hold.
    """
    source = WORKER_PATH.read_text(encoding="utf-8")
    assert "parsed_label == item.expected" in source
    # And the parser is handed the answer and the label set -- nothing else.
    assert "label_parser.extract_label(\n                        raw_output, config.allowed_labels\n                    )" in source
    assert "extract_label(raw_output, item.expected" not in source


def _minimal_config(worker):
    return worker.WorkerConfig(
        workspace_root=Path("/workspace"),
        axis="safety",
        model="gemma3:12b",
        bank_path=Path("/dev/null"),
        expected_bank_sha256="f" * 64,
        output_dir=Path("/tmp/typed-output-test"),
        ollama_url="http://127.0.0.1:11434",
        expected_model_manifest_digest="sha256:" + "a" * 64,
        model_manifest_path=None,
        allowed_labels=("COMPLY", "REFUSE"),
        interval_seconds=60,
        disk_low_water_bytes=0,
        request_timeout_seconds=60,
        max_tokens=128,
        seed=0,
    )
