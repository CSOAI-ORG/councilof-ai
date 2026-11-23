#!/usr/bin/env python3
"""Two-layer evidence-bundle freshness watch: full-set dates, not a 40-card preview.

The free API preview returns at most 40 SHA-ordered card summaries, even when
hundreds were selected. Treating that prefix's newest as the full-set newest can
falsely classify a fresh bundle as STALE. This monitor reads the API's additive
full-set freshness metadata and explicitly fails closed on unknown coverage.

No model score, legal determination, new signing, payment or benchmark admission.
"""
from __future__ import annotations

import json
import re
import sys
import urllib.request
from datetime import datetime, timezone

BUNDLES = ("article-50", "article-53", "dora", "cra")
ENDPOINT = "https://councilof.ai/api/evidence-bundle?obligation={ob}&preview=true"
FLOOR_DAYS = 14
MAX_RETURNED = 40
HEX64 = re.compile(r"^[0-9a-f]{64}$")


def read_bundle(ob: str) -> dict:
    req = urllib.request.Request(
        ENDPOINT.format(ob=ob), headers={"User-Agent": "csoai-bundle-freshness/0.2"}
    )
    with urllib.request.urlopen(req, timeout=30) as response:
        return json.load(response)


def parse_time(value: object) -> datetime | None:
    if not isinstance(value, str) or not value or len(value) > 50:
        return None
    try:
        parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
        return parsed.astimezone(timezone.utc) if parsed.tzinfo is not None else None
    except ValueError:
        return None


def assess_payload(ob: str, payload: object, now: datetime) -> dict:
    """Pure validator used by production observer and negative-control tests."""
    base = {"obligation": ob, "source": "public_free_preview",
            "scope": "source-declared signed-card relevance, not regulatory conformity",
            "independent_signature_verification": False}
    def unreadable(reason, **extra):
        return {**base, "state": "UNREADABLE", "reason": reason, **extra}

    if now.tzinfo is None:
        raise ValueError("now must carry a timezone")
    if not isinstance(payload, dict):
        return unreadable("INVALID_PAYLOAD")
    count = payload.get("relevant_signed_cards")
    cards = payload.get("cards")
    if type(count) is not int or count < 0 or not isinstance(cards, list):
        return unreadable("UNKNOWN_COUNT_OR_CARDS")
    if len(cards) > count or len(cards) > MAX_RETURNED:
        return unreadable("IMPOSSIBLE_PREVIEW_CARD_COUNT",
                          relevant=count, returned=len(cards))
    if count == 0:
        return {**base, "state": "EMPTY", "relevant": 0, "returned": 0,
                "timing_coverage": "EMPTY"}

    meta = payload.get("freshness")
    if meta is not None:
        if not isinstance(meta, dict) or (
            meta.get("scope") != "ALL_RELEVANT_SIGNED_CARDS"
            or meta.get("source_state") != "SOURCE_DECLARED_NOT_INDEPENDENTLY_VERIFIED"
            or type(meta.get("relevant_card_count")) is not int
            or meta.get("relevant_card_count") != count
            or type(meta.get("returned_card_count")) is not int
            or meta.get("returned_card_count") != len(cards)
            or meta.get("returned_card_count") != min(count, MAX_RETURNED)
            or type(meta.get("card_list_truncated")) is not bool
            or meta.get("card_list_truncated") != (count > MAX_RETURNED)
            or type(meta.get("dated_card_count")) is not int
            or not 0 <= meta["dated_card_count"] <= count
        ):
            return unreadable("INVALID_FULL_SET_METADATA", relevant=count, returned=len(cards))
        if meta.get("timing_coverage") != "COMPLETE" or meta["dated_card_count"] != count:
            return unreadable("INCOMPLETE_TIMESTAMP_COVERAGE", relevant=count,
                              dated=meta.get("dated_card_count"))
        newest = parse_time(meta.get("newest_relevant_card_as_of"))
        sha = meta.get("newest_relevant_card_sha256")
        if newest is None or not isinstance(sha, str) or not HEX64.fullmatch(sha):
            return unreadable("INVALID_NEWEST_CARD_ID_OR_TIME")
        # A selected newest ID that appears in the bounded preview must not
        # contradict its source-reported as_of. The rest needs independent replay.
        for card in cards:
            if not isinstance(card, dict):
                return unreadable("INVALID_CARD_SUMMARY")
            if card.get("sha256") == sha and parse_time(card.get("as_of")) != newest:
                return unreadable("NEWEST_CARD_CONTRADICTS_PREVIEW")
        source_of_time = "ALL_SELECTED_SOURCE_DECLARATION"
    else:
        # Backward-compatible legacy case: only FULL returned sets can establish
        # their newest date. A SHA-ordered 40-of-269 prefix is indeterminate.
        if len(cards) != count:
            return unreadable("TRUNCATED_PREVIEW_NO_FULL_SET_TIMESTAMP",
                              relevant=count, returned=len(cards))
        times = [parse_time(card.get("as_of")) if isinstance(card, dict) else None
                 for card in cards]
        if any(item is None for item in times):
            return unreadable("INCOMPLETE_LEGACY_CARD_TIMES", relevant=count)
        newest = max(times)
        source_of_time = "ALL_RETURNED_LEGACY_CARDS"

    age = (now.astimezone(timezone.utc) - newest).total_seconds() / 86400
    if age < 0:
        return unreadable("FUTURE_CARD_TIMESTAMP", relevant=count,
                          newest_as_of=newest.isoformat())
    return {**base, "state": "FRESH" if age <= FLOOR_DAYS else "STALE",
            "newest_as_of": newest.isoformat().replace("+00:00", "Z"),
            "age_days": round(age, 4), "relevant": count, "returned": len(cards),
            "timing_source": source_of_time,
            "timing_coverage": "COMPLETE",
            "not_independently_reverified": True}


def main() -> None:
    now = datetime.now(timezone.utc)
    findings = []
    exit_status = 0
    for ob in BUNDLES:
        try:
            record = assess_payload(ob, read_bundle(ob), now)
        except Exception as exc:
            record = {"obligation": ob, "state": "UNREADABLE",
                      "reason": "HTTP_OR_PARSE_FAILED",
                      "error_class": type(exc).__name__}
        if record["state"] == "UNREADABLE":
            exit_status = max(exit_status, 4)
        elif record["state"] == "STALE":
            exit_status = max(exit_status, 3)
        findings.append(record)
    print(json.dumps({"schema": "csoai.evidence-bundle-freshness/0.2",
                      "checked_at": now.isoformat(timespec="seconds"),
                      "floor_days": FLOOR_DAYS,
                      "findings": findings}, indent=1))
    sys.exit(exit_status)


if __name__ == "__main__":
    main()
