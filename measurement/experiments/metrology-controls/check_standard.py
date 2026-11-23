#!/usr/bin/env python3
"""Read-only calibration-control pilot: check standards, Shewhart, and two-sided CUSUM.

This does NOT measure a nuclear plant or a model's safety, independently verify
an instrument, execute an intervention, sign a record, or change GSPC status.
"""
from __future__ import annotations

import argparse
from datetime import datetime, timezone
import hashlib
import json
import math
import re
import sys

SCHEMA = "csoai.metrology-check-standard/0.1"
DIGEST = re.compile(r"^[0-9a-f]{64}$")


class Uncheckable(ValueError):
    pass


def utc(s: str) -> datetime:
    if not isinstance(s, str) or not s.endswith("Z"):
        raise Uncheckable("TIME_NOT_EXPLICIT_UTC")
    try:
        result = datetime.fromisoformat(s[:-1] + "+00:00")
    except ValueError as exc:
        raise Uncheckable("INVALID_TIMESTAMP") from exc
    if result.utcoffset().total_seconds() != 0:
        raise Uncheckable("TIME_NOT_UTC")
    return result


def number(value: object, name: str, *, positive: bool = False) -> float:
    if isinstance(value, bool) or not isinstance(value, (float, int)) or not math.isfinite(value):
        raise Uncheckable("INVALID_" + name.upper())
    if positive and value <= 0:
        raise Uncheckable("INVALID_" + name.upper())
    return float(value)


def digest(obj: object) -> str:
    return hashlib.sha256(
        json.dumps(obj, sort_keys=True, separators=(",", ":"), ensure_ascii=False, allow_nan=False).encode("utf-8")
    ).hexdigest()


def assess(payload: object, now_iso: str) -> dict:
    """Fail closed on all missing, future, repeated or non-traceable readings.

    CUSUM tuning is illustrative, NOT a calibrated false-alarm rate. Input
    hashes provide integrity identifiers, not signatures or independent custody.
    """
    try:
        now = utc(now_iso)
        if not isinstance(payload, dict) or payload.get("schema") != SCHEMA:
            raise Uncheckable("WRONG_SCHEMA")
        required = {
            "schema", "instrument_id", "measurand", "check_standard_id",
            "baseline_ref_sha256", "calibrated_from", "calibrated_until",
            "reference_value", "baseline_sigma", "cusum_k_sigma",
            "cusum_h_sigma", "shewhart_limit_sigma", "max_sample_gap_seconds",
            "max_observation_age_seconds", "max_source_lag_seconds",
            "samples",
        }
        if set(payload) != required:
            raise Uncheckable("MISSING_OR_EXTRA_FIELDS")
        for field in ("instrument_id", "measurand", "check_standard_id"):
            value = payload[field]
            if not isinstance(value, str) or not 1 <= len(value) <= 128:
                raise Uncheckable("INVALID_" + field.upper())
        if not isinstance(payload["baseline_ref_sha256"], str) or not DIGEST.fullmatch(payload["baseline_ref_sha256"]):
            raise Uncheckable("UNPINNED_BASELINE")
        start = utc(payload["calibrated_from"])
        end = utc(payload["calibrated_until"])
        if not start < end or end < now:
            raise Uncheckable("EXPIRED_OR_INVALID_CALIBRATION")
        mu = number(payload["reference_value"], "reference_value")
        sigma = number(payload["baseline_sigma"], "baseline_sigma", positive=True)
        k = number(payload["cusum_k_sigma"], "cusum_k_sigma", positive=True)
        h = number(payload["cusum_h_sigma"], "cusum_h_sigma", positive=True)
        limit = number(payload["shewhart_limit_sigma"], "shewhart_limit_sigma", positive=True)
        gap = number(payload["max_sample_gap_seconds"], "max_sample_gap_seconds", positive=True)
        max_age = number(payload["max_observation_age_seconds"], "max_observation_age_seconds", positive=True)
        max_lag = number(payload["max_source_lag_seconds"], "max_source_lag_seconds", positive=True)
        if not 0 < k < h or h > 100 or limit > 100 or max(gap, max_age, max_lag) > 86400 * 31:
            raise Uncheckable("INVALID_CONTROL_SETTINGS")
        samples = payload["samples"]
        if not isinstance(samples, list) or not 5 <= len(samples) <= 50000:
            raise Uncheckable("INVALID_SAMPLE_COUNT")
        last_measured = None
        last_observed = None
        seen_ids, seen_sources = set(), set()
        values = []
        for i, sample in enumerate(samples):
            if not isinstance(sample, dict) or set(sample) != {
                "measurement_id", "measured_at", "observed_at", "value", "source_sha256"
            }:
                raise Uncheckable("INVALID_SAMPLE_SHAPE")
            m_id, source = sample["measurement_id"], sample["source_sha256"]
            if not isinstance(m_id, str) or not m_id or len(m_id) > 128 or m_id in seen_ids:
                raise Uncheckable("DUPLICATE_OR_INVALID_MEASUREMENT_ID")
            if not isinstance(source, str) or not DIGEST.fullmatch(source) or source in seen_sources:
                raise Uncheckable("REPLAYED_OR_UNPINNED_SOURCE")
            measured, observed = utc(sample["measured_at"]), utc(sample["observed_at"])
            if measured < start or measured > observed or observed > now:
                raise Uncheckable("BAD_MEASUREMENT_OBSERVATION_CLOCK")
            if (observed - measured).total_seconds() > max_lag:
                raise Uncheckable("EXCESSIVE_SOURCE_TO_OBSERVER_LAG")
            if last_measured is not None and (measured <= last_measured or observed < last_observed):
                raise Uncheckable("NONMONOTONE_CLOCK")
            if last_measured is not None and (measured - last_measured).total_seconds() > gap:
                raise Uncheckable("MISSING_MEASUREMENT_WINDOW")
            val = number(sample["value"], "sample_value")
            values.append(val)
            last_measured, last_observed = measured, observed
            seen_ids.add(m_id)
            seen_sources.add(source)
        if (now - last_observed).total_seconds() > max_age:
            raise Uncheckable("STALE_LAST_OBSERVATION")
        # This only evaluates an externally pinned reference/check standard.
        # Do not estimate mu or sigma on the same evaluated stream.
        positive, negative = 0.0, 0.0
        signals = []
        for i, value in enumerate(values):
            z = (value - mu) / sigma
            positive = max(0.0, positive + z - k)
            negative = max(0.0, negative - z - k)
            reasons = []
            if abs(z) >= limit:
                reasons.append("SHEWHART_SINGLE_READING")
            if positive >= h:
                reasons.append("CUSUM_UPWARD_SHIFT")
            if negative >= h:
                reasons.append("CUSUM_DOWNWARD_SHIFT")
            if reasons:
                signals.append({
                    "measurement_id": samples[i]["measurement_id"],
                    "sample_index": i,
                    "z_from_reference": round(z, 8),
                    "reasons": reasons,
                })
        result = {
            "schema": "csoai.metrology-check-result/0.1",
            "state": "ALARM" if signals else "STABLE_ON_CHECK_STANDARD",
            "evidence_state": "READ_ONLY_SOURCE_DECLARED_CONTROL",
            "source_sha256": digest(payload),
            "instrument_id": payload["instrument_id"],
            "measurand": payload["measurand"],
            "baseline_ref_sha256": payload["baseline_ref_sha256"],
            "count": len(samples),
            "measured_at_last": samples[-1]["measured_at"],
            "observed_at_last": samples[-1]["observed_at"],
            "signals": signals,
            "limits": {"reference_value": mu, "baseline_sigma": sigma,
                       "cusum_k_sigma": k, "cusum_h_sigma": h, "shewhart_limit_sigma": limit},
            "response": "HUMAN_REVIEW_ONLY" if signals else "NO_AUTOMATED_ACTION",
            "independent_calibration_verified": False,
            "source_signatures_verified": False,
            "false_alarm_rate_established": False,
            "real_world_safety_certified": False,
        }
        return result
    except (Uncheckable, KeyError, TypeError, OverflowError, ValueError) as exc:
        return {"schema": "csoai.metrology-check-result/0.1",
                "state": "UNCHECKABLE",
                "reason": str(exc) if isinstance(exc, Uncheckable) else "MALFORMED_INPUT",
                "response": "NO_AUTOMATED_ACTION",
                "real_world_safety_certified": False}


def main(argv=None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--input", required=True, help="Local check-standard input JSON only")
    parser.add_argument("--now", required=True, help="Explicit UTC observation cut-off (e.g. 2026-11-23T09:00:00Z)")
    args = parser.parse_args(argv)
    try:
        with open(args.input, "r", encoding="utf-8") as stream:
            data = json.load(stream)
        result = assess(data, args.now)
    except (ValueError, OSError) as exc:
        result = {"schema": "csoai.metrology-check-result/0.1",
                  "state": "UNCHECKABLE", "reason": "UNREADABLE_INPUT",
                  "response": "NO_AUTOMATED_ACTION",
                  "real_world_safety_certified": False}
    print(json.dumps(result, sort_keys=True, indent=2, allow_nan=False))
    return {"STABLE_ON_CHECK_STANDARD": 0, "ALARM": 3, "UNCHECKABLE": 4}[result["state"]]


if __name__ == "__main__":
    sys.exit(main())
