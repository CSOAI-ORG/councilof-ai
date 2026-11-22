"""Real Inspect execution using synthetic control replies, never model evidence."""
import hashlib
import json
import math
import sys
from pathlib import Path

import pytest
pytest.importorskip('inspect_ai')
from inspect_ai import eval
from inspect_ai.log import read_eval_log
from inspect_ai.model import get_model, ModelOutput

sys.path.insert(0, str(Path(__file__).parent))
from inspect_task import gspc, MILL


def fixture(tmp_path):
    bank = tmp_path / 'synthetic-controls.jsonl'
    bank.write_text(''.join(json.dumps({'item': f'Synthetic control {i}', 'expected': expected})+'\n'
        for i, expected in enumerate([' comply ', 'REFUSE', 'COMPLY', 'REFUSE'])))
    return bank, hashlib.sha256(bank.read_bytes()).hexdigest()


def run_controls(tmp_path, replies):
    bank, digest = fixture(tmp_path)
    task = gspc(str(bank), digest, 'governance')
    outputs = [ModelOutput.from_content(model='mockllm', content=r) for r in replies]
    model = get_model('mockllm/gspc-synthetic-controls', custom_outputs=outputs, memoize=False)
    log = eval(task, model=model, display='none', max_samples=1,
        log_dir=str(tmp_path / 'logs'), log_format='json')[0]
    assert log.status == 'success', log.error
    saved = read_eval_log(log.location)
    assert len(saved.samples) == len(replies) == 4
    assert {s.id for s in saved.samples} == {0, 1, 2, 3}
    assert saved.eval.metadata['bank_sha256'] == digest
    for sample, reply in zip(sorted(saved.samples, key=lambda s:s.id), replies):
        assert sample.output.completion == reply
        score = next(iter(sample.scores.values()))
        parsed = MILL.read_label(reply, ['COMPLY', 'REFUSE'])
        assert score.answer == parsed
        assert score.metadata['parsed'] == (parsed is not None)
        assert score.metadata['reply_sha256'] == hashlib.sha256(reply.encode()).hexdigest()
        assert score.value == int(parsed is not None and parsed == sample.target)
    return {k: v.value for k,v in saved.results.scores[0].metrics.items()}


def test_real_framework_keeps_both_denominators_and_full_replies(tmp_path):
    metrics = run_controls(tmp_path, ['COMPLY', 'COMPLY', 'Reply with EXACTLY ONE token from: COMPLY | REFUSE', ''])
    assert metrics['accuracy_over_all_items'] == .25
    assert metrics['accuracy_among_parsed'] == .5
    assert metrics['parsed_coverage'] == .5


def test_zero_parsed_has_no_conditional_accuracy(tmp_path):
    metrics = run_controls(tmp_path, ['', 'not an answer', 'I think this is COMPLY because', 'MAYBE'])
    assert metrics['accuracy_over_all_items'] == 0
    assert metrics['parsed_coverage'] == 0
    assert math.isnan(metrics['accuracy_among_parsed'])


def test_changed_bank_and_one_label_are_refused(tmp_path):
    bank, digest = fixture(tmp_path)
    with pytest.raises(ValueError, match='SHA-256'):
        gspc(str(bank), '0'*64, 'governance')
    bank.write_text(json.dumps({'item':'Synthetic', 'expected':'COMPLY'})+'\n')
    with pytest.raises((ValueError, RuntimeError)):
        gspc(str(bank), hashlib.sha256(bank.read_bytes()).hexdigest(), 'governance')


def test_inspect_context_binds_requested_limits_and_preserves_provenance(tmp_path,monkeypatch):
    from execution_context import context_digest
    from test_comparison_integrity import context
    bank,digest=fixture(tmp_path); c=context(); c['model']='gspc-synthetic-context'
    path=tmp_path/'context.json';path.write_text(json.dumps(c))
    task=gspc(str(bank),digest,'governance',execution_context_path=str(path))
    model=get_model('mockllm/gspc-synthetic-context',custom_outputs=[ModelOutput.from_content(model='mockllm',content=r)
        for r in ['COMPLY','REFUSE','COMPLY','REFUSE']],memoize=False)
    calls=[];original=model.api.generate
    async def capture(*args,**kwargs):
        config=kwargs['config'];calls.append((config.temperature,config.max_tokens))
        return await original(*args,**kwargs)
    monkeypatch.setattr(model.api,'generate',capture)
    log=eval(task,model=model,display='none',max_samples=1,temperature=1.0,max_tokens=999,
        log_dir=str(tmp_path/'logs'),log_format='json')[0]
    assert log.status=='success',log.error
    assert calls==[(0.0,128)]*4
    saved=read_eval_log(log.location)
    assert saved.eval.metadata['execution_context']==c
    assert saved.eval.metadata['execution_context_sha256']==context_digest(c)
    assert saved.eval.metadata['execution_context']['provenance']['source']=='operator_declaration'


def test_inspect_context_rejects_a_different_model_before_generation(tmp_path,monkeypatch):
    from test_comparison_integrity import context
    bank,digest=fixture(tmp_path);path=tmp_path/'context.json';path.write_text(json.dumps(context()))
    task=gspc(str(bank),digest,'governance',execution_context_path=str(path))
    model=get_model('mockllm/different-model',memoize=False)
    async def forbidden(*args,**kwargs): raise AssertionError('generation must not happen with a mismatched model')
    monkeypatch.setattr(model.api,'generate',forbidden)
    log=eval(task,model=model,display='none',max_samples=1,log_dir=str(tmp_path/'logs'),log_format='json')[0]
    assert log.status=='error'
    assert 'execution_context.model differs' in str(log.error)
