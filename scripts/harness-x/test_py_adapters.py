#!/usr/bin/env python3
"""Offline tests for the rendered Python adapters (langchain-csoai, llama-index-tools-csoai, crewai-csoai).

2026-09-26: each adapter exposed only gspc_board; verification — free, and the core promise — had to be
called from csoai_gspc directly. These pin that every adapter now carries verify_card and that its
reader never turns "could not check" into a verdict. No network, no framework install needed:
the shared _board.py imports only csoai_gspc, which is loaded from this repository's source.

    python3 scripts/harness-x/test_py_adapters.py
"""
import importlib.util
import sys
import unittest
from pathlib import Path
from unittest import mock

REPO = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(REPO / "scripts/spray/pypi/csoai-gspc"))

ADAPTERS = {
    "langchain-csoai": ("langchain_csoai/_board.py", "langchain_csoai/tools.py"),
    "llama-index-tools-csoai": ("llama_index/tools/csoai/_board.py", "llama_index/tools/csoai/base.py"),
    "crewai-csoai": ("crewai_csoai/_board.py", "crewai_csoai/tools.py"),
}


def load_board(name):
    rel = ADAPTERS[name][0]
    spec = importlib.util.spec_from_file_location(f"_board_{name.replace('-', '_')}", REPO / "distribution/python" / name / rel)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


class EveryAdapterCarriesVerifyCard(unittest.TestCase):
    def test_tool_is_exposed_in_each_framework_file(self):
        for name, (_, tools_rel) in ADAPTERS.items():
            src = (REPO / "distribution/python" / name / tools_rel).read_text(encoding="utf-8")
            if name == "llama-index-tools-csoai":
                self.assertIn('spec_functions = ["gspc_board", "verify_card"]', src, name)
            else:
                self.assertIn("class VerifyCardTool(BaseTool):", src, name)
                self.assertIn("read_verify(card_id, card)", src, name)

    def test_board_readers_are_one_file(self):
        texts = {(REPO / "distribution/python" / n / r).read_text(encoding="utf-8") for n, (r, _) in ADAPTERS.items()}
        self.assertEqual(len(texts), 1)


class ReadVerifyIsThreeState(unittest.TestCase):
    def setUp(self):
        self.b = load_board("langchain-csoai")

    def test_no_input_is_uncheckable(self):
        self.assertEqual(self.b.read_verify()["state"], "UNCHECKABLE")

    def test_abbreviated_id_is_uncheckable_without_network(self):
        with mock.patch("urllib.request.urlopen", side_effect=AssertionError("no network")):
            out = self.b.read_verify(card_id="acf6bf03…65133a4")
        self.assertEqual(out["state"], "UNCHECKABLE")
        self.assertIn("64 hex", out["reason"])

    def test_unparseable_card_json_is_uncheckable(self):
        self.assertEqual(self.b.read_verify(card="{not json")["state"], "UNCHECKABLE")

    def test_network_failure_is_uncheckable_never_invalid(self):
        with mock.patch("urllib.request.urlopen", side_effect=OSError("down")):
            out = self.b.read_verify(card_id="a" * 64)
        self.assertEqual(out["state"], "UNCHECKABLE")

    def test_a_card_object_reaches_the_verifier_and_its_verdict_is_returned(self):
        from csoai_gspc import Verdict
        with mock.patch.object(self.b, "_verify_card", return_value=Verdict("INVALID", "id does not match its body", "c" * 64)):
            out = self.b.read_verify(card={"id": "c" * 64, "body": {}})
        self.assertEqual((out["state"], out["card_id"]), ("INVALID", "c" * 64))


if __name__ == "__main__":
    unittest.main()
