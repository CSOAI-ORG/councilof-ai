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

    # GET https://councilof.ai/api/gspc `totals`, read 2026-10-13T07:02Z, with its 23 MEASURED axis rows.
    LIVE_TOTALS = {"axes": 23, "measured_axes": 23, "unmeasured_axes": 0, "public_count": "23 axes \u00b7 23 measured"}

    def board(self, **totals):
        return {"totals": dict(self.LIVE_TOTALS, **totals), "axes": [{"status": "MEASURED"}] * 23}

    def test_live_public_count_derives_from_the_axis_array(self):
        # The gate composed "23 axis \u00b7 23 measured" and failed the live line from 30 Sep 2026 on.
        self.assertEqual(g.gspc_totals_problems(self.board()), [])
        self.assertEqual(g.axis_count_line(23, 23), "23 axes \u00b7 23 measured")
        self.assertEqual(g.axis_count_line(1, 1), "1 axis \u00b7 1 measured")
        self.assertEqual(g.axis_count_line(2, 0), "2 axes \u00b7 0 measured")

    def test_wrong_public_count_still_fails(self):
        for doctored in ("23 axes \u00b7 22 measured", "22 axes \u00b7 23 measured", "23 axis \u00b7 23 measured", "stale"):
            probs = g.gspc_totals_problems(self.board(public_count=doctored))
            self.assertEqual(len(probs), 1, (doctored, probs))
            self.assertIn("public_count", probs[0])
        self.assertTrue(g.gspc_totals_problems(self.board(measured_axes=22)))
        one_empty = {"totals": dict(self.LIVE_TOTALS), "axes": [{"status": "MEASURED"}] * 22 + [{"status": "UNMEASURED"}]}
        self.assertTrue(g.gspc_totals_problems(one_empty))

    def test_count_line_follows_its_producer(self):
        # The line has one composer. If its wording changes there, this fails in the same pull request
        # instead of the gate failing the live board for two weeks.
        p = os.path.join(g.REPO, "functions", "api", "_boardCounts.ts")
        if not os.path.exists(p):
            self.skipTest("functions/api/_boardCounts.ts not in this checkout")
        with open(p, encoding="utf-8") as f:
            src = f.read()
        self.assertIn('(n === 1 ? "axis" : "axes")', src)
        self.assertIn("`${axes} ${axisWord(axes)} \u00b7 ${measured} measured`", src)


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



# Sentences read from the live site on 2026-10-13T07:02Z (GET with the gate's own client). Each is on the
# page named; none is paraphrased.
HOME_HTML = ("<p>effect-binding 2026-09-22. Nothing here is a certificate.</p>"
             "<a href=\"/board\">Open the full board &rarr;</a> <h2>What the states mean</h2>")
ABOUT_HTML = ("<p>The commercial product is evidence work performed on request &mdash; never a better grade, never a place "
              "on the board, and never a certificate.</p><p>Existing paid work is issuance and evidence assembly &mdash; "
              "including Article 50 marking evidence, evidence bundles and supported feeds &mdash; never a better grade, "
              "a ranking position or a certificate.</p><a>Enquire about an evidence bundle</a>")
LLMS_TXT = ("Switchboard framing: the estate densifies a recomputable signed record over time (request queue + signed cards); "
            "witnesses read the root. It is not a phone company and not a certificate.\n\n"
            "23 axes measured · 14 model comparisons: 0 separated · 7 TIE · 7 UNTESTED · 9 fact runs "
            "· TIE is TIE · not a certificate.\n\n"
            "Calendar-only proofs remain pending until an independent `ots verify` confirms a Bitcoin attestation; a "
            "BitcoinBlockHeaderAttestation tag can be checked against public block headers, but a tag alone is not local "
            "full-node chain validation or a certificate.\n- Dated immutable mill-card root\n")
MCP_TOOL = ("Without x_payment the tool returns the 402 challenge (accepts[] with asset, amount, payTo) plus a free preview "
            "of the cards already on file. Measurement, not certification — never a rank, a grade or a certificate. "
            "Verification stays free.")
CORRECTIONS_HTML = (
    "<li>What was wrong: A banned brand token shipped live on /library as a CamelCase concatenation of the token with "
    "&#x27;Training&#x27;, because a word-boundary regex anchored on the bare token missed the concatenation. Two priced "
    "strings ($0.005/card, a per-hour range) also shipped, against the no-pricing rule.</li>"
    "<li>C-2026-0902-04 · 2026-09-02 · CORRECTED — primary source only, dated · GPAI Code of Practice "
    "signatory counts differed: 26 per the Commission&#x27;s 1 Aug 2025 list versus &#x27;28 frozen&#x27; in secondary "
    "sources.</li>"
    "<li>/interop/ai-economy-index.v0.1.json and /interop/human-labour-index.v0.1.json each carry a status label of "
    "MEASURED-INDEX-v0.1, while each also states in its own body that half its input components are bank gaps and that no "
    "index value is computed.</li>"
    "<li>(2) llms.txt and llms-full.txt still linked Zenodo DOIs that answer 410 (the open item of C-2026-0929-09). "
    "(3) Some pages offered or implied certification or compliance determinations (&#x27;Re-certify on every model "
    "update&#x27;, &#x27;certify to ISO 42001 ... certification and compliance&#x27;, &#x27;certified Watchdog Analyst ... "
    "Compliant / Non-Compliant&#x27;, &#x27;We sell this&#x27;), GET /api/regulator-findings annotated rates as "
    "&#x27;measured compliant&#x27; or &#x27;non-compliance risk&#x27;.</li>"
    "<li>2026-09-05: no policy document, certificate or insurer correspondence was found in the business mailbox or the "
    "repository.</li>")
LEDGER = "/corrections/index.html"


def brand(text, path=""):
    r = [x for x in g.doctrine_checks(text, path, prices=True) if x["check"] == "doctrine.brand_gate"]
    return r[0]["status"], r[0]["evidence"]


def have_brand_gate():
    import shutil
    return bool(shutil.which("node")) and os.path.exists(os.path.join(g.REPO, "scripts", "brand-gate.mjs"))


@unittest.skipUnless(have_brand_gate(), "node or scripts/brand-gate.mjs not available")
class TestBrandGateParity(unittest.TestCase):
    """The port must give the deploy gate's answer on the same text. Three ways it did not, on 13 Oct 2026."""

    def setUp(self):
        self.env = os.environ.pop("BRAND_GATE_ENFORCE_HELD", None)

    def tearDown(self):
        os.environ.pop("BRAND_GATE_ENFORCE_HELD", None)
        if self.env is not None:
            os.environ["BRAND_GATE_ENFORCE_HELD"] = self.env

    # (a) a held rule reports; it does not fail
    def test_held_rule_reports_and_does_not_fail(self):
        held = [r["id"] for r in g.load_brand_rules() if r["held"]]
        self.assertIn("certificate_term", held)  # the loader reads the mark off the rule
        for text, path in ((g.visible_text(HOME_HTML), "/index.html"), (g.visible_text(ABOUT_HTML), "/about/index.html"),
                           (LLMS_TXT, "/llms.txt"), (MCP_TOOL, "/mcp")):
            st, ev = brand(text, path)
            self.assertEqual(st, g.PASS, (path, ev))
            self.assertIn("HELD", ev)                    # still reported, with the sentence
            self.assertIn("certificate_term", ev)
            self.assertIn("certificate", ev)

    def test_held_rule_fails_under_the_deploy_gates_own_switch(self):
        os.environ["BRAND_GATE_ENFORCE_HELD"] = "1"
        st, ev = brand(g.visible_text(HOME_HTML), "/index.html")
        self.assertEqual(st, g.FAIL, ev)
        self.assertIn("certificate_term", ev)

    def test_an_enforced_rule_beside_a_held_hit_still_fails(self):
        st, ev = brand(g.visible_text(HOME_HTML + "<p>Runs on the SOV3 substrate.</p>"), "/index.html")
        self.assertEqual(st, g.FAIL, ev)
        self.assertIn("internal_codenames", ev)
        self.assertNotIn("certificate_term", ev)

    def test_a_draft_still_cannot_say_certificate(self):
        # Holding the rule changes nothing for mail and notices: their word list bans the word outright,
        # negated or not, and does not read brand-gate.mjs.
        for t in ("Download your certificate today.", "Nothing here is a certificate."):
            self.assertTrue(g.NOTICE_BANNED.search(t), t)

    # (b) the page is judged under its built path
    def test_built_path(self):
        for url, built in (("/", "/index.html"), ("/about", "/about/index.html"), ("/about/", "/about/index.html"),
                           ("/corrections", LEDGER), ("/corrections/", LEDGER), ("/corrections/?x=1", LEDGER),
                           ("/claim-maintenance/", "/claim-maintenance/index.html"), ("/spec/v0.1", "/spec/v0.1/index.html"),
                           ("/llms.txt", "/llms.txt"), ("/a/page.html", "/a/page.html"), ("", "/index.html")):
            self.assertEqual(g.built_path(url), built, url)

    def test_corrections_ledger_passes_under_its_built_path_only(self):
        text = g.visible_text(CORRECTIONS_HTML)
        st, ev = brand(text, g.built_path("/corrections/"))
        self.assertEqual(st, g.PASS, ev)
        self.assertIn("none hit", ev)
        self.assertNotIn("HELD", ev)  # the ledger's own "certificate" is exempt there too, as in brand-gate.mjs
        # must-fail controls: the URL path the gate used to pass, and lookalikes, are not the ledger
        for path in ("/corrections/", "/corrections", "/corrections-archive/index.html", "/x/corrections/index.html",
                     "/corrections/other.html", "/Corrections/index.html", "/index.html"):
            st, ev = brand(text, path)
            self.assertEqual(st, g.FAIL, (path, ev))
            for rule in ("pricing_leak", "gpai_code_signature", "measured_index_sticker"):
                self.assertIn(rule, ev, path)

    def test_ledger_exemption_is_per_rule(self):
        for bad, rule in (("<li>&#83;OVOS</li>", "internal_codenames"), ("<li>Get certified by CSOAI today.</li>", "certify_claim"),
                          ("<li>the 33-agent BFT council</li>", "retracted_fault_tolerance")):
            st, ev = brand(g.visible_text(CORRECTIONS_HTML + bad), LEDGER)
            self.assertEqual(st, g.FAIL, (rule, ev))
            self.assertIn(rule, ev)

    def test_ledger_page_is_read_from_brand_gate(self):
        rx = g.ledger_page()
        self.assertIsNotNone(rx, "CORRECTIONS_LEDGER_PAGE not readable from scripts/brand-gate.mjs; the ledger is exempt from nothing")
        self.assertTrue(g.quotes_withdrawn_copy(LEDGER))
        for path in ("/corrections/", "/corrections-archive/index.html", "/x/corrections/index.html", "/pricing/index.html", "", "/notice"):
            self.assertFalse(g.quotes_withdrawn_copy(path), path)

    def test_word_checks_are_not_applied_to_the_ledger_and_are_everywhere_else(self):
        text = g.visible_text(CORRECTIONS_HTML)
        on = {x["check"]: x for x in g.doctrine_checks(text, LEDGER, prices=True)}
        self.assertEqual(on["doctrine.no_certify_language"]["status"], g.NA, on)
        self.assertEqual(on["doctrine.no_public_prices"]["status"], g.NA, on)
        self.assertIn("corrections ledger", on["doctrine.no_certify_language"]["evidence"])
        for path in ("/corrections/", "/corrections-archive/index.html", "/index.html", "/notice", ""):
            off = {x["check"]: x["status"] for x in g.doctrine_checks(text, path, prices=True)}
            self.assertEqual(off["doctrine.no_certify_language"], g.FAIL, path)
            self.assertEqual(off["doctrine.no_public_prices"], g.FAIL, path)

    # the reading of the text itself
    def test_entities_are_decoded_to_a_fixed_point(self):
        self.assertEqual(g.decode_entities("&pound;&#163;&#xA3;&#XA3;&pound&dollar;&#36;&euro;&#8364;&#128;&yen;&cent;&nbsp;&amp;&amp;pound;"),
                         "\u00a3\u00a3\u00a3\u00a3\u00a3$$\u20ac\u20ac\u20ac\u00a5\u00a2\u00a0&\u00a3")  # the brand-gate.mjs selftest string and its answer
        self.assertEqual(g.decode_entities("R&D at AT&T. Q&A &bogus; x"), "R&D at AT&T. Q&A   x")
        for src in ("<p>Probe tier &amp;pound;499/mo per surface</p>", "<p>Enterprise from &amp;amp;pound;9,999/yr</p>",
                    "<p>Probe tier &pound;&nbsp;499/mo</p>", "<p>&#36;45&ndash;150/hr</p>"):
            st, ev = brand(g.visible_text(src), "/index.html")
            self.assertEqual(st, g.FAIL, src)
            self.assertIn("pricing_leak", ev)
        st, ev = brand("Probe tier &pound;499/mo\n", "/pricing.txt")  # a .txt body is decoded too
        self.assertEqual(st, g.FAIL, ev)
        st, ev = brand(g.visible_text("<pre>&lt;script src=&quot;/sdk.js&quot;&gt;&lt;/script&gt; R&amp;D</pre>"), "/docs/index.html")
        self.assertEqual(st, g.PASS, ev)

    # the deploy gate itself, run over the same bytes
    FILES = {
        "index.html": HOME_HTML,
        "about/index.html": ABOUT_HTML,
        "llms.txt": LLMS_TXT,
        "surface/commission-card.txt": MCP_TOOL,
        "corrections/index.html": CORRECTIONS_HTML,
        "corrections-archive/index.html": CORRECTIONS_HTML,                 # control: not the ledger
        "control/codename/index.html": "<p>Runs on the SOV3 substrate.</p>",
        "control/escaped/index.html": "<p>Probe tier &amp;pound;499/mo per surface</p>",
        "control/price.txt": "Probe tier &pound;499/mo\n",
        "control/agents/index.html": "<p>Empty cells stay empty. We do not invent scores.</p><p>Agents: do not invent drift numbers.</p>",
        "control/negated/index.html": "<p>This is not a certificate. CSOAI issues no certificates. We do not certify.</p>",
    }
    EXPECT = {
        ("index.html", "certificate_term"), ("about/index.html", "certificate_term"), ("llms.txt", "certificate_term"),
        ("surface/commission-card.txt", "certificate_term"),
        ("corrections-archive/index.html", "pricing_leak"), ("corrections-archive/index.html", "gpai_code_signature"),
        ("corrections-archive/index.html", "measured_index_sticker"),
        ("control/codename/index.html", "internal_codenames"), ("control/escaped/index.html", "pricing_leak"),
        ("control/price.txt", "pricing_leak"), ("control/agents/index.html", "agent_instruction_leak"),
    }

    def run_deploy_gate(self, dist, *flags):
        import subprocess
        r = subprocess.run(["node", os.path.join(g.REPO, "scripts", "brand-gate.mjs"), dist] + list(flags),
                           capture_output=True, text=True, timeout=120)
        hits = set(re.findall(r'^  (\S+)  \[([a-z0-9_]+)\] "', r.stdout + r.stderr, re.M))
        return r.returncode, hits, r.stdout + r.stderr

    def port(self):
        hits, enforced = set(), False
        for rel, body in self.FILES.items():
            text = g.visible_text(body) if rel.endswith((".html", ".svg")) else body
            for h in g.brand_scan(text, "/" + rel):
                hits.add((rel, h["rule"]))
                enforced = enforced or not h["held"]
        return hits, enforced

    def test_same_answer_as_the_deploy_gate_on_the_same_bytes(self):
        with tempfile.TemporaryDirectory() as dist:
            for rel, body in self.FILES.items():
                os.makedirs(os.path.dirname(os.path.join(dist, rel)), exist_ok=True)
                with open(os.path.join(dist, rel), "w", encoding="utf-8") as f:
                    f.write(body)
            rc, js_hits, out = self.run_deploy_gate(dist, "--enforce-held")
            self.assertEqual(rc, 1, out)
            py_hits, _ = self.port()
            self.assertEqual(py_hits, js_hits, out)
            self.assertEqual(py_hits, self.EXPECT)  # neither side is vacuous
            # and the verdict: with the controls removed only the held rule is left, so the deploy gate exits 0
            for rel in [k for k in self.FILES if k.startswith(("control/", "corrections-archive/"))]:
                os.remove(os.path.join(dist, rel))
            rc, _, out = self.run_deploy_gate(dist)
            self.assertEqual(rc, 0, out)
            self.assertIn("HELD", out)
            for rel, body in self.FILES.items():
                if rel.startswith(("control/", "corrections-archive/")):
                    continue
                text = g.visible_text(body) if rel.endswith(".html") else body
                self.assertEqual(brand(text, "/" + rel)[0], g.PASS, rel)


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
