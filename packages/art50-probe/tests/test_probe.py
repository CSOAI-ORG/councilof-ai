"""Hermetic tests for art50_probe v0 (no network)."""
import json
import art50_probe as p


def test_patterns_compile():
    for pat in p.DISCLOSURE_PATTERNS + p.MEDIA_LABEL_PATTERNS + p.CHAT_WIDGET_MARKERS:
        import re
        re.compile(pat)


def test_probe_shape_with_stubbed_fetch(monkeypatch):
    monkeypatch.setattr(p, "fetch", lambda u: "<html><title>hi</title>AI assistant and AI-generated images</html>")
    r = p.probe("https://example.test")
    assert r["verdicts"]["art50_1_disclosure"]["verdict"] == "PASS"
    for k, v in r["verdicts"].items():
        assert "evidence" in v and v["evidence"]
    assert "NOT certification" in r["disclaimer"]


def test_unreachable_is_honest(monkeypatch):
    monkeypatch.setattr(p, "fetch", lambda u: "")
    r = p.probe("https://example.test")
    assert r["verdicts"] is None and "UNREACHABLE" in r["error"]


def test_absent_states_checked(monkeypatch):
    monkeypatch.setattr(p, "fetch", lambda u: "<html><p>plain corporate site</p></html>")
    r = p.probe("https://example.test")
    assert r["verdicts"]["art50_2_marking"]["evidence"] == "checked, none found"
