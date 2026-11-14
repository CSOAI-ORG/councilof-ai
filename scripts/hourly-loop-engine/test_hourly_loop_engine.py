import importlib.util
import hashlib
from unittest.mock import patch
import json
from pathlib import Path
import unittest

HERE = Path(__file__).resolve().parent
spec = importlib.util.spec_from_file_location("hourly_loop_engine", HERE / "hourly_loop_engine.py")
engine = importlib.util.module_from_spec(spec)
spec.loader.exec_module(engine)


class HourlyLoopEngineTests(unittest.TestCase):
    def test_manifest_has_40_unique_loops_and_23_axis_links(self):
        manifest = json.loads((HERE / "loops.json").read_text())
        loops = manifest["loops"]
        self.assertEqual(len(loops), 40)
        self.assertEqual(len({row["id"] for row in loops}), 40)
        axes = {axis for row in loops for axis in row.get("related_axes", [])}
        self.assertEqual(len(axes), 23)
        self.assertIn("effect-binding", axes)

    def test_merkle_is_deterministic(self):
        leaves = [engine.sha(b"a"), engine.sha(b"b"), engine.sha(b"c")]
        self.assertEqual(engine.merkle_root(leaves), engine.merkle_root(leaves))
        self.assertNotEqual(engine.merkle_root(leaves), engine.merkle_root(list(reversed(leaves))))

    def test_loop_fingerprint_changes_with_dependency(self):
        loop = {"id": "H-X"}
        probes = [{"source": "x", "state": "OBSERVED", "sha256": "a" * 64}]
        a = engine.loop_fingerprint(loop, probes, {"H-01": "b" * 64})
        b = engine.loop_fingerprint(loop, probes, {"H-01": "c" * 64})
        self.assertNotEqual(a, b)

    def test_verified_corrections_ignore_unsigned_wrapper_churn_but_keep_raw_receipt(self):
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
        excluded = ["signature", "signature_state", "signature_check", "correction_latency", "note", "fix_requires"]
        check = {"state": "VALID", "content_id_matches": True, "ed25519_verified": True,
                 "recomputed_content_id": content_id, "attested_content_id": content_id,
                 "key_ed25519_hex": public, "unsigned_wrapper_fields": excluded}
        def response(tick, signature=signature, check=check):
            return json.dumps({**ledger, "signature": signature, "signature_check": check,
                               "correction_latency": {"calculated_at": tick}, "note": tick}).encode()
        class FakeResponse:
            status = 200
            headers = {}
            def __init__(self, body): self.body = body
            def __enter__(self): return self
            def __exit__(self, *args): return False
            def read(self, count): return self.body
        spec = {"kind": "http", "url": "https://councilof.ai/api/corrections", "signed_content_identity": "corrections-v1"}
        with patch.object(engine.urllib.request, "urlopen", side_effect=[FakeResponse(response("tick-1")), FakeResponse(response("tick-2"))]):
            a, b = engine.http_probe(spec), engine.http_probe(spec)
        self.assertEqual(a["state"], "OBSERVED")
        self.assertNotEqual(a["sha256"], b["sha256"])
        self.assertEqual(a["signed_content_id"], b["signed_content_id"])
        self.assertEqual(engine.loop_fingerprint({"id": "H-05"}, [a], {}), engine.loop_fingerprint({"id": "H-05"}, [b], {}))
        bad = response("tick-3", signature={**signature, "signature": "00" * 64})
        with patch.object(engine.urllib.request, "urlopen", return_value=FakeResponse(bad)):
            failed = engine.http_probe(spec)
        self.assertEqual(failed["state"], "INCONCLUSIVE")
        self.assertIn("sha256", failed)
        self.assertNotIn("signed_content_id", failed)
        changed = dict(ledger, corrections=[{"id": "C-2"}])
        changed_body = json.dumps({**changed, "signature": signature, "signature_check": check}).encode()
        with patch.object(engine.urllib.request, "urlopen", return_value=FakeResponse(changed_body)):
            failed = engine.http_probe(spec)
        self.assertEqual(failed["state"], "INCONCLUSIVE")

    def test_manifest_probes_canonical_page_destinations(self):
        loops = {row["id"]: row for row in json.loads((HERE / "loops.json").read_text())["loops"]}
        self.assertIn("https://councilof.ai/dashboard/?tab=measured&task=pricing-overview", [p["url"] for p in loops["H-35"]["probes"]])
        self.assertIn("https://councilof.ai/tools/", [p["url"] for p in loops["H-36"]["probes"]])
        self.assertIn("https://councilof.ai/products/", [p["url"] for p in loops["H-36"]["probes"]])

    def test_inconclusive_probe_preserves_last_observed_baseline(self):
        good = {"state": "OBSERVED", "fingerprint": "a" * 64, "observed_at": "t0"}
        failed = {"state": "INCONCLUSIVE", "fingerprint": "b" * 64, "observed_at": "t1"}
        self.assertEqual(engine.next_observed_state(good, failed), good)
        self.assertEqual(engine.next_observed_state(None, failed),
                         {"state": "INCONCLUSIVE", "observed_at": "t1"})
        recovered = {"state": "OBSERVED", "fingerprint": "a" * 64, "observed_at": "t2"}
        self.assertEqual(engine.next_observed_state(good, recovered)["fingerprint"], good["fingerprint"])
        changed = {**recovered, "fingerprint": "c" * 64}
        self.assertNotEqual(engine.next_observed_state(good, changed)["fingerprint"], good["fingerprint"])

    def test_missing_file_is_inconclusive(self):
        row = engine.file_probe({"kind": "file", "path": "this-file-does-not-exist"})
        self.assertEqual(row["state"], "INCONCLUSIVE")


if __name__ == "__main__":
    unittest.main()
