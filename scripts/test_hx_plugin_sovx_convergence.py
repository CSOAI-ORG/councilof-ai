#!/usr/bin/env python3
import json
import shutil
import sys
import tempfile
import unittest
from pathlib import Path

SCRIPTS = Path(__file__).resolve().parent
ROOT = SCRIPTS.parent
sys.path.insert(0, str(SCRIPTS))
from check_hx_plugin_sovx_convergence import validate

MANIFEST_REL = Path("public/interop/hx-plugin-sovx-convergence.json")

class ConvergenceContractTest(unittest.TestCase):
    def fixture(self):
        td = tempfile.TemporaryDirectory()
        root = Path(td.name)
        manifest = json.loads((ROOT / MANIFEST_REL).read_text())
        for rel in manifest["canonical_dependencies"]:
            src = ROOT / rel
            dst = root / rel
            dst.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(src, dst)
        dst_manifest = root / MANIFEST_REL
        dst_manifest.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(ROOT / MANIFEST_REL, dst_manifest)
        return td, root

    def mutate_manifest(self, root, fn):
        path = root / MANIFEST_REL
        data = json.loads(path.read_text())
        fn(data)
        path.write_text(json.dumps(data, indent=2) + "\n")

    def test_current_contract_passes(self):
        td, root = self.fixture()
        try:
            validate(root)
        finally:
            td.cleanup()

    def test_wrap_before_admission_fails(self):
        td, root = self.fixture()
        try:
            def mutate(m):
                flow = m["flow"]
                a = flow.index("admission_decision")
                w = flow.index("wrap")
                flow[a], flow[w] = flow[w], flow[a]
            self.mutate_manifest(root, mutate)
            with self.assertRaises(AssertionError):
                validate(root)
        finally:
            td.cleanup()

    def test_payment_authority_invariant_is_required(self):
        td, root = self.fixture()
        try:
            self.mutate_manifest(
                root,
                lambda m: m.__setitem__(
                    "invariants",
                    [x for x in m["invariants"] if not x.lower().startswith("payment never mints trust")],
                ),
            )
            with self.assertRaises(AssertionError):
                validate(root)
        finally:
            td.cleanup()

    def test_unknown_action_cannot_auto_execute(self):
        td, root = self.fixture()
        try:
            self.mutate_manifest(
                root,
                lambda m: m["action_policy"].__setitem__("UNKNOWN", "READ_ONLY"),
            )
            with self.assertRaises(AssertionError):
                validate(root)
        finally:
            td.cleanup()

if __name__ == "__main__":
    unittest.main()
