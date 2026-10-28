#!/usr/bin/env python3
"""The paired-comparison record must not overstate what the two arms are."""
import json
import pathlib
import sys

HERE = pathlib.Path(__file__).resolve().parent
RECORD = HERE.parent.parent / "docs/measurement/GSPC-GOV-FRONTIER-ARM-2026-10-28.json"


def test_record_exists():
    assert RECORD.exists(), "the frontier-arm record has not been produced"


def test_both_denominators_are_published():
    d = json.loads(RECORD.read_text())
    for arm in d["arms"]:
        assert arm["accuracy_over_graded"] is not None, "the graded-only figure is missing"
        assert arm["accuracy_over_all_items"] is not None, "the every-item figure is missing"
        assert arm["items_total"] == arm["items_graded"] + arm["items_unparsed"], \
            "the item counts do not account for every item"
        assert "unparsed" in arm["denominator_rule_of_this_figure"]


def test_the_per_item_ledger_is_present_and_complete():
    d = json.loads(RECORD.read_text())
    for arm in d["arms"]:
        assert len(arm["per_item"]) == arm["items_total"], \
            "the ledger does not carry every item"
        for entry in arm["per_item"].values():
            assert "expected" in entry and "observed" in entry and "ok" in entry


def test_the_record_refuses_the_comparison_it_cannot_make():
    d = json.loads(RECORD.read_text())
    text = json.dumps(d)
    assert "UNMEASURED" in text, "the record must name MEOK's own measurement state"
    meok_arms = [a for a in d["arms"] if a["role"] == "our own product"]
    if meok_arms:
        for arm in meok_arms:
            assert "UNMEASURED_CHAT" in json.dumps(arm), \
                "a MEOK arm must carry the caveat that its own answers are UNMEASURED_CHAT"
    else:
        assert d["meok_arm_status"], "an absent MEOK arm must say why"
    if d["paired"] is None:
        assert d["meok_arm_status"], "no paired verdict without a paired arm"
    else:
        assert d["paired"]["verdict"] in ("SEPARATED", "TIE"), \
            "a paired verdict must be one of the estate's two words"


def test_the_board_cell_is_quoted_not_invented():
    d = json.loads(RECORD.read_text())
    cell = d["board_cell"]
    assert cell is not None, "the board's own cell for this axis is missing"
    assert cell["axis"] == d["axis"]
    assert cell["separation"] in ("SEPARATED", "TIE", "UNTESTED")


if __name__ == "__main__":
    sys.exit(0 if test_record_exists() else 1)
