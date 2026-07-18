"""
Canonical error types for meok-sovereign-aiact-passport.

Maps the 7-canonical-error taxonomy used across the CSOAI sovereign stack
to friendly Python exceptions. Each error carries:
  - code: short machine-readable identifier (passed through from API)
  - message: human-readable
  - http_status: 4xx/5xx mapped
  - retryable: bool
"""

from __future__ import annotations
from typing import Optional


class SovereignPassportError(Exception):
    """Base class for all sovereign-passport errors.

    The 7 canonical error types in the CSOAI trust stack are:
      1. NetworkError      (API unreachable / timeout)
      2. ValidationError   (input doesn't match schema)
      3. VerificationError (Ed25519 sig / pubkey mismatch)
      4. ExpiryError       (passport's 90-day validity elapsed)
      5. RevocationError   (passport explicitly revoked)
      6. TenantError       (tenant_id missing or unauthorized)
      7. ServerError       (upstream 5xx)
    """

    code: str = "sovereign_error"
    http_status: int = 500
    retryable: bool = False

    def __init__(
        self,
        message: str,
        *,
        cause: Optional[BaseException] = None,
        hint: Optional[str] = None,
        upstream: Optional[dict] = None,
    ) -> None:
        super().__init__(message)
        self.message = message
        self.cause = cause
        self.hint = hint
        self.upstream = upstream  # raw upstream response if available

    def to_dict(self) -> dict:
        d = {
            "code": self.code,
            "message": self.message,
            "http_status": self.http_status,
            "retryable": self.retryable,
        }
        if self.hint:
            d["hint"] = self.hint
        return d

    def __repr__(self) -> str:
        return f"{self.__class__.__name__}(code={self.code!r}, message={self.message!r})"


class NetworkError(SovereignPassportError):
    """Upstream unreachable / connection refused / timeout."""

    code = "network_error"
    http_status = 503
    retryable = True


class ValidationError(SovereignPassportError):
    """Input didn't match schema — bad framework, missing field, etc."""

    code = "validation_error"
    http_status = 422
    retryable = False


class VerificationError(SovereignPassportError):
    """Ed25519 signature could not be verified — tampered or wrong key."""

    code = "verification_error"
    http_status = 422
    retryable = False


class ExpiryError(SovereignPassportError):
    """Passport's 90-day validity window has elapsed."""

    code = "expiry_error"
    http_status = 410  # gone
    retryable = False


class RevocationError(SovereignPassportError):
    """Passport was explicitly revoked by issuer / regulator."""

    code = "revocation_error"
    http_status = 410
    retryable = False


class TenantError(SovereignPassportError):
    """tenant_id missing or unauthorized for this resource."""

    code = "tenant_error"
    http_status = 403
    retryable = False


class ServerError(SovereignPassportError):
    """Upstream returned 5xx."""

    code = "server_error"
    http_status = 502
    retryable = True


# ────────────────────────────────────────────────────────────────────
# Mapping from upstream error envelopes
# ────────────────────────────────────────────────────────────────────

UPSTREAM_CODE_MAP: dict[str, type[SovereignPassportError]] = {
    "validation_error": ValidationError,
    "verification_error": VerificationError,
    "expiry_error": ExpiryError,
    "revocation_error": RevocationError,
    "tenant_error": TenantError,
    "server_error": ServerError,
    "network_error": NetworkError,
}


def classify_upstream_error(upstream_code: str, message: str) -> SovereignPassportError:
    """Turn an upstream error code into the matching Python exception."""
    cls = UPSTREAM_CODE_MAP.get(upstream_code)
    if cls is None:
        return ServerError(f"unknown upstream error: {upstream_code} — {message}")
    return cls(message)
