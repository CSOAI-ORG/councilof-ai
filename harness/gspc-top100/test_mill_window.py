"""Mill window honesty: never slugs[:limit] forever; window moves by hour.

Drives scripts/mill_window.py (the function mill_hf_inference.py calls).
Does not mill, does not HTTP, does not invent scores.
"""
from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2] / "scripts"))
from mill_window import select_window  # noqa: E402


def test_empty_fleet_empty_window() -> None:
    off, win = select_window([], 8, 1_780_000_000)
    assert off == 0
    assert win == []


def test_window_is_not_always_prefix() -> None:
    slugs = [f"m/{i}" for i in range(40)]
    # hour 0 *may* start at 0; a later hour must not be the prefix.
    _, w0 = select_window(slugs, 8, 0)
    _, w1 = select_window(slugs, 8, 3600)
    assert w1 != slugs[:8], "rotation must leave the first eight after one hour"
    assert w0 != w1, "logged window must change across hours"


def test_shards_partition_one_hour() -> None:
    slugs = [f"m/{i}" for i in range(2200)]
    seen: list[str] = []
    for shard in range(20):
        _, w = select_window(slugs, 30, 1_780_000_000, shard=shard, shards=20)
        assert len(w) == 30
        seen.extend(w)
    assert len(seen) == 600
    assert len(set(seen)) == 600, "shards in one hour must not overlap"


def test_wraps_without_inventing_slugs() -> None:
    slugs = ["a/x", "b/y", "c/z"]
    off, w = select_window(slugs, 8, 99_000)
    assert off < 3
    assert set(w) <= set(slugs)
    assert len(w) == 3


if __name__ == "__main__":
    test_empty_fleet_empty_window()
    test_window_is_not_always_prefix()
    test_shards_partition_one_hour()
    test_wraps_without_inventing_slugs()
    print("test_mill_window: 4 passed")
