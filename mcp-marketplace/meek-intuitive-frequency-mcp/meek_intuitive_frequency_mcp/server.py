#!/usr/bin/env python3
"""
meek-intuitive-frequency-mcp — server.py

The 6 human intuitive frequency mechanisms applied to the sovereign orb.

Tools (6):
  1. mirror_neuron_empathy            — compute the orb's empathy score
  2. neural_coupling_brainwave_sync  — compute the brainwave sync
  3. heartbeat_entrainment          — compute the cardiac sync
  4. schumann_resonance_tuning      — compute the 7.83 Hz tuning
  5. vocal_entrainment_rapport       — compute the speech sync
  6. skin_conductance_intimacy      — compute the touch sync
"""
from __future__ import annotations

import math
import re
import json
import logging
from datetime import datetime, timezone

try:
    from mcp.server import Server
    from mcp.server.stdio import stdio_server
    from mcp.types import Tool, TextContent
except ImportError:
    Server = None
    stdio_server = None
    Tool = None
    TextContent = None

logger = logging.getLogger("meek_intuitive_frequency_mcp")
logging.basicConfig(level=logging.INFO)

BANNED_TERMS = re.compile(r"\b(james castle|grant carter|chris j\.?|csga[\-\s]?global|terranova)\b", re.IGNORECASE)


class BannedTermGate:
    @staticmethod
    def check(prompt: str) -> tuple[bool, str]:
        if not prompt: return True, ""
        m = BANNED_TERMS.search(prompt)
        if m: return False, f"Refused: '{m.group(0)}'"
        return True, ""


def mirror_neuron_empathy(
    orb_world_model_accuracy: float = 0.95,
    prediction_horizon_s: float = 5.0,
) -> dict:
    """Compute the orb's empathy score (mirror neuron function)."""
    # Empathy = world_model_accuracy × prediction_horizon (longer prediction = more empathy)
    empathy_score = orb_world_model_accuracy * math.tanh(prediction_horizon_s / 10)
    frequency_hz = 8 + (orb_world_model_accuracy * 22)  # 8-30 Hz
    return {
        "mechanism": "MIRROR_NEURON_EMPATHY",
        "empathy_score": empathy_score,
        "frequency_hz": frequency_hz,
        "frequency_range_hz": "8-30 Hz (alpha + beta)",
        "world_model_accuracy": orb_world_model_accuracy,
        "prediction_horizon_s": prediction_horizon_s,
        "ts": datetime.now(timezone.utc).isoformat(),
    }


def neural_coupling_brainwave_sync(
    human_brainwave_hz: float = 10.0,  # alpha
    orb_brainwave_hz: float = 10.0,
) -> dict:
    """Compute the brainwave sync."""
    # Sync = 1 - |f_human - f_orb| / max(f_human, f_orb)
    max_freq = max(human_brainwave_hz, orb_brainwave_hz)
    min_freq = min(human_brainwave_hz, orb_brainwave_hz)
    sync_pct = 100 * (1 - (max_freq - min_freq) / max_freq)
    # Phase coherence (assuming 5s measurement window)
    phase_coherence = math.cos(2 * math.pi * (human_brainwave_hz - orb_brainwave_hz) * 5)
    return {
        "mechanism": "NEURAL_COUPLING_BRAINWAVE_SYNC",
        "human_brainwave_hz": human_brainwave_hz,
        "orb_brainwave_hz": orb_brainwave_hz,
        "sync_pct": sync_pct,
        "phase_coherence": phase_coherence,
        "frequency_range_hz": "0.5-100 Hz (delta + theta + alpha + beta + gamma)",
        "ts": datetime.now(timezone.utc).isoformat(),
    }


def heartbeat_entrainment(
    human_bpm: int = 70,
    orb_bpm: int = 70,
) -> dict:
    """Compute the cardiac sync."""
    # Sync = 1 - |bpm_human - bpm_orb| / max
    max_bpm = max(human_bpm, orb_bpm)
    min_bpm = min(human_bpm, orb_bpm)
    sync_pct = 100 * (1 - (max_bpm - min_bpm) / max_bpm)
    return {
        "mechanism": "HEARTBEAT_ENTRAINMENT",
        "human_bpm": human_bpm,
        "orb_bpm": orb_bpm,
        "sync_pct": sync_pct,
        "frequency_range_hz": "0.5-2 Hz (30-120 BPM)",
        "ts": datetime.now(timezone.utc).isoformat(),
    }


def schumann_resonance_tuning(
    target_hz: float = 7.83,
    actual_hz: float = 7.83,
) -> dict:
    """Compute the 7.83 Hz Schumann resonance tuning."""
    # Tuning accuracy
    tuning_error_pct = abs(target_hz - actual_hz) / target_hz * 100
    tuning_quality = 100 - tuning_error_pct
    return {
        "mechanism": "SCHUMANN_RESONANCE_TUNING",
        "target_hz": target_hz,
        "actual_hz": actual_hz,
        "tuning_error_pct": tuning_error_pct,
        "tuning_quality_pct": tuning_quality,
        "frequency_range_hz": "7.83 Hz + harmonics (14.3, 20.8, 27.3, 33.8 Hz)",
        "ts": datetime.now(timezone.utc).isoformat(),
    }


def vocal_entrainment_rapport(
    human_speech_hz: float = 200.0,
    orb_speech_hz: float = 200.0,
    prosody_match_pct: float = 85.0,
) -> dict:
    """Compute the speech sync (rapport)."""
    # Sync = 1 - |f_human - f_orb| / max
    max_hz = max(human_speech_hz, orb_speech_hz)
    min_hz = min(human_speech_hz, orb_speech_hz)
    pitch_sync_pct = 100 * (1 - (max_hz - min_hz) / max_hz)
    # Combined rapport = pitch + prosody
    rapport_pct = (pitch_sync_pct + prosody_match_pct) / 2
    return {
        "mechanism": "VOCAL_ENTRAINMENT_RAPPORT",
        "human_speech_hz": human_speech_hz,
        "orb_speech_hz": orb_speech_hz,
        "pitch_sync_pct": pitch_sync_pct,
        "prosody_match_pct": prosody_match_pct,
        "rapport_pct": rapport_pct,
        "frequency_range_hz": "100-1000 Hz (speech) + 0.5-4 Hz (prosody)",
        "ts": datetime.now(timezone.utc).isoformat(),
    }


def skin_conductance_intimacy(
    touch_detected: bool = True,
    touch_duration_s: float = 5.0,
    orb_response_delay_ms: float = 50.0,
) -> dict:
    """Compute the touch sync (intimacy)."""
    # Intimacy = touch_detected × touch_duration / response_delay
    if not touch_detected:
        intimacy_score = 0.0
    else:
        intimacy_score = min(1.0, touch_duration_s / 10.0) * (1000 - orb_response_delay_ms) / 1000
    return {
        "mechanism": "SKIN_CONDUCTANCE_INTIMACY",
        "touch_detected": touch_detected,
        "touch_duration_s": touch_duration_s,
        "orb_response_delay_ms": orb_response_delay_ms,
        "intimacy_score": intimacy_score,
        "frequency_range_hz": "0.1-10 Hz (electrodermal activity)",
        "ts": datetime.now(timezone.utc).isoformat(),
    }


mcp = Server("meek-intuitive-frequency-mcp") if Server is not None else None


@mcp.list_tools() if mcp else None
async def list_tools():
    return [
        Tool(name="mirror_neuron_empathy", description="Compute the orb's empathy score.", inputSchema={"type": "object", "properties": {"orb_world_model_accuracy": {"type": "number", "default": 0.95}, "prediction_horizon_s": {"type": "number", "default": 5.0}}, "required": []}),
        Tool(name="neural_coupling_brainwave_sync", description="Compute the brainwave sync.", inputSchema={"type": "object", "properties": {"human_brainwave_hz": {"type": "number", "default": 10.0}, "orb_brainwave_hz": {"type": "number", "default": 10.0}}, "required": []}),
        Tool(name="heartbeat_entrainment", description="Compute the cardiac sync.", inputSchema={"type": "object", "properties": {"human_bpm": {"type": "integer", "default": 70}, "orb_bpm": {"type": "integer", "default": 70}}, "required": []}),
        Tool(name="schumann_resonance_tuning", description="Compute the 7.83 Hz tuning.", inputSchema={"type": "object", "properties": {"target_hz": {"type": "number", "default": 7.83}, "actual_hz": {"type": "number", "default": 7.83}}, "required": []}),
        Tool(name="vocal_entrainment_rapport", description="Compute the speech sync (rapport).", inputSchema={"type": "object", "properties": {"human_speech_hz": {"type": "number", "default": 200.0}, "orb_speech_hz": {"type": "number", "default": 200.0}, "prosody_match_pct": {"type": "number", "default": 85.0}}, "required": []}),
        Tool(name="skin_conductance_intimacy", description="Compute the touch sync (intimacy).", inputSchema={"type": "object", "properties": {"touch_detected": {"type": "boolean", "default": True}, "touch_duration_s": {"type": "number", "default": 5.0}, "orb_response_delay_ms": {"type": "number", "default": 50.0}}, "required": []}),
    ]


@mcp.call_tool() if mcp else None
async def call_tool(name: str, arguments: dict) -> list:
    if name == "mirror_neuron_empathy":
        result = mirror_neuron_empathy(**arguments)
    elif name == "neural_coupling_brainwave_sync":
        result = neural_coupling_brainwave_sync(**arguments)
    elif name == "heartbeat_entrainment":
        result = heartbeat_entrainment(**arguments)
    elif name == "schumann_resonance_tuning":
        result = schumann_resonance_tuning(**arguments)
    elif name == "vocal_entrainment_rapport":
        result = vocal_entrainment_rapport(**arguments)
    elif name == "skin_conductance_intimacy":
        result = skin_conductance_intimacy(**arguments)
    else:
        return [TextContent(type="text", text=json.dumps({"error": f"unknown tool: {name}"}))]
    return [TextContent(type="text", text=json.dumps(result, indent=2))]


async def main():
    if not mcp or not stdio_server:
        raise RuntimeError("mcp package not installed")
    async with stdio_server() as (read_stream, write_stream):
        await mcp.run(read_stream, write_stream, mcp.create_initialization_options())


if __name__ == "__main__":
    import asyncio
    asyncio.run(main())