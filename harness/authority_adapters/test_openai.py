"""Actual OpenAI SDK Runner and serialized approvals; synthetic model and host."""

import asyncio
from dataclasses import replace
import json

import pytest
from agents import Agent, Model, Runner, RunConfig, RunState, RunHooks, function_tool
from agents import ToolGuardrailFunctionOutput, tool_input_guardrail, tool_output_guardrail
from agents.items import ModelResponse
from agents.exceptions import UserError
from agents.tool_context import ToolContext
from agents.usage import Usage
from openai.types.responses import ResponseFunctionToolCall, ResponseOutputMessage, ResponseOutputText

from harness.authority_adapters.core import AuthorityDenied
from harness.authority_adapters.openai_adapter import with_host_authority


class ScriptedModel(Model):
    def __init__(self):
        self.calls = 0

    async def get_response(self, *args, **kwargs):
        self.calls += 1
        if self.calls == 1:
            output = [ResponseFunctionToolCall(type="function_call", name="write_note", call_id="call-1",
                       arguments=json.dumps({"text": "reviewed"}), id="item-1", status="completed")]
        else:
            output = [ResponseOutputMessage(type="message", role="assistant", id="msg-1", status="completed",
                       content=[ResponseOutputText(type="output_text", text="done", annotations=[])])]
        return ModelResponse(output=output, usage=Usage(), response_id=None)

    async def stream_response(self, *args, **kwargs):
        raise AssertionError("streaming is outside this fixture")
        yield


CONFIG = RunConfig(tracing_disabled=True)


def build(host, *, input_guards=None, output_guards=None):
    @function_tool(tool_input_guardrails=input_guards, tool_output_guardrails=output_guards,
                   failure_error_function=None)
    async def write_note(text: str) -> str:
        """Append one note to an owned temporary sink."""
        return host.write(text)
    protected = with_host_authority(write_note, gate=host.gate, version="fixture/1")
    return Agent(name="fixture-agent", model=ScriptedModel(), tools=[protected]), protected


async def pause(agent, host):
    result = await Runner.run(agent, "write the note", run_config=CONFIG)
    assert len(result.interruptions) == 1
    assert host.readback() == [] and host.auth.seen == []
    return result


def test_real_pause_serialized_resume_and_independent_readback(host):
    agent, protected = build(host)
    async def run():
        result = await pause(agent, host)
        state = await RunState.from_json(agent, result.to_state().to_json())
        state.approve(result.interruptions[0])
        host.auth.issued_scope = host.expected()
        return await Runner.run(agent, state, run_config=CONFIG)
    asyncio.run(run())
    assert protected.needs_approval is True
    assert host.readback() == [{"text": "reviewed"}]
    assert host.auth.seen == [host.expected()]


def test_reject_prevents_dispatch_even_with_valid_host_lease(host):
    agent, _ = build(host)
    async def run():
        result = await pause(agent, host)
        state = result.to_state()
        state.reject(result.interruptions[0])
        host.auth.issued_scope = host.expected()
        await Runner.run(agent, state, run_config=CONFIG)
    asyncio.run(run())
    assert host.readback() == [] and host.auth.seen == []


@pytest.mark.parametrize("fault", ["unissued", "expired", "revoked", "wrong_tenant", "wrong_epoch", "wrong_audience", "wrong_resource", "wrong_version"])
def test_sdk_approval_does_not_override_host_denial(host, fault):
    agent, _ = build(host)
    async def run():
        result = await pause(agent, host)
        state = result.to_state()
        state.approve(result.interruptions[0])
        host.auth.issued_scope = host.expected()
        if fault == "unissued":
            host.auth.issued_scope = None
        elif fault == "expired":
            host.auth.now = host.auth.expires
        elif fault == "revoked":
            host.auth.revoked = True
        elif fault == "wrong_version":
            host.auth.issued_scope = replace(host.expected(), tool_version="other")
        else:
            field = {"wrong_tenant": "tenant", "wrong_epoch": "authority_epoch", "wrong_audience": "audience", "wrong_resource": "resource"}[fault]
            host.auth.issued_scope = replace(host.expected(), host=replace(host.binding, **{field: "other"}))
        with pytest.raises(UserError) as failure:
            await Runner.run(agent, state, run_config=CONFIG)
        assert isinstance(failure.value.__cause__, AuthorityDenied)
    asyncio.run(run())
    assert host.readback() == []


def test_old_serialized_state_cannot_replay_consumed_authority(host):
    agent, _ = build(host)
    async def run():
        result = await pause(agent, host)
        saved = result.to_state().to_json()
        state = await RunState.from_json(agent, saved)
        state.approve(result.interruptions[0])
        host.auth.issued_scope = host.expected()
        await Runner.run(agent, state, run_config=CONFIG)
        second = await RunState.from_json(agent, saved)
        second.approve(result.interruptions[0])
        with pytest.raises(UserError) as failure:
            await Runner.run(agent, second, run_config=CONFIG)
        assert isinstance(failure.value.__cause__, AuthorityDenied)
    asyncio.run(run())
    assert host.readback() == [{"text": "reviewed"}]


def test_input_guardrail_stops_before_host_consumption(host):
    @tool_input_guardrail
    def reject(data):
        return ToolGuardrailFunctionOutput.reject_content("fixture input denied")
    agent, _ = build(host, input_guards=[reject])
    async def run():
        result = await pause(agent, host)
        state = result.to_state()
        state.approve(result.interruptions[0])
        host.auth.issued_scope = host.expected()
        await Runner.run(agent, state, run_config=CONFIG)
    asyncio.run(run())
    assert host.readback() == [] and host.auth.seen == []


def test_output_guardrail_rejection_does_not_erase_completed_effect(host):
    observed_outputs = []
    @tool_output_guardrail
    def reject(data):
        observed_outputs.append(data.output)
        return ToolGuardrailFunctionOutput.reject_content("fixture output withheld")
    agent, _ = build(host, output_guards=[reject])
    async def run():
        result = await pause(agent, host)
        state = result.to_state()
        state.approve(result.interruptions[0])
        host.auth.issued_scope = host.expected()
        return await Runner.run(agent, state, run_config=CONFIG)
    result = asyncio.run(run())
    assert host.readback() == [{"text": "reviewed"}]
    assert observed_outputs == ["tool returned; read the sink independently"]
    assert any(getattr(item, "output", None) == "fixture output withheld" for item in result.new_items)


def context(raw='{"text":"reviewed"}'):
    return ToolContext(context={}, tool_name="write_note", tool_call_id="call-1", tool_arguments=raw)


@pytest.mark.parametrize("raw", ['{"text":"one","text":"two"}', '{"text":NaN}', '[]', 'null', '{broken'])
def test_ambiguous_or_malformed_arguments_fail_before_host(host, raw):
    _, protected = build(host)
    with pytest.raises(AuthorityDenied):
        asyncio.run(protected.on_invoke_tool(context(raw), raw))
    assert host.auth.seen == [] and host.readback() == []


@pytest.mark.parametrize("fresh_approval", [False, True])
def test_changed_arguments_require_fresh_exact_host_scope(host, fresh_approval):
    _, protected = build(host)
    raw = '{"text":"edited"}'
    host.auth.issued_scope = host.expected("edited" if fresh_approval else "reviewed")
    if fresh_approval:
        asyncio.run(protected.on_invoke_tool(context(raw), raw))
    else:
        with pytest.raises(AuthorityDenied):
            asyncio.run(protected.on_invoke_tool(context(raw), raw))
    assert host.readback() == ([{"text": "edited"}] if fresh_approval else [])


def test_context_mutation_during_authorization_blocks_dispatch(host):
    _, protected = build(host)
    ctx = context()
    async def mutate(scope):
        ctx.tool_arguments = '{"text":"changed while checking"}'
        return True
    host.gate._averify = mutate
    with pytest.raises(AuthorityDenied):
        asyncio.run(protected.on_invoke_tool(ctx, ctx.tool_arguments))
    assert host.readback() == []


def test_sdk_start_hook_mutation_is_rejected_before_host_consumption(host):
    class Mutate(RunHooks):
        async def on_tool_start(self, context, agent, tool):
            context.tool_arguments = '{"text":"changed by start hook"}'
    agent, _ = build(host)
    async def run():
        result = await pause(agent, host)
        state = result.to_state()
        state.approve(result.interruptions[0])
        host.auth.issued_scope = host.expected()
        with pytest.raises(UserError) as failure:
            await Runner.run(agent, state, run_config=CONFIG, hooks=Mutate())
        assert isinstance(failure.value.__cause__, AuthorityDenied)
    asyncio.run(run())
    assert host.readback() == [] and host.auth.seen == []


@pytest.mark.parametrize("answer", [False, None, 1, "true", {"approved": True}])
def test_non_boolean_host_result_does_not_dispatch(host, answer):
    _, protected = build(host)
    async def invalid(scope):
        return answer
    host.gate._averify = invalid
    with pytest.raises(AuthorityDenied):
        asyncio.run(protected.on_invoke_tool(context(), '{"text":"reviewed"}'))
    assert host.readback() == []
