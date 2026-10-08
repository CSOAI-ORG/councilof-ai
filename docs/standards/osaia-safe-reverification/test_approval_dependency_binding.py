"""Focused composition controls; fixtures never establish live approval."""
import copy
import hashlib
import json
from pathlib import Path
import unittest

from verify_safe_evidence import check_approval_dependency

HERE = Path(__file__).resolve().parent
URI = ("https://raw.githubusercontent.com/CSOAI-ORG/councilof-ai/"
       "9e3fc1c5de879dad3788006ab568ed930fa2fbb2/"
       "docs/standards/osaia-safe-reverification/hitl-authority-effect.example.json")
PIN = "333b19b69b1e988cf710a63e7bc9e15b59d2dc9a415f3b7ecbfec541389173cd"

class ApprovalByteComposition(unittest.TestCase):
    def setUp(self):
        self.approval = (HERE / "hitl-authority-effect.example.json").read_bytes()
        self.assertEqual(hashlib.sha256(self.approval).hexdigest(), PIN)
        self.record = json.loads((HERE / "examples" /
            "example-pass-a2a-card-census-integrity.json").read_bytes())
        self.record["dependencies"].append({
            "dep_id": "fixture:approval", "kind": "approval", "state": "PINNED",
            "uri": URI, "digest": {"alg": "sha256", "value": PIN},
        })

    def dependency(self):
        return self.record["dependencies"][-1]

    def check(self, record=None, uri=URI, raw=None, dep_id="fixture:approval"):
        return check_approval_dependency(
            self.record if record is None else record, dep_id, uri,
            self.approval if raw is None else raw)

    def test_exact_pair_is_only_a_byte_match(self):
        self.assertEqual(self.check(), "BYTE_INTEGRITY_MATCH")
        self.assertEqual(self.record["watch"]["state"], "NOT_WATCHED")

    def test_same_uri_same_json_but_changed_bytes_is_rejected(self):
        changed = self.approval + b" "
        self.assertEqual(json.loads(changed), json.loads(self.approval))
        self.assertNotEqual(hashlib.sha256(changed).hexdigest(), PIN)
        with self.assertRaises(ValueError):
            self.check(raw=changed)

    def test_same_bytes_at_different_uri_is_rejected(self):
        with self.assertRaises(ValueError):
            self.check(uri=URI + "?other-source")

    def test_missing_or_ambiguous_dependency_is_rejected(self):
        with self.assertRaises(ValueError):
            self.check(dep_id="fixture:missing")
        self.record["dependencies"].append(copy.deepcopy(self.dependency()))
        with self.assertRaises(ValueError):
            self.check()

    def test_unqualified_dependency_states_are_rejected(self):
        for state in ("UNPINNED", "UNAVAILABLE", "NOT_APPLICABLE", True, None):
            with self.subTest(state=state):
                self.dependency()["state"] = state
                with self.assertRaises(ValueError):
                    self.check()

    def test_digest_shape_algorithm_and_case_are_strict(self):
        for value in (None, True, {"alg": "sha512", "value": PIN},
                      {"alg": "sha256", "value": PIN.upper()},
                      {"alg": "sha256", "value": PIN[:-1]},
                      {"alg": "sha256", "value": "0" * 64},
                      {"alg": "sha256", "value": PIN, "authenticated": True}):
            with self.subTest(value=value):
                self.dependency()["digest"] = value
                with self.assertRaises(ValueError):
                    self.check()

    def test_unexpected_argument_and_record_types_are_rejected(self):
        for args in ((True, "fixture:approval", URI, self.approval),
                     ([], "fixture:approval", URI, self.approval),
                     (self.record, True, URI, self.approval),
                     (self.record, "fixture:approval", True, self.approval),
                     (self.record, "fixture:approval", URI, True),
                     (self.record, "fixture:approval", URI, bytearray(self.approval)),
                     (self.record, "fixture:approval", URI, b"")):
            with self.subTest(types=[type(x).__name__ for x in args]):
                with self.assertRaises(ValueError):
                    check_approval_dependency(*args)
        self.record["authority_authenticated"] = True
        with self.assertRaises(ValueError):
            self.check()

    def test_digest_match_does_not_turn_deny_into_approval(self):
        deny = json.loads(self.approval)
        deny["authority"]["decision"] = "DENY"
        raw = json.dumps(deny, sort_keys=True, separators=(",", ":")).encode()
        self.dependency()["digest"]["value"] = hashlib.sha256(raw).hexdigest()
        self.assertEqual(self.check(raw=raw), "BYTE_INTEGRITY_MATCH")
        self.assertEqual(json.loads(raw)["authority"]["decision"], "DENY")

    def test_invalid_or_unexpected_approval_body_is_rejected_even_if_hash_matches(self):
        bad = [b"true", b"[]", b"not-json", b'{"profile":"x","profile":"x"}',
               b'{"profile":NaN}', b'{"profile":"csoai.hitl-authority-effect/0.1"}']
        for raw in bad:
            with self.subTest(raw=raw):
                self.dependency()["digest"]["value"] = hashlib.sha256(raw).hexdigest()
                with self.assertRaises(ValueError):
                    self.check(raw=raw)

    def test_non_utf8_or_bom_approval_is_rejected(self):
        for raw in (self.approval.decode("utf-8").encode("utf-16"),
                    bytes([239,187,191])+self.approval):
            with self.subTest(encoding="utf16" if raw[:2]==bytes([255,254]) else "bom"):
                self.dependency()["digest"]["value"]=hashlib.sha256(raw).hexdigest()
                with self.assertRaises(ValueError):
                    self.check(raw=raw)

    def test_oversized_body_or_dependency_list_is_rejected(self):
        at_limit=self.approval+b" "*(131072-len(self.approval))
        self.dependency()["digest"]["value"]=hashlib.sha256(at_limit).hexdigest()
        self.assertEqual(self.check(raw=at_limit), "BYTE_INTEGRITY_MATCH")
        beyond_limit=at_limit+b" "
        self.dependency()["digest"]["value"]=hashlib.sha256(beyond_limit).hexdigest()
        with self.assertRaises(ValueError):
            self.check(raw=beyond_limit)
        self.dependency()["digest"]["value"]=PIN
        selected=copy.deepcopy(self.dependency())
        self.record["dependencies"]=[
            dict(copy.deepcopy(selected),dep_id=f"fixture:other:{i}")
            for i in range(127)]+[selected]
        self.assertEqual(self.check(), "BYTE_INTEGRITY_MATCH")
        self.record["dependencies"].append(
            dict(copy.deepcopy(selected),dep_id="fixture:other:127"))
        with self.assertRaises(ValueError):
            self.check()

if __name__ == "__main__":
    unittest.main()
