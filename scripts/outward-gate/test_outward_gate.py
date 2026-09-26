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


class TestDoctrine(unittest.TestCase):
    def test_banned_word_in_visible_text_fails(self):
        t = g.visible_text("<main><h1>CSOAI certified models</h1></main>")
        self.assertEqual(Status.of(g.doctrine_checks(t), "doctrine.no_certify_language"), [g.FAIL])

    def test_banned_word_only_in_script_or_negated_passes(self):
        t = g.visible_text('<script>var a="certified"</script><p>We measure; we never certify.</p>')
        self.assertEqual(Status.of(g.doctrine_checks(t), "doctrine.no_certify_language"), [g.PASS])

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
