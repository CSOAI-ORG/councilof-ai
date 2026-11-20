"""Malformed native Inspect score values must not become counted evidence."""
import json

import pytest

from ingest import inspect_native_in
import event


def _record(score):
    return json.dumps({
        "version": "0.3.259", "status": "success",
        "eval": {"task": "synthetic-boundary", "model": "mock/model"},
        "results": {
            "scores": [{"name": "match", "metrics": {"accuracy": {"value": 1.0}}}],
            "total_samples": 1,
        },
        "samples": [{"id": 0, "scores": {"match": {"value": score}}}],
    }).encode()


@pytest.mark.parametrize("invalid", [-0.001, 1.001, float("nan"), float("inf"), -float("inf")])
def test_invalid_numeric_scores_are_uncheckable(invalid):
    result = inspect_native_in.ingest(_record(invalid), read_at="2026-11-20T00:00:00Z")[0]
    assert result["state"] == "UNCHECKABLE"
    assert result["value"] is None
    assert event.validate(result) == []


@pytest.mark.parametrize("valid,expected", [(0.0, "DIVERGENT"), (0.5, "CONSISTENT"), (1.0, "CONSISTENT")])
def test_bounded_numeric_scores_keep_existing_semantics(valid, expected):
    result = inspect_native_in.ingest(_record(valid), read_at="2026-11-20T00:00:00Z")[0]
    assert result["state"] == expected
    assert event.validate(result) == []
