"""Deterministic mill window. Pure: no HTTP, no token, no board.

The hourly mill used to take `slugs[:limit]` — the same first N models every
run. Rotation is (hour × shards × limit + shard × limit) mod n, wrapping.
Window must move across hours. Empty fleet yields an empty window.
"""
from __future__ import annotations


# Chat completions only. HF2200 is download-ranked mixed tasks; GGUF/embed/vision
# 400 on /v1/chat/completions. Filtering here is how a shard records practice-mill
# instead of UNCHECKABLE. n<30 stays unquotable. Not a board rewrite.
CHAT_TAGS = frozenset(
    {
        "text-generation",
        "image-text-to-text",
        "any-to-any",
        "text2text-generation",
    }
)


def chat_capable_slugs(models: list[dict]) -> list[str]:
    """Preserve lock order. Skip tags the chat mill cannot serve."""
    out: list[str] = []
    for m in models:
        slug = m.get("slug")
        if not slug:
            continue
        low = slug.lower()
        if low.endswith("-gguf") or ".gguf" in low or "-mlx-" in low or "/gguf" in low:
            continue
        tag = m.get("pipeline_tag") or ""
        if tag in CHAT_TAGS:
            out.append(slug)
    return out


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
