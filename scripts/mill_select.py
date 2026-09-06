#!/usr/bin/env python3
"""Pure mill window selection. No HTTP. Hour + limit + ordered slugs → window.

#1692 rotation: offset = hour * (limit * n_shards) so consecutive hours are
disjoint until the fleet wraps. Matrix shards take adjacent slices of that
hour-block, never 20 copies of slugs[:limit].
"""
from __future__ import annotations


def select_window(
    slugs: list[str],
    *,
    limit: int,
    hour: int,
    offset: int | None = None,
    shard: int = 0,
    n_shards: int = 1,
) -> tuple[list[str], int]:
    """Return (window, start_index). Empty slugs → ([], 0)."""
    n = len(slugs)
    if n == 0 or limit <= 0:
        return [], 0
    n_shards = max(int(n_shards), 1)
    shard = max(int(shard), 0) % n_shards
    block = int(limit) * n_shards
    if offset is None:
        start_block = (int(hour) * block) % n
    else:
        start_block = int(offset) % n
    start = (start_block + shard * int(limit)) % n
    window = [slugs[(start + i) % n] for i in range(min(int(limit), n))]
    return window, start


def classify_run(*, probe_ok: bool, n_measured_this_shard: int) -> dict:
    """A shard that measured nothing is not a coverage success.

    INFERENCE_FAIL may still be a cron-surviving *job* exit; coverage_success
    is the number summaries are allowed to treat as 'the mill ran'.
    """
    if not probe_ok:
        return {
            "coverage_success": False,
            "status": "INFERENCE_FAIL",
            "visible": True,
        }
    if n_measured_this_shard <= 0:
        return {
            "coverage_success": False,
            "status": "MEASURED_NOTHING",
            "visible": True,
        }
    return {
        "coverage_success": True,
        "status": "COVERAGE",
        "visible": True,
    }


def n_measured_from_lock(lock: dict) -> int:
    """Read coverage from the lock. Never type it in a summary."""
    if "n_measured" in lock and isinstance(lock["n_measured"], int):
        return lock["n_measured"]
    models = lock.get("models") or []
    return sum(1 for m in models if (m.get("status") or "UNMEASURED") not in ("UNMEASURED", "", None))
