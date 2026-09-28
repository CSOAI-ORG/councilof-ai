#!/usr/bin/env python3
"""Tests for fleet/owm/owm.py (stdlib, no network): python3 -m unittest fleet/owm/test_owm.py"""
import copy
import json
import os
import sys
import tempfile
import unittest
from datetime import datetime, timedelta, timezone

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import owm  # noqa: E402

NOW = datetime(2026, 9, 28, 21, 13, tzinfo=timezone.utc)
REGISTRY = os.path.join(os.path.dirname(os.path.abspath(__file__)), "owm-registry.json")


def base_cfg(tmp):
    return {
        "cycle": {"id": "owm-cycle", "schedule": "13,43 * * * *", "stale_after_cycles": 2, "grace_s": 3900,
                  "novelty_max_age_s": 7200, "publish_stale_after_s": 21600},
        "sources": {"jobs_registry": os.path.join(tmp, "jobs_registry.json"),
                    "novelty": os.path.join(tmp, "novelty.json"),
                    "flywheel_status": os.path.join(tmp, "flywheel.json"), "base_url": "https://example.invalid"},
        "stages": [
            {"stage": "capture", "order": 1, "label": "capture",
             "components": [{"job": "daily-a", "label": "a"}, {"job": "owm-cycle", "label": "self"}]},
            {"stage": "dependency_index", "order": 4, "label": "deps",
             "components": [{"missing": "not built", "label": "m"}]},
            {"stage": "land", "order": 9, "label": "land",
             "components": [{"job": "stopped", "label": "s"}, {"staged": "off", "label": "t"}]},
        ],
        "subjects": [
            {"id": "own:x", "label": "x", "kind": "own_surface", "claim": "c", "schedule_job": "owm-cycle",
             "sources": [{"id": "a", "type": "http", "url": "/a", "fields": {"n": "n", "r": "root"}},
                         {"id": "b", "type": "http", "url": "/b", "fields": {"n": "meta.n.value"}}]},
            {"id": "obs:f", "label": "f", "kind": "capture", "claim": "c", "schedule_job": "daily-a",
             "sources": [{"id": "f", "type": "local_file", "label": "a record", "path": os.path.join(tmp, "rec-*.json")}]},
        ],
        "excluded": [],
    }


def write(path, obj):
    with open(path, "w") as f:
        json.dump(obj, f)


def novelty(tmp, newest_daily, at=NOW):
    write(os.path.join(tmp, "novelty.json"), {"at": owm.iso(at), "jobs": [
        {"id": "daily-a", "schedule": "20 4 * * *", "verdict": "IDLE_SINCE_LAST_CHECK", "newest_output": owm.iso(newest_daily)},
        {"id": "stopped", "schedule": None, "verdict": "HOST_STOPPED+NEW", "newest_output": "2026-09-27T00:00:00Z"}]})
    write(os.path.join(tmp, "jobs_registry.json"), {"generated_at": owm.iso(at), "jobs": [
        {"id": "daily-a", "status": "FRESH"}, {"id": "stopped", "status": "DEAD"}]})


def fetcher(pages):
    def f(base, url):
        if url not in pages:
            return 404, b""
        p = pages[url]
        return (p[0], json.dumps(p[1]).encode()) if isinstance(p, tuple) else (200, json.dumps(p).encode())
    return f


def paths(tmp):
    return owm.paths_for({"outputs": {}}, os.path.join(tmp, "out"))


class Cron(unittest.TestCase):
    def test_periods(self):
        self.assertEqual(owm.cron_period_s("13,43 * * * *", NOW), 1800)
        self.assertEqual(owm.cron_period_s("20 4 * * *", NOW), 86400)
        self.assertEqual(owm.cron_period_s("0 2 * * 0", NOW), 7 * 86400)
        self.assertEqual(owm.cron_period_s("3-59/10 * * * *", NOW), 600)
        self.assertEqual(owm.cron_period_s("7,22,37,52 * * * *", NOW), 900)
        self.assertEqual(owm.cron_period_s("20 */3 * * *", NOW), 3 * 3600)
        self.assertIsNone(owm.cron_period_s("@reboot", NOW))

    def test_next(self):
        self.assertEqual(owm.cron_next("13,43 * * * *", NOW), NOW.replace(minute=43))
        self.assertEqual(owm.cron_next("20 4 * * *", NOW), datetime(2026, 9, 29, 4, 20, tzinfo=timezone.utc))
        # 2026-09-28 is a Monday; the next Sunday 02:00 is 4 Oct
        self.assertEqual(owm.cron_next("0 2 * * 0", NOW), datetime(2026, 10, 4, 2, 0, tzinfo=timezone.utc))


class Components(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.mkdtemp()
        self.cfg = base_cfg(self.tmp)

    def comp(self, newest):
        novelty(self.tmp, newest)
        jobs = owm.load_jobs(self.cfg, NOW)
        return owm.eval_component({"job": "daily-a", "label": "a"}, jobs, self.cfg, NOW, "owm-cycle")

    def test_live_within_two_cycles(self):
        c = self.comp(NOW - timedelta(hours=40))
        self.assertEqual(c["status"], "LIVE")
        self.assertEqual(c["missed_cycles"], 1)

    def test_stale_after_two_missed_cycles(self):
        c = self.comp(NOW - timedelta(days=2, hours=2))
        self.assertEqual(c["status"], "STALE")
        self.assertGreaterEqual(c["missed_cycles"], 2)

    def test_host_stopped_is_off_and_missing_job_is_missing(self):
        novelty(self.tmp, NOW)
        jobs = owm.load_jobs(self.cfg, NOW)
        self.assertEqual(owm.eval_component({"job": "stopped", "label": "s"}, jobs, self.cfg, NOW, "x")["status"], "OFF")
        self.assertEqual(owm.eval_component({"job": "nowhere", "label": "n"}, jobs, self.cfg, NOW, "x")["status"], "MISSING")

    def test_stale_novelty_reader_makes_every_job_stale_not_live(self):
        novelty(self.tmp, NOW, at=NOW - timedelta(hours=5))
        jobs = owm.load_jobs(self.cfg, NOW)
        c = owm.eval_component({"job": "daily-a", "label": "a"}, jobs, self.cfg, NOW, "x")
        self.assertEqual(c["status"], "STALE")

    def test_stage_rule(self):
        self.assertEqual(owm.stage_status([{"status": "STALE"}, {"status": "LIVE"}]), "LIVE")
        self.assertEqual(owm.stage_status([{"status": "OFF"}, {"status": "STAGED"}]), "STAGED")
        self.assertEqual(owm.stage_status([{"status": "MISSING"}]), "MISSING")


class Subjects(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.mkdtemp()
        self.cfg = base_cfg(self.tmp)
        self.subj = self.cfg["subjects"][0]

    def ev(self, pages, subj=None):
        return owm.eval_subject(subj or self.subj, self.cfg, NOW, fetcher(pages), {}, False)

    def test_consistent(self):
        r = self.ev({"/a": {"n": 3, "root": "ab"}, "/b": {"meta": {"n": {"value": 3}}}})
        self.assertEqual(r["state"], "CONSISTENT")
        self.assertRegex(r["evidence_sha256"], "^[0-9a-f]{64}$")

    def test_inconsistent_names_the_field(self):
        r = self.ev({"/a": {"n": 3, "root": "ab"}, "/b": {"meta": {"n": {"value": 4}}}})
        self.assertEqual(r["state"], "INCONSISTENT")
        self.assertEqual(r["diffs"][0]["field"], "n")

    def test_one_surface_down_is_uncheckable_not_consistent(self):
        r = self.ev({"/a": {"n": 3, "root": "ab"}, "/b": (500, {})})
        self.assertEqual(r["state"], "UNCHECKABLE")

    def test_not_deployed_is_unmeasured(self):
        self.assertEqual(self.ev({})["state"], "UNMEASURED")

    def test_single_surface_and_declared_check(self):
        s = {"id": "own:y", "label": "y", "kind": "own_surface", "claim": "c",
             "sources": [{"id": "a", "type": "http", "url": "/a", "fields": {"sig": "sig"}}],
             "ok_if": {"sig": ["VALID"]}, "on_fail": "INCONSISTENT"}
        self.assertEqual(self.ev({"/a": {"sig": "VALID"}}, s)["state"], "SINGLE_SURFACE")
        self.assertEqual(self.ev({"/a": {"sig": "STALE"}}, s)["state"], "INCONSISTENT")

    def test_evidence_digest_ignores_bytes_outside_the_compared_fields(self):
        a = self.ev({"/a": {"n": 3, "root": "ab", "generated": 1}, "/b": {"meta": {"n": {"value": 3}}}})
        b = self.ev({"/a": {"n": 3, "root": "ab", "generated": 2}, "/b": {"meta": {"n": {"value": 3}}}})
        self.assertEqual(a["evidence_sha256"], b["evidence_sha256"])


class Cycle(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.mkdtemp()
        self.cfg = base_cfg(self.tmp)
        write(os.path.join(self.tmp, "rec-2026-09-28.json"), {"x": 1})
        self.pages = {"/a": {"n": 3, "root": "ab"}, "/b": {"meta": {"n": {"value": 3}}}}

    def cycle(self, now=NOW, pages=None):
        return owm.run_cycle(self.cfg, now, paths(self.tmp), fetch=fetcher(pages or self.pages))

    def events(self):
        with open(paths(self.tmp)["events"]) as f:
            return [json.loads(line) for line in f]

    def test_events_are_hash_linked_and_only_on_change(self):
        novelty(self.tmp, NOW - timedelta(hours=10))
        rc, internal, public, lines = self.cycle()
        self.assertEqual(rc, 0)
        ev = self.events()
        self.assertEqual([e["change_state"] for e in ev], ["FIRST_SEEN", "FIRST_SEEN"])
        self.assertIsNone(ev[0]["prev_sha256"])
        self.assertEqual(ev[1]["prev_sha256"], owm.sha256_bytes(owm.canon(ev[0])))
        self.cycle(NOW + timedelta(minutes=30))
        self.assertEqual(len(self.events()), 2, "an unchanged cycle appends nothing")
        changed = copy.deepcopy(self.pages)
        changed["/b"]["meta"]["n"]["value"] = 4
        rc, internal, public, _ = self.cycle(NOW + timedelta(minutes=60), changed)
        ev = self.events()
        self.assertEqual(ev[-1]["object_id"], "own:x")
        self.assertEqual(ev[-1]["change_state"], "CHANGED")
        self.assertEqual(ev[-1]["object_state"], "INCONSISTENT")
        self.assertEqual(ev[-1]["prev_sha256"], owm.sha256_bytes(owm.canon(ev[-2])))
        row = next(s for s in public["subjects"] if s["id"] == "own:x")
        self.assertEqual(row["last_change"], owm.iso(NOW + timedelta(minutes=60)))

    def test_dead_mans_switch_writes_stale_then_rc3_summary(self):
        novelty(self.tmp, NOW - timedelta(days=3))
        rc, internal, public, lines = self.cycle()
        self.assertEqual(rc, 3)
        self.assertTrue(lines[0].split()[1] == "STALE" and "job=daily-a" in lines[0])
        self.assertTrue(lines[-1].endswith("rc=3") and "STALE jobs=daily-a" in lines[-1])
        with open(paths(self.tmp)["log"]) as f:
            last = f.read().strip().splitlines()[-1]
        self.assertTrue(last.endswith("rc=3"), "the supervisor reads the last line: must_contain rc=0 fails")
        hb = json.load(open(paths(self.tmp)["heartbeat"]))
        self.assertEqual(hb["stale_jobs"][0]["job"], "daily-a")

    def test_own_gap_is_reported_on_resume(self):
        novelty(self.tmp, NOW - timedelta(hours=10))
        self.cycle(NOW - timedelta(hours=3))
        rc, _, _, lines = self.cycle()
        self.assertTrue(any("job=owm-cycle" in ln and "STALE" in ln for ln in lines))

    def test_stage_statuses_and_public_view(self):
        novelty(self.tmp, NOW - timedelta(hours=10))
        rc, internal, public, _ = self.cycle()
        st = {s["stage"]: s["status"] for s in public["stages"]}
        self.assertEqual(st, {"capture": "LIVE", "dependency_index": "MISSING", "land": "STAGED"})
        raw = json.dumps(public)
        self.assertNotIn(self.tmp, raw, "the public view carries labels, never a host path")
        self.assertNotIn("daily-a", raw, "the public view carries labels, never a job id")
        self.assertEqual(public["signature"]["state"], "UNSIGNED")
        self.assertEqual(sum(public["counts"]["by_state"].values()), len(public["subjects"]))
        f = next(s for s in public["subjects"] if s["id"] == "obs:f")
        self.assertEqual(f["state"], "SINGLE_SURFACE")
        self.assertEqual(f["next_check"], "2026-09-29T04:20:00Z")


class Registry(unittest.TestCase):
    def test_registry_is_well_formed(self):
        with open(REGISTRY) as f:
            cfg = json.load(f)
        self.assertEqual([s["stage"] for s in sorted(cfg["stages"], key=lambda s: s["order"])],
                         ["capture", "observation_store", "change_detection", "dependency_index", "recheck",
                          "state", "sign", "capsule", "land"])
        ids = [s["id"] for s in cfg["subjects"]]
        self.assertEqual(len(ids), len(set(ids)))
        self.assertTrue(any(s["kind"] == "own_surface" for s in cfg["subjects"]))
        for s in cfg["subjects"]:
            for src in s["sources"]:
                self.assertIn(src["type"], ("http", "local_json", "local_file", "flywheel_job", "claim_watch"))
                if src["type"] != "http":
                    self.assertTrue(src.get("label"), "a local source needs a public label: %s" % s["id"])
        blob = json.dumps(cfg["subjects"]).lower()
        for word in ("pulse", "verity", "venturi", "pontius", "sovos"):
            self.assertNotIn(word, blob, "no company or internal name in subject rows")


if __name__ == "__main__":
    unittest.main()
