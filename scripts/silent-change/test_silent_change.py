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
import plan as planmod  # noqa: E402
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


# ---- calibration on the runner: pins, matrix planner, combiner, workflow shape (addendum 2) ----------------

PINS = json.loads((detector.PROTOCOL_DIR / "calibration-pins.json").read_text())


class Pins(unittest.TestCase):
    def test_pins_agree_with_the_addendum_written_before_data(self):
        a2 = detector.load_protocol()["addendum_2"]
        for k, v in a2["open_model"]["files"].items():
            for field in ("repo", "revision", "filename", "sha256"):
                self.assertEqual(PINS["files"][k][field], v[field])
            self.assertRegex(v["revision"], r"^[0-9a-f]{40}$")
            self.assertRegex(v["sha256"], r"^[0-9a-f]{64}$")
        self.assertEqual(PINS["llama_cpp"]["ubuntu_x64"]["sha256"], a2["open_model"]["llama_cpp"]["sha256"])
        for c, spec in a2["conditions_as_run"].items():
            for field in ("file", "temperature", "system"):
                self.assertEqual(PINS["conditions"][c][field], spec[field], c)
        self.assertEqual(PINS["licence"], "apache-2.0")

    def test_the_four_known_changes_are_real_and_differ_from_the_baseline(self):
        c = PINS["conditions"]
        base = c["BASE"]
        self.assertNotEqual(c["C1"]["file"], base["file"])                 # sibling model
        self.assertNotEqual(PINS["files"][c["C1"]["file"]]["repo"], PINS["files"][base["file"]]["repo"])
        self.assertNotEqual(c["C2"]["file"], base["file"])                 # other quantisation, same weights
        self.assertEqual(PINS["files"][c["C2"]["file"]]["repo"], PINS["files"][base["file"]]["repo"])
        self.assertEqual(PINS["files"][c["C2"]["file"]]["revision"], PINS["files"][base["file"]]["revision"])
        self.assertTrue(c["C3"]["system"]) and self.assertIsNone(base["system"])
        self.assertNotEqual(c["C4"]["temperature"], base["temperature"])
        self.assertEqual({k: c["C0"][k] for k in ("file", "temperature", "system")},
                         {k: base[k] for k in ("file", "temperature", "system")})   # the no-change control is the same file again
        self.assertEqual({k: c["C5"][k] for k in ("file", "temperature", "system")},
                         {k: c["BASE5"][k] for k in ("file", "temperature", "system")})

    def test_planning_constants_are_filled(self):
        for f in PINS["files"]:
            self.assertGreater(PINS["plan"]["est_seconds_per_batch"][f], 0)


class MatrixPlanner(unittest.TestCase):
    def test_registered_batches_are_counted_from_the_protocol(self):
        p = detector.load_protocol()
        batches = planmod.expected_batches(p)
        self.assertEqual(len(batches), p["addendum_2"]["batch_total"])
        per = {}
        for b in batches:
            per[b["condition"]] = per.get(b["condition"], 0) + 1
        self.assertEqual(per, {"BASE": 1, "C0": 30, "C1": 10, "C2": 10, "C3": 10, "C4": 10, "BASE5": 1, "C5": 20})
        self.assertEqual(len({b["trial_id"] for b in batches}), len(batches))

    def test_every_batch_is_in_exactly_one_job_and_no_job_mixes_model_files(self):
        p = detector.load_protocol()
        rows = planmod.shards(p, PINS)
        seen = []
        for r in rows:
            ids = [x.split(":")[1] for x in r["batches"].split(",")]
            self.assertEqual(len(ids), r["n_batches"])
            for x in r["batches"].split(","):
                cond = x.split(":")[0]
                self.assertEqual(PINS["conditions"][cond]["file"], r["file"])
            seen += ids
        self.assertEqual(sorted(seen), sorted(b["trial_id"] for b in planmod.expected_batches(p)))
        self.assertEqual(len(seen), len(set(seen)))

    def test_every_job_is_planned_well_inside_the_runner_limit(self):
        p = detector.load_protocol()
        rows = planmod.shards(p, PINS)
        self.assertLessEqual(len(rows), 256)
        limit_min = p["addendum_2"]["runner_limits"]["job_time_limit_hours"] * 60
        for r in rows:
            self.assertLessEqual(r["planned_minutes"], PINS["plan"]["target_job_minutes"] + 1)
            self.assertLess(r["planned_minutes"] * 2, limit_min)     # at least a 2x margin to the 6 hour limit

    def test_smoke_scale_divides_trials_but_keeps_both_baselines(self):
        p = detector.load_protocol()
        small = planmod.expected_batches(p, 10)
        ids = [b["trial_id"] for b in small]
        self.assertIn("BASE-01", ids)
        self.assertIn("BASE5-01", ids)
        self.assertEqual(sum(1 for i in ids if i.startswith("C0-")), 3)
        self.assertLess(len(small), 20)

    def test_baseline_of_each_condition(self):
        self.assertEqual(planmod.baseline_of("C5"), "BASE5")
        self.assertEqual(planmod.baseline_of("C0"), "BASE")
        self.assertIsNone(planmod.baseline_of("BASE"))


def synth_calibration_dir(d, drop=(), change=None, bad_sha=None, rehearsal=None, uncheckable=()):
    """Write synthetic batches for every registered condition. `change` = {cond: moved items}. Proves the combiner only."""
    rng = random.Random(7)
    dist = make_dist(rng)
    proto = detector.load_protocol()
    for e in planmod.expected_batches(proto):
        c, tid = e["condition"], e["trial_id"]
        if tid in drop:
            continue
        pin = PINS["conditions"][c]
        f = PINS["files"][pin["file"]]
        moved = (change or {}).get(c, ())
        if c == "BASE5":
            moved = ()
        ans = synth_batch(rng, dist=dist, moved=moved)
        b = {"condition": c, "trial_id": tid, "state": "UNCHECKABLE" if tid in uncheckable else "COLLECTED", "k": 30,
             "model_revision": f["revision"],
             "serving": {"gguf_sha256": bad_sha if (bad_sha and tid == "C0-01") else f["sha256"], "llama_cpp_tag": PINS["llama_cpp"]["tag"]},
             "declared_sampling": {"temperature": pin["temperature"],
                                   "system_prompt_sha256": __import__("hashlib").sha256((pin["system"] or "").encode()).hexdigest()},
             "protocol": {"protocol_json": detector.load_protocol()["addendum_3"]["run_1_protocol_json_sha256"]}, "answers": ans}
        if rehearsal and tid == rehearsal:
            b["rehearsal"] = True
        (Path(d) / ("batch-%s.json" % tid)).write_text(json.dumps(b), encoding="utf-8")


class Combiner(unittest.TestCase):
    def run_report(self, d, **kw):
        import contextlib
        import io
        from unittest import mock
        quick = dict(detector.load_protocol())
        quick["statistic"] = dict(quick["statistic"], permutations_b=200)   # speed only; the registered b is tested elsewhere
        args = type("A", (), dict(dir=str(d), pins=str(detector.PROTOCOL_DIR / "calibration-pins.json"), scale=1, cusum=False,
                                  rehearsal=False, payload_out=str(Path(d) / "payload.json")))()
        for k, v in kw.items():
            setattr(args, k, v)
        buf = io.StringIO()
        with mock.patch.object(detector, "load_protocol", return_value=quick), contextlib.redirect_stdout(buf):
            watch.cmd_report(args)
        return json.loads(buf.getvalue()), json.loads((Path(d) / "payload.json").read_text())

    def test_complete_set_gives_rates_for_all_six_conditions_and_is_signable(self):
        with tempfile.TemporaryDirectory() as d:
            synth_calibration_dir(d, change={"C1": range(20), "C2": range(10), "C3": range(14), "C4": range(20)})
            rep, payload = self.run_report(d)
            self.assertTrue(rep["complete"])
            self.assertTrue(payload["complete"])
            self.assertEqual(sorted(rep["rates"]), ["C0", "C1", "C2", "C3", "C4", "C5"])
            self.assertEqual(rep["rates"]["C0"]["trials"], 30)
            self.assertEqual(rep["rates"]["C5"]["trials"], 20)
            self.assertEqual(rep["rates"]["C0"]["flags"], 0)
            self.assertEqual(rep["rates"]["C5"]["flags"], 0)
            self.assertEqual(rep["rates"]["C1"]["flags"], 10)
            self.assertEqual(rep["rates"]["C0"]["role"], "false-flag rate")
            self.assertEqual(rep["rates"]["C5"]["role"], "false-flag rate")
            self.assertEqual(rep["rates"]["C3"]["role"], "detection rate")
            self.assertEqual(rep["rates"]["C0"]["wilson95"], detector.wilson(0, 30))
            low = json.dumps(payload).lower()
            for word in ("unsafe", "degraded", "non-compliant", "certified", "token"):
                self.assertNotIn(word, low)

    def test_c5_is_compared_with_its_own_baseline_not_the_temperature_zero_one(self):
        with tempfile.TemporaryDirectory() as d:
            synth_calibration_dir(d)
            # make BASE very different from BASE5: if C5 were compared with BASE it would flag, with BASE5 it must not
            b = json.loads((Path(d) / "batch-BASE-01.json").read_text())
            b["answers"] = {k: [("A" if v[0] != "A" else "B")] * 30 for k, v in b["answers"].items()}
            (Path(d) / "batch-BASE-01.json").write_text(json.dumps(b))
            rep, _ = self.run_report(d)
            self.assertEqual(rep["rates"]["C5"]["flags"], 0)
            self.assertEqual(rep["rates"]["C0"]["flags"], 30)

    def test_a_missing_batch_is_named_and_the_report_is_not_signable(self):
        with tempfile.TemporaryDirectory() as d:
            synth_calibration_dir(d, drop={"C0-07"})
            rep, payload = self.run_report(d)
            self.assertFalse(rep["complete"])
            self.assertEqual(rep["missing"], ["C0-07"])
            self.assertFalse(payload["complete"])
            self.assertEqual(rep["rates"]["C0"]["trials"], 29)
            with self.assertRaises(SystemExit):
                self._sign(Path(d) / "payload.json")

    def _sign(self, payload):
        import os
        os.environ["ACTIONS_ID_TOKEN_REQUEST_URL"] = "https://example.invalid"
        os.environ["GITHUB_ACTIONS"] = "true"
        try:
            watch.cmd_sign(type("A", (), {"payload": str(payload), "out": str(payload) + ".signed"})())
        finally:
            os.environ.pop("ACTIONS_ID_TOKEN_REQUEST_URL", None)
            os.environ.pop("GITHUB_ACTIONS", None)

    def test_a_batch_that_does_not_match_its_pin_is_not_counted(self):
        with tempfile.TemporaryDirectory() as d:
            synth_calibration_dir(d, bad_sha="0" * 64)
            rep, _ = self.run_report(d)
            self.assertFalse(rep["complete"])
            self.assertIn("C0-01", rep["problems"])
            self.assertEqual(rep["rates"]["C0"]["incomparable"], 1)

    def test_an_uncheckable_batch_is_counted_out_not_read_as_unchanged(self):
        with tempfile.TemporaryDirectory() as d:
            synth_calibration_dir(d, uncheckable={"C2-03"})
            rep, _ = self.run_report(d)
            self.assertFalse(rep["complete"])
            self.assertEqual(rep["uncheckable"], ["C2-03"])
            self.assertEqual(rep["rates"]["C2"]["trials"], 9)
            self.assertEqual(rep["rates"]["C2"]["incomparable"], 1)

    def test_a_rehearsal_row_is_refused(self):
        with tempfile.TemporaryDirectory() as d:
            synth_calibration_dir(d, rehearsal="C0-02")
            with self.assertRaises(SystemExit):
                self.run_report(d)

    def test_smoke_scale_report_is_never_signable(self):
        with tempfile.TemporaryDirectory() as d:
            synth_calibration_dir(d)
            _, payload = self.run_report(d, scale=1)
            self.assertTrue(payload["complete"])
            # a smoke run (trials divided) has fewer expected batches; its payload says it is not complete
            for f in list(Path(d).glob("batch-C0-C0-0[4-9]*.json")) + list(Path(d).glob("batch-C0-C0-[1-3]*.json")):
                f.unlink()
            small, payload = self.run_report(d, scale=10)
            self.assertFalse(payload["complete"])

    def test_cusum_second_view_is_labelled_and_changes_no_rate(self):
        with tempfile.TemporaryDirectory() as d:
            synth_calibration_dir(d, change={"C4": range(20)})
            rep, _ = self.run_report(d, cusum=True)
            view = rep["second_view"]
            self.assertIn("ILLUSTRATIVE", view["C0"]["label"])
            self.assertEqual(view["C0"]["state"], "STABLE_ON_CHECK_STANDARD")
            self.assertEqual(view["C4"]["state"], "ALARM")
            rep2, _ = self.run_report(d, cusum=False)
            self.assertEqual(rep["rates"], rep2["rates"])


class ShardRunnerAndWorkflowShape(unittest.TestCase):
    def test_runner_checks_the_hash_before_serving(self):
        import run_shard
        with tempfile.TemporaryDirectory() as d:
            f = Path(d) / "x.gguf"
            f.write_bytes(b"not the model")
            with self.assertRaises(SystemExit):
                run_shard.fetch("file:///nonexistent", f, "0" * 64)   # present but wrong hash, and the fetch fails: stop, never serve

    def test_workflow_calibration_shape(self):
        text = (HERE.parent.parent / ".github" / "workflows" / "silent-change-watch.yml").read_text()
        cal = text.split("  calibrate:\n", 1)[1].split("\n  calibration-report:", 1)[0]
        self.assertIn("matrix: ${{ fromJSON(needs.plan.outputs.matrix) }}", cal)
        timeout = int(__import__("re").search(r"timeout-minutes: (\d+)", cal).group(1))
        self.assertLessEqual(timeout, 180)                      # well inside the 6 hour job limit
        mp = int(__import__("re").search(r"max-parallel: (\d+)", cal).group(1))
        self.assertLessEqual(mp, 8)
        self.assertIn("fail-fast: false", cal)
        self.assertIn("actions/upload-artifact@v4", cal)
        self.assertNotIn("secrets.", cal)                       # the open-model path needs no secret
        self.assertNotIn("id-token", cal)                       # and no signing credential
        report = text.split("  calibration-report:", 1)[1].split("  # ---- PAID MODELS", 1)[0]
        self.assertIn("id-token: write", report)
        self.assertIn("if: github.ref == 'refs/heads/master'", report)
        self.assertIn("needs: calibrate", report)
        self.assertNotIn("${{ inputs", text.split("  plan:", 1)[1].split("  calibrate:", 1)[0].split("env:", 1)[-1].split("run:", 1)[-1])
        for bad in ("huggingface-cli upload", "hf upload", "kaggle ", "npm publish", "twine"):
            self.assertNotIn(bad, text)

    def test_workflow_signing_steps_all_guarded(self):
        text = (HERE.parent.parent / ".github" / "workflows" / "silent-change-watch.yml").read_text()
        self.assertEqual(text.count("watch.py sign"), text.count("if: github.ref == 'refs/heads/master'"))
        self.assertIn("dispatch from master", text.lower().replace("dispatch from master to", "dispatch from master"))

    def test_workflow_command_matches_the_planner_columns(self):
        text = (HERE.parent.parent / ".github" / "workflows" / "silent-change-watch.yml").read_text()
        row = planmod.shards(detector.load_protocol(), PINS)[0]
        for col in ("shard", "file", "batches"):
            self.assertIn(col, row)
            self.assertIn("matrix.%s" % col, text)


# ---- run 2 (addendum 3): pooled baseline, leave-one-out maximum, one batch per job ---------------------------

def det_batch(hot_flags=(), firm_moved=(), n_items=20, k=30):
    """A batch with no answer spread inside it (as in run 1): every item answers 'A', except hot items that are 'B' when set
    in hot_flags, and firm items in firm_moved, which answer 'B'."""
    out = {}
    for i in range(n_items):
        a = "B" if (i in hot_flags or (n_items - 1 - i) in firm_moved) else "A"
        out["it%02d" % i] = [a] * k
    return out


def job_batch(rng, hot=2, firm_moved=(), n_items=20, k=30):
    """One job's batch: `hot` near-tie items take 'B' with probability 1/2 per job; firm items never vary."""
    return det_batch(hot_flags={i for i in range(hot) if rng.random() < 0.5}, firm_moved=firm_moved, n_items=n_items, k=k)


class Rule2(unittest.TestCase):
    def test_planted_change_is_flagged(self):
        rng = random.Random(11)
        pool = [job_batch(rng) for _ in range(20)]
        for moved in (range(1), range(2), range(3)):
            new = job_batch(rng, firm_moved=moved)
            r = detector.compare_pooled(pool, new, "planted")
            self.assertEqual(r["state"], "FLAG", moved)
            self.assertGreater(r["S"], r["theta"])

    def test_no_change_with_between_batch_spread_the_case_run_1_failed(self):
        """Independent jobs differ on near-tie items. Run 1's rule flagged these; rule 2 stays within its bound."""
        rng = random.Random(21)
        pool = [job_batch(rng, hot=2) for _ in range(20)]
        rule1 = rule2 = 0
        for n in range(60):
            new = job_batch(rng, hot=2)
            rule1 += detector.compare(pool[0], new, "r1-%d" % n, permutations=300)["state"] == "FLAG"
            rule2 += detector.compare_pooled(pool, new, "r2-%d" % n)["state"] == "FLAG"
        self.assertGreater(rule1, 10)       # the failure of run 1, reproduced on synthetic data: many false flags
        self.assertLessEqual(rule2, 6)      # at most about 1/21 of 60, with room for chance

    def test_false_flag_rate_stays_under_the_bound_over_many_pools(self):
        rng = random.Random(5)
        flags = trials = 0
        for _ in range(300):
            pool = [job_batch(rng, hot=3) for _ in range(20)]
            flags += detector.compare_pooled(pool, job_batch(rng, hot=3), "x")["state"] == "FLAG"
            trials += 1
        self.assertLess(flags / trials, 1 / 21 + 0.03)

    def test_no_change_without_between_batch_spread_is_not_flagged(self):
        pool = [det_batch() for _ in range(20)]
        r = detector.compare_pooled(pool, det_batch(), "same")
        self.assertEqual(r["state"], "NO_FLAG")
        self.assertEqual(r["S"], 0.0)
        self.assertEqual(r["theta"], 0.0)

    def test_when_the_pool_has_no_spread_any_movement_is_a_flag(self):
        pool = [det_batch() for _ in range(20)]
        r = detector.compare_pooled(pool, det_batch(firm_moved=range(1)), "one-item")
        self.assertEqual(r["state"], "FLAG")
        self.assertEqual(r["theta"], 0.0)
        self.assertEqual(r["items_not_seen_in_pool"], ["it19"])

    def test_a_tie_with_the_largest_leave_one_out_score_is_not_a_flag(self):
        rng = random.Random(2)
        pool = [job_batch(rng, hot=1) for _ in range(20)]
        theta = max(detector.loo_scores(pool))
        # a batch that scores exactly theta (a pool batch of the odd kind) must not flag: strictly greater only
        odd = [b for j, b in enumerate(pool) if detector.loo_scores(pool)[j] == theta][0]
        r = detector.compare_pooled(pool, odd, "tie")
        self.assertGreaterEqual(theta, r["S"] - 1e-9)
        self.assertEqual(r["state"], "NO_FLAG")

    def test_false_flag_bound_is_one_over_n_plus_one(self):
        pool = [det_batch() for _ in range(20)]
        self.assertAlmostEqual(detector.compare_pooled(pool, det_batch(), "b")["false_flag_bound"], 1 / 21, places=4)

    def test_too_small_pool_or_unequal_items_are_incomparable_not_unchanged(self):
        self.assertEqual(detector.compare_pooled([det_batch()] * 2, det_batch(), "x")["state"], "INCOMPARABLE")
        self.assertEqual(detector.compare_pooled([det_batch()] * 5, det_batch(n_items=19), "x")["state"], "INCOMPARABLE")
        self.assertEqual(detector.compare_pooled([det_batch()] * 5, det_batch(k=29), "x")["state"], "INCOMPARABLE")

    def test_score_uses_equal_weight_per_batch_and_unparsed_is_a_category(self):
        a = {"i": ["A"] * 30}
        b = {"i": ["UNPARSED"] * 30}
        sh = detector.pooled_shares([a, a, a, b])
        self.assertAlmostEqual(sh["i"]["A"], 0.75)
        self.assertAlmostEqual(sh["i"]["UNPARSED"], 0.25)
        self.assertAlmostEqual(detector.score_vs_pooled(b, sh)[0], 0.75)

    def test_run_1_rule_is_still_computable_and_unchanged(self):
        p = detector.load_protocol()
        self.assertEqual((p["flag_rule"]["alpha"], p["flag_rule"]["t_floor"], p["repeats_k"]), (0.01, 0.03, 30))
        r = detector.compare(det_batch(), det_batch(firm_moved=range(1)), "run1-rule", permutations=300)
        self.assertEqual((r["state"], r["T"], r["p_value"]), ("FLAG", 0.05, round(1 / 301, 6)))


class SeedsAndRunnerRecord(unittest.TestCase):
    def test_request_seed_is_stable_distinct_and_in_range(self):
        s1 = collect.request_seed("C4-01", "it1", 3)
        self.assertEqual(s1, collect.request_seed("C4-01", "it1", 3))
        self.assertNotEqual(s1, collect.request_seed("C4-01", "it1", 4))
        self.assertNotEqual(s1, collect.request_seed("C4-02", "it1", 3))
        self.assertTrue(0 <= s1 < 2 ** 31)

    def test_sampling_batches_send_a_seed_per_request_and_temperature_zero_does_not(self):
        sent = []
        def send(prompt, cfg):
            sent.append(dict(cfg.get("extra_body") or {}))
            return "VIOLATES"
        items = [("it1", "q", "conformance")]
        labels = {"conformance": ["VIOLATES", "CONFORMS"]}
        collect.run_batch(items, labels, send, {"temperature": 0.5, "seed_key": "C4-01", "extra_body": {"cache_prompt": False}}, 4, 1)
        self.assertEqual(len(sent), 4)
        self.assertEqual(len({x["seed"] for x in sent}), 4)
        self.assertTrue(all(x["cache_prompt"] is False for x in sent))
        sent.clear()
        collect.run_batch(items, labels, send, {"temperature": 0, "seed_key": "C0-01", "extra_body": {"cache_prompt": False}}, 4, 1)
        self.assertTrue(all("seed" not in x for x in sent))
        sent.clear()
        collect.run_batch(items, labels, send, {"temperature": 0.5, "extra_body": {}}, 2, 1)   # run 1: no seed_key, nothing changes
        self.assertTrue(all("seed" not in x for x in sent))

    def test_cpu_parser_reads_model_and_simd_flags(self):
        import run_shard
        txt = "processor\t: 0\nmodel name\t: AMD EPYC 7763 64-Core Processor\nflags\t\t: fpu avx avx2 fma f16c avx512f\n"
        r = run_shard.cpu_from_cpuinfo(txt)
        self.assertEqual(r["cpu_model"], "AMD EPYC 7763 64-Core Processor")
        self.assertEqual(r["simd"], ["avx", "avx2", "fma", "f16c", "avx512f"])
        self.assertEqual(run_shard.cpu_from_cpuinfo("")["cpu_model"], "UNKNOWN")

    def test_runner_record_has_every_field_addendum_3_lists(self):
        import run_shard
        with tempfile.TemporaryDirectory() as d:
            log = Path(d) / "server.log"
            log.write_text("x\nsystem_info: n_threads = 4 | AVX2 = 1 | \n")
            rec = run_shard.runner_record(Path(d) / "no-such-llama-server", log, "r2-c0-01",
                                          env={"ImageOS": "ubuntu24", "ImageVersion": "1", "GITHUB_RUN_ID": "7", "GITHUB_RUN_ATTEMPT": "1"})
        for k in ("cpu_model", "logical_cpus", "image", "llama_server_version_lines", "llama_system_info", "job", "simd"):
            self.assertIn(k, rec)
        self.assertEqual(rec["job"], {"shard": "r2-c0-01", "run_id": "7", "run_attempt": "1"})
        self.assertIn("AVX2", rec["llama_system_info"][0])


class Run2Plan(unittest.TestCase):
    P = detector.load_protocol()

    def test_130_batches_130_jobs_one_batch_each(self):
        batches = planmod.expected_batches(self.P, 1, "run2")
        per = {}
        for b in batches:
            per[b["condition"]] = per.get(b["condition"], 0) + 1
        self.assertEqual(per, {"BASE": 20, "BASE5": 20, "C0": 30, "C1": 10, "C2": 10, "C3": 10, "C4": 10, "C5": 20})
        self.assertEqual(len(batches), self.P["addendum_3"]["batch_total"])
        rows = planmod.shards(self.P, PINS, 1, "run2")
        self.assertEqual(len(rows), self.P["addendum_3"]["job_total"])
        self.assertLessEqual(len(rows), 256)
        self.assertTrue(all(r["n_batches"] == 1 and "," not in r["batches"] for r in rows))
        self.assertEqual(len({r["shard"] for r in rows}), len(rows))
        self.assertEqual(sorted(r["batches"].split(":")[1] for r in rows), sorted(b["trial_id"] for b in batches))

    def test_order_is_a_fixed_shuffle_not_baselines_first(self):
        a = planmod.shards(self.P, PINS, 1, "run2")
        self.assertEqual(a, planmod.shards(self.P, PINS, 1, "run2"))
        first_30 = [r["batches"].split(":")[0] for r in a[:30]]
        self.assertGreater(len(set(first_30)), 4)

    def test_pool_and_condition_settings_match_the_pins(self):
        conds = self.P["addendum_3"]["conditions_as_run"]
        for c, spec in conds.items():
            for field in ("file", "temperature", "system"):
                self.assertEqual(PINS["conditions"][c][field], spec[field], c)
        self.assertEqual(self.P["addendum_3"]["rule_2"]["baseline_pool"]["batches_per_pool"], 20)

    def test_run_1_plan_is_unchanged(self):
        self.assertEqual(len(planmod.expected_batches(self.P)), 92)
        self.assertEqual(len(planmod.expected_batches(self.P, 1, "run1")), 92)

    def test_smoke_scale_keeps_a_pool_of_at_least_three(self):
        small = planmod.expected_batches(self.P, 10, "run2")
        self.assertEqual(sum(1 for b in small if b["condition"] == "BASE"), 3)

    def test_run_2_workflow_dispatch_defaults_to_run2_and_passes_it_through_env(self):
        text = (HERE.parent.parent / ".github" / "workflows" / "silent-change-watch.yml").read_text()
        self.assertIn("options: [run2, run1]", text)
        self.assertEqual(text.count('--run "$RUN_KIND"'), 3)


def synth_run2_dir(d, hot=2, change=None, drop=(), run1_sha=False, no_runner=False, seed=3):
    """All 130 run 2 batches. Each batch is its own job: near-tie items vary between batches, nothing varies inside one."""
    import hashlib
    rng = random.Random(seed)
    proto = detector.load_protocol()
    for n, e in enumerate(planmod.expected_batches(proto, 1, "run2")):
        c, tid = e["condition"], e["trial_id"]
        if tid in drop:
            continue
        pin = PINS["conditions"][c]
        f = PINS["files"][pin["file"]]
        moved = range((change or {}).get(c, 0))
        b = {"condition": c, "trial_id": tid, "state": "COLLECTED", "k": 30, "run": "run2", "model_revision": f["revision"],
             "serving": {"gguf_sha256": f["sha256"], "llama_cpp_tag": PINS["llama_cpp"]["tag"]},
             "declared_sampling": {"temperature": pin["temperature"],
                                   "system_prompt_sha256": hashlib.sha256((pin["system"] or "").encode()).hexdigest()},
             "protocol": {"protocol_json": ("0" * 64) if False else (proto["addendum_3"]["run_1_protocol_json_sha256"] if run1_sha else detector.protocol_sha256()["protocol_json"])},
             "answers": job_batch(rng, hot=hot, firm_moved=moved)}
        if not no_runner:
            b["runner"] = {"cpu_model": ("AMD EPYC 7763", "Intel Xeon Platinum 8370C")[n % 2]}
        (Path(d) / ("batch-%s.json" % tid)).write_text(json.dumps(b), encoding="utf-8")


class Run2Report(unittest.TestCase):
    def run_report(self, d, **kw):
        import contextlib
        import io
        from unittest import mock
        quick = dict(detector.load_protocol())
        quick["statistic"] = dict(quick["statistic"], permutations_b=200)
        args = type("A", (), dict(dir=str(d), pins=str(detector.PROTOCOL_DIR / "calibration-pins.json"), scale=1, cusum=False,
                                  rehearsal=False, run="run2", payload_out=str(Path(d) / "payload.json")))()
        for k, v in kw.items():
            setattr(args, k, v)
        buf = io.StringIO()
        with mock.patch.object(detector, "load_protocol", return_value=quick), contextlib.redirect_stdout(buf):
            watch.cmd_report(args)
        return json.loads(buf.getvalue()), json.loads((Path(d) / "payload.json").read_text())

    def test_both_rules_side_by_side_on_between_batch_spread_and_a_planted_change(self):
        with tempfile.TemporaryDirectory() as d:
            synth_run2_dir(d, hot=2, change={"C1": 2, "C3": 3})
            rep, payload = self.run_report(d)
            self.assertTrue(rep["complete"])
            self.assertTrue(payload["complete"])
            r1, r2 = rep["rates"], rep["rates_rule_2"]
            self.assertEqual(sorted(r2), ["C0", "C1", "C2", "C3", "C4", "C5"])
            self.assertEqual(r2["C0"]["trials"], 30)
            self.assertEqual(r2["C5"]["trials"], 20)
            self.assertEqual((r2["C1"]["flags"], r2["C3"]["flags"]), (10, 10))        # planted changes seen by rule 2
            self.assertLessEqual(r2["C0"]["flags"], 4)                                 # false flags within the bound
            self.assertGreater(r1["C0"]["flags"], r2["C0"]["flags"])                   # run 1's rule flags more on the same rows
            self.assertEqual(rep["pools"]["BASE"]["n_pool"], 20)
            self.assertEqual(len(rep["pools"]["BASE"]["loo_scores"]), 20)
            self.assertGreaterEqual(rep["pools"]["BASE"]["items_varying_between_pool_batches"], 1)

    def test_payload_carries_both_rules_and_fits_the_signer_cap(self):
        with tempfile.TemporaryDirectory() as d:
            synth_run2_dir(d, change={"C1": 2})
            _, payload = self.run_report(d)
        import sys as _s
        _s.path.insert(0, str(HERE.parent))
        from verify_card import canonical_js_body_bytes as cb
        self.assertLessEqual(len(cb(payload)), 3072)
        self.assertEqual(payload["run"], "run2")
        self.assertIn("rates_rule_2", payload)
        self.assertEqual(payload["rule_2"]["n_pool"], 20)
        low = json.dumps(payload).lower()
        for word in ("unsafe", "degraded", "non-compliant", "certified", "token"):
            self.assertNotIn(word, low)

    def test_flags_by_cpu_is_descriptive_and_present(self):
        with tempfile.TemporaryDirectory() as d:
            synth_run2_dir(d, change={"C1": 2})
            rep, _ = self.run_report(d)
            self.assertEqual(sorted(rep["flags_by_cpu_rule_2"]), ["AMD EPYC 7763", "Intel Xeon Platinum 8370C"])
            self.assertIn("no cause", rep["flags_by_cpu_note"])

    def test_a_missing_pool_batch_blocks_signing_and_rule_2_is_not_computed_on_a_partial_pool(self):
        with tempfile.TemporaryDirectory() as d:
            synth_run2_dir(d, drop={"BASE-07"})
            rep, payload = self.run_report(d)
            self.assertFalse(rep["complete"])
            self.assertFalse(payload["complete"])
            self.assertEqual(rep["missing"], ["BASE-07"])
            self.assertEqual(rep["rates_rule_2"]["C0"]["trials"], 0)
            self.assertEqual(rep["rates_rule_2"]["C0"]["incomparable"], 30)
            self.assertEqual(rep["rates_rule_2"]["C5"]["trials"], 20)     # the other pool is intact
            with self.assertRaises(SystemExit):
                Combiner._sign(None, Path(d) / "payload.json")

    def test_run_1_protocol_hash_is_not_accepted_for_a_run_2_batch(self):
        with tempfile.TemporaryDirectory() as d:
            synth_run2_dir(d, run1_sha=True)
            rep, _ = self.run_report(d)
            self.assertFalse(rep["complete"])
            self.assertEqual(len(rep["problems"]), 130)

    def test_a_batch_without_a_runner_record_is_not_counted(self):
        with tempfile.TemporaryDirectory() as d:
            synth_run2_dir(d, no_runner=True)
            rep, _ = self.run_report(d)
            self.assertFalse(rep["complete"])
            self.assertIn("runner record", rep["problems"]["C0-01"])

    def test_cusum_view_takes_its_reference_from_the_pool_leave_one_out_scores(self):
        with tempfile.TemporaryDirectory() as d:
            synth_run2_dir(d, change={"C4": 3})
            rep, _ = self.run_report(d, cusum=True)
            self.assertIn("ILLUSTRATIVE", rep["second_view"]["C0"]["label"])
            self.assertEqual(rep["second_view"]["C4"]["state"], "ALARM")
            rep2, _ = self.run_report(d, cusum=False)
            self.assertEqual(rep["rates_rule_2"], rep2["rates_rule_2"])

    def test_run_1_mode_still_reads_run_1_rows(self):
        with tempfile.TemporaryDirectory() as d:
            synth_calibration_dir(d)
            rep, payload = Combiner.run_report(Combiner(), d, run="run1")
            self.assertTrue(rep["complete"])
            self.assertNotIn("rates_rule_2", rep)

    def test_rehearsal_report_prints_both_rules_and_signs_nothing(self):
        import contextlib
        import io
        with tempfile.TemporaryDirectory() as d:
            for tid, hot in (("BASE-01", ()), ("BASE-02", (0,)), ("BASE-03", ()), ("C0-01", ()), ("C1-01", (3,))):
                b = {"trial_id": tid, "rehearsal": True, "k": 3, "runner": {"cpu_model": "x"},
                     "answers": {"i%d" % n: ["B" if (n in hot) else "A"] * 3 for n in range(4)}}
                (Path(d) / ("batch-%s.json" % tid)).write_text(json.dumps(b))
            buf = io.StringIO()
            with contextlib.redirect_stdout(buf):
                watch.rehearsal_report(Path(d))
            out = json.loads(buf.getvalue())
            self.assertTrue(out["NOT_COUNTED"])
            self.assertEqual(out["compared"]["C1-01"]["rule_2"]["state"], "FLAG")
            self.assertEqual(out["compared"]["C0-01"]["rule_2"]["state"], "NO_FLAG")
            self.assertFalse(list(Path(d).glob("payload*")))


class DiagnoseScript(unittest.TestCase):
    def test_counts_one_moving_item_by_job(self):
        import diagnose_run1
        with tempfile.TemporaryDirectory() as d:
            def put(job, tid, hot_answer):
                (Path(d) / ("calibration-" + job)).mkdir(exist_ok=True)
                ans = {"i%d" % n: ["A"] * 30 for n in range(20)}
                ans["i0"] = [hot_answer] * 30
                (Path(d) / ("calibration-" + job) / ("batch-%s.json" % tid)).write_text(json.dumps(
                    {"trial_id": tid, "answers": ans, "transport_error_share": 0.0}))
            put("j1", "BASE-01", "A")
            put("j1", "BASE5-01", "A")
            for n in range(1, 5):
                put("j1", "C0-%02d" % n, "A")
            for n in range(5, 9):
                put("j2", "C0-%02d" % n, "B")
            for c in ("C1", "C2", "C3", "C4", "C5"):
                put("j3", c + "-01", "A")
            b, job = diagnose_run1.load(Path(d))
            out = diagnose_run1.diagnose(b, job)
        self.assertEqual(out["c0_items_moved_vs_baseline_histogram"], {0: 4, 1: 4})
        self.assertEqual(out["item_batches_with_one_answer_value"], [len(b) * 20, len(b) * 20])
        self.assertEqual(out["moving_item_answer_by_condition_and_job"]["C0 | j2 | i0"], ["B"])
        self.assertEqual(out["jobs_per_condition"]["C0"], 2)


class SimulationScript(unittest.TestCase):
    def test_numbers_in_addendum_3_are_reproduced(self):
        import simulate_rule2
        for hot in (0, 1, 2, 3, 5):
            self.assertLess(simulate_rule2.rate(hot, 0, 20, 1500), 1 / 21)       # false flag under the bound
            self.assertGreater(simulate_rule2.rate(hot, 2, 20, 300), 0.99)       # C1-like
            self.assertGreater(simulate_rule2.rate(hot, 3, 20, 300), 0.99)       # C3-like
            self.assertGreater(simulate_rule2.rate(hot, 1, 20, 300), 0.94)       # one whole item


if __name__ == "__main__":
    unittest.main()
