"""Tests for meok-sovereign-secrets-mcp."""
import os, sys, tempfile, importlib
_TEST = tempfile.mkdtemp(prefix="sov_sec_")
os.environ["SOV_SEC_KEY"] = _TEST + "/k.pem"

def get_fresh():
    if "meok_sovereign_secrets_mcp" in sys.modules:
        del sys.modules["meok_sovereign_secrets_mcp"]
    import meok_sovereign_secrets_mcp as m
    importlib.reload(m)
    return m

def test_put():
    m = get_fresh()
    r = m.secrets_put("api-key", "secret-value-123")
    assert r["secret_name"] == "api-key"

def test_put_no_name():
    m = get_fresh()
    r = m.secrets_put("", "value")
    assert "error" in r

def test_put_no_value():
    m = get_fresh()
    r = m.secrets_put("name", "")
    assert "error" in r

def test_get():
    m = get_fresh()
    m.secrets_put("api-key", "secret-value-123")
    r = m.secrets_get("api-key")
    assert r["value"] == "secret-value-123"

def test_get_no_name():
    m = get_fresh()
    r = m.secrets_get("")
    assert "error" in r

def test_get_unknown():
    m = get_fresh()
    r = m.secrets_get("nope")
    assert "error" in r

def test_encrypted_at_rest():
    m = get_fresh()
    m.secrets_put("api-key", "plaintext-secret")
    # The stored value should NOT contain plaintext
    stored = m._SECRETS["api-key"]
    assert "plaintext-secret" not in stored["ciphertext"]

def test_rotate():
    m = get_fresh()
    m.secrets_put("api-key", "value1")
    r = m.secrets_rotate("api-key")
    assert r["version"] == 2

def test_rotate_no_name():
    m = get_fresh()
    r = m.secrets_rotate("")
    assert "error" in r

def test_rotate_unknown():
    m = get_fresh()
    r = m.secrets_rotate("nope")
    assert "error" in r

def test_get_after_rotate():
    m = get_fresh()
    m.secrets_put("api-key", "value1")
    m.secrets_rotate("api-key")
    r = m.secrets_get("api-key")
    assert r["value"] == "value1"

def test_list():
    m = get_fresh()
    m.secrets_put("a", "v1")
    m.secrets_put("b", "v2")
    r = m.secrets_list()
    assert r["total"] == 2

def test_list_empty():
    m = get_fresh()
    r = m.secrets_list()
    assert r["total"] == 0

def test_status():
    m = get_fresh()
    m.secrets_put("a", "v1")
    r = m.secrets_status()
    assert r["total_secrets"] == 1
    assert r["rotation_interval_days"] == 90

def test_no_external_deps():
    m = get_fresh()
    src = open(m.__file__).read()
    for blocked in ["ollama", "requests", "urllib.request", "httpx"]:
        assert f"import {blocked}" not in src

def test_signed_outputs():
    m = get_fresh()
    m.secrets_put("x", "y")
    for r in [m.secrets_get("x"), m.secrets_rotate("x"),
              m.secrets_list(), m.secrets_status()]:
        assert "kid" in r and "sig" in r and "ts" in r

def test_full_workflow():
    """Put → Get → Rotate → Get → List → Status."""
    m = get_fresh()
    m.secrets_put("api-key", "original-secret")
    r1 = m.secrets_get("api-key")
    assert r1["value"] == "original-secret"
    r2 = m.secrets_rotate("api-key")
    assert r2["version"] == 2
    r3 = m.secrets_get("api-key")
    assert r3["value"] == "original-secret"  # Same value, new key
    r4 = m.secrets_list()
    assert r4["total"] == 1
    s = m.secrets_status()
    assert s["total_secrets"] == 1
