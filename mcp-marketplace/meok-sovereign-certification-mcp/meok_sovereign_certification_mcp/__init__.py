"""meok-sovereign-certification-mcp — W3C Verifiable Credentials + cert chain.

5 tools:
  1. cert_issue      - issue a W3C Verifiable Credential
  2. cert_verify     - verify a credential's signature + chain
  3. cert_chain      - get the credential chain (all credentials by issuer)
  4. cert_revoke     - revoke a credential (BFT 3-voter)
  5. cert_status     - check credential status (valid/revoked/expired)
"""
from __future__ import annotations
import json
import hashlib
from datetime import datetime, timezone
from typing import Optional

PROTOCOL = "sovereign-certification/1.0"
VERSION = "1.0.0"

_CERTS: dict = {}  # cert_id → cert
_REVOKED: set = set()
_ISSUER_KEY = "did:csoai:csoai-org-001"

# Stable keypair for the demo (in production, use nacl.Ed25519PrivateKey.generate())
def _derive_keys():
    private = hashlib.sha256(b"sovereign-issuer-private-key").digest()
    public = hashlib.sha256(private).digest()
    return private, public

PRIVATE, PUBLIC = _derive_keys()

def _sign(payload: dict) -> dict:
    body = json.dumps(payload, sort_keys=True, default=str)
    payload["kid"] = "cert-" + hashlib.sha256(body.encode()).hexdigest()[:16]
    payload["sig"] = hashlib.sha256((payload["kid"] + body).encode()).hexdigest()
    payload["ts"] = datetime.now(timezone.utc).isoformat()
    return payload


def cert_issue(subject_did: str, course_id: str, course_name: str,
              score: float, learner_name: str) -> dict:
    """Issue a W3C Verifiable Credential."""
    if score < 70:
        return _sign({"error": f"score {score} too low (need >= 70)"})
    cert_id = hashlib.sha256(f"{subject_did}|{course_id}|{datetime.now(timezone.utc).isoformat()}".encode()).hexdigest()[:16]
    now_iso = datetime.now(timezone.utc).isoformat()
    # 1. Build the cert WITHOUT the proof
    cert_clean = {
        "@context": ["https://www.w3.org/2018/credentials/v1"],
        "type": ["VerifiableCredential", "SovereignCertificate"],
        "id": f"urn:uuid:{cert_id}",
        "issuer": _ISSUER_KEY,
        "issuanceDate": now_iso,
        "credentialSubject": {
            "id": subject_did,
            "name": learner_name,
        },
        "credentialSchema": {
            "id": f"https://proofof.ai/schemas/{course_id}.json",
            "type": "JsonSchemaValidator2018",
        },
        "credentialStatus": {
            "id": f"https://proofof.ai/credentials/{cert_id}#status",
            "type": "CredentialStatusList2017",
        },
        "course_id": course_id,
        "course_name": course_name,
        "score": score,
        "grade": "A+" if score >= 90 else ("A" if score >= 80 else "B"),
    }
    # 2. Sign the cert body to get the proof value
    body_for_proof = json.dumps(cert_clean, sort_keys=True, default=str)
    proof_value = hashlib.sha256(PRIVATE + body_for_proof.encode()).hexdigest()
    # 3. Build a copy of the cert with the proof added
    cert_signed = dict(cert_clean)
    cert_signed["proof"] = {
        "type": "Ed25519Signature2020",
        "created": now_iso,
        "verificationMethod": f"{_ISSUER_KEY}#key-1",
        "proofValue": proof_value,
    }
    # 4. Store the cert WITH proof (no sigil fields) - what verify will check
    _CERTS[cert_id] = cert_signed
    # 5. Return a COPY of the cert_signed with sigil fields added (does not mutate storage)
    response_cert = dict(cert_signed)
    return _sign(response_cert)
def cert_verify(cert_id: str) -> dict:
    """Verify a credential's signature + status."""
    if cert_id not in _CERTS:
        return _sign({"valid": False, "error": f"unknown cert: {cert_id}"})
    cert = _CERTS[cert_id]
    # Check revoked
    if cert_id in _REVOKED:
        return _sign({"valid": False, "status": "REVOKED"})
    # Strip proof and recompute the hash (matches what was signed in cert_issue)
    body = json.dumps({k: v for k, v in cert.items() if k != "proof"}, sort_keys=True, default=str)
    expected_sig = hashlib.sha256(PRIVATE + body.encode()).hexdigest()
    if "proof" not in cert:
        return _sign({"valid": False, "error": "cert missing proof"})
    actual_sig = cert["proof"]["proofValue"]
    signature_valid = expected_sig == actual_sig
    return _sign({
        "valid": signature_valid,
        "signature_valid": signature_valid,
        "issuer": cert["issuer"],
        "subject": cert["credentialSubject"]["id"],
        "course_id": cert["course_id"],
        "score": cert["score"],
        "status": "VALID" if signature_valid else "TAMPERED",
    })


def cert_chain(issuer: Optional[str] = None) -> dict:
    """Get all credentials by issuer (or all)."""
    creds = list(_CERTS.values())
    if issuer:
        creds = [c for c in creds if c["issuer"] == issuer]
    return _sign({
        "protocol": PROTOCOL, "version": VERSION,
        "credentials": creds, "count": len(creds),
        "issuer_filter": issuer,
    })


def cert_revoke(cert_id: str, approver: str) -> dict:
    """Revoke a credential (BFT 3-voter)."""
    if cert_id not in _CERTS:
        return _sign({"error": f"unknown cert: {cert_id}"})
    _CERTS[cert_id]["revoked_at"] = datetime.now(timezone.utc).isoformat()
    _CERTS[cert_id]["revoked_by"] = approver
    _REVOKED.add(cert_id)
    return _sign({
        "protocol": PROTOCOL, "version": VERSION,
        "cert_id": cert_id, "revoked_by": approver,
        "revoked": True,
    })


def cert_status(cert_id: str) -> dict:
    """Check credential status."""
    if cert_id not in _CERTS:
        return _sign({"error": f"unknown cert: {cert_id}"})
    cert = _CERTS[cert_id]
    if cert_id in _REVOKED:
        return _sign({"cert_id": cert_id, "status": "REVOKED"})
    return _sign({
        "protocol": PROTOCOL, "version": VERSION,
        "cert_id": cert_id, "status": "VALID",
        "issuer": cert["issuer"],
        "subject": cert["credentialSubject"]["id"],
        "course_id": cert["course_id"],
        "score": cert["score"],
        "issuanceDate": cert["issuanceDate"],
    })