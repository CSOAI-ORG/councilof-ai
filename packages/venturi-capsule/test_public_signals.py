# SPDX-License-Identifier: Apache-2.0
# SPDX-FileCopyrightText: 2026 CSOAI
"""public_signals adapter tests with must-fail controls. Fixture = the shape signals.py writes (small)."""
import json, pathlib, shutil, tempfile, unittest
import venturi_capsule as v
from adapters import PendingSource, public_signals as ps

H = "a" * 64


def sig(id_, value, state="MEASURED", cls="MIXED_UNSEPARABLE", names=None, reason=None, rsha=H):
    s = {"id": id_, "group": id_.split(".")[0], "label": id_, "value": value, "unit": "count", "window": None, "state": state,
         "reason": reason, "self_or_external": cls, "source_url": "https://example.test/" + id_, "fetched_at": "2026-09-26T06:00:00Z",
         "response_sha256": rsha, "http_status": 200 if state != "UNCHECKABLE" else 503, "flags": [], "note": None}
    if names is not None:
        s["names"] = names
    return s


def record(date, signals):
    return {"schema": "csoai.public-signals/0.1", "date": date, "as_of": date + "T06:05:00Z", "signals": signals, "files": {}}


class Fx:
    def __init__(self):
        self.root = pathlib.Path(tempfile.mkdtemp())

    def day(self, date, signals, fetch_log=b'{"key":"x"}\n'):
        d = self.root / date
        d.mkdir()
        (d / "fetch-log.jsonl").write_bytes(fetch_log)
        rec = record(date, signals)
        rec["files"] = {"fetch-log.jsonl": {"sha256": v.file_sha(d / "fetch-log.jsonl"), "bytes": len(fetch_log)}}
        (d / "record.json").write_text(json.dumps(rec))
        return d

    def caps(self, src=None):
        st = {}
        return list(ps.capsules(str(src or self.root), st)), st


BASE = [sig("revenue.one_number.all_time", 1, cls="EXTERNAL"), sig("revenue.one_number.self_settlements", 22, cls="SELF"),
        sig("pypi.csoai-gspc.downloads_total", None, "UNCHECKABLE", reason="HTTP_429", rsha=None),
        sig("index.smithery.listed", 2, cls="SELF", names=["mcp:gspc@1.4.2", "pypi:x"])]


class PublicSignals(unittest.TestCase):
    def setUp(self):
        self.fx = Fx()

    def tearDown(self):
        shutil.rmtree(self.fx.root, ignore_errors=True)

    def test_one_capsule_per_signal_states_and_classes_carried(self):
        self.fx.day("2026-09-26", BASE)
        caps, st = self.fx.caps()
        self.assertEqual(len(caps), 4)
        by = {c["subject_id"]: c for c in caps}
        self.assertEqual(by["revenue.one_number.all_time"]["claim"]["self_or_external"], "EXTERNAL")
        self.assertEqual(by["revenue.one_number.self_settlements"]["claim"]["self_or_external"], "SELF")
        u = by["pypi.csoai-gspc.downloads_total"]
        self.assertEqual((u["measurement_state"], u["observed"]["value"]), ("UNCHECKABLE", None))
        self.assertIn("HTTP_429", u["limitations"])
        self.assertEqual(st["by_state"], {"MEASURED": 3, "UNCHECKABLE": 1})
        for c in caps:
            self.assertEqual(v.capsule_id(c), c["capsule_id"])
            self.assertIsNone(v.jcs_divergence(c))
            self.assertEqual(v.authority_violations(c), [])
            self.assertEqual(v.non_digest_sources(c["sources"]), [])

    def test_changes_by_name_against_previous_day(self):
        self.fx.day("2026-09-25", [sig("index.smithery.listed", 2, cls="SELF", names=["mcp:gspc@1.4.2", "pypi:y"])])
        self.fx.day("2026-09-26", BASE)
        caps, _ = self.fx.caps()
        c = {c["subject_id"]: c for c in caps}["index.smithery.listed"]
        pd = c["differential"]["previous_day"]
        self.assertEqual((pd["value_changed"], pd["names_added"], pd["names_removed"]), (False, ["pypi:x"], ["pypi:y"]))

    def test_deterministic_root(self):
        self.fx.day("2026-09-26", BASE)
        a, _ = self.fx.caps()
        b, _ = self.fx.caps()
        self.assertEqual(v.merkle_root([c["capsule_id"] for c in a]), v.merkle_root([c["capsule_id"] for c in b]))

    def test_batch_builds(self):
        self.fx.day("2026-09-26", BASE)
        out = self.fx.root / "batch"
        st = {}
        rec = v.write_batch(out, ps.NAME, ps.KIND, ps.capsules(str(self.fx.root), st), lambda: ps.meta(None, st))
        res, _, ids = v.verify_batch(out, check_signature=False)
        self.assertEqual((rec["n_capsules"], res["capsules"]), (4, 4))

    # ---- must-fail controls
    def test_control_absent_source_is_pending_not_empty(self):
        with self.assertRaises(PendingSource):
            self.fx.caps()

    def test_control_tampered_pinned_file_refused(self):
        d = self.fx.day("2026-09-26", BASE)
        (d / "fetch-log.jsonl").write_bytes(b'{"key":"forged"}\n')
        with self.assertRaises(SystemExit):
            self.fx.caps()

    def test_control_self_signal_cannot_become_external(self):
        """a record that relabels a SELF signal changes the capsule id: the class is bound into the leaf."""
        self.fx.day("2026-09-26", BASE)
        a = {c["subject_id"]: c for c in self.fx.caps()[0]}["revenue.one_number.self_settlements"]
        forged = json.loads(json.dumps(a)); forged["claim"]["self_or_external"] = "EXTERNAL"
        self.assertNotEqual(v.capsule_id(forged), a["capsule_id"])

    def test_control_authority_value_refused(self):
        bad = [sig("x.y", "ALLOW", cls="SELF")]
        self.fx.day("2026-09-26", bad)
        with self.assertRaises(ValueError):
            self.fx.caps()


if __name__ == "__main__":
    unittest.main()
