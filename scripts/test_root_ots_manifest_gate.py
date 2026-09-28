"""Release regression: a newly selected root must be in the rebuilt OTS manifest."""
import contextlib
import hashlib
import io
import json
import sys
import tempfile
import unittest
from pathlib import Path

from opentimestamps.core.notary import PendingAttestation
from opentimestamps.core.op import OpSHA256
from opentimestamps.core.serialize import StreamSerializationContext
from opentimestamps.core.timestamp import DetachedTimestampFile, Timestamp

SCRIPTS = Path(__file__).resolve().parent
sys.path.insert(0, str(SCRIPTS))
sys.path.insert(0, str(SCRIPTS / "pod-loops"))
from card_root import merkle_root  # noqa: E402
from ots_manifest_rebuild import main as rebuild  # noqa: E402
from root_ots_manifest_gate import verify  # noqa: E402


def proof(subject: bytes) -> bytes:
    timestamp = Timestamp(OpSHA256()(subject))
    timestamp.attestations.add(PendingAttestation("https://a.pool.opentimestamps.org"))
    stream = io.BytesIO()
    DetachedTimestampFile(OpSHA256(), timestamp).serialize(StreamSerializationContext(stream))
    return stream.getvalue()


class RootManifestReleaseTests(unittest.TestCase):
    def setUp(self):
        temp = tempfile.TemporaryDirectory()
        self.addCleanup(temp.cleanup)
        self.public = Path(temp.name) / "public"
        (self.public / "interop/ots").mkdir(parents=True)
        self.write_root(1)
        self.rebuild()

    def write_root(self, n: int) -> Path:
        leaf = hashlib.sha256(f"synthetic-{n}".encode()).hexdigest()
        root = merkle_root([leaf])
        name = f"card-root-2026-09-24-{root[:12]}.json"
        body = {"kind": "csoai.card-root/1", "n_leaves": 1,
                "merkle_root": root, "leaves": [{"index": 0, "leaf": leaf}]}
        raw = (json.dumps(body, sort_keys=True) + "\n").encode()
        path = self.public / "interop" / name
        path.write_bytes(raw)
        path.with_suffix(".json.ots").write_bytes(proof(raw))
        pointer = {"schema": "csoai.card-root-pointer/1", "root_url": f"/interop/{name}",
                   "root_sha256": hashlib.sha256(raw).hexdigest(), "n_leaves": 1,
                   "ots_url": f"/interop/{name}.ots"}
        (self.public / "interop/card-root-latest.json").write_text(json.dumps(pointer))
        return path

    def rebuild(self):
        args = ["--dir", str(self.public / "interop"),
                "--dir", str(self.public / "interop/ots"),
                "--out", str(self.public / "interop/ots/manifest.json"),
                "--public", str(self.public), "--apply"]
        with contextlib.redirect_stdout(io.StringIO()):
            self.assertEqual(rebuild(args), 0)

    def test_fresh_root_and_pending_proof_pass_without_anchor_claim(self):
        result = verify(self.public)
        self.assertEqual(result["manifest_proofs"], 1)
        self.assertEqual(result["ots_state"], "PENDING")
        self.assertFalse(result["chain_verified"])

    def test_new_root_after_prior_manifest_blocks_then_rebuild_passes(self):
        self.write_root(2)  # the :23 root arrived after the :45 manifest
        with self.assertRaisesRegex(ValueError, "manifest differs"):
            verify(self.public)
        self.rebuild()  # the :50 lander must do this before its push
        result = verify(self.public)
        self.assertEqual(result["manifest_proofs"], 2)
        self.assertIn("card-root-2026-09-24", result["root_url"])

    def test_wrong_root_digest_and_wrong_proof_block(self):
        pointer = self.public / "interop/card-root-latest.json"
        obj = json.loads(pointer.read_text())
        obj["root_sha256"] = "0" * 64
        pointer.write_text(json.dumps(obj))
        with self.assertRaisesRegex(ValueError, "pointer root digest"):
            verify(self.public)
        self.write_root(1)
        subject = self.public / json.loads(pointer.read_text())["root_url"].lstrip("/")
        subject.with_suffix(".json.ots").write_bytes(proof(b"different bytes"))
        self.rebuild()
        with self.assertRaisesRegex(ValueError, "exact SHA256"):
            verify(self.public)

    def test_manifest_row_mutation_blocks_even_when_count_is_unchanged(self):
        manifest = self.public / "interop/ots/manifest.json"
        obj = json.loads(manifest.read_text())
        obj["proofs"][0]["sha256_of_proof"] = "0" * 64
        manifest.write_text(json.dumps(obj))
        with self.assertRaisesRegex(ValueError, "manifest differs"):
            verify(self.public)


if __name__ == "__main__":
    unittest.main()
