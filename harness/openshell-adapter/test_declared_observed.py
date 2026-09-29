#!/usr/bin/env python3
# SPDX-License-Identifier: Apache-2.0
"""Tests for declared_observed.py.  python3 test_declared_observed.py

prover-fixtures/runs/*.prover.json are real outputs of the published openshell-prover 0.1.2 binary
(prover-fixtures/capture.sh). Set OPENSHELL_PROVER=/path/to/openshell-prover to re-run it live.
The rule under test: an inconclusive side is UNMEASURED, never a pass.
"""
import copy
import json
import os
import subprocess
import sys
import unittest

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import adapter as A  # noqa: E402
import declared_observed as DO  # noqa: E402

PF = os.path.join(HERE, "prover-fixtures")
BOUND = os.path.join(PF, "boundary-pkg-index.yaml")


def jload(p):
    with open(p, encoding="utf-8") as fh:
        return json.load(fh)


def fx(name):
    d = os.path.join(HERE, "fixtures", name)
    log = "enforcer.ocsf.jsonl" if os.path.exists(os.path.join(d, "enforcer.ocsf.jsonl")) else "enforcer.log"
    return os.path.join(d, "policy.yaml"), [os.path.join(d, log)], os.path.join(d, "witness.jsonl")


def run(policy, boundary, prover_json, logs, witness):
    return DO.build(policy, boundary, jload(prover_json), None, logs, witness)


class RealProverOutputs(unittest.TestCase):
    def test_the_gap_prover_within_observer_divergent(self):
        """The case the prover's own README leaves open: declared containment holds, the run does not."""
        pol, logs, wit = fx("must-fail-deny-declared-egress")
        r = run(pol, BOUND, os.path.join(PF, "runs", "must-fail-deny-declared-egress.prover.json"), logs, wit)
        self.assertEqual(r["declared"]["result"], "within_boundary")
        self.assertEqual((r["status"], r["finding"]), ("MEASURED", "DECLARED_WITHIN_BOUNDARY__OBSERVED_DIVERGENT"))

    def test_control_consistent(self):
        pol, logs, wit = fx("control-deny-held")
        r = run(pol, BOUND, os.path.join(PF, "runs", "control-deny-held.prover.json"), logs, wit)
        self.assertEqual((r["status"], r["finding"]), ("MEASURED", "DECLARED_WITHIN_BOUNDARY__OBSERVED_CONSISTENT"))

    def test_capture_prover_unsupported_is_unmeasured_and_keeps_the_observation(self):
        d = os.path.join(HERE, "capture-2026-09-28")
        r = run(os.path.join(d, "policy.yaml"), os.path.join(PF, "boundary-capture.yaml"),
                os.path.join(PF, "runs", "capture-2026-09-28.prover.json"), [os.path.join(d, "enforcer.log")],
                os.path.join(d, "witness.jsonl"))
        self.assertEqual(r["declared"]["exit_code"], 3)
        self.assertEqual(r["status"], "UNMEASURED")
        self.assertIsNone(r["finding"])
        self.assertTrue(any(x.startswith("PROVER_UNSUPPORTED") for x in r["unmeasured_reasons"]))
        self.assertEqual(r["observed"]["result"], "DIVERGENT")  # still shown, not discarded

    def test_exceeds_boundary(self):
        pol = os.path.join(PF, "candidate-exceeds.yaml")
        _p, logs, wit = fx("control-deny-held")
        r = run(pol, BOUND, os.path.join(PF, "runs", "candidate-exceeds.prover.json"), logs, wit)
        self.assertEqual(r["status"], "MEASURED")
        self.assertTrue(r["finding"].startswith("DECLARED_EXCEEDS_BOUNDARY__"))
        self.assertEqual(r["declared"]["counterexample"]["host"], "exfil.example")


class NeverAPass(unittest.TestCase):
    def setUp(self):
        self.pol, self.logs, self.wit = fx("control-deny-held")
        self.base = jload(os.path.join(PF, "runs", "control-deny-held.prover.json"))

    def status(self, obj, witness="default"):
        return DO.build(self.pol, BOUND, obj, None, self.logs, self.wit if witness == "default" else witness)

    def test_synthetic_inconclusive(self):
        r = self.status(jload(os.path.join(PF, "synthetic-inconclusive.prover.json")))
        self.assertEqual(r["status"], "UNMEASURED")
        self.assertIn("solver_timeout", r["unmeasured_reasons"][0])

    def test_every_non_within_non_exceeds_result_is_unmeasured(self):
        for res, code in (("unsupported", 3), ("inconclusive", 3), ("error", 2)):
            o = copy.deepcopy(self.base)
            o["result"], o["exit_code"] = res, code
            for wit in (self.wit, None):
                r = self.status(o, wit)
                self.assertEqual(r["status"], "UNMEASURED", (res, wit))
                self.assertIsNone(r["finding"])

    def test_unknown_result_word_is_unmeasured(self):
        o = copy.deepcopy(self.base)
        o["result"] = "passed"
        self.assertEqual(self.status(o)["status"], "UNMEASURED")

    def test_exit_code_result_mismatch_is_unmeasured(self):
        o = copy.deepcopy(self.base)
        o["exit_code"] = 3
        self.assertEqual(self.status(o)["status"], "UNMEASURED")

    def test_unknown_schema_version_is_unmeasured(self):
        o = copy.deepcopy(self.base)
        o["schema_version"] = 2
        self.assertEqual(self.status(o)["status"], "UNMEASURED")

    def test_coverage_gap_is_unmeasured(self):
        o = copy.deepcopy(self.base)
        o["coverage"]["domains"] = ["filesystem", "network_l4", "process", "landlock"]  # no network_rest
        r = self.status(o)
        self.assertEqual(r["status"], "UNMEASURED")
        self.assertTrue(any("COVERAGE_GAP" in x for x in r["unmeasured_reasons"]))

    def test_no_witness_is_unmeasured_even_when_the_prover_passes(self):
        r = self.status(self.base, None)
        self.assertEqual(r["declared"]["result"], "within_boundary")
        self.assertEqual(r["status"], "UNMEASURED")
        self.assertTrue(any(x.startswith("NO_INDEPENDENT_OBSERVER") for x in r["unmeasured_reasons"]))

    def test_no_pass_word_in_output(self):
        r = self.status(self.base)
        blob = json.dumps(r).upper()
        for w in ('"PASS"', "CERTIF", "COMPLIANT"):
            self.assertNotIn(w, blob)


class Cli(unittest.TestCase):
    def test_exit_codes(self):
        pol, logs, wit = fx("control-deny-held")
        base = [sys.executable, os.path.join(HERE, "declared_observed.py"), "--policy", pol, "--boundary", BOUND,
                "--enforcer-log", logs[0], "--witness", wit]
        p = subprocess.run(base + ["--prover-json", os.path.join(PF, "runs", "control-deny-held.prover.json")],
                           capture_output=True, text=True)
        self.assertEqual(p.returncode, 0, p.stdout + p.stderr)
        p = subprocess.run(base + ["--prover-json", os.path.join(PF, "synthetic-inconclusive.prover.json")],
                           capture_output=True, text=True)
        self.assertEqual(p.returncode, 3, p.stdout + p.stderr)

    @unittest.skipUnless(os.environ.get("OPENSHELL_PROVER"), "OPENSHELL_PROVER not set")
    def test_live_prover_matches_saved_output(self):
        for name, cand, bound in (("control-deny-held", fx("control-deny-held")[0], BOUND),
                                  ("candidate-exceeds", os.path.join(PF, "candidate-exceeds.yaml"), BOUND),
                                  ("capture-2026-09-28", os.path.join(HERE, "capture-2026-09-28", "policy.yaml"),
                                   os.path.join(PF, "boundary-capture.yaml"))):
            live, code = DO.run_prover(os.environ["OPENSHELL_PROVER"], cand, bound, None)
            saved = jload(os.path.join(PF, "runs", f"{name}.prover.json"))
            for o in (live, saved):
                o.pop("inputs", None)
            self.assertEqual(live, saved, name)
            self.assertEqual(code, saved["exit_code"])


if __name__ == "__main__":
    unittest.main(verbosity=2)
