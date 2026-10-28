"""Regressions for the actual wrapper dataset workflow exporter; no Hub or credentials."""
import ast
import copy
import hashlib
import json
from pathlib import Path
import re
import tempfile
import textwrap
import unittest

ROOT = Path(__file__).resolve().parents[1]
WORKFLOW = ROOT / ".github/workflows/wrapper-dataset-refresh.yml"

def exporter_functions():
    text = WORKFLOW.read_text(encoding="utf-8")
    body = re.search(r"python3 - <<'PYEOF'\n(.*?)\n          PYEOF", text, re.S)
    if not body:
        raise AssertionError("workflow exporter heredoc is missing")
    parsed = ast.parse(textwrap.dedent(body.group(1)))
    nodes = [n for n in parsed.body if isinstance(n, (ast.Import, ast.ImportFrom, ast.FunctionDef))]
    scope = {}
    exec(compile(ast.Module(body=nodes, type_ignores=[]), str(WORKFLOW), "exec"), scope)
    return scope["export_records"], scope["write_checksums"]

class WrapperExportTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.root = Path(self.temp.name)
        self.source = self.root / "wrapped-asset-parity.json"
        self.output = self.root / "records.jsonl"
        self.export, self.checksums = exporter_functions()
        self.ledger = json.loads((ROOT / "public/interop/wrapped-asset-parity-latest.json").read_text(encoding="utf-8"))

    def tearDown(self):
        self.temp.cleanup()

    def write(self, value):
        self.source.write_text(json.dumps(value, ensure_ascii=False), encoding="utf-8")

    def test_real_ledger_description_never_becomes_character_rows(self):
        self.assertIsInstance(self.ledger["attests"], str)
        self.write(self.ledger)
        count = self.export(self.source, self.output)
        rows = [json.loads(line) for line in self.output.read_text(encoding="utf-8").splitlines()]
        self.assertEqual(count, len(self.ledger["records"]))
        self.assertEqual({r["id"] for r in rows}, {r["id"] for r in self.ledger["records"]})
        for row, record in zip(rows, self.ledger["records"]):
            self.assertEqual(row["as_of"], self.ledger["as_of"])
            self.assertEqual(row["state"], record["state"])
            self.assertEqual(row["wrapped_address"], record["wrapped"]["address"])
            self.assertEqual(row["wrapped_total_supply"], (record.get("reads", {}).get("wrapped_total_supply") or {}).get("normalized"))
            self.assertEqual(row["escrow_over_wrapped"], record.get("escrow_over_wrapped"))
            self.assertEqual(set(row), {"id", "wrapped_chain", "wrapped_symbol", "wrapped_address", "canonical_chain", "canonical_symbol", "backing_model", "escrow", "state", "wrapped_total_supply", "escrow_balance", "escrow_over_wrapped", "wrapped_block", "canonical_block", "as_of", "note"})

    def test_missing_or_scalar_records_fail_before_writing(self):
        for bad in [None, "description", [], {}]:
            with self.subTest(records=bad):
                value = copy.deepcopy(self.ledger)
                value["records"] = bad
                self.write(value)
                with self.assertRaises(ValueError):
                    self.export(self.source, self.output)
                self.assertFalse(self.output.exists())

    def test_duplicate_id_and_unknown_state_fail_before_writing(self):
        for mutation in ["duplicate", "state"]:
            with self.subTest(mutation=mutation):
                value = copy.deepcopy(self.ledger)
                if mutation == "duplicate":
                    value["records"][1]["id"] = value["records"][0]["id"]
                else:
                    value["records"][0]["state"] = "TRUSTED"
                self.write(value)
                with self.assertRaises(ValueError):
                    self.export(self.source, self.output)
                self.assertFalse(self.output.exists())

    def test_wrong_state_counts_fail_before_writing(self):
        value = copy.deepcopy(self.ledger)
        a, b = list(value["counts"])[:2]
        value["counts"][a] += 1
        value["counts"][b] -= 1
        self.write(value)
        with self.assertRaises(ValueError):
            self.export(self.source, self.output)
        self.assertFalse(self.output.exists())

    def test_checksums_cover_exact_bytes_and_detect_tampering(self):
        self.write(self.ledger)
        self.export(self.source, self.output)
        history = self.root / "historical"
        history.mkdir()
        (history / "atom.json").write_bytes(b'{"state":"UNMEASURED"}\n')
        self.assertEqual(self.checksums(self.root), 3)
        first = (self.root / "wrapped-asset-parity.sha256").read_text(encoding="utf-8")
        self.assertEqual(self.checksums(self.root), 3)
        self.assertEqual(first, (self.root / "wrapped-asset-parity.sha256").read_text(encoding="utf-8"))
        for line in first.splitlines():
            digest, name = line.split("  ", 1)
            self.assertEqual(hashlib.sha256((self.root / name).read_bytes()).hexdigest(), digest)
        self.output.write_bytes(self.output.read_bytes() + b"tampered")
        listed = dict((name, digest) for digest, name in (line.split("  ", 1) for line in first.splitlines()))
        self.assertNotEqual(hashlib.sha256(self.output.read_bytes()).hexdigest(), listed["records.jsonl"])

if __name__ == "__main__":
    unittest.main()
