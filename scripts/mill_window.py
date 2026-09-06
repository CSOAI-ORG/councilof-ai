"""Deterministic mill window. Pure: no HTTP, no token, no board.

The hourly mill used to take `slugs[:limit]` — the same first N models every
run. Rotation is (hour × shards × limit + shard × limit) mod n, wrapping.
Window must move across hours. Empty fleet yields an empty window.
"""
from __future__ import annotations


def select_window(
    slugs: list[str],
    limit: int,
    epoch_s: float,
    shard: int = 0,
    shards: int = 1,
) -> tuple[int, list[str]]:
    n = len(slugs)
    if n == 0 or limit <= 0:
        return 0, []
    shards = max(int(shards), 1)
    shard = int(shard) % shards
    take = min(int(limit), n)
    hour = int(epoch_s) // 3600
    stride = take * shards
    offset = (hour * stride + shard * take) % n
    window = [slugs[(offset + i) % n] for i in range(take)]
    return offset, window
