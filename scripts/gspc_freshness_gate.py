#!/usr/bin/env python3
"""Fail-closed freshness evaluation for structured GSPC measurement time."""
from __future__ import annotations

import argparse
import json
from datetime import datetime, time, timezone
from pathlib import Path
from typing import Any


def parse_instant(value: str) -> datetime:
    text = value.strip()
    if text.endswith("Z"):
        text = text[:-1] + "+00:00"
    dt = datetime.fromisoformat(text)
    if dt.tzinfo is None:
        raise ValueError("timestamp must include timezone")
    return dt.astimezone(timezone.utc)


def result(state: str, admit: bool, reason: str, **extra: Any) -> dict[str, Any]:
    return {"state": state, "admit_current": admit, "reason": reason, **extra}


def evaluate_measurement_time(
    mt: dict[str, Any], *, now: str | datetime, max_age_seconds: int
) -> dict[str, Any]:
    if max_age_seconds < 0:
        raise ValueError("max_age_seconds must be >= 0")
    clock = parse_instant(now) if isinstance(now, str) else now.astimezone(timezone.utc)
    state = mt.get("state")

    try:
        if state == "EXACT":
            observed = parse_instant(mt["observed_at"])
            age = int((clock - observed).total_seconds())
            if age < 0:
                return result("UNCHECKABLE", False, "MEASUREMENT_IN_FUTURE", age_seconds=age)
            if age > max_age_seconds:
                return result("STALE", False, "AGE_EXCEEDS_BOUND", age_seconds=age)
            return result("FRESH", True, "WITHIN_BOUND", age_seconds=age)

        if state == "DAY":
            day = datetime.strptime(mt["observed_on"], "%Y-%m-%d").date()
            start = datetime.combine(day, time.min, tzinfo=timezone.utc)
            end = datetime.combine(day, time.max, tzinfo=timezone.utc)
            youngest_age = int((clock - end).total_seconds())
            oldest_age = int((clock - start).total_seconds())
            if oldest_age < 0:
                return result("UNCHECKABLE", False, "MEASUREMENT_DAY_IN_FUTURE")
            if youngest_age > max_age_seconds:
                return result(
                    "STALE",
                    False,
                    "WHOLE_DAY_OLDER_THAN_BOUND",
                    age_seconds_min=youngest_age,
                    age_seconds_max=oldest_age,
                )
            if oldest_age <= max_age_seconds:
                return result(
                    "FRESH",
                    True,
                    "WHOLE_DAY_WITHIN_BOUND",
                    age_seconds_min=max(0, youngest_age),
                    age_seconds_max=oldest_age,
                )
            return result(
                "UNCHECKABLE",
                False,
                "BOUND_CROSSES_DAY_PRECISION",
                age_seconds_min=max(0, youngest_age),
                age_seconds_max=oldest_age,
            )

        if state == "NOT_AFTER":
            upper = parse_instant(mt["not_after"])
            minimum_age = int((clock - upper).total_seconds())
            if minimum_age < 0:
                return result("UNCHECKABLE", False, "UPPER_BOUND_IN_FUTURE")
            if minimum_age > max_age_seconds:
                return result(
                    "STALE",
                    False,
                    "UPPER_BOUND_ALREADY_OLDER_THAN_BOUND",
                    age_seconds_min=minimum_age,
                )
            return result(
                "UNCHECKABLE",
                False,
                "UPPER_BOUND_CANNOT_PROVE_FRESH",
                age_seconds_min=minimum_age,
            )

        return result("UNCHECKABLE", False, "MEASUREMENT_TIME_UNCHECKABLE")
    except (KeyError, TypeError, ValueError) as exc:
        return result(
            "UNCHECKABLE",
            False,
            "INVALID_MEASUREMENT_TIME",
            detail=str(exc),
        )


def evaluate_axis(
    record: dict[str, Any], *, now: str | datetime, max_age_seconds: int
) -> dict[str, Any]:
    if record.get("status") != "MEASURED":
        return result(
            "NOT_MEASURED",
            False,
            "AXIS_NOT_MEASURED",
            axis=record.get("axis"),
        )
    mt = record.get("measurement_time")
    if not isinstance(mt, dict):
        return result(
            "UNCHECKABLE",
            False,
            "MISSING_MEASUREMENT_TIME",
            axis=record.get("axis"),
        )
    out = evaluate_measurement_time(
        mt, now=now, max_age_seconds=max_age_seconds
    )
    out["axis"] = record.get("axis")
    return out


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--input", required=True)
    ap.add_argument("--now")
    ap.add_argument("--max-age-seconds", type=int)
    ap.add_argument("--check-expected", action="store_true")
    args = ap.parse_args()

    case = json.loads(Path(args.input).read_text())
    record = case.get("record", case)
    now = args.now or case.get("now")
    bound = args.max_age_seconds if args.max_age_seconds is not None else case.get("max_age_seconds")
    if now is None or bound is None:
        ap.error("now and max age are required")

    out = evaluate_axis(record, now=now, max_age_seconds=int(bound))
    print(json.dumps(out, sort_keys=True, separators=(",", ":")))

    if not args.check_expected:
        return 0
    expected = case.get("expected")
    if not isinstance(expected, dict):
        return 2
    return 0 if all(out.get(key) == value for key, value in expected.items()) else 1


if __name__ == "__main__":
    raise SystemExit(main())
