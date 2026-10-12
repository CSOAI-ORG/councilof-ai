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


def body(run_id, *, n=40, acc=0.5, parse=0, transport=0, axis="safety", model=MODEL, bank=BANK, instr=INSTR):
    return {"model": model, "axis": axis, "n": n, "accuracy": acc,
            "compute_evidence": {"run_id": run_id, "bank_sha256": bank, "instrument_sha256": instr,
                                 "parse_errors_excluded": parse, "transport_errors_excluded": transport}}


class BridgeGates(unittest.TestCase):
    def setUp(self):
        self.td = tempfile.TemporaryDirectory()
        self.root = pathlib.Path(self.td.name)
        self.i = 0

    def tearDown(self):
        self.td.cleanup()

    def put(self, b, instrument_id="exact-label-t128"):
        self.i += 1
        d = self.root / f"r{self.i}"
        d.mkdir()
        raw = json.dumps({"body": b}).encode()
        (d / "candidate.json").write_bytes(raw)
        (d / "verification.json").write_text(json.dumps({
            "schema": "csoai.runpod-gspc-intake-verification/0.1", "state": "VERIFIED_QUARANTINE",
            "instrument_id": instrument_id,
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

    def test_unruled_instrument_is_not_staged(self):
        self.put(body("20260923T000000Z-a"), instrument_id=None)
        staged, aside = self.run_collect()
        self.assertEqual(staged, [])
        self.assertTrue(aside[0]["reason"].startswith("UNRULED_INSTRUMENT"))

    def test_receipt_without_instrument_id_fails_closed(self):
        self.put(body("20260923T000000Z-a"), instrument_id="exact-label-t64")
        staged, _ = self.run_collect()
        self.assertEqual(staged, [])

    def test_every_ruled_id_stages(self):
        for i, iid in enumerate(sorted(bridge.RULED_INSTRUMENT_IDS)):
            self.put(body(f"20260923T00000{i}Z-a", axis=f"ax{i}"), instrument_id=iid)
        staged, _ = self.run_collect()
        self.assertEqual(len(staged), 6)

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
        staged, aside = self.run_collect(held={("qwen2.5:7b", "any", "safety")})
        self.assertEqual([s["body"]["axis"] for s in staged], ["care"])
        self.assertEqual(aside[0]["reason"], "HELD_LIST")

    def test_earliest_passing_run_is_run_of_record(self):
        self.put(body("20260914T000000Z-old"))
        self.put(body("20260923T000000Z-new"))
        staged, aside = self.run_collect()
        self.assertEqual([s["run_id"] for s in staged], ["20260914T000000Z-old"])
        self.assertTrue(aside[0]["reason"].startswith("NOT_RUN_OF_RECORD"))

    def test_exact_0_1_blocks_its_whole_cell(self):
        """R5: a later re-run may not dislodge an exact-0/1 hold."""
        self.put(body("20260914T000000Z-old", acc=1))
        self.put(body("20260923T000000Z-new"))
        self.put(body("20260924T000000Z-newer"))
        staged, aside = self.run_collect()
        self.assertEqual(staged, [])
        reasons = {a["run_id"]: a["reason"] for a in aside}
        self.assertEqual(reasons["20260914T000000Z-old"], "HOLD_EXACT_0_1")
        self.assertEqual(reasons["20260923T000000Z-new"], "HELD_CELL_EXACT_0_1 (20260914T000000Z-old)")
        self.assertEqual(reasons["20260924T000000Z-newer"], "HELD_CELL_EXACT_0_1 (20260914T000000Z-old)")

    def test_exact_0_1_block_is_scoped_to_bank_and_instrument(self):
        self.put(body("20260914T000000Z-old", acc=0))
        self.put(body("20260923T000000Z-other", instr="9" * 64))
        staged, _ = self.run_collect()
        self.assertEqual([s["run_id"] for s in staged], ["20260923T000000Z-other"])

    def test_transport_over_five_percent_is_incomplete_run(self):
        # 3 transport of 53 attempted = 5.7%
        self.put(body("20260923T000000Z-a", n=50, transport=3))
        staged, aside = self.run_collect()
        self.assertEqual(staged, [])
        self.assertTrue(aside[0]["reason"].startswith("UNMEASURED_incomplete_run"))

    def test_transport_at_five_percent_passes(self):
        self.put(body("20260923T000000Z-a", n=95, transport=5))  # exactly 5%
        staged, _ = self.run_collect()
        self.assertEqual(len(staged), 1)

    def test_held_list_matches_model_tag_any_digest(self):
        self.put(body("20260923T000000Z-a", model="ollama:qwen2.5:7b@sha256:" + "f" * 64))
        staged, aside = self.run_collect(held={("qwen2.5:7b", "any", "safety")})
        self.assertEqual(staged, [])
        self.assertEqual(aside[0]["reason"], "HELD_LIST")

    def test_held_list_pinned_digest_only_holds_that_build(self):
        self.put(body("20260923T000000Z-a", model="ollama:qwen2.5:7b@sha256:" + "f" * 64))
        staged, _ = self.run_collect(held={("qwen2.5:7b", "e" * 64, "safety")})
        self.assertEqual(len(staged), 1)

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
        self.assertGreaterEqual(len(held), 15)
        self.assertIn(("phi3.5:3.8b", "any", "governance"), held)
        self.assertIn(("hf.co/openbmb/MiniCPM5-2B-GGUF:Q8_0", "any", "swarm"), held)

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
