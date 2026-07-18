"""
HARV — Holistic Ambient Reality Vectoriser
Phase 1: Mac context (Hammerspoon/API) + manual state machine.
Phase 2: Camera event bridge (DeepCamera/Guardian) + geospatial intelligence.
Feeds ContextEnvelope into every Sovereign conversation.
"""
import json
import time
from collections import deque
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from pathlib import Path

CONTEXT_FILE = Path("/tmp/harv_context.json")

# State machine states
STATES = ["at_desk", "in_lab", "walking_dogs", "outside", "sleeping", "away", "driving", "unknown"]

# Debounce minimums (seconds)
DEBOUNCE = {"at_desk": 10, "in_lab": 120, "walking_dogs": 60, "outside": 60, "sleeping": 1800, "away": 1800, "driving": 30}

# TTL for context freshness (seconds)
TTL = {"location": 300, "activity": 1800, "pc_status": 120, "weather": 3600}

class HARVContext:
    def __init__(self):
        self._state = self._load()
        self.camera_events: deque = deque(maxlen=50)

    def _load(self) -> Dict:
        try:
            if CONTEXT_FILE.exists():
                return json.loads(CONTEXT_FILE.read_text())
        except Exception:
            pass
        return {
            "location": "unknown",
            "location_confidence": 0.5,
            "location_updated": 0,
            "activity": "unknown",
            "activity_since": datetime.utcnow().isoformat(),
            "pc_status": "unknown",
            "pc_idle_seconds": 0,
            "pc_app": "",
            "pc_window": "",
            "pc_updated": 0,
            "weather": "",
            "weather_updated": 0,
            "dogs_detected": 0,
            "dogs_updated": 0,
            "custom": {}
        }

    def _save(self):
        try:
            CONTEXT_FILE.write_text(json.dumps(self._state, indent=2))
        except Exception:
            pass

    def update(self, key: str, value: Any, confidence: float = 1.0):
        self._state[key] = value
        self._state[f"{key}_updated"] = time.time()
        if key == "location":
            self._state["location_confidence"] = confidence
        self._save()

    def update_pc(self, idle_seconds: int, app: str = "", window: str = ""):
        now = time.time()
        self._state["pc_idle_seconds"] = idle_seconds
        self._state["pc_app"] = app
        self._state["pc_window"] = window
        self._state["pc_updated"] = now
        if idle_seconds < 60:
            self._state["pc_status"] = f"active ({app})" if app else "active"
        elif idle_seconds < 300:
            self._state["pc_status"] = f"idle {idle_seconds//60}min"
        else:
            self._state["pc_status"] = f"away {idle_seconds//60}min"
        self._save()

    def push_camera_event(self, event_type: str, label: str, confidence: float, zone: str, metadata: dict = {}):
        """Receive a detection event from DeepCamera/Guardian and buffer it."""
        event = {
            "event_type": event_type,
            "label": label,
            "confidence": confidence,
            "zone": zone,
            "metadata": dict(metadata),
            "timestamp": datetime.utcnow().isoformat(),
        }
        self.camera_events.append(event)
        # Update dogs_in_frame count from dog_detected events
        if event_type == "dog_detected":
            self._state["dogs_in_frame"] = self._state.get("dogs_in_frame", 0) + 1
            self._state["dogs_in_frame_updated"] = time.time()
        self._save()

    def is_fresh(self, key: str) -> bool:
        ttl = TTL.get(key, 300)
        updated = self._state.get(f"{key}_updated", 0)
        return (time.time() - updated) < ttl

    def get_envelope(self) -> str:
        """Build the ~200-token ContextEnvelope for LLM system prompts."""
        s = self._state
        lines = ["## Nick's Current Context"]

        loc = s.get("location", "unknown")
        conf = s.get("location_confidence", 0.5)
        if self.is_fresh("location") and loc != "unknown":
            lines.append(f"- Location: {loc} (confidence: {conf:.0%})")

        act = s.get("activity", "")
        act_since = s.get("activity_since", "")
        if act and act != "unknown":
            since_str = ""
            try:
                dt = datetime.fromisoformat(act_since)
                mins = int((datetime.utcnow() - dt).total_seconds() / 60)
                since_str = f" (since {dt.strftime('%H:%M')}, {mins}min ago)"
            except Exception:
                pass
            lines.append(f"- Activity: {act}{since_str}")

        pc = s.get("pc_status", "")
        if pc and self.is_fresh("pc_status"):
            app = s.get("pc_app", "")
            win = s.get("pc_window", "")
            detail = f" — {app}" if app else ""
            detail += f": {win[:50]}" if win else ""
            lines.append(f"- PC: {pc}{detail}")

        weather = s.get("weather", "")
        if weather and self.is_fresh("weather"):
            lines.append(f"- Weather: {weather}")

        dogs = s.get("dogs_detected", 0)
        if dogs and self.is_fresh("dogs"):
            lines.append(f"- Dogs detected: {dogs} in view")

        dogs_in_frame = s.get("dogs_in_frame", 0)
        if dogs_in_frame:
            lines.append(f"- Dogs in frame (camera): {dogs_in_frame}")

        # Recent camera events (last 5)
        if self.camera_events:
            recent = list(self.camera_events)[-5:]
            for ev in recent:
                conf_str = f"{ev['confidence']:.2f}" if ev.get("confidence") else ""
                conf_part = f" (conf: {conf_str})" if conf_str else ""
                lines.append(f"- Camera: {ev.get('label', ev.get('event_type', 'event'))} detected in {ev.get('zone', 'unknown')} zone{conf_part}")

        custom = s.get("custom", {})
        for k, v in custom.items():
            lines.append(f"- {k}: {v}")

        if len(lines) == 1:
            return ""  # No context available yet

        return "\n".join(lines)

    def get_all(self) -> Dict:
        return dict(self._state)


# Singleton
_harv = None
def get_harv() -> HARVContext:
    global _harv
    if _harv is None:
        _harv = HARVContext()
    return _harv
