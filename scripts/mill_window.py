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

# Non-chat tags the hf-inference router serves (measured 6 Sep: MiniLM
# similarity 200, bge feature-extraction 200, bert fill-mask 200). Chat
# mill 400s these. Counting a 200 as practice-mill is reachability, not a
# GSPC grade. writes_board stays false. n<30 stays unquotable.
FEATURE_TAGS = frozenset(
    {
        "feature-extraction",
        "image-feature-extraction",
        "text-ranking",
    }
)
SIMILARITY_TAGS = frozenset({"sentence-similarity"})
FILL_MASK_TAGS = frozenset({"fill-mask"})
TEXT_TAGS = frozenset(
    {
        "text-classification",
        "token-classification",
        "zero-shot-classification",
        "translation",
        "question-answering",
    }
)
ROUTER_TAGS = CHAT_TAGS | FEATURE_TAGS | SIMILARITY_TAGS | FILL_MASK_TAGS | TEXT_TAGS


def _unserved_weight_pack(slug: str) -> bool:
    """GPTQ/GGUF/FP8 400 on every router path. Do not treat *-base fill-mask
    (roberta-base, t5-base) as a weight pack — those are live hf-inference."""
    low = slug.lower()
    return any(m in low for m in UNSERVED_MARKERS)


def chat_capable_slugs(models: list[dict]) -> list[str]:
    """Preserve lock order. Skip tags and weight packs the chat mill cannot serve."""
    out: list[str] = []
    for m in models:
        slug = m.get("slug")
        if not slug:
            continue
        if _unserved_weight_pack(slug):
            continue
        name = slug.lower().rsplit("/", 1)[-1]
        if name.endswith("-base"):
            continue
        tag = m.get("pipeline_tag") or ""
        if tag in CHAT_TAGS:
            out.append(slug)
    return out


def route_kind(tag: str, slug: str = "") -> str:
    """Which Inference Providers path to hit. Pure. No HTTP."""
    if slug and _unserved_weight_pack(slug):
        # One hf-inference POST. Chat mill walks 9 providers on these
        # and they all 400 "not served". Record UNCHECKABLE, do not burn
        # the shard timeout.
        return "feature"
    t = tag or ""
    if t in CHAT_TAGS:
        return "chat"
    if t in SIMILARITY_TAGS:
        return "similarity"
    if t in FEATURE_TAGS:
        return "feature"
    if t in FILL_MASK_TAGS:
        return "fill-mask"
    if t in TEXT_TAGS:
        return "text"
    return "try-chat-then-feature"


def millable_slugs(models: list[dict]) -> list[str]:
    """UNMEASURED slugs that can 200. GGUF/GPTQ/FP8 stay out of the window
    (they 400 and ate the 34048153790 shards). roberta-base is millable."""
    skip = {
        m.get("slug")
        for m in models
        if m.get("slug") and (m.get("status") or "UNMEASURED") in ALREADY_TRIED
    }
    out: list[str] = []
    for m in models:
        slug = m.get("slug")
        if not slug or slug in skip:
            continue
        if _unserved_weight_pack(slug):
            continue
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


def mill_exit_for_window(n_lock_models: int, n_millable: int, n_window: int) -> int:
    """Empty window is not coverage success. Exhausted millable must not
    fail the cron (GitHub disables scheduled workflows after repeated red)."""
    if n_window > 0:
        return 0
    if n_lock_models > 0 and n_millable == 0:
        return 0
    return 1
