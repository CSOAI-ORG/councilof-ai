"""Tests for meok-sovereign-pqc-mcp."""
import os, tempfile
_TEST = tempfile.mkdtemp(prefix="sov_pqc_")
os.environ["SOV_PQC_KEY"] = _TEST + "/k.pem"
from meok_sovereign_pqc_mcp import (
    pqc_keygen, pqc_sign, pqc_verify, pqc_kem, pqc_status,
    _KEYSTORE, ALGORITHMS,
)


def reset():
    _KEYSTORE.clear()


def test_4_algorithms():
    assert len(ALGORITHMS) == 4


def test_2_quantum_safe():
    safe = [a for a, v in ALGORITHMS.items() if v["secure"]]
    assert len(safe) == 2
    assert "ml-dsa-65" in safe
    assert "ml-kem-768" in safe


def test_2_classical_legacy():
    legacy = [a for a, v in ALGORITHMS.items() if not v["secure"]]
    assert len(legacy) == 2


def test_pqc_keygen_ml_dsa():
    reset()
    r = pqc_keygen("ml-dsa-65")
    assert r["algorithm"] == "ml-dsa-65"
    assert r["kid"].startswith("pqc-") # _gen_kid("pqc") format
    assert r["secure"] is True


def test_pqc_keygen_ml_kem():
    reset()
    r = pqc_keygen("ml-kem-768")
    assert r["algorithm"] == "ml-kem-768"
    assert r["secure"] is True


def test_pqc_keygen_invalid():
    reset()
    r = pqc_keygen("fake-algo")
    assert "error" in r


def test_pqc_keygen_default():
    reset()
    r = pqc_keygen()
    assert r["algorithm"] == "ml-dsa-65"


def test_pqc_sign_basic():
    reset()
    kg = pqc_keygen("ml-dsa-65")
    r = pqc_sign("sovereign message", kid=kg["kid"])
    assert "signature" in r
    assert r["message_hash"] != ""


def test_pqc_sign_empty_message():
    reset()
    kg = pqc_keygen("ml-dsa-65")
    r = pqc_sign("", kid=kg["kid"])
    assert "error" in r


def test_pqc_sign_no_key():
    reset()
    r = pqc_sign("hello")
    assert "error" in r


def test_pqc_verify_valid():
    reset()
    kg = pqc_keygen("ml-dsa-65")
    s = pqc_sign("sovereign hello", kid=kg["kid"])
    v = pqc_verify("sovereign hello", s["signature"], kid=kg["kid"])
    assert v["valid"] is True


def test_pqc_verify_invalid_message():
    reset()
    kg = pqc_keygen("ml-dsa-65")
    s = pqc_sign("sovereign hello", kid=kg["kid"])
    v = pqc_verify("DIFFERENT message", s["signature"], kid=kg["kid"])
    assert v["valid"] is False


def test_pqc_verify_empty_args():
    reset()
    kg = pqc_keygen("ml-dsa-65")
    r = pqc_verify("", "", kid=kg["kid"])
    assert "error" in r


def test_pqc_kem_encapsulate():
    reset()
    kg = pqc_keygen("ml-kem-768")
    r = pqc_kem("encapsulate", kid=kg["kid"])
    assert "shared_secret" in r
    assert "ciphertext" in r


def test_pqc_kem_decapsulate():
    reset()
    kg = pqc_keygen("ml-kem-768")
    r = pqc_kem("decapsulate", kid=kg["kid"])
    assert "shared_secret" in r


def test_pqc_kem_invalid_action():
    reset()
    kg = pqc_keygen("ml-kem-768")
    r = pqc_kem("hack", kid=kg["kid"])
    assert "error" in r


def test_pqc_status():
    r = pqc_status()
    assert len(r["algorithms_supported"]) == 4
    assert len(r["quantum_safe"]) == 2


def test_no_external_deps():
    import meok_sovereign_pqc_mcp as m
    src = open(m.__file__).read()
    for blocked in ["ollama", "requests", "urllib.request", "httpx"]:
        assert f"import {blocked}" not in src


def test_signed_outputs():
    reset()
    kg = pqc_keygen("ml-dsa-65")
    for r in [pqc_status(), pqc_keygen("ml-kem-768"), pqc_sign("x", kid=kg["kid"])]:
        assert "sig_kid" in r and "sig" in r and "ts" in r


def test_algorithm_metadata():
    """Each algorithm has the required metadata."""
    for a, m in ALGORITHMS.items():
        assert "name" in m
        assert "type" in m
        assert "nist_level" in m
        assert "key_size_bytes" in m
        assert "secure" in m


def test_ml_dsa_65_is_quantum_safe():
    assert ALGORITHMS["ml-dsa-65"]["secure"] is True
    assert ALGORITHMS["ml-dsa-65"]["nist_level"] == 3


def test_rsa_is_not_quantum_safe():
    assert ALGORITHMS["rsa-2048"]["secure"] is False


def test_full_workflow():
    """keygen → sign → verify → kem → status."""
    reset()
    kg = pqc_keygen("ml-dsa-65")
    s = pqc_sign("sovereign", kid=kg["kid"])
    v = pqc_verify("sovereign", s["signature"], kid=kg["kid"])
    assert v["valid"] is True
    k = pqc_keygen("ml-kem-768")
    kem = pqc_kem("encapsulate", kid=k["kid"])
    assert "shared_secret" in kem
    st = pqc_status()
    assert st["keys_stored"] == 2
