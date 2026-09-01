"""Join frozen top-100 HF ids to VALID cards by exact colon/dash identity.

A Hub id is MEASURED only when a card.model is the same checkpoint after
normalising `/`, `:`, `_` to `-`. Substring matches are forbidden: Qwen2.5-0.5B
is not Qwen2.5-0.5B-Instruct; DeepSeek-R1 is not deepseek-r1:8b.
"""
from __future__ import annotations

from typing import Any


def identity_key(name: str) -> str:
    s = (name or "").strip().lower()
    if "/" in s:
        s = s.rsplit("/", 1)[-1]
    return s.replace(":", "-").replace("_", "-")


def index_cards_by_identity(cards: list[dict[str, Any]]) -> dict[str, list[dict[str, Any]]]:
    out: dict[str, list[dict[str, Any]]] = {}
    for card in cards:
        key = identity_key(str(card.get("model") or ""))
        if not key:
            continue
        out.setdefault(key, []).append(card)
    return out


def join_model(hf_model_id: str, cards_by_key: dict[str, list[dict[str, Any]]]) -> list[dict[str, Any]]:
    """Return cards whose identity_key equals the Hub id's identity_key. Never substring."""
    key = identity_key(hf_model_id)
    if not key:
        return []
    return list(cards_by_key.get(key) or [])
