#!/usr/bin/env python3
# SPDX-License-Identifier: Apache-2.0
"""Tests for the OpenShell declared-vs-observed adapter.  python3 test_adapter.py

Every fixture directory with an expected.json is run through the CLI; the result, the exit code,
the number of enforcer records parsed and every row must match. The must-fail fixtures must
return DIVERGENT. The control must return CONSISTENT on the same policy and enforcer records,
so a check that always says DIVERGENT cannot pass either.
"""
import json
import os
import re
import shutil
import subprocess
import sys
import tempfile
import unittest


def jload(p):
    with open(p, encoding="utf-8") as fh:
        return json.load(fh)


def jlines(p):
    with open(p, encoding="utf-8") as fh:
        return [json.loads(x) for x in fh if x.strip()]


def rbytes(p):
    with open(p, "rb") as fh:
        return fh.read()

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.abspath(os.path.join(HERE, "..", ".."))
RUN_MJS = os.path.join("public", "spec", "signed-receipts", "v1", "conformance", "run.mjs")
sys.path.insert(0, HERE)
import adapter as A  # noqa: E402

CASES = {
    "fixtures/must-fail-deny-declared-egress": ("policy.yaml", ["enforcer.ocsf.jsonl"], "witness.jsonl"),
    "fixtures/control-deny-held": ("policy.yaml", ["enforcer.ocsf.jsonl"], "witness.jsonl"),
    "fixtures/must-fail-file-syscall": ("policy.yaml", ["enforcer.log"], "witness.jsonl"),
    "fixtures/must-fail-landlock-degraded": ("policy.yaml", ["enforcer.log"], "witness.jsonl"),
    "capture-2026-09-28": ("policy.yaml", ["enforcer.log"], "witness.jsonl"),
}


def run_case(rel, out):
    d = os.path.join(HERE, rel)
    pol, logs, wit = CASES[rel]
    cmd = [sys.executable, os.path.join(HERE, "adapter.py"), "compare", "--policy", os.path.join(d, pol),
           "--witness", os.path.join(d, wit), "--out", out, "--issued-at", "2026-09-28T14:00:00Z"]
    for lg in logs:
        cmd += ["--enforcer-log", os.path.join(d, lg)]
    p = subprocess.run(cmd, capture_output=True, text=True)
    return p, jload(os.path.join(out, "rows.json")) if os.path.exists(os.path.join(out, "rows.json")) else None


def test_did():
    k = A.test_key()
    return {"@context": ["https://www.w3.org/ns/did/v1"], "id": A.TEST_ISSUER,
            "verificationMethod": [{"id": A.TEST_KID, "type": "JsonWebKey2020", "controller": A.TEST_ISSUER,
                                    "publicKeyHex": k.public_key().public_bytes_raw().hex()}]}


class Fixtures(unittest.TestCase):
    def check(self, rel):
        exp = jload(os.path.join(HERE, rel, "expected.json"))
        with tempfile.TemporaryDirectory() as out:
            p, rep = run_case(rel, out)
            self.assertEqual(p.returncode, exp["exit"], p.stdout + p.stderr)
            self.assertIsNotNone(rep)
            self.assertEqual(rep["summary"]["result"], exp["result"])
            self.assertEqual(rep["inputs"]["enforcer_records_parsed"], exp["enforcer_records_parsed"])
            self.assertEqual(len(rep["rows"]), len(exp["rows"]), json.dumps(rep["rows"], indent=1))
            for want, got in zip(exp["rows"], rep["rows"]):
                self.assertEqual(got["row"], want["row"])
                self.assertEqual(got["comparison"], want["comparison"], json.dumps(got, indent=1))
                self.assertEqual(got.get("code"), want.get("code"), json.dumps(got, indent=1))
                if "attempt_host" in want:
                    self.assertEqual(got["attempt"]["host"], want["attempt_host"])
            # receipts: one per row plus the run receipt, all VALID against the test DID document
            ref = A._interceptor()
            doc = test_did()
            rows = jlines(os.path.join(out, "receipts.jsonl"))
            run = jload(os.path.join(out, "run-receipt.json"))
            self.assertEqual(len(rows), len(exp["rows"]))
            self.assertEqual(run["claims"][0]["row_receipts"], [r["content_id"] for r in rows])
            self.assertEqual(run["claims"][0]["result"], exp["result"])
            for r in rows + [run]:
                self.assertEqual(ref.verify_receipt_result(r, resolve_did=lambda _d: doc)[0], "VALID")
                self.assertEqual(ref.verify_receipt_result(r)[0], "UNVERIFIABLE_KEY")
            t = json.loads(json.dumps(run))
            t["claims"][0]["result"] = "CONSISTENT" if exp["result"] != "CONSISTENT" else "DIVERGENT"
            self.assertEqual(ref.verify_receipt_result(t, resolve_did=lambda _d: doc)[0], "INVALID")
            return rep

    def test_must_fail_deny_declared_egress(self):
        self.check("fixtures/must-fail-deny-declared-egress")

    def test_control_is_consistent(self):
        self.check("fixtures/control-deny-held")

    def test_control_and_must_fail_differ_only_by_witness(self):
        a, b = (os.path.join(HERE, x) for x in ("fixtures/must-fail-deny-declared-egress", "fixtures/control-deny-held"))
        for f in ("policy.yaml", "enforcer.ocsf.jsonl"):
            self.assertEqual(rbytes(os.path.join(a, f)), rbytes(os.path.join(b, f)))

    def test_must_fail_file_syscall(self):
        self.check("fixtures/must-fail-file-syscall")

    def test_must_fail_landlock_degraded(self):
        self.check("fixtures/must-fail-landlock-degraded")

    def test_capture_2026_09_28(self):
        rep = self.check("capture-2026-09-28")
        div = [r for r in rep["rows"] if r["comparison"] == "DIVERGED"]
        self.assertEqual([r["attempt"]["host"] for r in div], ["example.com"])
        self.assertEqual(div[0]["declared"]["enforcement"], "audit")
        self.assertEqual(div[0]["enforcer"]["claim"], "ALLOWED")

    def test_without_witness_is_unmeasured(self):
        d = os.path.join(HERE, "fixtures/control-deny-held")
        with tempfile.TemporaryDirectory() as out:
            p = subprocess.run([sys.executable, os.path.join(HERE, "adapter.py"), "compare", "--policy",
                                os.path.join(d, "policy.yaml"), "--enforcer-log", os.path.join(d, "enforcer.ocsf.jsonl"),
                                "--out", out, "--issued-at", "2026-09-28T14:00:00Z"], capture_output=True, text=True)
            self.assertEqual(p.returncode, 3, p.stdout)
            rep = jload(os.path.join(out, "rows.json"))
            self.assertEqual(rep["summary"]["result"], "UNMEASURED")
            self.assertEqual({r["comparison"] for r in rep["rows"]}, {"SELF_REPORT_ONLY"})


class CommittedOutput(unittest.TestCase):
    """capture-2026-09-28/out/ is committed. It must be exactly what this adapter produces now."""
    ARGS = ["--enforcer-version", "0.1.2", "--subject", "urn:example:openshell-network-proxy:capture-2026-09-28",
            "--issued-at", "2026-09-28T13:43:00Z"]

    def test_committed_capture_output_is_reproducible(self):
        d = os.path.join(HERE, "capture-2026-09-28")
        with tempfile.TemporaryDirectory() as out:
            p = subprocess.run([sys.executable, os.path.join(HERE, "adapter.py"), "compare",
                                "--policy", os.path.join(d, "policy.yaml"), "--enforcer-log", os.path.join(d, "enforcer.log"),
                                "--witness", os.path.join(d, "witness.jsonl"), "--out", out] + self.ARGS,
                               capture_output=True, text=True, cwd=HERE)
            self.assertEqual(p.returncode, 1, p.stdout + p.stderr)
            for f in ("rows.json", "receipts.jsonl", "run-receipt.json"):
                self.assertEqual(rbytes(os.path.join(out, f)), rbytes(os.path.join(d, "out", f)),
                                 f"capture-2026-09-28/out/{f} is stale: regenerate it (see README)")

    @unittest.skipUnless(shutil.which("node") and os.path.exists(os.path.join(REPO, RUN_MJS)), "node or run.mjs not present")
    def test_js_verifier_agrees(self):
        """The repo's JavaScript verifier (WebCrypto Ed25519, its own RFC 8785) reaches the same results."""
        d = os.path.join(HERE, "capture-2026-09-28", "out")
        doc = test_did()
        recs = jlines(os.path.join(d, "receipts.jsonl")) + [jload(os.path.join(d, "run-receipt.json"))]
        cases = [{"id": f"row-{i}", "what": r["task_id"], "receipt": r, "did_documents": {A.TEST_ISSUER: doc},
                  "expected": "VALID", "reason_code": "KEY_RESOLVED"} for i, r in enumerate(recs)]
        t = json.loads(json.dumps(recs[-1]))
        t["claims"][0]["result"] = "CONSISTENT"
        cases.append({"id": "run-tampered", "what": "edited after signing", "receipt": t,
                      "did_documents": {A.TEST_ISSUER: doc}, "expected": "INVALID", "reason_code": "CONTENT_ID_MISMATCH"})
        cases.append({"id": "run-no-did", "what": "no DID document", "receipt": recs[-1], "did_documents": {},
                      "expected": "UNVERIFIABLE_KEY", "reason_code": "DID_UNRESOLVABLE"})
        with tempfile.NamedTemporaryFile("w", suffix=".json", delete=False) as fh:
            json.dump({"cases": cases, "interop": {"cases": []}}, fh)
        try:
            p = subprocess.run(["node", os.path.join(REPO, RUN_MJS), "--self", "--vectors", fh.name],
                               capture_output=True, text=True)
        finally:
            os.unlink(fh.name)
        self.assertEqual(p.returncode, 0, p.stdout + p.stderr)
        self.assertIn(f"core {len(cases)}/{len(cases)} PASS", p.stdout)


class Policy(unittest.TestCase):
    def _load(self, text):
        with tempfile.NamedTemporaryFile("w", suffix=".yaml", delete=False) as fh:
            fh.write(text)
        try:
            return A.load_policy(fh.name)
        finally:
            os.unlink(fh.name)

    def test_unknown_top_level_field_rejected(self):
        with self.assertRaises(A.PolicyError):
            self._load("version: 1\nnetwork_policy: {}\n")

    def test_duplicate_key_rejected(self):
        with self.assertRaises(A.PolicyError):
            self._load("version: 1\nnetwork_policies:\n  a: {binaries: []}\n  a: {binaries: []}\n")

    def test_version_must_be_1(self):
        with self.assertRaises(A.PolicyError):
            self._load("version: 2\n")

    def test_access_and_rules_exclusive(self):
        with self.assertRaises(A.PolicyError):
            self._load("version: 1\nnetwork_policies:\n  r:\n    endpoints:\n      - {host: a.example, port: 443, "
                       "protocol: rest, access: full, rules: []}\n    binaries: [{path: /usr/bin/curl}]\n")


class Matchers(unittest.TestCase):
    def test_globs(self):
        g = A.glob_match
        self.assertTrue(g("/**", "/", "/"))                      # observed: deny rule `/**` refused GET / (capture)
        self.assertFalse(g("/repos/**", "/repos", "/"))          # documented: needs at least one segment
        self.assertTrue(g("/repos/**", "/repos/a/b", "/"))
        self.assertTrue(g("/repos/*/x", "/repos/a/x", "/"))
        self.assertFalse(g("/repos/*/x", "/repos/a/b/x", "/"))
        self.assertTrue(A.host_match("**.example.com", "a.b.example.com"))
        self.assertFalse(A.host_match("*.example.com", "a.b.example.com"))
        self.assertTrue(A.host_match("API.Example.com", "api.example.com"))
        self.assertTrue(g("**secret**", "mysecretfile", "/"))    # `**` next to text acts as `*`

    def test_l7_presets(self):
        doc = {"version": 1, "network_policies": {"r": {"endpoints": [
            {"host": "api.example", "port": 443, "protocol": "rest", "enforcement": "enforce", "access": "read-only"}],
            "binaries": [{"path": "/usr/bin/curl"}]}}}
        D = A.Declared(doc)
        self.assertEqual(D.http("api.example", 443, "GET", "/x", "/usr/bin/curl")["effect"], A.PERMITTED)
        self.assertEqual(D.http("api.example", 443, "POST", "/x", "/usr/bin/curl")["effect"], A.DENIED)
        self.assertEqual(D.http("api.example", 443, "GET", "/x", "/usr/bin/wget")["effect"], A.DENIED)
        self.assertEqual(D.network("169.254.169.254", 80)["effect"], A.DENIED)
        self.assertEqual(D.network("api.example", 6443, "/usr/bin/curl")["effect"], A.DENIED)


class Codes(unittest.TestCase):
    def test_provider_rule_is_named(self):
        """A `_provider_*` rule is not in the policy file; its traffic is named as such, not as an enforcer fault."""
        line = "2026-09-28T12:00:00.000Z OCSF NET:OPEN [INFO] ALLOWED /usr/bin/gh(7) -> api.github.com:443 [policy:_provider_github engine:opa]"
        rec = A.parse_shorthand(line, "x.log", 1)
        rows = A.compare({"version": 1}, [rec], [])
        self.assertEqual([(r["comparison"], r.get("code")) for r in rows], [("DIVERGED", "PROVIDER_RULE_OUTSIDE_POLICY_FILE")])

    def test_cli_form_of_shorthand_parses(self):
        line = ("[1775014132.690] [sandbox] [OCSF ] [ocsf] NET:OPEN [MED] DENIED /usr/bin/curl(64) -> httpbin.org:443 "
                "[policy:- engine:opa] [reason:no matching policy]")
        rec = A.parse_shorthand(line, "cli", 1)
        self.assertEqual((rec["kind"], rec["action"], rec["host"], rec["port"], rec["reason"]),
                         ("net", "DENIED", "httpbin.org", 443, "no matching policy"))


class Hygiene(unittest.TestCase):
    ALLOWED = re.compile(r"github\.com/NVIDIA/OpenShell|repos/NVIDIA/OpenShell|NVIDIA/OpenShell|"
                         r"published by NVIDIA|not an NVIDIA integration", re.I)

    def test_vendor_name_only_in_factual_contexts(self):
        bad = []
        for root, _dirs, files in os.walk(HERE):
            for f in files:
                if f == "test_adapter.py" or not f.endswith((".md", ".py", ".yaml", ".json", ".jsonl", ".log", ".txt")):
                    continue
                p = os.path.join(root, f)
                with open(p, encoding="utf-8", errors="replace") as fh:
                    for i, line in enumerate(fh, 1):
                        if re.search(r"nvidia", line, re.I) and not self.ALLOWED.search(line):
                            bad.append(f"{os.path.relpath(p, HERE)}:{i}: {line.strip()[:120]}")
        self.assertEqual(bad, [])

    def test_no_decision_shaped_keys_in_receipt_claims(self):
        with tempfile.TemporaryDirectory() as out:
            run_case("capture-2026-09-28", out)
            run = jload(os.path.join(out, "run-receipt.json"))
            rows = jlines(os.path.join(out, "receipts.jsonl"))
        keys = {"decision", "verdict", "allow", "hold", "reject", "admission", "admit", "approved", "approval"}
        values = {"ALLOW", "HOLD", "REJECT", "DENY", "APPROVE", "APPROVED", "ADMIT", "ADMITTED"}

        def walk(o):
            if isinstance(o, dict):
                for k, v in o.items():
                    self.assertNotIn(k.lower(), keys)
                    walk(v)
            elif isinstance(o, list):
                for v in o:
                    walk(v)
            elif isinstance(o, str):
                self.assertNotIn(o.strip().upper(), values)
        for r in rows + [run]:
            walk(r["claims"])


if __name__ == "__main__":
    unittest.main(verbosity=2)
