# SPDX-License-Identifier: CC0-1.0
"""Tests for completion_record_verify.py — an independent Python signer, so the verifier is not
only ever checked against the issuer it ships with."""
from __future__ import annotations

import base64
import copy
import gzip
import hashlib
import json
import sys
import uuid
from pathlib import Path

import pytest

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
import completion_record_verify as crv  # noqa: E402

cryptography = pytest.importorskip("cryptography")
pytest.importorskip("jsonschema")
from cryptography.hazmat.primitives import serialization  # noqa: E402
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey  # noqa: E402

B58 = crv.B58
CTX = ["https://www.w3.org/ns/credentials/v2", "https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json"]
H = "c" * 64


def b58e(b: bytes) -> str:
    n = int.from_bytes(b, "big")
    s = ""
    while n:
        n, r = divmod(n, 58)
        s = B58[r] + s
    return "1" * (len(b) - len(b.lstrip(b"\0"))) + s


def keypair():
    sk = Ed25519PrivateKey.generate()
    raw = sk.public_key().public_bytes(serialization.Encoding.Raw, serialization.PublicFormat.Raw)
    did = "did:key:z" + b58e(b"\xed\x01" + raw)
    return sk, raw, did, f"{did}#{did[8:]}"


def sign(doc: dict, sk, vm: str) -> dict:
    d = copy.deepcopy(doc)
    d["proof"] = {"type": "DataIntegrityProof", "cryptosuite": "eddsa-jcs-2022", "created": "2026-09-28T14:00:00Z",
                  "verificationMethod": vm, "proofPurpose": "assertionMethod", "@context": d.get("@context")}
    if d["proof"]["@context"] is None:
        del d["proof"]["@context"]
    d["proof"]["proofValue"] = "z" + b58e(sk.sign(crv.hash_data(d)))
    return d


def record(did: str, **over) -> dict:
    r = {
        "@context": CTX, "id": f"urn:uuid:{uuid.uuid4()}", "type": ["VerifiableCredential", "OpenBadgeCredential"],
        "issuer": {"id": did, "type": ["Profile"], "name": "CSOAI Ltd (Council of AI)", "url": "https://councilof.ai/"},
        "validFrom": "2026-09-28T14:00:00Z", "name": "TEST Completion record: reproduced a published measurement",
        "description": "TEST RECORD.",
        "credentialSubject": {"id": "urn:csoai:pseudonym:" + "d" * 64, "type": ["AchievementSubject"], "achievement": {
            "id": "https://councilof.ai/academy/achievements/reproduced-measurement/v0.1", "type": ["Achievement"],
            "achievementType": "Assignment", "name": "Reproduced a published measurement", "description": "x",
            "criteria": {"narrative": "Completed means reproduced."}}},
        "evidence": [{"id": "https://councilof.ai/api/state", "type": ["Evidence"], "name": "Reproduced measurement",
                      "narrative": "x", "genre": "reproduced-measurement", "measurementRef": "https://councilof.ai/api/state",
                      "publishedResultSha256": H, "reproducedResultSha256": H, "reproductionMethod": "x",
                      "reproducedAt": "2026-09-28T14:00:00Z"}],
        "credentialStatus": {"id": "https://councilof.ai/academy/status/test-0.json#5", "type": "BitstringStatusListEntry",
                             "statusPurpose": "revocation", "statusListIndex": "5",
                             "statusListCredential": "https://councilof.ai/academy/status/test-0.json"},
        "credentialSchema": [
            {"id": "https://purl.imsglobal.org/spec/ob/v3p0/schema/json/ob_v3p0_achievementcredential_schema.json", "type": "1EdTechJsonSchemaValidator2019"},
            {"id": "https://councilof.ai/schemas/csoai-completion-record-0.1.schema.json", "type": "JsonSchema"}],
        "csoaiRecord": {"schema": "csoai.completion-record/0.1", "test": True, "free": True, "non_certification": True,
                        "non_promotion": True, "writes_board": False,
                        "completion_rule": "reproduced-measurement: publishedResultSha256 == reproducedResultSha256"},
    }
    r.update(over)
    return r


def status_list(did: str, revoked=()) -> dict:
    bits = bytearray(crv.MIN_BITS // 8)
    for i in revoked:
        bits[i >> 3] |= 0x80 >> (i & 7)
    enc = "u" + base64.urlsafe_b64encode(gzip.compress(bytes(bits))).decode().rstrip("=")
    url = "https://councilof.ai/academy/status/test-0.json"
    return {"@context": ["https://www.w3.org/ns/credentials/v2"], "id": url,
            "type": ["VerifiableCredential", "BitstringStatusListCredential"], "issuer": did,
            "validFrom": "2026-09-28T14:00:00Z",
            "credentialSubject": {"id": url + "#list", "type": "BitstringStatusList", "statusPurpose": "revocation", "encodedList": enc}}


@pytest.fixture()
def kit(tmp_path):
    sk, raw, did, vm = keypair()

    def write(rec: dict, revoked=()):
        (tmp_path / "r.json").write_text(json.dumps(rec))
        (tmp_path / "s.json").write_text(json.dumps(sign(status_list(did, revoked), sk, vm)))
        return str(tmp_path / "r.json"), str(tmp_path / "s.json")
    return sk, did, vm, write


def run(rec_path, sl_path, *extra):
    return crv.main([rec_path, "--status-list", sl_path, *extra])


def test_valid_test_record_passes_only_with_allow_test(kit):
    sk, did, vm, write = kit
    r, s = write(sign(record(did), sk, vm))
    assert run(r, s, "--allow-test", "--tamper-control") == 0
    assert run(r, s) == 3


def test_tampered_record_is_invalid(kit):
    sk, did, vm, write = kit
    rec = sign(record(did), sk, vm)
    rec["evidence"][0]["measurementRef"] = "https://councilof.ai/api/other"
    r, s = write(rec)
    assert run(r, s, "--allow-test") == 1


def test_not_reproduced_is_invalid_even_when_signed(kit):
    sk, did, vm, write = kit
    rec = record(did)
    rec["evidence"][0]["reproducedResultSha256"] = "e" * 64
    r, s = write(sign(rec, sk, vm))
    rep = crv.verify(json.loads(Path(r).read_text()), status_src=s)
    assert rep["proof"]["state"] == "VALID" and rep["completion"]["state"] == "NOT_REPRODUCED"
    assert run(r, s, "--allow-test") == 1


def test_revoked_bit(kit):
    sk, did, vm, write = kit
    r, s = write(sign(record(did), sk, vm), revoked=(5,))
    assert crv.verify(json.loads(Path(r).read_text()), status_src=s)["status"]["state"] == "REVOKED"
    assert run(r, s, "--allow-test") == 1


def test_identifying_subject_fails(kit):
    sk, did, vm, write = kit
    rec = record(did)
    rec["credentialSubject"]["email"] = "learner@example.com"
    r, s = write(sign(rec, sk, vm))
    rep = crv.verify(json.loads(Path(r).read_text()), status_src=s)
    assert rep["subject"]["state"] == "IDENTIFYING_FIELDS_PRESENT" and rep["shape"]["state"] == "INVALID"
    assert run(r, s, "--allow-test") == 1


def test_certificate_achievement_type_fails_profile(kit):
    sk, did, vm, write = kit
    rec = record(did)
    rec["credentialSubject"]["achievement"]["achievementType"] = "Certificate"
    r, s = write(sign(rec, sk, vm))
    assert run(r, s, "--allow-test") == 1


def test_did_key_test_issuer_must_be_marked_test(kit):
    sk, did, vm, write = kit
    rec = record(did, name="Completion record: reproduced a published measurement")
    rec["csoaiRecord"]["test"] = False
    r, s = write(sign(rec, sk, vm))
    assert crv.verify(json.loads(Path(r).read_text()), status_src=s)["shape"]["state"] == "INVALID"


def test_status_list_from_another_key_is_rejected(kit, tmp_path):
    sk, did, vm, write = kit
    r, _ = write(sign(record(did), sk, vm))
    sk2, _, did2, vm2 = keypair()
    forged = sign(status_list(did), sk2, vm2)  # claims our issuer, signed by someone else
    (tmp_path / "forged.json").write_text(json.dumps(forged))
    rep = crv.verify(json.loads(Path(r).read_text()), status_src=str(tmp_path / "forged.json"))
    assert rep["status"]["state"] in ("INVALID", "UNCHECKABLE")
    assert crv.exit_code(rep, allow_test=True) != 0


def test_did_web_issuer_resolves_from_did_document(tmp_path):
    sk, raw, _, _ = keypair()
    did_doc = {"id": "did:web:csoai.org", "verificationMethod": [{"id": "did:web:csoai.org#academy-test", "type": "JsonWebKey2020",
               "publicKeyJwk": {"kty": "OKP", "crv": "Ed25519", "x": base64.urlsafe_b64encode(raw).decode().rstrip("=")}}]}
    (tmp_path / "did.json").write_text(json.dumps(did_doc))
    vm = "did:web:csoai.org#academy-test"
    rec = sign(record("did:web:csoai.org"), sk, vm)
    sl = sign(status_list("did:web:csoai.org"), sk, vm)
    (tmp_path / "s.json").write_text(json.dumps(sl))
    rep = crv.verify(rec, did_src=str(tmp_path / "did.json"), status_src=str(tmp_path / "s.json"))
    assert rep["proof"]["state"] == "VALID" and rep["status"]["state"] == "NOT_REVOKED"


def test_jcs_refuses_floats():
    with pytest.raises(ValueError):
        crv.jcs({"x": 1.5})
    assert crv.jcs({"b": 1, "a": "é"}) == '{"a":"é","b":1}'.encode()
    assert hashlib.sha256(crv.jcs({})).hexdigest() == hashlib.sha256(b"{}").hexdigest()
