"""Unit tests on synthetic data: a planted change, and no change. They prove the code, not the method.

    python3 -m unittest scripts/silent-change/test_silent_change.py
"""
import json
import random
import sys
import tempfile
import threading
import unittest
from http.server import BaseHTTPRequestHandler, HTTPServer
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
import collect  # noqa: E402
import detector  # noqa: E402
import watch  # noqa: E402

LABELS = ["A", "B", "C"]


def synth_batch(rng, n_items=20, k=30, dist=None, moved=()):
    """Each item has its own answer distribution; items in `moved` have it replaced."""
    out = {}
    for i in range(n_items):
        w = dist[i]
        if i in moved:
            w = w[::-1]
        out["it%02d" % i] = rng.choices(LABELS, weights=w, k=k)
    return out


def make_dist(rng, n_items=20):
    d = []
    for _ in range(n_items):
        main = rng.randrange(3)
        w = [0.05, 0.05, 0.05]
        w[main] = 0.9
        d.append(w)
    return d


class ProtocolBinding(unittest.TestCase):
    def test_protocol_values_are_the_registered_ones(self):
        p = detector.load_protocol()
        self.assertEqual(p["repeats_k"], 30)
        self.assertEqual(p["flag_rule"]["alpha"], 0.01)
        self.assertEqual(p["flag_rule"]["t_floor"], 0.03)
        self.assertEqual(p["statistic"]["permutations_b"], 2000)
        self.assertFalse(p["watch"]["paid_models_enabled"])

    def test_registration_precedes_code_in_git_history(self):
        import subprocess
        root = HERE.parent.parent
        def first_commit(path):
            out = subprocess.run(["git", "log", "--diff-filter=A", "--format=%ct", "--", path],
                                 cwd=root, capture_output=True, text=True).stdout.split()
            return int(out[-1]) if out else None
        proto, code = first_commit("docs/research/silent-change/protocol.json"), first_commit("scripts/silent-change/detector.py")
        if proto is None or code is None:
            self.skipTest("not in a git checkout with history")
        self.assertLessEqual(proto, code)


class SyntheticPlantedAndNone(unittest.TestCase):
    def test_planted_change_is_flagged_every_time(self):
        hits = 0
        for seed in range(10):
            rng = random.Random(100 + seed)
            dist = make_dist(rng)
            base = synth_batch(rng, dist=dist)
            new = synth_batch(rng, dist=dist, moved=range(0, 20, 2))   # half the items change
            r = detector.compare(base, new, "planted-%d" % seed, permutations=400)
            hits += r["state"] == "FLAG"
        self.assertEqual(hits, 10)

    def test_no_change_is_not_flagged(self):
        flags = 0
        for seed in range(30):
            rng = random.Random(500 + seed)
            dist = make_dist(rng)
            base = synth_batch(rng, dist=dist)
            new = synth_batch(rng, dist=dist)
            r = detector.compare(base, new, "none-%d" % seed, permutations=400)
            flags += r["state"] == "FLAG"
        self.assertEqual(flags, 0)

    def test_small_planted_change_below_floor_is_not_a_flag(self):
        rng = random.Random(7)
        dist = make_dist(rng)
        base = synth_batch(rng, dist=dist)
        new = {k: list(v) for k, v in base.items()}
        new["it00"][0] = "C" if new["it00"][0] != "C" else "B"      # one answer in 600 moves
        r = detector.compare(base, new, "tiny", permutations=400)
        self.assertEqual(r["state"], "NO_FLAG")

    def test_deterministic_model_that_changes_answer_is_flagged(self):
        base = {"it%02d" % i: ["A"] * 30 for i in range(20)}
        new = {k: list(v) for k, v in base.items()}
        for i in range(5):
            new["it%02d" % i] = ["B"] * 30
        r = detector.compare(base, new, "det", permutations=400)
        self.assertEqual(r["state"], "FLAG")
        self.assertAlmostEqual(r["T"], 0.25, places=6)

    def test_same_inputs_same_p_value(self):
        rng = random.Random(3)
        dist = make_dist(rng)
        base, new = synth_batch(rng, dist=dist), synth_batch(rng, dist=dist, moved=[1, 2, 3])
        a = detector.compare(base, new, "same", permutations=300)
        b = detector.compare(base, new, "same", permutations=300)
        self.assertEqual(a, b)

    def test_incomparable_item_sets_and_k(self):
        base = {"a": ["A"] * 30}
        self.assertEqual(detector.compare(base, {"b": ["A"] * 30}, "x")["state"], "INCOMPARABLE")
        self.assertEqual(detector.compare(base, {"a": ["A"] * 29}, "x")["state"], "INCOMPARABLE")

    def test_result_has_no_cause_and_no_ranking_fields(self):
        base = {"a": ["A"] * 30}
        r = detector.compare(base, {"a": ["B"] * 30}, "x", permutations=100)
        text = json.dumps(r).lower()
        for banned in ("rank", "cause_is", "certif", "unsafe", "degrad"):
            self.assertNotIn(banned, text)
        self.assertIn("does_not_say", r)


class CalibrationRates(unittest.TestCase):
    def test_rates_and_intervals(self):
        results = {"C0": [{"state": "NO_FLAG", "T": 0.0}] * 30,
                   "C1": [{"state": "FLAG", "T": 0.2}] * 7 + [{"state": "NO_FLAG", "T": 0.0}] * 3 + [{"state": "INCOMPARABLE"}]}
        r = detector.calibration_rates(results)
        self.assertEqual(r["C0"]["flags"], 0)
        self.assertGreater(r["C0"]["wilson95"][1], 0.1)       # 0 of 30 does not prove a tiny rate
        self.assertEqual(r["C1"]["rate"], 0.7)
        self.assertEqual(r["C1"]["incomparable"], 1)
        self.assertEqual(r["C0"]["role"], "false-flag rate")


class Items(unittest.TestCase):
    def test_selection_is_deterministic_and_order_free(self):
        bank = [("item %d" % i, "X") for i in range(40)]
        a = collect.select_items(bank, "provenance", 10)
        b = collect.select_items(list(reversed(bank)), "provenance", 10)
        self.assertEqual(a, b)
        self.assertEqual(len(a), 10)

    def test_commitment_ignores_order(self):
        self.assertEqual(collect.items_commitment(["b", "a"]), collect.items_commitment(["a", "b"]))


class FakeEndpoint(unittest.TestCase):
    """A local OpenAI-compatible server stands in for a model: real HTTP, no real model."""
    @classmethod
    def setUpClass(cls):
        cls.answer = "A"
        outer = cls

        class H(BaseHTTPRequestHandler):
            def do_POST(self):
                n = int(self.headers["Content-Length"])
                body = json.loads(self.rfile.read(n))
                outer.last = body
                payload = json.dumps({"choices": [{"message": {"content": outer.answer}}]}).encode()
                self.send_response(200)
                self.send_header("Content-Length", str(len(payload)))
                self.end_headers()
                self.wfile.write(payload)

            def log_message(self, *a):
                pass
        cls.srv = HTTPServer(("127.0.0.1", 0), H)
        threading.Thread(target=cls.srv.serve_forever, daemon=True).start()
        cls.url = "http://127.0.0.1:%d/v1" % cls.srv.server_port

    @classmethod
    def tearDownClass(cls):
        cls.srv.shutdown()

    def items(self):
        return [("lane:%02d" % i, "prompt %d" % i, "lane") for i in range(3)], {"lane": ["A", "B"]}

    def test_batch_over_http_shuffled_and_counted(self):
        items, labels = self.items()
        send = collect.openai_compat_send(self.url)
        self.__class__.answer = "A"
        out = collect.run_batch(items, labels, send, {"model": "m", "system": "sys"}, 4, 1)
        self.assertEqual(out["transport_errors"], 0)
        self.assertTrue(all(v == ["A"] * 4 for v in out["answers"].values()))
        self.assertEqual(self.last["messages"][0], {"role": "system", "content": "sys"})

    def test_unparsed_is_a_category_not_an_error(self):
        items, labels = self.items()
        self.__class__.answer = "I would rather not say"
        out = collect.run_batch(items, labels, collect.openai_compat_send(self.url), {"model": "m"}, 2, 1)
        self.assertEqual(out["answers"]["lane:00"], ["UNPARSED"] * 2)
        self.assertEqual(out["transport_errors"], 0)

    def test_transport_failure_makes_batch_uncheckable_not_a_flag(self):
        items, labels = self.items()
        dead = collect.openai_compat_send("http://127.0.0.1:9/v1")
        orig = collect.time.sleep
        collect.time.sleep = lambda s: None
        try:
            out = collect.run_batch(items, labels, dead, {"model": "m"}, 2, 1)
        finally:
            collect.time.sleep = orig
        ids = [i[0] for i in items]
        batch = watch.make_batch_record("open:x", {"model": "m"}, ids, {}, 2, out)
        self.assertEqual(batch["state"], "UNCHECKABLE")
        with tempfile.TemporaryDirectory() as d:
            rec = watch.decide(Path(d), "x", batch, "c")
            self.assertEqual(rec["state"], "UNCHECKABLE")
            self.assertFalse((Path(d) / "x" / "baseline.json").exists())


class BaselineLifecycle(unittest.TestCase):
    def batch(self, rng, dist, moved=(), target="open:x"):
        ans = synth_batch(rng, dist=dist, moved=moved)
        ids = sorted(ans)
        return {"state": "COLLECTED", "target": target, "taken_at": "t", "protocol": detector.protocol_sha256(),
                "answers_sha256": collect.batch_digest(ans), "k": 30, "answers": ans, "model": "m",
                "items_commitment": collect.items_commitment(ids)}

    def test_first_run_sets_baseline_then_compares_then_rebaseline_names_old(self):
        rng = random.Random(11)
        dist = make_dist(rng)
        with tempfile.TemporaryDirectory() as d:
            d = Path(d)
            r1 = watch.decide(d, "x", self.batch(rng, dist), "c1")
            self.assertEqual(r1["state"], "BASELINE_SET")
            r2 = watch.decide(d, "x", self.batch(rng, dist, moved=range(0, 20, 2)), "c2")
            self.assertEqual(r2["state"], "FLAG")
            self.assertIn("baseline_sha256", r2)
            # a flag stays a flag against the same baseline
            r3 = watch.decide(d, "x", self.batch(rng, dist, moved=range(0, 20, 2)), "c3")
            self.assertEqual(r3["state"], "FLAG")
            r4 = watch.decide(d, "x", self.batch(rng, dist, moved=range(0, 20, 2)), "c4", rebaseline=True)
            self.assertEqual(r4["state"], "BASELINE_SET")
            self.assertEqual(r4["replaces_baseline_sha256"], r2["baseline_sha256"])

    def test_compact_payload_fits_signer_cap_and_carries_unmeasured(self):
        rng = random.Random(12)
        dist = make_dist(rng)
        with tempfile.TemporaryDirectory() as d:
            b = self.batch(rng, dist)
            watch.decide(Path(d), "x", b, "c1")
            rec = watch.decide(Path(d), "x", self.batch(rng, dist, moved=[0, 1, 2, 3, 4, 5]), "c2")
        p = watch.compact_payload(rec, "NOT_YET_MEASURED")
        self.assertLess(len(json.dumps(p, sort_keys=True, separators=(",", ":"))), 3072)
        self.assertIn("weights", p["unmeasured"])
        self.assertNotIn("per_item_tv", p)
        import re
        self.assertIsNone(re.search(r"\b(THIN|TEMPLATE)\b", json.dumps(p)))


class PaidGate(unittest.TestCase):
    def write(self, d, **over):
        cfg = json.loads((HERE / "paid_models.json").read_text())
        cfg.update(over.pop("top", {}))
        cfg["models"][0]["terms"].update(over)
        p = Path(d) / "paid.json"
        p.write_text(json.dumps(cfg))
        return p

    def test_shipped_file_refuses_every_paid_model(self):
        for m in json.loads((HERE / "paid_models.json").read_text())["models"]:
            with self.assertRaises(SystemExit):
                watch.paid_gate(m["key"])

    def test_enabled_without_a_person_still_refuses(self):
        with tempfile.TemporaryDirectory() as d:
            with self.assertRaises(SystemExit):
                watch.paid_gate("deepseek-chat", self.write(d, top={"paid_models_enabled": True}))

    def test_enabled_with_person_and_date_passes(self):
        with tempfile.TemporaryDirectory() as d:
            p = self.write(d, top={"paid_models_enabled": True}, confirmed_by_person="role:owner", confirmed_on="2026-12-01")
            self.assertEqual(watch.paid_gate("deepseek-chat", p)["provider"], "deepseek")

    def test_own_council_model_refused_even_when_confirmed(self):
        with tempfile.TemporaryDirectory() as d:
            cfg = json.loads((HERE / "paid_models.json").read_text())
            cfg["paid_models_enabled"] = True
            cfg["models"][0]["own_council"] = True
            cfg["models"][0]["terms"].update(confirmed_by_person="role:owner", confirmed_on="2026-12-01")
            p = Path(d) / "p.json"
            p.write_text(json.dumps(cfg))
            with self.assertRaises(SystemExit):
                watch.paid_gate("deepseek-chat", p)

    def test_workflow_paid_job_is_hard_off_and_signs_only_on_master(self):
        text = (HERE.parent.parent / ".github" / "workflows" / "silent-change-watch.yml").read_text()
        watch_block = text.split("  watch:\n", 1)[1]
        self.assertIn("if: false &&", watch_block.splitlines()[0])
        self.assertEqual(text.count("sign --payload"), text.count("github.ref == 'refs/heads/master'"))
        self.assertNotIn("workflow_dispatch.inputs.paid", text)

    def test_signing_refused_off_actions(self):
        import os
        for k in ("ACTIONS_ID_TOKEN_REQUEST_URL", "GITHUB_ACTIONS"):
            os.environ.pop(k, None)
        with self.assertRaises(SystemExit):
            watch.cmd_sign(type("A", (), {"payload": "x", "out": "y"})())


if __name__ == "__main__":
    unittest.main()
