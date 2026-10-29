#!/usr/bin/env python3
"""Tests for outward_gate.py. Every check that can FAIL is shown failing on a doctored input (must-fail
control) AND passing on the clean one, so no check is vacuous. No network: a fake HTTP stands in.

    python3 -m unittest -v test_outward_gate.py
"""
import base64
import gzip
import hashlib
import json
import os
import re
import sys
import tempfile
import unittest

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import outward_gate as g  # noqa: E402

from cryptography.hazmat.primitives import serialization  # noqa: E402
from cryptography.hazmat.primitives.asymmetric import ed25519  # noqa: E402


def wr(p, b):
    with open(p, "wb") as f:
        f.write(b)


def keypair():
    sk = ed25519.Ed25519PrivateKey.generate()
    raw = sk.public_key().public_bytes(serialization.Encoding.Raw, serialization.PublicFormat.Raw)
    did = {"id": "did:web:csoai.org", "verificationMethod": [{
        "id": "did:web:csoai.org#board-attestation-1", "type": "JsonWebKey2020",
        "publicKeyJwk": {"kty": "OKP", "crv": "Ed25519", "x": base64.urlsafe_b64encode(raw).rstrip(b"=").decode()}}]}
    return sk, g.Did(did)


def sign_record(sk, artifact_bytes, name="record.json"):
    payload = {"schema": "t", "artifact": {"path": name, "sha256": g.sha(artifact_bytes)}}
    c = g.canon(payload)
    return json.dumps({"payload": payload, "signature": {
        "did": "did:web:csoai.org#board-attestation-1", "alg": "Ed25519",
        "sig_ed25519": sk.sign(c).hex(), "payload_sha256": g.sha(c)}}).encode()


def ots_bytes(digest_hex, bitcoin=False):
    return g.OTS_MAGIC + b"\x01\x08" + bytes.fromhex(digest_hex) + b"\xf0\x10" + (g.OTS_BITCOIN if bitcoin else g.OTS_PENDING) + b"\x00" * 8


class Status:
    @staticmethod
    def of(results, check):
        return [r["status"] for r in results if r["check"] == check]


class TestCurrency(unittest.TestCase):
    LIVE = {"axes": 23, "measured": 23, "unmeasured": 0, "tools": 13, "free_tools": 9, "paid_tools": 4}

    def test_doctored_number_fails(self):
        r = g.currency_numbers("Live board: 22 axis · 22 measured.", self.LIVE, "x")
        self.assertEqual(r["status"], g.FAIL, r)
        r = g.currency_numbers("The board reads 23·23·1 today.", self.LIVE, "x")
        self.assertEqual(r["status"], g.FAIL, r)
        r = g.currency_numbers("GSPC MCP: 7 tools on https://councilof.ai/mcp", self.LIVE, "x")
        self.assertEqual(r["status"], g.FAIL, r)

    def test_clean_number_passes(self):
        r = g.currency_numbers("Live board: 23 axis · 23 measured. 9 free read-only tools and 4 paid.", self.LIVE, "x")
        self.assertEqual(r["status"], g.PASS, r)

    def test_history_is_not_a_current_claim(self):
        r = g.currency_numbers("This line read 22·22·0 until the ruling.", self.LIVE, "x")
        self.assertEqual(r["status"], g.NA, r)


class TestAccountability(unittest.TestCase):
    OBF = ('<footer><a href="/cdn-cgi/l/email-protection#1a2b">[email&#160;protected]</a> CSOAI Ltd. '
           '<a href="/corrections/">Corrections</a> Object to a row: write to us.</footer>')
    CLEAN = ('<footer><a href="mailto:nicholas@csoai.org">nicholas@csoai.org</a> CSOAI Ltd. '
             '<a href="/corrections/">Corrections</a> Object to a row: write to us.</footer>')

    def test_obfuscated_email_fails(self):
        res = g.accountability_checks(self.OBF, g.visible_text(self.OBF), "x", ["https://councilof.ai/corrections/"])
        self.assertEqual(Status.of(res, "accountability.contact_plain_email"), [g.FAIL])

    def test_plain_email_passes(self):
        res = g.accountability_checks(self.CLEAN, g.visible_text(self.CLEAN), "x", ["https://councilof.ai/corrections/"])
        for r in res:
            self.assertEqual(r["status"], g.PASS, r)

    def test_missing_entity_and_corrections_fail(self):
        h = '<p>mail nicholas@csoai.org</p>'
        res = g.accountability_checks(h, g.visible_text(h), "x", [])
        self.assertEqual(Status.of(res, "accountability.entity_named"), [g.FAIL])
        self.assertEqual(Status.of(res, "accountability.corrections_link"), [g.FAIL])
        self.assertEqual(Status.of(res, "accountability.objection_route"), [g.FAIL])


class TestIntegrity(unittest.TestCase):
    def setUp(self):
        self.sk, self.did = keypair()
        self.art = b'{"n": 1}\n'
        self.signed = sign_record(self.sk, self.art)

    def test_clean_record_verifies_and_tamper_control_fails(self):
        ok, det, tok, tdet = g.verify_signed(self.signed, self.did, lambda n: g.sha(self.art))
        self.assertTrue(ok, det)
        self.assertTrue(tok, tdet)

    def test_tampered_file_fails(self):
        ok, det, _, _ = g.verify_signed(self.signed, self.did, lambda n: g.sha(self.art + b" "))
        self.assertFalse(ok, det)
        self.assertIn("!=", det)

    def test_tampered_payload_fails(self):
        s = json.loads(self.signed)
        s["payload"]["schema"] = "t2"
        ok, det, _, _ = g.verify_signed(json.dumps(s).encode(), self.did, lambda n: g.sha(self.art))
        self.assertFalse(ok, det)

    def test_wrong_key_fails(self):
        _, other = keypair()
        ok, det, _, _ = g.verify_signed(self.signed, other, lambda n: g.sha(self.art))
        self.assertFalse(ok, det)

    def test_unrecognised_format_fails(self):
        ok, det, _, _ = g.verify_signed(b'{"sig": "abc"}', self.did, None)
        self.assertFalse(ok)

    def test_ots_state(self):
        d = g.sha(self.art)
        pend = {"record.json.ots": ots_bytes(d)}
        self.assertEqual(Status.of(g.ots_state_check(d, pend, "a pending calendar commitment", "x"), "integrity.ots_state_truthful"), [g.PASS])
        self.assertEqual(Status.of(g.ots_state_check(d, pend, "BITCOIN_ATTESTED at block 1", "x"), "integrity.ots_state_truthful"), [g.FAIL])
        self.assertEqual(Status.of(g.ots_state_check(d, pend, "nothing said", "x"), "integrity.ots_state_truthful"), [g.FAIL])
        self.assertEqual(Status.of(g.ots_state_check(d, {"record.json.ots": ots_bytes(g.sha(b"other"))}, "pending", "x"), "integrity.ots_present"), [g.FAIL])
        btc = {"record.json.bitcoin.ots": ots_bytes(d, True)}
        self.assertEqual(Status.of(g.ots_state_check(d, btc, "BITCOIN_ATTESTED at block 1", "x"), "integrity.ots_state_truthful"), [g.PASS])
        self.assertEqual(Status.of(g.ots_state_check(d, {}, "pending", "x"), "integrity.ots_present"), [g.FAIL])

    def test_ots_statement_is_scoped_to_its_artifact(self):
        md = ("- `record.json` (sha256 x): **BITCOIN_ATTESTED at block 5**. Upgraded proof: `record.json.bitcoin.ots`\n"
              "`record.v0.1.1.json.ots`: 3 pending calendar attestations, not a Bitcoin attestation.\n")
        st = g.stated_about(md, "record.v0.1.1.json")
        d = g.sha(b"v011")
        self.assertEqual(Status.of(g.ots_state_check(d, {"record.v0.1.1.json.ots": ots_bytes(d)}, st, "x"), "integrity.ots_state_truthful"), [g.PASS])
        # must-fail control: the whole README (which claims Bitcoin for record.json) would have failed it
        self.assertEqual(Status.of(g.ots_state_check(d, {"record.v0.1.1.json.ots": ots_bytes(d)}, "BITCOIN_ATTESTED at block 5", "x"), "integrity.ots_state_truthful"), [g.FAIL])


class TestVenturi(unittest.TestCase):
    def build(self, tmp, sk, decision=False):
        caps = []
        for i in range(5):
            cp = {"schema": "csoai.venturi-capsule/0.1", "i": i, "measurement_state": "REPRODUCED"}
            if decision and i == 2:
                cp["decision"] = "ALLOW"
            cp["capsule_id"] = g.sha(g.canon(cp))
            caps.append(cp)
        body = gzip.compress("".join(json.dumps(c) + "\n" for c in caps).encode(), mtime=0)
        wr(os.path.join(tmp, "capsules.jsonl.gz"), body)
        rec = {"n_capsules": 5, "merkle_root": g.merkle_root([c["capsule_id"] for c in caps]),
               "capsules_file": {"path": "capsules.jsonl.gz", "sha256": g.sha(body)}}
        rb = json.dumps(rec).encode()
        wr(os.path.join(tmp, "record.json"), rb)
        wr(os.path.join(tmp, "record.signed.json"), sign_record(sk, rb))
        wr(os.path.join(tmp, "record.json.ots"), ots_bytes(g.sha(rb)))
        return caps

    def ctx(self, did):
        c = g.Ctx(http=None)
        c.did = did
        return c

    def test_clean_batch_scores_100(self):
        sk, did = keypair()
        with tempfile.TemporaryDirectory() as t:
            self.build(t, sk)
            a = g.score(g.venturi_batch_artifact(self.ctx(did), t, {"ots_state": "PENDING_CALENDAR_COMMITMENT"}))
            fails = [x for x in a["checks"] if x["status"] == g.FAIL]
            self.assertEqual(fails, [], fails)

    def test_tampered_capsule_fails(self):
        sk, did = keypair()
        with tempfile.TemporaryDirectory() as t:
            caps = self.build(t, sk)
            caps[1]["measurement_state"] = "NOT_REPRODUCED"  # edited after its id was computed
            wr(os.path.join(t, "capsules.jsonl.gz"), gzip.compress("".join(json.dumps(c) + "\n" for c in caps).encode()))
            a = g.venturi_batch_artifact(self.ctx(did), t, {"ots_state": "PENDING_CALENDAR_COMMITMENT"})
            self.assertEqual(Status.of(a["checks"], "integrity.file_sha256_match"), [g.FAIL])
            self.assertEqual(Status.of(a["checks"], "integrity.capsule_ids_recompute"), [g.FAIL])

    def test_decision_field_fails(self):
        sk, did = keypair()
        with tempfile.TemporaryDirectory() as t:
            self.build(t, sk, decision=True)
            a = g.venturi_batch_artifact(self.ctx(did), t, {"ots_state": "PENDING_CALENDAR_COMMITMENT"})
            self.assertEqual(Status.of(a["checks"], "doctrine.no_decision_fields"), [g.FAIL])


class TestCapsuleDiscovery(unittest.TestCase):
    """The run block must find the day's capsule index under the 0.2 names, and must FAIL (never skip) when none is recent."""

    def lay(self, root, name, batches):
        wr(os.path.join(root, name), json.dumps({"batches": batches}).encode())

    def test_v02_index_and_batches_are_found(self):
        sk, did = keypair()
        with tempfile.TemporaryDirectory() as v:
            b = os.path.join(v, "measurement-capsules-v0.2-2026-09-28-self_parity")
            os.mkdir(b)
            TestVenturi().build(b, sk)
            self.lay(v, "measurement-index-v0.2-2026-09-28.json", [{"dir": b, "ots_state": "PENDING_CALENDAR_COMMITMENT"}])
            self.lay(v, "venturi-index-2026-09-26.json", [])
            arts = g.capsule_artifacts(TestVenturi().ctx(did), v, "2026-09-28")
            self.assertEqual([a["kind"] for a in arts], ["venturi_index", "venturi_batch"])
            self.assertTrue(arts[0]["url"].endswith("measurement-index-v0.2-2026-09-28.json"))

    def test_yesterdays_index_is_scored_before_capsule_daily_runs(self):
        with tempfile.TemporaryDirectory() as v:
            self.lay(v, "measurement-index-v0.2-2026-09-27.json", [])
            self.assertEqual(g.newest_capsule_index(v, "2026-09-28"), ("2026-09-27", "measurement-index-v0.2-2026-09-27.json"))

    def test_stale_or_absent_index_fails_not_silent(self):
        with tempfile.TemporaryDirectory() as v:
            arts = g.capsule_artifacts(None, v, "2026-09-28")
            self.assertEqual(Status.of(arts[0]["checks"], "hygiene.resolves"), [g.FAIL])
            self.lay(v, "venturi-index-2026-09-26.json", [])  # the 0.1 name, two days old: the defect this guards
            arts = g.capsule_artifacts(None, v, "2026-09-28")
            self.assertEqual(Status.of(arts[0]["checks"], "hygiene.resolves"), [g.FAIL])
            self.assertIn("venturi-index-2026-09-26.json", arts[0]["checks"][0]["evidence"])

class TestDoctrine(unittest.TestCase):
    def test_banned_word_in_visible_text_fails(self):
        t = g.visible_text("<main><h1>CSOAI certified models</h1></main>")
        self.assertEqual(Status.of(g.doctrine_checks(t), "doctrine.no_certify_language"), [g.FAIL])

    def test_banned_word_only_in_script_or_negated_passes(self):
        t = g.visible_text('<script>var a="certified"</script><p>We measure; we never certify.</p>')
        self.assertEqual(Status.of(g.doctrine_checks(t), "doctrine.no_certify_language"), [g.PASS])

    def test_js_lookbehind_with_unequal_alternatives_is_rewritten(self):
        # brand-gate.mjs:299 as shipped. Python's re refuses it; the rewrite must keep its meaning.
        src = r"(?<!\b(?:we|i|you|they)\s)\b(?:Do not (?:invent|ship)|planted key)\b"
        with self.assertRaises(re.error):
            re.compile(src, re.I)
        rx = g._compile_js(src, re.I)
        self.assertTrue(rx.search("Agents: do not invent scores."))
        self.assertTrue(rx.search("a planted key was found"))
        for kept in ("We do not invent scores.", "they do not ship unmeasured numbers", "I do not invent", "you do not ship"):
            self.assertIsNone(rx.search(kept), kept)
        self.assertEqual(g.js_to_py_regex(r"(?<=a(?:x|yy)b)c"), r"(?:(?<=axb)|(?<=ayyb))c")
        self.assertEqual(g.js_to_py_regex(r"plain(?:a|b)"), r"plain(?:a|b)")

    def test_brand_rules_load_whenever_node_and_the_rules_file_exist(self):
        # The two brand tests below pass for the wrong reason if the loader is broken (one skips, one
        # sees FAIL because nothing loaded). This is the control that says the loader works.
        import shutil
        if not shutil.which("node") or not os.path.exists(os.path.join(g.REPO, "scripts", "brand-gate.mjs")):
            self.skipTest("node or scripts/brand-gate.mjs not available")
        g._BRAND = None
        rules = g.load_brand_rules()
        self.assertTrue(rules, "brand-gate.mjs rules did not load; every artifact would score below 100%")
        self.assertGreaterEqual(len(rules), 10)
        t = g.visible_text("<p>Runs on the measurement engine.</p>")
        self.assertEqual(Status.of(g.doctrine_checks(t), "doctrine.brand_gate"), [g.PASS])

    def test_brand_gate_codename_fails(self):
        if g.load_brand_rules() is False:
            self.skipTest("scripts/brand-gate.mjs not in this checkout")
        t = g.visible_text("<p>Runs on the SOV3 substrate.</p>")
        self.assertEqual(Status.of(g.doctrine_checks(t), "doctrine.brand_gate"), [g.FAIL])
        t = g.visible_text("<p>Runs on the measurement engine.</p>")
        self.assertEqual(Status.of(g.doctrine_checks(t), "doctrine.brand_gate"), [g.PASS])

    def test_price_lf_statutory(self):
        t = "Each report costs $49 per report. CSOAI is a Linux Foundation member. We are an IVO under SB 813."
        res = g.doctrine_checks(t, prices=True)
        for cid in ("doctrine.no_public_prices", "doctrine.no_lf_membership_label", "doctrine.no_statutory_verifier_claim"):
            self.assertEqual(Status.of(res, cid), [g.FAIL], cid)
        t = "Verification is free forever. We are not an IVO under SB 813 and not a Linux Foundation member."
        res = g.doctrine_checks(t, prices=True)
        for cid in ("doctrine.no_public_prices", "doctrine.no_lf_membership_label", "doctrine.no_statutory_verifier_claim"):
            self.assertEqual(Status.of(res, cid), [g.PASS], cid)


class TestNotClaims(unittest.TestCase):
    def test_question_and_statute_description_pass(self):
        t = "4. Does Council of AI certify, accredit, or issue a conformity mark? No."
        self.assertEqual(Status.of(g.doctrine_checks(t), "doctrine.no_certify_language"), [g.PASS])
        t = 'California chaptered SB 813, which defines an "independent verification organization" as an auditor designated by the Agency.'
        self.assertEqual(Status.of(g.doctrine_checks(t), "doctrine.no_statutory_verifier_claim"), [g.PASS])
        t = "CSOAI is an independent verification organization under SB 813."
        self.assertEqual(Status.of(g.doctrine_checks(t), "doctrine.no_statutory_verifier_claim"), [g.FAIL])

    def test_denial_list_in_json_is_not_a_claim(self):
        t = g.json_strings({"name": "Agent", "explicitly_not": ["certification", "accreditation"]})
        self.assertEqual(Status.of(g.doctrine_checks(t), "doctrine.no_certify_language"), [g.PASS])
        t = g.json_strings({"name": "Agent", "description": "certified results"})
        self.assertEqual(Status.of(g.doctrine_checks(t), "doctrine.no_certify_language"), [g.FAIL])

    def test_robots_longest_match(self):
        G = g.robots_groups("User-agent: *\nDisallow: /api/\nAllow: /api/gspc\nAllow: /\n\nUser-agent: GPTBot\nAllow: /\n")
        self.assertTrue(g.robots_allowed(G, "CSOAI-outward-gate/0.1", "/api/gspc"))
        self.assertFalse(g.robots_allowed(G, "CSOAI-outward-gate/0.1", "/api/state"))  # must-fail control
        self.assertTrue(g.robots_allowed(G, "GPTBot", "/api/state"))


class TestX402(unittest.TestCase):
    MAN = {"network": "eip155:8453", "asset": "0xA", "resources": [
        {"url": "https://x/api/p", "accepts": [{"network": "base", "extra": {"name": "USDC"}}]}]}

    def test_mismatch_fails(self):
        live = {"https://x/api/p": {"accepts": [{"network": "eip155:8453", "amount": "10000", "asset": "0xA", "extra": {"name": "USD Coin"}}]}}
        bad, n = g.x402_compare(self.MAN, live)
        self.assertEqual(n, 1)
        self.assertTrue(any("network" in b for b in bad) and any("extra.name" in b for b in bad) and any("amount" in b for b in bad), bad)

    def test_match_passes(self):
        man = {"network": "eip155:8453", "asset": "0xA", "resources": [
            {"url": "https://x/api/p", "accepts": [{"network": "eip155:8453", "amount": "10000", "asset": "0xA", "extra": {"name": "USD Coin"}}]}]}
        live = {"https://x/api/p": {"accepts": [{"network": "eip155:8453", "amount": "10000", "asset": "0xA", "extra": {"name": "USD Coin"}}]}}
        self.assertEqual(g.x402_compare(man, live), ([], 1))

    def test_402_header_decodes(self):
        body = {"accepts": [{"network": "eip155:8453"}]}
        r = g.Resp("u", 402, {"payment-required": base64.b64encode(json.dumps(body).encode()).decode()}, b"")
        self.assertEqual(g.decode_402(r), body)

    # ---- a door that declines to sell: resources[].no_sale (13 Oct 2026) -----------------------------
    # The gate reported "4 mismatches over 27 paid resources (by field network, amount, asset, extra.name)".
    # All four were one door, /api/wrapper?id=usdc.e:arbitrum, answering 200 while its chain read was
    # UNMEASURED. The 200 below is that answer (read 07:05Z), trimmed to the fields it is judged on.
    TERMS = {"network": "eip155:8453", "amount": "1", "asset": "0xA", "extra": {"name": "USD Coin"}}
    NO_SALE = {"status": 200, "body": {"preview_only": True, "state": "UNMEASURED",
                                       "payment": {"requested": False, "sent_to_facilitator": False, "settled": False}}}
    LIVE_200 = {"schema": "csoai.wrapper-parity/0.1", "kind": "preview", "preview_only": True, "id": "usdc.e:arbitrum",
                "state": "UNMEASURED",
                "reason": "arbitrum: eth_call to 0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8 failed on every endpoint "
                          "(arbitrum.io: HTTP 429; 1rpc.io: RPC error: You've reached the usage limit for your current plan. "
                          "[rest of that operator's message cut here]; drpc.org: HTTP 400; publicnode.com: HTTP 403)",
                "payment": {"requested": False, "presented": False, "sent_to_facilitator": False, "settled": False}}
    WRAPPER = "https://councilof.ai/api/wrapper?id=usdc.e:arbitrum"

    class DoorHttp:
        """Each URL answers from a table: {url: (status, parsed JSON body or raw bytes)}."""

        def __init__(self, table):
            self.table = table

        def get(self, url, headers=None, **k):
            status, body = self.table[url]
            return g.Resp(url, status, {}, body if isinstance(body, bytes) else json.dumps(body).encode())

    def consistency(self, manifest, table):
        ctx = g.Ctx(http=self.DoorHttp(table))
        ctx.x402 = manifest
        return [c for c in g.x402_artifact(ctx)["checks"] if c["check"] == "consistency.x402_manifest_vs_live_402"][0]

    def two_doors(self, declare):
        w = {"url": self.WRAPPER, "accepts": [self.TERMS]}
        if declare:
            w["no_sale"] = self.NO_SALE
        man = {"resources": [{"url": "https://councilof.ai/api/proof?bundle=1", "accepts": [self.TERMS]}, w]}
        table = {"https://councilof.ai/api/proof?bundle=1": (402, {"accepts": [self.TERMS]}), self.WRAPPER: (200, self.LIVE_200)}
        return man, table

    def test_undeclared_200_is_one_mismatch_not_four(self):
        # must-fail control: the manifest as production served it on 13 Oct (no no_sale field).
        r = self.consistency(*self.two_doors(declare=False))
        self.assertEqual(r["status"], g.FAIL)
        self.assertTrue(r["evidence"].startswith("1 mismatches over 2 paid resources (1 without a 402 challenge; by field {})"), r["evidence"])
        self.assertIn("/api/wrapper: no 402 challenge (HTTP 200)", r["evidence"])

    def test_declared_no_sale_is_not_a_mismatch_and_is_named(self):
        r = self.consistency(*self.two_doors(declare=True))
        self.assertEqual(r["status"], g.PASS, r["evidence"])
        self.assertIn("2 paid resources: 1 answered 402", r["evidence"])
        self.assertIn("1 gave the no-sale answer the manifest declares for it, nothing requested (/api/wrapper)", r["evidence"])

    def test_declaration_does_not_excuse_a_different_answer(self):
        res = {"url": self.WRAPPER, "accepts": [self.TERMS], "no_sale": self.NO_SALE}
        self.assertTrue(g.x402_no_sale(res, 200, self.LIVE_200))
        not_it = {
            "requests payment": (200, dict(self.LIVE_200, payment={"requested": True, "sent_to_facilitator": False, "settled": False})),
            "says nothing about payment": (200, {"preview_only": True, "state": "UNMEASURED"}),
            "another state": (200, dict(self.LIVE_200, state="ESCROW_PARITY_READ")),
            "not JSON": (200, None),
            "an error status": (500, self.LIVE_200),
            "a 402": (402, self.LIVE_200),
            "carries payment terms": (200, dict(self.LIVE_200, accepts=[self.TERMS])),
            "truthy, not true": (200, dict(self.LIVE_200, preview_only=1)),
        }
        for what, (status, body) in not_it.items():
            self.assertFalse(g.x402_no_sale(res, status, body), what)
        self.assertFalse(g.x402_no_sale(res, 200, self.LIVE_200, payment_required_header=True), "carries a PAYMENT-REQUIRED header")
        # and through the artifact: each of them fails the check on a door that declares a no-sale answer
        man, table = self.two_doors(declare=True)
        for what, (status, body) in not_it.items():
            if status == 402:
                continue
            table[self.WRAPPER] = (status, b"<html>" if body is None else body)
            self.assertEqual(self.consistency(man, table)["status"], g.FAIL, what)

    def test_blanket_declaration_excuses_nothing(self):
        for decl in ({"status": 200, "body": {}}, {"status": 200}, {"status": 200, "body": {"payment": {"requested": True}}}, "yes", None):
            res = {"url": self.WRAPPER, "accepts": [self.TERMS], "no_sale": decl}
            self.assertFalse(g.x402_no_sale(res, 200, self.LIVE_200), decl)
            self.assertFalse(g.x402_no_sale(res, 200, {}), decl)

    def test_field_drift_on_a_402_still_fails_beside_a_declared_no_sale(self):
        man, table = self.two_doors(declare=True)
        table["https://councilof.ai/api/proof?bundle=1"] = (402, {"accepts": [dict(self.TERMS, network="base", extra={"name": "USDC"})]})
        r = self.consistency(man, table)
        self.assertEqual(r["status"], g.FAIL)
        self.assertIn("'network': 1", r["evidence"])
        self.assertIn("'extra.name': 1", r["evidence"])
        self.assertIn("0 without a 402 challenge", r["evidence"])

    def test_this_branch_manifest_against_the_answers_of_13_oct(self):
        """The manifest this tree renders (the committed render build_openapi.py --check holds equal to
        functions/.well-known/x402.json.ts), every paid door challenging on its own listed terms, and the
        per-pair wrapper door answering the 200 it answered live: 0 mismatches. Drop the declaration, as
        production served the manifest that morning, and the same answers are 1 mismatch."""
        with open(os.path.join(g.REPO, "scripts", "fixtures", "x402scan", "well_known_x402.json")) as f:
            man = json.load(f)
        paid = [r for r in man["resources"] if str(r.get("amount", "")) != "0"]
        self.assertIn(self.WRAPPER, [r["url"] for r in paid])
        table = {r["url"]: (402, {"accepts": [r["accepts"][0]]}) for r in paid}
        table[self.WRAPPER] = (200, self.LIVE_200)
        r = self.consistency(man, table)
        self.assertEqual(r["status"], g.PASS, r["evidence"])
        self.assertIn(f"{len(paid)} paid resources: {len(paid) - 1} answered 402", r["evidence"])
        self.assertIn("(/api/wrapper)", r["evidence"])
        # every door that declares one may decline at once, and only those
        declaring = [r for r in paid if r.get("no_sale")]
        self.assertGreaterEqual(len(declaring), 2)
        for d in declaring:
            table[d["url"]] = (200, dict(self.LIVE_200, id=None))
        self.assertEqual(self.consistency(man, table)["status"], g.PASS)
        silent = [r for r in paid if not r.get("no_sale")][0]
        table[silent["url"]] = (200, self.LIVE_200)
        self.assertEqual(self.consistency(man, table)["status"], g.FAIL, "a door that declares nothing answered the no-sale 200")
        # must-fail control: the same answers against the manifest without the declaration
        table = {r["url"]: (402, {"accepts": [r["accepts"][0]]}) for r in paid}
        table[self.WRAPPER] = (200, self.LIVE_200)
        before = json.loads(json.dumps(man))
        for res in before["resources"]:
            res.pop("no_sale", None)
        r = self.consistency(before, table)
        self.assertEqual(r["status"], g.FAIL)
        self.assertTrue(r["evidence"].startswith(f"1 mismatches over {len(paid)} paid resources (1 without a 402 challenge"), r["evidence"])
        # the sentence that explains the field passes the gate's own doctrine checks
        for c in g.doctrine_checks(man["no_sale_answers"], "/.well-known/x402.json", g.OWN_DEV):
            self.assertEqual(c["status"], g.PASS, c)


class TestNotices(unittest.TestCase):
    def test_channel_rules(self):
        self.assertTrue(g.ROLE.match("support"))
        self.assertFalse(g.ROLE.match("stephen"))
        self.assertEqual(g.regdom("mcp.zensched.com"), "zensched.com")
        self.assertEqual(g.regdom("www.example.co.uk"), "example.co.uk")

    def test_commands_extracted_and_matched(self):
        t = "Hi\n\nTo check:\necho '\"version\": \"1.0.0\"' ; echo 'serverInfo 1.27.0'\n\nBye"
        cmds = g.draft_commands(t)
        self.assertEqual(len(cmds), 1)
        rc, out = g.run_verbatim(cmds[0])
        row = {"dimension": "VERSION", "finding": {"a": {"value": "1.0.0"}, "b": {"value": "1.27.0"}}}
        self.assertTrue(g.notice_output_matches(row, rc, out)[0])
        row["finding"]["b"]["value"] = "9.9.9"
        self.assertFalse(g.notice_output_matches(row, rc, out)[0])
        self.assertFalse(g.notice_output_matches(row, 1, "urllib.error.HTTPError: HTTP Error 403: Forbidden")[0])

    def test_banned_words_in_draft(self):
        self.assertTrue(g.NOTICE_BANNED.search("your card failed our check"))
        self.assertTrue(g.NOTICE_BANNED.search("book a demo"))
        self.assertIsNone(g.NOTICE_BANNED.search("the signature does not verify under that key"))


class FakeHttp:
    def __init__(self, status):
        self.status = status

    def get(self, url, headers=None, **k):
        return g.Resp(url, self.status, {}, b"{}")


class TestReachablePass(unittest.TestCase):
    """Every check must have a reachable PASS on a correct artifact."""

    def test_croissant_and_citation(self):
        md = "# D\n\n## Citation\n\n```bibtex\n@misc{csoai2026, title={D}}\n```\n"
        self.assertEqual(g.croissant_citation_check({"recordSet": [{"@type": "cr:RecordSet"}]}, md, "x")["status"], g.PASS)
        # HF's Croissant has no citeAs: that must not matter
        self.assertEqual(g.croissant_citation_check({"recordSet": [{}], "citeAs": None}, "Cite as: CSOAI Ltd, D (2026).", "x")["status"], g.PASS)
        self.assertEqual(g.croissant_citation_check({"recordSet": []}, md, "x")["status"], g.FAIL)
        self.assertEqual(g.croissant_citation_check({"recordSet": [{}]}, "# D\nno citation", "x")["status"], g.FAIL)

    def test_verify_snippet(self):
        good = "```python\nimport urllib.request\nreq = urllib.request.Request('https://csoai.org/.well-known/did.json', headers={'User-Agent': 'my-verifier/1.0'})\n```"
        self.assertEqual(g.snippet_check(good, FakeHttp(200), "x")["status"], g.PASS)
        bad = "```python\nimport urllib.request\ndid = urllib.request.urlopen('https://csoai.org/.well-known/did.json')\n```"
        self.assertEqual(g.snippet_check(bad, FakeHttp(403), "x")["status"], g.FAIL)

    def test_correction_class_row_revalidated_by_v012(self):
        rows = gzip.compress(b'{"endpoint": "https://a.example/mcp", "dims": {"AUTH": {"state": "INCONSISTENT"}}}\n')

        class H:
            def get(self, url, **k):
                return g.Resp(url, 200, {}, rows)
        self.assertEqual(g.v012_state(H(), {"rows.v0.1.2.jsonl.gz"}, "https://a.example/mcp", "AUTH"), "INCONSISTENT")
        self.assertIsNone(g.v012_state(H(), {"rows.v0.1.1.jsonl.gz"}, "https://a.example/mcp", "AUTH"))  # not yet published

    def test_notice_channel_and_output(self):
        self.assertTrue(g.ROLE.match("support") and g.ROLE.match("hello"))
        row = {"dimension": "A2A_SIGNATURE"}
        self.assertTrue(g.notice_output_matches(row, 1, "cryptography.exceptions.InvalidSignature")[0])


class TestSupersession(unittest.TestCase):
    def test_superseded_detection(self):
        sup = g.superseded_files(["record.json", "record.v0.1.1.json", "rows.jsonl.gz", "rows.v0.1.1.jsonl.gz", "README.md"])
        self.assertEqual(sup, {"record.json": "record.v0.1.1.json", "rows.jsonl.gz": "rows.v0.1.1.jsonl.gz"})

    def test_readme_sha_claims(self):
        md = "| `record.json` | `" + "a" * 64 + "` |\n`record.v0.1.1.json` (sha256 `" + "b" * 64 + "`) supersedes"
        self.assertEqual(g.readme_sha_claims(md, {"record.json", "record.v0.1.1.json"}),
                         [("record.json", "a" * 64), ("record.v0.1.1.json", "b" * 64)])


if __name__ == "__main__":
    unittest.main()
