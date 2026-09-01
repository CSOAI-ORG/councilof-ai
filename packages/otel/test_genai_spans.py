#!/usr/bin/env python3
"""Tests for the GenAI file exporter. Run: python3 packages/otel/test_genai_spans.py"""
import json
import os
import sys
import tempfile
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))


def _fresh(enabled: bool, tmp: str):
    # Re-evaluate the flag per test by reimporting with env set.
    os.environ["CSOAI_OTEL"] = "1" if enabled else "0"
    os.environ["CSOAI_OTEL_DIR"] = tmp
    import importlib
    import genai_spans
    importlib.reload(genai_spans)
    return genai_spans


def test_disabled_is_noop_and_absent():
    with tempfile.TemporaryDirectory() as tmp:
        gs = _fresh(False, tmp)
        t = gs.Tracer("svc")
        with t.genai_span("chat", model="m") as s:
            s["gen_ai.usage.output_tokens"] = 5
        assert t.card_fields() == {}, "disabled must yield NO fields (absent = UNCHECKABLE)"
        assert list(Path(tmp).glob("*.json")) == [], "disabled must write no file"
    print("ok: disabled is a no-op, fields absent")


def test_enabled_exports_and_hash_matches():
    with tempfile.TemporaryDirectory() as tmp:
        gs = _fresh(True, tmp)
        t = gs.Tracer("svc")
        with t.genai_span("chat", model="clan-csoai-plain:latest", system="ollama") as s:
            s["gen_ai.usage.input_tokens"] = 42
        cf = t.card_fields()
        assert set(cf) == {"otel_trace_id", "otel_trace_hash"}, cf
        assert len(cf["otel_trace_id"]) == 32
        assert len(cf["otel_trace_hash"]) == 64
        files = list(Path(tmp).glob("*.json"))
        assert len(files) == 1, files
        import hashlib
        raw = files[0].read_bytes()
        assert hashlib.sha256(raw).hexdigest() == cf["otel_trace_hash"], "hash must be over the exported bytes"
        doc = json.loads(raw)
        span = doc["resourceSpans"][0]["scopeSpans"][0]["spans"][0]
        keys = {a["key"] for a in span["attributes"]}
        assert "gen_ai.operation.name" in keys and "gen_ai.request.model" in keys, keys
    print("ok: enabled exports OTLP, hash matches bytes, GenAI attrs present")


def test_none_attr_is_absent_not_zero():
    with tempfile.TemporaryDirectory() as tmp:
        gs = _fresh(True, tmp)
        t = gs.Tracer("svc")
        with t.genai_span("chat", model="m") as s:
            s["gen_ai.usage.output_tokens"] = None  # unmeasured
        t.export()
        files = list(Path(tmp).glob("*.json"))
        span = json.loads(files[0].read_bytes())["resourceSpans"][0]["scopeSpans"][0]["spans"][0]
        keys = {a["key"] for a in span["attributes"]}
        assert "gen_ai.usage.output_tokens" not in keys, "None must be dropped, never rendered as 0"
    print("ok: None attribute stays absent, not zero")


if __name__ == "__main__":
    test_disabled_is_noop_and_absent()
    test_enabled_exports_and_hash_matches()
    test_none_attr_is_absent_not_zero()
    print("ALL OTEL TESTS PASSED")
