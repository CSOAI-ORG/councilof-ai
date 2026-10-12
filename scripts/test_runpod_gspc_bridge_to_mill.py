"""House gates + run-of-record keying for the RunPod -> mill bridge (Measure ruling on #3047)."""
from __future__ import annotations

import hashlib
import json
import pathlib
import sys
import tempfile
import unittest

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
import runpod_gspc_bridge_to_mill as bridge  # noqa: E402

HERE = pathlib.Path(__file__).resolve().parent
MODEL = "ollama:qwen2.5:7b@sha256:aa"
BANK = "b" * 64
INSTR = "c" * 64


def body(run_id, *, n=40, acc=0.5, parse=0, axis="safety", model=MODEL, bank=BANK, instr=INSTR):
    return {"model": model, "axis": axis, "n": n, "accuracy": acc,
            "compute_evidence": {"run_id": run_id, "bank_sha256": bank, "instrument_sha256": instr,
                                 "parse_errors_excluded": parse, "transport_errors_excluded": 0}}


class BridgeGates(unittest.TestCase):
    def setUp(self):
        self.td = tempfile.TemporaryDirectory()
        self.root = pathlib.Path(self.td.name)
        self.i = 0

    def tearDown(self):
        self.td.cleanup()

    def put(self, b):
        self.i += 1
        d = self.root / f"r{self.i}"
        d.mkdir()
        raw = json.dumps({"body": b}).encode()
        (d / "candidate.json").write_bytes(raw)
        (d / "verification.json").write_text(json.dumps({
            "schema": "csoai.runpod-gspc-intake-verification/0.1", "state": "VERIFIED_QUARANTINE",
            "run_id": b["compute_evidence"]["run_id"],
            "source_hashes": {"card_file_sha256": hashlib.sha256(raw).hexdigest()}}))

    def run_collect(self, held=frozenset()):
        staged, aside, probs = bridge.collect(self.root, set(held))
        self.assertEqual(probs, [])
        return staged, aside

    def test_clean_run_stages(self):
        self.put(body("20260923T000000Z-a"))
        staged, aside = self.run_collect()
        self.assertEqual([s["run_id"] for s in staged], ["20260923T000000Z-a"])
        self.assertEqual(aside, [])

    def test_exact_one_is_hold(self):
        self.put(body("20260923T000000Z-a", acc=1))
        staged, aside = self.run_collect()
        self.assertEqual(staged, [])
        self.assertEqual(aside[0]["reason"], "HOLD_EXACT_0_1")

    def test_exact_zero_is_hold(self):
        self.put(body("20260923T000000Z-a", acc=0.0))
        staged, aside = self.run_collect()
        self.assertEqual(staged, [])
        self.assertEqual(aside[0]["reason"], "HOLD_EXACT_0_1")

    def test_unparsed_over_ten_percent_drops(self):
        # 5 unparsed of 45 attempted = 11.1%
        self.put(body("20260923T000000Z-a", n=40, parse=5))
        staged, aside = self.run_collect()
        self.assertEqual(staged, [])
        self.assertTrue(aside[0]["reason"].startswith("INSTRUMENT_FAILURE_unparsed_11.1"))

    def test_unparsed_at_ten_percent_passes(self):
        self.put(body("20260923T000000Z-a", n=45, parse=5))  # exactly 10%
        staged, _ = self.run_collect()
        self.assertEqual(len(staged), 1)

    def test_held_cell_is_never_staged(self):
        self.put(body("20260923T000000Z-a"))
        self.put(body("20260923T000000Z-b", axis="care"))
        staged, aside = self.run_collect(held={(MODEL, "safety")})
        self.assertEqual([s["body"]["axis"] for s in staged], ["care"])
        self.assertEqual(aside[0]["reason"], "HELD_LIST")

    def test_earliest_passing_run_is_run_of_record(self):
        self.put(body("20260914T000000Z-old"))
        self.put(body("20260923T000000Z-new"))
        staged, aside = self.run_collect()
        self.assertEqual([s["run_id"] for s in staged], ["20260914T000000Z-old"])
        self.assertTrue(aside[0]["reason"].startswith("NOT_RUN_OF_RECORD"))

    def test_failing_earlier_run_does_not_block_later_passing_run(self):
        self.put(body("20260914T000000Z-old", acc=1))
        self.put(body("20260923T000000Z-new"))
        staged, _ = self.run_collect()
        self.assertEqual([s["run_id"] for s in staged], ["20260923T000000Z-new"])

    def test_cells_split_by_bank_and_instrument(self):
        self.put(body("20260914T000000Z-a", axis="swarm", bank="1" * 64))
        self.put(body("20260923T000000Z-b", axis="swarm", bank="2" * 64))
        self.put(body("20260924T000000Z-c", axis="swarm", bank="2" * 64, instr="9" * 64))
        staged, aside = self.run_collect()
        self.assertEqual(len(staged), 3)
        self.assertEqual(aside, [])
        self.assertEqual(len({s["cell"] for s in staged}), 3, "file names must not collide")

    def test_shipped_held_list_loads_and_is_nonempty(self):
        held = bridge.load_held()
        self.assertGreaterEqual(len(held), 6)

    def test_det_and_affect_banks_are_off_allowlist(self):
        allow = json.loads((HERE / "runpod_gspc_bank_allowlist.current.json").read_text())
        shas = {b["sha256"][:8] for b in allow["banks"]}
        axes = {b["axis"] for b in allow["banks"]}
        self.assertNotIn("d75e9680", shas)
        self.assertNotIn("c64a5986", shas)
        self.assertNotIn("detector-interop", axes)
        self.assertNotIn("affect", axes)


if __name__ == "__main__":
    unittest.main()
