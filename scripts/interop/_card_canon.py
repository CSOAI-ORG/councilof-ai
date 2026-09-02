"""Minimal card-v0 helpers for unsigned interop consumers. No keys. Never certify."""
from __future__ import annotations

import hashlib
import json
from typing import Any

SCHEMA = "https://councilof.ai/schema/card-v0.json"
PAYLOAD_CAP = 3072


def canonical_bytes(obj: Any) -> bytes:
    return json.dumps(obj, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode("utf-8")


def payload_sha256(payload: dict) -> str:
    raw = canonical_bytes(payload)
    if len(raw) > PAYLOAD_CAP:
        raise SystemExit(
            f"payload {len(raw)} bytes exceeds {PAYLOAD_CAP} card-v0 cap — shrink before emit"
        )
    return hashlib.sha256(raw).hexdigest()


def unsigned_card(
    *,
    surface: str,
    subject: str,
    as_of: str,
    source_urls: list[str],
    payload: dict,
    unmeasured: list[str],
    tags: list[str] | None = None,
) -> dict:
    card = {
        "schema": SCHEMA,
        "surface": surface,
        "subject": subject,
        "as_of": as_of,
        "source_urls": source_urls,
        "payload": payload,
        "sha256": payload_sha256(payload),
        "sig_ed25519": None,
        "unmeasured": unmeasured,
    }
    if tags is not None:
        card["tags"] = tags
    return card


def write_card(path, card: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(card, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
