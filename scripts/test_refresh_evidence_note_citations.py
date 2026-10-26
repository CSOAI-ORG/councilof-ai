"""The evidence-note citation refresher must fix supersession without breaking copy rules.

The failure this guards against (2026-10-07): one unit test — `stalenessViolations` on
`honest-unmeasured-n12` — went red on four landing PRs at once because the mill legitimately
re-runs UNMEASURED cells and superseded the cited card. 557 signed cards sat unmergeable
behind it. The refresher names the replacing card beside the original; these tests pin that
it does so idempotently, within the note's own word limits, and never invents evidence.
"""
from __future__ import annotations

import json
import pathlib
import subprocess
import sys

REPO = pathlib.Path(__file__).resolve().parents[1]
SCRIPT = REPO / "scripts" / "refresh_evidence_note_citations.py"
NOTES = REPO / "client" / "src" / "data" / "evidence-notes.json"

sys.path.insert(0, str(REPO / "scripts"))
import refresh_evidence_note_citations as ref  # noqa: E402

CARD_URL = "https://councilof.ai/interop/mill-cards-signed/"


def _note(body: str, artifacts=None) -> dict:
    return {
        "id": "t", "date": "2026-10-07", "title": "t", "summary": "s",
        "body": body, "artifacts": artifacts or [], "social": "x" * 10,
    }


def _long_body(words: int = 150) -> str:
    return " ".join(["word"] * words)


def test_committed_notes_are_all_current():
    """The repo must ship in the state `--check` accepts, or CI blocks the next landing."""
    p = subprocess.run(
        [sys.executable, str(SCRIPT), "--check"],
        capture_output=True, text=True, cwd=REPO, timeout=120,
    )
    assert p.returncode == 0, f"--check failed on committed notes:\n{p.stdout}\n{p.stderr}"
    assert "cite current cards" in p.stdout


def test_names_the_replacing_card_beside_the_original():
    note = _note(
        f"reads a card ({CARD_URL}signed-a.json) and stops there. " + _long_body(140),
        artifacts=[{"label": "card", "url": f"{CARD_URL}signed-a.json"}],
    )
    superseded = {"signed-a.json": "signed-b.json"}
    out = ref.refresh_note(note, superseded, {})

    assert any(c.startswith("REFRESHED") for c in out), out
    assert "signed-b.json" in note["body"], "replacement was not named"
    assert "signed-a.json" in note["body"], "original citation was dropped"
    assert 120 <= ref.words(note["body"]) <= 250, ref.words(note["body"])


def test_walks_the_chain_to_the_end():
    note = _note(f"cites ({CARD_URL}signed-a.json). " + _long_body(140))
    chain = {"signed-a.json": "signed-b.json", "signed-b.json": "signed-c.json"}
    ref.refresh_note(note, chain, {})
    assert "signed-c.json" in note["body"], "chain end was not named"
    assert "signed-b.json" not in note["body"], "an intermediate card should not be cited"


def test_is_idempotent():
    note = _note(f"cites ({CARD_URL}signed-a.json). " + _long_body(140))
    chain = {"signed-a.json": "signed-b.json"}
    first = ref.refresh_note(note, chain, {})
    body_after_first = note["body"]
    second = ref.refresh_note(note, chain, {})

    assert any(c.startswith("REFRESHED") for c in first)
    assert not any(c.startswith("REFRESHED") for c in second), second
    assert note["body"] == body_after_first


def test_never_exceeds_the_copy_limits():
    note = _note(f"cites ({CARD_URL}signed-a.json). " + _long_body(245))
    out = ref.refresh_note(note, {"signed-a.json": "signed-b.json"}, {})

    assert any(c.startswith("REFUSED") for c in out), out
    assert note["body"].count("signed-b.json") == 0, "a refused note must not be mutated"


def test_names_a_withdrawal_correction():
    body = f"cites ({CARD_URL}signed-a.json). " + _long_body(140)
    note = _note(body)
    ref.refresh_note(note, {}, {"signed-a.json": "C-TEST-01"})
    assert "C-TEST-01" in note["body"]


def test_never_invents_an_accuracy_or_a_measured_state():
    """The refresher may add a citation sentence and nothing else."""
    note = _note(f"cites ({CARD_URL}signed-a.json). " + _long_body(140))
    before_digits = set(note["body"])
    ref.refresh_note(note, {"signed-a.json": "signed-b.json"}, {})

    assert "MEASURED" not in note["body"]
    new_text = note["body"].replace("signed-b.json", "")
    assert not any(ch.isdigit() for ch in new_text), "a digit appeared that was not already there"
    assert set(note["body"]) >= before_digits
    assert note["artifacts"] == [], "artifacts must not be appended (1-3 cap, notes sit at 3)"


def test_check_mode_reports_without_mutating():
    snapshot = NOTES.read_text()
    p = subprocess.run(
        [sys.executable, str(SCRIPT), "--check"],
        capture_output=True, text=True, cwd=REPO, timeout=120,
    )
    assert p.returncode == 0
    assert NOTES.read_text() == snapshot, "--check mutated the notes file"


def test_report_shape_is_machine_readable():
    note = _note(f"cites ({CARD_URL}signed-a.json). " + _long_body(140))
    out = ref.refresh_note(note, {"signed-a.json": "signed-b.json"}, {})
    assert isinstance(out, list)
    assert all(isinstance(c, str) and c.split(" ", 1)[0] in {"REFRESHED", "REFUSED"} for c in out)


def test_current_card_for_is_terminal():
    assert ref.current_card_for("a", {}) == "a"
    assert ref.current_card_for("a", {"a": "b"}) == "b"
    # a self-referential ledger row must not loop forever
    assert ref.current_card_for("a", {"a": "a"}) == "a"
    assert ref.current_card_for("a", {"a": "b", "b": "a"}) in {"a", "b"}


def test_cited_cards_reads_every_field_the_guard_reads():
    note = {
        "title": "t", "summary": "s", "body": "b", "social": "s",
        "artifacts": [{"label": "x", "url": f"{CARD_URL}signed-z.json"}],
    }
    assert ref.cited_cards(note) == ["signed-z.json"]
