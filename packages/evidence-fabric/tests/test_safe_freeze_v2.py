"""SAFE freeze signature regressions; never execute or edit the frozen verifier."""
import copy
import hashlib
import importlib.util
import json
import os
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[3]
PACK = ROOT / "docs/standards/osaia-safe-evidence-pack"
EXPECTED = {
    "FREEZE.json": "855164ee8402f81281ea214226e1e3bc2a5ba808d35430347d9ce4d8d128ecd9",
    "FREEZE.signed.json": "1a4384163d821958a5dba05da0d659b9949eb45cdf99a0f9fb3c07d5661e29c4",
    "did.json": "9fad541cbe0ab29e246e77e8ff8fff37fd5183b509ac877612309687fc848ead",
}
DEEP = (b'{"schema":"csoai.safe-evidence-pack/0.1","deep":'
        + b"[" * 2000 + b"0" + b"]" * 2000 + b"}\n")


def encode(value):
    return json.dumps(value, sort_keys=True, separators=(",", ":"),
                      ensure_ascii=False).encode("utf-8")


class SafeFreezeV2Regression(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.raw = {name: (PACK / name).read_bytes() for name in EXPECTED}
        for name, expected in EXPECTED.items():
            if hashlib.sha256(cls.raw[name]).hexdigest() != expected:
                raise AssertionError("Frozen fixture changed: " + name)
        path = ROOT / "packages/evidence-fabric/safe_freeze_v2.py"
        spec = importlib.util.spec_from_file_location("safe_freeze_v2_regression", path)
        if spec is None or spec.loader is None:
            raise AssertionError("External consumer cannot be loaded")
        module = importlib.util.module_from_spec(spec)
        sys.modules[spec.name] = module
        spec.loader.exec_module(module)
        cls.verify = staticmethod(module.check_signature)
        cls.kid = json.loads(cls.raw["FREEZE.signed.json"])["signature"]["did"]

    @classmethod
    def tearDownClass(cls):
        for name, expected in EXPECTED.items():
            if hashlib.sha256((PACK / name).read_bytes()).hexdigest() != expected:
                raise AssertionError("Test altered frozen fixture: " + name)

    def fresh(self):
        signed = json.loads(self.raw["FREEZE.signed.json"])
        did = json.loads(self.raw["did.json"])
        method = next(m for m in did["verificationMethod"] if m["id"] == self.kid)
        return signed, did, method

    def check(self, expected, freeze, signed=None, did=None):
        actual, reason = self.verify(freeze, signed, did)
        self.assertIs(actual, expected, reason)
        self.assertIsInstance(reason, str)
        self.assertTrue(reason.strip())
        return reason

    def test_real_signature_has_no_authenticated_issuer_claim(self):
        reason = self.check(True, self.raw["FREEZE.json"],
                            self.raw["FREEZE.signed.json"], self.raw["did.json"])
        self.assertIn("SELF_CONSISTENT_UNAUTHENTICATED_KEY", reason)

    def test_identity_authorization_and_declarations(self):
        wrong = "did:web:wrong-issuer.invalid#board-attestation-1"
        cases = [
            ("wrong_signature_issuer", lambda s, d, m: s["signature"].update(did=wrong)),
            ("assertion_removed", lambda s, d, m: d.update(assertionMethod=[])),
            ("wrong_DID_identity", lambda s, d, m: d.update(id="did:web:wrong-issuer.invalid")),
            ("wrong_controller", lambda s, d, m: m.update(controller="did:web:wrong-issuer.invalid")),
            ("wrong_algorithm", lambda s, d, m: s["signature"].update(alg="ES256")),
            ("wrong_full_method_same_fragment", lambda s, d, m: m.update(id=wrong)),
            ("duplicate_method", lambda s, d, m: d["verificationMethod"].append(copy.deepcopy(m))),
            ("duplicate_assertion", lambda s, d, m: d["assertionMethod"].append(self.kid)),
            ("unsupported_JWK_curve", lambda s, d, m: m["publicKeyJwk"].update(crv="X25519")),
            ("unsupported_JWK_alg", lambda s, d, m: m["publicKeyJwk"].update(alg="ES256")),
            ("unsupported_canonical", lambda s, d, m: s["signature"].update(canonical="JCS")),
            ("unsupported_family", lambda s, d, m: s.update(schema="csoai.signed-run/99")),
            ("missing_algorithm", lambda s, d, m: s["signature"].pop("alg")),
            ("missing_canonical", lambda s, d, m: s["signature"].pop("canonical")),
        ]
        for name, mutate in cases:
            with self.subTest(control=name):
                signed, did, method = self.fresh()
                mutate(signed, did, method)
                self.check(False, self.raw["FREEZE.json"], encode(signed), encode(did))

    def test_coherent_unsigned_issuer_rename_cannot_rebind_signed_signer(self):
        signed, did, _ = self.fresh()
        original_signer = signed["payload"]["signer"]
        old, new = did["id"], "did:web:wrong-issuer.invalid"
        did["id"] = new
        for method in did["verificationMethod"]:
            method["id"] = method["id"].replace(old, new, 1)
            method["controller"] = method["controller"].replace(old, new, 1)
        did["assertionMethod"] = [v.replace(old, new, 1) for v in did["assertionMethod"]]
        signed["signature"]["did"] = self.kid.replace(old, new, 1)
        self.assertEqual(signed["payload"]["signer"], original_signer)
        self.check(False, self.raw["FREEZE.json"], encode(signed), encode(did))

    def test_corrupt_signature_and_changed_preimages(self):
        signed, did, _ = self.fresh()
        signature = signed["signature"]["sig_ed25519"]
        signed["signature"]["sig_ed25519"] = ("0" if signature[0] != "0" else "1") + signature[1:]
        self.check(False, self.raw["FREEZE.json"], encode(signed), encode(did))
        self.check(False, self.raw["FREEZE.json"] + b" ",
                   self.raw["FREEZE.signed.json"], self.raw["did.json"])
        signed, did, _ = self.fresh()
        signed["payload"]["what"] += " changed"
        signed["signature"]["payload_sha256"] = hashlib.sha256(encode(signed["payload"])).hexdigest()
        self.check(False, self.raw["FREEZE.json"], encode(signed), encode(did))

    def test_duplicate_json_keys_cannot_use_last_value_wins(self):
        for name, key in (("FREEZE.signed.json", "schema"), ("did.json", "id")):
            with self.subTest(input=name):
                raw = self.raw[name]
                duplicate = ('{"%s":"wrong",' % key).encode() + raw.lstrip()[1:]
                args = [self.raw[n] for n in ("FREEZE.json", "FREEZE.signed.json", "did.json")]
                args[1 if name == "FREEZE.signed.json" else 2] = duplicate
                self.check(False, *args)

    def test_absent_is_distinct_from_null_and_malformed(self):
        freeze, signed, did = [self.raw[n] for n in ("FREEZE.json", "FREEZE.signed.json", "did.json")]
        for args in ((freeze, None, did), (freeze, signed, None), (freeze, None, None)):
            with self.subTest(absent=[i for i, v in enumerate(args) if v is None]):
                self.assertIn("NOT_PRESENT", self.check(None, *args))
        for index in range(3):
            for invalid in (b"null", b"[]", b"{", DEEP):
                with self.subTest(input=index, invalid=invalid[:12]):
                    args = [freeze, signed, did]
                    args[index] = invalid
                    self.check(False, *args)

    def test_actual_installed_console(self):
        console = os.environ.get("CSOAI_EVIDENCE_CONSOLE")
        if not console:
            self.skipTest("Installed CLI unverified: set CSOAI_EVIDENCE_CONSOLE")
        self.assertTrue(Path(console).is_absolute() and Path(console).is_file())
        env = os.environ.copy()
        env.pop("PYTHONPATH", None)
        common = [str(PACK / "FREEZE.json"), "--signed", str(PACK / "FREEZE.signed.json"),
                  "--did", str(PACK / "did.json")]
        with tempfile.TemporaryDirectory(prefix="safe-freeze-cli-") as directory:
            temporary = Path(directory)
            signed, _, _ = self.fresh()
            sig = signed["signature"]["sig_ed25519"]
            signed["signature"]["sig_ed25519"] = ("0" if sig[0] != "0" else "1") + sig[1:]
            corrupt = temporary / "corrupt.json"
            corrupt.write_bytes(encode(signed))
            deep = temporary / "deep.json"
            deep.write_bytes(DEEP)
            invalid = common.copy()
            invalid[2] = str(corrupt)
            nested = common.copy()
            nested[0] = str(deep)
            cases = [
                ("valid", common, 0, True),
                ("corrupt", invalid, 1, False),
                ("deep", nested, 1, False),
                ("unsigned", [common[0]], 3, None),
                ("missing_DID", common[:3], 3, None),
                ("read_error", [str(temporary / "absent.json")], 2, "diagnostic"),
                ("usage", [], 2, "text"),
            ]
            for name, args, code, state in cases:
                with self.subTest(console=name):
                    result = subprocess.run([console, "verify-safe-freeze", *args],
                                            cwd=directory, env=env, text=True,
                                            capture_output=True, timeout=30)
                    self.assertEqual(result.returncode, code, result.stderr + result.stdout)
                    if state != "text":
                        output = json.loads(result.stdout)
                        self.assertIsNone(output["issuer_authenticated"])
                        if state == "diagnostic":
                            self.assertIn(output["signature_valid"], (False, None))
                        else:
                            self.assertIs(output["signature_valid"], state)
                        if state is True:
                            self.assertIn("SELF_CONSISTENT_UNAUTHENTICATED_KEY", json.dumps(output))
            help_result = subprocess.run([console, "verify-safe-freeze", "--help"],
                                         cwd=directory, env=env, text=True,
                                         capture_output=True, timeout=30)
            self.assertEqual(help_result.returncode, 0, help_result.stderr)


if __name__ == "__main__":
    unittest.main()
