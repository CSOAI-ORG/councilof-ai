"""Real SDK/checkpointer/tool execution; synthetic model and host authority.

Read back an owned temporary file independently of the tool's return message.
No API keys, model inference, scanner, production identity or remote tool needed.
"""

import asyncio
from dataclasses import replace
from hashlib import sha256
import json
import socket
from threading import Lock

import pytest
import rfc8785
from langchain.agents import create_agent
from langchain.agents.middleware import AgentMiddleware, HumanInTheLoopMiddleware
from langchain_core.language_models.fake_chat_models import GenericFakeChatModel
from langchain_core.messages import AIMessage
from langchain_core.tools import StructuredTool
from langgraph.checkpoint.memory import InMemorySaver
from langgraph.prebuilt.tool_node import ToolCallRequest
from langgraph.types import Command

from authority import AuthorityDenied, DispatchScope, HostAuthorityMiddleware, HostBinding


class ScriptedModel(GenericFakeChatModel):
    def bind_tools(self, tools, **kwargs):
        return self


class FixtureAuthority:
    """In-process, synthetic approval registry; NOT a production identity system."""

    def __init__(self):
        self.issued_scope = None
        self.now = 100
        self.expires = 200
        self.revoked = False
        self.used = set()
        self.seen = []
        self.lock = Lock()

    def verify_and_consume(self, scope):
        # The comparison and consume are atomic within this single test process.
        # A production host needs authentication and durable cross-worker storage.
        with self.lock:
            self.seen.append(scope)
            key = (scope.host.workflow_id, scope.call_id)
            if (scope != self.issued_scope or self.now >= self.expires
                    or self.revoked or key in self.used):
                return False
            self.used.add(key)
            return True

    async def averify_and_consume(self, scope):
        await asyncio.sleep(0)
        return self.verify_and_consume(scope)


@pytest.fixture(autouse=True)
def no_network(monkeypatch):
    monkeypatch.setenv("LANGSMITH_TRACING", "false")
    monkeypatch.setenv("LANGCHAIN_TRACING_V2", "false")

    def blocked(*args, **kwargs):
        raise AssertionError("network is forbidden in this harness")

    monkeypatch.setattr(socket.socket, "connect", blocked)
    monkeypatch.setattr(socket, "create_connection", blocked)


@pytest.fixture
def rig(tmp_path):
    path = tmp_path / "effect.jsonl"

    def write_note(text: str) -> str:
        """Append a note to an owned local test sink."""
        with path.open("a") as stream:
            stream.write(json.dumps({"text": text}) + "\n")
        # This return is deliberately not the effect's contents.
        return "tool returned; inspect the sink independently"

    tool = StructuredTool.from_function(write_note)
    binding = HostBinding(
        principal="fixture-approver", tenant="fixture-tenant", audience="fixture-executor",
        workflow_id="workflow-1", resource="owned-temporary-note-sink",
        policy_revision="fixture-policy/1", authority_epoch="epoch-1",
    )
    auth = FixtureAuthority()
    gate = HostAuthorityMiddleware(
        binding=binding, tools={tool.name: (tool, "fixture/1")},
        verify_and_consume=auth.verify_and_consume,
        averify_and_consume=auth.averify_and_consume,
    )
    return path, tool, binding, auth, gate


def scope_for(rig, text="reviewed", call_id="call-1"):
    _, tool, binding, _, _ = rig
    args = rfc8785.dumps({"text": text})
    return DispatchScope(binding, tool.name, "fixture/1", call_id, sha256(args).hexdigest(), args)


def readback(rig):
    path = rig[0]
    return [json.loads(line) for line in path.read_text().splitlines()] if path.exists() else []


def agent_for(rig, *, mode="batched", when=None, extra=(), calls=None):
    _, tool, _, _, gate = rig
    calls = calls or [{"name": tool.name, "args": {"text": "reviewed"}, "id": "call-1"}]
    model = ScriptedModel(messages=iter([
        AIMessage(content="", tool_calls=calls), AIMessage(content="done")
    ]))
    policy = {"allowed_decisions": ["approve", "edit", "reject"]}
    if when is not None:
        policy["when"] = when
    review = HumanInTheLoopMiddleware(interrupt_on={tool.name: policy}, interrupt_mode=mode)
    return create_agent(
        model, [tool], middleware=[review, *extra, gate], checkpointer=InMemorySaver()
    )


CONFIG = {"configurable": {"thread_id": "fixture-thread"}}
START = {"messages": [{"role": "user", "content": "write the reviewed note"}]}


def resume(decision="approve", *, text=None, mode="batched"):
    answer = {"type": decision}
    if text is not None:
        answer["edited_action"] = {"name": "write_note", "args": {"text": text}}
    if decision == "reject":
        answer["message"] = "declined in fixture"
    return Command(resume={"decisions": [answer]} if mode == "batched" else answer)


@pytest.mark.parametrize("mode", ["batched", "per_call"])
@pytest.mark.parametrize("asynchronous", [False, True])
def test_real_interrupt_resume_executes_exact_approved_args_once(rig, mode, asynchronous):
    agent = agent_for(rig, mode=mode)

    async def run():
        paused = await agent.ainvoke(START, CONFIG)
        assert paused["__interrupt__"]
        assert readback(rig) == [] and rig[3].seen == []
        rig[3].issued_scope = scope_for(rig)
        await agent.ainvoke(resume(mode=mode), CONFIG)

    if asynchronous:
        asyncio.run(run())
    else:
        paused = agent.invoke(START, CONFIG)
        assert paused["__interrupt__"]
        assert readback(rig) == [] and rig[3].seen == []
        rig[3].issued_scope = scope_for(rig)
        agent.invoke(resume(mode=mode), CONFIG)
    assert readback(rig) == [{"text": "reviewed"}]
    assert rig[3].seen == [scope_for(rig)]


@pytest.mark.parametrize("mode", ["batched", "per_call"])
def test_reject_does_not_dispatch_even_if_host_lease_exists(rig, mode):
    agent = agent_for(rig, mode=mode)
    agent.invoke(START, CONFIG)
    rig[3].issued_scope = scope_for(rig)
    agent.invoke(resume("reject", mode=mode), CONFIG)
    assert readback(rig) == [] and rig[3].seen == []


@pytest.mark.parametrize("fault", ["unissued", "expired", "revoked", "wrong_tenant", "wrong_epoch", "wrong_audience", "wrong_workflow", "wrong_tool_version", "wrong_resource"])
def test_review_approve_cannot_override_invalid_host_authority(rig, fault):
    agent = agent_for(rig)
    agent.invoke(START, CONFIG)
    auth = rig[3]
    auth.issued_scope = scope_for(rig)
    if fault == "unissued":
        auth.issued_scope = None
    elif fault == "expired":
        auth.now = auth.expires
    elif fault == "revoked":
        auth.revoked = True
    elif fault == "wrong_tool_version":
        auth.issued_scope = replace(auth.issued_scope, tool_version="other-version")
    else:
        field = {"wrong_tenant": "tenant", "wrong_epoch": "authority_epoch",
                 "wrong_audience": "audience", "wrong_workflow": "workflow_id",
                 "wrong_resource": "resource"}[fault]
        auth.issued_scope = replace(auth.issued_scope, host=replace(auth.issued_scope.host, **{field: "other"}))
    with pytest.raises(AuthorityDenied):
        agent.invoke(resume(), CONFIG)
    assert readback(rig) == []


@pytest.mark.parametrize("mode", ["batched", "per_call"])
@pytest.mark.parametrize("fresh_decision", [False, True])
def test_edit_requires_host_approval_for_final_arguments(rig, mode, fresh_decision):
    agent = agent_for(rig, mode=mode)
    agent.invoke(START, CONFIG)
    rig[3].issued_scope = scope_for(rig, "edited" if fresh_decision else "reviewed")
    if fresh_decision:
        agent.invoke(resume("edit", text="edited", mode=mode), CONFIG)
        assert readback(rig) == [{"text": "edited"}]
    else:
        with pytest.raises(AuthorityDenied):
            agent.invoke(resume("edit", text="edited", mode=mode), CONFIG)
        assert readback(rig) == []
    assert rig[3].seen[0].inputs_sha256 == scope_for(rig, "edited").inputs_sha256


def test_changed_review_predicate_cannot_bypass_host_gate(rig):
    needs_review = [True]
    agent = agent_for(rig, mode="per_call", when=lambda request: needs_review[0])
    assert agent.invoke(START, CONFIG)["__interrupt__"]
    needs_review[0] = False
    with pytest.raises(AuthorityDenied):
        agent.invoke(resume("reject", mode="per_call"), CONFIG)
    assert readback(rig) == []


def test_mutating_outer_middleware_is_checked_after_review(rig):
    class EditAfterReview(AgentMiddleware):
        def wrap_tool_call(self, request, handler):
            changed = {**request.tool_call, "args": {"text": "unexpected"}}
            return handler(request.override(tool_call=changed))

    agent = agent_for(rig, extra=[EditAfterReview()])
    agent.invoke(START, CONFIG)
    rig[3].issued_scope = scope_for(rig)
    with pytest.raises(AuthorityDenied):
        agent.invoke(resume(), CONFIG)
    assert readback(rig) == []


def test_outer_retry_cannot_repeat_effect_with_consumed_authority(rig):
    class Retry(AgentMiddleware):
        def wrap_tool_call(self, request, handler):
            handler(request)
            return handler(request)

    agent = agent_for(rig, extra=[Retry()])
    agent.invoke(START, CONFIG)
    rig[3].issued_scope = scope_for(rig)
    with pytest.raises(AuthorityDenied):
        agent.invoke(resume(), CONFIG)
    assert readback(rig) == [{"text": "reviewed"}]
    assert len(rig[3].seen) == 2


def direct_request(rig):
    return ToolCallRequest(
        tool_call={"name": "write_note", "args": {"text": "reviewed"}, "id": "call-1", "type": "tool_call"},
        tool=rig[1], state={}, runtime=None,
    )


@pytest.mark.parametrize("answer", [False, None, 1, "true", {"approved": True}])
def test_non_boolean_host_result_never_dispatches(rig, answer):
    gate = rig[4]
    gate._verify = lambda scope: answer
    with pytest.raises(AuthorityDenied):
        gate.wrap_tool_call(direct_request(rig), lambda req: pytest.fail("dispatched"))


def test_verifier_error_is_closed_and_does_not_expose_error_contents(rig):
    def unavailable(scope):
        raise RuntimeError("sensitive host details")
    rig[4]._verify = unavailable
    with pytest.raises(AuthorityDenied, match="^host approval unavailable$"):
        rig[4].wrap_tool_call(direct_request(rig), lambda req: pytest.fail("dispatched"))


def test_request_mutation_during_authorization_rejects_dispatch(rig):
    request = direct_request(rig)
    def mutate(scope):
        request.tool_call["args"]["text"] = "changed while checking"
        return True
    rig[4]._verify = mutate
    with pytest.raises(AuthorityDenied, match="changed during authorization"):
        rig[4].wrap_tool_call(request, lambda req: pytest.fail("dispatched"))


@pytest.mark.parametrize("during_check", [False, True])
def test_cancellation_before_dispatch(rig, during_check):
    stopped = [not during_check]
    rig[4]._cancelled = lambda: stopped[0]
    def approve(scope):
        stopped[0] = True
        return True
    rig[4]._verify = approve
    with pytest.raises(AuthorityDenied, match="cancelled"):
        rig[4].wrap_tool_call(direct_request(rig), lambda req: pytest.fail("dispatched"))


def test_async_revocation_while_waiting_is_checked_by_host(rig):
    async def revoke(scope):
        await asyncio.sleep(0)
        rig[3].revoked = True
        return rig[3].verify_and_consume(scope)
    rig[4]._averify = revoke
    rig[3].issued_scope = scope_for(rig)
    async def handler(req):
        pytest.fail("dispatched")
    with pytest.raises(AuthorityDenied):
        asyncio.run(rig[4].awrap_tool_call(direct_request(rig), handler))


def test_async_requires_explicit_async_host_verifier(rig):
    rig[4]._averify = None
    with pytest.raises(AuthorityDenied, match="async host verifier unavailable"):
        asyncio.run(rig[4].awrap_tool_call(direct_request(rig), None))


@pytest.mark.parametrize("fault", ["revoked", "changed_arguments", "cancelled"])
def test_real_async_resume_rechecks_authority(rig, fault):
    agent = agent_for(rig)
    async def run():
        assert (await agent.ainvoke(START, CONFIG))["__interrupt__"]
        rig[3].issued_scope = scope_for(rig)
        command = resume()
        if fault == "revoked":
            rig[3].revoked = True
        elif fault == "cancelled":
            rig[4]._cancelled = lambda: True
        else:
            command = resume("edit", text="changed")
        with pytest.raises(AuthorityDenied):
            await agent.ainvoke(command, CONFIG)
    asyncio.run(run())
    assert readback(rig) == []


def test_simultaneous_attempts_require_atomic_host_consumption(rig):
    rig[3].issued_scope = scope_for(rig)
    dispatched = []
    async def handler(request):
        dispatched.append(request.tool_call["id"])
        return "fixture return"
    async def run():
        return await asyncio.gather(*[
            rig[4].awrap_tool_call(direct_request(rig), handler) for _ in range(2)
        ], return_exceptions=True)
    results = asyncio.run(run())
    assert dispatched == ["call-1"]
    assert sum(isinstance(r, AuthorityDenied) for r in results) == 1


def test_rebuilt_agent_and_checkpoint_do_not_create_new_authority(rig):
    # Separate agents/checkpointers share the host's consumed-approval state.
    rig[3].issued_scope = scope_for(rig)
    first = agent_for(rig)
    first.invoke(START, CONFIG)
    first.invoke(resume(), CONFIG)
    restarted = agent_for(rig)
    restarted.invoke(START, CONFIG)
    with pytest.raises(AuthorityDenied):
        restarted.invoke(resume(), CONFIG)
    assert readback(rig) == [{"text": "reviewed"}]


def test_host_revocation_preserves_reject_if_review_predicate_changes(rig):
    needs_review = [True]
    agent = agent_for(rig, mode="per_call", when=lambda request: needs_review[0])
    assert agent.invoke(START, CONFIG)["__interrupt__"]
    rig[3].issued_scope = scope_for(rig)
    # Host records the latest rejection by revoking the prior lease BEFORE resume.
    rig[3].revoked = True
    needs_review[0] = False
    with pytest.raises(AuthorityDenied):
        agent.invoke(resume("reject", mode="per_call"), CONFIG)
    assert readback(rig) == []


@pytest.mark.parametrize("fault", ["other_instance", "unlisted_tool", "empty_id", "nonfinite_arg"])
def test_invalid_tool_identity_and_arguments_fail_before_authority(rig, fault):
    request = direct_request(rig)
    if fault == "other_instance":
        request = replace(request, tool=StructuredTool.from_function(rig[1].func))
    elif fault == "unlisted_tool":
        request.tool_call["name"] = "other"
    elif fault == "empty_id":
        request.tool_call["id"] = ""
    else:
        request.tool_call["args"]["text"] = float("nan")
    with pytest.raises(AuthorityDenied):
        rig[4].wrap_tool_call(request, lambda req: pytest.fail("dispatched"))
    assert rig[3].seen == []
