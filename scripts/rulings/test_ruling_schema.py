"""csoai.ruling/0.1 JSON Schema: every committed record validates; the negative cases do not.

Needs `jsonschema` (pip install jsonschema). It fails, loudly, when the package is absent: a
schema test that skips itself is a check that never runs.
"""
import copy
import glob
import json
import os
import unittest

import jsonschema  # noqa: F401  (ImportError is the intended failure when missing)
from jsonschema import Draft202012Validator

REPO = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
SCHEMA = json.load(open(os.path.join(REPO, "public/schemas/csoai-ruling-0.1.schema.json")))
RECORDS = [json.load(open(p)) for p in sorted(glob.glob(os.path.join(REPO, "public/signed/rulings/R-*.json")))]
V = Draft202012Validator(SCHEMA)


def errors(doc):
    return [e.message for e in V.iter_errors(doc)]


class RulingSchema(unittest.TestCase):
    def test_schema_is_valid_2020_12(self):
        Draft202012Validator.check_schema(SCHEMA)

    def test_every_record_validates(self):
        self.assertGreaterEqual(len(RECORDS), 8)
        for r in RECORDS:
            self.assertEqual(errors(r), [], r["ruling_id"])

    def test_measured_state_field_is_rejected(self):
        for key in ("state", "measured_state", "separation", "grade"):
            r = copy.deepcopy(RECORDS[0])
            r[key] = "MEASURED"
            self.assertTrue(errors(r), key)

    def test_effect_cannot_write_state_or_board(self):
        for key in ("writes_measured_state", "writes_board"):
            r = copy.deepcopy(RECORDS[0])
            r["effect"][key] = True
            self.assertTrue(errors(r), key)

    def test_rule_output_origin_is_rule(self):
        r = copy.deepcopy(next(x for x in RECORDS if x["rule_output"]))
        r["rule_output"]["origin"] = "owner"
        self.assertTrue(errors(r))

    def test_bad_class_and_verdict(self):
        r = copy.deepcopy(RECORDS[0])
        r["class"] = "vote"
        self.assertTrue(errors(r))
        r = copy.deepcopy(RECORDS[0])
        r["reviewers"] = [{"provider": "p", "model": "m", "verdict": "APPROVE", "rationale_hash": "a" * 64}]
        self.assertTrue(errors(r))

    def test_n_eff_is_a_string_or_unmeasured(self):
        r = copy.deepcopy(RECORDS[0])
        r["panel_n_eff"] = 1.5
        self.assertTrue(errors(r))


if __name__ == "__main__":
    unittest.main()
