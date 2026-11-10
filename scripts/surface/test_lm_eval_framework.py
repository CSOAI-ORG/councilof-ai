"""Actual lm-eval 0.4.13 lifecycle with fixed fake responses. No model or GPU is used."""
import importlib.util
import json
import shutil
from pathlib import Path

import pytest
from datasets import Dataset, disable_progress_bars
from lm_eval.api.model import LM
from lm_eval.evaluator import evaluate
from lm_eval.tasks import TaskManager

ROOT = Path(__file__).resolve().parents[2]
PACK = ROOT / "public/bench/lm-eval"
MANIFEST = json.loads((PACK / "manifest.json").read_text())
disable_progress_bars()


def load_tasks(names=None, pack=PACK):
    manager = TaskManager(include_path=str(pack), include_defaults=False)
    return manager.load(names or [row["task"] for row in MANIFEST["axes"]])["tasks"]


class FixedResponses(LM):
    """A fixture adapter exercising framework requests/filters/aggregation, not inference."""
    def __init__(self, invalid_only=False):
        super().__init__()
        self.invalid_only = invalid_only

    def loglikelihood(self, requests):
        raise AssertionError("generation task requested likelihood")

    def loglikelihood_rolling(self, requests):
        raise AssertionError("generation task requested rolling likelihood")

    def generate_until(self, requests):
        labels = {row["task"]: row["labels"] for row in MANIFEST["axes"]}
        answers = []
        for request in requests:
            if self.invalid_only or request.doc_id % 3 == 2:
                answers.append("This is an unfinished explanation with no answer")
            elif request.doc_id % 3 == 0:
                answers.append(str(request.doc["expected"]))
            else:
                answers.append(next(x for x in labels[request.task_name] if x != str(request.doc["expected"])))
        return answers


def test_all_tasks_load_and_render_without_network():
    tasks = load_tasks()
    assert len(tasks) == len(MANIFEST["axes"]) == 12
    for row in MANIFEST["axes"]:
        task = tasks[row["task"]]
        docs = task.test_docs()
        assert isinstance(docs, Dataset) and len(docs) == row["items"]
        prompt = task.doc_to_text(docs[0])
        assert str(docs[0][row["prompt_key"]]) in prompt
        assert "{item}" not in prompt and "{{" not in prompt
        assert str(task.doc_to_target(docs[0])) == str(docs[0]["expected"])


def test_framework_counts_wrong_correct_and_unparsed_separately():
    result = evaluate(FixedResponses(), load_tasks(), limit=3, bootstrap_iters=0, log_samples=True)
    for task, metrics in result["results"].items():
        assert metrics["exact_match,none"] == 0.5, (task, metrics)
        assert metrics["n_attempted,none"] == 3
        assert metrics["n_graded,none"] == 2
        assert metrics["parse_rate,none"] == pytest.approx(2 / 3)
    assert all(len(rows) == 3 for rows in result["samples"].values())


def test_all_invalid_has_no_accuracy_in_framework():
    result = evaluate(FixedResponses(invalid_only=True), load_tasks(["gspc_provenance"]),
                      limit=3, bootstrap_iters=0, log_samples=True)
    metrics = result["results"]["gspc_provenance"]
    assert "exact_match,none" not in metrics
    assert metrics["n_graded,none"] == 0 and metrics["n_attempted,none"] == 3
    assert metrics["parse_rate,none"] == 0


def test_tampered_bank_fails_before_task_creation(tmp_path):
    source = PACK / "provenance"
    dest = tmp_path / "provenance"
    shutil.copytree(source, dest)
    with (dest / "bank.jsonl").open("ab") as stream:
        stream.write(b" ")
    with pytest.raises(ValueError, match="SHA256 mismatch"):
        load_tasks(["gspc_provenance"], tmp_path)


def test_legacy_alias_resolves_the_canonical_contract(tmp_path):
    shutil.copytree(PACK, tmp_path / "lm-eval")
    aliases = {"mcp": "conformance", "oss": "openness", "prv": "provenance",
               "asi": "continuity", "det": "detector-interop", "art5": "art5-safeguard"}
    (tmp_path / "tasks").mkdir()
    for old, axis in aliases.items():
        (tmp_path / "tasks" / f"gspc_{old}.yaml").write_text(
            f"include: ../lm-eval/{axis}/{axis}.yaml\ntask: gspc_{old}\n")
    loaded = load_tasks([f"gspc_{old}" for old in aliases], tmp_path / "tasks")
    assert len(loaded) == 6
    for old, axis in aliases.items():
        task = loaded[f"gspc_{old}"]
        expected = next(row for row in MANIFEST["axes"] if row["axis"] == axis)
        assert len(task.test_docs()) == expected["items"]
        assert str(task.test_docs()[0][expected["prompt_key"]]) in task.doc_to_text(task.test_docs()[0])
