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
             "protocol": detector.protocol_sha256(), "answers": ans}
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


if __name__ == "__main__":
    unittest.main()
