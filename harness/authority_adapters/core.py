"""Shared dispatch scope and host-verifier contract, independent of any agent SDK."""

from collections.abc import Awaitable, Callable
from dataclasses import dataclass
from hashlib import sha256
import json

import rfc8785


class AuthorityDenied(RuntimeError):
    """No tool dispatch is permitted for this attempt."""


@dataclass(frozen=True)
class HostBinding:
    """Trusted configuration: create a separate binding for each workflow run."""

    principal: str
    tenant: str
    audience: str
    workflow_id: str
    resource: str
    policy_revision: str
    authority_epoch: str

    def __post_init__(self):
        if any(not isinstance(v, str) or not v.strip() for v in vars(self).values()):
            raise ValueError("all host binding fields must be nonempty strings")


@dataclass(frozen=True)
class DispatchScope:
    """Immutable verification input, not an authenticated receipt.

    call_id is model/SDK supplied. Its uniqueness is NOT trusted; the host must
    namespace it with workflow_id and atomically enforce its one-use rule.
    """

    host: HostBinding
    tool_name: str
    tool_version: str
    call_id: str
    inputs_sha256: str
    canonical_arguments: bytes


Verifier = Callable[[DispatchScope], bool]
AsyncVerifier = Callable[[DispatchScope], Awaitable[bool]]


def scope_for(binding, name, version, call_id, arguments):
    if (not isinstance(arguments, dict) or not isinstance(binding, HostBinding)
            or any(not isinstance(v, str) or not v.strip() for v in (name, version, call_id))):
        raise AuthorityDenied("invalid dispatch scope")
    try:
        canonical = rfc8785.dumps(arguments)
    except Exception:
        raise AuthorityDenied("arguments are not canonical JSON") from None
    return DispatchScope(binding, name, version, call_id, sha256(canonical).hexdigest(), canonical)


def strict_arguments(raw):
    """Reject ambiguous duplicate JSON keys and nonfinite numeric values."""
    def unique(pairs):
        result = {}
        for key, value in pairs:
            if key in result:
                raise ValueError("duplicate argument key")
            result[key] = value
        return result
    def invalid_constant(value):
        raise ValueError("nonfinite argument")
    try:
        result = json.loads(raw, object_pairs_hook=unique, parse_constant=invalid_constant)
        if not isinstance(result, dict):
            raise ValueError("expected argument object")
        return result
    except Exception:
        raise AuthorityDenied("invalid tool argument JSON") from None


class DispatchGate:
    """The deployment owner supplies authentication and atomic durable consumption.

    No receipt, principal, revocation or replay store is invented by this class.
    The check-to-effect race must also be controlled by the downstream executor.
    """

    def __init__(self, *, binding, verify_and_consume=None, averify_and_consume=None,
                 cancelled=lambda: False):
        if not isinstance(binding, HostBinding):
            raise TypeError("trusted host binding is required")
        for callback in (verify_and_consume, averify_and_consume):
            if callback is not None and not callable(callback):
                raise TypeError("host verifier must be callable")
        if not callable(cancelled):
            raise TypeError("cancellation reader must be callable")
        self._binding = binding
        self._verify = verify_and_consume
        self._averify = averify_and_consume
        self._cancelled = cancelled

    def scope(self, name, version, call_id, arguments):
        return scope_for(self._binding, name, version, call_id, arguments)

    def _check_cancelled(self):
        try:
            stopped = self._cancelled()
        except Exception:
            raise AuthorityDenied("cancellation state unavailable") from None
        if stopped is not False:
            raise AuthorityDenied("cancelled or invalid cancellation state")

    def _accepted(self, verified):
        if verified is not True:
            raise AuthorityDenied("host approval denied")
        self._check_cancelled()

    def authorize(self, scope):
        self._check_cancelled()
        if self._verify is None:
            raise AuthorityDenied("sync host verifier unavailable")
        try:
            verified = self._verify(scope)
        except Exception:
            raise AuthorityDenied("host approval unavailable") from None
        self._accepted(verified)

    async def aauthorize(self, scope):
        self._check_cancelled()
        if self._averify is None:
            raise AuthorityDenied("async host verifier unavailable")
        try:
            verified = await self._averify(scope)
        except Exception:
            raise AuthorityDenied("host approval unavailable") from None
        self._accepted(verified)
