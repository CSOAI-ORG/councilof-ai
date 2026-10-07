"""Benchmark index: the producer's invariants and the published file's self-consistency.

Drift between the published index and the cards on disk is detected by
`python3 scripts/build_benchmark_index.py --verify` (exit 1 on drift). It is NOT
asserted here as a pass/fail condition, because the published index is refreshed
by an owner-gated re-stamp + deploy: a red test that nobody may act on is noise.
Everything below is a property that must hold whether or not the index is current.
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parents[1] / "scripts"))
import build_benchmark_index as bbi  # noqa: E402

INDEX = bbi.DEFAULT_INDEX


def test_seal_round_trips() -> None:
    """byte_size/sha256 cover the compact serialisation minus those two members."""
    doc = bbi.build_doc(bbi.rows_on_disk(), "2026-01-01T00:00:00.000000+00:00")
    _, sealed = bbi.seal(doc)
    ok, why = bbi.check_seal(sealed)
    assert ok, why
    # tampering with a member must break the seal
    sealed["totals"]["cards_total"] += 1
    ok, _ = bbi.check_seal(sealed)
    assert not ok, "a mutated document must not reseal"


def test_published_index_seal_and_totals_are_self_consistent() -> None:
    doc = json.loads(INDEX.read_text(encoding="utf-8"))
    ok, why = bbi.check_seal(doc)
    assert ok, why

    rows = doc["cards"]
    totals = doc["totals"]
    assert totals["cards_total"] == len(rows)
    assert totals["signed"] == sum(1 for r in rows if r["signed"])
    assert totals["unsigned"] == sum(1 for r in rows if not r["signed"])
    assert totals["axes"] == len({r["axis"] for r in rows})
    assert totals["models"] == len({r["model"] for r in rows})
    assert sum(doc["by_axis"].values()) == len(rows), "by_axis must account for every row"


def test_published_rows_never_vanish_from_disk() -> None:
    """A row must not cite a card file that no longer exists."""
    doc = json.loads(INDEX.read_text(encoding="utf-8"))
    disk = {r["path"] for r in bbi.rows_on_disk()}
    published = {r["path"] for r in doc["cards"]}
    # The pointer stub is EXCLUDED by rows_on_disk (no card body) but is still
    # cited by the published index — that is a counting error in the index, not
    # a missing file, so it must not be reported as vanished.
    not_cards = {"mill-cards-signed/GOVERNANCE-RETRIEVE.json"}
    gone = published - disk - not_cards
    assert not gone, f"published rows cite missing cards: {sorted(gone)[:5]}"


def test_rows_on_disk_skips_non_cards() -> None:
    """A file without a card body (e.g. the GOVERNANCE-RETRIEVE pointer stub)
    is not a measurement card and must not be counted as one. The published
    index predates this rule and DOES count it — one reason its total is a
    file count rather than a card count."""
    paths = {r["path"] for r in bbi.rows_on_disk()}
    assert "mill-cards-signed/GOVERNANCE-RETRIEVE.json" not in paths
    for row in bbi.rows_on_disk():
        assert row["axis"] is not None and row["model"] is not None


def test_published_is_a_subset_of_what_exists_now() -> None:
    """Nothing published is invented: every cited row reads back from disk."""
    doc = json.loads(INDEX.read_text(encoding="utf-8"))
    disk = {r["path"] for r in bbi.rows_on_disk()}
    missing = {r["path"] for r in doc["cards"]} - disk - {"mill-cards-signed/GOVERNANCE-RETRIEVE.json"}
    assert not missing, sorted(missing)[:5]


if __name__ == "__main__":
    for name, fn in sorted(globals().items()):
        if name.startswith("test_") and callable(fn):
            fn()
            print(f"PASS {name}")
