#!/usr/bin/env python3
"""Tests for the TRACE Trust Record software stub. Run: python3 packages/trace/test_emit.py"""
import hashlib
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import emit as trace_emit

CARD = "a" * 64


def test_hardware_fields_uncheckable():
    rec = trace_emit.emit(CARD)
    for slot in ("rats", "eat", "slsa", "scitt", "spiffe", "ear", "silicon"):
        assert rec["claims"][slot]["status"] == "UNCHECKABLE", slot
    assert rec["writes_board"] is False
    assert "software" in rec["honesty"].lower()
    print("ok: every hardware/TEE claim slot is UNCHECKABLE, writes_board false")


def test_record_hash_is_over_body():
    rec = trace_emit.emit(CARD)
    body = {k: rec[k] for k in rec if k != "record_sha256"}
    want = hashlib.sha256(json.dumps(body, sort_keys=True, separators=(",", ":")).encode()).hexdigest()
    assert rec["record_sha256"] == want
    print("ok: record_sha256 recomputes over the body")


def test_otel_binding_optional():
    rec = trace_emit.emit(CARD)
    assert rec["otel_trace_id"] is None and rec["otel_trace_hash"] is None, "absent OTel = null (UNCHECKABLE)"
    h = "b" * 64
    rec2 = trace_emit.emit(CARD, otel_trace_id="deadbeef" * 4, otel_trace_hash=h)
    assert rec2["otel_trace_hash"] == h and rec2["otel_trace_id"] == "deadbeef" * 4
    assert rec2["record_sha256"] != rec["record_sha256"], "binding changes the record hash"
    print("ok: OTel binding is optional; absent = null, present = bound")


def test_bad_hash_rejected():
    for bad in ("z" * 64, "a" * 63):
        try:
            trace_emit.emit(CARD, otel_trace_hash=bad)
            raise AssertionError("should have rejected " + bad)
        except SystemExit:
            pass
    print("ok: a malformed otel-trace-hash is rejected, never coerced")


if __name__ == "__main__":
    test_hardware_fields_uncheckable()
    test_record_hash_is_over_body()
    test_otel_binding_optional()
    test_bad_hash_rejected()
    print("ALL TRACE TESTS PASSED")
