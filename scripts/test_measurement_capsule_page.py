# SPDX-License-Identifier: Apache-2.0
# SPDX-FileCopyrightText: 2026 CSOAI
"""measurement_capsule_page.py states only what the files beside the page say, and checks the signature it reports."""
import hashlib, json, pathlib, sys, tempfile, unittest

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
import measurement_capsule_page as page  # noqa: E402

INDEX = {"schema": "csoai.measurement-capsule-index/0.3", "date": "2026-11-23", "as_of": "2026-11-23T08:06:00Z",
         "n_capsules_total": 3, "index_root": "ab" * 32, "chain_seq": 29, "prev_date": "2026-11-04", "prev_index_sha256": "cd" * 32,
         "gap_days": 18, "missing_dates": [f"2026-11-{d:02d}" for d in range(5, 23)], "genesis": None,
         "freshness": {"rule": "r", "adapters": {"self_parity": {"state": "NOT_UPDATED", "last_good_date": "2026-10-25"}}},
         "pending_source": [{"adapter": "self_parity_daily_source", "why": "NOT_UPDATED: <carried>"}],
         "publication": {"state": "PUBLIC", "approved": "2026-09-26"},
         "batches": [{"adapter": "self_parity", "kind": "measurement.self_parity", "n_capsules": 3, "merkle_root": "ef" * 32,
                      "signature_state": "VERIFIES", "ots_state": "BITCOIN_ATTESTED", "states": {"CONSISTENT": 3}}]}


class Page(unittest.TestCase):
    def setUp(self):
        self.d = pathlib.Path(tempfile.mkdtemp())
        (self.d / "index.json").write_text(json.dumps(INDEX))

    def test_values_come_from_the_index_and_absent_files_are_said_to_be_absent(self):
        out = page.render(self.d)
        self.assertIn("Current index dated <strong>2026-11-23</strong>", out)
        self.assertIn("3 capsules in 1 batch.", out)
        self.assertIn("index.signed.json: <strong>absent</strong>", out)
        self.assertIn("index.json.ots: <strong>absent</strong>", out)
        self.assertIn("18 declared gap days (<code>2026-11-05</code> to <code>2026-11-22</code>)", out)
        self.assertIn("Rekor: no entry is recorded for this index in anchors.json.", out)
        self.assertIn("&lt;carried&gt;", out)  # text from a file is escaped
        self.assertNotIn("1 November", out)

    def test_a_signature_that_does_not_pin_these_bytes_is_reported_as_failing(self):
        raw = (self.d / "index.json").read_bytes()
        payload = {"artifact": {"sha256": "00" * 32}}
        pre = json.dumps(payload, sort_keys=True, separators=(",", ":")).encode()
        (self.d / "index.signed.json").write_text(json.dumps({"payload": payload, "signature": {
            "did": page.BOARD_DID, "sig_ed25519": "00" * 64, "payload_sha256": hashlib.sha256(pre).hexdigest()}}))
        self.assertEqual(page.signature_check(json.loads((self.d / "index.signed.json").read_text()), hashlib.sha256(raw).hexdigest()),
                         "FAILS (the signed payload pins other index bytes)")
        self.assertIn("<strong>FAILS (the signed payload pins other index bytes)</strong>", page.render(self.d))

    def test_a_forged_signature_over_the_right_payload_fails_ed25519(self):
        raw = (self.d / "index.json").read_bytes()
        payload = {"artifact": {"sha256": hashlib.sha256(raw).hexdigest()}}
        pre = json.dumps(payload, sort_keys=True, separators=(",", ":")).encode()
        s = {"payload": payload, "signature": {"sig_ed25519": "11" * 64, "payload_sha256": hashlib.sha256(pre).hexdigest()}}
        self.assertTrue(page.signature_check(s, hashlib.sha256(raw).hexdigest()).startswith("FAILS (Ed25519"))


if __name__ == "__main__":
    unittest.main()
