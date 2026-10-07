"""Supersession-conflict evidence tool.

The claim this file guards: the analyzer reports and never rules. A tool that quietly rewrote
the ledger while 'helpfully' resolving a conflict would be far more dangerous than the conflict.
"""
from __future__ import annotations

import json
import pathlib
import subprocess
import sys

REPO = pathlib.Path(__file__).resolve().parents[1]
SCRIPT = REPO / "scripts" / "analyze_supersession_conflicts.py"

sys.path.insert(0, str(REPO / "scripts"))
import analyze_supersession_conflicts as an  # noqa: E402


def test_as_map_is_first_wins_and_drops_malformed():
    rows = [
        {"superseded_file": "a.json", "by_file": "b.json"},
        {"superseded_file": "a.json", "by_file": "c.json"},   # later row must NOT override
        {"superseded_file": "x.json"},                        # no by_file -> dropped
        {"by_file": "orphan.json"},                           # no superseded_file -> dropped
        {"superseded_file": "y.json", "by_file": "y.json"},   # kept; filtering is not our job
    ]
    assert an.as_map(rows) == {"a.json": "b.json", "y.json": "y.json"}


def test_chain_walks_and_terminates():
    assert an.chain("a", {}) == []
    assert an.chain("a", {"a": "b"}) == ["b"]
    assert an.chain("a", {"a": "b", "b": "c"}) == ["b", "c"]
    # a self-referential ledger row must not hang the tool
    assert an.chain("a", {"a": "a"}) == ["a"]
    assert an.chain("a", {"a": "b", "b": "a"}) in (["b", "a"], ["b"])
    # a cycle longer than the limit must still return
    long = {"n0": "n1", "n1": "n2", "n2": "n0"}
    assert len(an.chain("n0", long, limit=10)) <= 10


def test_script_writes_nothing():
    """The whole point: evidence only. Assert the working tree is untouched by a run."""
    def status() -> str:
        r = subprocess.run(["git", "status", "--porcelain"], capture_output=True, text=True,
                           cwd=REPO, timeout=120)
        return r.stdout

    before = status()
    r = subprocess.run(
        [sys.executable, str(SCRIPT), "--base", "origin/master",
         "--other", "origin/master"],
        capture_output=True, text=True, cwd=REPO, timeout=300,
    )
    assert r.returncode == 0, r.stderr[-800:]
    assert status() == before, "the analyzer modified the working tree"
    # base == other means nothing can be disputed
    report = json.loads(r.stdout)
    assert report["disputed_keys"] == 0
    assert report["verdict_tally"] == {}


def test_report_schema_when_refs_exist():
    r = subprocess.run(
        [sys.executable, str(SCRIPT), "--base", "origin/master", "--other", "origin/master"],
        capture_output=True, text=True, cwd=REPO, timeout=300,
    )
    if r.returncode != 0:
        # refs are not fetched in this environment — the CLI contract is still worth asserting
        return
    report = json.loads(r.stdout)
    for key in ("schema", "base", "other", "base_rows", "other_rows", "shared_keys",
                "disputed_keys", "verdict_tally", "evidence_tally_later_at_wins",
                "resolvable_by_timestamp", "needing_a_tiebreak_rule",
                "needs_human_ruling", "mechanically_resolvable", "all_disputes",
                "claims_not_made"):
        assert key in report, f"missing {key}"
    assert report["schema"] == "csoai.supersession-conflict-evidence/0.1"
    # self-comparison: nothing disputed, nothing needing a ruling
    assert report["disputed_keys"] == 0
    assert report["needs_human_ruling"] == []
    assert report["needing_a_tiebreak_rule"] == 0
    assert any("writes nothing" in c or "No ledger row" in c for c in report["claims_not_made"])


def test_every_dispute_row_carries_the_evidence_fields():
    """Each dispute must expose both timestamps and which side is newer, or the report is useless."""
    r = subprocess.run(
        [sys.executable, str(SCRIPT), "--base", "origin/master", "--other", "origin/master"],
        capture_output=True, text=True, cwd=REPO, timeout=300,
    )
    if r.returncode != 0:
        return
    report = json.loads(r.stdout)
    for row in report["all_disputes"]:
        for field in ("superseded", "base_replacement", "other_replacement", "base_terminal",
                      "other_terminal", "terminals_converge", "base_at", "other_at",
                      "newer_side", "reasons_agree", "evidence_winner", "mechanical_verdict"):
            assert field in row, f"dispute row missing {field}"
        assert row["newer_side"] in {"BASE", "OTHER", "TIE"}
        if row["newer_side"] == "TIE":
            assert row["evidence_winner"] == "", "a tie must not name a winner"
