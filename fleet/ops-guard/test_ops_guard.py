#!/usr/bin/env python3
"""Tests for fleet/ops-guard (stdlib only, no network): python3 -m unittest fleet/ops-guard/test_ops_guard.py"""
import fcntl, importlib.util, json, os, subprocess, sys, tempfile, time, unittest
from datetime import datetime, timezone, timedelta

HERE = os.path.dirname(os.path.abspath(__file__))


def load(name):
    spec = importlib.util.spec_from_file_location(name.replace("-", "_"), os.path.join(HERE, name + ".py"))
    m = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(m)
    return m


novelty = load("output-novelty")
canary = load("prod-canary")
alert = load("runpod-balance-alert")


class Novelty(unittest.TestCase):
    def test_timestamps_masked_dates_kept(self):
        a = novelty.norm_line("2026-09-28T14:50:09Z VM still unreachable took 12s pid=4411")
        b = novelty.norm_line("2026-09-28T15:00:02Z VM still unreachable took 3s pid=9")
        self.assertEqual(a, b)
        self.assertNotEqual(novelty.norm_line("date=2026-09-27 built"), novelty.norm_line("date=2026-09-28 built"))

    def test_failure_lines_are_not_output(self):
        self.assertEqual(novelty.log_novelty(["rc=1 state=FAILED step=backup_pod"], []), ("REPEAT", 0))
        self.assertEqual(novelty.log_novelty(["rows 1275"], ["rows 1274"]), ("NEW", 1))
        self.assertEqual(novelty.log_novelty(["rows 1274"], ["rows 1274"]), ("REPEAT", 0))

    def test_json_volatile_keys_dropped(self):
        a = novelty.norm_json({"at": "2026-09-28T00:00:00Z", "n": 3, "generated_at": "x"})
        b = novelty.norm_json({"at": "2026-09-29T00:00:00Z", "n": 3, "generated_at": "y"})
        self.assertEqual(a, b)
        self.assertNotEqual(a, novelty.norm_json({"n": 4}))

    def test_period(self):
        self.assertEqual(novelty.period_s("*/10 * * * *"), 600)
        self.assertEqual(novelty.period_s("7,22,37,52 * * * *"), 900)
        self.assertEqual(novelty.period_s("30 23 * * *"), 86400)
        self.assertEqual(novelty.period_s("0 2 * * 0"), 7 * 86400)
        self.assertIsNone(novelty.period_s("@reboot"))

    def test_lock_of(self):
        self.assertEqual(novelty.lock_of("flock -n /tmp/eat_remote.lock ~/eat_remote_battery.sh"), "/tmp/eat_remote.lock")
        self.assertIsNone(novelty.lock_of("bash ~/oracle-fleet-status.sh"))

    @unittest.skipUnless(os.path.isdir("/proc/self/fd"), "needs /proc")
    def test_lock_holder_found(self):
        with tempfile.TemporaryDirectory() as d:
            lk = os.path.join(d, "x.lock")
            p = subprocess.Popen([sys.executable, "-c",
                                  "import fcntl,time;f=open(%r,'w');fcntl.flock(f,fcntl.LOCK_EX);print('ok',flush=True);time.sleep(30)" % lk],
                                 stdout=subprocess.PIPE)
            try:
                p.stdout.readline()
                hs = novelty.lock_holders([lk])[lk]
                self.assertIn(p.pid, [h["pid"] for h in hs])
            finally:
                p.kill(); p.wait()


class Canary(unittest.TestCase):
    def test_sse_data_line_parsed(self):
        body = ('event: message\ndata: {"jsonrpc":"2.0","id":1,"result":{"tools":[%s]}}\n\n'
                % ",".join('{"name":"t%d"}' % i for i in range(12)))
        orig = canary.fetch
        canary.fetch = lambda url, data=None, headers=None: (200, body)
        try:
            r = canary.check_mcp()
        finally:
            canary.fetch = orig
        self.assertEqual(r["value"], 12)

    def test_rolling_root_allows_small_churn(self):
        now = datetime(2026, 9, 29, 17, 0, tzinfo=timezone.utc)
        ok, min_count, age_h = canary.evaluate_root(308, "2026-09-29T05:03:20Z", 310, now)
        self.assertTrue(ok)
        self.assertEqual(min_count, 295)
        self.assertLess(age_h, 12)

    def test_rolling_root_rejects_material_drop(self):
        now = datetime(2026, 9, 29, 17, 0, tzinfo=timezone.utc)
        ok, min_count, _ = canary.evaluate_root(290, "2026-09-29T05:03:20Z", 310, now)
        self.assertFalse(ok)
        self.assertEqual(min_count, 295)

    def test_rolling_root_rejects_stale_root(self):
        now = datetime(2026, 9, 29, 17, 0, tzinfo=timezone.utc)
        ok, _, age_h = canary.evaluate_root(310, "2026-09-27T05:03:20Z", 310, now)
        self.assertFalse(ok)
        self.assertGreater(age_h, canary.MAX_ROOT_AGE_H)


class Alert(unittest.TestCase):
    def setUp(self):
        self.d = tempfile.mkdtemp()
        for k in ("FUND", "WLOG", "LOG", "STATE", "OUT"):
            setattr(alert, k, os.path.join(self.d, k.lower()))
        alert.read_api = lambda: {"error": "no api in tests"}

    def write(self, at, bal, spend):
        json.dump({"at": at.strftime("%Y-%m-%dT%H:%M:%SZ"), "balance_usd": bal, "spend_usd_per_hr": spend},
                  open(alert.FUND, "w"))

    def log(self):
        return open(alert.LOG).read()

    def test_alert_then_clear(self):
        now = datetime.now(timezone.utc)
        self.write(now, 6.0, 0.6)
        self.assertEqual(alert.main(), 2)
        self.assertIn(" ALERT runway_h=10.0", self.log())
        self.write(now, 24.0, 0.6)
        self.assertEqual(alert.main(), 0)
        self.assertIn(" CLEAR runway_h=40.0", self.log())

    def test_stale_reading_is_aged(self):
        self.write(datetime.now(timezone.utc) - timedelta(hours=30), 24.0, 0.6)  # 40 h at read, 10 h now
        self.assertEqual(alert.main(), 2)
        self.assertIn("STALE", self.log())
        self.assertIn(" ALERT runway_h=10.0", self.log())

    def test_nothing_readable_is_error(self):
        self.assertEqual(alert.main(), 1)
        self.assertIn(" ERROR ", self.log())


if __name__ == "__main__":
    unittest.main()
