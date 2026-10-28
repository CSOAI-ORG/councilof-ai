#!/usr/bin/env python3
"""Fail-closed validation for the four admitted 2026-10-24 subject observations.

This validates frozen bytes, reader identity, timestamps, independent observation
counts and claim-wave controls. It does not assign a score, grade or certification.
"""
from __future__ import annotations

import hashlib
import json
from datetime import datetime
from pathlib import Path
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parents[2]
DATA = ROOT / "public/measurement/subject-axes/2026-10-24"
MIN_N = 30
EXPECTED_TOTAL = 183

AXES = {
    "lab-practice": {
        "artifact": "lab-practice.json",
        "sha256": "7f3c3c9843b8f6451e925e326dfef24ffd3c328e5e1d19cdb25efa7d0f0c34cb",
        "reader": "discovery_grid.py",
        "reader_sha256": "6baad383eb97b0984ce23adbc11668074ae77410d72690029376da61b75bd6ea",
        "observed_at": "2026-10-24T04:25:38Z",
        "time_field": "checked_at",
        "n": 38,
    },
    "measurer-integrity": {
        "artifact": "measurer-integrity.json",
        "sha256": "7e176bbbdc3ed56041bd2ff499f5cd6e897d9b6762492745c3ac90419cc91820",
        "reader": "build_all_10_subject_axes_and_wave1.py",
        "reader_sha256": "abf75559b18fee62e1fa14522b1b3570d36b240710648686ac1d7ba9351171b1",
        "observed_at": "2026-10-24T06:25:37.853297+00:00",
        "time_field": "observed_at",
        "n": 40,
    },
    "regulator-transparency": {
        "artifact": "regulator-transparency.json",
        "sha256": "eb7d23d861fc6151f7b6ebb77e173bc70e22d4d5d76f7f062fcd0d41106d8b23",
        "reader": "expand_regulator_and_company_grid.py",
        "reader_sha256": "acd839bbb2cdc6744290a1fcb8231f9ec4f37a87129b6ae9f3c21ac42c835eda",
        "observed_at": "2026-10-24T04:59:57Z",
        "time_field": "checked_at",
        "n": 38,
    },
    "claim-maintenance": {
        "artifact": "claim-maintenance-wave-2.json",
        "sha256": "d289d060e6276762ce2198606b7362d59eac3a2584db3853cf0c419159578c99",
        "reader": "claim_maintenance_reread.py",
        "reader_sha256": "d777f8a022f8bf78f0f76a5508693923c2577a493209c2ed35a445f8b0a71269",
        "observed_at": "2026-10-28T09:28:40.753966+00:00",
        "time_field": "observed_at",
        "n": 67,
    },
}
BASELINE_SHA256 = "f7a7feb2f30194880e545546bfb3405015970b66d7d25d4d8f791e85fafa9e6e"


def require(condition: bool, message: str) -> None:
    if not condition:
        raise ValueError(message)


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def load(name: str) -> dict:
    value = json.loads((DATA / name).read_text(encoding="utf-8"))
    require(isinstance(value, dict), f"{name}: top level must be an object")
    return value


def valid_url(value: object) -> bool:
    if not isinstance(value, str):
        return False
    parsed = urlparse(value)
    return parsed.scheme in {"http", "https"} and bool(parsed.netloc)


def unique_urls(rows: list[dict], label: str) -> None:
    urls = [row.get("url") for row in rows]
    require(all(valid_url(url) for url in urls), f"{label}: invalid observation URL")
    require(len(set(urls)) == len(urls), f"{label}: duplicate admitted URL")


def parse_time(value: str) -> datetime:
    return datetime.fromisoformat(value.replace("Z", "+00:00"))


def validate_claim_wave(document: dict) -> int:
    import importlib.util

    capture_limit = 3_000_000
    baseline_path = DATA / "claim-maintenance-baseline.json"
    require(sha256(baseline_path) == BASELINE_SHA256, "claim baseline digest changed")
    baseline = load("claim-maintenance-baseline.json")
    require(document.get("schema") == "csoai.claim-maintenance-wave/1.1", "unsupported claim-wave schema")
    require(document.get("baseline_sha256") == BASELINE_SHA256, "wave does not pin the frozen baseline")
    require(document.get("baseline_reader_sha256") == AXES["lab-practice"]["reader_sha256"], "wave does not pin the baseline reader")
    require(baseline.get("reader_sha256") == document.get("baseline_reader_sha256"), "baseline reader mismatch")
    require(document.get("baseline_capture_limit_bytes") == capture_limit, "wrong baseline capture limit")
    require(document.get("observed_capture_limit_bytes") == capture_limit, "wrong re-read capture limit")
    require(parse_time(baseline["captured_at"]) < parse_time(document["observed_at"]), "baseline must predate re-read")
    superseded = document.get("supersedes", {})
    require(superseded.get("artifact") == "claim-maintenance-wave-1.json", "claim wave does not identify its superseded raw record")
    require(sha256(DATA / superseded["artifact"]) == superseded.get("sha256"), "superseded raw claim record digest changed")

    reader_spec = importlib.util.spec_from_file_location("claim_maintenance_reread", DATA / AXES["claim-maintenance"]["reader"])
    require(reader_spec is not None and reader_spec.loader is not None, "cannot load claim comparator")
    reader = importlib.util.module_from_spec(reader_spec)
    reader_spec.loader.exec_module(reader)
    classify_claim = reader.classify_claim

    baseline_rows: dict[str, list[dict]] = {}
    for row in baseline["subjects"]:
        baseline_rows.setdefault(row["url"], []).append(row)
    baseline_duplicates = [url for url, rows in baseline_rows.items() if len(rows) > 1]
    require(baseline_duplicates == ["https://aws.amazon.com/ai/responsible-ai/"], "unexpected duplicate baseline URL")

    records = document["records"]
    excluded = [row for row in records if row.get("outcome") == "baseline_captured"]
    comparisons = [row for row in records if row.get("outcome") != "baseline_captured"]
    require(len(excluded) == 8, "exactly eight first-time baseline captures must be excluded")
    un_baselined = [row for row in comparisons if row.get("url") not in baseline_rows]
    require(len(un_baselined) == 1, "exactly one un-baselined row must be excluded")
    require(
        un_baselined[0].get("url") == "https://github.com/osaia/safe-spec"
        and un_baselined[0].get("baseline_sha256") is None
        and un_baselined[0].get("outcome") == "withdrawn"
        and un_baselined[0].get("http_status") == 404,
        "unexpected un-baselined claim row",
    )

    # One URL can occur under two subject labels. It is one independent observation.
    # Duplicate rows must agree on outcome and transport status and are counted once.
    by_url: dict[str, dict] = {}
    comparison_fields = ("outcome", "http_status")
    for row in comparisons:
        url = row.get("url")
        require(valid_url(url), "claim comparison has an invalid URL")
        if url not in baseline_rows:
            continue
        expected_digests = {baseline_row["sha256"] for baseline_row in baseline_rows[url]}
        require(row.get("baseline_sha256") in expected_digests, f"baseline row mismatch: {url}")
        if url in by_url:
            require(all(by_url[url].get(k) == row.get(k) for k in comparison_fields), f"conflicting duplicate comparison: {url}")
        else:
            by_url[url] = row

    admitted = list(by_url.values())
    unique_urls(admitted, "claim-maintenance")
    require(len(admitted) >= MIN_N, "claim-maintenance is below the independent n>=30 gate")
    for row in admitted:
        outcome = row.get("outcome")
        require(outcome in {"unchanged", "changed", "withdrawn", "unreachable"}, f"unknown claim outcome: {outcome}")
        before, after = row.get("baseline_sha256"), row.get("observed_sha256")
        require(row.get("baseline_capture_limit_bytes") == capture_limit, "admitted row has the wrong baseline capture limit")
        require(row.get("observed_capture_limit_bytes") == capture_limit, "admitted row has the wrong re-read capture limit")
        require(classify_claim(before, row.get("http_status"), after) == outcome, "claim outcome does not come from the pinned comparator")
        if outcome == "unchanged":
            require(before == after, "unchanged claim digests differ")
        elif outcome == "changed":
            require(before != after, "changed claim digests are identical")
            require(row.get("human_adjudication_state") == "PENDING_HUMAN_REVIEW", "changed claim lacks human review state")
        elif outcome == "withdrawn":
            require(row.get("human_adjudication_state") == "PENDING_HUMAN_REVIEW", "withdrawn claim lacks human review state")

    control = document.get("negative_control", {})
    require(control.get("result") == "DISCRIMINATING", "claim negative control did not discriminate")
    require(control.get("expected") == control.get("got") == "DIVERGENT", "claim negative-control expectation mismatch")
    require(control.get("original_sha256") != control.get("tampered_sha256"), "claim negative control did not change the digest")
    control_outcome = classify_claim(control.get("baseline_sha256"), 200, control.get("tampered_sha256"))
    require(control_outcome == "changed", "pinned comparator did not detect the tampered claim")
    require(control.get("tampered_outcome") == control_outcome, "negative control bypassed the pinned comparator")
    return len(admitted)


def main() -> None:
    results = []
    for axis, spec in AXES.items():
        artifact_path = DATA / spec["artifact"]
        reader_path = DATA / spec["reader"]
        require(sha256(artifact_path) == spec["sha256"], f"{axis}: artifact digest changed")
        require(sha256(reader_path) == spec["reader_sha256"], f"{axis}: reader digest changed")
        document = load(spec["artifact"])
        require(document.get("axis") == axis, f"{axis}: artifact axis mismatch")
        require(document.get(spec["time_field"]) == spec["observed_at"], f"{axis}: observation timestamp changed")

        if axis == "claim-maintenance":
            n = validate_claim_wave(document)
        else:
            rows = document["rows"]
            if axis == "measurer-integrity":
                admitted = [row for row in rows if row.get("reachable") is True and row.get("http_status") == 200]
                require(document.get("meets_n30_gate") is True, f"{axis}: n gate not met")
            else:
                admitted = [row for row in rows if row.get("status") == 200 and not row.get("error")]
            unique_urls(admitted, axis)
            require(len(admitted) >= MIN_N, f"{axis}: below the independent n>=30 gate")
            require(document.get("n_reachable") == len(admitted), f"{axis}: reachable count mismatch")
            n = len(admitted)

        require(n == spec["n"], f"{axis}: expected {spec['n']} independent observations, got {n}")
        results.append({
            "axis": axis,
            "n": n,
            "artifact_sha256": spec["sha256"],
            "reader_sha256": spec["reader_sha256"],
            "observed_at": spec["observed_at"],
            "run_attestation": "CONTENT_ADDRESSED_UNSIGNED",
        })

    total = sum(row["n"] for row in results)
    require(total == EXPECTED_TOTAL, f"expected {EXPECTED_TOTAL} total observations, got {total}")
    print(json.dumps({
        "state": "VALID",
        "authority_state": "measurement_only_not_a_certification",
        "axes": results,
        "total_comparable_observations": total,
    }, indent=2))


if __name__ == "__main__":
    main()
