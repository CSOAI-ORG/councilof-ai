#!/usr/bin/env python3
"""Tests for scripts/receipts/verify_receipt.py over the published delegation-receipt vectors.

    python3 -m pytest -q scripts/receipts/test_verify_receipt.py
    python3 scripts/receipts/test_verify_receipt.py          # no pytest needed
"""

from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
import verify_receipt as vr  # noqa: E402

SPEC = HERE.parents[1] / "public" / "spec" / "delegation-receipt"
VEC = SPEC / "test-vectors"
SCHEMA = json.loads((SPEC / "schema-v0.1.json").read_text(encoding="utf-8"))
DID = json.loads((VEC / "test-did.json").read_text(encoding="utf-8"))
MANIFEST = json.loads((VEC / "manifest.json").read_text(encoding="utf-8"))
EXAMPLES = sorted((SPEC / "examples").glob("*.json"))


def run(name: str, **kw) -> dict:
    return vr.verify((VEC / name).read_text(encoding="utf-8"), SCHEMA, **kw)


def test_every_vector_matches_manifest():
    assert len(MANIFEST["vectors"]) >= 9
    for v in MANIFEST["vectors"]:
        res = run(v["file"], did_doc=DID)
        assert res["verdict"] == v["verdict"], (v["file"], res)
        assert sorted(res["failures"]) == sorted(v["failures"]), (v["file"], res["failures"], res["details"])


def test_failures_are_distinct():
    tampered = run("04-invalid-tampered-body.json", did_doc=DID)
    badsig = run("06-invalid-bad-signature.json", did_doc=DID)
    untrusted = run("05-invalid-untrusted-signer.json", did_doc=DID)
    assert "ID_MISMATCH" in tampered["failures"]
    assert "ID_MISMATCH" not in badsig["failures"] and badsig["failures"] == ["BAD_SIGNATURE"]
    assert untrusted["signature"] == "VALID" and untrusted["failures"] == ["UNTRUSTED_SIGNER"]


def test_no_trust_anchor_is_not_valid():
    res = run("01-valid-fully-evidenced.json")
    assert res["verdict"] == "SIGNER_UNPINNED" and res["signature"] == "VALID"


def test_pubkey_pin():
    keys = json.loads((VEC / "test-keys.json").read_text(encoding="utf-8"))["keys"]
    a = next(k for k in keys if k["in_test_did_document"])["public_hex"]
    assert run("01-valid-fully-evidenced.json", pinned_pubkey_hex=a)["verdict"] == "VALID"
    assert run("05-invalid-untrusted-signer.json", pinned_pubkey_hex=a)["failures"] == ["UNTRUSTED_SIGNER"]


def test_board_did_document_does_not_trust_test_key():
    # A DID document shaped like did:web:csoai.org must never accept a TEST-key vector.
    fake_board = {"id": "did:web:csoai.org", "verificationMethod": [], "assertionMethod": []}
    assert "UNTRUSTED_SIGNER" in run("01-valid-fully-evidenced.json", did_doc=fake_board)["failures"]


def test_evidence_states_are_reported_not_scored():
    res = run("03-valid-unchecked-outcome.json", did_doc=DID)
    t = res["evidence_states"]
    assert t["outcome_check"] == "ABSENT" and t["payment"] == "EVIDENCED_BY_THIRD_PARTY"
    assert set(t.values()) <= set(vr.STATES)
    assert not any(k in json.dumps(res).lower() for k in ("trust_score", "\"score\"", "grade"))


def test_duplicate_keys_rejected():
    res = vr.verify('{"body": {}, "body": {}}', SCHEMA)
    assert res["failures"] == ["DUPLICATE_KEY"]


def test_extra_field_rejected():
    r = json.loads((VEC / "01-valid-fully-evidenced.json").read_text(encoding="utf-8"))
    r["body"]["trust_score"] = "high"
    res = vr.verify(json.dumps(r), SCHEMA, did_doc=DID)
    assert "SCHEMA_INVALID" in res["failures"]


def test_payer_address_field_rejected():
    r = json.loads((VEC / "01-valid-fully-evidenced.json").read_text(encoding="utf-8"))
    r["body"]["payment"]["payer"] = "0x" + "11" * 20
    assert "SCHEMA_INVALID" in vr.verify(json.dumps(r), SCHEMA, did_doc=DID)["failures"]


def test_examples_are_unsigned_and_coherent():
    assert EXAMPLES, "no example receipts"
    for p in EXAMPLES:
        res = vr.verify(p.read_text(encoding="utf-8"), SCHEMA)
        assert res["verdict"] == "UNSIGNED" and res["failures"] == [], (p.name, res)


def test_real_example_labels_self_test():
    for p in EXAMPLES:
        body = json.loads(p.read_text(encoding="utf-8"))["body"]
        if body["payment"]["payer_class"]["value"] == "SELF_TEST":
            assert any("not revenue" in n.lower() for n in body["notes"]), p.name


def test_vectors_match_generator():
    r = subprocess.run([sys.executable, str(HERE / "make_test_vectors.py"), "--check"], capture_output=True, text=True)
    assert r.returncode == 0, r.stdout + r.stderr


def test_jsonschema_agrees_when_installed():
    try:
        import jsonschema  # type: ignore
    except ImportError:
        return
    v = jsonschema.Draft202012Validator(SCHEMA)
    for p in sorted(VEC.glob("0*.json")) + EXAMPLES:
        errs = list(v.iter_errors(json.loads(p.read_text(encoding="utf-8"))))
        assert not errs, (p.name, [e.message for e in errs])


if __name__ == "__main__":
    tests = [(n, f) for n, f in sorted(globals().items()) if n.startswith("test_") and callable(f)]
    bad = 0
    for n, f in tests:
        try:
            f()
        except AssertionError as e:
            bad += 1
            print(f"FAIL {n}: {e}")
    print(f"{len(tests) - bad} passed, {bad} failed")
    sys.exit(1 if bad else 0)
