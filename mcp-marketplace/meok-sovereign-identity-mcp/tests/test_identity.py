"""Tests for meok-sovereign-identity-mcp (W3C DID + JWT)."""
import os, tempfile
_TEST_DIR = tempfile.mkdtemp(prefix="sov_id_test_")
os.environ["SOV_ID_KEY"] = os.path.join(_TEST_DIR, "key.pem")
from meok_sovereign_identity_mcp import (
    identity_create, identity_resolve, identity_sign_jwt,
    identity_verify_jwt, identity_list,
    _DIDS,
)


def reset_dids():
    _DIDS.clear()


def test_create_did():
    reset_dids()
    r = identity_create("csoai-org-001", controller="did:csoai:csoai-org-001")
    assert r["id"].startswith("did:csoai:")
    assert r["controller"] == "did:csoai:csoai-org-001"
    assert len(r["verification_method"]) == 1


def test_resolve_existing():
    reset_dids()
    r1 = identity_create("test")
    did = r1["id"]
    r2 = identity_resolve(did)
    assert r2["id"] == did


def test_resolve_unknown():
    r = identity_resolve("did:csoai:unknown")
    assert "error" in r


def test_sign_jwt():
    reset_dids()
    r1 = identity_create("test")
    did = r1["id"]
    r2 = identity_sign_jwt(did, {"scope": "read", "sub": "user-123"})
    assert "token" in r2
    parts = r2["token"].split(".")
    assert len(parts) == 3


def test_verify_valid_jwt():
    reset_dids()
    r1 = identity_create("test")
    did = r1["id"]
    r2 = identity_sign_jwt(did, {"scope": "read", "sub": "user-123"})
    r3 = identity_verify_jwt(r2["token"])
    assert r3["valid"] is True


def test_verify_invalid_jwt():
    r = identity_verify_jwt("invalid.token.here")
    assert r["valid"] is False


def test_verify_tampered_jwt():
    reset_dids()
    r1 = identity_create("test")
    did = r1["id"]
    r2 = identity_sign_jwt(did, {"scope": "read"})
    # Tamper with payload
    parts = r2["token"].split(".")
    tampered = parts[0] + "." + parts[1] + "." + parts[2][:-2] + "AA"
    r3 = identity_verify_jwt(tampered)
    assert r3["valid"] is False


def test_jwt_has_iat_exp():
    reset_dids()
    r1 = identity_create("test")
    did = r1["id"]
    r2 = identity_sign_jwt(did, {"scope": "read"})
    assert r2["payload"]["iss"] == did
    assert "iat" in r2["payload"]
    assert "exp" in r2["payload"]
    assert r2["payload"]["exp"] > r2["payload"]["iat"]


def test_jwt_expiry():
    """An expired JWT should fail verification."""
    reset_dids()
    r1 = identity_create("test")
    did = r1["id"]
    r2 = identity_sign_jwt(did, {"scope": "read"}, expires_in_seconds=-1)  # Already expired
    r3 = identity_verify_jwt(r2["token"])
    assert r3["valid"] is False
    assert r3["expired"] is True


def test_jwt_unknown_issuer():
    """JWT with unknown issuer should fail."""
    # Create a JWT with a fake DID
    fake_token = "eyJhbGciOiJFZDI1NTEifQ.eyJpc3MiOiJkaWQ6Y3NvYWk6ZmFrZSJ9.fakesig"
    r = identity_verify_jwt(fake_token)
    assert r["valid"] is False


def test_list_identities():
    reset_dids()
    identity_create("user1")
    identity_create("user2")
    r = identity_list()
    assert r["count"] == 2


def test_list_empty():
    reset_dids()
    r = identity_list()
    assert r["count"] == 0


def test_no_external_deps():
    import meok_sovereign_identity_mcp as m
    src = open(m.__file__).read()
    assert "import ollama" not in src
    assert "import urllib" not in src
    assert "import requests" not in src


def test_signed_outputs():
    reset_dids()
    r1 = identity_create("test")
    assert "kid" in r1 and "sig" in r1 and "ts" in r1
    r2 = identity_resolve(r1["id"])
    assert "kid" in r2 and "sig" in r2 and "ts" in r2
    r3 = identity_sign_jwt(r1["id"], {"scope": "read"})
    assert "kid" in r3 and "sig" in r3 and "ts" in r3
    r4 = identity_verify_jwt(r3["token"])
    assert "kid" in r4 and "sig" in r4 and "ts" in r4
    r5 = identity_list()
    assert "kid" in r5 and "sig" in r5 and "ts" in r5


def test_full_lifecycle():
    """Create → sign → verify."""
    reset_dids()
    r1 = identity_create("user1", role="general")
    did = r1["id"]
    r2 = identity_sign_jwt(did, {"scope": "execute", "sub": "user1"})
    assert r2["payload"]["scope"] == "execute"
    r3 = identity_verify_jwt(r2["token"])
    assert r3["valid"] is True
    assert r3["did"] == did