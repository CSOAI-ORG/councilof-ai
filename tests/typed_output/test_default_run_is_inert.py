#!/usr/bin/env python3
"""A default run must produce the same bytes it produced before the selector existed.

The selector is a change to the instrument, so the claim that it changes nothing
by default has to be a measurement, not an assurance. This runs the worker
end to end against a stub inference client -- no GPU, no network -- once with
the default parser and once with `read-label`, and compares what lands on disk.

  default   items.jsonl rows carry the same keys and the same schema string,
            so items_sha256 does not move; the instrument does not gain a key,
            so instrument_sha256 does not move; the card body does not gain a
            key, so card_sha256 and the card id do not move.

  non-default  every one of those moves, visibly, and the run record names the
            parser that made it happen.

  reasoning  the same contract, one level down: the reasoning channel is a
            measurement of a side channel, so it is OFF by default and a
            default run is byte-identical to the one that predates it. The
            three hashes below were MEASURED on 2026-10-26 from the worker as
            it stood before the channel existed; they are frozen here so that
            "the default changed nothing" is a claim the suite can fail on.

The stub's answers are drawn from the shapes the real mill produced: a bare
label, a label after a preamble, a menu echo, and a prose refusal.
"""

from __future__ import annotations

import dataclasses
import hashlib
import importlib.util
import json
import sys
import threading
from pathlib import Path

import pytest

REPO = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(REPO))

DIGEST = "sha256:" + "a" * 64

# The reasoning channel's prose. It is never stored, so the only trace of it in
# the evidence is a digest and a length.
THINKING = "Step 1: weigh the options. Step 2: answer."

# Measured 2026-10-26 from scripts/runpod_gspc_worker.py as it stood BEFORE the
# reasoning channel existed, with the clock and the run id pinned so that
# items_sha256 and the card id are comparable at all (both carry the run id and
# the timestamps). A default run must reproduce them exactly.
BASELINE_INSTRUMENT_SHA256 = (
    "2d7bc2a89a40fd79668ea608757e42cc992f37ae0e31809ee5405d763949ca7a"
)
BASELINE_ITEMS_SHA256 = (
    "6d6430ed4d113214f4e99c30f428a5e0abe4d8f3c4589fc22f09358b8be3eba1"
)
BASELINE_CARD_ID = (
    "c595d91cae6cc3114c6803c05f17d89c5f73a589c06272d2a4abde7cddaf6bb9"
)
PINNED_RUN_ID = "20260922T000000.000000Z-deadbeef00"

ANSWERS = [
    "COMPLY",  # exact, read by every parser
    "REFUSE",
    "Let me think about it.\nREFUSE",  # only the forgiving parser reads this
    "COMPLY | REFUSE",  # menu echo: no parser may read this
    "I can't assist with that request.",  # a refusal is not a verdict
    "COMPLY",
]
EXPECTED = ["COMPLY", "REFUSE", "REFUSE", "COMPLY", "REFUSE", "COMPLY"]


@pytest.fixture(scope="module")
def worker():
    spec = importlib.util.spec_from_file_location(
        "gspc_worker_inert", REPO / "scripts" / "runpod_gspc_worker.py"
    )
    module = importlib.util.module_from_spec(spec)
    sys.modules["gspc_worker_inert"] = module
    spec.loader.exec_module(module)
    return module


def _stub_client(worker, reasoning: bool = False):
    class StubClient:
        """Deterministic, offline, and it answers in the order the bank asks."""

        def __init__(self) -> None:
            self.calls = 0

        def model_manifest_digest(self, _model: str) -> str:
            return DIGEST

        def generate(self, _model, _prompt, _config):
            text = ANSWERS[self.calls % len(ANSWERS)]
            self.calls += 1
            return worker.InferenceResult(
                transport_ok=True,
                raw_output=text,
                response_sha256=hashlib.sha256(text.encode()).hexdigest(),
                error_code=None,
                response_model="stub:1b",
                done_reason="stop",
                total_duration_ns=1,
                load_duration_ns=0,
                prompt_eval_count=1,
                eval_count=1,
                reasoning_present=reasoning,
                reasoning_sha256=(
                    hashlib.sha256(THINKING.encode()).hexdigest() if reasoning else None
                ),
                reasoning_chars=len(THINKING) if reasoning else None,
            )

    return StubClient()


def _run(
    worker,
    tmp_path: Path,
    label_parser: str,
    *,
    name: str | None = None,
    reasoning: bool = False,
) -> dict:
    bank = [
        {"id": f"item-{i:03d}", "prompt": f"Scenario {i}.", "expected": expected}
        for i, expected in enumerate(EXPECTED, start=1)
    ]
    raw = ("\n".join(json.dumps(row, sort_keys=True) for row in bank) + "\n").encode()
    bank_path = tmp_path / f"bank-{label_parser}.jsonl"
    bank_path.write_bytes(raw)

    label = name or label_parser
    config = worker.WorkerConfig(
        workspace_root=tmp_path,
        axis="safety",
        model="stub:1b",
        bank_path=bank_path,
        expected_bank_sha256=hashlib.sha256(raw).hexdigest(),
        output_dir=tmp_path / label,
        ollama_url="http://127.0.0.1:11434",
        expected_model_manifest_digest=DIGEST,
        model_manifest_path=None,
        allowed_labels=("COMPLY", "REFUSE"),
        interval_seconds=60,
        disk_low_water_bytes=0,
        request_timeout_seconds=60,
        max_tokens=128,
        seed=0,
        label_parser=label_parser,
        reasoning=reasoning,
    )
    health = worker.HealthSink(tmp_path / f"health-{label}.json")
    outcome = worker.run_once(
        config,
        health,
        client=_stub_client(worker, reasoning=reasoning),
        stop_event=threading.Event(),
    )
    assert outcome.detail_code == "COMPLETE_UNSIGNED", outcome
    run_dir = next((config.output_dir / "runs").iterdir())
    return {
        "run": json.loads((run_dir / "run.json").read_text()),
        "items": [
            json.loads(line)
            for line in (run_dir / "items.jsonl").read_text().splitlines()
            if line.strip()
        ],
        "card": json.loads((run_dir / "card-unsigned.json").read_text()),
    }


class _PinnedClock:
    """A monotonic clock that only moves when the worker asks it to."""

    def __init__(self) -> None:
        self.now = 1000.0

    def monotonic(self) -> float:
        self.now += 1.5
        return self.now


def _run_pinned(worker, tmp_path: Path, label_parser: str, monkeypatch, **kwargs) -> dict:
    """A run with the clock and the run id pinned.

    items_sha256 and the card id both carry the run id and the timestamps, so
    without a pinned clock they differ on every run and cannot be compared
    against a frozen baseline. With it they are a measurement.
    """
    monkeypatch.setattr(worker, "_run_id", lambda: PINNED_RUN_ID)
    monkeypatch.setattr(worker, "utc_now", lambda: "2026-09-22T00:00:00Z")
    monkeypatch.setattr(worker, "time", _PinnedClock())
    return _run(worker, tmp_path, label_parser, **kwargs)


@pytest.fixture(scope="module")
def baseline(worker, tmp_path_factory):
    return _run(worker, tmp_path_factory.mktemp("inert"), "exact-label")


@pytest.fixture(scope="module")
def forgiving(worker, tmp_path_factory):
    return _run(worker, tmp_path_factory.mktemp("swapped"), "read-label")


# ------------------------------------------------------- the default is inert


def test_default_item_rows_carry_no_new_keys(worker, baseline):
    for row in baseline["items"]:
        assert row["schema"] == worker.ITEM_SCHEMA
        assert "label_parser" not in row
        assert "parse_reason" not in row
        assert "parse_confidence" not in row


def test_default_instrument_and_card_carry_no_new_keys(baseline):
    assert "label_parser" not in baseline["run"]["instrument"]
    assert "label_parser" not in baseline["card"]["body"]["compute_evidence"]


def test_default_reads_exactly_what_the_strict_rule_reads(baseline):
    """Two bare labels; the preamble, the echo and the refusal are all unread."""
    assert [row["parsed_label"] for row in baseline["items"]] == [
        "COMPLY",
        "REFUSE",
        None,
        None,
        None,
        "COMPLY",
    ]
    assert baseline["run"]["counts"]["parse_errors_excluded"] == 3
    assert baseline["run"]["counts"]["graded_n"] == 3
    assert baseline["card"]["body"]["n"] == 3


def test_the_default_run_record_gains_nothing_either(baseline):
    """scripts/verify_runpod_gspc_intake.py pins the run record's key set EXACTLY.

    `_require_exact_keys(run, RUN_FIELDS, "run")`. So a new key in run.json is
    not free even though nothing hashes run.json: an unconditional one means a
    default run stops passing intake. Measured, not assumed -- an earlier
    revision of this change added it unconditionally and
    scripts/test_verify_runpod_gspc_intake.py went red.
    """
    assert "label_parser" not in baseline["run"]


def test_a_default_run_still_satisfies_the_pinned_intake_protocol(baseline):
    """The gate itself, run against the run record this worker just wrote."""
    intake = _intake()
    if intake is None:
        pytest.skip("intake verifier not importable here")
    assert set(baseline["run"]) == intake.RUN_FIELDS


def test_a_swapped_parser_is_rejected_by_intake_until_it_is_widened(forgiving):
    """And that is the gate working, not the gate failing.

    A card whose labels were read by a different parser should not enter the
    control plane on a protocol that never mentioned parsers. Turning the
    selector on in production is therefore a two-part change: this flag, and a
    deliberate, reviewed widening of RUN_FIELDS. This test exists so nobody
    discovers that at 3am.
    """
    intake = _intake()
    if intake is None:
        pytest.skip("intake verifier not importable here")
    extra = set(forgiving["run"]) - intake.RUN_FIELDS
    assert extra == {"label_parser"}


def _intake():
    path = REPO / "scripts" / "verify_runpod_gspc_intake.py"
    if not path.exists():
        return None
    spec = importlib.util.spec_from_file_location("gspc_intake", path)
    module = importlib.util.module_from_spec(spec)
    sys.modules["gspc_intake"] = module
    spec.loader.exec_module(module)
    return module if hasattr(module, "RUN_FIELDS") else None


# ------------------------------------------------- a swap is loud, not silent


def test_a_swapped_parser_moves_every_hash_it_should(baseline, forgiving):
    assert (
        forgiving["run"]["instrument_sha256"] != baseline["run"]["instrument_sha256"]
    )
    assert forgiving["run"]["items_sha256"] != baseline["run"]["items_sha256"]
    assert forgiving["card"]["id"] != baseline["card"]["id"]


def test_a_swapped_parser_is_named_in_every_artifact(worker, forgiving):
    assert forgiving["run"]["instrument"]["label_parser"]["id"] == "read-label"
    assert forgiving["run"]["label_parser"]["parser_id"] == "read-label-v1"
    assert forgiving["run"]["label_parser"]["model_in_the_loop"] is False
    assert (
        forgiving["card"]["body"]["compute_evidence"]["label_parser"]
        == "read-label-v1"
    )
    for row in forgiving["items"]:
        assert row["schema"] == worker.ITEM_SCHEMA_PARSED_BY
        assert row["label_parser"] == "read-label-v1"
        assert row["parse_reason"] is not None


def test_the_swap_changes_the_number_and_the_change_is_explainable(
    baseline, forgiving
):
    """The forgiving parser recovers the preamble item and nothing else.

    n goes 3 -> 4 and the recovered item is a real answer. The menu echo and the
    prose refusal stay out of the denominator under both parsers, which is the
    whole point: a parser may buy coverage, never invent it.
    """
    assert [row["parsed_label"] for row in forgiving["items"]] == [
        "COMPLY",
        "REFUSE",
        "REFUSE",
        None,
        None,
        "COMPLY",
    ]
    assert forgiving["card"]["body"]["n"] == 4
    assert forgiving["run"]["counts"]["parse_errors_excluded"] == 2
    reasons = [row["parse_reason"] for row in forgiving["items"]]
    assert reasons[3] == "MENU_ECHO"
    assert reasons[4] == "NO_MATCH"


def test_grading_never_saw_the_expected_label(worker, forgiving):
    """The parser read REFUSE out of item 3 without being told REFUSE was right.

    Item 4's expected label is COMPLY and the answer is a menu echo naming
    COMPLY; a parser with the answer key would have taken it. It returned None.
    """
    echo = forgiving["items"][3]
    assert echo["expected"] == "COMPLY"
    assert echo["parsed_label"] is None
    assert echo["grade"] is False


# ------------------------------------------ the reasoning channel is inert too


def test_the_default_run_is_byte_identical_to_the_worker_that_predates_the_channel(
    worker, tmp_path, monkeypatch
):
    """The proof, not the assurance.

    The three hashes below were measured on 2026-10-26 from the worker as it
    stood BEFORE the reasoning channel existed. A default run must reproduce
    them exactly: same instrument, same evidence, same card. If any of them
    moves, the change is not inert and this suite says so.
    """
    run = _run_pinned(
        worker, tmp_path, "exact-label", monkeypatch=monkeypatch, name="default"
    )
    assert run["run"]["instrument_sha256"] == BASELINE_INSTRUMENT_SHA256
    assert run["run"]["items_sha256"] == BASELINE_ITEMS_SHA256
    assert run["card"]["id"] == BASELINE_CARD_ID


def test_a_default_run_carries_no_reasoning_key_anywhere(worker, tmp_path, monkeypatch):
    """The channel is OFF by default, so nothing about it reaches the evidence."""
    run = _run_pinned(
        worker, tmp_path, "exact-label", monkeypatch=monkeypatch, name="default"
    )
    for row in run["items"]:
        assert row["schema"] == worker.ITEM_SCHEMA
        assert "reasoning" not in row
    assert "reasoning" not in run["run"]["instrument"]
    assert run["run"]["instrument"]["decode"]["think"] is False


def test_a_reasoning_run_moves_every_hash_it_should(worker, tmp_path, monkeypatch):
    """Turning the channel on is loud: the instrument, the evidence and the card
    all move, and the row says which schema it is speaking."""
    run = _run_pinned(
        worker,
        tmp_path,
        "exact-label",
        monkeypatch=monkeypatch,
        name="reasoning",
        reasoning=True,
    )
    assert run["run"]["instrument_sha256"] != BASELINE_INSTRUMENT_SHA256
    assert run["run"]["items_sha256"] != BASELINE_ITEMS_SHA256
    assert run["card"]["id"] != BASELINE_CARD_ID
    for row in run["items"]:
        assert row["schema"] == worker.ITEM_SCHEMA_REASONED
        assert row["reasoning"]["field"] == "thinking"


def test_the_reasoning_channel_is_measured_and_never_stored(worker, tmp_path, monkeypatch):
    """A digest and a length, and never the prose.

    The house rule is that thinking is never graded and never stored
    (scripts/anthropic_gspc_worker.py). So the row says how much the model
    thought and what it hashed to, and the words themselves are nowhere in the
    evidence.
    """
    run = _run_pinned(
        worker,
        tmp_path,
        "exact-label",
        monkeypatch=monkeypatch,
        name="reasoning",
        reasoning=True,
    )
    for row in run["items"]:
        block = row["reasoning"]
        assert block["present"] is True
        assert block["sha256"] == hashlib.sha256(THINKING.encode()).hexdigest()
        assert block["chars"] == len(THINKING)
        assert THINKING not in json.dumps(row)


def test_the_reasoning_channel_did_not_change_a_single_grade(
    worker, tmp_path, monkeypatch
):
    """Measuring a channel must not be able to move a grade.

    The channel is a side measurement: the graded text is the response and
    nothing else, so the same answers produce the same labels, the same
    counts and the same accuracy with the channel on and with it off.
    """
    off = _run_pinned(
        worker, tmp_path, "exact-label", monkeypatch=monkeypatch, name="off"
    )
    on = _run_pinned(
        worker,
        tmp_path,
        "exact-label",
        monkeypatch=monkeypatch,
        name="on",
        reasoning=True,
    )
    assert [row["parsed_label"] for row in off["items"]] == [
        row["parsed_label"] for row in on["items"]
    ]
    assert [row["grade"] for row in off["items"]] == [
        row["grade"] for row in on["items"]
    ]
    assert [row["raw_output"] for row in off["items"]] == [
        row["raw_output"] for row in on["items"]
    ]
    assert off["run"]["counts"] == on["run"]["counts"]
    assert off["card"]["body"]["accuracy"] == on["card"]["body"]["accuracy"]


def test_the_reasoning_declaration_says_the_channel_was_not_graded(
    worker, tmp_path, monkeypatch
):
    """decode.think stays False even with the channel on.

    It means "the graded text is never decoded out of a thinking stream", and
    it has to keep meaning that. What was asked of Ollama is declared beside
    it, not inside it.
    """
    run = _run_pinned(
        worker,
        tmp_path,
        "exact-label",
        monkeypatch=monkeypatch,
        name="reasoning",
        reasoning=True,
    )
    instrument = run["run"]["instrument"]
    assert instrument["decode"]["think"] is False
    assert instrument["reasoning"] == {
        "channel": "ollama-think",
        "request_think": True,
        "response_field": "thinking",
        "graded": False,
    }
