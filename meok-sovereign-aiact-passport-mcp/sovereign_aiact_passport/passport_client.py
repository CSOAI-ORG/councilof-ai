"""
HTTP client wrapping the live CSOAI `/api/assess` endpoint.

This file does ONE thing: turn a `(system_id, framework, claimed_controls)`
tuple into an Ed25519-signed JSON-LD passport, by calling the live endpoint.

Offline behaviour
-----------------
If the network is unreachable (HTTP 000) the client raises `NetworkError`
(retryable) so callers can fall back to local Annex IV generation from a
previously-issued passport (see passport_verify.py).

Honesty register
----------------
The signing keypair is owned by the CSOAI root server. This client does
NOT hold the key — it requests a signature from the server. To verify
the signature offline, use the public key embedded in the response's
`pub` field via ed25519_verify.py.
"""

from __future__ import annotations
import base64
import json
import re
from typing import Optional

import httpx

from sovereign_aiact_passport.error_map import (
    NetworkError,
    ValidationError,
    VerificationError,
    ServerError,
    classify_upstream_error,
)

# Re-export for callers that import from passport_client
__all__ = [
    "PassportClient",
    "SUPPORTED_FRAMEWORKS",
    "REPORT_ID_PATTERN",
    "NetworkError",
    "ValidationError",
    "VerificationError",
    "ServerError",
    "classify_upstream_error",
    "canonical_body_for_sig",
    "report_id_from_url",
    "decode_sig_b64",
]  # type: ignore[has-type]  # re-export list mixes types and constants


# ────────────────────────────────────────────────────────────────────
# Canonical list
# ────────────────────────────────────────────────────────────────────

SUPPORTED_FRAMEWORKS: tuple[str, ...] = (
    "EU_AI_ACT",
    "GDPR",
    "SOC2",
    "HIPAA",
    "ISO_42001",
    "NIST_AI_RMF",
)
"""Frameworks supported by the live /api/assess endpoint."""

DEFAULT_BASE_URL = "https://csoai-org-v2.vercel.app"
DEFAULT_TIMEOUT_S = 8.0
DEFAULT_RETRIES = 2

REPORT_ID_PATTERN = re.compile(r"^[a-f0-9]{16}$")
"""The 16-hex-char report_id returned by the live endpoint."""


# ────────────────────────────────────────────────────────────────────
# Pydantic-free typed dict (saves dep weight)
# ────────────────────────────────────────────────────────────────────


class PassportClient:
    """Stateless HTTP client for CSOAI's /api/assess.

    Usage:
        async with PassportClient() as client:
            response = await client.issue_passport(
                system_id="acme-pay",
                framework="EU_AI_ACT",
                claimed_controls=["art12_logging", "art14_human_oversight"],
                description="Customer-facing chatbot triaging support tickets",
            )

    Or sync (wraps httpx.Client internally):
        client = PassportClient()
        response = client.issue_passport_sync(...)
    """

    def __init__(
        self,
        *,
        base_url: str = DEFAULT_BASE_URL,
        timeout_s: float = DEFAULT_TIMEOUT_S,
        retries: int = DEFAULT_RETRIES,
        api_key: Optional[str] = None,
        tenant_id: Optional[str] = None,
    ) -> None:
        self.base_url = base_url.rstrip("/")
        self.timeout_s = timeout_s
        self.retries = retries
        self.api_key = api_key  # optional — for paid tier
        self.tenant_id = tenant_id
        self._sync: Optional[httpx.Client] = None
        self._async: Optional[httpx.AsyncClient] = None

    # ─────────── Lifecycle ───────────

    def __enter__(self) -> "PassportClient":
        self._sync = httpx.Client(
            base_url=self.base_url,
            timeout=self.timeout_s,
            headers=self._headers(),
        )
        return self

    def __exit__(self, *exc) -> None:
        if self._sync is not None:
            self._sync.close()
            self._sync = None

    async def __aenter__(self) -> "PassportClient":
        self._async = httpx.AsyncClient(
            base_url=self.base_url,
            timeout=self.timeout_s,
            headers=self._headers(),
        )
        return self

    async def __aexit__(self, *exc) -> None:
        if self._async is not None:
            await self._async.aclose()
            self._async = None

    def _headers(self) -> dict[str, str]:
        h = {"Content-Type": "application/json", "Accept": "application/json"}
        if self.api_key:
            h["Authorization"] = f"Bearer {self.api_key}"
        if self.tenant_id:
            h["X-Sov-Tenant"] = self.tenant_id
        return h

    # ─────────── Sync API ───────────

    def issue_passport_sync(
        self,
        *,
        system_id: str,
        framework: str,
        claimed_controls: list[str],
        description: str = "",
        name: Optional[str] = None,
        domain: Optional[str] = None,
        purpose: Optional[str] = None,
    ) -> dict:
        """Synchronous version of issue_passport. Requires `with` context."""
        self._validate_inputs(system_id, framework, claimed_controls)
        if self._sync is None:
            raise NetworkError(
                "issue_passport_sync requires the client to be used as a context manager: `with PassportClient() as p: ...`",
                hint="or use the async `async with PassportClient() as p: await p.issue_passport(...)`",
            )
        payload = {
            "system": system_id,
            "framework": framework,
            "claimed_controls": claimed_controls,
            "description": description,
        }
        if name: payload["name"] = name
        if domain: payload["domain"] = domain
        if purpose: payload["purpose"] = purpose
        return self._do_post(self._sync, payload)

    def verify_passport_sync(self, *, report_id: str) -> dict:
        """Synchronous verify — returns status of a previously-issued passport."""
        _validate_report_id(report_id)
        if self._sync is None:
            raise NetworkError("verify_passport_sync requires the client to be used as a context manager")
        resp = self._sync.get(f"/api/reports/{report_id}")
        return self._handle(resp)

    def list_active_passports_sync(self, *, tenant_id: str, days: int = 90) -> dict:
        """List passports this tenant issued in the last `days`."""
        if not isinstance(tenant_id, str) or len(tenant_id) < 3:
            raise ValidationError(f"tenant_id must be a non-empty string, got {tenant_id!r}")
        if not isinstance(days, int) or days < 1 or days > 3650:
            raise ValidationError(f"days must be 1..3650, got {days!r}")
        if self._sync is None:
            raise NetworkError("list_active_passports_sync requires the client to be used as a context manager")
        resp = self._sync.get(f"/api/passports", params={"tenant_id": tenant_id, "days": days})
        return self._handle(resp)

    # ─────────── Async API ───────────

    async def issue_passport(
        self,
        *,
        system_id: str,
        framework: str,
        claimed_controls: list[str],
        description: str = "",
        name: Optional[str] = None,
        domain: Optional[str] = None,
        purpose: Optional[str] = None,
    ) -> dict:
        """Issue a signed passport. Async preferred for server contexts.

        Returns the full response envelope from /api/assess, which looks like:
            {
              "report_id": "7f54374a9836282a",
              "alg": "ed25519",
              "pub": "302a300506032b6570032100...",
              "sig": "NB12ndiDXuKOkCKEExbQhvnz6746...",
              "body": { ... },
              "verify_url": "/verify?id=7f54374a9836282a",
              "verify_hint": "Ed25519-verify sig (base64) against pub (SPKI DER hex) over JSON.stringify(body)."
            }
        """
        self._validate_inputs(system_id, framework, claimed_controls)
        if self._async is None:
            raise NetworkError("issue_passport requires the client to be used as an async context manager (async with)")
        payload = {
            "system": system_id,
            "framework": framework,
            "claimed_controls": claimed_controls,
            "description": description,
        }
        if name: payload["name"] = name
        if domain: payload["domain"] = domain
        if purpose: payload["purpose"] = purpose
        return await self._do_post_async(payload)

    async def verify_passport(self, *, report_id: str) -> dict:
        """Async version of verify_passport_sync."""
        _validate_report_id(report_id)
        if self._async is None:
            raise NetworkError("verify_passport requires async context manager")
        resp = await self._async.get(f"/api/reports/{report_id}")
        return self._handle(resp)

    async def list_active_passports(self, *, tenant_id: str, days: int = 90) -> dict:
        """Async version of list_active_passports_sync."""
        if not isinstance(tenant_id, str) or len(tenant_id) < 3:
            raise ValidationError(f"tenant_id must be a non-empty string, got {tenant_id!r}")
        if not isinstance(days, int) or days < 1 or days > 3650:
            raise ValidationError(f"days must be 1..3650, got {days!r}")
        if self._async is None:
            raise NetworkError("list_active_passports requires async context manager")
        resp = await self._async.get(f"/api/passports", params={"tenant_id": tenant_id, "days": days})
        return self._handle(resp)

    # ─────────── Internals ───────────

    def _validate_inputs(
        self,
        system_id: str,
        framework: str,
        claimed_controls: list[str],
    ) -> None:
        if not isinstance(system_id, str) or not (1 <= len(system_id) <= 200):
            raise ValidationError(f"system_id must be 1..200 chars, got {system_id!r}")
        if not re.fullmatch(r"^[\w.\-@:]+$", system_id):
            raise ValidationError(
                f"system_id contains disallowed chars (allowed: letters, digits, . _ - @ :)"
            )
        if framework not in SUPPORTED_FRAMEWORKS:
            raise ValidationError(
                f"framework must be one of {SUPPORTED_FRAMEWORKS}, got {framework!r}"
            )
        if not isinstance(claimed_controls, list):
            raise ValidationError("claimed_controls must be a list of strings")
        for ctrl in claimed_controls:
            if not isinstance(ctrl, str) or not (1 <= len(ctrl) <= 100):
                raise ValidationError(f"each claimed_control must be a 1..100 char string, got {ctrl!r}")

    def _do_post(self, sync: httpx.Client, payload: dict) -> dict:
        last_err: Optional[Exception] = None
        for attempt in range(self.retries + 1):
            try:
                resp = sync.post("/api/assess", json=payload)
                return self._handle(resp)
            except httpx.ConnectError as e:
                last_err = e
                if attempt < self.retries:
                    continue
                raise NetworkError(
                    f"could not reach {self.base_url} after {self.retries + 1} attempts",
                    cause=e,
                    hint="check network or pass base_url explicitly to a different endpoint",
                )
            except httpx.TimeoutException as e:
                last_err = e
                if attempt < self.retries:
                    continue
                raise NetworkError(
                    f"timed out connecting to {self.base_url}",
                    cause=e,
                    hint="check upstream status page or pass base_url explicitly",
                )
        if last_err:
            raise NetworkError(f"unexpected POST failure", cause=last_err)
        raise ServerError("no attempt was made (logic error)")

    async def _do_post_async(self, payload: dict) -> dict:
        assert self._async is not None
        last_err: Optional[Exception] = None
        for attempt in range(self.retries + 1):
            try:
                resp = await self._async.post("/api/assess", json=payload)
                return self._handle(resp)
            except httpx.ConnectError as e:
                last_err = e
                if attempt < self.retries:
                    continue
                raise NetworkError(
                    f"could not reach {self.base_url} after {self.retries + 1} attempts",
                    cause=e,
                )
            except httpx.TimeoutException as e:
                last_err = e
                if attempt < self.retries:
                    continue
                raise NetworkError(f"timed out connecting to {self.base_url}", cause=e)
        if last_err:
            raise NetworkError("unexpected POST failure", cause=last_err)
        raise ServerError("no attempt was made (logic error)")

    @staticmethod
    def _handle(resp: httpx.Response) -> dict:
        """Common error handling for any response."""
        if resp.status_code >= 500:
            raise ServerError(
                f"upstream {resp.status_code} — {resp.text[:200]}",
                upstream={"status": resp.status_code, "text": resp.text[:1000]},
            )
        if resp.status_code in (400, 422):
            try:
                body = resp.json()
            except Exception:
                body = {"error": resp.text[:200]}
            code = body.get("error") or body.get("code") or "validation_error"
            msg = body.get("message") or body.get("error") or "validation failed"
            raise classify_upstream_error(code, str(msg))
        if resp.status_code == 404:
            return {"status": "not_found", "report_id": None}
        resp.raise_for_status()
        try:
            return resp.json()
        except Exception as e:
            raise ServerError(
                f"upstream returned non-JSON: {resp.text[:200]}",
                cause=e,
            )


# ────────────────────────────────────────────────────────────────────
# Helpers
# ────────────────────────────────────────────────────────────────────


def _validate_report_id(report_id: str) -> None:
    if not isinstance(report_id, str) or not REPORT_ID_PATTERN.fullmatch(report_id):
        raise ValidationError(
            f"report_id must be a 16-hex-char string matching {REPORT_ID_PATTERN.pattern!r}, got {report_id!r}"
        )


def _payload_dict(locals_dict: dict) -> dict:
    """Convert locals() into a serialisable payload for /api/assess."""
    return {
        "system": locals_dict.get("system_id", ""),
        "framework": locals_dict.get("framework", "EU_AI_ACT"),
        "claimed_controls": locals_dict.get("claimed_controls", []),
        "description": locals_dict.get("description", ""),
    }


# ────────────────────────────────────────────────────────────────────
# Public helpers — for callers that just want canonical decode
# ────────────────────────────────────────────────────────────────────


def canonical_body_for_sig(body: dict) -> bytes:
    """Compute the canonical JSON the signer actually signs.

    The CSOAI /api/assess endpoint signs `JSON.stringify(body)` (browser
    semantics — sorted keys, no whitespace). Use this helper when you
    need to re-verify the signature offline.
    """
    return json.dumps(body, sort_keys=True, separators=(",", ":")).encode("utf-8")


def report_id_from_url(verify_url: str) -> Optional[str]:
    """Extract the 16-hex-char report_id from a verify URL."""
    if not isinstance(verify_url, str):
        return None
    m = re.search(r"[?&]id=([a-f0-9]{16})", verify_url)
    return m.group(1) if m else None


def decode_sig_b64(sig_b64: str) -> bytes:
    """Decode a base64 signature to raw bytes (must be 64 bytes, Ed25519)."""
    if not isinstance(sig_b64, str):
        raise ValidationError(f"sig must be base64 string, got {type(sig_b64).__name__}")
    try:
        raw = base64.b64decode(sig_b64, validate=True)
    except Exception as e:
        raise ValidationError(f"sig is not valid base64: {e}")
    if len(raw) != 64:
        raise ValidationError(f"sig must decode to 64 bytes (Ed25519), got {len(raw)}")
    return raw
