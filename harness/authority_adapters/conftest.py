"""Synthetic host fixture. It does not enroll or impersonate a real operator."""

import asyncio
import json
import socket
from threading import Lock
from types import SimpleNamespace

import pytest

from harness.authority_adapters.core import DispatchGate, HostBinding, scope_for


class FixtureAuthority:
    def __init__(self):
        self.issued_scope = None
        self.now = 100
        self.expires = 200
        self.revoked = False
        self.consumed = set()
        self.seen = []
        self.lock = Lock()

    async def verify(self, scope):
        await asyncio.sleep(0)
        with self.lock:
            self.seen.append(scope)
            key = (scope.host.workflow_id, scope.call_id)
            if (scope != self.issued_scope or self.now >= self.expires
                    or self.revoked or key in self.consumed):
                return False
            self.consumed.add(key)
            return True


@pytest.fixture(autouse=True)
def no_network(monkeypatch):
    monkeypatch.setenv("OTEL_SDK_DISABLED", "true")
    monkeypatch.setenv("AWS_EC2_METADATA_DISABLED", "true")
    monkeypatch.setenv("OPENAI_AGENTS_DISABLE_TRACING", "1")
    # A disabled provider with no processors avoids even constructing an exporter.
    from agents.tracing.provider import DefaultTraceProvider
    from agents.tracing.setup import set_trace_provider
    provider = DefaultTraceProvider()
    provider.set_disabled(True)
    set_trace_provider(provider)
    def blocked(*args, **kwargs):
        raise AssertionError("network is forbidden in the SDK harness")
    monkeypatch.setattr(socket.socket, "connect", blocked)
    monkeypatch.setattr(socket, "create_connection", blocked)


@pytest.fixture
def host(tmp_path):
    binding = HostBinding("fixture-operator", "fixture-tenant", "fixture-executor",
                          "fixture-workflow", "owned-temporary-sink", "policy/1", "epoch/1")
    auth = FixtureAuthority()
    path = tmp_path / "observed.jsonl"
    gate = DispatchGate(binding=binding, averify_and_consume=auth.verify)
    def expected(text="reviewed", call_id="call-1"):
        return scope_for(binding, "write_note", "fixture/1", call_id, {"text": text})
    def write(text):
        with path.open("a") as stream:
            stream.write(json.dumps({"text": text}) + "\n")
        return "tool returned; read the sink independently"
    def readback():
        return [json.loads(s) for s in path.read_text().splitlines()] if path.exists() else []
    return SimpleNamespace(binding=binding, auth=auth, gate=gate, expected=expected,
                           write=write, readback=readback)
