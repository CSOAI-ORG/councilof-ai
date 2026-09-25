"""Offline tests for the fleet supervisor (stdlib unittest; no network, no Hub, no cron).

    python3 fleet/test_fleet.py
"""
from __future__ import annotations

import datetime
import json
import os
import shutil
import sys
import tempfile
import unittest

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import fleetlib as fl  # noqa: E402
import supervisor as sv  # noqa: E402

T0 = datetime.datetime(2026, 9, 25, 12, 0, 0, tzinfo=fl.UTC)


def wt(path, text):
    with open(path, "w") as fh:
        fh.write(text)


def wj(path, obj):
    wt(path, json.dumps(obj))


def mins(n):
    return datetime.timedelta(minutes=n)


class FakeDispatcher:
    def __init__(self, results=None):
        self.calls, self.results = [], results or {}

    def dispatch(self, job, tgt):
        self.calls.append((job["id"], tgt.get("name", tgt["type"])))
        return dict(self.results.get(tgt.get("name", tgt["type"]), {"status": "DISPATCHED", "ref": "fake:1"}))

    def poll(self, rec):
        return rec.get("status"), None


class Base(unittest.TestCase):
    def setUp(self):
        self.d = tempfile.mkdtemp()
        self.funding = os.path.join(self.d, "funding.json")
        self.sig = os.path.join(self.d, "sig.json")
        self.policy = {"primary_host": "oracle", "retry": {"same_host_max": 1, "wait_s": 1200},
                       "budget": {"funding_state": self.funding, "funding_max_age_s": 3600, "runpod_requires_level": "GREEN",
                                  "caps_per_day": {"hf_jobs_cpu": 5, "hf_jobs_gpu": 0, "runpod_backup": 5, "kaggle": 2}}}

    def tearDown(self):
        shutil.rmtree(self.d, ignore_errors=True)

    def set_funding(self, level, at=T0):
        wj(self.funding, {"at": fl.iso(at), "level": level, "runway_h": 10})

    def set_signal(self, at):
        wj(self.sig, {"at": fl.iso(at)})

    def job(self, **kw):
        j = {"id": "j1", "host": "oracle", "schedule": "*/15 * * * *", "command": "true", "supervise": "active",
             "class": "production", "portable": "root-check",
             "health": {"type": "json_field_age", "path": self.sig, "field": "at", "max_age_s": 1800},
             "failover": [{"type": "hf_job", "name": "hf", "flavor": "cpu-basic", "secrets": ["HF_TOKEN"]},
                          {"type": "runpod_backup", "name": "rp"}],
             "failover_cooldown_s": 3600}
        j.update(kw)
        return j

    def run_pass(self, cfg, state, now, disp, spawned, host="oracle", store=None, holder=None, alog=None):
        return sv.supervise(cfg, state, now, host, alog, disp, {}, spawn=lambda j: spawned.append(j["id"]) or 4242,
                            lease_store=store, lease_holder=holder)


class TestRetryThenFailover(Base):
    def test_stale_retry_then_failover_then_wait(self):
        self.set_funding("GREEN")
        self.set_signal(T0 - mins(60))  # 60 min old, max 30 -> STALE
        cfg = {"policy": self.policy, "jobs": [self.job()]}
        state, disp, spawned = {"jobs": {}, "budget": {}}, FakeDispatcher(), []
        alog = fl.ActionLog(os.path.join(self.d, "a.jsonl"))
        s1 = self.run_pass(cfg, state, T0, disp, spawned, alog=alog)
        self.assertEqual(s1["jobs"]["j1"]["state"], "STALE")
        self.assertEqual(s1["jobs"]["j1"]["decision"], "retry")
        self.assertEqual(spawned, ["j1"])
        s2 = self.run_pass(cfg, state, T0 + mins(10), disp, spawned, alog=alog)
        self.assertEqual(s2["jobs"]["j1"]["decision"], "wait")  # retry's health not due yet
        s3 = self.run_pass(cfg, state, T0 + mins(25), disp, spawned, alog=alog)
        self.assertEqual(s3["jobs"]["j1"]["decision"], "failover")
        self.assertEqual(disp.calls, [("j1", "hf")])
        s4 = self.run_pass(cfg, state, T0 + mins(35), disp, spawned, alog=alog)
        self.assertEqual(s4["jobs"]["j1"]["decision"], "wait")  # the failover covers this period
        self.assertEqual(len(disp.calls), 1)
        self.assertEqual(spawned, ["j1"])  # retried exactly once
        ok, n = alog.verify()
        self.assertTrue(ok)
        self.assertGreaterEqual(n, 2)
        # recovery clears the streak
        self.set_signal(T0 + mins(40))
        s5 = self.run_pass(cfg, state, T0 + mins(41), disp, spawned, alog=alog)
        self.assertEqual(s5["jobs"]["j1"]["state"], "OK")
        self.assertEqual(state["jobs"]["j1"]["retries"], [])

    def test_chain_advances_after_failed_target(self):
        self.set_funding("GREEN", T0 + mins(30))
        self.set_signal(T0 - mins(60))
        cfg = {"policy": self.policy, "jobs": [self.job()]}
        state, spawned = {"jobs": {}, "budget": {}}, []
        disp = FakeDispatcher({"hf": {"status": "FAILED", "why": "boom"}, "rp": {"status": "SUCCEEDED", "ref": "runpod:x"}})
        self.run_pass(cfg, state, T0, disp, spawned)
        self.run_pass(cfg, state, T0 + mins(25), disp, spawned)
        self.run_pass(cfg, state, T0 + mins(35), disp, spawned)
        self.assertEqual(disp.calls, [("j1", "hf"), ("j1", "rp")])

    def test_observe_jobs_never_act(self):
        self.set_signal(T0 - mins(600))
        cfg = {"policy": self.policy, "jobs": [self.job(supervise="observe")]}
        state, disp, spawned = {"jobs": {}, "budget": {}}, FakeDispatcher(), []
        s = self.run_pass(cfg, state, T0, disp, spawned)
        self.assertEqual(s["jobs"]["j1"]["decision"], "record")
        self.assertEqual((spawned, disp.calls), ([], []))

    def test_other_hosts_jobs_are_not_retried_here(self):
        self.set_signal(T0 - mins(600))
        cfg = {"policy": self.policy, "jobs": [self.job(host="pod:x")]}
        state, disp, spawned = {"jobs": {}, "budget": {}}, FakeDispatcher(), []
        s = self.run_pass(cfg, state, T0, disp, spawned)
        self.assertEqual(s["jobs"]["j1"]["decision"], "none")
        self.assertEqual(spawned, [])


class TestBudgetAndFunding(Base):
    def test_red_blocks_runpod(self):
        self.set_funding("RED")
        j = self.job(failover=[{"type": "runpod_backup", "name": "rp"}])
        ok, why = fl.target_allowed(j, j["failover"][0], self.policy, {"budget": {}}, T0)
        self.assertFalse(ok)
        self.assertIn("RED", why)
        self.set_funding("STOP")
        self.assertFalse(fl.target_allowed(j, j["failover"][0], self.policy, {"budget": {}}, T0)[0])
        self.set_funding("GREEN")
        self.assertTrue(fl.target_allowed(j, j["failover"][0], self.policy, {"budget": {}}, T0)[0])

    def test_stale_or_missing_funding_blocks_runpod(self):
        j = self.job(failover=[{"type": "runpod_backup", "name": "rp"}])
        self.assertFalse(fl.target_allowed(j, j["failover"][0], self.policy, {"budget": {}}, T0)[0])  # no file
        self.set_funding("GREEN", T0 - mins(120))
        ok, why = fl.target_allowed(j, j["failover"][0], self.policy, {"budget": {}}, T0)
        self.assertFalse(ok)
        self.assertIn("UNKNOWN", why)

    def test_red_run_blocks_runpod_end_to_end(self):
        self.set_funding("RED")
        self.set_signal(T0 - mins(60))
        cfg = {"policy": self.policy, "jobs": [self.job(failover=[{"type": "runpod_backup", "name": "rp"}])]}
        state, disp, spawned = {"jobs": {}, "budget": {}}, FakeDispatcher(), []
        self.run_pass(cfg, state, T0, disp, spawned)
        s = self.run_pass(cfg, state, T0 + mins(25), disp, spawned)
        self.assertEqual(s["jobs"]["j1"]["action"]["action"], "failover_blocked")
        self.assertEqual(disp.calls, [])

    def test_daily_cap(self):
        pol = dict(self.policy, budget=dict(self.policy["budget"], caps_per_day={"hf_jobs_cpu": 1}))
        j = self.job()
        st = {"budget": {}}
        self.assertTrue(fl.target_allowed(j, j["failover"][0], pol, st, T0)[0])
        fl.budget_charge(st, "hf_job", "cpu-basic", T0)
        ok, why = fl.target_allowed(j, j["failover"][0], pol, st, T0)
        self.assertFalse(ok)
        self.assertIn("cap", why)
        self.assertTrue(fl.target_allowed(j, j["failover"][0], pol, st, T0 + datetime.timedelta(days=1))[0])

    def test_gpu_hf_budget_zero_by_default(self):
        j = self.job(gpu=True)
        tgt = {"type": "hf_job", "name": "t4", "flavor": "t4-small"}
        ok, why = fl.target_allowed(j, tgt, self.policy, {"budget": {}}, T0)
        self.assertFalse(ok)
        self.assertIn("hf_jobs_gpu", why)


class TestSandboxRule(Base):
    def test_experimental_refused_off_twin(self):
        j = self.job(**{"class": "experimental"})
        ok, why = fl.target_allowed(j, j["failover"][0], self.policy, {"budget": {}}, T0)
        self.assertFalse(ok)
        self.assertIn("sandbox", why)
        ok, why = fl.target_allowed(j, {"type": "proofof_twin", "secrets": ["HF_TOKEN"]}, self.policy, {"budget": {}}, T0)
        self.assertFalse(ok)


class TestLease(Base):
    def test_lease_prevents_double_run(self):
        s = fl.MemoryStore()
        won, _ = fl.take_lease(s, "job-x", "oracle", 600, T0)
        self.assertTrue(won)
        won2, cur = fl.take_lease(s, "job-x", "hf-twin", 600, T0 + mins(1))
        self.assertFalse(won2)
        self.assertEqual(cur["holder"], "oracle")
        self.assertTrue(fl.take_lease(s, "job-x", "oracle", 600, T0 + mins(2))[0])  # renew
        self.assertTrue(fl.take_lease(s, "job-x", "hf-twin", 600, T0 + mins(13))[0])  # expired -> taken
        self.assertTrue(fl.release_lease(s, "job-x", "hf-twin", T0 + mins(14)))
        self.assertTrue(fl.take_lease(s, "job-x", "oracle", 600, T0 + mins(14, ) + datetime.timedelta(seconds=1))[0])

    def test_cas_race_has_one_winner(self):
        s = fl.MemoryStore()
        _, rev = s.get("lease/job-y.json")
        self.assertTrue(s.put({"lease/job-y.json": {"holder": "a", "expires_at": fl.iso(T0 + mins(10)), "nonce": "1"}}, rev))
        self.assertFalse(s.put({"lease/job-y.json": {"holder": "b", "expires_at": fl.iso(T0 + mins(10)), "nonce": "2"}}, rev))
        self.assertEqual(s.get("lease/job-y.json")[0]["holder"], "a")

    def test_two_supervisors_one_failover(self):
        self.set_funding("GREEN")
        self.set_signal(T0 - mins(60))
        store = fl.MemoryStore()
        job = self.job(host="shared")
        cfg = {"policy": self.policy, "jobs": [job]}
        da, db = FakeDispatcher(), FakeDispatcher()
        sa, sb = {"jobs": {"j1": {"retries": [fl.iso(T0 - mins(30))]}}, "budget": {}}, {"jobs": {"j1": {"retries": [fl.iso(T0 - mins(30))]}}, "budget": {}}
        ra = sv.supervise(cfg, sa, T0, "shared", None, da, {}, spawn=lambda j: 1, lease_store=store, lease_holder="oracle")
        rb = sv.supervise(cfg, sb, T0 + mins(1), "shared", None, db, {}, spawn=lambda j: 1, lease_store=store, lease_holder="hf-twin")
        self.assertEqual(len(da.calls) + len(db.calls), 1)
        self.assertEqual(rb["jobs"]["j1"]["action"]["action"], "failover_skipped_lease")
        self.assertEqual(ra["jobs"]["j1"]["action"]["action"], "failover")


class TestHealth(Base):
    def test_pending_not_installed_unmeasured(self):
        j = self.job(health={"type": "log_last_line", "path": os.path.join(self.d, "nope.log"), "max_age_s": 60},
                     not_before=fl.iso(T0 + mins(60)))
        self.assertEqual(fl.evaluate_health(j, T0)["state"], "PENDING_FIRST_RUN")
        self.assertEqual(fl.evaluate_health(j, T0 + mins(61))["state"], "MISSING")
        j2 = self.job(cron_match="lanes/x.sh")
        self.assertEqual(fl.evaluate_health(j2, T0, {"crontab": "5 * * * * other"})["state"], "NOT_INSTALLED")
        self.assertEqual(fl.evaluate_health(self.job(health={"type": "none"}), T0)["state"], "UNMEASURED")
        self.assertEqual(fl.evaluate_health(self.job(health={"type": "remote"}), T0)["state"], "UNMEASURED")

    def test_log_line_and_fail_if(self):
        p = os.path.join(self.d, "x.log")
        wt(p, "2026-09-25T11:00:00Z rc=1 0 verified rows\n")
        j = self.job(health={"type": "log_last_line", "path": p, "max_age_s": 7200, "must_contain": "rc=0"})
        self.assertEqual(fl.evaluate_health(j, T0)["state"], "FAILED")
        wj(self.sig, {"at": fl.iso(T0), "level": "RED"})
        j = self.job(health={"type": "json_field_age", "path": self.sig, "field": "at", "max_age_s": 60, "fail_if": {"level": ["RED"]}})
        self.assertEqual(fl.evaluate_health(j, T0)["state"], "FAILED")

    def test_hub_read_failure_is_unmeasured_not_stale(self):
        def boom(*a):
            raise OSError("net")
        j = self.job(health={"type": "hf_repo_fresh", "repo": "x/y", "max_age_s": 60})
        self.assertEqual(fl.evaluate_health(j, T0, {"hf_last_modified": boom})["state"], "UNMEASURED")


class TestLog(Base):
    def test_tamper_detected(self):
        p = os.path.join(self.d, "a.jsonl")
        a = fl.ActionLog(p)
        for i in range(3):
            a.append({"i": i})
        self.assertEqual(a.verify(), (True, 3))
        with open(p) as fh:
            lines = fh.read().splitlines()
        lines[1] = lines[1].replace('"i":1', '"i":9')
        wt(p, "\n".join(lines) + "\n")
        self.assertFalse(a.verify()[0])


class TestSpray(Base):
    def rows(self):
        eps = ["https://a.example/m1", "https://a.example/m2", "https://a.example/m3", "https://b.example/m",
               "https://c.example/m", "https://c.example/n", "https://d.example/m", "https://e.example/x"]
        return [{"endpoint": e, "rank": i} for i, e in enumerate(eps)]

    def test_split_by_host_disjoint_and_deterministic(self):
        s1 = fl.assign_by_host(self.rows(), ["oracle", "hf", "kaggle"])
        s2 = fl.assign_by_host(list(reversed(self.rows())), ["oracle", "hf", "kaggle"])
        self.assertEqual(s1, s2)
        hosts = [set(fl.host_of(r["endpoint"]) for r in v) for v in s1.values()]
        for i in range(3):
            for k in range(i + 1, 3):
                self.assertFalse(hosts[i] & hosts[k])
        self.assertEqual(sum(len(v) for v in s1.values()), 8)
        self.assertTrue(all(v for v in s1.values()))

    def plan(self):
        s = fl.assign_by_host(self.rows(), ["oracle", "hf", "kaggle"])
        return {"shards": {k: {"endpoints": [r["endpoint"] for r in v], "hosts": sorted({fl.host_of(r["endpoint"]) for r in v})}
                           for k, v in s.items()}}, s

    def test_merge_complete_and_partial(self):
        plan, s = self.plan()
        mans = {k: {"endpoints_seen": v["endpoints"], "results_sha256": "x", "results_sha256_recomputed": "x",
                    "states": {"RESPONDED": len(v["endpoints"])}} for k, v in plan["shards"].items()}
        v = fl.merge_verdict(plan, mans)
        self.assertEqual(v["state"], "COMPLETE")
        self.assertEqual(v["totals"], {"RESPONDED": 8})
        mans2 = dict(mans, kaggle=None)
        v2 = fl.merge_verdict(plan, mans2)
        self.assertEqual(v2["state"], "PARTIAL")
        self.assertIsNone(v2["totals"])
        mans3 = dict(mans, hf=dict(mans["hf"], results_sha256_recomputed="y"))
        self.assertEqual(fl.merge_verdict(plan, mans3)["state"], "PARTIAL")
        mans4 = dict(mans, oracle=dict(mans["oracle"], endpoints_seen=mans["oracle"]["endpoints_seen"][:-1]))
        self.assertIsNone(fl.merge_verdict(plan, mans4)["totals"])

    def test_merge_rejects_host_on_two_shards(self):
        plan, _ = self.plan()
        plan["shards"]["hf"]["hosts"].append(plan["shards"]["oracle"]["hosts"][0])
        mans = {k: {"endpoints_seen": v["endpoints"], "results_sha256": "x", "results_sha256_recomputed": "x", "states": {}}
                for k, v in plan["shards"].items()}
        self.assertEqual(fl.merge_verdict(plan, mans)["state"], "PARTIAL")


class TestInventory(unittest.TestCase):
    def test_jobs_yaml_is_consistent(self):
        import portable
        cfg = fl.load_config(os.path.join(HERE, "jobs.yaml"))
        ids = {j["id"] for j in cfg["jobs"]}
        for jid in cfg["policy"]["twin_critical"]:
            self.assertIn(jid, ids)
        for j in cfg["jobs"]:
            if j.get("portable"):
                self.assertIn(j["portable"], portable.JOBS, j["id"])
            for t in j.get("failover", []):
                if t["type"] in ("hf_job", "runpod_backup") and j["supervise"] == "active":
                    self.assertTrue(j.get("portable"), j["id"])
            if j["supervise"] == "active":
                self.assertEqual(j["host"], cfg["policy"]["primary_host"], j["id"])
                self.assertIn("cron_match", j, j["id"])


if __name__ == "__main__":
    unittest.main(verbosity=1)
