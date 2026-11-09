# SPDX-License-Identifier: Apache-2.0
"""The input trace digest is not a separately verified configuration digest."""
import unittest
from test_nemo_guardrails_strict import event, trace


class TraceProvenanceTests(unittest.TestCase):
    def test_digest_names_actual_hashed_object(self):
        ev = event(trace())
        self.assertIn('trace sha256:' + ev['claim']['source_sha256'], ev['subject']['declared_by'])
        self.assertNotIn('config sha256:', ev['subject']['declared_by'])


if __name__ == '__main__':
    unittest.main()
