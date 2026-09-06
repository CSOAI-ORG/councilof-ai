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

# Measured 6 Sep 2026 mill (0): these weight packs 400 "not served" / "not a chat"
# on router.huggingface.co/v1/chat/completions. Leaving them in the window
# burns ~400 of 600 hourly slots as UNCHECKABLE.
UNSERVED_MARKERS = (
    "gptq",
    "awq",
    "nvfp4",
    "exl2",
    "-gguf",
    ".gguf",
    "/gguf",
    "gguf",
    "-mlx",
    "mlx-",
    "-fp8",
    "fp8-",
    "fp8",
    "-int4",
    "-int8",
    "qat-w4a16",
    "w4a16",
    "-bnb",
    "bnb-",
)

ALREADY_TRIED = frozenset({"practice-mill", "MEASURED", "UNCHECKABLE"})


def _unserved_weight_pack(slug: str) -> bool:
    low = slug.lower()
    if any(m in low for m in UNSERVED_MARKERS):
        return True
    name = low.rsplit("/", 1)[-1]
    return name.endswith("-base")


def chat_capable_slugs(models: list[dict]) -> list[str]:
    """Preserve lock order. Skip tags and weight packs the chat mill cannot serve."""
    out: list[str] = []
    for m in models:
        slug = m.get("slug")
        if not slug:
            continue
        if _unserved_weight_pack(slug):
            continue
        tag = m.get("pipeline_tag") or ""
        if tag in CHAT_TAGS:
            out.append(slug)
    return out


def millable_slugs(models: list[dict]) -> list[str]:
    """Chat-capable, not a weight pack the router 400s, not already tried."""
    skip = {
        m.get("slug")
        for m in models
        if m.get("slug") and (m.get("status") or "UNMEASURED") in ALREADY_TRIED
    }
    return [s for s in chat_capable_slugs(models) if s not in skip]


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
    if take * shards > n:
        take = max(1, (n + shards - 1) // shards)
    hour = int(epoch_s) // 3600
    stride = min(take * shards, n)
    rot = (hour * stride) % n
    rotated = slugs[rot:] + slugs[:rot]
    start = shard * take
    if start >= n:
        return start, []
    window = rotated[start : start + take]
    return start, window
