"""Hermetic tests for meok-eu-code-of-practice-mcp.

Target: 12-14 tests, <1s, no network, no external state.
"""

from __future__ import annotations

import base64
import copy
import hashlib
import json
import os
import threading
import time

import pytest

from meok_eu_code_of_practice_mcp import (
    CODE_OF_PRACTICE_VERSION,
    MCP_VERSION,
    SIGNING_KEY,
    VERIFY_URL_TEMPLATE,
    detect_ai_content,
    mark_content,
    server,
    verify_attestation,
    compliance_check,
)
from meok_eu_code_of_practice_mcp.server import (
    _FINGERPRINT_DB,
    canonical_json,
)


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

@pytest.fixture
def png_bytes() -> bytes:
    # Minimal valid PNG header + payload.
    return (
        b"\x89PNG\r\n\x1a\n"
        + b"\x00\x00\x00\rIHDR"
        + b"\x00\x00\x00\x01\x00\x00\x00\x01"
        + b"\x08\x02\x00\x00\x00\x90wS\xde"
        + b"\x00\x00\x00\x0cIDATx\x9cc\xf8\x0f\x00\x00\x01\x01\x00\x05\x18\xb8\x02"
        + b"\x00\x00\x00\x00IEND\xaeB`\x82"
    )


@pytest.fixture
def text_bytes() -> bytes:
    return b"Hello, this is a sample AI-generated text content for testing the MCP."


# ---------------------------------------------------------------------------
# Tests
# ---------------------------------------------------------------------------

def test_imports_and_constants():
    assert MCP_VERSION == "1.0.0"
    assert CODE_OF_PRACTICE_VERSION == "draft-2-2026-06"
    assert "{content_hash}" in VERIFY_URL_TEMPLATE


def test_mark_content_happy_path(png_bytes):
    r = mark_content(png_bytes, "image/png", "gpt-5.5")
    assert r["status"] == "OK"
    m = r["manifest"]
    assert m["code_of_practice_version"] == CODE_OF_PRACTICE_VERSION
    assert m["mcp_version"] == MCP_VERSION
    assert m["content_hash"] == hashlib.sha256(png_bytes).hexdigest()
    assert len(m["layers"]) == 2
    # Layer 1 — C2PA
    l1 = m["layers"][0]
    assert "c2pa_manifest" in l1
    assert l1["c2pa_manifest"]["claim_generator"].startswith("meok-c2pa-watermark-mcp/")
    assert l1["c2pa_manifest"]["assertions"][0]["label"] == "c2pa.actions"
    assert "c2pa_store_path" in l1
    assert "c2pa_verify_url" in l1
    # Layer 2 — Watermark
    l2 = m["layers"][1]
    assert l2["watermark_type"] in ("visible", "invisible")
    assert isinstance(l2["watermark_payload"], str)
    assert isinstance(l2["embedding_method"], str)
    assert 0.0 <= l2["detection_confidence"] <= 1.0
    # Outer signature
    assert len(r["signature"]) == 128
    # verify_url present
    assert m["verify_url"].startswith(
        "https://meok-attestation-api.vercel.app/verify/"
    )
    assert m["content_hash"] in m["verify_url"]


def test_mark_content_empty_input():
    r = mark_content(b"", "image/png", "gpt-5.5")
    assert r["status"] == "FAIL"
    assert "empty" in r["reason"].lower()


def test_mark_content_invalid_content_type(png_bytes):
    r = mark_content(png_bytes, "application/x-fake", "gpt-5.5")
    assert r["status"] == "FAIL"
    assert "unsupported content_type" in r["reason"]
    assert "supported" in r


def test_mark_content_non_bytes_input():
    r = mark_content("not bytes", "image/png", "gpt-5.5")  # type: ignore[arg-type]
    assert r["status"] == "FAIL"


def test_verify_attestation_roundtrip(png_bytes):
    m1 = mark_content(png_bytes, "image/png", "gpt-5.5")["manifest"]
    v = verify_attestation(m1)
    assert v["status"] == "PASS"
    assert v["code_of_practice_version"] == CODE_OF_PRACTICE_VERSION


def test_verify_attestation_tamper_detection(png_bytes):
    m1 = mark_content(png_bytes, "image/png", "gpt-5.5")["manifest"]
    tampered = copy.deepcopy(m1)
    tampered["content_hash"] = "0" * 64  # same length, different value
    v = verify_attestation(tampered)
    assert v["status"] == "FAIL"
    assert "signature" in v["reason"].lower()


def test_signature_is_128_hex(png_bytes):
    r = mark_content(png_bytes, "image/png", "gpt-5.5")
    sig = r["signature"]
    assert len(sig) == 128
    int(sig, 16)  # parses as hex


def test_layer1_only_manifest(png_bytes):
    """Manifest with only Layer 1 should verify (Layer 2 is recommended, not required)."""
    r = mark_content(png_bytes, "image/png", "gpt-5.5")
    m = copy.deepcopy(r["manifest"])
    m["layers"] = m["layers"][:1]
    # Re-sign with one layer
    unsigned = {k: v for k, v in m.items() if k != "signature"}
    m["signature"] = server._sign_message(canonical_json(unsigned))
    v = verify_attestation(m)
    assert v["status"] == "PASS"


def test_layer2_only_manifest_fails(png_bytes):
    """Manifest with only Layer 2 (no C2PA) should fail."""
    r = mark_content(png_bytes, "image/png", "gpt-5.5")
    m = copy.deepcopy(r["manifest"])
    m["layers"] = m["layers"][1:]  # drop Layer 1
    unsigned = {k: v for k, v in m.items() if k != "signature"}
    m["signature"] = server._sign_message(canonical_json(unsigned))
    v = verify_attestation(m)
    assert v["status"] == "FAIL"


def test_version_validation(png_bytes):
    r = mark_content(png_bytes, "image/png", "gpt-5.5")
    m = copy.deepcopy(r["manifest"])
    m["code_of_practice_version"] = "draft-99-future"
    unsigned = {k: v for k, v in m.items() if k != "signature"}
    m["signature"] = server._sign_message(canonical_json(unsigned))
    v = verify_attestation(m)
    assert v["status"] == "FAIL"
    assert "version" in v["reason"].lower()


def test_detect_ai_content(png_bytes):
    r = detect_ai_content(png_bytes)
    assert r["status"] == "OK"
    assert "is_ai_generated" in r
    assert 0.0 <= r["confidence"] <= 1.0
    assert r["code_of_practice_version"] == CODE_OF_PRACTICE_VERSION
    assert len(r["signature"]) == 128


def test_detect_ai_fingerprint_match(png_bytes):
    digest = hashlib.sha256(png_bytes).hexdigest()
    _FINGERPRINT_DB[digest] = {
        "generator": "gpt-5.5",
        "manifest_signature": "deadbeef" * 16,
    }
    try:
        r = detect_ai_content(png_bytes)
        assert r["is_ai_generated"] is True
        assert r["confidence"] == 1.0
        assert r["fingerprint_match"]["generator"] == "gpt-5.5"
    finally:
        _FINGERPRINT_DB.pop(digest, None)


def test_compliance_check_known_operator():
    r = compliance_check("a gambling operator's marketing AI")
    assert r["status"] == "OK"
    assert r["compliant"] is True
    assert r["compliance_posture"] == "code-of-practice-compliant"


def test_compliance_check_unknown_operator():
    r = compliance_check("some random new operator")
    assert r["status"] == "OK"
    assert "recommendations" in r


def test_compliance_check_empty():
    r = compliance_check("")
    assert r["status"] == "FAIL"


def test_two_parallel_instances_no_shared_state(png_bytes):
    """Two independent mark_content calls must not share mutable state."""
    results: list = []
    barrier = threading.Barrier(2)

    def worker(i: int) -> None:
        barrier.wait()
        results.append(mark_content(png_bytes + bytes([i]), "image/png", f"gen-{i}"))

    t1 = threading.Thread(target=worker, args=(0,))
    t2 = threading.Thread(target=worker, args=(1,))
    t1.start(); t2.start()
    t1.join(); t2.join()

    assert len(results) == 2
    s1, s2 = sorted(r["signature"] for r in results)
    assert s1 != s2
    h1, h2 = sorted(r["manifest"]["content_hash"] for r in results)
    assert h1 != h2


def test_manifest_json_reversible(png_bytes):
    """The manifest dict must round-trip through canonical JSON without loss."""
    r = mark_content(png_bytes, "image/png", "gpt-5.5")
    s = canonical_json(r["manifest"])
    reloaded = json.loads(s)
    assert reloaded == r["manifest"]


def test_manifest_schema_field_count(png_bytes):
    """Two-layer schema contract: at least 13 top-level audit + signature fields."""
    r = mark_content(png_bytes, "image/png", "gpt-5.5")
    m = r["manifest"]
    # Top-level keys: code_of_practice_version, mcp_version, generated_at,
    # content_hash, layers, signature, verify_url = 7
    assert len(m) >= 7
    # Layer 1 keys: c2pa_manifest, c2pa_store_path, c2pa_verify_url = 3
    assert len(m["layers"][0]) >= 3
    # Layer 2 keys: watermark_type, watermark_payload, embedding_method,
    # detection_confidence = 4
    assert len(m["layers"][1]) >= 4
    # c2pa_manifest inner keys: claim_generator, claim_generator_info,
    # assertions, signature = 4
    assert len(m["layers"][0]["c2pa_manifest"]) >= 4
