#!/usr/bin/env python3
"""gspc_financial_facts never rewrites a stamped run artifact (M-P1-10, 2026-10-07).

The daily refresh (.github/workflows/financial-facts.yml) runs the producer and opens a PR. Two
run artifacts (ai-adoption-components, labour-components) carry a sibling .ots, and the deploy's
release gate fails closed on a stamped file whose bytes changed. These tests run the producer's
run() offline (every fetch stubbed) against a temporary interop dir and check the hold.

Run: python3 scripts/test_financial_facts_stamped.py
"""
from __future__ import annotations

import json
import os
import shutil
import sys
import tempfile
import unittest
import unittest.mock as mock

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import gspc_financial_facts as gff  # noqa: E402

REPO = os.path.dirname(HERE)
PUBLIC = os.path.join(REPO, "public", "interop")


def _offline(fn):
    """Every network read fails; the producer's fetchers turn that into UNREACHABLE/UNCHECKABLE."""
    def refuse(*a, **k):
        raise OSError("offline test: no network")

    def wrapped(*a, **k):
        with mock.patch.object(gff.urllib.request, "urlopen", side_effect=refuse):
            return fn(*a, **k)
    return wrapped


AXES = ("provenance-controls", "reserve-attestation", "regulatory-framework", "distribution-integrity",
        "custody-disclosure", "ai-adoption-components", "labour-components", "humanoid-labour-index")


def _read(path: str) -> bytes:
    with open(path, "rb") as fh:
        return fh.read()


def _json(path: str):
    with open(path, encoding="utf-8") as fh:
        return json.load(fh)


class StampedHoldTest(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.mkdtemp()
        self.public = os.path.join(self.tmp, "public", "interop")
        self.dist = os.path.join(self.tmp, "dist", "client", "interop")
        os.makedirs(self.public)
        for f in os.listdir(PUBLIC):
            if f.startswith("financial-measure-run-") or f == "financial-facts-as-of.json":
                shutil.copy(os.path.join(PUBLIC, f), self.public)
        self.stamped = sorted(f[: -len(".ots")] for f in os.listdir(self.public) if f.endswith(".json.ots"))
        self.before = {f: _read(os.path.join(self.public, f)) for f in os.listdir(self.public)}
        self.patches = [
            mock.patch.object(gff, "PUBLIC_INTEROP", self.public),
            mock.patch.object(gff, "INTEROP", self.dist),
            mock.patch.object(gff, "AS_OF_TS", os.path.join(self.tmp, "dist", "_gspc_fin_as_of.ts")),
            mock.patch.object(gff, "REPO", self.tmp),
        ]
        for p in self.patches:
            p.start()

    def tearDown(self):
        for p in reversed(self.patches):
            p.stop()
        shutil.rmtree(self.tmp, ignore_errors=True)

    def test_the_repository_has_stamped_run_artifacts_to_guard(self):
        # The guard is not vacuous: the committed tree has stamped run files.
        self.assertIn("financial-measure-run-labour-components.json", self.stamped)
        self.assertIn("financial-measure-run-ai-adoption-components.json", self.stamped)

    @_offline
    def test_a_full_write_leaves_every_stamped_file_byte_identical_and_reports_it_held(self):
        out = gff.run(write=True)
        for f in self.stamped:
            self.assertEqual(_read(os.path.join(self.public, f)), self.before[f], f"{f} was rewritten")
        snap = _json(os.path.join(self.public, "financial-facts-as-of.json"))
        held = snap.get("held_stamped") or {}
        stamped_axes = {a for a in AXES if f"financial-measure-run-{a}.json" in self.stamped}
        self.assertEqual(stamped_axes, {"ai-adoption-components", "labour-components"})
        self.assertEqual(set(held), stamped_axes)
        for axis in stamped_axes:
            committed = json.loads(self.before[f"financial-measure-run-{axis}.json"])
            # The snapshot reports the held axis from its own committed run, with that run's date.
            self.assertEqual(snap["axes"][axis]["as_of"], committed["as_of"])
            self.assertEqual(snap["axes"][axis]["n"], committed["n"])
            # Offline, the fresh series are UNCHECKABLE, so the facts differ, and it says so.
            self.assertTrue(held[axis]["fresh_facts_differ"])
        self.assertEqual(snap["as_of"], out["as_of"])
        # An unstamped axis is refreshed: its run carries this run's as_of.
        free = _json(os.path.join(self.public, "financial-measure-run-humanoid-labour-index.json"))
        self.assertEqual(free["as_of"], out["as_of"])

    @_offline
    def test_only_naming_a_stamped_axis_writes_nothing_for_it(self):
        gff.run(write=True, only={"labour-components"})
        f = "financial-measure-run-labour-components.json"
        self.assertEqual(_read(os.path.join(self.public, f)), self.before[f])


if __name__ == "__main__":
    unittest.main()
