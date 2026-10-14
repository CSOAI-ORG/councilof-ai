"""sign_mill_cards.prior_cards: supersede only within the same comparison group
(model, axis, bank_sha256, instrument_sha256)."""
from __future__ import annotations

import json
import sys
import tempfile
import unittest
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
sys.path.insert(0, str(HERE.parent / "harness" / "gspc-top100"))
import sign_mill_cards as smc  # noqa: E402

M = "ollama:x@sha256:" + "0" * 64


def body(bank="b" * 64, inst="i" * 64, axis="care", model=M):
    ce = {}
    if bank is not None:
        ce["bank_sha256"] = bank
    if inst is not None:
        ce["instrument_sha256"] = inst
    return {"model": model, "axis": axis, "compute_evidence": ce}


class PriorCards(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.old = smc.DST
        smc.DST = Path(self.tmp.name)

    def tearDown(self):
        smc.DST = self.old
        self.tmp.cleanup()

    def put(self, name, cid, b, sig="ab"):
        (smc.DST / f"signed-{name}.json").write_text(
            json.dumps({"id": cid, "body": b, "signature": sig}), encoding="utf-8")

    def test_same_group_is_superseded(self):
        self.put("same", "old", body())
        self.assertEqual(smc.prior_cards(body(), "new"), [{"file": "signed-same.json", "id": "old"}])

    def test_other_bank_or_instrument_coexists(self):
        self.put("bank", "o1", body(bank="c" * 64))
        self.put("inst", "o2", body(inst="j" * 64))
        self.put("axis", "o3", body(axis="safety"))
        self.assertEqual(smc.prior_cards(body(), "new"), [])

    def test_missing_sha_supersedes_nothing(self):
        self.put("legacy", "old", body(bank=None, inst=None))
        self.put("same", "old2", body())
        self.assertEqual(smc.prior_cards(body(bank=None), "new"), [])
        self.assertEqual(smc.prior_cards(body(), "new"), [{"file": "signed-same.json", "id": "old2"}])

    def test_self_and_unsigned_ignored(self):
        self.put("self", "new", body())
        self.put("unsigned", "u", body(), sig="")
        self.assertEqual(smc.prior_cards(body(), "new"), [])


if __name__ == "__main__":
    unittest.main()
