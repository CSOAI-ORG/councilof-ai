"""Tests for meok-sovereign-secret-mcp (AES-256 sim + BFT)."""
import meok_sovereign_secret_mcp as s_mod
from meok_sovereign_secret_mcp import (
    secret_store, secret_get, secret_rotate,
    secret_list, secret_delete,
)


def reset_state():
    s_mod._SECRETS.clear()
    s_mod._METADATA.clear()
    s_mod._APPROVALS.clear()


def approve_get(sid):
    return [secret_get(sid, approver=a) for a in ["scribe", "shield", "lex"]]


def test_store_basic():
    reset_state()
    r = secret_store("db_password", "super-secret")
    assert r["stored"] is True
    assert r["name"] == "db_password"
    assert r["version"] == 1


def test_store_empty_name():
    r = secret_store("", "x")
    assert "error" in r


def test_store_empty_value():
    r = secret_store("name", "")
    assert "error" in r


def test_store_with_tags():
    reset_state()
    secret_store("api_key", "abc", tags=["prod", "us-east"])
    r = secret_list(tag="prod")
    assert r["count"] == 1


def test_aes_encryption_roundtrip():
    """Sanity: ciphertext != plaintext; decrypt reverses it."""
    reset_state()
    enc = s_mod._aes256_sim_encrypt("hello-world", "key1")
    assert enc["ciphertext"] != "hello-world"
    pt = s_mod._aes256_sim_decrypt(enc["ciphertext"], "key1")
    assert pt == "hello-world"


def test_get_requires_3_voters():
    reset_state()
    s = secret_store("pw", "secret")
    sid = s["secret_id"]
    r1 = secret_get(sid, approver="scribe")
    assert r1["decrypted"] is False
    assert r1["approvals"] == 1
    r2 = secret_get(sid, approver="shield")
    assert r2["decrypted"] is False
    r3 = secret_get(sid, approver="lex")
    assert r3["decrypted"] is True
    assert r3["value"] == "secret"


def test_get_unknown():
    r = secret_get("nope")
    assert "error" in r


def test_rotate_basic():
    reset_state()
    s = secret_store("pw", "old")
    sid = s["secret_id"]
    for approver in ["a", "b", "c"]:
        secret_rotate(sid, "new")
    # After rotation, fetch to verify
    for r in approve_get(sid):
        pass
    r = approve_get(sid)
    # Get back the decrypted value
    r1 = secret_get(sid, approver="scribe")
    assert r1["decrypted"] is False
    r2 = secret_get(sid, approver="shield")
    r3 = secret_get(sid, approver="lex")
    assert r3["value"] == "new"
    assert r3["version"] == 2


def test_rotate_unknown():
    r = secret_rotate("nope", "x")
    assert "error" in r


def test_rotate_requires_3_voters():
    reset_state()
    s = secret_store("pw", "v1")
    sid = s["secret_id"]
    r1 = secret_rotate(sid, "v2")
    assert r1["rotated"] is False
    r2 = secret_rotate(sid, "v2")
    assert r2["approvals"] == 2


def test_list_basic():
    reset_state()
    secret_store("a", "1")
    secret_store("b", "2")
    r = secret_list()
    assert r["count"] == 2


def test_list_by_tag():
    reset_state()
    secret_store("a", "1", tags=["prod"])
    secret_store("b", "2", tags=["staging"])
    r = secret_list(tag="prod")
    assert r["count"] == 1


def test_list_excludes_deleted():
    reset_state()
    s = secret_store("a", "1")
    sid = s["secret_id"]
    for approver in ["a", "b", "c"]:
        secret_delete(sid, approver)
    r = secret_list()
    assert r["count"] == 0
    r2 = secret_list(include_deleted=True)
    assert r2["count"] == 1


def test_delete_requires_3_voters():
    reset_state()
    s = secret_store("a", "1")
    sid = s["secret_id"]
    r1 = secret_delete(sid, "scribe")
    assert r1["deleted"] is False
    r2 = secret_delete(sid, "shield")
    assert r2["deleted"] is False
    r3 = secret_delete(sid, "lex")
    assert r3["deleted"] is True


def test_delete_unknown():
    r = secret_delete("nope", "scribe")
    assert "error" in r


def test_get_after_delete_blocked():
    reset_state()
    s = secret_store("a", "1")
    sid = s["secret_id"]
    for approver in ["a", "b", "c"]:
        secret_delete(sid, approver)
    r = secret_get(sid)
    assert "error" in r


def test_no_external_deps():
    src = open(s_mod.__file__).read()
    assert "import ollama" not in src
    assert "import urllib" not in src
    assert "import requests" not in src


def test_signed_outputs():
    reset_state()
    s = secret_store("a", "1")
    sid = s["secret_id"]
    for r in [
        secret_store("b", "2"),
        secret_list(),
        secret_get(sid, approver="a"),
        secret_rotate(sid, "new"),
        secret_delete(sid, "a"),
    ]:
        assert "kid" in r and "sig" in r and "ts" in r


def test_full_lifecycle():
    """Store → get → rotate → list → delete."""
    reset_state()
    s = secret_store("prod_db", "v1-password", tags=["prod"])
    sid = s["secret_id"]
    # Need exactly 3 voter calls; the 3rd call decrypts and returns the value.
    secret_get(sid, approver="scribe")
    secret_get(sid, approver="shield")
    r = secret_get(sid, approver="lex")
    assert r["value"] == "v1-password"
    # Rotate (3 voters)
    secret_rotate(sid, "v2-password")
    secret_rotate(sid, "v2-password")
    r3 = secret_rotate(sid, "v2-password")
    assert r3["rotated"] is True
    # Delete (3 voters)
    secret_delete(sid, "a")
    secret_delete(sid, "b")
    rdel = secret_delete(sid, "c")
    assert rdel["deleted"] is True
    lst = secret_list(include_deleted=False)
    assert lst["count"] == 0