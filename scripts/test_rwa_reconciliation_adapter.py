import json
import re
import tempfile
import unittest
from pathlib import Path

from adapters import rwa_reconciliation

FORBIDDEN = re.compile(
    r"\b(oracle|risk|risky|safe|unsafe|compliant|non-compliant|rating|ratings)\b|(?<!UN)MEASURED",
    re.I,
)

FIGURES = {
    "schema": "csoai.rwa-reconciliation/0.1",
    "generated_at": "2026-09-12T07:14:27Z",
    "jmwh": {
        "xrpl_distributed_usd": {"value": 456408587.34, "as_of": "2026-09-12", "source": "rwa-xyz-networks.html"},
        "xrpl_represented_usd": {"value": 4059785946.09, "as_of": "2026-09-12", "source": "rwa-xyz-networks.html"},
        "largest_single_asset": {
            "id_or_name": "JMWH", "represented_usd": 2229136800.0, "share_pct": 54.91,
            "as_of": "2026-09-12", "source": "rwa-xyz-asset-jmwh.html", "platform": "Justoken",
        },
    },
    "benji": {
        "number_benji_asset_usd": {"value": 685918581.86, "as_of": "2026-09-12", "source": "rwa-xyz-asset-benji.html",
                                   "definition": "rwa.xyz circulating asset value of BENJI, 8 public chains"},
        "number_fobxx_fund_usd": None,
        "number_platform_usd": {"value": 2500000000, "as_of": "2026-09-12", "source": "franklintempleton-benji-platform.html"},
    },
    "unmeasured": ["fobxx_fund_usd (SEC filing not archived)"],
}


class RwaReconciliationAdapterTest(unittest.TestCase):
    def _run(self, payload) -> dict:
        tmp = tempfile.TemporaryDirectory()
        self.addCleanup(tmp.cleanup)
        root = Path(tmp.name)
        path = root / rwa_reconciliation.REL
        path.parent.mkdir(parents=True)
        path.write_text(json.dumps(payload, sort_keys=True) + "\n")
        return rwa_reconciliation.collect(root)

    def test_two_leaves_with_scope_rule(self):
        out = self._run(FIGURES)
        self.assertEqual(out["sidecar"]["status"], "PROBED")
        self.assertEqual(len(out["leaves"]), 2)
        jmwh, benji = out["leaves"]
        self.assertEqual(jmwh["payload"]["kind"], "csoai.rwa-concentration/0.1")
        self.assertEqual(jmwh["payload"]["largest_single_asset"]["share_pct"], 54.91)
        self.assertIn("never mix scopes", jmwh["payload"]["rule"])
        self.assertEqual(benji["payload"]["kind"], "csoai.benji-reconciliation/0.1")
        self.assertIn("number_fobxx_fund_usd", benji["payload"]["unmeasured"])
        self.assertIsNone(benji["payload"]["number_fobxx_fund_usd"])

    def test_payload_cap_and_vocabulary(self):
        out = self._run(FIGURES)
        for leaf in out["leaves"]:
            self.assertLessEqual(len(rwa_reconciliation._canon(leaf["payload"])), 3072)
            blob = json.dumps(leaf, ensure_ascii=False)
            self.assertEqual(FORBIDDEN.findall(blob), [], leaf["subject"])

    def test_absent_invalid_never_raises(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            self.assertEqual(rwa_reconciliation.collect(root)["sidecar"]["status"], "ABSENT")
            path = root / rwa_reconciliation.REL
            path.parent.mkdir(parents=True)
            path.write_text("{")
            self.assertEqual(rwa_reconciliation.collect(root)["sidecar"]["status"], "INVALID")
            out = rwa_reconciliation.collect(path)  # file as root: never raises
            self.assertEqual(out["leaves"], [])


if __name__ == "__main__":
    unittest.main()
