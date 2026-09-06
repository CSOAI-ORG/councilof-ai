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

ALREADY_TRIED = frozenset({"practice-mill", "MEASURED"})

# Inference Providers router. hf-inference is one provider; 1445 of 1880
# UNCHECKABLE on 6 Sep were "Model not supported by provider hf-inference".
# Default order must not pin that provider.
DEFAULT_PROVIDERS = (
    "groq",
    "cerebras",
    "together",
    "fireworks-ai",
    "nscale",
    "novita",
    "featherless-ai",
    "deepinfra",
    "sambanova",
    "baseten",
)

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
# Chat mill last-fail (nebius / provider-or-policy) is not an embed miss.
NONCHAT_RETRY_TAGS = FEATURE_TAGS | SIMILARITY_TAGS | FILL_MASK_TAGS | TEXT_TAGS
CHAT_ROUTE_KINDS = frozenset({"", "chat", "try-chat-then-feature"})

# LoRA/image windows 400 on chat/embeddings (mill 34050320277 shard 15: 0/91).
# Drop them so remaining chat-like UNMEASURED get the slots.
SKIP_TAGS = frozenset(
    {
        "text-to-image",
        "image-to-image",
        "image-to-video",
        "text-to-video",
        "image-text-to-video",
        "image-classification",
        "zero-shot-image-classification",
    }
)


def _unserved_weight_pack(slug: str, *, include_base: bool = True) -> bool:
    low = slug.lower()
    if any(m in low for m in UNSERVED_MARKERS):
        return True
    if not include_base:
        return False
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


def live_providers(mapping) -> list[str]:
    """Parse Hub inferenceProviderMapping (dict or list). Pure. No HTTP.

    Dict keys are provider ids (together, featherless-ai). `providerId` is
    the model id on that provider — not a provider name.
    """
    out: list[str] = []
    if isinstance(mapping, dict):
        items = mapping.items()
        for key, info in items:
            if not isinstance(info, dict):
                continue
            if (info.get("status") or "").lower() != "live":
                continue
            name = info.get("provider") or key
            if "/" in str(name):
                name = key
            if name and name not in out:
                out.append(str(name))
        return out
    if isinstance(mapping, list):
        for info in mapping:
            if not isinstance(info, dict):
                continue
            if (info.get("status") or "").lower() != "live":
                continue
            name = info.get("provider") or info.get("providerId") or ""
            if name and "/" not in str(name) and name not in out:
                out.append(str(name))
    return out


def provider_order(mapped: list[str], defaults: list[str] | tuple[str, ...] = DEFAULT_PROVIDERS) -> list[str]:
    """Other live providers first. Never default to hf-inference.
    If mapping is only hf-inference, fall through to DEFAULT_PROVIDERS."""
    others = [p for p in (mapped or []) if p and p != "hf-inference"]
    base = [p for p in defaults if p and p != "hf-inference"]
    if others:
        rest = [p for p in base if p not in others]
        return others + rest
    return base


def resolve_route(
    lock_tag: str, hub_tag: str, lock_status: str, slug: str = ""
) -> tuple[str, str]:
    """Pick pipeline_tag + route_kind. Pure. No HTTP.

    Empty lock tags are re-probed on Hub. If Hub fills a chat tag on a row
    the chat mill already marked UNCHECKABLE, do not spray groq/nebius again.
    """
    lock_tag = (lock_tag or "").strip()
    hub_tag = (hub_tag or "").strip()
    # millable decided from the lock tag. Hub must not retag MiniLM as chat.
    tag = lock_tag or hub_tag
    kind = route_kind(tag, slug)
    if (lock_status or "") == "UNCHECKABLE" and not lock_tag and kind == "chat":
        return tag, "try-chat-then-feature"
    return tag, kind


def mill_names_for_kind(
    slug: str,
    kind: str,
    mapped: list[str] | None = None,
    defaults: list[str] | tuple[str, ...] = DEFAULT_PROVIDERS,
) -> list[str]:
    """Which router model names to try. Pure. No HTTP.

    Chat: bare slug then defaults (never hf-inference first).
    Pass defaults=() for an UNCHECKABLE retry so an empty Hub mapping
    is the bare slug only — DEFAULT spray is what wrote 1311 nebius 400s.
    Non-chat: bare slug then hf-inference — MiniLM/bge/bert 200s on that path.
    """
    mapped = list(mapped or [])
    if kind == "chat":
        order = provider_order(mapped, defaults)
        return [slug] + [f"{slug}:{p}" for p in order]
    names = [slug, f"{slug}:hf-inference"]
    for p in mapped:
        if not p or p == "hf-inference":
            continue
        n = f"{slug}:{p}"
        if n not in names:
            names.append(n)
    return names


def mill_router_names(
    slug: str,
    kind: str,
    mapped: list[str] | None,
    *,
    uncheckable: bool = False,
) -> list[str]:
    """HTTP mill names. Empty list means do not call the router.

    Uncheckable chat + empty mapping: the bare slug. Hub [] is not a 400.
    Uncheckable + mapped: mapped suffixes only (do not respray hf-inference).
    """
    mapped = [p for p in (mapped or []) if p and p != "nebius"]
    if uncheckable:
        if mapped:
            return [f"{slug}:{p}" for p in mapped if p != "hf-inference"]
        if kind == "chat":
            return [slug]
        return []
    return mill_names_for_kind(slug, kind, mapped)


def millable_slugs(models: list[dict]) -> list[str]:
    """UNMEASURED, plus UNCHECKABLE that still have a 200-route.

    millable=0 is not thousands coverage. Hub live mapping is the route.
    A probed-empty mapping must not respray known-unsupported 400s.
    practice-mill / MEASURED stay out. A green tick is not evidence.
    """
    out: list[str] = []
    for m in models:
        slug = m.get("slug")
        if not slug:
            continue
        st = m.get("status") or "UNMEASURED"
        tag = m.get("pipeline_tag") or ""
        live_now = [p for p in (m.get("providers_live") or []) if p]
        # SKIP_TAGS drops LoRA windows. Original HF2200 rows that Hub still
        # lists on a live provider must mill even if the tag is image/ASR.
        if tag in SKIP_TAGS and not (st == "UNCHECKABLE" and live_now):
            continue
        if st in ALREADY_TRIED:
            continue
        if st == "UNMEASURED" and m.get("unmeasured_reason") == "no live Inference Provider":
            continue
        if st == "UNCHECKABLE":
            reason = (m.get("reason") or "").lower()
            if "429" in reason:
                out.append(slug)
                continue
            last_kind = m.get("route_kind") or ""
            probed = "providers_live" in m
            live_list = [p for p in (m.get("providers_live") or []) if p] if probed else None
            if probed and live_list:
                if last_kind.endswith("-mapped"):
                    continue
                if _unserved_weight_pack(slug, include_base=False):
                    continue
                out.append(slug)
                continue
            if probed and not live_list:
                # Hub [] is not a router 400. Chat-like mill the bare slug
                # unless chat-bare / *-mapped already ran. GGUF/quant packs
                # are not a chat 200-route.
                if _unserved_weight_pack(slug, include_base=False):
                    continue
                if tag in CHAT_TAGS and last_kind not in ("chat-bare",) and not last_kind.endswith("-mapped"):
                    out.append(slug)
                continue
            # Not Hub-probed: millable so mill can GET live mapping.
            # HTTP mill runs only if mill_router_names is nonempty.
            # -base is a chat-mill miss, not a Hub-probe skip (ModernBERT-base).
            if _unserved_weight_pack(slug, include_base=False):
                continue
            out.append(slug)
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


def mill_exit_for_window(
    n_lock_models: int, n_millable: int, n_window: int, start: int = 0
) -> int:
    """Empty window is not coverage success. Exhausted millable must not
    fail the cron (GitHub disables scheduled workflows after repeated red).
    A remainder shard whose start is past millable is also not MILL_EMPTY —
    34058589553 mill (19) went red on start=285 of 285."""
    if n_window > 0:
        return 0
    if n_lock_models > 0 and n_millable == 0:
        return 0
    if n_millable > 0 and start >= n_millable:
        return 0
    return 1
