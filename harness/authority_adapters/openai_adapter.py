"""OpenAI local function-tool approval plus exact host authority at invocation."""

from dataclasses import replace
import rfc8785
from agents import FunctionTool

from .core import AuthorityDenied, DispatchGate, strict_arguments


def with_host_authority(tool: FunctionTool, *, gate: DispatchGate, version: str):
    """Return a reviewed function tool; preserve its input/output guardrails.

    SDK approval always pauses, but is not trusted host authority. The verifier
    is host configuration, not part of ToolContext.context or model arguments.
    Only plain local FunctionTool execution is qualified by this harness.
    """
    if not isinstance(tool, FunctionTool) or not isinstance(gate, DispatchGate):
        raise TypeError("a local FunctionTool and trusted host gate are required")
    if not isinstance(version, str) or not version.strip():
        raise ValueError("reviewed tool version is required")
    name = tool.name
    invoke = tool.on_invoke_tool
    schema = rfc8785.dumps(tool.params_json_schema)

    async def guarded(context, raw_arguments):
        def unchanged():
            try:
                return (
                    context.tool_name == name and context.tool_namespace is None
                    and context.tool_call_id == scope.call_id
                    and rfc8785.dumps(strict_arguments(context.tool_arguments)) == scope.canonical_arguments
                    and tool.name == name and tool.on_invoke_tool is invoke
                    and rfc8785.dumps(tool.params_json_schema) == schema
                )
            except Exception:
                return False

        args = strict_arguments(raw_arguments)
        scope = gate.scope(name, version, context.tool_call_id, args)
        if not unchanged():
            raise AuthorityDenied("function tool or context differs from host binding")
        await gate.aauthorize(scope)
        if not unchanged():
            raise AuthorityDenied("function tool changed during authorization")
        # No await or argument mutation between the final check and callback entry.
        return await invoke(context, scope.canonical_arguments.decode("utf-8"))

    return replace(tool, on_invoke_tool=guarded, needs_approval=True)
