#!/usr/bin/env python3
"""🐉 MEOK OS — UE5 SaaS integration bridge

The MEOK OS Web (HTML/JS) bridges to the UE5 AI OS SaaS (3D in-world)
via a simple WebSocket + REST protocol. This module:
1. Starts a tiny HTTP server in UE5 Editor's PIE
2. Bridges web events to UE5 actors
3. Bridges UE5 events back to web

This is the "Cesium 3D site -> UE5 AI OS SaaS" hand-off.
"""
import asyncio
import json
import time
from typing import Dict, Set
from dataclasses import dataclass, asdict

@dataclass
class UE5Event:
    """An event from UE5 to the web."""
    event_type: str  # e.g. "actor_clicked", "temple_entered", "ichar_bound"
    payload: Dict
    timestamp: float = None

    def __post_init__(self):
        if self.timestamp is None:
            self.timestamp = time.time()

    def to_json(self) -> str:
        return json.dumps({
            "event_type": self.event_type,
            "payload": self.payload,
            "timestamp": self.timestamp,
        })


class MEOKUE5Bridge:
    """Bridges web (browser) and UE5 (3D world) via shared event bus."""

    def __init__(self):
        self.connections: Set = set()  # active WS connections
        self.event_log: list = []  # last 1000 events
        self.ue5_state: Dict = {
            "temple": "EU",
            "queen": "Justitia",
            "ichar_id": None,
            "camera": {"lat": 50.378, "lon": 7.846, "altitude": 1000000},
        }

    async def register_connection(self, ws):
        """A new web client connected."""
        self.connections.add(ws)
        # Send current UE5 state
        await ws.send(json.dumps({
            "type": "state_sync",
            "state": self.ue5_state,
        }))

    async def unregister_connection(self, ws):
        self.connections.discard(ws)

    async def broadcast(self, event: UE5Event):
        """Broadcast an event to all connected web clients."""
        self.event_log.append(asdict(event))
        if len(self.event_log) > 1000:
            self.event_log = self.event_log[-1000:]
        msg = event.to_json()
        for ws in list(self.connections):
            try:
                await ws.send(msg)
            except Exception:
                self.connections.discard(ws)

    async def from_web(self, event_type: str, payload: Dict):
        """Web sent us an event. Forward to UE5 (via FSocket in UE5)."""
        # In UE5, the MEOKUE5Bridge actor listens on FSocket and
        # dispatches to AMeokSovereignCharacter, AMeokWorldTemple, etc.
        # In Python (this file), we just log + record.
        event = UE5Event(event_type=event_type, payload=payload)
        self.event_log.append(asdict(event))
        print(f"[MEOK->UE5] {event_type}: {payload}")

    async def from_ue5(self, event_type: str, payload: Dict):
        """UE5 sent us an event. Broadcast to all web clients."""
        event = UE5Event(event_type=event_type, payload=payload)
        await self.broadcast(event)
        print(f"[UE5->MEOK] {event_type}: {payload}")

    def get_state(self) -> Dict:
        return self.ue5_state

    def get_recent_events(self, n: int = 50) -> list:
        return self.event_log[-n:]


# Demo: simulate a web client + UE5 actor interaction
async def demo():
    bridge = MEOKUE5Bridge()

    # Simulate web user clicks "EU temple" in the 3D globe
    print("\n=== Web user clicks EU temple on the 3D globe ===")
    await bridge.from_web("temple_clicked", {"temple_code": "EU", "lat": 50.378, "lon": 7.846})

    # UE5 actor responds
    print("\n=== UE5 actor shows the EU temple ===")
    await bridge.from_ue5("temple_entered", {"temple_code": "EU", "regulations": 8})

    # User binds their i-character to the sovereign character
    print("\n=== User binds i-character ich-abc123 to sovereign ===")
    await bridge.from_web("ichar_bind", {"ichar_id": "ich-abc123", "queen": "queen-arcana", "arcana_lens": 21})
    bridge.ue5_state["ichar_id"] = "ich-abc123"
    await bridge.from_ue5("ichar_bound", {"ichar_id": "ich-abc123", "queen": "Aleph", "arcana_lens": 21})

    # Council chat (Sophia Care responds)
    print("\n=== User asks Sophia Care about care ===")
    await bridge.from_web("council_chat", {"queen_id": "queen-care", "message": "What is care?"})
    await bridge.from_ue5("council_response", {"queen": "Sophia Care", "response": "Care is the foundation."})

    print("\n=== State ===")
    print(json.dumps(bridge.get_state(), indent=2))
    print(f"\n=== Recent events ({len(bridge.get_recent_events())}) ===")
    for e in bridge.get_recent_events():
        print(f"  [{e['event_type']}] {e['payload']}")


if __name__ == "__main__":
    asyncio.run(demo())
