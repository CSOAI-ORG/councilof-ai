# SPDX-License-Identifier: Apache-2.0
"""The daily report withholds held axes, and check_report.py refuses a report that restates them, names a banned
phrase, or carries no valid signature."""
import base64, datetime, json, pathlib, sys, tempfile, unittest

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
import check_report  # noqa: E402
import generate_daily_report as g  # noqa: E402

from cryptography.hazmat.primitives import serialization as ser  # noqa: E402
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey  # noqa: E402

NOW = datetime.datetime(2026, 11, 22, 9, 30, tzinfo=datetime.timezone.utc)
API = {"axes": [
    {"axis": "governance", "status": "MEASURED", "kind": "model-comparison", "n": 237, "accuracy": 0.5865, "interval": [0.5, 0.6],
     "leader": "m1", "separation": "TIE", "note": "a note", "measurement_time": {"state": "DAY", "observed_on": "2026-11-01"}},
    {"axis": "watchdog-ingest", "status": "MEASURED", "kind": "measured-subject", "n": 106, "note": "share 0.41",
     "measurement_time": {"state": "DAY", "observed_on": "2026-11-02"}},
    {"axis": "safety", "status": "MEASURED", "kind": "model-comparison", "n": 36, "accuracy": 0.9444, "leader": "m2",
     "separation": "TIE", "measurement_time": {"state": "DAY", "observed_on": "2026-11-01"}}]}
RANKINGS = {"axes": {"governance": {"models": [{"rank": 1, "arm": "m1", "accuracy": 0.5865}]},
                     "safety": {"models": [{"rank": 1, "arm": "m2", "accuracy": 0.9444}]}}}


class Withholding(unittest.TestCase):
    def test_held_axes_keep_their_state_and_lose_every_figure(self):
        out = g.build_axis_sections(API, RANKINGS, None, NOW)
        gov, wd, safe = out["governance"], out["watchdog-ingest"], out["safety"]
        for a, entry in ((gov, "C-2026-1120-02"), (wd, "C-2026-1120-01")):
            self.assertEqual(a["derived_state"], "MEASURED")
            self.assertTrue(all(a[k] is None for k in g.WITHHELD_FIELDS))
            self.assertEqual(a["top3"], [])
            self.assertEqual(a["withheld"]["entry"], entry)
        self.assertIn("EU AI Act correctly", gov["limit"])
        self.assertEqual(safe["accuracy"], 0.9444)  # an axis that is not held is untouched
        self.assertEqual(safe["top3"][0]["arm"], "m2")

    def test_a_held_axis_is_never_diffed_against_the_previous_report(self):
        prev = {"report_date": "2026-11-21", "axes": {"governance": {"derived_state": "MEASURED", "separation": "TIE",
                                                                     "leader": "m0", "top3": [{"arm": "m0"}]}}}
        out = g.build_axis_sections(API, RANKINGS, prev, NOW)
        self.assertEqual(out["governance"]["changes_vs_previous"],
                         ["withheld under C-2026-1120-02: no comparison with the previous report is published"])
        ch = g.build_changes_section(out, prev, {"ledger_rows": None}, None, {})
        self.assertEqual(ch["rank_changes"], [])


def write_report(d, report, md):
    raw = json.dumps(report, sort_keys=True).encode()
    (d / "daily-report-2026-11-22.json").write_bytes(raw)
    (d / "daily-report-2026-11-22.md").write_text(md)
    k = Ed25519PrivateKey.generate()
    spki = k.public_key().public_bytes(ser.Encoding.DER, ser.PublicFormat.SubjectPublicKeyInfo)
    (d / "daily-report-2026-11-22.sig").write_text(json.dumps({
        "signature": base64.b64encode(k.sign(raw)).decode(), "public_key_spki_b64": base64.b64encode(spki).decode(),
        "signed_file_sha256": __import__("hashlib").sha256(raw).hexdigest()}))


class Gate(unittest.TestCase):
    def setUp(self):
        self.d = pathlib.Path(tempfile.mkdtemp())
        self.holds = json.loads((pathlib.Path(g.__file__).parent / "holds.json").read_text())
        why = self.holds["entries"]["C-2026-1120-02"]["why"]
        lim = self.holds["entries"]["C-2026-1120-02"]["limit"]
        self.report = {"axes": {"governance": {"withheld": {"entry": "C-2026-1120-02"}, "top3": []}},
                       "frontier": {"state": "WITHHELD"}, "signature": {"signature_file": "daily-report-2026-11-22.sig"}}
        self.md = f"### 1. governance — MEASURED\n\n- {why}\n- limit: {lim}\n"

    def run_check(self):
        return check_report.check(self.d, "2026-11-22", self.holds)

    def test_a_clean_signed_report_passes(self):
        write_report(self.d, self.report, self.md)
        r = self.run_check()
        self.assertEqual((r["result"], r["signature"]), ("PASS", "VERIFIES"), r["violations"])

    def test_a_held_figure_fails(self):
        self.report["axes"]["governance"]["accuracy"] = 0.5865
        write_report(self.d, self.report, self.md)
        self.assertEqual(self.run_check()["result"], "FAIL")

    def test_a_banned_phrase_fails(self):
        write_report(self.d, self.report, self.md + "\nMEOK scored 219/237.\n")
        r = self.run_check()
        self.assertEqual(r["result"], "FAIL")
        self.assertTrue(any("219/237" in v for v in r["violations"]))

    def test_a_missing_limit_fails(self):
        write_report(self.d, self.report, self.md.split("- limit:")[0])
        self.assertEqual(self.run_check()["result"], "FAIL")

    def test_an_unsigned_report_fails(self):
        write_report(self.d, self.report, self.md)
        (self.d / "daily-report-2026-11-22.sig").write_text(json.dumps({"signature": None, "note": "UNSIGNED"}))
        self.assertEqual(self.run_check()["signature"], "UNSIGNED")
        self.assertEqual(self.run_check()["result"], "FAIL")

    def test_bytes_changed_after_signing_fail(self):
        write_report(self.d, self.report, self.md)
        p = self.d / "daily-report-2026-11-22.json"
        p.write_bytes(p.read_bytes() + b" ")
        self.assertEqual(self.run_check()["signature"], "FAILS")


if __name__ == "__main__":
    unittest.main()
