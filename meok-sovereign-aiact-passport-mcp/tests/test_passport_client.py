"""Tests for the PassportClient — focused on validation, no network."""

import pytest
from sovereign_aiact_passport.passport_client import (
    PassportClient,
    SUPPORTED_FRAMEWORKS,
    REPORT_ID_PATTERN,
    canonical_body_for_sig,
    report_id_from_url,
    decode_sig_b64,
    VerificationError,
)
from sovereign_aiact_passport.error_map import (
    ValidationError,
    NetworkError,
)


# ────────────────────────────────────────────────────────────────────
# Schema validation
# ────────────────────────────────────────────────────────────────────


def test_system_id_required():
    p = PassportClient()
    with pytest.raises(ValidationError):
        p._validate_inputs("", "EU_AI_ACT", [])


def test_system_id_too_long_rejected():
    p = PassportClient()
    with pytest.raises(ValidationError):
        p._validate_inputs("x" * 201, "EU_AI_ACT", [])


def test_system_id_disallowed_chars_rejected():
    p = PassportClient()
    with pytest.raises(ValidationError):
        p._validate_inputs("has spaces", "EU_AI_ACT", [])


def test_system_id_with_special_chars_allowed():
    p = PassportClient()
    # Allowed: letters, digits, . _ - @ :
    p._validate_inputs("acme-pay:v1.2@dougs-mac", "EU_AI_ACT", [])


def test_framework_must_be_canonical():
    p = PassportClient()
    with pytest.raises(ValidationError):
        p._validate_inputs("acme", "FOO_FRAMEWORK", [])


def test_framework_accepts_all_canonical():
    p = PassportClient()
    for fw in SUPPORTED_FRAMEWORKS:
        p._validate_inputs("acme", fw, [])


def test_claimed_controls_must_be_list():
    p = PassportClient()
    with pytest.raises(ValidationError):
        p._validate_inputs("acme", "EU_AI_ACT", "not a list")  # type: ignore[arg-type]


def test_claimed_controls_each_must_be_string():
    p = PassportClient()
    with pytest.raises(ValidationError):
        p._validate_inputs("acme", "EU_AI_ACT", ["valid", 123, "ok"])  # type: ignore[list-item]  # intentional — we WANT the type error from the validator


def test_claimed_controls_can_be_empty():
    p = PassportClient()
    # Empty is OK (everything becomes a gap)
    p._validate_inputs("acme", "EU_AI_ACT", [])


# ────────────────────────────────────────────────────────────────────
# Report ID validation
# ────────────────────────────────────────────────────────────────────


def test_report_id_pattern_valid():
    assert REPORT_ID_PATTERN.fullmatch("7f54374a9836282a")


def test_report_id_pattern_rejects_short():
    assert not REPORT_ID_PATTERN.fullmatch("7f54374a983628")


def test_report_id_pattern_rejects_uppercase():
    assert not REPORT_ID_PATTERN.fullmatch("7F54374A9836282A")


def test_report_id_pattern_rejects_non_hex():
    assert not REPORT_ID_PATTERN.fullmatch("7f54374g9836282z")


# ────────────────────────────────────────────────────────────────────
# Canonical JSON
# ────────────────────────────────────────────────────────────────────


def test_canonical_body_for_sig_sorts_keys():
    body = {"z": 1, "a": 2}
    b1 = canonical_body_for_sig(body)
    b2 = canonical_body_for_sig({"a": 2, "z": 1})
    assert b1 == b2


def test_canonical_body_for_sig_handles_nested():
    body = {"outer": {"z": 1, "a": 2}}
    canonical = canonical_body_for_sig(body).decode("utf-8")
    # Recursive sort — outer key before inner
    assert canonical == '{"outer":{"a":2,"z":1}}'


def test_canonical_body_for_sig_returns_bytes():
    body = {"a": 1}
    out = canonical_body_for_sig(body)
    assert isinstance(out, bytes)


# ────────────────────────────────────────────────────────────────────
# Report ID extraction from verify URL
# ────────────────────────────────────────────────────────────────────


def test_report_id_from_url_extracts():
    url = "https://csoai-org-v2.vercel.app/verify?id=7f54374a9836282a"
    assert report_id_from_url(url) == "7f54374a9836282a"


def test_report_id_from_url_returns_none_for_no_id():
    url = "https://csoai-org-v2.vercel.app/verify"
    assert report_id_from_url(url) is None


def test_report_id_from_url_handles_none():
    assert report_id_from_url(None) is None  # type: ignore[arg-type]
    assert report_id_from_url(123) is None  # type: ignore[arg-type]  # both intentional — we WANT function to return None on non-str


# ────────────────────────────────────────────────────────────────────
# Signature decoding
# ────────────────────────────────────────────────────────────────────


def test_decode_sig_b64_valid_64byte_sig():
    import base64
    sig = base64.b64encode(b"x" * 64).decode("ascii")
    assert len(decode_sig_b64(sig)) == 64


def test_decode_sig_b64_short_sig_rejected():
    import base64
    sig = base64.b64encode(b"x" * 32).decode("ascii")
    with pytest.raises(ValidationError):
        decode_sig_b64(sig)


def test_decode_sig_b64_rejects_invalid_base64():
    with pytest.raises(ValidationError):
        decode_sig_b64("not!base64!at!all")


def test_decode_sig_b64_rejects_non_string():
    with pytest.raises(ValidationError):
        decode_sig_b64(12345)  # type: ignore[arg-type]


# ────────────────────────────────────────────────────────────────────
# Sync context manager enforcement
# ────────────────────────────────────────────────────────────────────


def test_sync_calls_require_context_manager():
    p = PassportClient()
    with pytest.raises(NetworkError):
        p.issue_passport_sync(
            system_id="acme",
            framework="EU_AI_ACT",
            claimed_controls=[],
        )


def test_list_active_passports_sync_requires_context_manager():
    p = PassportClient()
    with pytest.raises(NetworkError):
        p.list_active_passports_sync(tenant_id="acme-compliance")


# ────────────────────────────────────────────────────────────────────
# Headers
# ────────────────────────────────────────────────────────────────────


def test_headers_default_no_auth():
    p = PassportClient()
    h = p._headers()
    assert "Authorization" not in h
    assert "Content-Type" in h
    assert h["Content-Type"] == "application/json"


def test_headers_with_api_key():
    p = PassportClient(api_key="test-key-123")
    h = p._headers()
    assert h["Authorization"] == "Bearer test-key-123"


def test_headers_with_tenant_id():
    p = PassportClient(tenant_id="acme-compliance-2026")
    h = p._headers()
    assert h["X-Sov-Tenant"] == "acme-compliance-2026"


# ────────────────────────────────────────────────────────────────────
# Base URL handling
# ────────────────────────────────────────────────────────────────────


def test_base_url_strips_trailing_slash():
    p = PassportClient(base_url="https://example.com/")
    assert p.base_url == "https://example.com"


# ────────────────────────────────────────────────────────────────────
# Test live (skip if 000)
# ────────────────────────────────────────────────────────────────────


def test_live_endpoint_ping_skipped_on_network_error():
    """If the live endpoint is unreachable, that's OK for unit tests."""
    import os
    if os.environ.get("CSOAI_RUN_LIVE_TESTS") != "1":
        pytest.skip("set CSOAI_RUN_LIVE_TESTS=1 to enable")
    import httpx
    p = PassportClient()
    try:
        resp = httpx.get("https://csoai-org-v2.vercel.app/api/assess", timeout=3.0)
        assert resp.status_code in (200, 405)  # 405 OK for GET on POST-only
    except httpx.ConnectError:
        pytest.skip("live endpoint not reachable")
