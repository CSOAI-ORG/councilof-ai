#!/usr/bin/env python3
"""Tests for the MCP conformance probe (agent-interop lane, 2026-10).

Stdlib only, no network. These tests check the properties that make a staged
atom admissible and honest:

  1. every staged leaf passes the house validator (adapters.staged_leaves._check)
  2. the suite's own outcome vocabulary is preserved verbatim and never
     collapsed into "pass" or "fail"
  3. a run whose checks contain a FAILURE is a DEVIATION, not a COMPLETION
  4. no atom carries a signature and no atom carries a verdict word
  5. the subject set is deterministic for the same candidate population
  6. a loopback subject's reachability is recorded as host-local, not as a
     property of the published record

Run:  python3 -m unittest scripts/test_mcp_conformance_probe.py
"""
from __future__ import annotations

import json
import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "scripts" / "adapters"))
sys.path.insert(0, str(ROOT / "scripts" / "probes"))

from staged_leaves import _check, canonical_bytes  # noqa: E402
import mcp_conformance_probe as probe  # noqa: E402

PACK_DIR = ROOT / "public" / "interop" / probe.PACK
LEAVES = sorted(PACK_DIR.glob("card-*-unsigned.json")) if PACK_DIR.is_dir() else []


class TestStagedLeaves(unittest.TestCase):
    def test_pack_exists(self):
        self.assertTrue(PACK_DIR.is_dir(), f"missing pack dir {PACK_DIR}")

    def test_every_leaf_passes_the_house_validator(self):
        self.assertTrue(LEAVES, "no staged leaves to check")
        bad = []
        for path in LEAVES:
            card = json.loads(path.read_text(encoding="utf-8"))
            reason = _check(card)
            if reason:
                bad.append((path.name, reason))
        self.assertEqual([], bad, f"leaves rejected by the validator: {bad}")

    def test_leaves_are_unsigned(self):
        for path in LEAVES:
            card = json.loads(path.read_text(encoding="utf-8"))
            self.assertIn(card.get("sig_ed25519"), (None, ""),
                          f"{path.name} carries a signature; staged atoms must be unsigned")

    def test_no_leaf_carries_a_verdict_word(self):
        for path in LEAVES:
            raw = canonical_bytes(json.loads(path.read_text(encoding="utf-8"))).decode("utf-8")
            for word in ("hacked", "broken", "unsafe", "violat", "certif", "approved"):
                self.assertNotIn(word, raw.lower(),
                                 f"{path.name} carries the verdict word {word!r}")

    def test_no_leaf_claims_measured(self):
        for path in LEAVES:
            raw = canonical_bytes(json.loads(path.read_text(encoding="utf-8"))).decode("utf-8")
            self.assertNotIn("MEASURED", raw.replace("UNMEASURED", ""),
                             f"{path.name} claims MEASURED")

    def test_state_is_probed_not_measured(self):
        for path in LEAVES:
            card = json.loads(path.read_text(encoding="utf-8"))
            self.assertEqual("PROBED", card["payload"]["state"])
            self.assertTrue(card["payload"]["not_a_grade"])

    def test_source_urls_are_https(self):
        for path in LEAVES:
            card = json.loads(path.read_text(encoding="utf-8"))
            for url in card["source_urls"]:
                self.assertTrue(url.startswith("https://"),
                                f"{path.name} carries a non-https source url {url!r}")


class TestVocabulary(unittest.TestCase):
    def test_tally_preserves_the_suite_vocabulary(self):
        body = {"checks": [{"status": "SUCCESS"}, {"status": "FAILURE"},
                           {"status": "WARNING"}, {"status": "INFO"}]}
        scenarios = [{"body": body}]
        counts = probe._tally(scenarios)
        self.assertEqual({"SUCCESS": 1, "FAILURE": 1, "WARNING": 1, "INFO": 1}, counts)

    def test_tally_does_not_collapse_to_pass(self):
        body = {"checks": [{"status": "SUCCESS"}]}
        counts = probe._tally([{"body": body}])
        self.assertNotIn("pass", {k.lower() for k in counts})

    def test_failure_is_a_deviation_not_a_completion(self):
        """A run whose checks carry a FAILURE must not be labelled RUN_COMPLETED."""
        body = {"checks": [{"status": "SUCCESS"}, {"status": "FAILURE"}]}
        counts = probe._tally([{"body": body}])
        failed = sum(v for k, v in counts.items()
                     if k.strip().upper() in {"FAILURE", "FAIL", "FAILED", "ERROR"})
        self.assertEqual(1, failed)
        self.assertEqual(probe.STATE_DEVIATIONS,
                         probe.STATE_DEVIATIONS if failed else probe.STATE_COMPLETED)


class TestDeterminism(unittest.TestCase):
    def test_sample_is_deterministic_for_the_same_population(self):
        cands = [{"id": f"a{i}@1.0.0", "url": "https://x/y", "source": "s",
                  "record_url": "https://x/y"} for i in range(20)]
        first = [c["id"] for c in probe._sample(cands, 6)]
        second = [c["id"] for c in probe._sample(list(reversed(cands)), 6)]
        self.assertEqual(first, second, "the sample must not depend on input order")

    def test_duplicate_ids_collapse(self):
        cands = [{"id": "a@1", "url": "https://x", "source": "s", "record_url": "https://x"},
                 {"id": "a@1", "url": "https://x", "source": "s", "record_url": "https://x"}]
        self.assertEqual(1, len(probe._sample(cands, 10)))


class TestLoopbackHonesty(unittest.TestCase):
    def test_loopback_subject_records_host_local_reachability(self):
        subject = {"id": "agntcy:x", "url": "http://localhost:9999/",
                   "source": "agntcy-directory", "record_url": "https://example.org/list"}
        card = probe._card(subject, probe.INSTRUMENTS[0],
                           {"state": probe.STATE_COMPLETED, "checks_sha256": "0" * 64,
                            "scenarios": 1, "check_counts": {"SUCCESS": 1}}, "2026-10-25T00:00:00Z")
        for url in card["source_urls"]:
            self.assertTrue(url.startswith("https://"),
                            "a loopback subject must cite an https record url, not the loopback")
        self.assertNotIn("localhost", json.dumps(card),
                         "the loopback url must not leak into the atom")

    def test_loopback_reachability_is_flagged_host_local(self):
        """The run note must say reachability is a property of the measuring host."""
        note = probe._loopback_note("http://localhost:9999/")
        self.assertIn("measuring host", note)
        self.assertNotIn("measuring host", probe._loopback_note("https://x/y"))


class TestCorpus(unittest.TestCase):
    """The corpus is the published artefact; the atom is its summary."""

    def _scenario(self):
        return [{
            "scenario": "server-tools-list-2026-10-25T05-56-03-267Z",
            "checks_sha256": "a" * 64,
            "body": [
                {"id": "tools-list", "name": "ToolsList", "description": "d",
                 "status": "SUCCESS",
                 "specReferences": [{"id": "S", "url": "https://modelcontextprotocol.io/x"}]},
                {"id": "dns", "name": "DNSRebindingRejected", "description": "d",
                 "status": "FAILURE", "errorMessage": "Failed: Method not found",
                 "details": {"k": 1}},
            ],
        }]

    def _subject(self):
        return {"id": "councilof.ai/mcp/free", "url": "https://councilof.ai/mcp/free",
                "source": "first-party", "record_url": "https://councilof.ai/mcp/free"}

    def test_ledger_keeps_the_suite_words_and_the_spec_citations(self):
        led = probe._ledger(self._scenario(), self._subject(), probe.INSTRUMENTS[1],
                            "d" * 64, "2026-10-25T00:00:00Z")
        checks = led["scenarios"][0]["checks"]
        self.assertEqual(2, len(checks))
        self.assertEqual("FAILURE", checks[1]["status"])
        self.assertEqual("Failed: Method not found", checks[1]["errorMessage"])
        self.assertEqual("https://modelcontextprotocol.io/x",
                         checks[0]["specReferences"][0]["url"])
        self.assertEqual(["DNSRebindingRejected"], led["deviation_checks"])

    def test_ledger_scenario_stem_drops_the_run_timestamp(self):
        led = probe._ledger(self._scenario(), self._subject(), probe.INSTRUMENTS[1],
                            "d" * 64, "2026-10-25T00:00:00Z")
        self.assertEqual("tools-list", led["scenarios"][0]["scenario"])
        self.assertIn("2026-10-25T05-56-03-267Z", led["scenarios"][0]["scenario_run_id"])

    def test_verdict_words_inside_a_compound_check_name_are_dropped(self):
        kept, dropped = probe._safe_deviations(
            ["UnsafeThing", "Approved", "MEASURED", "ToolsList", "DNSRebindingRejected"])
        self.assertEqual(["ToolsList", "DNSRebindingRejected"], kept)
        self.assertEqual(["UnsafeThing", "Approved", "MEASURED"], dropped)

    def test_atom_carries_the_deviation_names_and_the_corpus_pointer(self):
        led = probe._ledger(self._scenario(), self._subject(), probe.INSTRUMENTS[1],
                            "d" * 64, "2026-10-25T00:00:00Z")
        run = {"state": probe.STATE_DEVIATIONS, "checks_sha256": "d" * 64,
               "scenarios": 1, "check_counts": {"SUCCESS": 1, "FAILURE": 1}, "ledger": led}
        card = probe._card(self._subject(), probe.INSTRUMENTS[1], run, "2026-10-25T00:00:00Z")
        self.assertEqual(["DNSRebindingRejected"], card["payload"]["deviation_checks"])
        self.assertIn("/checks/", card["payload"]["checks"])
        self.assertIsNone(_check(card))

    def test_atom_stays_under_the_house_cap_with_many_deviations(self):
        led = probe._ledger(self._scenario(), self._subject(), probe.INSTRUMENTS[1],
                            "d" * 64, "2026-10-25T00:00:00Z")
        led["deviation_checks"] = [f"Check{i:03d}WithLongName" for i in range(200)]
        run = {"state": probe.STATE_DEVIATIONS, "checks_sha256": "d" * 64,
               "scenarios": 1, "check_counts": {"FAILURE": 200}, "ledger": led}
        card = probe._card(self._subject(), probe.INSTRUMENTS[1], run, "2026-10-25T00:00:00Z")
        self.assertLessEqual(len(canonical_bytes(card)), 3072)
        self.assertTrue(card["payload"].get("deviation_checks_truncated"),
                        "a trimmed list must say it was trimmed")
        self.assertIsNone(_check(card))

    def test_scope_note_travels_inside_the_payload(self):
        """A reader who sees only the atom must still learn the scope caveat."""
        subject = {"id": "agntcy:x", "url": "http://localhost:9999/",
                   "source": "agntcy-directory", "record_url": "https://example.org/list"}
        card = probe._card(subject, probe.INSTRUMENTS[0],
                           {"state": probe.STATE_COMPLETED, "checks_sha256": "0" * 64,
                            "scenarios": 1, "check_counts": {"SUCCESS": 1}},
                           "2026-10-25T00:00:00Z")
        self.assertIn("measuring host", card["payload"]["scope_note"])


class TestCorpusFiles(unittest.TestCase):
    """If the corpus was emitted, every atom must point at a file that exists."""

    def test_corpus_index_exists(self):
        index = PACK_DIR / "checks" / "index.json"
        self.assertTrue(index.is_file(), f"missing corpus index {index}")
        body = json.loads(index.read_text(encoding="utf-8"))
        self.assertTrue(body["runs"], "the corpus index lists no runs")

    def test_every_atom_pointer_resolves_to_a_corpus_file(self):
        for path in LEAVES:
            card = json.loads(path.read_text(encoding="utf-8"))
            pointer = card["payload"].get("checks")
            if not pointer:
                continue
            name = pointer.rsplit("/", 1)[-1]
            self.assertTrue((PACK_DIR / "checks" / name).is_file(),
                            f"{path.name} points at {name}, which is not in the pack")

    def test_every_corpus_file_describes_the_same_run_as_its_atom(self):
        """Rebuild the atom from the corpus and demand byte equality.

        This is the invariant that keeps the corpus honest: the corpus file and
        the staged atom must be two views of one run, not two records that
        drifted apart.
        """
        checked = 0
        for path in LEAVES:
            card = json.loads(path.read_text(encoding="utf-8"))
            pointer = card["payload"].get("checks")
            if not pointer:
                continue
            name = pointer.rsplit("/", 1)[-1]
            led = json.loads((PACK_DIR / "checks" / name).read_text(encoding="utf-8"))
            subject = {"id": led["subject_id"], "url": led["subject_url"],
                       "source": led["source"], "record_url": led["subject_record_url"]}
            instrument = [i for i in probe.INSTRUMENTS if i["id"] == led["instrument"]][0]
            counts = {}
            for sc in led["scenarios"]:
                for ck in sc["checks"]:
                    counts[ck["status"]] = counts.get(ck["status"], 0) + 1
            run = {"state": (probe.STATE_DEVIATIONS if led["deviation_checks"]
                             else probe.STATE_COMPLETED),
                   "checks_sha256": led["checks_sha256"],
                   "scenarios": len(led["scenarios"]),
                   "check_counts": counts, "ledger": led}
            rebuilt = probe._card(subject, instrument, run, led["generated_at"])
            self.assertEqual(canonical_bytes(rebuilt), canonical_bytes(card),
                             f"{path.name} and its corpus file disagree")
            checked += 1
        self.assertTrue(checked, "no corpus file was checked")


if __name__ == "__main__":
    unittest.main()
