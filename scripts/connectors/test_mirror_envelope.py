from __future__ import annotations

import copy
import unittest

from mirror_envelope import EnvelopeError, build_envelope, encode_jsonl, parse_jsonl, validate_envelope


def sample(**overrides):
    values = {
        "source_platform": "councilofai",
        "source_uri": "https://councilof.ai/root.json",
        "source_revision": "a" * 40,
        "subject_kind": "measurement-root",
        "subject_id": "gspc-root",
        "measurement_kind": "gspc.root-manifest",
        "artifact_uri": "https://councilof.ai/root.json",
        "artifact_payload": b'{"ok":true}\n',
        "artifact_media_type": "application/json",
        "timestamp": "2026-09-14T10:56:05Z",
        "license_id": "MIT",
        "provenance_uri": "https://github.com/CSOAI-ORG/council-of-ai/commit/" + "a" * 40,
        "lifecycle_state": "published",
        "error": None,
    }
    values.update(overrides)
    return build_envelope(**values)


class MirrorEnvelopeTest(unittest.TestCase):
    def test_same_inputs_have_same_id_and_bytes(self):
        first, second = sample(), sample()
        self.assertEqual(first["envelope_id"], second["envelope_id"])
        self.assertEqual(encode_jsonl([first]), encode_jsonl([second]))

    def test_artifact_tamper_fails_closed(self):
        with self.assertRaisesRegex(EnvelopeError, "artifact bytes"):
            validate_envelope(sample(), b'{"ok":false}\n')

    def test_mirror_cannot_claim_authority(self):
        row = sample()
        row["authority"]["uri"] = "https://kaggle.com"
        with self.assertRaisesRegex(EnvelopeError, "canonical review authority"):
            validate_envelope(row)

    def test_error_state_is_typed(self):
        with self.assertRaisesRegex(EnvelopeError, "requires code and message"):
            sample(lifecycle_state="error", error=None)
        row = sample(
            lifecycle_state="error",
            error={"code": "FETCH_TIMEOUT", "message": "source timed out", "retryable": True},
        )
        validate_envelope(row)

    def test_non_error_rejects_error_payload(self):
        with self.assertRaisesRegex(EnvelopeError, "must be null"):
            sample(error={"code": "X", "message": "wrong state", "retryable": False})

    def test_jsonl_rejects_empty_and_mutated_ids(self):
        with self.assertRaisesRegex(EnvelopeError, "empty"):
            parse_jsonl(b"\n")
        row = copy.deepcopy(sample())
        row["subject"]["id"] = "mutated"
        import json
        with self.assertRaisesRegex(EnvelopeError, "envelope_id"):
            parse_jsonl((json.dumps(row) + "\n").encode())


if __name__ == "__main__":
    unittest.main()
