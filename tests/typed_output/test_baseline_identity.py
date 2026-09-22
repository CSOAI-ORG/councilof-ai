#!/usr/bin/env python3
"""The baseline parser must reproduce the labels the signed cards were built on.

If `exact-label-v1` is to be called a baseline rather than a rewrite, replaying
it over the retained mill bytes has to return, for every item, exactly the
`parsed_label` that the run recorded at the time. Anything else means the
default parser's meaning drifted while nobody was looking, and every comparison
made against it would be measuring the drift.

This test reads `/workspace/lanes/out/mill-restart-2026-09-22/runs/` when that
directory is present, and is skipped elsewhere -- it is a pod test, deliberately
tied to real bytes rather than to a fixture, because a fixture could not have
caught the thing it is here to catch.
"""

from __future__ import annotations

import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

from harness.typed_output import (  # noqa: E402
    ExactLabelParser,
    ReadLabelParser,
    looks_like_menu_echo,
)
from harness.typed_output.base import looks_unfinished  # noqa: E402
from harness.typed_output.replay import load_items  # noqa: E402

CANDIDATE_ROOTS = [
    Path("/workspace/ci/typed-output-lane-scratch/frozen-runs"),
    Path("/workspace/lanes/out/mill-restart-2026-09-22/runs"),
]


def _root() -> Path:
    for path in CANDIDATE_ROOTS:
        if path.is_dir() and any(path.glob("*/*/runs/*/items.jsonl")):
            return path
    pytest.skip("no retained mill evidence on this machine")


@pytest.fixture(scope="module")
def items():
    return load_items(_root())


def test_there_is_evidence_to_replay(items):
    assert len(items) > 1000, f"only {len(items)} items found; is the root right?"


def test_replay_reproduces_every_stored_label(items):
    parser = ExactLabelParser()
    mismatches = [
        (item["_run_id"], item["item_id"], item["parsed_label"], replayed.label)
        for item in items
        for replayed in [parser.extract_label(item.get("raw_output"), item.labels)]
        if item["parsed_label"] != replayed.label
    ]
    assert not mismatches, (
        f"{len(mismatches)} of {len(items)} items re-parse differently from the "
        f"label the run stored; first: {mismatches[:3]}"
    )


def test_the_control_can_fail(items):
    """A comparison that cannot fail proves nothing.

    The forgiving parser must disagree with the strict one somewhere in these
    bytes. If it agreed everywhere, the identity test above would be vacuous --
    it would be comparing a rule with itself.
    """
    strict, forgiving = ExactLabelParser(), ReadLabelParser()
    disagreements = sum(
        strict.extract_label(item.get("raw_output"), item.labels).label
        != forgiving.extract_label(item.get("raw_output"), item.labels).label
        for item in items
    )
    assert disagreements > 0, (
        "the two deterministic parsers never disagree on the retained bytes, so "
        "the identity test is not actually constraining anything"
    )


def test_unparsed_items_leave_the_denominator_rather_than_scoring_zero(items):
    """Absent is not zero -- restated as arithmetic over the real bytes."""
    parser = ExactLabelParser()
    unparsed = [
        item
        for item in items
        if parser.extract_label(item.get("raw_output"), item.labels).label is None
    ]
    assert unparsed, "expected some unreadable answers in a real mill pass"
    for item in unparsed:
        assert item["parsed_label"] is None
        # An item that never reached the model has no grade at all; one that
        # answered unreadably carries grade False in the row and is then
        # subtracted from n by `graded_n = transport_ok - parse_errors`. Either
        # way it is out of the denominator: the row is evidence, not a score.
        assert item["grade"] is (False if item["transport_ok"] else None)

    # And the arithmetic, per run, on the real counts the runs recorded.
    from collections import Counter

    unparsed_by_run = Counter(item["_run_id"] for item in unparsed)
    checked = 0
    for run_json in _root().glob("*/*/runs/*/run.json"):
        import json

        run = json.loads(run_json.read_text(encoding="utf-8"))
        counts = run["counts"]
        if counts.get("parse_errors_excluded") != unparsed_by_run.get(run["run_id"], 0):
            continue  # keyword banks count length-capped answers here too
        assert counts["graded_n"] == counts["transport_ok"] - counts[
            "parse_errors_excluded"
        ]
        checked += 1
    assert checked > 0, "no run's arithmetic could be checked"


def test_the_guards_never_reject_an_answer_a_string_match_could_read(items):
    """A guard that fires on a real answer is not a guard, it is data loss.

    `looks_like_menu_echo` and `looks_unfinished` run BEFORE a model-backed
    parser is consulted, so a false positive silently removes an item from the
    denominator. Measured on 2026-09-22 over the retained evidence: the echo
    guard fires 271 times, the unfinished guard 8, and neither has ever fired on
    an answer that either deterministic parser could read.
    """
    strict, forgiving = ExactLabelParser(), ReadLabelParser()
    echo_fires = unfinished_fires = 0
    false_positives = []
    for item in items:
        text = item.get("raw_output") or ""
        readable = (
            strict.extract_label(text, item.labels).label
            or forgiving.extract_label(text, item.labels).label
        )
        echo = looks_like_menu_echo(text, item.labels)
        unfinished = looks_unfinished(text)
        echo_fires += echo
        unfinished_fires += unfinished
        if readable is not None and (echo or unfinished):
            false_positives.append((item["item_id"], readable, text[:120]))

    assert echo_fires > 0 and unfinished_fires > 0, (
        "neither guard fired anywhere in the retained evidence, so this test is "
        "vacuous and the guards are not being exercised by real bytes"
    )
    assert not false_positives, (
        f"{len(false_positives)} answers a string match could read were thrown "
        f"away by a guard; first: {false_positives[:3]}"
    )
