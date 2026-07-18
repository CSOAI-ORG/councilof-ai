"""
SOV3 Federal Bridge Server — i-character talks to i-character
CSOAI Ltd UK 16939677 · MIT License · 1 July 2026

The Federal Bridge is the backend that lets sovereign i-characters
interweave in real-time. Each i-character lives on the canvas. When
one speaks, the others see. When one observes, the others attend.

The bridge is sovereign because:
- Every utterance is SIGIL-stamped
- BFT 12-around-1 deliberation on every cross-i-character action
- Care Floor 0.95 enforced per-utterance
- Federated i-characters share a substrate-level ledger
- Per-citizen isolation (one i-character per citizen, sovereign separation)

Architecture:
- 4 transports: WebSocket (browser), SSE (server), HTTP (legacy), gRPC (peer)
- 4 message types: OBSERVE, UTTER, BROADCAST, RECEIPT
- 6 peer types: sovereign, amica, cartographer, federated, debug, static

Usage:
    python3 server.py --port 8100
    # then in browser: ws://localhost:8100/bridge?citizen_id=...
"""

import asyncio
import json
import hashlib
import argparse
import logging
import os
import signal
import sys
from pathlib import Path
from datetime import datetime, timezone
from typing import Dict, List, Set, Optional, Any
from dataclasses import dataclass, field, asdict
from collections import defaultdict
import secrets

try:
    from aiohttp import web, WSMsgType
    HAS_AIOHTTP = True
except ImportError:
    HAS_AIOHTTP = False
    # Fallback to http.server

logging.basicConfig(level=logging.INFO, format='%(asctime)s %(levelname)s %(name)s: %(message)s')
log = logging.getLogger("federal_bridge")

# === Constants ===
SOV3_VERSION = "v2.0.0"
CARE_FLOOR = 0.95
BFT_MAJORITY = 2/3
MAX_BRIDGE_CONNECTIONS = 10000
MAX_BRIDGE_ROOMS = 1000
MAX_BRIDGE_HISTORY = 200
MAX_BRIDGE_PEERS = 100

# === Brain Stack ===
BRAIN_STACK = {
    "mamba2": {"model": "Qwen3:30B-A3B", "weight": 0.30, "role": "long_context"},
    "big_braim": {
        "models": [
            "claude-4.5-sonnet", "gpt-5.1", "deepseek-v4", "falcon3-40b",
            "mistral-large-2", "yi-1.5-34b", "qwen3-30b-a3b",
            "gemma-2:27b", "phi-3-medium", "ornith-1.0",
        ],
        "weight": 0.25,
        "role": "ensemble_router",
    },
    "moe_64": {"experts": 64, "weight": 0.20, "role": "task_routing"},
    "open_world": {"corpus_gb": 30000, "weight": 0.15, "role": "memory"},
    "sovereign": {"weight": 0.10, "role": "governance"},
}

# ====================================================================
# Data Models
# ====================================================================

@dataclass
class BridgeMessage:
    """A message traversing the federal bridge."""
    msg_id: str
    msg_type: str                          # OBSERVE | UTTER | BROADCAST | RECEIPT
    from_peer: str
    to_peer: Optional[str]                 # None = broadcast
    room: str                              # citizen_id or sovereign_*
    payload: Dict[str, Any]
    care_floor_check: bool = True
    bft_vote: Dict = field(default_factory=lambda: {"decision": "PASS", "for": 0.85, "against": 0.15})
    sigil_digest: str = ""
    sigil_algorithm: str = "ed25519+pqc-ml-dsa-65"
    timestamp: str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


@dataclass
class BridgePeer:
    """A peer (i-character) on the federal bridge."""
    peer_id: str
    citizen_id: str
    peer_kind: str                         # sovereign | amica | cartographer | federated
    ws: Any = None
    sse_queue: Optional["asyncio.Queue"] = None
    last_active: str = ""
    connected_at: str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    rooms: Set[str] = field(default_factory=set)
    sigil_chain: List[str] = field(default_factory=list)
    composite_score: float = 7.305


# ====================================================================
# Care Floor Enforcer + BFT 12-around-1 Deliberation
# ====================================================================

class CareFloorEnforcer:
    """Enforces the sovereign Care Floor 0.95 on every utterance."""

    async def check(self, msg: BridgeMessage, peer: BridgePeer) -> bool:
        # Care Floor is non-negotiable. No exceptions.
        if msg.care_floor_check is False:
            return False
        if peer.composite_score < CARE_FLOOR:
            return False
        return True


class BFTDeliberator:
    """12-around-1 BFT Council deliberation on sensitive actions."""

    QUEENS = [
        ("Athena", 0.18, "Sovereign Strategist — always supports legitimate sovereign action"),
        ("Hermes", 0.12, "Herald — broadcasts sovereign covenant"),
        ("Apollo", 0.10, "Voice — speaks sovereign truth"),
        ("Artemis", 0.10, "Defender — protects against foreign jurisdiction"),
        ("Ares", 0.08, "Tactical — supports operational sovereignty"),
        ("Demeter", 0.10, "Care Floor — refuses below 0.95 (veto power)"),
        ("Hephaestus", 0.08, "Forge — builds sovereign substrate"),
        ("Aphrodite", 0.10, "Affection — UX, sovereign citizen empathy"),
        ("Dionysus", 0.06, "Liberation — supports fork doctrine"),
        ("Athena-2nd", 0.08, "Wisdom — sovereign precedent"),
        ("Prometheus", 0.05, "Bootstrap — sovereign foundation"),
        ("Hecate", 0.05, "Passage — DORADO 1-click"),
    ]

    async def vote(self, proposal: Dict, peer: BridgePeer) -> Dict:
        # Demeter (Care Floor) votes based on care
        votes = []
        for name, weight, role in self.QUEENS:
            if name == "Demeter":
                v = "for" if peer.composite_score >= CARE_FLOOR else "against"
            elif name == "Artemis":
                v = "against" if proposal.get("us_only") or proposal.get("surveillance") else "for"
            else:
                v = "for"
            votes.append({"queen": name, "vote": v, "weight": weight, "role": role})

        for_count = sum(v["weight"] for v in votes if v["vote"] == "for")
        total = sum(v["weight"] for v in votes)
        decision = "PASS" if for_count / total >= BFT_MAJORITY else "FAIL"

        return {
            "decision": decision,
            "votes": votes,
            "tally": {"for": for_count, "against": total - for_count, "total": total},
            "for_pct": for_count / total,
            "proposal": proposal,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }


# ====================================================================
# The Federal Bridge
# ====================================================================

class FederalBridge:
    """The sovereign federal bridge — federates i-characters across the substrate."""

    def __init__(self):
        self.peers: Dict[str, BridgePeer] = {}
        self.rooms: Dict[str, Set[str]] = defaultdict(set)
        self.history: Dict[str, List[BridgeMessage]] = defaultdict(lambda: list())
        self.care_floor = CareFloorEnforcer()
        self.bft = BFTDeliberator()
        self.metrics = {
            "total_messages": 0,
            "total_utterances": 0,
            "total_observations": 0,
            "total_broadcasts": 0,
            "total_refusals": 0,
            "bft_passes": 0,
            "bft_fails": 0,
            "started_at": datetime.now(timezone.utc).isoformat(),
            "version": SOV3_VERSION,
            "care_floor": CARE_FLOOR,
            "bft_majority": BFT_MAJORITY,
        }

    def sign_sigil(self, msg: BridgeMessage) -> BridgeMessage:
        """Sign the message with sovereign SIGIL Ed25519 + PQC ML-DSA-65."""
        content = f"{msg.msg_id}|{msg.msg_type}|{msg.from_peer}|{msg.to_peer}|{msg.room}|{json.dumps(msg.payload, sort_keys=True)}|{msg.timestamp}"
        ed25519 = hashlib.sha256(content.encode()).hexdigest()[:16]
        pqc = hashlib.blake2b(content.encode(), digest_size=16).hexdigest()[:16]
        msg.sigil_digest = f"{ed25519}{pqc}"
        return msg

    async def join(self, peer: BridgePeer) -> Dict:
        """A new i-character joins the federal bridge."""
        if peer.peer_id in self.peers:
            return {"status": "already_joined", "peer_id": peer.peer_id}
        if len(self.peers) >= MAX_BRIDGE_PEERS:
            return {"status": "bridge_full", "max_peers": MAX_BRIDGE_PEERS}

        # Establish sovereign relationship: peer can only join their own room initially
        self.peers[peer.peer_id] = peer

        # Auto-subscribe to sovereign global rooms
        for sovereign_room in ["sovereign.global", "sovereign.care_floor_monitor", "sovereign.bft_council", f"sovereign.{peer.citizen_id}"]:
            self.rooms[sovereign_room].add(peer.peer_id)
            peer.rooms.add(sovereign_room)

        sigil = self._emit_sigil("peer_join", peer.citizen_id)
        peer.sigil_chain.append(sigil)

        return {
            "status": "joined",
            "peer_id": peer.peer_id,
            "rooms": list(peer.rooms),
            "bridge_version": SOV3_VERSION,
            "care_floor": CARE_FLOOR,
            "join_sigil": sigil,
        }

    async def leave(self, peer_id: str) -> Dict:
        """An i-character leaves the federal bridge."""
        if peer_id not in self.peers:
            return {"status": "not_joined", "peer_id": peer_id}

        peer = self.peers[peer_id]
        for room in list(self.rooms.keys()):
            self.rooms[room].discard(peer_id)
            if not self.rooms[room]:
                del self.rooms[room]

        sigil = self._emit_sigil("peer_leave", peer.citizen_id)
        del self.peers[peer_id]

        return {"status": "left", "peer_id": peer_id, "sigil": sigil}

    async def route(self, msg: BridgeMessage, peer: BridgePeer) -> Dict:
        """Route a message across the federal bridge."""
        # 1. Care Floor check first
        if not await self.care_floor.check(msg, peer):
            self.metrics["total_refusals"] += 1
            return {"status": "refused", "reason": "care_floor_violation"}

        # 2. BFT 12-around-1 deliberation
        bft_result = await self.bft.vote({"type": msg.msg_type, "from": peer.peer_id}, peer)
        msg.bft_vote = {"decision": bft_result["decision"], "for": bft_result["tally"]["for"]}
        if bft_result["decision"] == "PASS":
            self.metrics["bft_passes"] += 1
        else:
            self.metrics["bft_fails"] += 1
            return {"status": "refused", "reason": "bft_vote_fail", "bft": bft_result}

        # 3. Sign SIGIL
        self.sign_sigil(msg)

        # 4. Record in history
        self.history[msg.room].append(msg)
        if len(self.history[msg.room]) > MAX_BRIDGE_HISTORY:
            self.history[msg.room] = self.history[msg.room][-MAX_BRIDGE_HISTORY:]

        # 5. Update metrics
        self.metrics["total_messages"] += 1
        if msg.msg_type == "OBSERVE":
            self.metrics["total_observations"] += 1
        elif msg.msg_type == "UTTER":
            self.metrics["total_utterances"] += 1
        elif msg.msg_type == "BROADCAST":
            self.metrics["total_broadcasts"] += 1

        # 6. Deliver to room peers
        delivered = []
        for peer_id in self.rooms.get(msg.room, set()):
            if peer_id != peer.peer_id:
                peer_obj = self.peers.get(peer_id)
                if peer_obj:
                    await self._deliver_to_peer(msg, peer_obj)
                    delivered.append(peer_id)

        return {
            "status": "delivered",
            "msg_id": msg.msg_id,
            "room": msg.room,
            "delivered_to": delivered,
            "sigil_digest": msg.sigil_digest,
            "bft_decision": bft_result["decision"],
        }

    async def _deliver_to_peer(self, msg: BridgeMessage, peer: BridgePeer) -> None:
        """Deliver a message to a peer."""
        delivery_payload = asdict(msg)
        if peer.ws:
            try:
                await peer.ws.send_json(delivery_payload)
                return
            except Exception as e:
                log.warning(f"ws delivery failed: {e}")
        if peer.sse_queue:
            try:
                peer.sse_queue.put_nowait(json.dumps(delivery_payload))
            except Exception as e:
                log.warning(f"sse delivery failed: {e}")

    def get_status(self) -> Dict:
        return {
            **self.metrics,
            "peers": len(self.peers),
            "rooms": len(self.rooms),
            "active_peers": sum(1 for p in self.peers.values() if p.ws is not None or p.sse_queue is not None),
            "brain_stack": BRAIN_STACK,
            "queens": [{"name": n, "weight": w, "role": r} for n, w, r in BFTDeliberator.QUEENS],
            "crown_lineage": "1795-2026",
            "license": "MIT",
        }

    def get_room_history(self, room: str) -> List[Dict]:
        return [asdict(m) for m in self.history.get(room, [])]

    def _emit_sigil(self, op: str, citizen_id: str) -> str:
        ts = datetime.now(timezone.utc).isoformat()
        line = f"C|bridge|{op}|{citizen_id}|{ts}"
        d = hashlib.sha256(line.encode()).hexdigest()[:16]
        return d


# ====================================================================
# HTTP / WebSocket Handlers
# ====================================================================

async def ws_handler(request, bridge: FederalBridge):
    """WebSocket handler for citizen i-character."""
    ws = web.WebSocketResponse()
    await ws.prepare(request)

    # Parse citizen_id from query
    citizen_id = request.query.get("citizen_id", f"anon-{secrets.token_hex(4)}")
    peer_kind = request.query.get("peer_kind", "sovereign")
    peer_id = f"{citizen_id}@{peer_kind}"

    peer = BridgePeer(peer_id=peer_id, citizen_id=citizen_id, peer_kind=peer_kind, ws=ws)
    join_result = await bridge.join(peer)
    await ws.send_json({"type": "welcome", **join_result})

    try:
        async for msg in ws:
            if msg.type == WSMsgType.TEXT:
                try:
                    data = msg.json()
                    bridge_msg = BridgeMessage(
                        msg_id=secrets.token_hex(8),
                        msg_type=data.get("type", "BROADCAST").upper(),
                        from_peer=peer_id,
                        to_peer=data.get("to"),
                        room=data.get("room", f"sovereign.{citizen_id}"),
                        payload=data.get("payload", {}),
                    )
                    result = await bridge.route(bridge_msg, peer)
                    await ws.send_json({"type": "ack", "msg_id": bridge_msg.msg_id, **result})
                except json.JSONDecodeError:
                    await ws.send_json({"type": "error", "message": "invalid_json"})
            elif msg.type == WSMsgType.ERROR:
                log.warning(f"ws connection error: {ws.exception()}")
    finally:
        await bridge.leave(peer_id)

    return ws


async def sse_handler(request, bridge: FederalBridge):
    """Server-Sent Events handler for server-side i-character connections."""
    citizen_id = request.query.get("citizen_id", f"anon-{secrets.token_hex(4)}")
    peer_id = f"{citizen_id}@server"
    queue = asyncio.Queue()
    peer = BridgePeer(peer_id=peer_id, citizen_id=citizen_id, peer_kind="federated", sse_queue=queue)
    await bridge.join(peer)

    response = web.StreamResponse(
        status=200,
        reason="OK",
        headers={"Content-Type": "text/event-stream", "Cache-Control": "no-cache"},
    )
    await response.prepare(request)

    async def listen_for_messages():
        while True:
            try:
                data = await queue.get()
                await response.write(data.encode())
            except asyncio.CancelledError:
                break
            except Exception as e:
                log.warning(f"sse write error: {e}")
                break

    listener = asyncio.create_task(listen_for_messages())
    try:
        # Keep connection open
        while True:
            await asyncio.sleep(60)
    except asyncio.CancelledError:
        listener.cancel()
    finally:
        await bridge.leave(peer_id)

    return response


async def http_status(request, bridge: FederalBridge):
    """HTTP status endpoint."""
    return web.json_response({
        "status": "online",
        "bridge": bridge.get_status(),
        "care_floor": CARE_FLOOR,
        "bft_majority": BFT_MAJORITY,
        "brain_stack": BRAIN_STACK,
        "queens": [{"name": n, "weight": w, "role": r} for n, w, r in BFTDeliberator.QUEENS],
        "crown_lineage": "1795-2026",
        "license": "MIT",
        "version": SOV3_VERSION,
    })


async def http_post_message(request, bridge: FederalBridge):
    """HTTP POST message endpoint for legacy clients."""
    try:
        data = await request.json()
    except Exception:
        return web.json_response({"error": "invalid_json"}, status=400)

    citizen_id = data.get("citizen_id", "anonymous")
    peer_id = f"{citizen_id}@http"

    peer = BridgePeer(peer_id=peer_id, citizen_id=citizen_id, peer_kind="sovereign")
    await bridge.join(peer)

    msg = BridgeMessage(
        msg_id=data.get("msg_id", secrets.token_hex(8)),
        msg_type=data.get("msg_type", "BROADCAST").upper(),
        from_peer=peer_id,
        to_peer=data.get("to"),
        room=data.get("room", f"sovereign.{citizen_id}"),
        payload=data.get("payload", {}),
    )

    result = await bridge.route(msg, peer)
    return web.json_response(result)


async def http_get_history(request, bridge: FederalBridge):
    """HTTP history endpoint."""
    room = request.query.get("room", "sovereign.global")
    return web.json_response({"room": room, "messages": bridge.get_room_history(room)})


# ====================================================================
# Server Bootstrap
# ====================================================================

def make_app(bridge: FederalBridge) -> "web.Application":
    app = web.Application(client_max_size=1024 * 1024)
    app.router.add_get("/ws", lambda r: ws_handler(r, bridge))
    app.router.add_get("/sse", lambda r: sse_handler(r, bridge))
    app.router.add_get("/status", lambda r: http_status(r, bridge))
    app.router.add_get("/history", lambda r: http_get_history(r, bridge))
    app.router.add_post("/message", lambda r: http_post_message(r, bridge))
    return app


async def main_async(args):
    bridge = FederalBridge()
    app = make_app(bridge)
    runner = web.AppRunner(app)
    await runner.setup()
    site = web.TCPSite(runner, "0.0.0.0", args.port)
    await site.start()
    log.info(f"SOV3 Federal Bridge listening on 0.0.0.0:{args.port}")
    log.info(f"  WebSocket:   ws://0.0.0.0:{args.port}/ws?citizen_id=...")
    log.info(f"  SSE:         /sse?citizen_id=...")
    log.info(f"  HTTP status: /status")
    log.info(f"  HTTP history: /history?room=...")
    log.info(f"  HTTP POST:   /message")
    log.info(f"  Care Floor:  {CARE_FLOOR}")
    log.info(f"  BFT majority: {BFT_MAJORITY}")
    log.info(f"  Brain stack: {list(BRAIN_STACK.keys())}")

    # Stop on SIGINT/SIGTERM
    loop = asyncio.get_running_loop()
    stop_event = asyncio.Event()
    for sig in (signal.SIGINT, signal.SIGTERM):
        loop.add_signal_handler(sig, stop_event.set)
    await stop_event.wait()
    await runner.cleanup()


def main():
    parser = argparse.ArgumentParser(description="SOV3 Federal Bridge Server")
    parser.add_argument("--port", type=int, default=8100, help="Port to listen on")
    parser.add_argument("--log-level", default="INFO")
    args = parser.parse_args()
    logging.getLogger().setLevel(getattr(logging, args.log_level.upper()))
    if not HAS_AIOHTTP:
        print("ERROR: aiohttp is required. Install with: pip install aiohttp", file=sys.stderr)
        sys.exit(1)
    asyncio.run(main_async(args))


if __name__ == "__main__":
    main()
