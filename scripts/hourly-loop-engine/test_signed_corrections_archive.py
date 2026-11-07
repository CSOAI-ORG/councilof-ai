import unittest
import importlib.util
from pathlib import Path
from unittest.mock import patch
import hashlib
import json
import tempfile
HERE=Path(__file__).resolve().parent
spec=importlib.util.spec_from_file_location("hourly_loop_engine",HERE/"hourly_loop_engine.py")
engine=importlib.util.module_from_spec(spec)
spec.loader.exec_module(engine)

class SignedCorrectionsArchiveTest(unittest.TestCase):
    def test_public_signed_body_archive_is_idempotent_and_fail_closed(self):
        from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey
        from cryptography.hazmat.primitives import serialization
        key = Ed25519PrivateKey.generate()
        public = key.public_key().public_bytes(
            encoding=serialization.Encoding.Raw, format=serialization.PublicFormat.Raw
        ).hex()
        ledger = {"schema": "csoai.corrections/0.1", "corrections": [{"id": "C-1"}]}
        signed = json.dumps(ledger, sort_keys=True, separators=(",", ":"), ensure_ascii=True).encode()
        content_id = hashlib.sha256(signed).hexdigest()
        attestation = {"content_id": content_id}
        sig_bytes = json.dumps(attestation, sort_keys=True, separators=(",", ":"), ensure_ascii=True).encode()
        signature = {"id": content_id, "signer": public, "signature": key.sign(sig_bytes).hex(), "attestation": attestation}
        check = {"state": "VALID", "content_id_matches": True, "ed25519_verified": True,
                 "recomputed_content_id": content_id, "attested_content_id": content_id,
                 "key_ed25519_hex": public,
                 "unsigned_wrapper_fields": ["signature", "signature_state", "signature_check", "correction_latency", "note", "fix_requires"]}
        def response(tick, signature=signature):
            return json.dumps({**ledger, "signature": signature, "signature_check": check,
                               "correction_latency": {"calculated_at": tick}}).encode()
        class FakeResponse:
            status = 200
            headers = {}
            def __init__(self, body): self.body = body
            def __enter__(self): return self
            def __exit__(self, *args): return False
            def read(self, count): return self.body
        spec = {"kind": "http", "url": "https://councilof.ai/api/corrections", "signed_content_identity": "corrections-v1"}
        with tempfile.TemporaryDirectory() as tmp:
            archive = Path(tmp) / "signed-corrections"
            with patch.object(engine.urllib.request, "urlopen", side_effect=[FakeResponse(response("t1")), FakeResponse(response("t2"))]):
                a = engine.http_probe(spec, archive_dir=archive)
                b = engine.http_probe(spec, archive_dir=archive)
            self.assertEqual((a["state"], b["state"]), ("OBSERVED", "OBSERVED"))
            self.assertEqual(a["signed_body_archive"], "signed-corrections/" + content_id + ".json")
            self.assertEqual(list(archive.glob("*.json")), [archive / (content_id + ".json")])
            self.assertEqual((archive / (content_id + ".json")).read_bytes(), signed)
            bad_sig = {**signature, "signature": "00" * 64}
            with patch.object(engine.urllib.request, "urlopen", return_value=FakeResponse(response("t3", bad_sig))):
                bad = engine.http_probe(spec, archive_dir=archive)
            self.assertEqual(bad["state"], "INCONCLUSIVE")
            self.assertNotIn("signed_body_archive", bad)
            (archive / (content_id + ".json")).write_bytes(b"corrupt")
            with patch.object(engine.urllib.request, "urlopen", return_value=FakeResponse(response("t4"))):
                corrupt = engine.http_probe(spec, archive_dir=archive)
            self.assertEqual(corrupt["state"], "INCONCLUSIVE")
            self.assertIn("signed_archive_failed", corrupt["reason"])
            self.assertEqual((archive / (content_id + ".json")).read_bytes(), b"corrupt")
            oversized = FakeResponse(b"x" * (engine.MAX_HTTP_BYTES + 1))
            with patch.object(engine.urllib.request, "urlopen", return_value=oversized):
                too_large = engine.http_probe(spec, archive_dir=archive)
            self.assertEqual(too_large["state"], "INCONCLUSIVE")
            self.assertEqual(too_large["reason"], "response_exceeded_2MiB")


if __name__=="__main__":unittest.main()
