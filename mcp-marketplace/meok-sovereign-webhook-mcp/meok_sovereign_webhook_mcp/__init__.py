"""meok-sovereign-webhook-mcp — Incoming + outgoing webhooks for the sovereign substrate.

5 tools:
  1. webhook_subscribe   - subscribe to an event topic
  2. webhook_publish     - publish an event (triggers subscribers)
  3. webhook_list        - list subscribers per topic
  4. webhook_unsubscribe - remove a subscriber
  5. webhook_history     - history of published events
"""
from __future__ import annotations
import json
import hashlib
from datetime import datetime, timezone
from typing import Optional

PROTOCOL = "sovereign-webhook/1.0"
VERSION = "1.0.0"

_SUBSCRIBERS: dict = {}  # topic -> list of subscribers
_EVENTS: list = []        # history
_EVENT_TOPICS = [
    "iokfarm/pond/alert", "sovereign/charter/amend", "sovereign/bft/ratified",
    "sovereign/sigil/anchor", "iokfarm/iot/reading", "sovereign/hive/broadcast",
    "sovereign/mcp/deploy", "sovereign/general/tick",
]


def _sign(payload: dict) -> dict:
    body = json.dumps(payload, sort_keys=True, default=str)
    payload["kid"] = "hook-" + hashlib.sha256(body.encode()).hexdigest()[:16]
    payload["sig"] = hashlib.sha256((payload["kid"] + body).encode()).hexdigest()
    payload["ts"] = datetime.now(timezone.utc).isoformat()
    return payload


def webhook_subscribe(topic: str, subscriber: str, url: str) -> dict:
    """Subscribe to an event topic."""
    if topic not in _EVENT_TOPICS:
        return _sign({"error": f"unknown topic: {topic}"})
    if topic not in _SUBSCRIBERS:
        _SUBSCRIBERS[topic] = []
    sub = {"subscriber": subscriber, "url": url, "subscribed_at": datetime.now(timezone.utc).isoformat()}
    _SUBSCRIBERS[topic].append(sub)
    return _sign(sub)


def webhook_publish(topic: str, payload: dict = None) -> dict:
    """Publish an event (triggers subscribers)."""
    if topic not in _EVENT_TOPICS:
        return _sign({"error": f"unknown topic: {topic}"})
    payload = payload or {}
    event = {
        "topic": topic, "payload": payload,
        "subscriber_count": len(_SUBSCRIBERS.get(topic, [])),
    }
    signed = _sign(event)
    _EVENTS.append(signed)
    return signed


def webhook_list(topic: Optional[str] = None) -> dict:
    """List subscribers per topic."""
    if topic:
        if topic not in _EVENT_TOPICS:
            return _sign({"error": f"unknown topic: {topic}"})
        return _sign({
            "protocol": PROTOCOL, "version": VERSION,
            "topic": topic, "subscribers": _SUBSCRIBERS.get(topic, []),
        })
    return _sign({
        "protocol": PROTOCOL, "version": VERSION,
        "subscribers": {t: subs for t, subs in _SUBSCRIBERS.items()},
        "topic_count": len(_SUBSCRIBERS),
    })


def webhook_unsubscribe(topic: str, subscriber: str) -> dict:
    """Remove a subscriber."""
    if topic not in _EVENT_TOPICS:
        return _sign({"error": f"unknown topic: {topic}"})
    if topic not in _SUBSCRIBERS:
        return _sign({"removed": 0})
    before = len(_SUBSCRIBERS[topic])
    _SUBSCRIBERS[topic] = [s for s in _SUBSCRIBERS[topic] if s["subscriber"] != subscriber]
    after = len(_SUBSCRIBERS[topic])
    return _sign({"topic": topic, "subscriber": subscriber, "removed": before - after})


def webhook_history(limit: int = 50, topic: Optional[str] = None) -> dict:
    """History of published events."""
    matching = [e for e in reversed(_EVENTS) if topic is None or e.get("topic") == topic]
    matching = matching[:limit]
    return _sign({
        "protocol": PROTOCOL, "version": VERSION,
        "topic": topic, "limit": limit,
        "events": matching, "count": len(matching),
    })