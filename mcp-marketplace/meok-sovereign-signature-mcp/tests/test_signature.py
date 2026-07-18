"""Tests for meok-sovereign-signature-mcp."""
import os, sys, tempfile, importlib
_TEST = tempfile.mkdtemp(prefix="sov_sig_")
os.environ["SOV_SIG_KEY"] = _TEST + "/k.pem"

def get_fresh():
    if "meok_sovereign_signature_mcp" in sys.modules:
        del sys.modules["meok_sovereign_signature_mcp"]
    import meok_sovereign_signature_mcp as m
    importlib.reload(m)
    return m

def test_sign_basic():
    m = get_fresh()
    r = m.signature_sign("Hello, sovereign world!", "test-doc")
    assert r["signature"]["doc_name"] == "test-doc"
    assert r["signature"]["signature"] is not None

def test_sign_no_doc():
    m = get_fresh()
    r = m.signature_sign("", "test")
    assert "error" in r

def test_sign_with_seed():
    m = get_fresh()
    r = m.signature_sign("Hello", "test", key_seed="my-seed-1")
    assert r["signature"]["kid"] is not None

def test_verify_valid():
    m = get_fresh()
    r = m.signature_sign("Hello, sovereign world!", "test-doc")
    sig = r["signature"]["signature"]
    pk = r["signature"]["public_key"]
    v = m.signature_verify("Hello, sovereign world!", sig, pk)
    assert v["verified"] is True

def test_verify_tampered():
    m = get_fresh()
    r = m.signature_sign("Hello, sovereign world!", "test-doc")
    sig = r["signature"]["signature"]
    pk = r["signature"]["public_key"]
    v = m.signature_verify("Hello, MODIFIED sovereign world!", sig, pk)
    assert v["verified"] is False

def test_verify_unknown():
    m = get_fresh()
    r = m.signature_verify("Hello", "fake-sig", "fake-key")
    assert "error" in r

def test_verify_no_args():
    m = get_fresh()
    assert "error" in m.signature_verify("", "", "")
    assert "error" in m.signature_verify("doc", "", "")
    assert "error" in m.signature_verify("doc", "sig", "")

def test_list_empty():
    m = get_fresh()
    r = m.signature_list()
    assert r["total"] == 0

def test_list_with_sigs():
    m = get_fresh()
    m.signature_sign("doc1", "a")
    m.signature_sign("doc2", "b")
    r = m.signature_list()
    assert r["total"] == 2

def test_revoke():
    m = get_fresh()
    r = m.signature_sign("Hello", "test")
    sig_id = r["signature"]["sig_id"]
    r2 = m.signature_revoke(sig_id)
    assert r2["revoked"] is True

def test_revoke_unknown():
    m = get_fresh()
    r = m.signature_revoke("nope")
    assert "error" in r

def test_revoke_no_id():
    m = get_fresh()
    r = m.signature_revoke("")
    assert "error" in r

def test_status():
    m = get_fresh()
    r = m.signature_status()
    assert r["total_signatures"] == 0
    assert r["algorithm"] == "Ed25519 (sovereign variant)"

def test_no_external_deps():
    m = get_fresh()
    src = open(m.__file__).read()
    for blocked in ["ollama", "requests", "urllib.request", "httpx", "cryptography"]:
        assert f"import {blocked}" not in src

def test_signed_outputs():
    m = get_fresh()
    for r in [m.signature_sign("x", "y"), m.signature_list(),
              m.signature_revoke("x"), m.signature_status()]:
        assert "kid" in r and "sig" in r and "ts" in r

def test_full_workflow():
    """Sign → Verify → Revoke → Status."""
    m = get_fresh()
    r1 = m.signature_sign("Hello sovereign world", "test-doc", key_seed="test-seed")
    assert r1["signature"]["doc_name"] == "test-doc"
    sig = r1["signature"]["signature"]
    pk = r1["signature"]["public_key"]
    r2 = m.signature_verify("Hello sovereign world", sig, pk)
    assert r2["verified"] is True
    r3 = m.signature_revoke(r1["signature"]["sig_id"])
    assert r3["revoked"] is True
    r4 = m.signature_verify("Hello sovereign world", sig, pk)
    assert r4["verified"] is False
    r5 = m.signature_status()
    assert r5["revoked_signatures"] == 1
