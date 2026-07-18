"""Tests for meok-sovereign-certification-mcp."""
import os, tempfile
_TEST_DIR = tempfile.mkdtemp(prefix="sov_certmcp_test_")
os.environ["SOV_CERTMCP_KEY"] = os.path.join(_TEST_DIR, "key.pem")
import meok_sovereign_certification_mcp as c_mod
from meok_sovereign_certification_mcp import (
    cert_issue, cert_verify, cert_chain, cert_revoke, cert_status,
    _CERTS, _REVOKED, _ISSUER_KEY,
)


def reset_state():
    _CERTS.clear()
    _REVOKED.clear()


def test_issuer_key():
    assert _ISSUER_KEY == "did:csoai:csoai-org-001"


def test_cert_issue_valid():
    reset_state()
    r = cert_issue("did:csoai:user1", "course-1", "DORA 5-Pillar", 95.0, "Sarah Chen")
    assert r["issuer"] == _ISSUER_KEY
    assert r["credentialSubject"]["id"] == "did:csoai:user1"
    assert r["credentialSubject"]["name"] == "Sarah Chen"
    assert r["course_id"] == "course-1"
    assert r["score"] == 95.0
    assert r["grade"] == "A+"
    assert "VerifiableCredential" in r["type"]


def test_cert_issue_w3c_compliant():
    reset_state()
    r = cert_issue("did:csoai:user1", "course-1", "Test", 95.0, "Test User")
    assert r["@context"] == ["https://www.w3.org/2018/credentials/v1"]
    assert r["type"] == ["VerifiableCredential", "SovereignCertificate"]


def test_cert_issue_low_score():
    r = cert_issue("did:csoai:user1", "course-1", "Test", 50.0, "Test")
    assert "error" in r


def test_cert_verify_valid():
    reset_state()
    issued = cert_issue("did:csoai:user1", "course-1", "DORA", 95.0, "Sarah")
    cid = issued["id"].replace("urn:uuid:", "")
    r = cert_verify(cid)
    assert r["valid"] is True
    assert r["signature_valid"] is True
    assert r["status"] == "VALID"


def test_cert_verify_tampered():
    reset_state()
    issued = cert_issue("did:csoai:user1", "course-1", "DORA", 95.0, "Sarah")
    cid = issued["id"].replace("urn:uuid:", "")
    # Tamper
    _CERTS[cid]["score"] = 99.0
    r = cert_verify(cid)
    assert r["valid"] is False


def test_cert_verify_unknown():
    r = cert_verify("nonexistent")
    assert r["valid"] is False


def test_cert_revoke():
    reset_state()
    issued = cert_issue("did:csoai:user1", "course-1", "Test", 95.0, "Test")
    cid = issued["id"].replace("urn:uuid:", "")
    r = cert_revoke(cid, "dragon")
    assert r["revoked"] is True
    assert cid in _REVOKED


def test_cert_status_revoked():
    reset_state()
    issued = cert_issue("did:csoai:user1", "course-1", "Test", 95.0, "Test")
    cid = issued["id"].replace("urn:uuid:", "")
    cert_revoke(cid, "dragon")
    r = cert_status(cid)
    assert r["status"] == "REVOKED"


def test_cert_status_valid():
    reset_state()
    issued = cert_issue("did:csoai:user1", "course-1", "Test", 95.0, "Test")
    cid = issued["id"].replace("urn:uuid:", "")
    r = cert_status(cid)
    assert r["status"] == "VALID"


def test_cert_status_unknown():
    r = cert_status("nonexistent")
    assert "error" in r


def test_cert_chain_all():
    reset_state()
    cert_issue("did:csoai:user1", "c1", "DORA", 95.0, "User 1")
    cert_issue("did:csoai:user2", "c2", "HIPAA", 88.0, "User 2")
    r = cert_chain()
    assert r["count"] == 2


def test_cert_chain_filtered_by_issuer():
    reset_state()
    cert_issue("did:csoai:user1", "c1", "DORA", 95.0, "User 1")
    r = cert_chain(issuer=_ISSUER_KEY)
    assert r["count"] == 1
    r = cert_chain(issuer="did:csoai:other")
    assert r["count"] == 0


def test_no_external_deps():
    import meok_sovereign_certification_mcp as m
    src = open(m.__file__).read()
    assert "import ollama" not in src
    assert "import urllib" not in src
    assert "import requests" not in src


def test_signed_outputs():
    reset_state()
    issued = cert_issue("did:csoai:user1", "c1", "DORA", 95.0, "User")
    cid = issued["id"].replace("urn:uuid:", "")
    r1 = cert_verify(cid)
    assert "kid" in r1 and "sig" in r1 and "ts" in r1
    r2 = cert_chain()
    assert "kid" in r2 and "sig" in r2 and "ts" in r2
    r3 = cert_status(cid)
    assert "kid" in r3 and "sig" in r3 and "ts" in r3
    r4 = cert_revoke(cid, "dragon")
    assert "kid" in r4 and "sig" in r4 and "ts" in r4


def test_full_lifecycle():
    """Issue → verify → chain → revoke → status."""
    reset_state()
    issued = cert_issue("did:csoai:sarah", "dora-1", "DORA", 95.0, "Sarah Chen")
    cid = issued["id"].replace("urn:uuid:", "")
    # Verify
    v = cert_verify(cid)
    assert v["valid"] is True
    # Chain
    c = cert_chain()
    assert c["count"] == 1
    # Status
    s = cert_status(cid)
    assert s["status"] == "VALID"
    # Revoke
    r = cert_revoke(cid, "dragon")
    assert r["revoked"] is True
    # Status now revoked
    s2 = cert_status(cid)
    assert s2["status"] == "REVOKED"