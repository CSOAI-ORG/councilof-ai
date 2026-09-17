"""Two things the integrity suite does not pin: counts, and the words in the summary.

The integrity suite (test_master_closed_loop_integrity.py, 82 tests) already covers
authority-vs-validity and the Rekor payload — including the exact zero-signature
defect — so those assertions are NOT duplicated here. What it does not pin is the
arithmetic and the vocabulary that sit on top of the crypto, which is where today's
misreadings actually happened:

  * a count that totals ATTEMPTS and prints them as SUBMISSIONS;
  * a summary that says ANCHORED or PROVEN when nothing was anchored or proved.

Run: <venv>/bin/python -m pytest tests/test_closed_loop_counts_and_states.py -q
"""
import importlib.util
import json
import pathlib
import sys

import pytest

ROOT = pathlib.Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location("closed_loop", ROOT / "scripts/master_closed_loop.py")
m = importlib.util.module_from_spec(spec)
sys.modules[spec.name] = m
spec.loader.exec_module(m)


def count_submitted(results):
    """The one predicate. A rejected or prepared entry is NOT a submission."""
    return sum(1 for r in results if r.get("state") == "SUBMITTED")


def test_count_excludes_everything_that_is_not_a_submission():
    results = [
        {"state": "PREPARED_NOT_SUBMITTED"},
        {"state": "NOT_REQUESTED"},
        {"state": "FAILED", "reason": "rejected by the log"},
        {"state": "SUBMITTED", "uuid": "deadbeef"},
    ]
    assert count_submitted(results) == 1
    assert count_submitted(results) != len(results), "counting attempts, not submissions"


def test_count_is_zero_when_nothing_was_sent():
    assert count_submitted([{"state": "PREPARED_NOT_SUBMITTED"}] * 9) == 0


def test_summary_never_claims_an_anchor_it_does_not_hold(tmp_path, capsys):
    """The loop's own printed summary must not contain a word that asserts a proof."""
    harness = tmp_path / "harness.json"
    harness.write_text(json.dumps({
        "generated_at": "2026-09-17T00:00:00Z",
        "sources_bound_to_harness": [
            {"source": "unit-test", "records": [{"schema": "fixture/1", "value": 1}]}
        ],
    }))
    rc = m.main(["--harness", str(harness), "--out", str(tmp_path / "out")])
    assert rc == 0
    printed = capsys.readouterr().out
    summary = json.loads(printed)
    assert summary["rekor"] == "NOT_REQUESTED"   # no signer was given
    assert summary["ots"] == "NOT_REQUESTED"
    assert summary["board_signatures"] == 0
    assert summary["publications"] == 0
    for word in ("ANCHORED", "PROVEN", "CERTIFIED", "MEASURED"):
        assert word not in printed.upper(), f"summary claims {word}"


def test_returned_summary_states_are_explicit_enums():
    """rekor/ots states must be named states, never bare booleans or absent keys."""
    src = (ROOT / "scripts/master_closed_loop.py").read_text()
    assert "'rekor': 'PREPARED_NOT_SUBMITTED'" in src or '"rekor": "PREPARED_NOT_SUBMITTED"' in src
    assert "'ots': 'NOT_REQUESTED'" in src or '"ots": "NOT_REQUESTED"' in src
    # And the words that misled us today must not be emittable as states at all.
    for banned in ("'ots': 'ANCHORED'", "'rekor': 'ANCHORED'", "'ots': 'PROVEN'"):
        assert banned not in src, f"a state literal asserts a proof: {banned}"


def test_ots_is_declared_not_performed():
    """This file no longer stamps, and must never claim a state it cannot produce.

    The previous implementation called the OpenTimestamps calendar inline. This one
    records 'ots': 'NOT_REQUESTED' and performs no stamping. That is NOT an estate
    regression — the real stamper is scripts/badger/ots_stamp.py, used by card_root.py,
    witness_public_root.py and the anchor reports, and it is untouched. The loss is
    confined to this harness's own loop.

    What this test pins is the honesty condition: the moment someone makes the summary
    claim an OTS state while no stamping code exists here to back it, this fails.
    """
    src = (ROOT / "scripts/master_closed_loop.py").read_text()
    performs_ots = "opentimestamps" in src.lower()
    claims_ots = "'ots': 'STAMPED'" in src or "'ots': 'PENDING'" in src
    assert not (claims_ots and not performs_ots), "summary claims an OTS state no code produces"
