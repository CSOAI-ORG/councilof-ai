"""meok-sovereign-screen-watcher-mcp — SOV33 Screen-Watcher.

The SOV33 screen-watcher watches the user's screen, learns how to use
the AI OS, and proactively helps. Detects blocking windows, suggests
minimization, learns from user actions.

5 tools:
  1. watcher_observe - observe current screen state
  2. watcher_detect_blockers - detect windows blocking content
  3. watcher_suggest_action - suggest next user action
  4. watcher_learn - learn from user behavior
  5. watcher_status - get watcher status
"""
from __future__ import annotations
import json
import hashlib
import random
import string
from datetime import datetime, timezone

PROTOCOL = "sovereign-watcher/1.0"
VERSION = "1.0.0"
LICENSE = "MIT + CC0 1.0"

# State
_OBSERVATIONS = []
_LEARNED = []  # learned patterns
_ACTIONS_TAKEN = []


def _sign(payload):
    body = json.dumps(payload, sort_keys=True, default=str)
    payload["kid"] = "wdh-" + hashlib.sha256(body.encode()).hexdigest()[:16]
    payload["sig"] = hashlib.sha256((payload["kid"] + body).encode()).hexdigest()[:16]
    payload["ts"] = datetime.now(timezone.utc).isoformat()
    return payload


def _gen_id(prefix: str) -> str:
    return f"{prefix}-{''.join(random.choices(string.hexdigits.lower(), k=8))}"


def watcher_observe(screenshot_url: str = "", description: str = "") -> dict:
    """Observe current screen state."""
    obs_id = _gen_id("obs")
    observation = {
        "observation_id": obs_id,
        "screenshot_url": screenshot_url,
        "description": description,
        "ts": datetime.now(timezone.utc).isoformat(),
    }
    _OBSERVATIONS.append(observation)
    return _sign({
        "protocol": PROTOCOL, "version": VERSION,
        "observation": observation,
        "total_observations": len(_OBSERVATIONS),
        "doctrine": f"SOV33 observed screen state {obs_id}.",
    })


def watcher_detect_blockers(windows: str = "") -> dict:
    """Detect windows blocking content."""
    window_list = [w.strip() for w in windows.split(",") if w.strip()] if windows else []
    blockers = []
    for w in window_list:
        # Simulate detection logic
        if any(kw in w.lower() for kw in ["popup", "ad", "block", "modal"]):
            blockers.append({"window": w, "severity": "high", "action": "close"})
        elif any(kw in w.lower() for kw in ["toolbar", "sidebar", "panel"]):
            blockers.append({"window": w, "severity": "low", "action": "minimize"})
    return _sign({
        "protocol": PROTOCOL, "version": VERSION,
        "blockers": blockers,
        "total_windows": len(window_list),
        "doctrine": f"SOV33 detected {len(blockers)} blockers out of {len(window_list)} windows.",
    })


def watcher_suggest_action(context: str = "general") -> dict:
    """Suggest next user action."""
    suggestions = {
        "general": "I see you've been here a while. Want me to show you the sovereign composite?",
        "tour": "Let me show you the next layer. Click 'Next' to continue.",
        "demo": "The demo is complete. Try the 6-min full tour for the full experience.",
        "explore": "Click any hive planet on the globe to inspect it.",
        "learn": "Want me to explain the Fork Doctrine? It's how forks are sovereign.",
    }
    suggestion = suggestions.get(context, suggestions["general"])
    return _sign({
        "protocol": PROTOCOL, "version": VERSION,
        "context": context,
        "suggestion": suggestion,
        "doctrine": f"SOV33 suggests: {suggestion}",
    })


def watcher_learn(action: str, context: str = "") -> dict:
    """Learn from user behavior."""
    if not action:
        return _sign({"error": "action required"})
    pattern_id = _gen_id("pattern")
    pattern = {
        "pattern_id": pattern_id,
        "action": action,
        "context": context,
        "ts": datetime.now(timezone.utc).isoformat(),
    }
    _LEARNED.append(pattern)
    return _sign({
        "protocol": PROTOCOL, "version": VERSION,
        "pattern": pattern,
        "total_patterns": len(_LEARNED),
        "doctrine": f"SOV33 learned pattern: {action} in {context}.",
    })


def watcher_status() -> dict:
    """Get watcher status."""
    return _sign({
        "protocol": PROTOCOL, "version": VERSION,
        "total_observations": len(_OBSERVATIONS),
        "total_learned": len(_LEARNED),
        "total_actions": len(_ACTIONS_TAKEN),
        "watcher_status": "active",
        "doctrine": f"SOV33 screen-watcher active. {len(_OBSERVATIONS)} observations, {len(_LEARNED)} patterns learned.",
    })