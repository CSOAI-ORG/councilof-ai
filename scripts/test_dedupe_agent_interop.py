import json
import re
import tempfile
import unittest
from pathlib import Path

import sys
sys.path.insert(0, str(Path(__file__).parent / "census"))
sys.path.insert(0, str(Path(__file__).parent / "adapters"))
import importlib.util  # noqa: E402
_spec = importlib.util.spec_from_file_location(
    "dedupe_agent_interop", Path(__file__).parent / "census" / "dedupe-agent-interop.py")
ded = importlib.util.module_from_spec(_spec)  # noqa: E402
_spec.loader.exec_module(ded)  # noqa: E402
import staged_leaves  # noqa: E402

ROWS = [
    {"source": "modelcontextprotocol-registry", "kind": "mcp-server", "id": "a/b", "version": "1.0.0", "is_latest": False, "status": "active", "repo_url": "https://github.com/x/y"},
    {"source": "modelcontextprotocol-registry", "kind": "mcp-server", "id": "a/b", "version": "1.2.0", "is_latest": True, "status": "active", "repo_url": "https://github.com/x/y"},
    {"source": "modelcontextprotocol-registry", "kind": "mcp-server", "id": "a/b", "version": "1.10.0", "is_latest": False, "status": "active", "repo_url": "https://github.com/x/y"},
    {"source": "huggingface-spaces", "kind": "hf-space", "id": "x/y", "version": None, "is_latest": False, "status": "public", "repo_url": "https://github.com/x/y"},
    {"source": "smithery-registry", "kind": "mcp-server", "id": "c/d", "version": "0.1.0", "is_latest": True, "status": "listed", "repo_url": None},
]


class DedupeTest(unittest.TestCase):
    def test_collapse_and_version_order(self):
        with tempfile.TemporaryDirectory() as tmp:
            p = Path(tmp) / "census.jsonl"
            p.write_text("\n".join(json.dumps(r) for r in ROWS) + "\n")
            out = ded.dedupe(p)
            self.assertEqual(out["rows"], 5)
            self.assertEqual(out["n_canonical"], 3)
            self.assertEqual(out["multi_version"], 1)
            self.assertEqual(out["cross_source_links"], 1)
            ent = out["identities"][("modelcontextprotocol-registry", "mcp-server", "a/b")]
            self.assertEqual(ent["versions"], ["1.0.0", "1.2.0", "1.10.0"])  # semver-ish, not lexical
            self.assertEqual(ent["latest_observed"], "1.2.0")  # is_latest flag wins

    def test_full_run_writes_pack_and_valid_atom(self):
        with tempfile.TemporaryDirectory() as tmp:
            census = Path(tmp) / "census.jsonl"
            census.write_text("\n".join(json.dumps(r) for r in ROWS) + "\n")
            ded.PACK_DIR = Path(tmp) / "pack"
            sys.argv = ["dedupe", "--census", str(census)]
            self.assertEqual(ded.main(), 0)
            report = json.loads((ded.PACK_DIR / "dedupe-report.json").read_text())
            self.assertEqual(report["counts"]["canonical_identities"], 3)
            atom = json.loads((ded.PACK_DIR / "card-agent-interop-canonical-unsigned.json").read_text())
            self.assertIsNone(staged_leaves._check(atom))
            self.assertEqual(atom["payload"]["state"], "PROBED")
            self.assertTrue(atom["payload"]["not_a_measurement"])


if __name__ == "__main__":
    unittest.main()
