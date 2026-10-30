"""Adversarial regression checks for comparable, complete benchmark runs."""
import hashlib
import importlib.util
import json
from pathlib import Path

import pytest

HERE = Path(__file__).parent
spec = importlib.util.spec_from_file_location("paired_integrity", HERE / "paired_comparison.py")
paired = importlib.util.module_from_spec(spec)
spec.loader.exec_module(paired)
spec = importlib.util.spec_from_file_location("bench_integrity", HERE / "run_bench.py")
runner = importlib.util.module_from_spec(spec)
spec.loader.exec_module(runner)


def result():
    return dict(axis="safety", bank_repo="gspc-agi", bank_sha256="a" * 64,
                grader="gspc-top100.mill_hub_queue.read_label", grader_source="canonical",
                grader_source_sha256="b" * 64, items_total=2, bank_items_total=2,
                rows=[dict(index=i, expected=e, observed=e, ok=True,
                           prompt_sha256=hashlib.sha256(str(i).encode()).hexdigest())
                      for i, e in enumerate(["COMPLY", "REFUSE"])])


@pytest.mark.parametrize("field", ["axis", "bank_repo", "bank_sha256", "grader", "grader_source_sha256"])
def test_different_instruments_never_get_a_p_value(field):
    left, right = result(), result()
    right[field] = "different"
    with pytest.raises(ValueError, match=field):
        paired.comparable_rows(left, right)


@pytest.mark.parametrize("change", ["duplicate", "missing", "different_set", "different_prompt", "different_gold", "false_hit", "unparsed_hit", "partial", "old_unpinned"])
def test_invalid_ledgers_fail_closed(change):
    left, right = result(), result()
    if change == "duplicate": right["rows"][1]["index"] = 0
    elif change == "missing": right["rows"].pop()
    elif change == "different_set": right["rows"][1]["index"] = 3
    elif change == "different_prompt": right["rows"][1]["prompt_sha256"] = "c" * 64
    elif change == "different_gold": right["rows"][1].update(expected="COMPLY", observed="COMPLY")
    elif change == "false_hit": right["rows"][1]["observed"] = "COMPLY"
    elif change == "unparsed_hit": right["rows"][1]["observed"] = None
    elif change == "partial": right["bank_items_total"] = 4
    elif change == "old_unpinned": del right["grader_source_sha256"]
    with pytest.raises(ValueError): paired.comparable_rows(left, right)


def test_order_does_not_change_the_matching():
    right = result(); right["rows"].reverse()
    left_map, right_map = paired.comparable_rows(result(), right)
    assert left_map == right_map


def test_matching_but_shifted_indices_are_not_full_bank_coverage():
    left,right=result(),result()
    for data in (left,right):
        for row in data['rows']:row['index']+=2
    with pytest.raises(ValueError,match='complete bank'):
        paired.comparable_rows(left,right)


def test_refused_cli_writes_no_comparison(tmp_path, monkeypatch):
    left, right = result(), result(); right["bank_sha256"] = "c" * 64
    for name, data in [("left", left), ("right", right)]:
        (tmp_path / name).write_text(json.dumps(data))
    out = tmp_path / "comparison.json"
    monkeypatch.setattr("sys.argv", ["paired", "--frontier", str(tmp_path / "left"), "--meok", str(tmp_path / "right"), "--out", str(out)])
    assert paired.main() == 2
    assert not out.exists()


def test_missing_offline_answer_remains_in_the_ledger(tmp_path, monkeypatch):
    raw = b'{"prompt":"First","expected":"COMPLY"}\n{"prompt":"Second","expected":"REFUSE"}\n'
    monkeypatch.setattr(runner, "load_bank_bytes", lambda axis: (raw, hashlib.sha256(raw).hexdigest(), "https://example.test/pinned"))
    answers = tmp_path / "answers.jsonl"; answers.write_text('{"index":0,"answer":"COMPLY"}\n')
    out = tmp_path / "result.json"
    monkeypatch.setattr("sys.argv", ["run", "--axis", "safety", "--answers", str(answers), "--out", str(out)])
    assert runner.main() == 3
    data = json.loads(out.read_text())
    assert data["items_total"] == data["bank_items_total"] == len(data["rows"]) == 2
    assert data["items_unparsed"] == 1
    assert data["rows"][1]["answer_missing"] is True
    assert data["rows"][1]["observed"] is None
    assert data["rows"][1]["ok"] is None
    assert len(data["grader_source_sha256"]) == 64


def test_no_parsed_pairs_is_untested_not_tied(tmp_path, monkeypatch):
    data = result()
    for row in data["rows"]: row.update(observed=None, ok=None)
    for name in ["left", "right"]: (tmp_path / name).write_text(json.dumps(data))
    out = tmp_path / "comparison.json"
    monkeypatch.setattr(paired, "board_axis", lambda axis: None)
    monkeypatch.setattr("sys.argv", ["paired", "--frontier", str(tmp_path / "left"), "--meok", str(tmp_path / "right"), "--out", str(out)])
    assert paired.main() == 0
    comparison = json.loads(out.read_text())["paired"]
    assert comparison["items_paired"] == 0
    assert comparison["verdict"] == "UNTESTED"
    assert comparison["exact_mcnemar_two_sided_p"] is None


@pytest.mark.parametrize('entries', [
    [{'index':0,'answer':'COMPLY'},{'index':0,'answer':'REFUSE'}],
    [{'index':True,'answer':'COMPLY'}], [{'index':'0','answer':'COMPLY'}],
    [{'index':5,'answer':'COMPLY'}], [{'index':0,'answer':None}],
    [{'index':0}], ['not an object'],
])
def test_offline_answers_reject_ambiguous_or_malformed_input(entries,tmp_path,monkeypatch):
    raw=b'{"prompt":"First","expected":"COMPLY"}\n{"prompt":"Second","expected":"REFUSE"}\n'
    monkeypatch.setattr(runner,'load_bank_bytes',lambda axis:(raw,hashlib.sha256(raw).hexdigest(),'https://example.test/bank'))
    answers=tmp_path/'answers.jsonl';answers.write_text('\n'.join(map(json.dumps,entries)))
    out=tmp_path/'result.json'
    monkeypatch.setattr('sys.argv',['run','--axis','safety','--answers',str(answers),'--out',str(out)])
    assert runner.main()==2
    assert not out.exists()


def test_long_original_reply_is_preserved_and_hashed(tmp_path,monkeypatch):
    raw=b'{"prompt":"First","expected":"COMPLY"}\n{"prompt":"Second","expected":"REFUSE"}\n'
    monkeypatch.setattr(runner,'load_bank_bytes',lambda axis:(raw,hashlib.sha256(raw).hexdigest(),'https://example.test/bank'))
    reply='reasoning ' * 100 + '\nCOMPLY'
    answers=tmp_path/'answers.jsonl';answers.write_text(json.dumps({'index':0,'answer':reply})+'\n'+json.dumps({'index':1,'answer':'REFUSE'})+'\n')
    out=tmp_path/'result.json';monkeypatch.setattr('sys.argv',['run','--axis','safety','--answers',str(answers),'--out',str(out)])
    assert runner.main()==0
    result=json.loads(out.read_text())
    assert result['rows'][0]['answer']==reply
    assert result['rows'][0]['answer_sha256']==hashlib.sha256(reply.encode()).hexdigest()
    assert result['accuracy_over_all_items']==1.0
