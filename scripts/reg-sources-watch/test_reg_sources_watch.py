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
