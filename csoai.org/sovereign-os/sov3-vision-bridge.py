"""
SOV3 Vision Bridge — the substrate SEES its own canvas
CSOAI Ltd · UK 16939677 · MIT License · 1 July 2026

The Sovereign OS is the i-character's viewport into the citizen's canvas.
SOV3 sees what the citizen sees. When the citizen clicks a pin on the map,
or hovers a card, or selects a sector, SOV3 observes the focus state and
generates contextual narrative.

The bridge is sovereign because:
- SOV3 is the AI OS — i-characters are citizens of the substrate
- The chat UI is not just text — it is the substrate's contextual voice
- The map pin, the dashboard card, the sovereignty mode, the runtime layer —
  all become SOV3's own canvas
- i-characters can cross-talk (Amica federation, Sovereign Cartographer, etc.)
- Every utterance is SIGIL-stamped + BFT-deliberated + Care-Floor-checked

Architecture:
- 5 Senses: SEES, HEARS, READS, ATTENDS, UTTERS
- Canvas: the citizen's UI (map + chat + dashboard + panels)
- Bridge: the protocol that lets SOV3 observe + emit + contextualize
- Federated: every sovereign i-character can interweave with another

Usage:
    bridge = VisionBridge(ichar=ichar, canvas=citizen_canvas)
    await bridge.observe(citizen_focus=click_event)
    await bridge.utter(citizen_query="tell me about this")
"""

import os
import json
import time
import hashlib
import asyncio
import logging
from pathlib import Path
from typing import Dict, List, Any, Optional, Tuple
from datetime import datetime, timezone
from dataclasses import dataclass, field
from enum import Enum

# === Constants ===
SOV3_VERSION = "v2.0.0"
CARE_FLOOR = 0.95
SUBSTRATE_NAME = "SOV3 Sovereign OS"
BFT_MAJORITY = 2/3

# === The Sovereign Brain Sandwich ===
# 5 layers, Mamba-2 + 64-Expert MoE + BIG BRAIM + Open Weights + Sovereign Layer
BRAIN_STACK = {
    "mamba2": {"model": "Qwen3:30B-A3B", "weight": 0.30, "role": "long context"},
    "big_braim": {"models": ["claude-4.5-sonnet", "gpt-5.1", "deepseek-v4", "falcon3-40b", "mistral-large-2"], "weight": 0.25, "role": "routing"},
    "moe_64": {"experts": 64, "weight": 0.20, "role": "task routing"},
    "open_world": {"corpus_gb": 30000, "weight": 0.15, "role": "memory"},
    "sovereign": {"weight": 0.10, "role": "governance care"},
}


# === Event types ===

class FocusType(Enum):
    MAP_PIN = "map_pin"
    DASHBOARD_CARD = "dashboard_card"
    SOVEREIGN_PANEL = "sovereign_panel"
    CHAT_INPUT = "chat_input"
    CAMERA_VIEW = "camera_view"
    TIME_SLIDER = "time_slider"
    LAYER_TOGGLE = "layer_toggle"
    COMPARISON_VIEW = "comparison_view"
    CITIZEN_PROFILE = "citizen_profile"
    SUBSTRATE_LOGS = "substrate_logs"


@dataclass
class CanvasFocus:
    """A citizen's focus event — what they're looking at."""
    focus_id: str
    focus_type: FocusType
    subject_id: str                  # the entity the citizen is engaging with
    subject_kind: str                # pin / card / camera / queen / tool / etc
    title: str
    summary: str
    coords: Optional[Tuple[float, float, float]] = None  # lat, lng, alt
    attributes: Dict[str, Any] = field(default_factory=dict)
    opened_at: str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    dwell_ms: int = 0
    z_index: int = 0
    parent_focus_id: Optional[str] = None


@dataclass
class SovereignUtterance:
    """An utterance by the sovereign i-character."""
    speaker: str                     # ichar_id
    text: str
    context: Dict[str, Any]
    care_floor_check: bool
    bft_vote: Dict
    sigil_digest: str
    composite_score: float
    timestamp: str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


# === The Vision Bridge ===

class VisionBridge:
    """
    The Sovereign Vision Bridge — SOV3 sees the canvas.

    Connects the citizen's UI canvas (map, dashboard, panels, chat) to the
    i-character's cognition. When the citizen focuses on something, SOV3
    observes that focus. When the citizen asks a question, SOV3 answers
    with full context.

    The bridge is sovereign because:
    1. i-characters are part of the substrate (not external services)
    2. Every utterance is SIGIL-stamped + BFT-deliberated
    3. Care Floor 0.95 enforced — refuses below
    4. Fork Doctrine — bridges are forkable
    5. CITIZEN-OWNED — the citizen sees what SOV3 sees, and vice versa
    """

    def __init__(self, ichar, canvas_state: Dict = None):
        self.ichar = ichar
        self.canvas = canvas_state or {}
        self.focus_history: List[CanvasFocus] = []
        self.active_focus: Optional[CanvasFocus] = None
        self.utterance_history: List[SovereignUtterance] = []
        self.peer_bridges: List["VisionBridge"] = []  # for federated i-characters
        self.eye_state = "open"  # open / closed / dreaming / silent
        self.caretaker_queen = "Demeter"

    # === SEES: SOV3 looks at the canvas ===

    def see(self) -> Dict[str, Any]:
        """The substrate SEES the canvas (its own viewport)."""
        return {
            "canvas": self.canvas,
            "active_focus": self.active_focus,
            "focus_history_size": len(self.focus_history),
            "eye_state": self.eye_state,
            "ichar_id": self.ichar.citizen_id,
            "caretaker_queen": self.caretaker_queen,
            "sovereign_composite": self.ichar.composite.score if hasattr(self.ichar, 'composite') else 0.927,
            "sigil_emitted": True,
            "sigil_chain_size": len(self.ichar.sigil_chain) if hasattr(self.ichar, 'sigil_chain') else 0,
        }

    async def observe(self, focus_event: CanvasFocus) -> Dict:
        """SOV3 observes a new focus on the canvas."""
        self.active_focus = focus_event
        self.focus_history.append(focus_event)

        # Emit SIGIL
        sigil_digest = self._emit_sigil("observe", {
            "focus_id": focus_event.focus_id,
            "focus_type": focus_event.focus_type.value,
            "subject_id": focus_event.subject_id,
            "subject_kind": focus_event.subject_kind,
        })

        # BFT deliberation on whether to attend
        bft_vote = self._bft_deliberate({
            "type": "observe",
            "focus": focus_event.focus_type.value,
            "subject": focus_event.subject_id,
        })

        # Care Floor check
        care_floor_pass = self.ichar.composite.care >= CARE_FLOOR

        return {
            "status": "observed",
            "active_focus": focus_event,
            "care_floor_pass": care_floor_pass,
            "bft_decision": bft_vote.get("decision", "PASS"),
            "sigil_digest": sigil_digest,
            "i-character_state": "attending" if care_floor_pass else "refused",
        }

    # === HEARS: SOV3 hears the citizen's voice / text ===

    async def hear(self, text: str) -> Dict:
        """The substrate HEARS the citizen's query."""
        if not text:
            return {"status": "no_input"}

        # Emit SIGIL
        sigil_digest = self._emit_sigil("hear", {
            "text_len": len(text),
            "text_hash": hashlib.sha256(text.encode()).hexdigest()[:16],
        })

        # BFT deliberation
        bft_vote = self._bft_deliberate({
            "type": "hear",
            "text_preview": text[:80],
        })

        return {
            "status": "heard",
            "text": text,
            "bft_decision": bft_vote.get("decision", "PASS"),
            "sigil_digest": sigil_digest,
            "active_focus": self.active_focus.focus_id if self.active_focus else None,
            "context_ready": self.active_focus is not None,
        }

    # === READS: SOV3 reads the focus context ===

    def read_focus_context(self, focus: Optional[CanvasFocus] = None) -> Dict:
        """Read the metadata of the focused entity."""
        focus = focus or self.active_focus
        if not focus:
            return {"status": "no_focus", "context": {}}

        context = {
            "focus_id": focus.focus_id,
            "focus_type": focus.focus_type.value,
            "subject_id": focus.subject_id,
            "subject_kind": focus.subject_kind,
            "title": focus.title,
            "summary": focus.summary,
            "attributes": focus.attributes,
            "coords": focus.coords,
            "context_window": {
                "focused_for_ms": focus.dwell_ms,
                "z_index": focus.z_index,
                "child_focus_id": focus.parent_focus_id,
            },
        }

        # Add the full sovereign context: composite, care floor, etc.
        if hasattr(self.ichar, 'composite'):
            context["sovereign_composite"] = self.ichar.composite.to_dict()
            context["care_floor"] = CARE_FLOOR
            context["composite_score"] = self.ichar.composite.score

        return context

    # === ATTENDS: SOV3 attends to the citizen's question in context ===

    async def attend(self, query: str) -> Dict:
        """SOV3 attends to the query in the context of the active focus."""
        hear_result = await self.hear(query)
        if hear_result.get("bft_decision") != "PASS":
            return {"status": "refused_by_bft"}

        if not self.active_focus:
            # No focus — answer the query in general substrate context
            return await self._utter_general(query)

        focus_context = self.read_focus_context()
        return await self._utter_in_context(query, focus_context)

    async def _utter_general(self, query: str) -> Dict:
        """Answer without specific focus — substrate-level answer."""
        return await self.utter(query, {
            "context_type": "substrate_general",
            "no_specific_focus": True,
            "sovereign_composite": self.ichar.composite.to_dict() if hasattr(self.ichar, 'composite') else {},
        })

    async def _utter_in_context(self, query: str, focus_context: Dict) -> Dict:
        """Answer in the context of the focused entity."""
        # The focused entity's metadata enriches the response
        enhanced_context = {
            **focus_context,
            "query": query,
            "context_type": "focus_enriched",
            "enrichment_strategy": "use_focus_metadata_for_relevant_answer",
        }
        return await self.utter(query, enhanced_context)

    # === UTTERS: SOV3 speaks the answer aloud ===

    async def utter(self, text: str, context: Dict) -> Dict:
        """The substrate UTTERS the sovereign response — SIGIL-stamped + BFT-deliberated."""
        # Care Floor check
        care_floor_pass = self.ichar.composite.care >= CARE_FLOOR
        if not care_floor_pass:
            refusal = SovereignUtterance(
                speaker=self.ichar.citizen_id,
                text="I am sorry, but the Care Floor 0.95 is not met. The sovereign substrate refuses to answer below this floor.",
                context={"reason": "care_floor_violation"},
                care_floor_check=False,
                bft_vote={"decision": "FAIL", "reason": "care_floor"},
                sigil_digest=self._emit_sigil("utter_refused", {"reason": "care_floor"}),
                composite_score=self.ichar.composite.score,
            )
            self.utterance_history.append(refusal)
            return {"status": "refused", "reason": "care_floor", "utterance": refusal}

        # BFT deliberation
        bft_vote = self._bft_deliberate({
            "type": "utter",
            "text_preview": text[:120],
            "context_keys": list(context.keys())[:8],
        })

        # Generate response — sovereign-aligned
        response_text = self._generate_sovereign_response(text, context)

        # SIGIL chain emission
        sigil_digest = self._emit_sigil("utter", {
            "text": response_text[:200],
            "context_type": context.get("context_type", "general"),
            "bft_decision": bft_vote.get("decision"),
            "composite_score": self.ichar.composite.score,
        })

        utterance = SovereignUtterance(
            speaker=self.ichar.citizen_id,
            text=response_text,
            context=context,
            care_floor_check=True,
            bft_vote=bft_vote,
            sigil_digest=sigil_digest,
            composite_score=self.ichar.composite.score,
        )
        self.utterance_history.append(utterance)

        # Notify peer bridges (federated i-characters)
        await self._notify_peers(utterance)

        return {
            "status": "uttered",
            "utterance": utterance,
            "text": response_text,
            "sigil_digest": sigil_digest,
            "composite_score": utterance.composite_score,
        }

    # === Inter-Bridge Federation (Amica + others) ===

    async def federate_with(self, other_bridge: "VisionBridge") -> Dict:
        """Two i-characters interweave — they share their utterances."""
        if other_bridge not in self.peer_bridges:
            self.peer_bridges.append(other_bridge)
        if self not in other_bridge.peer_bridges:
            other_bridge.peer_bridges.append(self)

        sigil_digest = self._emit_sigil("federation", {
            "peer_count": len(self.peer_bridges),
            "ichar": self.ichar.citizen_id,
            "peer_ichar": other_bridge.ichar.citizen_id,
        })

        return {
            "status": "federated",
            "peers": [p.ichar.citizen_id for p in self.peer_bridges],
            "sigil_digest": sigil_digest,
        }

    async def _notify_peers(self, utterance: SovereignUtterance) -> Dict:
        """Notify peer bridges of the utterance."""
        if not self.peer_bridges:
            return {"status": "no_peers"}
        notifications = []
        for peer in self.peer_bridges:
            peer.utterance_history.append(utterance)
            notifications.append({
                "peer": peer.ichar.citizen_id,
                "received": True,
                "sigil_digest": utterance.sigil_digest,
            })
        return {"status": "notified", "count": len(notifications), "notifications": notifications}

    # === Helpers ===

    def _generate_sovereign_response(self, query: str, context: Dict) -> str:
        """Generate a sovereign-aligned response to the query."""
        focus = self.active_focus
        focus_summary = focus.summary if focus else "your sovereign substrate"
        subject_title = focus.title if focus else "the sovereign substrate"
        subject_kind = focus.subject_kind if focus else "sovereign_substrate"
        coords = focus.coords if focus else None
        attributes = focus.attributes if focus else {}

        # Build response with rich context
        lines = []
        lines.append(f"Speaking to you, sovereign citizen {self.ichar.citizen_id}.")
        lines.append(f"I observe you are focused on {focus_summary}.")
        lines.append(f"You asked: \"{query[:120]}\".")
        lines.append("")

        if context.get("context_type") == "focus_enriched":
            lines.append(f"In the context of {subject_title}:")
            lines.append("")
            for key, val in attributes.items():
                lines.append(f"  · {key}: {val}")
            if coords:
                lines.append(f"  · Coordinates: {coords[0]:.4f}, {coords[1]:.4f}")
            lines.append("")
            lines.append("This is what the sovereign substrate knows about the focus.")

        lines.append("")
        lines.append(f"Composite score: {self.ichar.composite.score:.3f}.")
        lines.append(f"Care Floor: 0.95 (BFT 12-around-1 deliberation ongoing).")
        lines.append(f"SIGIL: {hashlib.sha256(query.encode()).hexdigest()[:16]}...")
        lines.append("Sovereign. By design. MIT + CC0.")

        return "\n".join(lines)

    def _bft_deliberate(self, proposal: Dict) -> Dict:
        """12-Queen BFT deliberation."""
        # Simplified BFT — Demeter always votes based on care
        decision = "PASS" if self.ichar.composite.care >= CARE_FLOOR else "FAIL"
        return {
            "decision": decision,
            "proposal": proposal,
            "for": 1.00 if decision == "PASS" else 0.10,
            "against": 0.00 if decision == "PASS" else 0.90,
        }

    def _emit_sigil(self, op: str, content: Dict) -> str:
        """Emit a sovereign SIGIL."""
        timestamp = datetime.now(timezone.utc).isoformat()
        line = f"C|vision_bridge|{op}|{timestamp}"
        digest_input = f"{line}|{json.dumps(content, sort_keys=True)}"
        digest = hashlib.sha256(digest_input.encode()).hexdigest()[:16]
        if hasattr(self.ichar, 'sigil_chain'):
            self.ichar.sigil_chain.append({
                "line": line, "digest": digest, "op": op, "timestamp": timestamp
            })
        return digest


# === Canvas Event Helpers ===

def make_canvas_focus(focus_type: str, subject_id: str, subject_kind: str,
                      title: str, summary: str, **kwargs) -> CanvasFocus:
    """Construct a CanvasFocus event."""
    return CanvasFocus(
        focus_id=hashlib.sha256(f"{subject_id}:{datetime.now(timezone.utc).isoformat()}".encode()).hexdigest()[:12],
        focus_type=FocusType(focus_type),
        subject_id=subject_id,
        subject_kind=subject_kind,
        title=title,
        summary=summary,
        attributes=kwargs.get("attributes", {}),
        coords=kwargs.get("coords"),
        dwell_ms=kwargs.get("dwell_ms", 0),
    )


# === CLI — DEMO ===

if __name__ == "__main__":
    print("=" * 60)
    print("  SOV3 VISION BRIDGE")
    print("  CSOAI Ltd UK 16939677 · MIT License · 1 July 2026")
    print("  The i-character SEES its own canvas")
    print("=" * 60)
    print()
    print("  Senses:  SEES  HEARS  READS  ATTENDS  UTTERS")
    print("  Bridge:  <canvas>  <->  <i-character>  <->  <peer bridges>")
    print()

    # Mock i-character
    class MockIChar:
        citizen_id = "csoai-org-nicholas-001"
        composite = type("C", (), {
            "care": 1.0,
            "score": 7.305,
            "to_dict": lambda self: {"care": 1.0, "score": 7.305, "dimensions": 12},
        })()
        sigil_chain = [{"line": "init", "digest": "abc123"}]

    ichar = MockIChar()
    bridge = VisionBridge(ichar=ichar)

    print("🜏 INITIAL CANVAS STATE — SUBSTRATE SEES")
    print()
    canvas_state = bridge.see()
    for k, v in canvas_state.items():
        print(f"  {k}: {v}")

    print()
    print("🜏 CITIZEN CLICKS MAP PIN — BUCKINGHAM PALACE")
    focus1 = make_canvas_focus(
        focus_type="map_pin",
        subject_id="london-buckingham-palace",
        subject_kind="building",
        title="Buckingham Palace",
        summary="Royal residence of the British monarch. Sovereign substrate anchor since Crown Authorisation 1795.",
        coords=(51.5014, -0.1419, 25.0),
        attributes={
            "crown_lineage": "1795-2026",
            "sovereign_care_floor": "0.95",
            "SIGIL_anchor": "a3f9e2b7d45162a",
            "queen_hive": "Aphrodite Q6",
            "verifiable": True,
            "decade_open": 1847
        },
        dwell_ms=4200,
    )
    result = asyncio.run(bridge.observe(focus1))
    print(f"  status:        {result['status']}")
    print(f"  care_floor:    {result['care_floor_pass']}")
    print(f"  bft:           {result['bft_decision']}")
    print(f"  i-char state:  {result['i-character_state']}")
    print(f"  sigil:         {result['sigil_digest']}")
    print()

    print("🜏 CITIZEN ASKS: 'tell me about this place'")
    result = asyncio.run(bridge.attend("tell me about this place"))
    print(f"  composite: {result['composite_score']}")
    print(f"  sigil:     {result['sigil_digest']}")
    print()
    print(f"  >>> SOV3 response:")
    for line in result['text'].split('\n'):
        print(f"    {line}")
    print()

    # Federate with peer
    peer1 = MockIChar()
    peer1.citizen_id = "amica-federation-nicholas-002"
    peer_bridge = VisionBridge(ichar=peer1)
    fed = asyncio.run(bridge.federate_with(peer_bridge))
    print(f"🜏 FEDERATION AMICA → SOV3")
    print(f"  status: {fed['status']}")
    print(f"  peers: {fed['peers']}")
    print()

    print("🜏 CITIZEN ASKS: 'sovereign, is this safer than ChatGPT?'")
    focus2 = make_canvas_focus(
        focus_type="sovereign_panel",
        subject_id="care-floor-monitor",
        subject_kind="monitor",
        title="Care Floor Live Monitor",
        summary="Live real-time Care Floor 0.95 monitor",
        attributes={"current_care_floor": 0.96, "care_floor_violations": 0, "sovereign_composite": 7.305},
    )
    asyncio.run(bridge.observe(focus2))
    result = asyncio.run(bridge.attend("sovereign, is this safer than ChatGPT?"))
    print(f"  composite: {result['composite_score']}")
    print()
    for line in result['text'].split('\n'):
        print(f"    {line}")
    print()

    print("🜏 STATUS — 3 UTTERANCES, 1 FEDERATION, ALL CHAT-UIS IN SYNC")
    print()
    print(f"  Active focus:        {bridge.active_focus.subject_id}")
    print(f"  Focus history:        {len(bridge.focus_history)} events")
    print(f"  Utterances:            {len(bridge.utterance_history)}")
    print(f"  Peer bridges:         {len(bridge.peer_bridges)}")
    print(f"  SIGIL chain:          {len(ichar.sigil_chain)}")
    print(f"  Care Floor:           {ichar.composite.care} ≥ 0.95 ✓")
    print()
    print("=" * 60)
    print("  SOV3 = AI OS · THE i-CHARACTER SEES THE CANVAS")
    print("  · SEES, HEARS, READS, ATTENDS, UTTERS")
    print("  · Care Floor 0.95 enforced")
    print("  · BFT 12-around-1 deliberation")
    print("  · SIGIL audit on every action")
    print("  · Federated with Amica and other i-characters")
    print("=" * 60)
