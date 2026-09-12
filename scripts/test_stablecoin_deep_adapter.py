import json
import re
import tempfile
import unittest
from pathlib import Path

from adapters import stablecoin_deep

FORBIDDEN = re.compile(
    r"\b(oracle|risk|risky|safe|unsafe|compliant|non-compliant|rating|ratings)\b|(?<!UN)MEASURED",
    re.I,
)

ROW_PROBED = {
    "id": "2",
    "symbol": "USDC",
    "name": "USD Coin",
    "attestation_page": "https://www.circle.com/en/transparency",
    "auditor": "Deloitte",
    "cadence_claimed": "daily",
    "latest_report_date": None,
    "staleness_days": None,
    "excerpt": "Independently audited Deloitte & Touche LLP is Circle's independent auditor",
    "mirror": "mirrors/2.html",
    "mirror_sha256": "ab" * 32,
    "measurement_state": "DEEP_PROBED",
    "unmeasured": ["staleness"],
    "findings": ["no attestation figure/date in served bytes"],
}
ROW_UNMEASURED = {
    "id": "3", "symbol": "USDS", "name": "Sky Dollar",
    "attestation_page": None, "auditor": None, "cadence_claimed": None,
    "latest_report_date": None, "staleness_days": None, "excerpt": None,
    "mirror": None, "mirror_sha256": None,
    "measurement_state": "UNMEASURED", "unmeasured": ["attestation_page"], "findings": [],
}
DEEP = {
    "schema": "csoai.stablecoin-deep/0.1",
    "generated_at": "2026-09-12T07:00:00Z",
    "release_id": "stablecoin-deep-2026-09",
    "top_n": 2,
    "rows": [ROW_PROBED, ROW_UNMEASURED],
    "summary": {"n_with_attestation_page": 1, "n_with_auditor": 1, "n_with_staleness": 0, "median_staleness_days": None},
    "truth_rules": ["DEEP_PROBED is not a certification."],
}


def _write(root: Path, payload: dict) -> None:
    path = root / stablecoin_deep.REL
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, sort_keys=True) + "\n")


class StablecoinDeepAdapterTest(unittest.TestCase):
    def test_summary_plus_per_asset_leaves(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            _write(root, DEEP)
            out = stablecoin_deep.collect(root)
            self.assertEqual(out["sidecar"]["status"], "PROBED")
            self.assertEqual(len(out["leaves"]), 3)
            summary = out["leaves"][0]
            self.assertEqual(summary["payload"]["kind"], "csoai.stablecoin-deep-summary/0.1")
            self.assertEqual(summary["payload"]["n_deep_probed"], 1)
            asset = out["leaves"][1]
            self.assertEqual(asset["payload"]["status"], "DEEP_PROBED")
            self.assertEqual(asset["payload"]["auditor"], "Deloitte")
            unmeas = out["leaves"][2]
            self.assertEqual(unmeas["payload"]["status"], "UNMEASURED")
            self.assertIsNone(unmeas["payload"]["attestation_page"])

    def test_payload_cap_and_vocabulary(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            _write(root, DEEP)
            out = stablecoin_deep.collect(root)
            for leaf in out["leaves"]:
                self.assertLessEqual(len(stablecoin_deep._canon(leaf["payload"])), 3072)
                blob = json.dumps(leaf, ensure_ascii=False)
                self.assertEqual(FORBIDDEN.findall(blob), [], leaf["subject"])

    def test_absent_invalid_and_never_raises(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            self.assertEqual(stablecoin_deep.collect(root)["sidecar"]["status"], "ABSENT")
            path = root / stablecoin_deep.REL
            path.parent.mkdir(parents=True)
            path.write_text("not json")
            self.assertEqual(stablecoin_deep.collect(root)["sidecar"]["status"], "INVALID")
            _write(root, {"schema": "wrong"})
            self.assertEqual(stablecoin_deep.collect(root)["sidecar"]["status"], "INVALID")
            out = stablecoin_deep.collect(path)  # file as root: never raises
            self.assertEqual(out["leaves"], [])


if __name__ == "__main__":
    unittest.main()
