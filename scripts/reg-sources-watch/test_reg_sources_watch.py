# SPDX-License-Identifier: Apache-2.0
"""Offline: the watcher's selftest, plus a shape check of the committed source list."""
import importlib.util
import json
import pathlib

HERE = pathlib.Path(__file__).resolve().parent
spec = importlib.util.spec_from_file_location("rsw", HERE / "reg_sources_watch.py")
rsw = importlib.util.module_from_spec(spec)
spec.loader.exec_module(rsw)


def test_selftest():
    assert rsw.selftest(None) == 0


def test_sources_shape():
    doc = json.loads((HERE / "sources.json").read_text())
    ids = [s["id"] for s in doc["sources"]]
    assert len(ids) == len(set(ids))
    kinds = {"json_fields", "fr_search", "regs_docket", "regs_comments", "html_regex", "head", "rss_items",
             "govuk_search", "sitemap_locs", "ietf_search", "leginfo_history"}
    for s in doc["sources"]:
        assert s["kind"] in kinds and s["cls"] in ("record", "feed"), s["id"]
        assert s["url"].startswith("https://") and "api_key" not in s["url"], s["id"]
        assert s["relation"] in doc["relations"], s["id"]


def test_harness_router_claim_diff_fixtures():
    """claim-diff winner on the router's 26 frozen pairs: the pure multiset form and the one in use both score 1.000."""
    fx = json.loads((HERE.parent / "watch" / "fixtures" / "harness-router-20260929" / "claim_diff.json").read_text())
    assert len(fx) == 26
    assert [c["id"] for c in fx if (rsw._ms_key(c["a"]) != rsw._ms_key(c["b"])) != c["changed"]] == []
    assert [c["id"] for c in fx if rsw.multiset_changed(c["a"], c["b"]) != c["changed"]] == []


def test_fetch_ok_gate_and_gap():
    assert rsw._gap_s("2026-09-22T00:00:00Z", "2026-09-22T00:10:00Z") == 600
    assert rsw._gap_s(None, "2026-09-22T00:10:00Z") is None
