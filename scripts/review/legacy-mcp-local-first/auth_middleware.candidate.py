"""Local-first access policy for the legacy calculation tools.

Remote metering is OFF unless the operator sets MEOK_ENABLE_REMOTE_METERING=1.
Opt-in sends only the supplied/environment API key and an empty tool label to
MEOK_VERIFY_URL (default https://proofof.ai/verify). It never receives calculation
arguments. An explicit remote check fails closed on errors; local per-tool limits
remain in server.py in every tier. This module is not an identity/authority gate.
"""
from __future__ import annotations

import hashlib
import hmac
import json
import math
import os
import urllib.error
import urllib.parse
import urllib.request

_DEFAULT_VERIFY_URL = "https://proofof.ai/verify"
_MAX_RESPONSE_BYTES = 16384
_TIERS = frozenset({"anonymous", "free", "pro", "payg", "enterprise"})


class _NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        # Do not forward a credential to a redirected destination.
        raise urllib.error.HTTPError(req.full_url, code, "Metering redirect refused", headers, fp)


def _remote_settings():
    url = os.environ.get("MEOK_VERIFY_URL", _DEFAULT_VERIFY_URL).strip()
    parts = urllib.parse.urlsplit(url)
    if (parts.scheme != "https" or not parts.hostname or parts.username is not None
            or parts.password is not None or parts.query or parts.fragment
            or "\\" in url or any(ord(c) < 33 or ord(c) == 127 for c in url)):
        raise ValueError("Invalid metering endpoint")
    # Accessing port detects an invalid numeric port without making a request.
    _ = parts.port
    timeout = float(os.environ.get("MEOK_VERIFY_TIMEOUT", "2.5"))
    if not math.isfinite(timeout) or not 0 < timeout <= 10:
        raise ValueError("Invalid metering timeout")
    return url, timeout


def _server_check(api_key: str, tool: str = ""):
    """Explicitly opted-in metadata-only request; no redirects or implicit proxy."""
    if os.environ.get("MEOK_ENABLE_REMOTE_METERING", "0").strip() != "1":
        return None
    try:
        url, timeout = _remote_settings()
        data = json.dumps({"api_key": api_key, "tool": ""}).encode("utf-8")
        request = urllib.request.Request(url, data=data,
            headers={"Content-Type": "application/json"}, method="POST")
        opener = urllib.request.build_opener(urllib.request.ProxyHandler({}), _NoRedirect())
        with opener.open(request, timeout=timeout) as response:
            if response.status != 200:
                return None
            body = response.read(_MAX_RESPONSE_BYTES + 1)
        if len(body) > _MAX_RESPONSE_BYTES:
            return None
        result = json.loads(body)
        if not isinstance(result, dict) or type(result.get("allowed")) is not bool:
            return None
        tier = result.get("tier")
        if not isinstance(tier, str) or tier not in _TIERS:
            return None
        return result["allowed"], tier, result.get("remaining")
    except Exception:
        # Do not expose credential-bearing URLs or response bodies in errors.
        return None


def check_access(api_key: str = ""):
    """Preserve the legacy (allowed, message, tier) interface, without silent egress."""
    mode = os.environ.get("MEOK_ENABLE_REMOTE_METERING", "0").strip()
    if mode in ("", "0"):
        return True, "Local mode; remote metering disabled; local limits still apply.", "free"
    if mode != "1":
        return False, "Set MEOK_ENABLE_REMOTE_METERING to 0 (local) or 1 (opt-in).", "unknown"
    if not isinstance(api_key, str):
        return False, "API key must be a string.", "unknown"
    key = (api_key or os.environ.get("MEOK_API_KEY", "")).strip()
    if len(key) > 4096:
        return False, "API key is too long.", "unknown"
    # A prefix is not authentication. All opted-in keys use the same remote check.
    result = _server_check(key)
    if result is None:
        return False, "Remote metering could not be verified; no tool calculation ran.", "unknown"
    allowed, tier, _remaining = result
    if not allowed:
        return False, "The configured metering service denied this request.", tier
    return True, "Metering service allowed this request; local limits still apply.", tier


def meok_attest(result) -> str:
    """Return a caller-keyed MAC, not public-key signing or independent attestation.

    No shared public default key is used. Anyone holding the key can forge a MAC.
    This helper is not invoked by the calculation tools and grants no authority.
    """
    key = os.environ.get("MEOK_ATTEST_KEY", "")
    if len(key.encode("utf-8")) < 32:
        raise ValueError("MEOK_ATTEST_KEY must be explicitly set to at least 32 UTF-8 bytes")
    payload = json.dumps(result, sort_keys=True, default=str).encode("utf-8")
    return hmac.new(key.encode("utf-8"), payload, hashlib.sha256).hexdigest()
