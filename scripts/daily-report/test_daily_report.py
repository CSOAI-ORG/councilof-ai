# SPDX-License-Identifier: Apache-2.0
"""The daily report withholds held axes, and check_report.py refuses a report that restates them, names a banned
phrase, or is not signed by the board over a pointer that pins its exact bytes.

Board signatures here come from the production path: generate_daily_report.sign_pointer calls
venturi_capsule.sign_payload (the client the capsule index signs with), and only the network is stood in for. The
stand-in answers the runner's OIDC token request and POST /api/board-sign the way functions/api/board-sign.ts answers
(its 200 reply fields and its 401 body), signing with a key made by this test where the board key would sign. The check
is told that key; under the pinned board key the same .sig fails."""
import base64, datetime, hashlib, io, json, os, pathlib, shutil, subprocess, sys, tempfile, unittest, urllib.error, urllib.parse
from unittest import mock

HERE = pathlib.Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
import check_report  # noqa: E402
import generate_daily_report as g  # noqa: E402
import publish  # noqa: E402

from cryptography.hazmat.primitives import serialization as ser  # noqa: E402
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey  # noqa: E402

NOW = datetime.datetime(2026, 11, 22, 9, 30, tzinfo=datetime.timezone.utc)
API = {"axes": [
    {"axis": "governance", "status": "MEASURED", "kind": "model-comparison", "n": 237, "accuracy": 0.5865, "interval": [0.5, 0.6],
     "leader": "m1", "separation": "TIE", "note": "a note", "measurement_time": {"state": "DAY", "observed_on": "2026-11-01"}},
    {"axis": "watchdog-ingest", "status": "MEASURED", "kind": "measured-subject", "n": 106, "note": "share 0.41",
     "measurement_time": {"state": "DAY", "observed_on": "2026-11-02"}},
    {"axis": "safety", "status": "MEASURED", "kind": "model-comparison", "n": 36, "accuracy": 0.9444, "leader": "m2",
     "separation": "TIE", "measurement_time": {"state": "DAY", "observed_on": "2026-11-01"}}]}
RANKINGS = {"axes": {"governance": {"models": [{"rank": 1, "arm": "m1", "accuracy": 0.5865}]},
                     "safety": {"models": [{"rank": 1, "arm": "m2", "accuracy": 0.9444}]}}}

DATE = "2026-11-22"
JSON, MD, SIG = (f"daily-report-{DATE}.{x}" for x in ("json", "md", "sig"))


def raw_hex(k):
    return k.public_key().public_bytes(ser.Encoding.Raw, ser.PublicFormat.Raw).hex()


STAND_IN = Ed25519PrivateKey.generate()  # signs where the board key would
STAND_IN_KEY = dict(check_report.BOARD_KEY, public_key_hex=raw_hex(STAND_IN), source="made by this test for the board key")

RUNNER_URL = "https://runner.invalid/idtoken?api-version=2.0"
RUNNER_TOKEN = "runner-request-token-for-tests"
JOB_JWT = "eyJhbGciOiJSUzI1NiJ9.eyJ0ZXN0Ijp0cnVlfQ.c2lnbmF0dXJl"
OIDC_ENV = {"ACTIONS_ID_TOKEN_REQUEST_URL": RUNNER_URL, "ACTIONS_ID_TOKEN_REQUEST_TOKEN": RUNNER_TOKEN}


class Network:
    """The two requests the board client makes: the runner's OIDC token endpoint, then POST /api/board-sign."""

    def __init__(self, refuse=None, did=check_report.BOARD_DID, signer_auth="github-oidc", key=STAND_IN):
        self.refuse, self.did, self.signer_auth, self.key, self.posted = refuse, did, signer_auth, key, []

    def __call__(self, req, timeout=None):
        url = req.full_url
        if url.startswith("https://runner.invalid/"):
            assert urllib.parse.parse_qs(urllib.parse.urlsplit(url).query)["audience"] == ["https://councilof.ai/api/board-sign"]
            assert req.get_header("Authorization") == "Bearer " + RUNNER_TOKEN
            return io.BytesIO(json.dumps({"count": 1, "value": JOB_JWT}).encode())
        assert url == "https://councilof.ai/api/board-sign", url
        assert req.get_method() == "POST" and req.get_header("Authorization") == "Bearer " + JOB_JWT
        payload = json.loads(req.data)["payload"]
        self.posted.append(payload)
        if self.refuse:  # board-sign.ts: a token from a workflow it does not admit
            raise urllib.error.HTTPError(url, 401, "Unauthorized", {}, io.BytesIO(json.dumps(
                {"error": "unauthorized", "reason": "OIDC rejected", "detail": self.refuse}, indent=2).encode()))
        c = check_report.canon(payload)  # board-sign.ts canonicalBytes, for an ASCII payload
        return io.BytesIO(json.dumps({
            "schema": "csoai.board-sign/0.1", "did": self.did, "sig_ed25519": self.key.sign(c).hex(),
            "payload_sha256": hashlib.sha256(c).hexdigest(), "signer_auth": self.signer_auth,
            "signed_at": "2026-11-22T09:31:07.512Z", "note": "Signed on Pages. PKCS8 never left Cloudflare. Not a certificate."},
            indent=2).encode())


def no_network(req, timeout=None):
    raise AssertionError(f"no request may be made here: {getattr(req, 'full_url', req)}")


def sign_with_board(raw, date=DATE, net=None, env=OIDC_ENV, did_key=STAND_IN):
    """g.sign_pointer on the board path, with the network and the did.json key stood in for."""
    vc = g.board_client()
    saved = list(vc._DID_KEY)
    vc._DID_KEY[:] = [did_key.public_key()]
    clean = {k: v for k, v in os.environ.items() if not k.startswith("ACTIONS_ID_TOKEN_REQUEST_")}
    try:
        with mock.patch.dict(os.environ, dict(clean, **env), clear=True), \
                mock.patch("urllib.request.urlopen", net if net is not None else Network()):
            return g.sign_pointer(raw, date)
    finally:
        vc._DID_KEY[:] = saved


class Withholding(unittest.TestCase):
    def test_held_axes_keep_their_state_and_lose_every_figure(self):
        out = g.build_axis_sections(API, RANKINGS, None, NOW)
        gov, wd, safe = out["governance"], out["watchdog-ingest"], out["safety"]
        for a, entry in ((gov, "C-2026-1120-02"), (wd, "C-2026-1120-01")):
            self.assertEqual(a["derived_state"], "MEASURED")
            self.assertTrue(all(a[k] is None for k in g.WITHHELD_FIELDS))
            self.assertEqual(a["top3"], [])
            self.assertEqual(a["withheld"]["entry"], entry)
        self.assertIn("EU AI Act correctly", gov["limit"])
        self.assertEqual(safe["accuracy"], 0.9444)  # an axis that is not held is untouched
        self.assertEqual(safe["top3"][0]["arm"], "m2")

    def test_a_held_axis_is_never_diffed_against_the_previous_report(self):
        prev = {"report_date": "2026-11-21", "axes": {"governance": {"derived_state": "MEASURED", "separation": "TIE",
                                                                     "leader": "m0", "top3": [{"arm": "m0"}]}}}
        out = g.build_axis_sections(API, RANKINGS, prev, NOW)
        self.assertEqual(out["governance"]["changes_vs_previous"],
                         ["withheld under C-2026-1120-02: no comparison with the previous report is published"])
        ch = g.build_changes_section(out, prev, {"ledger_rows": None}, None, {})
        self.assertEqual(ch["rank_changes"], [])


class Base(unittest.TestCase):
    def setUp(self):
        self.d = pathlib.Path(tempfile.mkdtemp())
        self.addCleanup(shutil.rmtree, self.d, ignore_errors=True)
        self.holds = json.loads((HERE / "holds.json").read_text())
        why = self.holds["entries"]["C-2026-1120-02"]["why"]
        lim = self.holds["entries"]["C-2026-1120-02"]["limit"]
        self.report = {"report_date": DATE, "axes": {"governance": {"withheld": {"entry": "C-2026-1120-02"}, "top3": []}},
                       "frontier": {"state": "WITHHELD"}, "signature": {"signature_file": SIG}}
        self.md = f"### 1. governance — MEASURED\n\n- {why}\n- limit: {lim}\n"

    def write(self, report=None, md=None, sig=None):
        """The trio as the generator writes it; the .sig comes from the board path unless one is given."""
        raw = json.dumps(report or self.report, sort_keys=True, indent=2).encode()
        (self.d / JSON).write_bytes(raw)
        (self.d / MD).write_text(self.md if md is None else md)
        sig = sig if sig is not None else sign_with_board(raw)
        self.put_sig(sig)
        return raw, sig

    def put_sig(self, sig):
        (self.d / SIG).write_text(json.dumps(sig, indent=2) + "\n")

    def run_check(self, key=STAND_IN_KEY):
        return check_report.check(self.d, DATE, self.holds, key)

    def assertFailsWith(self, r, state, words):
        self.assertEqual((r["result"], r["signature"]), ("FAIL", state), r["violations"])
        self.assertIn(words, r["signature_note"])


class Gate(Base):
    def test_a_clean_board_signed_report_passes(self):
        _, sig = self.write()
        self.assertEqual(sig["status"], "SIGNED")
        r = self.run_check()
        self.assertEqual((r["result"], r["signature"]), ("PASS", "VERIFIES"), r["violations"])
        self.assertEqual(r["key"]["did"], "did:web:csoai.org#board-attestation-1")

    def test_a_held_figure_fails(self):
        self.report["axes"]["governance"]["accuracy"] = 0.5865
        self.write()
        self.assertEqual(self.run_check()["result"], "FAIL")

    def test_a_banned_phrase_fails(self):
        self.write(md=self.md + "\nMEOK scored 219/237.\n")
        r = self.run_check()
        self.assertEqual(r["result"], "FAIL")
        self.assertTrue(any("219/237" in v for v in r["violations"]))

    def test_a_missing_limit_fails(self):
        self.write(md=self.md.split("- limit:")[0])
        self.assertEqual(self.run_check()["result"], "FAIL")

    def test_a_report_of_another_date_fails(self):
        self.write(report=dict(self.report, report_date="2026-11-21"))
        r = self.run_check()
        self.assertEqual(r["result"], "FAIL")
        self.assertTrue(any("report_date" in v for v in r["violations"]))


class Pointer(Base):
    """What the board signs, and every way the check refuses a report that is not the signed one."""

    def test_the_signer_is_sent_only_the_pointer_to_the_exact_bytes(self):
        net = Network()
        raw = json.dumps(self.report).encode()
        sig = sign_with_board(raw, net=net)
        self.assertEqual(net.posted, [sig["pointer"]])
        p = net.posted[0]
        self.assertEqual(sorted(p), sorted(check_report.POINTER_KEYS))
        self.assertEqual((p["schema"], p["report_date"], p["file"], p["sha256"]),
                         ("csoai.daily-report-pointer/0.1", DATE, JSON, hashlib.sha256(raw).hexdigest()))
        c = check_report.canon(p)
        self.assertTrue(c.isascii() and len(c) < 3072)
        self.assertEqual(sig["signature"]["payload_sha256"], hashlib.sha256(c).hexdigest())
        self.assertTrue(all(v == "rejected (control holds)" for v in sig["local_verification"]["altered_preimage_controls"].values()))

    def test_a_tampered_report_fails(self):
        raw, _ = self.write()
        (self.d / JSON).write_bytes(raw + b" ")  # one byte added after signing
        self.assertFailsWith(self.run_check(), "FAILS", "pointer.sha256 is not the SHA-256 of the .json bytes")
        (self.d / JSON).write_bytes(raw.replace(b'"WITHHELD"', b'"WITHHELD "'))  # one value changed after signing
        self.assertFailsWith(self.run_check(), "FAILS", "pointer.sha256 is not the SHA-256 of the .json bytes")

    def test_a_tampered_pointer_fails(self):
        raw, sig = self.write()
        forged = raw.replace(b'"WITHHELD"', b'"PUBLISHED"')
        (self.d / JSON).write_bytes(forged)
        # the pointer moved to the new bytes, the signature left as it was
        bad = json.loads(json.dumps(sig))
        bad["pointer"]["sha256"] = hashlib.sha256(forged).hexdigest()
        self.put_sig(bad)
        self.assertFailsWith(self.run_check(), "FAILS", "signature.payload_sha256 is not the SHA-256 of the canonical pointer")
        # ... and its digest field moved with it: only the Ed25519 signature is left to catch it, and it does
        bad["signature"]["payload_sha256"] = hashlib.sha256(check_report.canon(bad["pointer"])).hexdigest()
        self.put_sig(bad)
        self.assertFailsWith(self.run_check(), "FAILS", "the Ed25519 signature does not verify over the canonical pointer")
        # a pointer field that is not the digest: signed_at
        (self.d / JSON).write_bytes(raw)
        bad = json.loads(json.dumps(sig))
        bad["pointer"]["signed_at"] = "2026-11-23T00:00:00Z"
        bad["signature"]["payload_sha256"] = hashlib.sha256(check_report.canon(bad["pointer"])).hexdigest()
        self.put_sig(bad)
        self.assertFailsWith(self.run_check(), "FAILS", "the Ed25519 signature does not verify over the canonical pointer")
        # the untouched .sig still passes, so each failure above is the tampering
        self.put_sig(sig)
        self.assertEqual(self.run_check()["result"], "PASS")

    def test_the_same_signature_fails_under_the_pinned_board_key(self):
        self.write()
        r = self.run_check(key=None)  # the default: the pinned board key, never one carried in the .sig
        self.assertEqual(r["key"]["public_key_hex"], "9367cf59be9cb72bbc9796adf056201ec1c58adfeaa13f83b2c5b754d6c20170")
        self.assertFailsWith(r, "FAILS", "the Ed25519 signature does not verify")

    def test_a_pointer_signed_for_another_day_fails(self):
        raw, _ = self.write()
        self.put_sig(sign_with_board(raw, date="2026-11-21"))  # a real board signature, over yesterday's name
        self.assertFailsWith(self.run_check(), "FAILS", "pointer.report_date is '2026-11-21', not '2026-11-22'")

    def test_a_pointer_with_another_key_set_fails_even_when_signed(self):
        raw, sig = self.write()
        p = dict(sig["pointer"], note="an extra field")
        c = check_report.canon(p)
        sig = dict(sig, pointer=p, signature=dict(sig["signature"], sig_ed25519=STAND_IN.sign(c).hex(),
                                                  payload_sha256=hashlib.sha256(c).hexdigest()))
        self.put_sig(sig)
        self.assertFailsWith(self.run_check(), "FAILS", "the pointer does not have exactly the keys")
        del p["note"], p["signed_at"]
        self.put_sig(dict(sig, pointer=p))
        self.assertFailsWith(self.run_check(), "FAILS", "the pointer does not have exactly the keys")

    def test_a_sig_that_carries_its_own_key_fails(self):
        raw, _ = self.write()
        k = Ed25519PrivateKey.generate()  # the 0.1 form: a signature over the raw bytes under the key it carries
        spki = k.public_key().public_bytes(ser.Encoding.DER, ser.PublicFormat.SubjectPublicKeyInfo)
        self.put_sig({"schema": "csoai.daily-report-sig/0.1", "signature": base64.b64encode(k.sign(raw)).decode(),
                      "public_key_spki_b64": base64.b64encode(spki).decode(), "signed_file_sha256": hashlib.sha256(raw).hexdigest()})
        self.assertFailsWith(self.run_check(), "FAILS", "not csoai.daily-report-sig/0.2")

    def test_another_did_or_signer_fails(self):
        _, sig = self.write()
        self.put_sig(dict(sig, signature=dict(sig["signature"], did="did:web:csoai.org#card-attestation-1")))
        self.assertFailsWith(self.run_check(), "FAILS", "not did:web:csoai.org#board-attestation-1")
        other = Ed25519PrivateKey.generate()
        self.put_sig(dict(sig, signature=dict(sig["signature"], sig_ed25519=other.sign(check_report.canon(sig["pointer"])).hex())))
        self.assertFailsWith(self.run_check(), "FAILS", "the Ed25519 signature does not verify")

    def test_an_unsigned_report_fails(self):
        raw = json.dumps(self.report).encode()
        sig = sign_with_board(raw, env={}, net=no_network)
        self.write(sig=sig)
        self.assertFailsWith(self.run_check(), "UNSIGNED", "NO_OIDC")


class Fallbacks(unittest.TestCase):
    """No token, a refused call or a reply that does not check: an UNSIGNED .sig with the reason, never a signature."""
    raw = b'{"report_date": "2026-11-22"}'

    def assertUnsigned(self, sig, *words):
        self.assertEqual((sig["status"], sig["signature"]), ("UNSIGNED", None))
        self.assertNotIn("local_verification", sig)
        for w in words:
            self.assertIn(w, sig["note"])
        self.assertNotIn(JOB_JWT, json.dumps(sig))
        self.assertNotIn(RUNNER_TOKEN, json.dumps(sig))
        self.assertEqual(sig["pointer"]["sha256"], hashlib.sha256(self.raw).hexdigest())  # still says what was not signed

    def test_no_oidc_token(self):
        self.assertUnsigned(sign_with_board(self.raw, env={}, net=no_network), "NO_OIDC")

    def test_the_signer_refuses(self):
        net = Network(refuse="workflow")
        self.assertUnsigned(sign_with_board(self.raw, net=net), "HTTP 401", "OIDC rejected", "workflow")
        self.assertEqual(len(net.posted), 1)

    def test_the_signer_answers_for_another_caller(self):
        self.assertUnsigned(sign_with_board(self.raw, net=Network(signer_auth="pod-token")), "SIGNER_AUTH_MISMATCH")

    def test_the_signer_names_another_did(self):
        self.assertUnsigned(sign_with_board(self.raw, net=Network(did="did:web:csoai.org#card-attestation-1")),
                            "card-attestation-1")

    def test_the_signature_does_not_verify_under_the_did_json_key(self):
        self.assertUnsigned(sign_with_board(self.raw, did_key=Ed25519PrivateKey.generate()), "InvalidSignature")


class PullRequestDryRun(Base):
    """A throwaway key tests the pointer and the verify path; its check names that key, and publish.py refuses it."""

    def test_a_test_key_sig_passes_only_under_that_key_and_is_never_published(self):
        k = Ed25519PrivateKey.generate()
        kf, pf = self.d / "key.b64", self.d / "pub.hex"
        kf.write_text(base64.b64encode(k.private_bytes(ser.Encoding.DER, ser.PrivateFormat.PKCS8, ser.NoEncryption())).decode())
        pf.write_text(raw_hex(k))
        raw = json.dumps(self.report, sort_keys=True, indent=2).encode()
        with mock.patch("urllib.request.urlopen", no_network):
            sig = g.sign_pointer(raw, DATE, kf)
        self.assertEqual((sig["status"], sig["signature"]["did"]), ("TEST_KEY", "test-key:pull-request-dry-run"))
        self.write(sig=sig)
        self.assertEqual(self.run_check(key=check_report.test_key(raw_hex(k)))["result"], "PASS")
        self.assertFailsWith(self.run_check(key=None), "FAILS", "not did:web:csoai.org#board-attestation-1")
        # the workflow's command line: the check passes under the throwaway key and says so
        r = subprocess.run([sys.executable, str(HERE / "check_report.py"), "--dir", str(self.d), "--date", DATE,
                            "--test-public-key", str(pf)], capture_output=True, text=True)
        self.assertEqual(r.returncode, 0, r.stdout + r.stderr)
        chk = json.loads((self.d / f"report-check-{DATE}.json").read_text())
        self.assertEqual((chk["result"], chk["signature"], chk["key"]["did"]), ("PASS", "VERIFIES", "test-key:pull-request-dry-run"))
        # publish.py refuses that check before it looks for a token
        with mock.patch.object(sys, "argv", ["publish.py", "--dir", str(self.d), DATE]), \
                mock.patch.dict(os.environ, {"HF_TOKEN": ""}), mock.patch("urllib.request.urlopen", no_network):
            self.assertEqual(publish.main(), 3)
        # and the board check of the same files fails on the command line too
        r = subprocess.run([sys.executable, str(HERE / "check_report.py"), "--dir", str(self.d), "--date", DATE],
                           capture_output=True, text=True)
        self.assertEqual(r.returncode, 1, r.stdout + r.stderr)

    def test_a_bad_test_key_is_unsigned(self):
        (self.d / "key.b64").write_text("not a key")
        sig = g.sign_pointer(b"{}", DATE, self.d / "key.b64")
        self.assertEqual((sig["status"], sig["signature"]), ("UNSIGNED", None))


if __name__ == "__main__":
    unittest.main()
