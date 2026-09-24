#!/usr/bin/env python3
"""Check the dated public page against the signed cards and immutable root it cites."""
from __future__ import annotations

import hashlib
import json
import sys
import unittest
from pathlib import Path
from xml.etree import ElementTree

REPO = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(REPO / "harness" / "gspc-top100"))
from verify_card import did_pubkey_bytes, verify_signed_card  # noqa: E402

DATA = REPO / "client/src/data/mill-batch-2026-09-24.json"
ROUTE = "https://councilof.ai/signals/2026-09-24/"


class DatedMillBatchTest(unittest.TestCase):
    def test_exact_cards_are_signed_and_in_the_named_root(self):
        batch = json.loads(DATA.read_text())
        self.assertEqual(batch["schema"], "csoai.dated-mill-batch/1")
        self.assertEqual(batch["date"], "2026-09-24")
        self.assertEqual(batch["root_as_of"], "2026-09-24T13:22:28Z")
        self.assertEqual(len(batch["cards"]), 14)
        self.assertEqual(len({item["path"] for item in batch["cards"]}), 14)

        root_file = REPO / "public" / batch["root_path"].lstrip("/")
        root_raw = root_file.read_bytes()
        self.assertEqual(hashlib.sha256(root_raw).hexdigest(), batch["root_sha256"])
        root = json.loads(root_raw)
        self.assertEqual(root["merkle_root"], batch["merkle_root"])
        self.assertEqual(root["as_of"], batch["root_as_of"])
        self.assertEqual(root["n_leaves"], 1423)
        leaves = {(leaf["card"], leaf["id"]): leaf["leaf"] for leaf in root["leaves"]}
        did_doc = json.loads((REPO / "public/.well-known/did.json").read_text())

        statuses = []
        for item in batch["cards"]:
            with self.subTest(path=item["path"]):
                self.assertTrue(item["path"].startswith("/interop/mill-cards-signed/signed-"))
                card_file = REPO / "public" / item["path"].lstrip("/")
                card_raw = card_file.read_bytes()
                self.assertEqual(hashlib.sha256(card_raw).hexdigest(), item["sha256"])
                card = json.loads(card_raw)
                self.assertEqual(card["body"]["axis"], item["axis"])
                self.assertEqual(card["body"]["status"], item["status"])
                self.assertEqual(card["body"]["n"], item["n"])
                self.assertEqual(card["body"]["model"].split("@", 1)[0], batch["model"])
                self.assertEqual(card["quotable"], item["status"] == "MEASURED")
                leaf = hashlib.sha256(
                    json.dumps(card, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode()
                ).hexdigest()
                self.assertEqual(leaves[(card_file.name, card["id"])], leaf)
                pubkey = did_pubkey_bytes(did_doc, card["did"])
                self.assertEqual(verify_signed_card(card_raw, pubkey)[0], "VALID")
                statuses.append(item["status"])

        self.assertEqual(statuses.count("MEASURED"), 13)
        self.assertEqual(statuses.count("UNMEASURED"), 1)
        unmeasured = next(item for item in batch["cards"] if item["status"] == "UNMEASURED")
        self.assertEqual((unmeasured["axis"], unmeasured["n"]), ("detector-interop", 28))

    def test_route_link_and_generated_sitemap(self):
        app = (REPO / "client/src/App.tsx").read_text()
        signals = (REPO / "client/src/pages/Signals.tsx").read_text()
        self.assertIn('path="/signals/2026-09-24"', app)
        self.assertIn('href="/signals/2026-09-24"', signals)
        sitemap = ElementTree.parse(REPO / "public/sitemap.xml")
        urls = {node.text for node in sitemap.iter() if node.tag.endswith("loc")}
        self.assertIn(ROUTE, urls)


if __name__ == "__main__":
    unittest.main()
