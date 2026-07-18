"""Tests for MEOK UE5 SaaS bridge."""
import asyncio
import sys
import subprocess
from pathlib import Path

BRIDGE = Path("/Users/nicholas/clawd/ue5_integration/meok_ue5_bridge.py")


def test_file_exists():
    assert BRIDGE.exists()
    assert BRIDGE.stat().st_size > 3000


def test_ue5_event_dataclass():
    """UE5Event must serialize to JSON correctly."""
    sys.path.insert(0, str(BRIDGE.parent))
    from meok_ue5_bridge import UE5Event
    e = UE5Event("test_event", {"foo": "bar"})
    j = e.to_json()
    import json
    d = json.loads(j)
    assert d["event_type"] == "test_event"
    assert d["payload"]["foo"] == "bar"
    assert d["timestamp"] > 0


def test_bridge_initial_state():
    """Bridge starts with default UE5 state."""
    sys.path.insert(0, str(BRIDGE.parent))
    from meok_ue5_bridge import MEOKUE5Bridge
    b = MEOKUE5Bridge()
    state = b.get_state()
    assert state["temple"] == "EU"
    assert state["queen"] == "Justitia"
    assert state["ichar_id"] is None
    assert "camera" in state
    assert state["camera"]["altitude"] == 1000000


def test_bridge_broadcast():
    """Bridge broadcasts UE5 events to all web clients."""
    sys.path.insert(0, str(BRIDGE.parent))
    from meok_ue5_bridge import MEOKUE5Bridge, UE5Event

    async def run():
        b = MEOKUE5Bridge()
        received = []

        class FakeWS:
            def __init__(self):
                self.sent = []
            async def send(self, msg):
                self.sent.append(msg)
        ws1, ws2 = FakeWS(), FakeWS()
        await b.register_connection(ws1)
        await b.register_connection(ws2)
        await b.from_ue5("test", {"data": 123})
        # Both should have received
        assert len(ws1.sent) == 2  # state_sync + test
        assert len(ws2.sent) == 2
        # The 2nd message should be the test
        import json
        test_msg = json.loads(ws1.sent[1])
        assert test_msg["event_type"] == "test"
        assert test_msg["payload"]["data"] == 123

    asyncio.run(run())


def test_bridge_unregister():
    """Unregister removes a connection."""
    sys.path.insert(0, str(BRIDGE.parent))
    from meok_ue5_bridge import MEOKUE5Bridge

    async def run():
        b = MEOKUE5Bridge()

        class FakeWS:
            def __init__(self):
                self.sent = []
            async def send(self, msg):
                self.sent.append(msg)
        ws = FakeWS()
        await b.register_connection(ws)
        assert len(b.connections) == 1
        await b.unregister_connection(ws)
        assert len(b.connections) == 0

    asyncio.run(run())


def test_bridge_event_log_size_limit():
    """Event log is capped at 1000 events."""
    sys.path.insert(0, str(BRIDGE.parent))
    from meok_ue5_bridge import MEOKUE5Bridge

    async def run():
        b = MEOKUE5Bridge()
        for i in range(1500):
            await b.from_ue5("test", {"i": i})
        assert len(b.event_log) <= 1000

    asyncio.run(run())


def test_bridge_recent_events():
    """get_recent_events returns the latest N events."""
    sys.path.insert(0, str(BRIDGE.parent))
    from meok_ue5_bridge import MEOKUE5Bridge

    async def run():
        b = MEOKUE5Bridge()
        for i in range(20):
            await b.from_ue5(f"event_{i}", {"i": i})
        recent = b.get_recent_events(5)
        assert len(recent) == 5
        assert recent[-1]["event_type"] == "event_19"

    asyncio.run(run())


def test_bridge_state_update():
    """UE5 state can be updated when i-character binds."""
    sys.path.insert(0, str(BRIDGE.parent))
    from meok_ue5_bridge import MEOKUE5Bridge

    async def run():
        b = MEOKUE5Bridge()
        assert b.get_state()["ichar_id"] is None
        b.ue5_state["ichar_id"] = "ich-abc123"
        assert b.get_state()["ichar_id"] == "ich-abc123"

    asyncio.run(run())


def test_bridge_event_types():
    """Bridge supports all event types: temple, ichar, council, cascade."""
    sys.path.insert(0, str(BRIDGE.parent))
    from meok_ue5_bridge import MEOKUE5Bridge

    async def run():
        b = MEOKUE5Bridge()
        # Web -> UE5
        await b.from_web("temple_clicked", {"code": "EU"})
        await b.from_web("ichar_bind", {"ichar_id": "ich-1"})
        await b.from_web("council_chat", {"queen": "queen-care", "message": "hi"})
        await b.from_web("cascade_query", {"query": "test"})
        # UE5 -> Web
        await b.from_ue5("temple_entered", {"code": "EU"})
        await b.from_ue5("ichar_bound", {"ichar_id": "ich-1"})
        await b.from_ue5("council_response", {"response": "hello"})
        await b.from_ue5("cascade_tier", {"tier": "T2"})
        # Verify all events in log
        assert len(b.event_log) == 8

    asyncio.run(run())


def test_bridge_ichar_persistence():
    """i-character ID persists across web <-> ue5 events."""
    sys.path.insert(0, str(BRIDGE.parent))
    from meok_ue5_bridge import MEOKUE5Bridge

    async def run():
        b = MEOKUE5Bridge()
        await b.from_web("ichar_bind", {"ichar_id": "ich-test-123"})
        b.ue5_state["ichar_id"] = "ich-test-123"
        await b.from_ue5("ichar_bound", {"ichar_id": "ich-test-123"})
        # State should still be bound
        assert b.get_state()["ichar_id"] == "ich-test-123"
        # Web asks "what's bound?"
        await b.from_web("ichar_status", {})

    asyncio.run(run())


if __name__ == "__main__":
    sys.exit(subprocess.call([sys.executable, "-m", "pytest", __file__, "-v"]))
