#!/usr/bin/env python3
"""Offline adversarial tests for the Council auto-EAT metadata-only commons."""
from __future__ import annotations

from datetime import datetime, timedelta, timezone
import copy
import hashlib
import json
import pathlib
import tempfile
import unittest
from unittest.mock import patch
import urllib.error

import research_commons as c

NOW = datetime(2026, 11, 24, 2, 30, tzinfo=timezone.utc)


def stub_fetch(url: str, *, token=None, **_):
    c.allow_url(url)
    if "api.github.com/repos/" in url:
        repo = url.split("/repos/", 1)[1].split("/commits", 1)[0]
        if "/commits" in url:
            return [{"sha": hashlib.sha1(repo.encode()).hexdigest()}]
        return {"id": abs(hash(repo)) % 100000 + 1, "full_name": repo,
                "license": {"spdx_id": "Apache-2.0"}, "archived": False,
                "pushed_at": "2026-11-23T21:30:00Z"}
    if "api.crossref.org/works" in url:
        from urllib.parse import parse_qs, urlsplit
        topic = parse_qs(urlsplit(url).query).get("query.bibliographic", [""])[0]
        relevant = {
            c.TOPICS[0]: "Reproducible evaluation of AI agents <script>",
            c.TOPICS[1]: "Calibrated AI safety benchmarks <script>",
            c.TOPICS[2]: "Autonomous agent authorization policy <script>",
        }
        doi = "10.1234/source.example"
        return {"message": {"items": [
            {"DOI": doi, "title": [relevant[topic]],
             "published": {"date-parts": [[2024, 2, 2]]},
             "indexed": {"date-time": "2026-11-23T00:00:00Z"},
             "abstract": "PRIVATE FULL TEXT MUST NOT BE COPIED",
             "author": [{"email": "never-copy@example.org"}]}
        ]}}
    raise AssertionError("Source not in test allowlist: " + url)


class ResearchCommonsTests(unittest.TestCase):
    def test_complete_fixed_allowlist_collection(self):
        report = c.collect(None, now=NOW, fetch=stub_fetch)
        self.assertEqual(report["repositories_checked"], len(c.SOURCES))
        self.assertEqual(report["repositories_observed"], len(c.SOURCES))
        self.assertEqual(report["repositories_uncheckable"], 0)
        self.assertEqual(report["crossref_topics_observed"], 3)
        self.assertEqual(report["crossref_candidate_metadata_rows"], 3)
        self.assertEqual(report["repository_status"], "FULL_SOURCE_METADATA_READBACK")

    def test_no_copied_code_abstract_emails_or_authority(self):
        report = c.collect(None, now=NOW, fetch=stub_fetch)
        data = json.dumps(report)
        self.assertNotIn("PRIVATE FULL TEXT", data)
        self.assertNotIn("never-copy@example.org", data)
        self.assertNotIn("<script>", data)
        self.assertFalse(report["third_party_code_copied"])
        self.assertFalse(report["model_weights_copied"])
        self.assertFalse(report["incident_records_copied"])
        self.assertFalse(report["machine_training_from_sources_performed"])
        self.assertFalse(report["gspc_measurement_or_board_written"])
        self.assertFalse(report["external_executor_invoked"])
        self.assertFalse(report["human_authority_issued"])
        self.assertFalse(report["receiving_party_effect_verified"])
        self.assertFalse(report["ras_paid_request_executed"])
        self.assertEqual(report["independent_verifier_state"], "NOT_APPOINTED_OR_VERIFIED")

    def test_literal_source_permissive_licence_still_requires_review(self):
        report = c.collect(None, now=NOW, fetch=stub_fetch)
        r = report["repositories"][0]
        self.assertEqual(r["license_spdx_source_declared"], "Apache-2.0")
        self.assertEqual(r["license_review"], "REQUIRED_FOR_CODE_DATA_MODEL_WEIGHTS_AND_DEPENDENCIES")
        self.assertEqual(r["ras_measurement_permission"], "NOT_GRANTED")

    def test_public_metadata_not_claimed_new_paper(self):
        report = c.collect(None, now=NOW, fetch=stub_fetch)
        topic = report["crossref_topics"][0]
        self.assertTrue(topic["recently_indexed_not_necessarily_newly_published"])
        self.assertTrue(topic["papers"][0]["full_text_copied"] is False)
        self.assertEqual(topic["papers"][0]["full_text_rights"], "NOT_ESTABLISHED")
        self.assertEqual(topic["papers"][0]["crossref_published_date_parts"], [2024, 2, 2])

    def test_github_repo_identity_change_held(self):
        def changed(url, *, token=None):
            v = stub_fetch(url, token=token)
            if isinstance(v, dict) and "full_name" in v:
                v["full_name"] = "attacker/fork"
            return v
        r = c.github_source(c.SOURCES[0], fetch=changed)
        self.assertEqual(r["status"], "SOURCE_UNCHECKABLE")
        self.assertIn("GITHUB_REPO_ID_MISMATCH", r["reason"])
        self.assertNotIn("head_sha", r)

    def test_github_commit_unavailable_held(self):
        def no_commit(url, *, token=None):
            return [] if "/commits" in url else stub_fetch(url, token=token)
        r = c.github_source(c.SOURCES[0], fetch=no_commit)
        self.assertEqual(r["status"], "SOURCE_UNCHECKABLE")
        self.assertIn("GITHUB_COMMIT_UNCHECKABLE", r["reason"])

    def test_github_bad_head_held(self):
        def invalid(url, *, token=None):
            return [{"sha": "not-a-commit"}] if "/commits" in url else stub_fetch(url, token=token)
        r = c.github_source(c.SOURCES[0], fetch=invalid)
        self.assertIn("GITHUB_HEAD_SHA_UNCHECKABLE", r["reason"])

    def test_license_missing_never_becomes_mit(self):
        def no_license(url, *, token=None):
            v = stub_fetch(url, token=token)
            if isinstance(v, dict) and "license" in v:
                v["license"] = None
            return v
        r = c.github_source(c.SOURCES[0], fetch=no_license)
        self.assertIsNone(r["license_spdx_source_declared"])
        self.assertEqual(r["license_review"], "REQUIRED_FOR_CODE_DATA_MODEL_WEIGHTS_AND_DEPENDENCIES")

    def test_upstream_change_is_only_a_candidate(self):
        old = c.collect(None, now=NOW - timedelta(days=1), fetch=stub_fetch)
        new_head = "f" * 40
        def changed(url, *, token=None):
            if url.endswith("/commits?per_page=1") and "ai-openshell/openshell" in url:
                return [{"sha": new_head}]
            return stub_fetch(url, token=token)
        today = c.collect(old, now=NOW, fetch=changed)
        self.assertEqual(today["changed_source_revision_count"], 1)
        event = today["changed_source_revisions_observed"][0]
        self.assertEqual(event["new_head_sha"], new_head)
        self.assertFalse(event["action_executed"])
        self.assertNotIn("MEASURED", event["meaning"])
        self.assertIn("REVIEW_REQUIRED", event["review"])

    def test_missing_prior_observation_does_not_invent_change(self):
        new = c.collect(None, now=NOW, fetch=stub_fetch)
        self.assertEqual(new["changed_source_revision_count"], 0)

    def test_partial_source_fails_to_claim_global_freshness(self):
        def partial(url, *, token=None):
            if "ai-openshell/openshell" in url:
                raise c.Uncheckable("SOURCE_HTTP_429")
            return stub_fetch(url, token=token)
        r = c.collect(None, now=NOW, fetch=partial)
        self.assertEqual(r["repository_status"], "PARTIAL")
        self.assertEqual(r["repositories_uncheckable"], 1)
        self.assertEqual(r["repositories_observed"], len(c.SOURCES) - 1)

    def test_ambiguous_source_errors_are_never_zero_papers(self):
        def fail_crossref(url, *, token=None):
            if "api.crossref" in url:
                raise c.Uncheckable("SOURCE_HTTP_403")
            return stub_fetch(url, token=token)
        r = c.collect(None, now=NOW, fetch=fail_crossref)
        self.assertEqual(r["crossref_topics_observed"], 0)
        self.assertEqual(r["crossref_candidate_metadata_rows"], 0)
        self.assertTrue(all(t["status"] == "SOURCE_UNCHECKABLE" for t in r["crossref_topics"]))

    def test_crossref_doi_injection_not_accepted(self):
        def poisoned(url, *, token=None):
            if "api.crossref" in url:
                return {"message": {"items": [
                    {"DOI": "javascript:alert(1)", "title": ["bad"]},
                    {"DOI": "10.1234/good", "title": ["AI agent evaluation <img>"]},
                    {"DOI": "10.1234/good", "title": ["duplicate"]},
                ]}}
            return stub_fetch(url, token=token)
        r = c.crossref_topic(c.TOPICS[0], from_date="2026-11-01", fetch=poisoned)
        self.assertEqual(len(r["papers"]), 1)
        self.assertEqual(r["papers"][0]["title_metadata"], "AI agent evaluation img")

    def test_crossref_does_not_call_unrelated_paper_research(self):
        def misleading(url, *, token=None):
            if "api.crossref" in url:
                return {"message": {"items": [
                    {"DOI": "10.1234/irrelevant", "title": ["A cancer medicine clinical trial"]},
                    {"DOI": "10.1234/relevant", "title": ["Reproducible evaluation of AI agents"]},
                ]}}
            return stub_fetch(url, token=token)
        r = c.crossref_topic(c.TOPICS[0], from_date="2026-11-01", fetch=misleading)
        self.assertEqual([x["doi"] for x in r["papers"]], ["10.1234/relevant"])
        self.assertEqual(r["coverage"], "TOP_8_API_SEARCH_MATCHES_ONLY_NOT_EXHAUSTIVE")

    def test_safety_topic_excludes_unrelated_calibration_papers(self):
        self.assertFalse(c.title_relevant(
            c.TOPICS[1], "Reliability and calibration of AI-derived shear models for concrete beams"))
        self.assertFalse(c.title_relevant(
            c.TOPICS[1], "A new AI disclosure benchmark for financial filings"))
        self.assertTrue(c.title_relevant(
            c.TOPICS[1], "Benchmarking AI safety controls and calibration failure modes"))

    def test_bad_crossref_shape_is_explicit_error(self):
        def malformed(url):
            return {"message": {"items": "not a list"}}
        r = c.crossref_topic(c.TOPICS[0], from_date="2026-11-01", fetch=malformed)
        self.assertEqual(r["status"], "SOURCE_UNCHECKABLE")
        self.assertEqual(r["papers"], [])

    def test_unknown_domain_is_refused_before_network(self):
        for address in (
            "https://evil.example/private",
            "http://api.github.com/repos/x/y",
            "https://api.github.com.attacker.invalid/repos/a/b",
            "https://127.0.0.1/repos/a/b",
            "https://api.github.com/repos/a/b/../../secrets",
            "https://api.github.com:444/repos/a/b",
            "https://user:password@api.github.com/repos/a/b",
            "https://api.crossref.org/admin",
            "https://api.github.com/repos/a/b#fragment",
        ):
            with self.subTest(address=address), self.assertRaises(c.Uncheckable):
                c.allow_url(address)

    def test_exact_api_paths_accepted(self):
        c.allow_url("https://api.github.com/repos/ai-openshell/openshell")
        c.allow_url("https://api.github.com/repos/ai-openshell/openshell/commits?per_page=1")
        c.allow_url("https://api.crossref.org/works?rows=3")

    def test_source_slug_with_path_traversal_refused(self):
        with self.assertRaisesRegex(c.Uncheckable, "INVALID_STATIC_REPOSITORY"):
            c.github_source(("../private", "x", "y"), fetch=stub_fetch)

    def test_naive_clock_refused(self):
        with self.assertRaisesRegex(c.Uncheckable, "CLOCK_NOT_UTC"):
            c.summarize(None, [], [], datetime(2026, 11, 24))

    def test_budget_overrun_refused(self):
        with self.assertRaisesRegex(c.Uncheckable, "FIXED_COLLECTION_BUDGET_EXCEEDED"):
            c.collect(None, now=NOW, fetch=stub_fetch, sources=c.SOURCES * 3)

    def test_oversize_payload_refused(self):
        class Response:
            status = 200
            headers = {"Content-Length": str(c.MAX_RESPONSE_BYTES + 1)}
            def __enter__(self): return self
            def __exit__(self, *a): pass
        class Opener:
            def open(self, request, timeout): return Response()
        with self.assertRaisesRegex(c.Uncheckable, "SOURCE_PAYLOAD_TOO_LARGE"):
            c.fetch_json("https://api.github.com/repos/a/b", opener=Opener())

    def test_redirect_hop_refused(self):
        class Opener:
            def open(self, request, timeout):
                raise urllib.error.HTTPError(request.full_url, 302, "redirect", {}, None)
        with self.assertRaisesRegex(c.Uncheckable, "SOURCE_REDIRECT_HELD"):
            c.fetch_json("https://api.crossref.org/works", opener=Opener())

    def test_json_must_be_object_or_array(self):
        class Response:
            status = 200
            headers = {}
            def __enter__(self): return self
            def __exit__(self, *a): pass
            def read(self, n): return b"true"
        class Opener:
            def open(self, request, timeout): return Response()
        with self.assertRaisesRegex(c.Uncheckable, "SOURCE_SHAPE_INVALID"):
            c.fetch_json("https://api.crossref.org/works", opener=Opener())

    def test_date_parser_strict(self):
        for value in ("2026-02-30T01:00:00Z", "2026-11-24", "2026-11-24T01:00:00+00:00"):
            with self.subTest(value=value), self.assertRaises(c.Uncheckable):
                c.utc(value)
        self.assertEqual(c.utc("2026-11-24T01:00:00Z").hour, 1)

    def test_canonical_registry_checksum_stable(self):
        a = c.collect(None, now=NOW, fetch=stub_fetch)
        b = c.collect(None, now=NOW, fetch=stub_fetch)
        self.assertEqual(a["registry_sha256"], b["registry_sha256"])
        self.assertEqual(c.canonical(a), c.canonical(b))

    def test_preexisting_current_snapshot_reused_without_fetch(self):
        with tempfile.TemporaryDirectory() as directory:
            p = pathlib.Path(directory) / "commons.json"
            report = c.collect(None, now=datetime.now(timezone.utc), fetch=stub_fetch)
            p.write_text(json.dumps(report))
            self.assertEqual(c.main(["--out", str(p), "--min-hours", "20"]), 0)
            self.assertEqual(json.loads(p.read_text()), report)

    def test_bad_previous_is_not_silently_replaced(self):
        with tempfile.TemporaryDirectory() as directory:
            p = pathlib.Path(directory) / "commons.json"
            p.write_text(json.dumps({"schema": "wrong"}))
            self.assertEqual(c.main(["--out", str(p)]), 4)

    def test_offline_mode_does_not_probe(self):
        with tempfile.TemporaryDirectory() as directory:
            p = pathlib.Path(directory) / "missing.json"
            self.assertEqual(c.main(["--out", str(p), "--offline"]), 4)


if __name__ == "__main__":
    unittest.main(verbosity=2)
