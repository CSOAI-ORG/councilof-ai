#!/usr/bin/env python3
"""The wallet token list of measured wrappers: official schema, drift, honesty.

  uv run --python 3.12 --with jsonschema --with rfc3339-validator python -m unittest scripts/test_wallet_tokenlist.py -v

jsonschema is imported at module level on purpose: without it this suite errors instead of passing
with the schema check silently skipped.
"""
from __future__ import annotations

import hashlib
import json
import pathlib
import re
import subprocess
import sys
import unittest

import jsonschema  # noqa: F401 — fail closed when the validator is missing
from jsonschema import Draft7Validator, FormatChecker

REPO = pathlib.Path(__file__).resolve().parents[1]
sys.path.insert(0, str(REPO / "scripts/wallet"))
import _keccak  # noqa: E402

LIST = REPO / "public/wallet/measured-wrappers.tokenlist.json"
FULL = REPO / "public/wallet/measured-wrappers.json"
SCHEMA = REPO / "scripts/wallet/tokenlist.schema.json"
LEDGER = REPO / "public/interop/wrapped-asset-parity-latest.json"
# npm @uniswap/token-lists@1.0.0-beta.35, dist/tokenlist.schema.json, fetched 2026-09-28 via cdn.jsdelivr.net
SCHEMA_SHA256 = "064bf8208896d7f5d7e2e6bebadb75176a144df4028cf554230e008b45e1667c"
VERDICT = re.compile(r"\b(certif\w*|approved|compliant|audited|guarantee\w*|recommended|endorsed|trusted|safe|proof of reserves?)\b", re.I)


class TokenList(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.raw = LIST.read_text()
        cls.tl = json.loads(cls.raw)
        cls.full = json.loads(FULL.read_text())
        cls.ledger = json.loads(LEDGER.read_text())

    def test_official_schema_pinned(self):
        self.assertEqual(hashlib.sha256(SCHEMA.read_bytes()).hexdigest(), SCHEMA_SHA256)

    def test_validates_against_official_schema(self):
        v = Draft7Validator(json.loads(SCHEMA.read_text()), format_checker=FormatChecker())
        errors = [f"{list(e.path)}: {e.message}" for e in v.iter_errors(self.tl)]
        self.assertEqual(errors, [])
        # the format checker must actually check date-time, or the line above proves less than it says
        self.assertFalse(FormatChecker().conforms("not a date", "date-time"))

    def test_rebuild_is_byte_identical(self):
        r = subprocess.run([sys.executable, str(REPO / "scripts/wallet/build_measured_wrappers_tokenlist.py"), "--check"], capture_output=True, text=True)
        self.assertEqual(r.returncode, 0, r.stdout + r.stderr)

    def test_one_token_per_contract(self):
        keys = [(t["chainId"], t["address"].lower()) for t in self.tl["tokens"]]
        self.assertEqual(len(keys), len(set(keys)))

    def test_every_token_carries_state_as_of_evidence_caip19(self):
        states = set(self.ledger["states"])
        ids = {r["id"] for r in self.ledger["records"]}
        for t in self.tl["tokens"]:
            x = t["extensions"]
            self.assertIn(x["state"], states, t["symbol"])
            self.assertEqual(x["as_of"], self.ledger["as_of"])
            self.assertTrue(x["evidence"].startswith("https://councilof.ai/w/"))
            self.assertIn(x["evidence"].rsplit("/w/", 1)[1], ids)
            self.assertEqual(x["caip19"], {"chain_id": f"eip155:{t['chainId']}", "asset_namespace": "erc20", "asset_reference": t["address"]})
            for rid in x["records"].split(" "):
                self.assertIn(rid, ids)

    def test_states_are_copied_not_derived(self):
        by_id = {r["id"]: r for r in self.ledger["records"]}
        for t in self.tl["tokens"]:
            for rid in t["extensions"]["records"].split(" "):
                self.assertEqual(by_id[rid]["state"], t["extensions"]["state"], rid)
                self.assertEqual(by_id[rid]["wrapped"]["address"].lower(), t["address"].lower(), rid)

    def test_addresses_are_eip55(self):
        self.assertEqual(_keccak.keccak256(b"").hex(), "c5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470")
        self.assertEqual(_keccak.sponge256(b"abc" * 99, 0x06), hashlib.sha3_256(b"abc" * 99).digest())
        for t in self.tl["tokens"]:
            self.assertEqual(_keccak.checksum(t["address"]), t["address"])

    def test_every_ledger_record_is_listed_or_named_with_a_reason(self):
        listed = {rid for t in self.tl["tokens"] for rid in t["extensions"]["records"].split(" ")}
        unlisted = {n["id"] for n in self.full["not_listed"]}
        self.assertEqual(listed | unlisted, {r["id"] for r in self.ledger["records"]})
        self.assertFalse(listed & unlisted)
        for n in self.full["not_listed"]:
            self.assertTrue(n["reason"])

    def test_says_what_it_is_and_is_not(self):
        self.assertIn("measured wrappers", self.tl["name"].lower())
        listed = self.tl["tags"]["listed"]["description"]
        self.assertIn("current measurement state", listed)
        self.assertIn("not an endorsement or a recommendation", listed)
        self.assertIn("not an endorsement", self.tl["keywords"])
        self.assertIn("not an endorsement or a recommendation", self.full["description"])
        self.assertIn("current measurement state", self.full["description"])

    def test_no_verdict_words(self):
        for text in (self.raw, FULL.read_text()):
            self.assertIsNone(VERDICT.search(text), VERDICT.search(text) and VERDICT.search(text).group(0))

    def test_companion_matches_list(self):
        self.assertEqual(self.full["token_list_sha256"], hashlib.sha256(LIST.read_bytes()).hexdigest())
        self.assertEqual(self.full["token_list_schema"]["sha256"], SCHEMA_SHA256)
        self.assertEqual(len(self.full["tokens"]), len(self.tl["tokens"]))
        for f, t in zip(self.full["tokens"], self.tl["tokens"]):
            self.assertEqual(f["caip19"], f"eip155:{t['chainId']}/erc20:{t['address']}")
            self.assertEqual(f["live_preview"], f"https://councilof.ai/api/wrapper/caip19/{f['caip19']}")


if __name__ == "__main__":
    unittest.main()
