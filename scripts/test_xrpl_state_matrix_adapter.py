import json
import re
import tempfile
import unittest
from pathlib import Path

from adapters import xrpl_state_matrix as sm

FIXTURES = Path(__file__).parent / "adapters" / "fixtures" / "xrpl-state-matrix"
FORBIDDEN = re.compile(
    r"\b(oracle|risk|risky|safe|unsafe|compliant|non-compliant|rating|ratings)\b|(?<!UN)MEASURED",
    re.I,
)

FIXTURE_ADDR = {
    "rMxCKbEDwqr76QuheSUMdEGf4B9xJ8m5De": "account-info-RLUSD.json",
    "rHuiXXjHLpMP8ZE9sSQU5aADQVWDwv6h5p": "account-info-OUSG.json",
}


def fixture_rpc(url: str, payload: dict) -> bytes:
    addr = payload["params"][0]["account"]
    name = FIXTURE_ADDR.get(addr)
    if name is None:
        raise RuntimeError(f"no fixture for {addr}")
    return (FIXTURES / name).read_bytes()


METRICS = {
    "ok": True,
    "updatedAt": "2026-09-13T00:00:00Z",
    "assets": [
        {"symbol": "RLUSD", "issuerAddress": "rMxCKbEDwqr76QuheSUMdEGf4B9xJ8m5De",
         "supply": 1053014745.15, "holders": 67245, "verifiedVia": "Bidirectional domain match"},
        {"symbol": "OUSG", "issuerAddress": "rHuiXXjHLpMP8ZE9sSQU5aADQVWDwv6h5p",
         "supply": 1639899.44, "holders": 34, "verifiedVia": "Bidirectional domain match"},
    ],
}


class StateMatrixTest(unittest.TestCase):
    def test_matrix_from_fixtures_first_run(self):
        with tempfile.TemporaryDirectory() as tmp:
            out = sm.collect(tmp, fetch_rpc=fixture_rpc, metrics=METRICS)
            self.assertEqual(out["sidecar"]["status"], "CHANGED")  # first run: all added
            self.assertEqual(out["sidecar"]["n_changed"], 16)
            self.assertEqual(len(out["leaves"]), 17)
            summary = out["leaves"][0]
            self.assertEqual(summary["payload"]["kind"], "csoai.xrpl-identity-state-matrix/0.1")
            self.assertEqual(summary["payload"]["n_identities"], 16)
            self.assertIsNotNone(summary["payload"]["ledger_index"])
            for leaf in out["leaves"]:
                self.assertLessEqual(len(sm._canon(leaf["payload"])), 3072)

    def test_field_separation_and_flag_decode(self):
        with tempfile.TemporaryDirectory() as tmp:
            sm.collect(tmp, fetch_rpc=fixture_rpc, metrics=METRICS)
            matrix = json.loads((Path(tmp) / sm.MATRIX_REL).read_text())
            rlusd = next(r for r in matrix["identities"] if r["symbol"] == "RLUSD")
            self.assertEqual(rlusd["field_states"]["identity"], "OBSERVED")
            self.assertEqual(rlusd["field_states"]["issuer_account"], "OBSERVED")
            self.assertEqual(rlusd["field_states"]["transfer_controls"], "OBSERVED")
            self.assertEqual(rlusd["field_states"]["reserve_claim"], "UNMEASURED")
            self.assertEqual(rlusd["field_states"]["supply"], "UNMEASURED")
            self.assertEqual(rlusd["field_states"]["holders"], "UNMEASURED")
            self.assertIn("allow_trustline_clawback", rlusd["transfer_controls"])
            self.assertIsNone(rlusd["supply"])
            self.assertIsNone(rlusd["holders"])
            self.assertEqual(rlusd["source_reported_supply"], 1053014745.15)
            self.assertEqual(rlusd["source_reported_holders"], 67245)
            self.assertEqual(rlusd["source_reported_toml_state"], "Bidirectional domain match")

    def test_unchanged_matrix_emits_no_leaves(self):
        with tempfile.TemporaryDirectory() as tmp:
            sm.collect(tmp, fetch_rpc=fixture_rpc, metrics=METRICS)
            out2 = sm.collect(tmp, fetch_rpc=fixture_rpc, metrics=METRICS)
            self.assertEqual(out2["leaves"], [])
            self.assertEqual(out2["sidecar"]["status"], "UNCHANGED")

    def test_change_produces_delta_leaf(self):
        with tempfile.TemporaryDirectory() as tmp:
            sm.collect(tmp, fetch_rpc=fixture_rpc, metrics=METRICS)
            moved = json.loads(json.dumps(METRICS))
            moved["assets"][0]["holders"] = 70000
            out = sm.collect(tmp, fetch_rpc=fixture_rpc, metrics=moved)
            self.assertEqual(out["sidecar"]["status"], "CHANGED")
            kinds = [l["payload"]["kind"] for l in out["leaves"]]
            self.assertIn("csoai.xrpl-identity-delta/0.1", kinds)
            delta = out["leaves"][1]["payload"]
            self.assertEqual(delta["symbol"], "RLUSD")
            self.assertEqual(delta["changed_fields"][0]["field"], "source_reported_holders")
            self.assertEqual(delta["changed_fields"][0]["from"], 67245)
            self.assertEqual(delta["changed_fields"][0]["to"], 70000)

    def test_dark_sources_never_raise(self):
        def dark_rpc(url, payload):
            raise OSError("dark")
        with tempfile.TemporaryDirectory() as tmp:
            out = sm.collect(tmp, fetch_rpc=dark_rpc, metrics={"ok": False, "assets": []})
            self.assertEqual(out["leaves"], [])
            self.assertEqual(out["sidecar"]["status"], "ABSENT")
            # with committed matrix present -> replay, no leaves, no loss
            sm.collect(tmp, fetch_rpc=fixture_rpc, metrics=METRICS)
            out2 = sm.collect(tmp, fetch_rpc=dark_rpc, metrics={"ok": False, "assets": []})
            self.assertEqual(out2["sidecar"]["status"], "MATRIX_REPLAY")

    def test_vocabulary(self):
        with tempfile.TemporaryDirectory() as tmp:
            out = sm.collect(tmp, fetch_rpc=fixture_rpc, metrics=METRICS)
            for leaf in out["leaves"]:
                blob = json.dumps(leaf, ensure_ascii=False)
                self.assertEqual(FORBIDDEN.findall(blob), [], leaf["subject"])


if __name__ == "__main__":
    unittest.main()
