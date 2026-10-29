"""Experimental host-authority gate for LangChain's final tool dispatch.

The host verifies and atomically consumes approval; SDK review responses do not.
Install LAST in the middleware list, immediately before the trusted tool handler.
This is not an identity service, durable replay store, sandbox or effect verifier.
"""

from collections.abc import Awaitable, Callable, Mapping
from copy import deepcopy
from dataclasses import dataclass
from hashlib import sha256
from types import MappingProxyType

import rfc8785
from langchain.agents.middleware import AgentMiddleware
from langchain_core.tools import BaseTool
from langgraph.prebuilt.tool_node import ToolCallRequest


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


class HostAuthorityMiddleware(AgentMiddleware):
    def __init__(
        self,
        *,
        binding: HostBinding,
        tools: Mapping[str, tuple[BaseTool, str]],
        verify_and_consume: Verifier,
        averify_and_consume: AsyncVerifier | None = None,
        cancelled: Callable[[], bool] = lambda: False,
    ):
        if not isinstance(binding, HostBinding) or not callable(verify_and_consume):
            raise TypeError("trusted host binding and verifier are required")
        if not tools or any(
            not isinstance(tool, BaseTool) or name != tool.name
            or not isinstance(version, str) or not version.strip()
            for name, (tool, version) in tools.items()
        ):
            raise ValueError("pin each permitted tool instance and its version")
        self._binding = binding
        self._pinned_tools = MappingProxyType(dict(tools))
        self._verify = verify_and_consume
        self._averify = averify_and_consume
        self._cancelled = cancelled

    def _check_cancelled(self):
        try:
            stopped = self._cancelled()
        except Exception:
            raise AuthorityDenied("cancellation state unavailable") from None
        if stopped is not False:
            raise AuthorityDenied("cancelled or invalid cancellation state")

    def _prepare(self, request: ToolCallRequest):
        self._check_cancelled()
        try:
            call = deepcopy(request.tool_call)
            tool, version = self._pinned_tools[call["name"]]
            if request.tool is not tool:
                raise ValueError("tool instance differs from host pin")
            if not isinstance(call["id"], str) or not call["id"].strip():
                raise ValueError("missing call id")
            if not isinstance(call["args"], dict):
                raise ValueError("arguments must be an object")
            args = rfc8785.dumps(call["args"])
            fingerprint = rfc8785.dumps(call)
            scope = DispatchScope(
                host=self._binding, tool_name=call["name"], tool_version=version,
                call_id=call["id"], inputs_sha256=sha256(args).hexdigest(),
                canonical_arguments=args,
            )
        except Exception:
            raise AuthorityDenied("invalid or unpinned tool request") from None
        return request.override(tool_call=call), scope, fingerprint

    def _before_dispatch(self, original, snapshot, fingerprint, verified):
        if verified is not True:
            raise AuthorityDenied("host approval denied")
        self._check_cancelled()
        try:
            unchanged = (
                original.tool is snapshot.tool
                and rfc8785.dumps(original.tool_call) == fingerprint
                and rfc8785.dumps(snapshot.tool_call) == fingerprint
            )
        except Exception:
            unchanged = False
        if not unchanged:
            raise AuthorityDenied("request changed during authorization")

    def wrap_tool_call(self, request, handler):
        snapshot, scope, fingerprint = self._prepare(request)
        try:
            verified = self._verify(scope)
        except Exception:
            raise AuthorityDenied("host approval unavailable") from None
        self._before_dispatch(request, snapshot, fingerprint, verified)
        return handler(snapshot)

    async def awrap_tool_call(self, request, handler):
        snapshot, scope, fingerprint = self._prepare(request)
        if self._averify is None:
            raise AuthorityDenied("async host verifier unavailable")
        try:
            verified = await self._averify(scope)
        except Exception:
            raise AuthorityDenied("host approval unavailable") from None
        self._before_dispatch(request, snapshot, fingerprint, verified)
        return await handler(snapshot)
