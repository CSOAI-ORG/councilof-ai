"""sign_mill_cards.py --supersede-scope: a new comparison group never retires the run of record."""
from __future__ import annotations

import base64
import json
import os
import sys
import tempfile
import unittest
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
import sign_mill_cards as smc  # noqa: E402

MODEL = "ollama:x@sha256:" + "0" * 64
BANK = "b" * 64
INSTR_G1 = "1" * 64
INSTR_G2 = "2" * 64


def body(instrument: str | None, n: int = 36, run_id: str = "r") -> dict:
    b = {
        "kind": "gspc.measurement-card", "axis": "safety", "model": MODEL,
        "issuer": "CSOAI Ltd", "n": n, "accuracy": 0.5, "status": "MEASURED", "unmeasured": [],
        "public_framing": "Measurement, not certification. Empty is not zero.",
        "verify": "https://councilof.ai/gspc-verify", "brand": "Council of AI",
        "signature_state": "SIGNED",
    }
    if instrument is not None:
        b["compute_evidence"] = {"bank_sha256": BANK, "instrument_sha256": instrument,
                                 "items_sha256": "9" * 64, "run_id": run_id}
    return b


class Base(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.dst = Path(self.tmp.name) / "signed"
        self.dst.mkdir()
        self._dst, self._ledger = smc.DST, smc.LEDGER
        smc.DST, smc.LEDGER = self.dst, self.dst / "SUPERSEDED.jsonl"

    def tearDown(self):
        smc.DST, smc.LEDGER = self._dst, self._ledger
        self.tmp.cleanup()

    def put_signed(self, name: str, b: dict, card_id: str):
        (self.dst / name).write_text(json.dumps({"body": b, "id": card_id, "signature": "ab" * 64}))


class PriorCardsScope(Base):
    def test_default_scope_is_model_axis_unchanged(self):
        self.put_signed("signed-safety-g1.json", body(INSTR_G1), "g1")
        got = smc.prior_cards("ollama:x@sha256:" + "0" * 64, "safety", "new", ("b" * 64, INSTR_G2))
        self.assertEqual([c["id"] for c in got], ["g1"])

    def test_group_scope_other_group_is_not_superseded(self):
        self.put_signed("signed-safety-g1.json", body(INSTR_G1), "g1")
        got = smc.prior_cards(MODEL, "safety", "new", (BANK, INSTR_G2), "comparison-group")
        self.assertEqual(got, [])

    def test_group_scope_same_group_newer_card_still_supersedes(self):
        self.put_signed("signed-safety-g1.json", body(INSTR_G1), "g1")
        self.put_signed("signed-safety-g2.json", body(INSTR_G2, run_id="old"), "g2old")
        got = smc.prior_cards(MODEL, "safety", "new", (BANK, INSTR_G2), "comparison-group")
        self.assertEqual([c["id"] for c in got], ["g2old"])

    def test_group_scope_different_bank_is_a_different_group(self):
        b = body(INSTR_G2)
        b["compute_evidence"]["bank_sha256"] = "c" * 64
        self.put_signed("signed-safety-x.json", b, "x")
        self.assertEqual(smc.prior_cards(MODEL, "safety", "new", (BANK, INSTR_G2), "comparison-group"), [])

    def test_group_scope_unknown_group_keeps_prior(self):
        self.put_signed("signed-safety-legacy.json", body(None), "legacy")
        self.assertEqual(smc.prior_cards(MODEL, "safety", "new", (BANK, INSTR_G2), "comparison-group"), [])
        self.put_signed("signed-safety-g2.json", body(INSTR_G2), "g2")
        self.assertEqual(smc.prior_cards(MODEL, "safety", "new", None, "comparison-group"), [])

    def test_unknown_scope_refused(self):
        with self.assertRaises(ValueError):
            smc.prior_cards(MODEL, "safety", "new", None, "everything")

    def test_comparison_group_extraction(self):
        self.assertEqual(smc.comparison_group(body(INSTR_G1)), (BANK, INSTR_G1))
        self.assertIsNone(smc.comparison_group(body(None)))
        partial = body(INSTR_G1)
        del partial["compute_evidence"]["instrument_sha256"]
        self.assertIsNone(smc.comparison_group(partial))


class EndToEndLedger(Base):
    """Through main(): sign a G2 card locally and check what the ledger records."""

    def setUp(self):
        super().setUp()
        try:
            from cryptography.hazmat.primitives import serialization
            from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey
        except ImportError:  # pragma: no cover
            self.skipTest("cryptography not installed")
        pk = Ed25519PrivateKey.generate().private_bytes(
            serialization.Encoding.DER, serialization.PrivateFormat.PKCS8, serialization.NoEncryption())
        self.env = "TEST_SUPERSEDE_SCOPE_KEY"
        os.environ[self.env] = base64.b64encode(pk).decode()
        self.src = Path(self.tmp.name) / "unsigned"
        self.src.mkdir()
        (self.src / "unsigned-safety-g2new.json").write_text(json.dumps({"body": body(INSTR_G2, run_id="new")}))
        self.put_signed("signed-safety-g1.json", body(INSTR_G1, run_id="record"), "g1")
        self.put_signed("signed-safety-g2old.json", body(INSTR_G2, run_id="old"), "g2old")

    def tearDown(self):
        os.environ.pop(self.env, None)
        super().tearDown()

    def run_main(self, *extra: str) -> list[str]:
        rc = smc.main(["--source-dir", str(self.src), "--dest-dir", str(self.dst), "--key-env", self.env, *extra])
        self.assertEqual(rc, 0)
        ledger = self.dst / "SUPERSEDED.jsonl"
        rows = [json.loads(x) for x in ledger.read_text().splitlines() if x.strip()] if ledger.is_file() else []
        return sorted(r["superseded_id"] for r in rows)

    def test_comparison_group_scope_keeps_run_of_record(self):
        self.assertEqual(self.run_main("--supersede-scope", "comparison-group"), ["g2old"])

    def test_default_scope_unchanged(self):
        self.assertEqual(self.run_main(), ["g1", "g2old"])


if __name__ == "__main__":
    unittest.main()
