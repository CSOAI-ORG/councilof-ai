import json
import tempfile
import unittest
from pathlib import Path
from unittest import mock

import sys
sys.path.insert(0, str(Path(__file__).parent / "probes"))
sys.path.insert(0, str(Path(__file__).parent / "adapters"))
import mcp_liveness_sample as live  # noqa: E402
import staged_leaves  # noqa: E402

REGISTER_ROWS = [
    {"source": "modelcontextprotocol-registry", "kind": "mcp-server", "id": "a/one",
     "versions": ["1.0.0"], "latest_observed": "1.0.0", "exposes_remote_endpoint": True},
    {"source": "modelcontextprotocol-registry", "kind": "mcp-server", "id": "b/two",
     "versions": ["2.0.0"], "latest_observed": "2.0.0", "exposes_remote_endpoint": True},
    {"source": "modelcontextprotocol-registry", "kind": "mcp-server", "id": "c/noremote",
     "versions": ["1.0.0"], "latest_observed": "1.0.0", "exposes_remote_endpoint": False},
]


class LivenessTest(unittest.TestCase):
    def _setup(self, tmp: str):
        reg = Path(tmp) / "register.jsonl"
        reg.write_text("\n".join(json.dumps(r) for r in REGISTER_ROWS) + "\n")
        live.PACK_DIR = Path(tmp) / "pack"
        live.REGISTER_REL = reg

    def test_deterministic_sample_excludes_non_remote(self):
        with tempfile.TemporaryDirectory() as tmp:
            self._setup(tmp)
            ids1 = live._sample_ids(live.REGISTER_REL, 10)
            ids2 = live._sample_ids(live.REGISTER_REL, 10)
            self.assertEqual(ids1, ids2)
            self.assertEqual(sorted(i[0] for i in ids1), ["a/one", "b/two"])

    def test_probe_states(self):
        init_ok = json.dumps({"jsonrpc": "2.0", "id": 1, "result": {
            "protocolVersion": "2025-06-18", "serverInfo": {"name": "x"}}}).encode()
        with mock.patch.object(live.urllib.request, "urlopen") as uo:
            resp = mock.Mock(); resp.status = 200; resp.read.return_value = init_ok
            resp.headers = {"Content-Type": "application/json"}
            resp.__enter__ = lambda s: s; resp.__exit__ = mock.Mock()
            uo.return_value = resp
            out = live._probe("https://x.example/mcp", "streamable-http")
            self.assertEqual(out["state"], "LIVE")
        with mock.patch.object(live.urllib.request, "urlopen") as uo:
            uo.side_effect = live.urllib.error.HTTPError("u", 401, "unauth", {}, None)
            out = live._probe("https://x.example/mcp", "streamable-http")
            self.assertEqual(out["state"], "AUTH_REQUIRED")
        with mock.patch.object(live.urllib.request, "urlopen") as uo:
            uo.side_effect = TimeoutError("slow")
            out = live._probe("https://x.example/mcp", "streamable-http")
            self.assertEqual(out["state"], "UNREACHABLE")

    def test_full_run_dark_registry_never_raises(self):
        with tempfile.TemporaryDirectory() as tmp:
            self._setup(tmp)
            live.REGISTER_REL = Path(tmp) / "missing.jsonl"  # force fallback path
            with mock.patch.object(live, "_get_json", return_value=None):
                self.assertEqual(live.main(), 0)
            report = json.loads((live.PACK_DIR / "report.json").read_text())
            self.assertEqual(report["state"], "UNCHECKABLE")

    def test_atom_passes_intake(self):
        with tempfile.TemporaryDirectory() as tmp:
            self._setup(tmp)
            rem = {"type": "streamable-http", "url": "https://x.example/mcp"}
            with mock.patch.object(live, "_remote_for", return_value=rem), \
                 mock.patch.object(live, "_probe", return_value={"state": "LIVE", "http": 200, "transport": "streamable-http"}):
                self.assertEqual(live.main(), 0)
            atoms = list(live.PACK_DIR.glob("card-*-unsigned.json"))
            self.assertEqual(len(atoms), 1)
            card = json.loads(atoms[0].read_text())
            self.assertIsNone(staged_leaves._check(card))
            self.assertEqual(card["payload"]["state"], "PROBED")
            self.assertTrue(card["payload"]["not_a_grade"])
            report = json.loads((live.PACK_DIR / "report.json").read_text())
            self.assertEqual(report["state_counts"].get("LIVE"), 2)


if __name__ == "__main__":
    unittest.main()
