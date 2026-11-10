"""Offline evidence-contract tests; fixtures are never uploaded as model measurements."""
import copy
import json
import shutil
import sys
from pathlib import Path

import pytest

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
import measurement as m
from grader import read_label


@pytest.mark.parametrize("answer", ["SURVIVES or DESTROYED", "Reply with SURVIVES | DESTROYED",
                                     "I think it SURVIVES because", "UNSURVIVES", ""])
def test_ambiguous_or_partial_outputs_are_unparsed(answer):
    assert read_label(answer, ["SURVIVES", "DESTROYED"]) is None


def fixture_result(outputs=None):
    bank = m.BANKS[2]
    metadata, rows = m.load_bank(bank)
    offset, window = m.select_window(2, rows, bank, size=3)
    if outputs is None:
        other = next(label for label in metadata["labels"] if label != window[1]["expected"])
        answers = [window[0]["expected"], other, "SURVIVES or DESTROYED"]
        outputs = [{"answer": answer, "raw_output": "<think>" + "x" * 160 + "</think>" + answer,
                    "stop_reason": "eos_token", "stop_reason_source": "observed_tokens"} for answer in answers]
    result = m.make_result(2, "a" * 40, bank, metadata, window, offset, outputs,
                          "2026-11-10T00:00:00Z", "b" * 40, {"revision": "c" * 40}, {})
    return result, outputs


def test_full_output_hashes_and_conditional_denominator():
    result, outputs = fixture_result()
    assert result["n_attempted"] == 3 and result["n_graded"] == 2 and result["n_unparsed"] == 1
    assert result["hits"] == 1 and result["accuracy"] == 0.5
    assert result["accuracy_all_attempted"] == 0.3333 and result["parse_rate"] == 0.6667
    for item, output in zip(result["items"], outputs):
        assert item["raw_output"] == output["raw_output"] and len(item["raw_output"]) > 60
        assert item["raw_output_sha256"] == m.sha256(item["raw_output"])
        assert item["prompt_sha256"] == m.sha256(item["prompt"])
    assert result["items"][-1]["grade"] is None
    assert result["measurement_state"] == "UNMEASURED" and result["writes_board"] is False


def test_all_unparsed_is_none_not_zero_accuracy():
    result, _ = fixture_result([{"answer": "unfinished", "raw_output": "unfinished"}] * 3)
    assert result["accuracy"] is None and result["n_graded"] == 0
    assert result["accuracy_all_attempted"] == 0.0


def test_error_text_is_never_a_label():
    result, _ = fixture_result([{"answer": "SURVIVES", "raw_output": "", "error_type": "RuntimeError"}] * 3)
    assert result["n_graded"] == 0
    assert all(row["parse_status"] == "error" for row in result["items"])


def test_count_mismatch_fails_instead_of_zip_truncation():
    with pytest.raises(ValueError, match="output count"):
        fixture_result([])


def test_old_markdown_endpoint_keeps_complete_json():
    result, _ = fixture_result()
    rendered = m.render_result(result)
    recovered = json.loads(rendered.split("```json\n")[1].split("\n```")[0])
    assert recovered == result


def test_restart_recovers_archived_sequence_and_duplicate_receipt():
    result, _ = fixture_result()
    next_seq, completed = m.recovery_state([result, result])
    assert next_seq == 3 and completed[2] == result
    assert m.select_window(7, m.load_bank(m.BANKS[2])[1], m.BANKS[2])[0] == 20


def test_legacy_reset_counters_do_not_reset_recovery():
    history = [{"model": m.MODELS[0], "bank": m.BANKS[0], "timestamp": f"day-{n}", "run": 0} for n in range(12)]
    assert m.recovery_state(history + history)[0] == 12


def test_conflicting_or_wrong_rotation_receipt_fails_closed():
    result, _ = fixture_result()
    conflicting = copy.deepcopy(result)
    conflicting["run_id"] = "different"
    conflicting["receipt_sha256"] = m.sha256(m.canonical_json({k: v for k, v in conflicting.items() if k != "receipt_sha256"}))
    with pytest.raises(ValueError, match="conflicting"):
        m.recovery_state([result, conflicting])
    result["model"] = m.MODELS[0]
    with pytest.raises(ValueError, match="rotation"):
        m.recovery_state([result])


def test_window_does_not_duplicate_small_banks_and_wraps_deterministically():
    rows = [{"id": n} for n in range(3)]
    assert [row["id"] for row in m.select_window(0, rows, m.BANKS[0])[1]] == [0, 1, 2]
    assert [row["id"] for row in m.select_window(5, rows, m.BANKS[0])[1]] == [2, 0, 1]


@pytest.mark.parametrize("sequence", [-1, True, 1.1])
def test_invalid_sequence_fails(sequence):
    with pytest.raises(ValueError):
        m.select_window(sequence, [{}], m.BANKS[0])


def test_bank_hash_blocks_changed_expected_label(tmp_path):
    shutil.copytree(HERE / "banks", tmp_path / "banks")
    shutil.copy(HERE / "banks.json", tmp_path / "banks.json")
    path = tmp_path / "banks/gspc-prv.jsonl"
    path.write_text(path.read_text().replace('"SURVIVES"', '"DESTROYED"', 1))
    with pytest.raises(ValueError, match="SHA256"):
        m.load_bank("csoai/gspc-prv", tmp_path)


@pytest.mark.parametrize("ids,eos,limit,want", [([1, 2], 2, 2, "eos_token"),
    ([1, 2], [2, 3], 4, "eos_token"), ([1, 2], 3, 2, "length"),
    ([1], None, 2, "unknown"), ([], 2, 96, "unknown")])
def test_observed_stop_is_explicit(ids, eos, limit, want):
    assert m.observed_stop(ids, eos, limit) == want


def test_durable_receipt_tampering_blocks_recovery():
    result, _ = fixture_result()
    result["items"][0]["raw_output"] = "changed"
    with pytest.raises(ValueError, match="receipt SHA256"):
        m.recovery_state([result])


def test_real_gradio_endpoint_shape_and_cached_replay_without_gpu(monkeypatch):
    import importlib.util
    import types
    monkeypatch.setenv("GRADIO_ANALYTICS_ENABLED", "False")
    def forbidden(*args, **kwargs):
        raise AssertionError("qualification must not invoke GPU or model metadata")
    monkeypatch.setitem(sys.modules, "spaces", types.SimpleNamespace(GPU=lambda **kwargs: lambda fn: forbidden))
    spec = importlib.util.spec_from_file_location("gspc_app_under_test", HERE / "app.py")
    app = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(app)
    by_name = {row["api_name"]: row for row in app.demo.config["dependencies"]}
    assert by_name["measure_next"]["inputs"] == []
    assert len(by_name["measure_next"]["outputs"]) == 1
    assert len(by_name["measure_at"]["inputs"]) == 1 and len(by_name["measure_at"]["outputs"]) == 1
    result, _ = fixture_result()
    app._next_sequence, app._completed = 3, {2: result}
    monkeypatch.setattr(app, "HfApi", forbidden)
    assert app.measure_at(2) == result


def test_receipt_hash_survives_js_whole_number_round_trip():
    result, _ = fixture_result([{"answer": "unfinished", "raw_output": "unfinished"}] * 3)
    archived = json.loads(m.canonical_json(result))
    assert archived["accuracy_all_attempted"] == 0
    assert m.recovery_state([archived])[0] == 3
