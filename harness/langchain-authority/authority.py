"""Experimental host-authority gate for LangChain's final tool dispatch.

The host verifies and atomically consumes approval; SDK review responses do not.
Install LAST in the middleware list, immediately before the trusted tool handler.
This is not an identity service, durable replay store, sandbox or effect verifier.
"""

from collections.abc import Callable, Mapping
from copy import deepcopy
from types import MappingProxyType

import rfc8785
from langchain.agents.middleware import AgentMiddleware
from langchain_core.tools import BaseTool
from langgraph.prebuilt.tool_node import ToolCallRequest
from harness.authority_adapters.core import (
    AuthorityDenied, AsyncVerifier, DispatchGate, DispatchScope, HostBinding, Verifier,
)


class HostAuthorityMiddleware(DispatchGate, AgentMiddleware):
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
        super().__init__(binding=binding, verify_and_consume=verify_and_consume,
                         averify_and_consume=averify_and_consume, cancelled=cancelled)
        self._pinned_tools = MappingProxyType(dict(tools))

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
            fingerprint = rfc8785.dumps(call)
            scope = self.scope(call["name"], version, call["id"], call["args"])
        except Exception:
            raise AuthorityDenied("invalid or unpinned tool request") from None
        return request.override(tool_call=call), scope, fingerprint

    def _before_dispatch(self, original, snapshot, fingerprint):
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
        self.authorize(scope)
        self._before_dispatch(request, snapshot, fingerprint)
        return handler(snapshot)

    async def awrap_tool_call(self, request, handler):
        snapshot, scope, fingerprint = self._prepare(request)
        await self.aauthorize(scope)
        self._before_dispatch(request, snapshot, fingerprint)
        return await handler(snapshot)
