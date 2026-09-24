#!/usr/bin/env python3
"""make_test_vectors.py - regenerate public/spec/delegation-receipt/test-vectors/ byte-for-byte.

    python3 scripts/receipts/make_test_vectors.py            # write
    python3 scripts/receipts/make_test_vectors.py --check    # exit 1 if the committed files differ

TEST KEYS ONLY. Both keys are derived from published seeds (sha256 of a fixed label) and their
private halves are printed in test-vectors/test-keys.json. Anything they sign proves nothing.
They are never the board key and never appear in any DID document other than the test one here.
Ed25519 is deterministic, so the same inputs always give the same signatures.

Every reference inside the vectors (mandate ids, tx hashes, addresses, URLs under .example)
is fictional.
"""

from __future__ import annotations

import copy
import hashlib
import json
import sys
from pathlib import Path

from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey
from cryptography.hazmat.primitives.serialization import Encoding, PublicFormat

sys.path.insert(0, str(Path(__file__).resolve().parent))
from verify_receipt import content_id, preimage  # noqa: E402

REPO = Path(__file__).resolve().parents[2]
OUT = REPO / "public" / "spec" / "delegation-receipt" / "test-vectors"

TEST_DID = "did:web:test-vectors.example"
LABEL_A = "csoai delegation-receipt v0.1 TEST KEY A - never trust"
LABEL_B = "csoai delegation-receipt v0.1 TEST KEY B - never trust, deliberately NOT in the test DID document"
KID_A = f"{TEST_DID}#test-key-a"
KID_B = f"{TEST_DID}#test-key-b"
T = "2026-09-24T00:00:00Z"
PREIMAGE_RULE = "json.dumps(body, sort_keys=True, separators=(',', ':'), ensure_ascii=True).encode('utf-8')"


def h(label: str) -> str:
    return hashlib.sha256(label.encode()).hexdigest()


def key(label: str):
    sk = Ed25519PrivateKey.from_private_bytes(hashlib.sha256(label.encode()).digest())
    pk = sk.public_key().public_bytes(Encoding.Raw, PublicFormat.Raw)
    return sk, pk


def b64url(b: bytes) -> str:
    import base64

    return base64.urlsafe_b64encode(b).decode().rstrip("=")


def ev(party, kind, locator, what, sha=None):
    return {"party": party, "kind": kind, "locator": locator, "sha256": sha, "observed_at": T, "what_it_shows": what}


def ts(state, asserted_at=None, asserted_by=None, observed_at=None, observed_via=None):
    return {"state": state, "asserted_at": asserted_at, "asserted_by": asserted_by,
            "observed_at": observed_at, "observed_via": observed_via}


NOT_EVIDENCE_OF = [
    "the quality, correctness or fitness of the delivered work",
    "the identity of any natural person",
    "that the agent is safe, reliable or suitable for any other job",
    "revenue, or a buyer outside the recorder, unless payer_class is OUTSIDE and so evidenced",
    "that any signing key is still unrevoked at the time of reading",
]


def full_body() -> dict:
    """Vector 01: every section evidenced by a third party."""
    art = h("TEST artifact bytes 01")
    return {
        "schema": "csoai.delegation-receipt/0.1",
        "record_kind": "MEASUREMENT_RECORD",
        "recorded_at": T,
        "recorder": {"did": TEST_DID, "name": "TEST VECTOR recorder"},
        "job": {"ref": "test-job-01", "summary": "TEST VECTOR - fictional job: translate one document. Every reference in this record is fictional."},
        "principal": {
            "state": "EVIDENCED_BY_THIRD_PARTY",
            "kind": "AP2_MANDATE",
            "ref": "urn:example:ap2-mandate:test-01",
            "ref_sha256": h("TEST mandate bytes 01"),
            "evidence": [ev("THIRD_PARTY", "SIGNED_DOCUMENT", "https://credentials.example/mandates/test-01",
                            "mandate document, signed by a credential provider that is neither recorder nor agent, whose bytes hash to ref_sha256",
                            h("TEST mandate bytes 01"))],
        },
        "agent": {
            "state": "EVIDENCED_BY_THIRD_PARTY",
            "a2a_agent_card_url": "https://agent.example/.well-known/agent-card.json",
            "a2a_agent_card_sha256": h("TEST agent card bytes 01"),
            "card_observed_at": T,
            "erc8004": {"chain": "eip155:1", "identity_registry": "0x" + h("TEST registry")[:40], "agent_id": "4242"},
            "evidence": [
                ev("AGENT", "HTTP_BYTES", "https://agent.example/.well-known/agent-card.json",
                   "agent card bytes as served, hashing to a2a_agent_card_sha256", h("TEST agent card bytes 01")),
                ev("THIRD_PARTY", "CHAIN_RECORD", "eip155:1/erc8004-identity/4242",
                   "identity registry entry whose registration file points at the agent card URL"),
            ],
        },
        "payment": {
            "state": "EVIDENCED_BY_THIRD_PARTY",
            "kind": "X402",
            "network": "eip155:8453",
            "asset": "0x" + h("TEST asset")[:40],
            "amount_units": "10000",
            "pay_to": "0x" + h("TEST payTo")[:40],
            "tx_hash": "0x" + h("TEST tx 01"),
            "settlement_ref": None,
            "payer_class": {"value": "OUTSIDE", "state": "EVIDENCED_BY_THIRD_PARTY"},
            "evidence": [ev("THIRD_PARTY", "CHAIN_RECORD", "eip155:8453/tx/0x" + h("TEST tx 01"),
                            "successful transfer of amount_units of asset to pay_to from a wallet the recorder does not control")],
        },
        "delivery": {
            "state": "EVIDENCED_BY_THIRD_PARTY",
            "artifacts": [{"url": "https://store.example/objects/" + art, "sha256": art, "content_id": None, "observed_at": T}],
            "binding": "REFERENCED_IN_JOB",
            "evidence": [ev("THIRD_PARTY", "HTTP_BYTES", "https://store.example/objects/" + art,
                            "content-addressed store serving bytes that hash to the artifact sha256", art)],
        },
        "outcome_check": {
            "state": "EVIDENCED_BY_THIRD_PARTY",
            "result": "CHECKED",
            "checker_kind": "AUTOMATED",
            "checker_ref": "urn:example:checker:test",
            "check_id": "test-check-01",
            "method_url": "https://checker.example/methods/translation-spotcheck-v1",
            "finding": "method ran to completion; its own output is at the locator below",
            "evidence": [ev("THIRD_PARTY", "SIGNED_DOCUMENT", "https://checker.example/runs/test-check-01",
                            "checker's signed run record naming the artifact sha256", h("TEST check record 01"))],
        },
        "timestamps": {
            "requested": ts("EVIDENCED_BY_THIRD_PARTY", "2026-09-23T10:00:00Z", "PRINCIPAL", "2026-09-23T10:00:00Z", "mandate document issued_at"),
            "paid": ts("EVIDENCED_BY_THIRD_PARTY", "2026-09-23T10:00:05Z", "AGENT", "2026-09-23T10:00:07Z", "block timestamp of tx_hash"),
            "delivered": ts("EVIDENCED_BY_THIRD_PARTY", "2026-09-23T10:04:00Z", "AGENT", "2026-09-23T10:04:02Z", "store.example first-seen time for the artifact"),
            "checked": ts("EVIDENCED_BY_THIRD_PARTY", None, None, "2026-09-23T10:09:00Z", "checker run record completed_at"),
        },
        "not_evidence_of": NOT_EVIDENCE_OF,
        "notes": ["TEST VECTOR 01 - fully evidenced. Signed by TEST KEY A. Proves nothing about any real job."],
    }


def absent_principal_body() -> dict:
    b = full_body()
    b["job"]["ref"] = "test-job-02"
    b["principal"] = {"state": "ABSENT", "kind": "UNSTATED", "ref": None, "ref_sha256": None, "evidence": []}
    b["timestamps"]["requested"] = ts("ABSENT")
    b["notes"] = ["TEST VECTOR 02 - nobody's authorisation is on record. ABSENT is a finding, not an error."]
    return b


def unchecked_body() -> dict:
    b = full_body()
    b["job"]["ref"] = "test-job-03"
    b["outcome_check"] = {"state": "ABSENT", "result": "UNCHECKED", "checker_kind": "NONE", "checker_ref": None,
                          "check_id": None, "method_url": None, "finding": None, "evidence": []}
    b["timestamps"]["checked"] = ts("ABSENT")
    b["notes"] = ["TEST VECTOR 03 - paid and delivered, nobody checked the outcome. UNCHECKED is first-class."]
    return b


def sign(body: dict, label: str, kid: str) -> dict:
    sk, pk = key(label)
    return {"body": body, "id": content_id(body), "alg": "Ed25519", "preimage_rule": PREIMAGE_RULE,
            "signed": True, "kid": kid, "pubkey": pk.hex(), "signature": sk.sign(preimage(body)).hex()}


def build() -> dict[str, str]:
    files: dict[str, dict] = {}
    files["01-valid-fully-evidenced.json"] = sign(full_body(), LABEL_A, KID_A)
    files["02-valid-absent-principal.json"] = sign(absent_principal_body(), LABEL_A, KID_A)
    files["03-valid-unchecked-outcome.json"] = sign(unchecked_body(), LABEL_A, KID_A)

    t = copy.deepcopy(files["01-valid-fully-evidenced.json"])
    t["body"]["payment"]["amount_units"] = "1"  # altered after sealing; id and signature left as they were
    t["body"]["notes"] = ["TEST VECTOR 04 - body altered after sealing (amount_units). id and signature are the originals."]
    files["04-invalid-tampered-body.json"] = t

    b5 = full_body()
    b5["job"]["ref"] = "test-job-05"
    b5["notes"] = ["TEST VECTOR 05 - self-consistent signature by TEST KEY B, which the test DID document does not publish."]
    files["05-invalid-untrusted-signer.json"] = sign(b5, LABEL_B, KID_B)

    s = copy.deepcopy(files["01-valid-fully-evidenced.json"])
    sig = bytearray(bytes.fromhex(s["signature"]))
    sig[0] ^= 0x01
    s["signature"] = bytes(sig).hex()
    files["06-invalid-bad-signature.json"] = s  # body and id intact: ONLY the signature is wrong

    b7 = full_body()
    b7["job"]["ref"] = "test-job-07"
    b7["principal"]["state"] = "ABSENT"  # but ref and evidence still filled in
    b7["notes"] = ["TEST VECTOR 07 - principal marked ABSENT while a mandate reference is filled in."]
    files["07-invalid-incoherent-state.json"] = sign(b7, LABEL_A, KID_A)

    b8 = unchecked_body()
    b8["job"]["ref"] = "test-job-08"
    b8["notes"] = ["TEST VECTOR 08 - a well-formed record nobody has signed yet."]
    files["08-unsigned-record.json"] = {"body": b8, "id": content_id(b8), "alg": "Ed25519", "preimage_rule": PREIMAGE_RULE,
                                        "signed": False, "kid": None, "pubkey": None, "signature": None}

    b9 = full_body()
    b9["job"]["ref"] = "test-job-09"
    b9["outcome_check"]["checker_kind"] = "HUMAN_PSEUDONYMOUS"
    b9["outcome_check"]["checker_ref"] = "reviewer.name@mail.example"
    b9["notes"] = ["TEST VECTOR 09 - a human reviewer recorded by e-mail address instead of a pseudonymous reference."]
    files["09-invalid-personal-data.json"] = sign(b9, LABEL_A, KID_A)

    _, pk_a = key(LABEL_A)
    did_doc = {
        "@context": ["https://www.w3.org/ns/did/v1"],
        "id": TEST_DID,
        "_label": "TEST DID DOCUMENT for the delegation-receipt v0.1 test vectors. Publishes TEST KEY A only.",
        "verificationMethod": [{"id": KID_A, "type": "JsonWebKey2020", "controller": TEST_DID,
                                "publicKeyJwk": {"kty": "OKP", "crv": "Ed25519", "x": b64url(pk_a)}}],
        "assertionMethod": [KID_A],
    }
    sk_a, _ = key(LABEL_A)
    sk_b, pk_b = key(LABEL_B)
    keys = {
        "_label": "TEST KEYS - PUBLISHED ON PURPOSE. Anything signed by these keys proves nothing. Never the board key.",
        "derivation": "private_key = sha256(label.encode('utf-8')) used as the Ed25519 seed",
        "keys": [
            {"kid": KID_A, "label": LABEL_A, "private_seed_hex": hashlib.sha256(LABEL_A.encode()).hexdigest(), "public_hex": pk_a.hex(), "in_test_did_document": True},
            {"kid": KID_B, "label": LABEL_B, "private_seed_hex": hashlib.sha256(LABEL_B.encode()).hexdigest(), "public_hex": pk_b.hex(), "in_test_did_document": False},
        ],
    }
    del sk_a, sk_b
    manifest = {
        "schema": "csoai.delegation-receipt.test-vectors/0.1",
        "_label": "TEST VECTORS. Signed with TEST KEYS (test-keys.json). Verify with --did-doc test-did.json.",
        "trust_anchor": "test-did.json",
        "vectors": [
            {"file": "01-valid-fully-evidenced.json", "verdict": "VALID", "failures": []},
            {"file": "02-valid-absent-principal.json", "verdict": "VALID", "failures": []},
            {"file": "03-valid-unchecked-outcome.json", "verdict": "VALID", "failures": []},
            {"file": "04-invalid-tampered-body.json", "verdict": "INVALID", "failures": ["ID_MISMATCH", "BAD_SIGNATURE"]},
            {"file": "05-invalid-untrusted-signer.json", "verdict": "INVALID", "failures": ["UNTRUSTED_SIGNER"]},
            {"file": "06-invalid-bad-signature.json", "verdict": "INVALID", "failures": ["BAD_SIGNATURE"]},
            {"file": "07-invalid-incoherent-state.json", "verdict": "INVALID", "failures": ["INCOHERENT_EVIDENCE_STATE"]},
            {"file": "08-unsigned-record.json", "verdict": "UNSIGNED", "failures": []},
            {"file": "09-invalid-personal-data.json", "verdict": "INVALID", "failures": ["PERSONAL_DATA_SUSPECTED"]},
        ],
    }
    files["test-did.json"] = did_doc
    files["test-keys.json"] = keys
    files["manifest.json"] = manifest
    return {name: json.dumps(obj, indent=2, sort_keys=True, ensure_ascii=True) + "\n" for name, obj in files.items()}


def main() -> int:
    check = "--check" in sys.argv
    out = build()
    drift = []
    OUT.mkdir(parents=True, exist_ok=True)
    for name, text in out.items():
        p = OUT / name
        if check:
            if not p.exists() or p.read_text(encoding="utf-8") != text:
                drift.append(name)
        else:
            p.write_text(text, encoding="utf-8")
    if check:
        print("test vectors: " + ("DRIFT " + ", ".join(drift) if drift else f"{len(out)} files match the generator"))
        return 1 if drift else 0
    print(f"wrote {len(out)} files to {OUT}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
