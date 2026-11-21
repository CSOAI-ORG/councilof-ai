"""Offline regression checks for the proposed census wording correction."""
import contextlib
import importlib.util
import io
import json
import os
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

SOURCE = Path(os.environ.get("CSOAI_CATALOG_SOURCE", Path(__file__).with_name("catalog-trust-round.py")))
spec = importlib.util.spec_from_file_location("catalog_candidate", SOURCE)
catalog = importlib.util.module_from_spec(spec)
spec.loader.exec_module(catalog)

class Reporting(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.out = Path(self.temp.name)
        buckets = ["challenge", "real_404", "unreachable", "other_error", "alive_needs_input", "template_no_reply", "no-url"]
        rows = [{"resource": "https://example.invalid/" + str(i)} for i in range(len(buckets))]
        with patch.object(catalog.urllib.request, "urlopen", return_value=io.BytesIO(json.dumps(rows).encode())) as network, \
             patch.object(catalog, "probe_row", side_effect=lambda row, idx: {"bucket": buckets[idx]}), \
             patch.object(catalog.time, "sleep"), contextlib.redirect_stdout(io.StringIO()):
            self.assertEqual(catalog.run(str(self.out), "https://catalog.invalid/resources"), 0)
            self.assertEqual(network.call_count, 1)
        self.doc = json.loads((self.out / "latest.json").read_text())

    def test_other_errors_are_not_reported_as_unreachable(self):
        self.assertEqual(self.doc["headline"], "1 of 7 catalog rows returned HTTP 402; 2 returned HTTP 404 or were unreachable; 2 had other errors. Counts only by doctrine.")

    def test_http_402_does_not_assert_protocol_validity(self):
        with patch.object(catalog, "fetch", return_value=(402, "application/json", "not a payment envelope")):
            result = catalog.probe_row({"resource": "https://example.invalid/"}, 0)
        self.assertEqual(result["bucket"], "challenge")
        self.assertNotIn("correct", self.doc["headline"])
        self.assertIn("returned HTTP 402", self.doc["headline"])

    def test_published_timeout_matches_fetch_default(self):
        self.assertEqual(catalog.fetch.__defaults__[0], 14)
        self.assertIn("14s request timeout", self.doc["method"])

    def test_counts_remain_separate_and_add_to_population(self):
        c = self.doc["counts"]
        keys = ["challenge_402", "serves_200", "alive_needs_input", "template_no_reply", "dead_404_or_unreachable", "other_error"]
        self.assertEqual(sum(c[k] for k in keys), c["total"])
        self.assertEqual(c["dead_404_or_unreachable"], 2)
        self.assertEqual(c["other_error"], 2)
        self.assertTrue(catalog.counts_have_no_hosts(c))

    def test_row_without_url_is_counted_without_fetch(self):
        with patch.object(catalog, "fetch") as fetch:
            result = catalog.probe_row({}, 0)
        self.assertEqual(result["bucket"], "no-url")
        fetch.assert_not_called()

    def test_dated_record_and_latest_have_identical_bytes(self):
        archive = self.out / catalog.archive_name(self.doc["as_of"])
        self.assertEqual(archive.read_bytes(), (self.out / "latest.json").read_bytes())
        self.assertIn("A 402 is NOT delivery", self.doc["doctrine"])

if __name__ == "__main__":
    unittest.main(verbosity=2)
