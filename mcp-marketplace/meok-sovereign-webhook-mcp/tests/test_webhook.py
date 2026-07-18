"""Tests for meok-sovereign-webhook-mcp."""
import os, tempfile
_TEST_DIR = tempfile.mkdtemp(prefix="sov_hook_test_")
os.environ["SOV_HOOK_KEY"] = os.path.join(_TEST_DIR, "key.pem")
from meok_sovereign_webhook_mcp import (
    webhook_subscribe, webhook_publish, webhook_list,
    webhook_unsubscribe, webhook_history,
    _SUBSCRIBERS, _EVENTS, _EVENT_TOPICS,
)


def reset_state():
    _SUBSCRIBERS.clear()
    _EVENTS.clear()


def test_8_event_topics():
    assert len(_EVENT_TOPICS) == 8


def test_subscribe_basic():
    reset_state()
    r = webhook_subscribe("iokfarm/pond/alert", "dragon", "https://example.com/hook")
    assert r["subscriber"] == "dragon"
    assert "iokfarm/pond/alert" in _SUBSCRIBERS


def test_subscribe_invalid_topic():
    r = webhook_subscribe("invalid/topic", "dragon", "https://example.com")
    assert "error" in r


def test_publish_basic():
    reset_state()
    r = webhook_publish("iokfarm/pond/alert", {"ph": 5.0, "severity": "critical"})
    assert r["topic"] == "iokfarm/pond/alert"
    assert len(_EVENTS) == 1


def test_publish_no_subscribers():
    reset_state()
    r = webhook_publish("iokfarm/pond/alert")
    assert r["subscriber_count"] == 0


def test_publish_with_subscribers():
    reset_state()
    webhook_subscribe("iokfarm/pond/alert", "dragon", "url1")
    webhook_subscribe("iokfarm/pond/alert", "scribe", "url2")
    r = webhook_publish("iokfarm/pond/alert")
    assert r["subscriber_count"] == 2


def test_publish_invalid_topic():
    r = webhook_publish("invalid/topic")
    assert "error" in r


def test_list_all():
    reset_state()
    webhook_subscribe("iokfarm/pond/alert", "dragon", "url")
    webhook_subscribe("sovereign/charter/amend", "scribe", "url")
    r = webhook_list()
    assert r["topic_count"] == 2


def test_list_filtered():
    reset_state()
    webhook_subscribe("iokfarm/pond/alert", "dragon", "url")
    webhook_subscribe("sovereign/charter/amend", "scribe", "url")
    r = webhook_list(topic="iokfarm/pond/alert")
    assert r["topic"] == "iokfarm/pond/alert"


def test_list_invalid_topic():
    r = webhook_list(topic="invalid/topic")
    assert "error" in r


def test_unsubscribe_basic():
    reset_state()
    webhook_subscribe("iokfarm/pond/alert", "dragon", "url")
    r = webhook_unsubscribe("iokfarm/pond/alert", "dragon")
    assert r["removed"] == 1


def test_unsubscribe_nonexistent():
    reset_state()
    r = webhook_unsubscribe("iokfarm/pond/alert", "nobody")
    assert r["removed"] == 0


def test_unsubscribe_invalid_topic():
    r = webhook_unsubscribe("invalid/topic", "dragon")
    assert "error" in r


def test_history_basic():
    reset_state()
    for i in range(5):
        webhook_publish("iokfarm/pond/alert")
    r = webhook_history()
    assert r["count"] == 5


def test_history_filtered_by_topic():
    reset_state()
    webhook_publish("iokfarm/pond/alert")
    webhook_publish("sovereign/charter/amend")
    r = webhook_history(topic="iokfarm/pond/alert")
    assert r["count"] == 1


def test_history_limit():
    reset_state()
    for i in range(10):
        webhook_publish("iokfarm/pond/alert")
    r = webhook_history(limit=3)
    assert r["count"] == 3


def test_no_external_deps():
    import meok_sovereign_webhook_mcp as m
    src = open(m.__file__).read()
    assert "import ollama" not in src
    assert "import urllib" not in src
    assert "import requests" not in src


def test_signed_outputs():
    reset_state()
    r1 = webhook_subscribe("iokfarm/pond/alert", "dragon", "url")
    assert "kid" in r1 and "sig" in r1 and "ts" in r1
    r2 = webhook_publish("iokfarm/pond/alert")
    assert "kid" in r2 and "sig" in r2 and "ts" in r2
    r3 = webhook_list()
    assert "kid" in r3 and "sig" in r3 and "ts" in r3
    r4 = webhook_unsubscribe("iokfarm/pond/alert", "dragon")
    assert "kid" in r4 and "sig" in r4 and "ts" in r4
    r5 = webhook_history()
    assert "kid" in r5 and "sig" in r5 and "ts" in r5


def test_full_lifecycle():
    """Subscribe → publish → list → unsubscribe → history."""
    reset_state()
    webhook_subscribe("iokfarm/pond/alert", "dragon", "url1")
    webhook_subscribe("iokfarm/pond/alert", "scribe", "url2")
    webhook_publish("iokfarm/pond/alert", {"ph": 5.0})
    webhook_publish("sovereign/charter/amend", {"article_id": 1})
    # After both publishes, dragon's subscription triggers on 1 alert, scribe's on 1 alert
    r = webhook_list(topic="iokfarm/pond/alert")
    assert len(r["subscribers"]) == 2
    webhook_unsubscribe("iokfarm/pond/alert", "dragon")
    r = webhook_list(topic="iokfarm/pond/alert")
    assert len(r["subscribers"]) == 1
    h = webhook_history()
    assert h["count"] == 2