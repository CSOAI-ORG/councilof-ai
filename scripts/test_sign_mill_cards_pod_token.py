"""sign_mill_cards.py --pod-token-file: fail closed, refuse a signature over other bytes."""
from __future__ import annotations

import hashlib
import io
import json
import sys
import tempfile
import unittest
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
sys.path.insert(0, str(HERE.parent / "harness" / "gspc-top100"))
import sign_mill_cards as smc  # noqa: E402
from verify_card import canonical_js_body_bytes  # noqa: E402

BODY = {
    "kind": "gspc.measurement-card", "axis": "safety", "model": "ollama:x@sha256:" + "0" * 64,
    "issuer": "CSOAI Ltd", "n": 36, "accuracy": 0.5, "status": "MEASURED", "unmeasured": [],
    "public_framing": "Measurement, not certification. Empty is not zero.",
    "verify": "https://councilof.ai/gspc-verify", "brand": "Council of AI", "signature_state": "SIGNED",
}


class _Resp(io.BytesIO):
    def __enter__(self):
        return self

    def __exit__(self, *a):
        return False


def _opener_returning(reply: dict):
    calls = []

    def opener(request, timeout=0):
        calls.append(request)
        return _Resp(json.dumps(reply).encode("utf-8"))

    opener.calls = calls
    return opener


def _never_called(request, timeout=0):
    raise AssertionError("a request was sent although signing had to fail closed")


class PodTokenPath(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.tok = Path(self.tmp.name) / "tok"
        self.tok.write_text("pod-caller-token\n", encoding="utf-8")

    def tearDown(self):
        self.tmp.cleanup()

    def test_absent_token_fails_closed_without_a_request(self):
        with self.assertRaises(RuntimeError):
            smc.sign_via_pod_token_attested(dict(BODY), Path(self.tmp.name) / "missing", opener=_never_called)

    def test_empty_token_fails_closed_without_a_request(self):
        self.tok.write_text("  \n", encoding="utf-8")
        with self.assertRaises(RuntimeError):
            smc.sign_via_pod_token_attested(dict(BODY), self.tok, opener=_never_called)

    def test_never_sign_label_refused_before_request(self):
        body = dict(BODY, model="THIN specimen")
        with self.assertRaises(RuntimeError):
            smc.sign_via_pod_token_attested(body, self.tok, opener=_never_called)

    def test_digest_over_other_bytes_is_refused(self):
        opener = _opener_returning({"payload_sha256": "00" * 32, "sig_ed25519": "ab" * 64, "did": smc.DID})
        with self.assertRaises(RuntimeError) as ctx:
            smc.sign_via_pod_token_attested(dict(BODY), self.tok, opener=opener)
        self.assertIn("other bytes", str(ctx.exception))
        self.assertEqual(len(opener.calls), 1)

    def test_reply_without_signature_is_refused(self):
        digest = hashlib.sha256(canonical_js_body_bytes(BODY)).hexdigest()
        opener = _opener_returning({"payload_sha256": digest, "sig_ed25519": None})
        with self.assertRaises(RuntimeError):
            smc.sign_via_pod_token_attested(dict(BODY), self.tok, opener=opener)

    def test_matching_digest_returns_signature_and_local_digest(self):
        digest = hashlib.sha256(canonical_js_body_bytes(BODY)).hexdigest()
        opener = _opener_returning({"payload_sha256": digest, "sig_ed25519": "AB" * 64, "did": smc.DID})
        sig, got = smc.sign_via_pod_token_attested(dict(BODY), self.tok, opener=opener)
        self.assertEqual(sig, "ab" * 64)
        self.assertEqual(got, digest)
        req = opener.calls[0]
        self.assertEqual(req.get_method(), "POST")
        self.assertEqual(json.loads(req.data.decode("utf-8")), {"payload": BODY})
        self.assertEqual(req.get_header("Authorization"), "Bearer pod-caller-token")

    def test_main_exits_3_when_token_file_absent(self):
        src = Path(self.tmp.name) / "inbox"
        src.mkdir()
        (src / "unsigned-safety-000000000000.json").write_text(json.dumps({"body": BODY, "id": "x"}), encoding="utf-8")
        rc = smc.main(["--source-dir", str(src), "--dest-dir", str(Path(self.tmp.name) / "out"),
                       "--pod-token-file", str(Path(self.tmp.name) / "missing")])
        self.assertEqual(rc, 3)
        self.assertFalse((Path(self.tmp.name) / "out").exists())


if __name__ == "__main__":
    unittest.main()
