"""Inspect task backed by the canonical GSPC loader, prompt and grader.

Requires a local bank and its SHA-256. No downloads or provider calls occur
while constructing the task. Inspect's configured model performs evaluation.
"""
import hashlib
import sys
from pathlib import Path

from inspect_ai import Task, task
from inspect_ai.dataset import Sample
from inspect_ai.scorer import Score, metric, scorer
from inspect_ai.solver import generate

sys.path.insert(0, str(Path(__file__).resolve().parent))
from run_bench import MILL, bank_items, label_vocabulary, resolve_axis


@metric
def accuracy_over_all_items():
    def calculate(scores):
        return sum(s.value for s in scores) / len(scores) if scores else float('nan')
    return calculate


@metric
def parsed_coverage():
    def calculate(scores):
        return sum(s.metadata['parsed'] for s in scores) / len(scores) if scores else float('nan')
    return calculate


@metric
def accuracy_among_parsed():
    def calculate(scores):
        parsed = [s for s in scores if s.metadata['parsed']]
        return sum(s.value for s in parsed) / len(parsed) if parsed else float('nan')
    return calculate


@scorer(metrics=[accuracy_over_all_items(), parsed_coverage(), accuracy_among_parsed()])
def canonical_gspc(labels: list[str]):
    MILL.exact_label_menu(labels)
    async def score(state, target):
        reply = state.output.completion
        observed = MILL.read_label(reply, labels)
        return Score(value=int(observed is not None and observed == target.text),
            answer=observed, explanation=reply,
            metadata={'parsed': observed is not None, 'expected': target.text,
                'reply_sha256': hashlib.sha256(reply.encode()).hexdigest()})
    return score


@task
def gspc(bank_path: str, bank_sha256: str, axis: str):
    axis = resolve_axis(axis)
    raw = Path(bank_path).read_bytes()
    digest = hashlib.sha256(raw).hexdigest()
    if digest != bank_sha256:
        raise ValueError('bank SHA-256 differs from the declared frozen input')
    items = bank_items(raw)
    labels = label_vocabulary(items)
    MILL.exact_label_menu(labels)
    samples = []
    for i, (text, expected) in enumerate(items):
        prompt = MILL.axis_prompt(axis, text, labels)
        samples.append(Sample(id=i, input=prompt, target=expected.strip().upper(), metadata={
            'index': i, 'prompt_sha256': hashlib.sha256(prompt.encode()).hexdigest()}))
    return Task(dataset=samples, solver=generate(), scorer=canonical_gspc(labels),
        fail_on_error=True, epochs=1, name='gspc_'+axis.replace('-', '_'), metadata={
            'bank_sha256': digest, 'bank_items_total': len(items), 'axis': axis,
            'grader_source_sha256': hashlib.sha256(Path(MILL.__file__).read_bytes()).hexdigest(),
            'result_scope': 'evaluation log; no automatic board admission',
            'coverage_note': 'Inspect limit/sample_id can reduce execution; compare completed sample IDs with bank_items_total before claiming full coverage.'})
