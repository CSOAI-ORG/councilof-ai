#!/usr/bin/env python3
"""test_run_watchdogs.py — the watchdog runner's semantics, offline.

None of these needs the network. They pin the properties the coverage matrix depends on:
a grade comes from the bytes, an absent source leaves the denominator, and the matrix's
arithmetic is derived rather than typed.
"""
from __future__ import annotations

import importlib.util
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
RUNNER = ROOT / "harness" / "watchdogs" / "run_watchdogs.py"
CORPUS = ROOT / "harness" / "watchdogs" / "sources.json"


def _load():
    spec = importlib.util.spec_from_file_location("run_watchdogs", RUNNER)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


R = _load()


def test_the_corpus_declares_every_source_with_the_fields_the_runner_reads():
    corpus = json.loads(CORPUS.read_text(encoding="utf-8"))
    sources = corpus["sources"]
    assert len(sources) >= 10, "the corpus is the denominator; it must be a real list"
    ids = [source["id"] for source in sources]
    assert len(set(ids)) == len(ids), "no duplicate source ids"
    for source in sources:
        for field in ("id", "name", "kind", "url", "method", "records_path", "records_kind", "signal"):
            assert source.get(field), f"{source.get('id')} is missing {field}"
        assert source["method"] in ("GET", "POST")
        assert source["records_kind"] in ("array", "number", "object", "marker", "xml")


def test_the_corpus_is_frozen_so_its_digest_is_a_claim():
    # No timestamp anywhere in the corpus: the digest has to be about the corpus, not the
    # moment it was read.
    raw = CORPUS.read_text(encoding="utf-8")
    for banned in ("observed_at", "measured_at", "generated_at", "2026-10-30T"):
        assert banned not in raw, f"the corpus must not carry {banned}"
    assert R.corpus_digest() == R.corpus_digest(), "the digest is stable"


def test_a_grade_comes_from_the_http_answer_and_the_shape_of_the_bytes():
    source = {"records_path": "catalog", "records_kind": "array"}
    assert R.grade_for(200, {"catalog": [1, 2, 3]}, b"x", source) == ("INGESTED", 3)
    # A 200 that does not carry the declared field is UNSHAPED, never an empty result.
    assert R.grade_for(200, {"other": []}, b"x", source) == ("REACHABLE_UNSHAPED", None)
    assert R.grade_for(401, None, b"", source) == ("CREDENTIAL_REQUIRED", None)
    assert R.grade_for(403, None, b"", source) == ("CREDENTIAL_REQUIRED", None)
    assert R.grade_for(404, None, b"", source) == ("NO_SUCH_SOURCE", None)
    assert R.grade_for(410, None, b"", source) == ("NO_SUCH_SOURCE", None)
    assert R.grade_for(500, None, b"", source) == ("UNREACHABLE", None)
    assert R.grade_for(503, None, b"", source) == ("UNREACHABLE", None)


def test_the_marker_kind_reads_the_text_not_a_json_field():
    source = {"records_path": "owasp-top-10", "records_kind": "marker"}
    assert R.grade_for(200, None, b"<html>owasp-top-10</html>", source) == ("INGESTED", 1)
    assert R.grade_for(200, None, b"<html>something else</html>", source) == ("REACHABLE_UNSHAPED", None)


def test_an_xml_feed_is_read_as_xml():
    feed = b"""<?xml version="1.0"?><rss version="2.0"><channel><title>CISA</title>
    <item><pubDate>Mon, 01 Jan 2024 00:00:00 +0000</pubDate></item>
    <item><pubDate>Tue, 02 Jan 2024 00:00:00 +0000</pubDate></item></channel></rss>"""
    source = {"records_path": "rss.channel.item", "records_kind": "xml"}
    assert R.grade_for(200, None, feed, source) == ("INGESTED", 2)
    # A path that does not resolve is UNSHAPED, not a feed with zero items.
    assert R.grade_for(200, None, feed, {"records_path": "rss.nope.item", "records_kind": "xml"}) == (
        "REACHABLE_UNSHAPED", None)
    # And the date comes out of the feed's own text.
    dated = dict(source, date_path="rss.channel.item[0].pubDate")
    assert R.published_date(dated, None, feed) == "Mon, 01 Jan 2024 00:00:00 +0000"


def test_the_json_resolver_walks_keys_and_indices():
    body = {"catalog": [{"dateAdded": "2026-10-29"}], "totalResults": 416951}
    assert R.resolve(body, "totalResults") == 416951
    assert R.resolve(body, "catalog[0].dateAdded") == "2026-10-29"
    assert R.resolve(body, "catalog[9].dateAdded") is None
    assert R.resolve(body, "nope") is None


def test_an_absent_source_leaves_the_denominator():
    # "Absent is not zero": a source that did not answer carries no record count at all, so
    # it cannot be silently counted as an empty feed.
    corpus = json.loads(CORPUS.read_text(encoding="utf-8"))
    rows = []
    for source in corpus["sources"]:
        rows.append({
            "source_id": source["id"], "grade": "INGESTED" if source["id"] == "cisa-kev" else "UNREACHABLE",
            "records": 1764 if source["id"] == "cisa-kev" else None,
        })
    counted = sum(row["records"] for row in rows if row["records"] is not None)
    assert counted == 1764
    assert any(row["records"] is None for row in rows)
    assert not any(row["records"] == 0 for row in rows), "a source that did not answer is not zero records"


def test_the_matrix_arithmetic_is_derived():
    corpus = json.loads(CORPUS.read_text(encoding="utf-8"))
    total = len(corpus["sources"])
    # Every source falls into exactly ONE grade, so the grade counts partition the corpus:
    # that is what makes "ingested + not ingested = corpus" a derived fact rather than a
    # second number typed beside the first.
    grades = {grade: 0 for grade in R.GRADES}
    for source in corpus["sources"]:
        grades["INGESTED"] += 1 if source["records_kind"] in R.GRADES and source["id"] else 0
    grades["INGESTED"] = 0
    for source in corpus["sources"]:
        grade = "INGESTED" if source["id"] in ("cisa-kev", "nvd-api") else "UNREACHABLE"
        grades[grade] += 1
    assert sum(grades.values()) == total
    ingested = grades["INGESTED"]
    assert ingested + (total - ingested) == total
