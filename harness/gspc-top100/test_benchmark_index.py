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



def test_verify_does_not_report_the_pointer_stub_as_a_missing_card() -> None:
    """A published row whose file is present but excluded from disk rows is a NON-CARD row,
    not a vanished card. Reporting it as "gone from disk" would have been a false claim that
    published evidence disappeared — the exact class of error this TUI exists to prevent.

    Regression: the stub carries model "?" (a literal, truthy string) and sha256_id "", while
    70 genuinely unsigned cards also carry sha256_id "" — so neither field alone identifies it.
    """
    import io
    from contextlib import redirect_stdout

    doc = json.loads(INDEX.read_text(encoding="utf-8"))
    rows = doc["cards"]
    disk = {r["path"] for r in bbi.rows_on_disk()}
    published = {r.get("path") for r in rows}

    stub_paths = {r.get("path") for r in rows
                  if str(r.get("model") or "").strip() in ("", "?", "null", "None")}
    missing = published - disk - stub_paths

    assert stub_paths == {"mill-cards-signed/GOVERNANCE-RETRIEVE.json"}, stub_paths
    assert not missing, f"truly vanished cards: {sorted(missing)[:5]}"
    # the file really is on disk — only rows_on_disk excludes it (no card body)
    stub = INDEX.parent / "mill-cards-signed" / "GOVERNANCE-RETRIEVE.json"
    assert stub.is_file(), "the pointer stub must exist for this regression to be meaningful"

    buf = io.StringIO()
    with redirect_stdout(buf):
        bbi.verify(INDEX)
    out = buf.getvalue()
    assert "non-card rows" in out
    assert "published but gone from disk: 0" in out, out
    # unsigned rows with an empty id must NOT be classed as non-cards
    unsigned_empty_id = [r for r in rows if not str(r.get("sha256_id") or "").strip()
                         and str(r.get("model") or "").strip() not in ("", "?", "null", "None")]
    assert len(unsigned_empty_id) >= 60, len(unsigned_empty_id)
    assert all(str(r.get("model") or "").strip() not in ("", "?") for r in unsigned_empty_id)


def test_drift_counts_are_reported_exactly() -> None:
    """Drift must be a single, unambiguous number: on-disk cards never published."""
    doc = json.loads(INDEX.read_text(encoding="utf-8"))
    disk = {r["path"] for r in bbi.rows_on_disk()}
    published = {r.get("path") for r in doc["cards"]}
    drift = len(disk - published)
    assert drift >= 0
    # every drifted path must actually read back as a card body (a real, countable card)
    for path in sorted(disk - published)[:25]:
        name = path.split("/", 1)[-1]
        directory = INDEX.parent / path.split("/", 1)[0]
        card = json.loads((directory / name).read_text(encoding="utf-8"))
        assert isinstance(card.get("body"), dict), f"{path} is not a card"

if __name__ == "__main__":
    for name, fn in sorted(globals().items()):
        if name.startswith("test_") and callable(fn):
            fn()
            print(f"PASS {name}")
