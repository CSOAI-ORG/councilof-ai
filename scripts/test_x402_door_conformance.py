import json
import re
import tempfile
import unittest
from pathlib import Path
from unittest import mock

import sys
sys.path.insert(0, str(Path(__file__).parent / "probes"))
import x402_door_conformance as probe

FORBIDDEN = re.compile(
    r"\b(hacked|broken|unsafe|non-?compliant|compliant|violat(?:ed|es|ion|ions)?|fined|certif(?:ied|ication|y)|approved)\b"
    r"|(?<!UN)MEASURED",
    re.I,
)

DISCOVERY = {
    "x402Version": 2, "network": "eip155:8453",
    "asset": "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
    "payTo": "0x212686404A7D1E1fD88F35eD6200c3aF7A78ae31",
    "resources": [
        {"method": "GET", "url": "https://councilof.ai/api/free-door", "amount": "0", "paid_for": None},
        {"method": "GET", "url": "https://councilof.ai/api/rwa/evidence?asset=RLUSD", "amount": None, "paid_for": "issuance"},
    ],
}


def challenge(url: str, catalog: dict) -> bytes:
    return json.dumps({
        "x402Version": 2, "error": "Payment required",
        "accepts": [{"scheme": "exact", "network": "base", "asset": catalog["asset"],
                     "payTo": catalog["payTo"], "resource": url, "amount": "500"}],
    }).encode()


def fake_fetch(url: str):
    if url.endswith("x402.json"):
        return 200, json.dumps(DISCOVERY).encode()
    return 402, challenge(url, DISCOVERY)


class X402ConformanceTest(unittest.TestCase):
    def _run(self, tmp: str, fetch) -> None:
        probe.PACK_DIR = Path(tmp) / "pack"
        with mock.patch.object(probe, "_fetch", side_effect=fetch):
            probe.main()

    def test_all_conformant(self):
        with tempfile.TemporaryDirectory() as tmp:
            self._run(tmp, fake_fetch)
            report = json.loads((Path(tmp) / "pack" / "report.json").read_text())
            self.assertEqual(report["summary"]["probed_conformant"], 2)
            self.assertEqual(report["summary"]["uncheckable"], 0)
            atoms = list((Path(tmp) / "pack").glob("card-*-unsigned.json"))
            self.assertEqual(len(atoms), 1)  # summary only — conformant doors ride it
            card = json.loads(atoms[0].read_text())
            self.assertEqual(card["payload"]["state"], "PROBED")
            self.assertIn("fulfillment_bytes", card["unmeasured"])

    def test_mismatch_is_discovered_not_verdict(self):
        def bad_fetch(url: str):
            if url.endswith("x402.json"):
                return 200, json.dumps(DISCOVERY).encode()
            if "rwa" in url:
                return 402, json.dumps({"x402Version": 2, "accepts": [
                    {"scheme": "exact", "network": "ethereum", "asset": "0xdead",
                     "payTo": "0xwrong", "resource": url, "amount": "500"}]}).encode()
            return 402, challenge(url, DISCOVERY)
        with tempfile.TemporaryDirectory() as tmp:
            self._run(tmp, bad_fetch)
            report = json.loads((Path(tmp) / "pack" / "report.json").read_text())
            self.assertEqual(report["summary"]["discovered_mismatch"], 1)
            exc = json.loads((Path(tmp) / "pack" / "card-x402-door-1-unsigned.json").read_text())
            self.assertEqual(exc["payload"]["state"], "DISCOVERED")
            self.assertTrue(exc["payload"]["not_delivery_proof"])

    def test_dark_network_uncheckable_never_raises(self):
        def dark(url: str):
            return 0, b"timeout"
        with tempfile.TemporaryDirectory() as tmp:
            self._run(tmp, dark)
            report = json.loads((Path(tmp) / "pack" / "report.json").read_text())
            self.assertEqual(report["discovery"]["state"], "UNCHECKABLE")
            self.assertEqual(report["doors"], [])

    def test_atoms_pass_staged_intake_rules(self):
        with tempfile.TemporaryDirectory() as tmp:
            self._run(tmp, fake_fetch)
            sys.path.insert(0, str(Path(__file__).parent / "adapters"))
            import staged_leaves
            for f in (Path(tmp) / "pack").glob("card-*-unsigned.json"):
                card = json.loads(f.read_text())
                self.assertIsNone(staged_leaves._check(card), f.name)
                blob = staged_leaves.canonical_bytes(card).decode("utf-8")
                self.assertIsNone(staged_leaves.VERDICT_RE.search(blob), f.name)


if __name__ == "__main__":
    unittest.main()
