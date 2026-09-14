"""Commissioned subjects are picked first (2026-09-14): a paid request drives the mill.

Proves the lane can fail: without --priority the pick is rank order; with it, the commissioned row
leads regardless of rank, and dead / measured / in-flight guards still apply to it.
"""
from __future__ import annotations

import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))

import mill_hub_queue as m  # noqa: E402


def _rows():
    return [
        {"id": "org/a", "rank": 1, "pipeline_tag": "text-generation", "measured_axes": {}},
        {"id": "org/b", "rank": 2, "pipeline_tag": "text-generation", "measured_axes": {}},
        {"id": "org/c", "rank": 3000, "pipeline_tag": "text-generation", "measured_axes": {}},
    ]


def test_priority_row_leads_regardless_of_rank():
    baseline = m.pick_emptiest(_rows(), 2, axis="swarm")
    assert [r["id"] for r in baseline] == ["org/a", "org/b"], "baseline: rank order"
    picked = m.pick_emptiest(_rows(), 2, axis="swarm", priority_ids={"org/c"})
    assert [r["id"] for r in picked] == ["org/c", "org/a"]


def test_priority_never_overrides_the_other_guards():
    rows = _rows()
    rows[2]["measured_axes"] = {"swarm": {"status": "MEASURED", "card_id": "x"}}
    assert [r["id"] for r in m.pick_emptiest(rows, 3, axis="swarm", priority_ids={"org/c"})] == ["org/a", "org/b"]
    assert [r["id"] for r in m.pick_emptiest(_rows(), 3, axis="swarm", priority_ids={"org/c"}, dead={"org/c"})] == ["org/a", "org/b"]
    assert [r["id"] for r in m.pick_emptiest(_rows(), 3, axis="swarm", priority_ids={"org/c"}, inflight={("org/c", "swarm")})] == ["org/a", "org/b"]


def test_priority_file_loader_tolerates_missing(tmp_path: Path):
    assert m.load_only_ids(tmp_path / "nope.txt") == set()
    f = tmp_path / "p.txt"
    f.write_text("# commissioned\norg/c\n\n", encoding="utf-8")
    assert m.load_only_ids(f) == {"org/c"}
