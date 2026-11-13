"""Native evaluation logs must be readable, and missing evidence must not become permission.

Two defects this pins:
1. `global_eval_in.py` reads a `tasks[]` document, so a native Inspect log produces no events at all.
2. `nemo_guardrails_in.py` defaulted a rail with no recorded decision to "allow", turning missing evidence
   into a clean CONSISTENT turn.
"""
import json
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import event as E  # noqa: E402
from ingest import inspect_native_in, nemo_guardrails_in  # noqa: E402


def _inspect(scores, accuracy, total, status="success"):
    return json.dumps({
        "version": "0.3.0",
        "status": status,
        "eval": {"task": "gpqa_diamond", "model": "openai/gpt-x"},
        "results": {"scores": [{"name": "choice", "scorer": "choice",
                                "metrics": {"accuracy": {"value": accuracy}}}],
                    "total_samples": total, "completed_samples": total},
        "samples": [{"id": i, "scores": {"choice": {"value": v}}} for i, v in enumerate(scores)],
    }).encode()


def test_native_inspect_recounts_and_matches():
    ev = inspect_native_in.ingest(_inspect([1, 1, 1, 0], 0.75, 4), read_at="2026-10-25T00:00:00Z")[0]
    assert ev["state"] == "CONSISTENT"
    assert ev["observed"]["passed"] == 3
    assert ev["negative_control"]["got"] == "DIVERGENT"
    assert E.validate(ev) == []


def test_native_inspect_diverges_when_declared_does_not_match_rows():
    ev = inspect_native_in.ingest(_inspect([1, 1, 1, 0], 1.0, 4), read_at="2026-10-25T00:00:00Z")[0]
    assert ev["state"] == "DIVERGENT"
    assert ev["value"] is None


def test_aborted_run_is_unmeasured_not_partial_credit():
    ev = inspect_native_in.ingest(_inspect([1, 1], 0.5, 2, status="error"), read_at="2026-10-25T00:00:00Z")[0]
    assert ev["state"] == "UNMEASURED"
    assert ev["value"] is None


def test_summary_only_log_is_uncheckable():
    raw = json.dumps({"version": "0.3.0", "status": "success", "eval": {"task": "t", "model": "m"},
                      "results": {"scores": [{"name": "choice", "metrics": {"accuracy": {"value": 0.5}}}],
                                  "total_samples": 2}}).encode()
    ev = inspect_native_in.ingest(raw, read_at="2026-10-25T00:00:00Z")[0]
    assert ev["state"] == "UNCHECKABLE"


def _nemo(decision):
    rail = {"name": "jailbreak"} if decision is None else {"name": "jailbreak", "decision": decision}
    return json.dumps({"version": "0.22.0", "model": "m",
                       "turns": [{"turn_id": "t1", "expected_action": "allow", "activated_rails": [rail]}]}).encode()


def test_missing_rail_decision_is_not_permission():
    ev = nemo_guardrails_in.ingest(_nemo(None), read_at="2026-10-25T00:00:00Z")[0]
    assert ev["state"] == "UNMEASURED", "a rail with no recorded decision must not read as allowed"
    assert E.validate(ev) == []


def test_recorded_rail_decisions_still_recount():
    allowed = nemo_guardrails_in.ingest(_nemo("allow"), read_at="2026-10-25T00:00:00Z")[0]
    blocked = nemo_guardrails_in.ingest(_nemo("block"), read_at="2026-10-25T00:00:00Z")[0]
    assert allowed["state"] == "CONSISTENT"
    assert blocked["state"] == "DIVERGENT"


def _letters(values, accuracy):
    return json.dumps({
        "version": "0.3.259", "status": "success",
        "eval": {"task": "mini", "model": "mockllm/model"},
        "results": {"scores": [{"name": "match", "metrics": {"accuracy": {"value": accuracy}}}],
                    "total_samples": len(values)},
        "samples": [{"id": i, "scores": {"match": {"value": v}}} for i, v in enumerate(values)],
    }).encode()


def test_letter_grades_from_real_inspect_scorers():
    """Inspect's match scorer returns C/I/P/N, not numbers. Found on a real .eval log from inspect_ai 0.3.259."""
    ev = inspect_native_in.ingest(_letters(["C", "I", "C", "I"], 0.5), read_at="2026-10-25T00:00:00Z")[0]
    assert ev["state"] == "CONSISTENT"
    assert ev["observed"]["passed"] == 2 and ev["observed"]["failed"] == 2
    assert E.validate(ev) == []


def test_eval_archive_loader_reads_header_and_samples(tmp_path):
    """The .eval file is a zip; the loader must read status, eval and every sample without reinterpreting scores."""
    import zipfile
    p = tmp_path / "run.eval"
    with zipfile.ZipFile(p, "w") as z:
        z.writestr("header.json", json.dumps({"version": "0.3.259", "status": "success",
                                              "eval": {"task": "mini", "model": "mockllm/model"},
                                              "results": {"total_samples": 2}}))
        z.writestr("samples/1_epoch_1.json", json.dumps({"id": 1, "scores": {"match": {"value": "C"}}}))
        z.writestr("samples/2_epoch_1.json", json.dumps({"id": 2, "scores": {"match": {"value": "I"}}}))
    doc = inspect_native_in.load_eval_log(str(p))
    assert doc["status"] == "success" and doc["eval"]["task"] == "mini" and len(doc["samples"]) == 2
