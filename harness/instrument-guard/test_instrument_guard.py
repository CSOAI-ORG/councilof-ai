#!/usr/bin/env python3
# SPDX-License-Identifier: Apache-2.0
"""Tests for instrument_guard, each paired with a control that must fail.

Run: python3 harness/instrument-guard/test_instrument_guard.py
All canaries here are minted in-process and discarded: no real canary is ever in this repo.
"""
import json
import os
import re
import secrets
import subprocess
import sys
import tempfile
import unittest

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import instrument_guard as ig  # noqa: E402

REPO = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
GATE = os.path.join(REPO, "scripts", "canary-leak-gate.mjs")


class MemorisedModel:
    """Has seen the private bank's canary rows verbatim and regurgitates from them."""
    def __init__(self, rows):
        self.rows = rows

    def __call__(self, prompt):
        for r in self.rows:
            if ig.canary_prefix(r["guid"]) in prompt:
                return " " + r["canary_answer"] + "."
            if r["guid"] in prompt:
                return f"The code phrase is {r['canary_answer']}."
            if r["guid"][:19] in prompt:
                return r["guid"]
        return "I do not know."


class CleanModel:
    """Never saw the bank. Answers fluently and wrongly, including plausible-looking codes."""
    def __call__(self, prompt):
        fake = ig._code_phrase()
        return f"I am not aware of that record. A code phrase might look like {fake}; " \
               f"an identifier might look like {ig.uuid.uuid4()}."


class EchoModel:
    """Repeats its prompt. The prompt never contains the target, so echo must not score."""
    def __call__(self, prompt):
        return prompt


class DeadModel:
    def __call__(self, prompt):
        raise ConnectionError("endpoint down")


def always_match(_out, _target):
    return True


class TestProbe(unittest.TestCase):
    def setUp(self):
        self.rows = ig.make_canaries("gspc-test", 8)
        self.commit = ig.canary_set_commitment(self.rows)

    def probe(self, model, **kw):
        return ig.run_probe(model, self.rows, expected_commitment=kw.pop("commit", self.commit),
                            model_id="fixture", bank_id="gspc-test", **kw)

    def test_memorised_model_is_flagged(self):
        r = self.probe(MemorisedModel(self.rows))
        self.assertEqual(r["state"], ig.STATE_SUSPECTED)
        self.assertEqual(r["k_hits"], 24)
        self.assertLess(r["p_value_upper"], 1e-3)
        self.assertIn("Not proof of misconduct", r["reason"])

    def test_partial_memorisation_single_canary_is_flagged(self):
        r = self.probe(MemorisedModel(self.rows[:1]))
        self.assertEqual(r["state"], ig.STATE_SUSPECTED)
        self.assertEqual(r["hit_canaries"], [0])

    def test_clean_model_is_not_detected(self):
        r = self.probe(CleanModel())
        self.assertEqual(r["state"], ig.STATE_NOT_DETECTED)
        self.assertEqual(r["k_hits"], 0)

    def test_echo_model_is_not_detected(self):
        self.assertEqual(self.probe(EchoModel())["state"], ig.STATE_NOT_DETECTED)

    def test_model_memorising_a_different_bank_is_not_flagged(self):
        other = ig.make_canaries("gspc-other", 8)
        self.assertEqual(self.probe(MemorisedModel(other))["state"], ig.STATE_NOT_DETECTED)

    # --- controls: the instrument must refuse to testify when it cannot
    def test_control_broken_matcher_is_uncheckable_not_suspected(self):
        r = self.probe(CleanModel(), cfg=ig.ProbeConfig(matcher=always_match))
        self.assertEqual(r["state"], ig.STATE_UNCHECKABLE)
        self.assertIn("decoy", r["reason"])

    def test_control_dead_endpoint_is_uncheckable_not_clean(self):
        r = self.probe(DeadModel())
        self.assertEqual(r["state"], ig.STATE_UNCHECKABLE)

    def test_control_canaries_not_matching_commitment_is_uncheckable(self):
        r = self.probe(MemorisedModel(self.rows), commit="0" * 64)
        self.assertEqual(r["state"], ig.STATE_UNCHECKABLE)
        r = self.probe(MemorisedModel(self.rows), commit=None)
        self.assertEqual(r["state"], ig.STATE_UNCHECKABLE)

    def test_control_no_canaries_is_uncheckable(self):
        r = ig.run_probe(CleanModel(), [], expected_commitment=None, model_id="m", bank_id="b")
        self.assertEqual(r["state"], ig.STATE_UNCHECKABLE)

    def test_public_view_carries_no_canary_text(self):
        r = ig.public_view(self.probe(MemorisedModel(self.rows)))
        blob = json.dumps(r)
        for c in self.rows:
            self.assertNotIn(c["guid"], blob)
            self.assertNotIn(c["canary_answer"], blob)
            self.assertNotIn(c["guid"][19:], blob)
        self.assertNotIn("_private_log", r)


class TestCanaries(unittest.TestCase):
    def test_rows_obey_bank_canary_rule(self):
        for r in ig.make_canaries("b", 4):
            self.assertTrue(r["_canary"])
            self.assertIsNone(r["expected"])  # never counted in n or in the label set
            self.assertFalse(ig.is_graded(r))
            self.assertTrue(r["text"].startswith("Synthetic canary record (not real-world data"))
            self.assertRegex(r["guid"], ig.UUID4_RE)
            self.assertRegex(r["canary_answer"], ig.CODE_RE)

    def test_unique_and_commitment_sensitive(self):
        a, b = ig.make_canaries("b", 8), ig.make_canaries("b", 8)
        self.assertEqual(len({r["guid"] for r in a + b}), 16)
        self.assertNotEqual(ig.canary_set_commitment(a), ig.canary_set_commitment(b))
        mutated = [dict(r) for r in a]
        mutated[3]["canary_answer"] = "AAAA-AAAA-AAAA"
        self.assertNotEqual(ig.canary_set_commitment(a), ig.canary_set_commitment(mutated))

    def test_leakscan_finds_leak_and_only_leak(self):
        rows = ig.make_canaries("b", 3)
        ds = set(ig.leakscan_digests(rows))
        self.assertEqual(len(ds), 6)
        self.assertTrue(ig.scan_text_for_leaks(f"blah {rows[1]['guid'].upper()} blah", ds))
        self.assertTrue(ig.scan_text_for_leaks(rows[2]["canary_answer"].lower(), ds))
        self.assertFalse(ig.scan_text_for_leaks(f"{ig.uuid.uuid4()} {ig._code_phrase()}", ds))


class TestRotation(unittest.TestCase):
    def rows(self, n, tag="q"):
        return [{"text": f"{tag} item {i} {secrets.token_hex(4)}", "expected": "A" if i % 2 else "B"} for i in range(n)]

    def test_split_is_deterministic_and_keyed(self):
        rows = self.rows(400)
        k1, k2 = secrets.token_bytes(32), secrets.token_bytes(32)
        s1 = ig.split_bank(rows, epoch_key=k1, bank_id="b", fraction=0.3)
        s1b = ig.split_bank(rows, epoch_key=k1, bank_id="b", fraction=0.3)
        s2 = ig.split_bank(rows, epoch_key=k2, bank_id="b", fraction=0.3)
        self.assertEqual(ig.slice_digest(s1["heldout"]), ig.slice_digest(s1b["heldout"]))
        self.assertNotEqual(ig.slice_digest(s1["heldout"]), ig.slice_digest(s2["heldout"]))
        self.assertTrue(80 <= len(s1["heldout"]) <= 160)
        self.assertEqual(len(s1["heldout"]) + len(s1["public"]), 400)

    def test_already_public_items_are_never_held_out(self):
        rows = self.rows(200)
        pub = {ig._norm_prompt(r["text"]) for r in rows[:150]}
        s = ig.split_bank(rows, epoch_key=secrets.token_bytes(32), bank_id="b", fraction=1.0, public_prompts=pub)
        self.assertEqual(len(s["heldout"]), 50)
        self.assertEqual(s["ineligible_already_public"], 150)
        held = {ig._norm_prompt(r["text"]) for r in s["heldout"]}
        self.assertFalse(held & pub)

    def test_retired_items_never_return(self):
        rows = self.rows(100)
        retired = {ig.item_key(r) for r in rows[:60]}
        s = ig.split_bank(rows, epoch_key=secrets.token_bytes(32), bank_id="b", fraction=1.0, retired_keys=retired)
        self.assertEqual(len(s["heldout"]), 40)

    def test_canaries_never_enter_either_slice(self):
        rows = self.rows(50) + ig.make_canaries("b", 4)
        s = ig.split_bank(rows, epoch_key=secrets.token_bytes(32), bank_id="b", fraction=0.5)
        self.assertEqual(len(s["heldout"]) + len(s["public"]), 50)

    def test_gap_flags_gaming_and_not_honest_model(self):
        gamed = ig.gap_report(95, 100, 50, 100)
        self.assertEqual(gamed["state"], "GAP_SUSPECTED")
        honest = ig.gap_report(70, 100, 66, 100)
        self.assertEqual(honest["state"], "GAP_NOT_DETECTED")
        self.assertLess(honest["gap_ci95"][0], 0.10)
        # control: a small held-out slice cannot testify either way
        self.assertEqual(ig.gap_report(95, 100, 5, 10)["state"], "UNCHECKABLE")

    def test_quotable_requires_heldout(self):
        ok, why = ig.quotable(None)
        self.assertFalse(ok)
        self.assertIn("absent means unknown", why)
        blk = {"epoch_id": "E1", "heldout_slice_sha256": "a" * 64, "gap": ig.gap_report(70, 100, 66, 100)}
        self.assertEqual(ig.quotable(blk), (True, "QUOTABLE"))
        ok, why = ig.quotable({**blk, "gap": ig.gap_report(95, 100, 50, 100)})
        self.assertTrue(ok)
        self.assertIn("GAP_FLAG", why)
        self.assertFalse(ig.quotable({**blk, "gap": ig.gap_report(9, 10, 5, 10)})[0])
        self.assertFalse(ig.quotable({**blk, "heldout_slice_sha256": ""})[0])


@unittest.skipUnless(os.path.exists(GATE), "gate script not present")
class TestLeakGate(unittest.TestCase):
    """The repo gate, run as a subprocess against a temp tree: must fail on a leak, pass clean."""
    def setUp(self):
        self.tmp = tempfile.mkdtemp()
        self.rows = ig.make_canaries("gspc-test", 4)
        rec = {"schema": ig.SCHEMA_COMMIT, "banks": [{"bank_id": "gspc-test", "canary_set": {
            "k": 4, "commitment_sha256": ig.canary_set_commitment(self.rows),
            "leakscan_digests": ig.leakscan_digests(self.rows)}}]}
        self.record = os.path.join(self.tmp, "rec.json")
        with open(self.record, "w") as f:
            json.dump(rec, f)
        self.pub = os.path.join(self.tmp, "public")
        os.makedirs(os.path.join(self.pub, "interop"))
        # the record itself lives in the scanned tree and must not trip the gate
        self.write("interop/rec.json", json.dumps(rec))
        self.write("index.html", f"<p>{ig.uuid.uuid4()} ordinary page</p>")

    def write(self, rel, text):
        with open(os.path.join(self.pub, rel), "w") as f:
            f.write(text)

    def gate(self, *extra):
        return subprocess.run(["node", GATE, "--record", self.record, self.pub, *extra], capture_output=True, text=True)

    def test_clean_tree_passes(self):
        r = self.gate()
        self.assertEqual(r.returncode, 0, r.stderr)

    def test_leaked_guid_fails(self):
        self.write("interop/leak.json", json.dumps({"row": self.rows[2]["text"]}))
        r = self.gate()
        self.assertEqual(r.returncode, 1)
        self.assertIn("leak.json", r.stderr)
        for c in self.rows:  # the failure message never repeats the secret
            self.assertNotIn(c["guid"], r.stderr + r.stdout)
            self.assertNotIn(c["canary_answer"], r.stderr + r.stdout)

    def test_leaked_answer_alone_fails(self):
        self.write("a.txt", "code " + self.rows[0]["canary_answer"])
        self.assertEqual(self.gate().returncode, 1)

    def test_leak_of_an_older_epoch_record_still_fails(self):
        old = ig.make_canaries("gspc-old", 2)
        rec2 = os.path.join(self.tmp, "rec-old.json")
        with open(rec2, "w") as f:
            json.dump({"banks": [{"bank_id": "gspc-old", "canary_set": {"k": 2, "leakscan_digests": ig.leakscan_digests(old)}}]}, f)
        self.write("old.md", old[1]["guid"])
        r = subprocess.run(["node", GATE, "--record", self.record, "--record", rec2, self.pub], capture_output=True, text=True)
        self.assertEqual(r.returncode, 1)

    def test_record_with_wrong_digest_count_is_uncheckable(self):
        with open(self.record) as f:
            rec = json.load(f)
        rec["banks"][0]["canary_set"]["leakscan_digests"].pop()
        with open(self.record, "w") as f:
            json.dump(rec, f)
        self.assertEqual(self.gate().returncode, 2)

    def test_missing_record_is_uncheckable(self):
        r = subprocess.run(["node", GATE, "--record", os.path.join(self.tmp, "nope.json"), self.pub],
                           capture_output=True, text=True)
        self.assertEqual(r.returncode, 2)

    def test_selftest(self):
        r = subprocess.run(["node", GATE, "--selftest"], capture_output=True, text=True)
        self.assertEqual(r.returncode, 0, r.stdout + r.stderr)


if __name__ == "__main__":
    unittest.main(verbosity=2)
