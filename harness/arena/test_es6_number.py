#!/usr/bin/env python3
"""RFC 8785 / ES6 NumberToString vectors.

Gold spellings are what ES6 `Number.prototype.toString` emits for that binary64.
CPython json.dumps / repr are listed only to prove they are the wrong algorithm
for Rule B (JCS / catalog / board). Rule A cards keep the CPython column.
"""
import math
import os
import subprocess
import sys
import unittest

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from jcs import canonicalize, es6_number_to_string  # noqa: E402


# (python float, ES6/JCS spelling, CPython json.dumps(float) spelling)
VECTORS = [
    (0.0, "0", "0.0"),
    (-0.0, "0", "-0.0"),  # json.dumps(-0.0) keeps the minus; JCS/ES do not
    (1.0, "1", "1.0"),
    (-1.0, "-1", "-1.0"),
    (1.5, "1.5", "1.5"),
    (0.1, "0.1", "0.1"),
    (1e-4, "0.0001", "0.0001"),
    (1e-5, "0.00001", "1e-05"),
    (1e-6, "0.000001", "1e-06"),
    (1e-7, "1e-7", "1e-07"),
    (1e20, "100000000000000000000", "1e+20"),
    (1e21, "1e+21", "1e+21"),
    (1.23e21, "1.23e+21", "1.23e+21"),
    (2.0, "2", "2.0"),
]


class Es6NumberToString(unittest.TestCase):
    def test_rfc8785_cutoffs(self):
        self.assertEqual(es6_number_to_string(0.0), "0")
        self.assertEqual(es6_number_to_string(-0.0), "0")
        self.assertEqual(es6_number_to_string(1.0), "1")
        self.assertEqual(es6_number_to_string(-1.0), "-1")
        self.assertEqual(es6_number_to_string(1e-6), "0.000001")
        self.assertEqual(es6_number_to_string(1e-7), "1e-7")
        self.assertEqual(es6_number_to_string(1e20), "100000000000000000000")
        self.assertEqual(es6_number_to_string(1e21), "1e+21")
        self.assertEqual(es6_number_to_string(1.23e21), "1.23e+21")

    def test_object_wraps_numbers(self):
        self.assertEqual(canonicalize({"a": 0.0}), '{"a":0}')
        self.assertEqual(canonicalize({"a": 1e-6}), '{"a":0.000001}')
        self.assertEqual(canonicalize({"a": 1e-7}), '{"a":1e-7}')

    def test_nonfinite_rejected(self):
        with self.assertRaises(ValueError):
            es6_number_to_string(math.nan)
        with self.assertRaises(ValueError):
            es6_number_to_string(math.inf)

    def test_cpython_json_is_a_different_dialect(self):
        import json
        self.assertEqual(json.dumps(0.0), "0.0")
        self.assertEqual(json.dumps(1.0), "1.0")
        self.assertEqual(json.dumps(1e-6), "1e-06")
        self.assertNotEqual(json.dumps(0.0), es6_number_to_string(0.0))
        self.assertNotEqual(json.dumps(1e-6), es6_number_to_string(1e-6))

    def test_matches_node_number_tostring_when_present(self):
        try:
            subprocess.run(["node", "-e", "process.exit(0)"], check=True, capture_output=True)
        except (OSError, subprocess.CalledProcessError):
            self.skipTest("node not on PATH")
        import json
        script = (
            "const vs=JSON.parse(require('fs').readFileSync(0,'utf8'));"
            "process.stdout.write(JSON.stringify(vs.map(n=>Number.prototype.toString.call(n))));"
        )
        payload = json.dumps([v for v, _, _ in VECTORS])
        js = subprocess.run(
            ["node", "-e", script],
            input=payload, capture_output=True, text=True, check=True,
        ).stdout
        spelled = json.loads(js)
        for (value, gold, _cpy), got in zip(VECTORS, spelled):
            self.assertEqual(es6_number_to_string(value), gold, msg="gold for %r" % value)
            self.assertEqual(got, gold, msg="node ToString for %r" % value)


if __name__ == "__main__":
    unittest.main()
