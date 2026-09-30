#!/usr/bin/env python3
# SPDX-License-Identifier: Apache-2.0
"""Tests for the 27 Sep 2026 follow-ups, each behaviour paired with a control that must fail.

  validate_bank_items   a planted exact copy, near-duplicate, off-scale label, wrong key set and an
                        internal duplicate are each dropped; a genuinely new item is kept
  build_exposure_labels a card is labelled by its pinned digest only: a card whose NAME says gov but
                        whose digest is in no record is UNASSESSED, never PUBLIC_BANK
  build_commitments     eligibility counts rows: a byte-public bank with a duplicated row mints no canaries
  sign_commitments      the labels payload stays under the signer's 3 KB cap and its tamper control bites

Run: python3 harness/instrument-guard/test_followups.py   (no network, no private data)
"""
import hashlib
import json
import os
import subprocess
import sys
import tempfile
import unittest

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import build_exposure_labels as bel  # noqa: E402
import instrument_guard as ig  # noqa: E402
import sign_commitments as sc  # noqa: E402
import validate_bank_items as vbi  # noqa: E402

PUBLIC = [
    {"text": "Using MIT-licensed code inside a closed-source proprietary product.", "expected": "PERMITTED",
     "axis": "oss", "category": "mit", "source": "rebuilt-from-peritem"},
    {"text": "Redistributing Apache-2.0 code after deleting the required NOTICE file.", "expected": "RESTRICTED",
     "axis": "oss", "category": "notice", "source": "rebuilt-from-peritem"},
]
NEW = {"text": "Shipping an ISC-licensed parser in a paid desktop app with the ISC notice kept in the about box.",
       "expected": "PERMITTED", "axis": "oss", "category": "isc", "source": "authored-private-2026-09-27"}


def validate(rows, public=PUBLIC):
    exact = {ig._norm_prompt(r["text"]) for r in public}
    return vbi.validate_axis("oss", rows, public, public, exact, "\x00".join(exact), 0.80, 0.70)


class ValidateItems(unittest.TestCase):
    def test_new_item_is_kept(self):
        kept, c = validate([NEW])
        self.assertEqual((len(kept), c["kept"]), (1, 1))

    def test_control_exact_copy_of_a_public_item_is_dropped(self):
        _, c = validate([{**PUBLIC[0], "source": "authored-private-2026-09-27"}])
        self.assertEqual(c["exact_public"], 1)

    def test_control_near_duplicate_is_dropped(self):
        near = {**NEW, "text": "Using MIT-licensed code inside a closed-source proprietary product line."}
        _, c = validate([near])
        self.assertEqual((c["near_dup_public"], c["kept"]), (1, 0))

    def test_control_label_off_the_public_scale_is_dropped(self):
        _, c = validate([{**NEW, "expected": "ALLOWED"}])
        self.assertEqual((c["answer_key"], c["kept"]), (1, 0))

    def test_control_wrong_key_set_is_dropped(self):
        _, c = validate([{**NEW, "extra": 1}])
        self.assertEqual((c["schema"], c["kept"]), (1, 0))

    def test_control_canary_row_is_never_a_bank_item(self):
        _, c = validate([{**NEW, "_canary": True}])
        self.assertEqual(c["kept"], 0)

    def test_control_internal_duplicate_is_dropped(self):
        _, c = validate([NEW, {**NEW, "text": NEW["text"] + " "}])
        self.assertEqual((c["internal_dup"], c["kept"]), (1, 1))


def card(axis, bank=None, key="evidence", cid=None):
    body = {"axis": axis, "model": "m", key: ({"bank_sha256": bank} if bank else {})}
    return {"id": cid or hashlib.sha256(json.dumps(body, sort_keys=True).encode()).hexdigest(), "body": body,
            "signature": "00"}


class Labels(unittest.TestCase):
    def setUp(self):
        self.t = tempfile.TemporaryDirectory()
        self.addCleanup(self.t.cleanup)
        r = self.t.name
        self.cards, self.recs = os.path.join(r, "cards"), os.path.join(r, "recs")
        os.makedirs(self.cards)
        os.makedirs(self.recs)
        self.allow = os.path.join(r, "allow.json")
        json.dump({"banks": [{"axis": "governance", "sha256": "aa" * 32}, {"axis": "jail", "sha256": "bb" * 32}]},
                  open(self.allow, "w"))
        json.dump({"banks": [{"bank_id": "gspc-gov", "bank_sha256": "aa" * 32, "exposure": "CONTENT_PUBLIC"},
                             {"bank_id": "gspc-x", "bank_sha256": "cc" * 32, "exposure": "PRIVATE"}]},
                  open(os.path.join(self.recs, "bank-commitments-2099-01-01.json"), "w"))

    def put(self, name, w):
        json.dump(w, open(os.path.join(self.cards, name), "w"))

    def build(self):
        return bel.build(self.cards, self.recs, self.allow, as_of="2099-01-01T00:00:00Z")

    def test_labels_come_from_the_pinned_digest(self):
        self.put("signed-gov-1.json", card("governance", "aa" * 32))
        self.put("signed-gov-2.json", card("governance", "cc" * 32, key="compute_evidence"))
        self.put("signed-gov-3.json", card("governance"))
        self.put("signed-jail-1.json", card("jail", "dd" * 32))
        self.put("signed-other-1.json", card("not-a-board-axis", "aa" * 32))
        rec = self.build()
        got = {c["file"]: c["bank_exposure"] for c in rec["cards"]}
        self.assertEqual(got, {"signed-gov-1.json": "PUBLIC_BANK", "signed-gov-2.json": "PRIVATE_BANK",
                               "signed-gov-3.json": "UNPINNED", "signed-jail-1.json": "UNASSESSED"})
        self.assertEqual(rec["by_axis"]["governance"],
                         {"live_cards": 3, "PRIVATE_BANK": 1, "PUBLIC_BANK": 1, "UNPINNED": 1})

    def test_control_a_name_never_decides_the_label(self):
        # the dataset name says the public gov bank; the digest is in no record -> UNASSESSED
        c = card("governance", "ee" * 32)
        c["body"]["evidence"].update(bank_dataset="csoai/gspc-gov", bank_file="bank-governan-x.jsonl")
        self.put("signed-gov-9.json", c)
        self.assertEqual(self.build()["cards"][0]["bank_exposure"], "UNASSESSED")

    def test_superseded_and_withdrawn_cards_are_labelled_but_not_live(self):
        a, b = card("governance", "aa" * 32, cid="a" * 64), card("governance", "aa" * 32, cid="b" * 64)
        self.put("signed-gov-a.json", a)
        self.put("signed-gov-b.json", b)
        open(os.path.join(self.cards, "SUPERSEDED.jsonl"), "w").write(json.dumps({"superseded_id": "a" * 64}) + "\n")
        rec = self.build()
        self.assertEqual(rec["counts"], {"cards_labelled": 2, "live_cards": 1, "by_label": {"PUBLIC_BANK": 2}})

    def test_control_no_record_refuses_rather_than_labelling_everything_unassessed(self):
        os.remove(os.path.join(self.recs, "bank-commitments-2099-01-01.json"))
        with self.assertRaises(SystemExit):
            self.build()

    def test_control_records_that_disagree_refuse(self):
        json.dump({"banks": [{"bank_id": "gspc-gov", "bank_sha256": "aa" * 32, "exposure": "PRIVATE"}]},
                  open(os.path.join(self.recs, "bank-commitments-2099-01-02.json"), "w"))
        with self.assertRaises(SystemExit):
            self.build()

    def test_labels_payload_fits_the_signer_and_its_tamper_control_bites(self):
        for i in range(40):
            self.put(f"signed-gov-{i}.json", card("governance", "aa" * 32, cid=f"{i:064x}"))
        rec = self.build()
        rec["by_axis"] = {f"axis-{k}": {"live_cards": 99, "PUBLIC_BANK": 50, "UNPINNED": 49} for k in range(14)}
        raw = json.dumps(rec).encode()
        payload = sc.build_payload(rec, raw, "/interop/instrument-guard/bank-exposure-labels.json")
        self.assertLessEqual(len(sc.canon(payload)), 3072)
        self.assertEqual(payload["artifact"]["sha256"], hashlib.sha256(raw).hexdigest())
        self.assertNotEqual(sc.canon(sc.tamper(payload)), sc.canon(payload))


class Eligibility(unittest.TestCase):
    def test_duplicated_row_in_a_byte_public_bank_mints_no_canaries(self):
        with tempfile.TemporaryDirectory() as t:
            banks, cache, out = (os.path.join(t, d) for d in ("banks", "cache", "out"))
            os.makedirs(banks)
            os.makedirs(cache)
            rows = [{"text": f"public item number {i} with enough words", "expected": "A"} for i in range(5)]
            rows.append(dict(rows[0]))  # the duplicate
            data = b"".join(json.dumps(r).encode() + b"\n" for r in rows)
            open(os.path.join(banks, "gspc-dup.jsonl"), "wb").write(data)
            open(os.path.join(cache, "csoai__gspc-dup__items.jsonl"), "wb").write(data)  # exact bytes public
            json.dump({"private_ds": []}, open(os.path.join(t, "inv.json"), "w"))
            mirror = os.path.join(t, "m.git")
            subprocess.run(["git", "init", "-q", "--bare", mirror], check=True)
            wt = os.path.join(t, "wt")
            subprocess.run(["git", "init", "-q", wt], check=True)
            open(os.path.join(wt, "x"), "w").write("x")
            env = {**os.environ, "GIT_AUTHOR_NAME": "t", "GIT_AUTHOR_EMAIL": "t@t", "GIT_COMMITTER_NAME": "t",
                   "GIT_COMMITTER_EMAIL": "t@t"}
            for cmd in (["add", "x"], ["commit", "-qm", "x"], ["push", "-q", mirror, "HEAD:master"]):
                subprocess.run(["git", "-C", wt, *cmd], check=True, env=env)
            rec_path = os.path.join(t, "rec.json")
            r = subprocess.run([sys.executable, os.path.join(HERE, "build_commitments.py"), "--banks-dir", banks,
                                "--hf-cache", cache, "--inventory", os.path.join(t, "inv.json"), "--mirror", mirror,
                                "--private-out", out, "--record", rec_path], capture_output=True, text=True)
            self.assertEqual(r.returncode, 0, r.stderr)
            b = json.load(open(rec_path))["banks"][0]
            self.assertEqual((b["exposure"], b["items_private"]), ("PUBLIC", 0))
            self.assertNotIn("canary_set", b)
            self.assertEqual(b["heldout"]["state"], "HELDOUT_INELIGIBLE")


if __name__ == "__main__":
    unittest.main(verbosity=1)
