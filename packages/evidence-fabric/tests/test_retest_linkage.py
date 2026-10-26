"""Retest-linkage regressions on the retained C-2026-0928-01 correction pair (read only)."""
import copy, json, sys
from pathlib import Path
import pytest

PACKAGE = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(PACKAGE))
import safe_pack_verify as V

RECORDS = PACKAGE.parents[1] / "docs/standards/osaia-safe-evidence-pack/records"


def pair():
    pre = json.loads((RECORDS / "C-2026-0928-01.pre-fix.safe-rv.json").read_text())
    post = json.loads((RECORDS / "C-2026-0928-01.post-fix.safe-rv.json").read_text())
    return {"pre": pre, "post": post}


def verdict(records):
    if V._cross_errors(records):
        return "INVALID"
    if V._cross_unresolved(records):
        return "UNRESOLVED"
    return "LINKED"


def resign(r):
    r["post"]["supersedes"][0]["sha256"] = V._canonical_record_sha(r["pre"])


def test_matching_retained_pair_links():
    assert verdict(pair()) == "LINKED"


def test_missing_retest():
    r = pair(); del r["post"]
    assert verdict(r) == "INVALID"


def test_non_pass_retest():
    r = pair(); r["post"]["result"]["state"] = "FAIL"
    assert verdict(r) == "INVALID"


def test_negative_control_not_failing():
    r = pair(); r["post"]["negative_control"]["observed"] = "PASS"
    assert verdict(r) == "INVALID"


def test_different_subject_without_successor_link():
    r = pair(); r["post"]["supersedes"] = []
    r["post"]["claim"]["subject"]["identifier"] = "sha256:" + "0" * 64
    assert verdict(r) == "UNRESOLVED"


def test_subject_change_with_explicit_successor_links():
    r = pair()  # retained pair: subject and claim_id differ, linked by supersedes
    assert r["pre"]["claim"]["subject"] != r["post"]["claim"]["subject"]
    assert verdict(r) == "LINKED"


def test_different_claim():
    r = pair(); r["post"]["claim"]["claim_type"] = "population_count"
    assert verdict(r) == "UNRESOLVED"


def test_retest_predates_original():
    r = pair(); r["post"]["result"]["measured_at"] = "2026-09-29T00:00:00Z"
    assert verdict(r) == "INVALID"


def test_chronology_unavailable():
    r = pair(); r["post"]["result"]["measured_at"] = None
    assert verdict(r) == "UNRESOLVED"


def test_method_change_requires_substitution():
    r = pair(); r["post"]["test"]["method_id"] = "other"
    assert verdict(r) == "UNRESOLVED"
    r["post"]["test"]["substitutions"] = [{"note": "recorded"}]
    assert verdict(r) == "LINKED"


def test_duplicate_record_ids():
    r = pair(); r["dup"] = copy.deepcopy(r["post"])
    assert verdict(r) == "INVALID"


def test_control_label_only():
    r = pair(); r["post"]["negative_control"]["description"] = ""
    assert verdict(r) == "UNRESOLVED"
