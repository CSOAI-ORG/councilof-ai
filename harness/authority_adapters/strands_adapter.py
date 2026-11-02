"""Strands hooks record observations; final tool middleware enforces authority."""

from copy import deepcopy
from hashlib import sha256
from types import MappingProxyType

import rfc8785
from strands.hooks import AfterToolCallEvent, BeforeToolCallEvent, HookProvider
from strands.middleware import ExecuteToolStage
from strands.types.tools import AgentTool

from .core import AuthorityDenied, DispatchGate


class ToolObservations(HookProvider):
    """In-process hook snapshots. These are not independently observed effects.

    Priority 50 observes default-priority hooks, including reverse-ordered after
    callbacks. Higher-priority hooks can still change the event; dispatch
    enforcement is separate. The host must review its complete hook order.
    Results are hashed, not copied into the observation stream as raw content.
    """

    def __init__(self, *, order=50):
        self.records = []
        self.order = order

    def register_hooks(self, registry):
        registry.add_callback(BeforeToolCallEvent, self.before, order=self.order)
        registry.add_callback(AfterToolCallEvent, self.after, order=self.order)

    def before(self, event):
        self.records.append({
            "phase": "before_hook", "call_id": event.tool_use.get("toolUseId"),
            "selected_tool": event.selected_tool.tool_name if event.selected_tool else None,
            "cancellation_requested": bool(event.cancel_tool),
        })

    def after(self, event):
        try:
            result_hash = sha256(rfc8785.dumps(event.result)).hexdigest()
        except Exception:
            result_hash = None
        self.records.append({
            "phase": "after_hook", "call_id": event.tool_use.get("toolUseId"),
            "status": event.result.get("status"), "result_sha256": result_hash,
            "exception_type": type(event.exception).__name__ if event.exception else None,
            "cancelled": event.cancel_message is not None,
            "retry_requested": event.retry,
        })


class StrandsAuthorityMiddleware:
    """Register LAST among ExecuteToolStage Wrap handlers, after all mutators.

    Input-stage handlers and BeforeToolCallEvent hooks run before this boundary.
    Background tools, nested agents and streaming partial effects are unqualified.
    """

    def __init__(self, gate: DispatchGate, tools):
        if not isinstance(gate, DispatchGate) or not tools:
            raise TypeError("host gate and pinned tools are required")
        if any(not isinstance(tool, AgentTool) or tool.tool_name != name
               or not isinstance(version, str) or not version.strip()
               for name, (tool, version) in tools.items()):
            raise ValueError("pin each permitted tool instance and version")
        self.gate = gate
        self.tools = MappingProxyType(dict(tools))
        self.attempts = []

    def install(self, agent):
        agent.add_middleware(ExecuteToolStage, self)

    async def __call__(self, context, next_fn):
        attempt = {"phase": "dispatch_boundary", "state": "DENIED",
                   "call_id": context.tool_use.get("toolUseId")}
        self.attempts.append(attempt)
        if context.cancel_signal.is_set():
            raise AuthorityDenied("SDK cancellation requested")
        try:
            call = deepcopy(context.tool_use)
            pinned, version = self.tools[call["name"]]
            if context.tool is not pinned:
                raise ValueError("selected tool differs from host pin")
            fingerprint = rfc8785.dumps(call)
            scope = self.gate.scope(call["name"], version, call["toolUseId"], call["input"])
        except Exception:
            raise AuthorityDenied("invalid or unpinned tool request") from None
        attempt["inputs_sha256"] = scope.inputs_sha256
        await self.gate.aauthorize(scope)
        try:
            unchanged = context.tool is pinned and rfc8785.dumps(context.tool_use) == fingerprint
        except Exception:
            unchanged = False
        if not unchanged or context.cancel_signal.is_set():
            raise AuthorityDenied("request changed or cancelled during authorization")
        attempt["state"] = "AUTHORIZED_FOR_DISPATCH"
        # Tool completion/result is not independent proof of the downstream effect.
        async for event in next_fn(context.replace(tool_use=call)):
            yield event
