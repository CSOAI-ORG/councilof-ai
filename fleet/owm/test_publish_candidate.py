import copy
import json
import pathlib
import tempfile
import unittest

import publish_candidate as p


def snapshot(at="2026-09-30T00:00:00Z"):
    subjects = [
        {
            "id": "a",
            "state": "CONSISTENT",
            "evidence_sha256": "a" * 64,
            "next_check": "2026-09-30T00:30:00Z",
        }
    ]
    stages = [
        {
            "stage": "capture",
            "status": "LIVE",
            "components": [
                {"label": "x", "status": "LIVE", "newest_output": at, "missed_cycles": 0}
            ],
        }
    ]
    return {
        "schema": p.SCHEMA,
        "title": "fixture",
        "generated_at": at,
        "run_id": at,
        "stale_after_s": 21600,
        "counts": {
            "subjects": 1,
            "by_state": {
                "CONSISTENT": 1,
                "INCONSISTENT": 0,
                "SINGLE_SURFACE": 0,
                "UNCHECKABLE": 0,
                "UNMEASURED": 0,
            },
            "stages": 1,
            "by_stage_status": {"LIVE": 1, "STAGED": 0, "MISSING": 0},
            "stale_components": 0,
        },
        "stages": stages,
        "subjects": subjects,
        "signature": {"state": "UNSIGNED", "reason": "new kind"},
        "events_head": {"seq": 1, "sha256": "b" * 64, "appended_this_cycle": 0},
    }


class PublishCandidateTests(unittest.TestCase):
    def test_valid_fixture(self):
        self.assertEqual(p.validate(snapshot()), [])

    def test_counts_fail_closed(self):
        s = snapshot()
        s["counts"]["subjects"] = 9
        self.assertIn("count_subjects", p.validate(s))

    def test_host_path_leak_fails(self):
        s = snapshot()
        s["subjects"][0]["reason"] = "read /workspace/private/result.json"
        self.assertIn("host_path_leak", p.validate(s))

    def test_cadence_only_is_held(self):
        old = snapshot("2026-09-30T00:00:00Z")
        new = snapshot("2026-09-30T00:30:00Z")
        new["subjects"][0]["next_check"] = "2026-09-30T01:00:00Z"
        new["stages"][0]["components"][0]["newest_output"] = "2026-09-30T00:30:00Z"
        d = p.decide(new, old, max_interval_s=14400)
        self.assertFalse(d["publish"])
        self.assertEqual(d["reason"], "cadence_only")

    def test_same_semantics_refreshes_after_interval(self):
        old = snapshot("2026-09-30T00:00:00Z")
        new = snapshot("2026-09-30T04:00:00Z")
        new["subjects"][0]["next_check"] = "2026-09-30T04:30:00Z"
        new["stages"][0]["components"][0]["newest_output"] = "2026-09-30T04:00:00Z"
        d = p.decide(new, old, max_interval_s=14400)
        self.assertTrue(d["publish"])
        self.assertEqual(d["reason"], "freshness_refresh")

    def test_evidence_change_publishes_immediately(self):
        old = snapshot("2026-09-30T00:00:00Z")
        new = snapshot("2026-09-30T00:30:00Z")
        new["subjects"][0]["evidence_sha256"] = "c" * 64
        d = p.decide(new, old, max_interval_s=14400)
        self.assertTrue(d["publish"])
        self.assertEqual(d["reason"], "semantic_change")

    def test_reordering_is_not_change(self):
        old = snapshot("2026-09-30T00:00:00Z")
        old["subjects"].append(dict(old["subjects"][0], id="b", evidence_sha256="d" * 64))
        old["stages"][0]["components"].append({"label": "y", "status": "LIVE", "newest_output": "x", "missed_cycles": 0})
        old["counts"]["subjects"] = 2
        old["counts"]["by_state"]["CONSISTENT"] = 2
        new = copy.deepcopy(old)
        new["generated_at"] = new["run_id"] = "2026-09-30T00:30:00Z"
        new["subjects"].reverse()
        new["stages"][0]["components"].reverse()
        self.assertEqual(p.validate(new), [])
        d = p.decide(new, old, max_interval_s=14400)
        self.assertFalse(d["publish"])
        self.assertEqual(d["reason"], "cadence_only")
        # a real edit hidden in a re-ordered list is still a change
        new["subjects"][0]["evidence_sha256"] = "e" * 64
        self.assertEqual(p.decide(new, old, max_interval_s=14400)["reason"], "semantic_change")

    def test_older_candidate_is_held(self):
        old = snapshot("2026-09-30T01:00:00Z")
        new = snapshot("2026-09-30T00:30:00Z")
        d = p.decide(new, old)
        self.assertFalse(d["publish"])
        self.assertEqual(d["reason"], "candidate_not_newer")

    def test_apply_writes_exact_source_bytes(self):
        with tempfile.TemporaryDirectory() as td:
            root = pathlib.Path(td)
            source = root / "source.json"
            target = root / "target.json"
            old = snapshot("2026-09-30T00:00:00Z")
            new = snapshot("2026-09-30T00:30:00Z")
            new["subjects"][0]["state"] = "INCONSISTENT"
            new["counts"]["by_state"]["CONSISTENT"] = 0
            new["counts"]["by_state"]["INCONSISTENT"] = 1
            source.write_text(json.dumps(new, indent=1) + "\n")
            target.write_text(json.dumps(old, indent=1) + "\n")
            rc = p.main(["--source", str(source), "--target", str(target), "--apply"])
            self.assertEqual(rc, 0)
            self.assertEqual(target.read_bytes(), source.read_bytes())


if __name__ == "__main__":
    unittest.main()
