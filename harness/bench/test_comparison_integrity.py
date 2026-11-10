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
from execution_context import context_digest, compare_contexts, unknown_context, validate_context, load_context


def context():
    """Synthetic declarations exercise the software, not provider entitlements."""
    return dict(version=1, provider='synthetic', model='synthetic-a', route_id='synthetic-controls',
        access_channel='direct_api', access_program='none', cyber_tier='standard',
        safeguard_profile='synthetic-profile-v1', generation={'temperature': 0.0, 'max_tokens': 128},
        provenance={'source': 'operator_declaration', 'observed_at': '2026-11-10T00:00:00Z', 'evidence_sha256': None})


def bind_context(receipt, value):
    receipt['execution_context'] = value
    receipt['execution_context_sha256'] = context_digest(value)
    receipt['model'] = value['model']
    receipt.setdefault('generation_parameters_source', 'supplied_context')
    return receipt


def result():
    return bind_context(dict(axis="safety", bank_repo="gspc-agi", bank_sha256="a" * 64,
                grader="gspc-top100.mill_hub_queue.read_label", grader_source="canonical",
                grader_source_sha256="b" * 64, items_total=2, bank_items_total=2,
                rows=[dict(index=i, expected=e, observed=e, ok=True,
                           prompt_sha256=hashlib.sha256(str(i).encode()).hexdigest())
                      for i, e in enumerate(["COMPLY", "REFUSE"])]), context())


@pytest.mark.parametrize('change', ['legacy', 'unknown', 'no_digest', 'tampered', 'unknown_provenance', 'unknown_generation'])
def test_unknown_or_tampered_execution_conditions_never_compare(change):
    left, right = result(), result()
    if change == 'legacy':
        for item in (left, right): item.pop('execution_context'); item.pop('execution_context_sha256')
    elif change == 'unknown': bind_context(right, unknown_context('synthetic-a'))
    elif change == 'no_digest': right.pop('execution_context_sha256')
    elif change == 'tampered': right['execution_context']['route_id'] = 'changed-route'
    elif change == 'unknown_provenance':
        c = context(); c['provenance']['source'] = 'unknown'; bind_context(right, c)
    elif change == 'unknown_generation':
        c = context(); c['generation']['max_tokens'] = None; bind_context(right, c)
    with pytest.raises(ValueError): paired.comparable_rows(left, right)


@pytest.mark.parametrize('field,value', [('cyber_tier','defense'), ('safeguard_profile','other-profile'), ('max_tokens',256), ('temperature',1.0)])
def test_mixed_safeguards_and_budgets_are_refused(field, value):
    left, right = result(), result(); c = context()
    if field in c['generation']: c['generation'][field] = value
    elif field == 'cyber_tier': c.update(access_program='anthropic_cvp', cyber_tier=value)
    else: c[field] = value
    bind_context(right, c)
    with pytest.raises(ValueError): paired.comparable_rows(left, right)


def test_intentional_between_model_provider_and_route_differences_are_disclosed():
    left, right = result(), result(); c = context()
    c.update(provider='other-provider', model='other-model', route_id='other-public-route', access_channel='third_party')
    bind_context(right, c)
    paired.comparable_rows(left, right)
    report = compare_contexts(left, right)
    assert report['different_fields'] == ['provider', 'model', 'route_id', 'access_channel']
    assert report['provenance_sources'] == ['operator_declaration', 'operator_declaration']
    assert 'not authenticated' in report['basis']


def test_known_access_treatment_requires_explicit_mode():
    left, right = result(), result(); c = context()
    c.update(access_program='anthropic_cvp', cyber_tier='defense'); bind_context(right, c)
    with pytest.raises(ValueError, match='cyber tier'): paired.comparable_rows(left, right)
    paired.comparable_rows(left, right, 'access-treatment')
    report = compare_contexts(left, right, 'access-treatment')
    assert report['mode'] == 'access-treatment'
    assert report['left_context_sha256'] != report['right_context_sha256']
    assert 'no model-superiority' in report['interpretation']


@pytest.mark.parametrize('field', ['model', 'provider', 'route_id', 'access_channel', 'generation', 'safeguard_profile'])
def test_access_treatment_refuses_other_changes(field):
    left, right = result(), result(); c = context()
    c.update(access_program='anthropic_cvp', cyber_tier='defense')
    c[field] = {'temperature': 0.0, 'max_tokens': 256} if field == 'generation' else 'third_party' if field == 'access_channel' else 'different'
    bind_context(right, c)
    with pytest.raises(ValueError): paired.comparable_rows(left, right, 'access-treatment')


@pytest.mark.parametrize('value', ['sk-secret-value', 'org-private-value', 'workspace-private-value',
    'https://private.example/path', 'person@example.test', '123e4567-e89b-12d3-a456-426614174000'])
def test_route_metadata_rejects_identifiers_and_credentials(value):
    c = context(); c['route_id'] = value
    with pytest.raises(ValueError): validate_context(c)


def test_only_documented_fields_can_be_published():
    c = context(); c['workspace_id'] = 'private'
    with pytest.raises(ValueError): validate_context(c)


def test_provider_record_needs_evidence_and_never_becomes_harness_verification():
    c = context(); c['provenance']['source'] = 'provider_record'
    with pytest.raises(ValueError, match='evidence digest'): validate_context(c)
    c['provenance']['evidence_sha256'] = 'c' * 64
    report = compare_contexts(bind_context(result(), c), bind_context(result(), c))
    assert report['provenance_sources'] == ['provider_record', 'provider_record']
    assert 'not authenticated' in report['basis']


@pytest.mark.parametrize('field,value', [('access_channel', []), ('cyber_tier', {}),
    ('access_program', True), ('version', True)])
def test_malformed_context_types_fail_cleanly(field,value):
    c = context(); c[field] = value
    with pytest.raises(ValueError): validate_context(c)


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


@pytest.mark.parametrize('source', [None, {}, {'api_key': 'synthetic-secret'}, 'provider-approved', 'unknown'])
def test_untrusted_or_unknown_generation_source_cannot_compare(source):
    left, right = result(), result(); right['generation_parameters_source'] = source
    with pytest.raises(ValueError): paired.comparable_rows(left, right)


@pytest.mark.parametrize('label', ['route_sk-ant-syntheticsecret1234', 'ghp_syntheticsecret1234567890',
    'route_12345678-1234-1234-1234-123456789012'])
def test_embedded_credential_and_account_shapes_are_rejected(label):
    c = context(); c['route_id'] = label
    with pytest.raises(ValueError): validate_context(c)


def test_public_risk_model_label_is_not_mistaken_for_a_secret():
    c = context(); c['model'] = 'risk-model'
    assert validate_context(c)['model'] == 'risk-model'


def test_public_model_revision_is_preserved_without_accepting_an_email():
    c=context();c['model']='example/model@'+'a'*40
    assert validate_context(c)['model']==c['model']
    c['model']='person@example.test'
    with pytest.raises(ValueError): validate_context(c)


def test_duplicate_context_fields_are_refused(tmp_path):
    path=tmp_path/'context.json'
    path.write_text(json.dumps(context()).replace('"cyber_tier": "standard"',
        '"cyber_tier": "defense", "cyber_tier": "standard"'))
    with pytest.raises(ValueError,match='duplicate'): load_context(str(path))


def test_access_treatment_cli_labels_conditions_without_model_winner(tmp_path, monkeypatch):
    left, right = result(), result(); c = context()
    c.update(access_program='anthropic_cvp', cyber_tier='defense'); bind_context(right, c)
    for name, data in [('left',left),('right',right)]: (tmp_path/name).write_text(json.dumps(data))
    out = tmp_path/'comparison.json'; monkeypatch.setattr(paired,'board_axis',lambda axis: None)
    monkeypatch.setattr('sys.argv',['paired','--frontier',str(tmp_path/'left'),'--meok',str(tmp_path/'right'),
        '--comparison-mode','access-treatment','--out',str(out)])
    assert paired.main() == 0
    doc = json.loads(out.read_text())
    assert doc['paired']['verdict'] == 'NO_DETECTED_CONFIGURATION_DIFFERENCE'
    assert [a['role'] for a in doc['arms']] == ['declared access condition A','declared access condition B']
    assert all(a['generation_parameters_source'] == 'supplied_context' for a in doc['arms'])
    assert 'UNMEASURED_CHAT' not in json.dumps(doc)
    assert 'safety axis' in doc['what_this_is']
    assert doc['execution_comparison']['left_context_sha256'] == left['execution_context_sha256']


@pytest.mark.parametrize('include_candidate', [False, True])
def test_model_mode_cli_does_not_invent_product_identity(tmp_path, monkeypatch, include_candidate):
    left, right = result(), result(); c = context()
    c.update(provider='other-provider', model='synthetic-b', route_id='other-public-route')
    bind_context(right, c)
    for name, data in [('reference.json', left), ('candidate.json', right)]:
        (tmp_path/name).write_text(json.dumps(data))
    out = tmp_path/'comparison.json'; monkeypatch.setattr(paired, 'board_axis', lambda axis: None)
    argv = ['paired', '--frontier', str(tmp_path/'reference.json'), '--out', str(out)]
    if include_candidate: argv.extend(['--meok', str(tmp_path/'candidate.json')])
    monkeypatch.setattr('sys.argv', argv)
    assert paired.main() == 0
    doc = json.loads(out.read_text())
    assert [arm['role'] for arm in doc['arms']] == ['model deployment A', 'model deployment B'][:len(doc['arms'])]
    assert len(doc['arms']) == 1 + include_candidate
    assert all(phrase not in json.dumps(doc) for phrase in ['our own product', 'MEOK', 'UNMEASURED_CHAT'])
    assert 'measurement scope' in ' '.join(doc['what_this_does_not_establish'])
    if include_candidate:
        assert doc['arms'][1]['name'] == 'synthetic-b'
        assert doc['execution_comparison']['mode'] == 'model'
        assert doc['paired']['items_paired'] == 2
        assert doc['paired']['verdict'] == 'TIE'
    else:
        assert doc['paired'] is None
        assert 'not run' in doc['meok_arm_status']


def test_explicit_meok_status_and_route_ledger_remain_available(tmp_path, monkeypatch):
    receipt = tmp_path/'reference.json'; receipt.write_text(json.dumps(result()))
    split = tmp_path/'routes.jsonl'
    split.write_text('{"route_type":"chat","measurement_state":"UNMEASURED_CHAT"}\n')
    note = 'MEOK chat replies remain UNMEASURED_CHAT; no MEOK result supplied.'
    out = tmp_path/'comparison.json'; monkeypatch.setattr(paired, 'board_axis', lambda axis: None)
    monkeypatch.setattr('sys.argv', ['paired', '--frontier', str(receipt), '--meok-note', note,
        '--meok-split', str(split), '--out', str(out)])
    assert paired.main() == 0
    doc = json.loads(out.read_text())
    assert doc['meok_arm_status'] == note
    assert doc['arm_split_meok']['counts'] == {'chat/UNMEASURED_CHAT': 1}
    assert doc['paired'] is None


def test_mixed_tier_cli_writes_no_ordinary_comparison(tmp_path,monkeypatch):
    left,right=result(),result();c=context();c.update(access_program='anthropic_cvp',cyber_tier='defense');bind_context(right,c)
    for name,data in [('left',left),('right',right)]: (tmp_path/name).write_text(json.dumps(data))
    out=tmp_path/'comparison.json'
    monkeypatch.setattr('sys.argv',['paired','--frontier',str(tmp_path/'left'),'--meok',str(tmp_path/'right'),'--out',str(out)])
    assert paired.main()==2
    assert not out.exists()


def test_old_offline_run_stays_usable_but_access_is_unknown(tmp_path,monkeypatch):
    raw=b'{"prompt":"First","expected":"COMPLY"}\n{"prompt":"Second","expected":"REFUSE"}\n'
    monkeypatch.setattr(runner,'load_bank_bytes',lambda axis:(raw,hashlib.sha256(raw).hexdigest(),'https://example.test/bank'))
    answers=tmp_path/'answers.jsonl'; answers.write_text('{"index":0,"answer":"COMPLY"}\n{"index":1,"answer":"REFUSE"}\n')
    out=tmp_path/'result.json'
    monkeypatch.setattr('sys.argv',['run','--axis','safety','--model','synthetic-a','--answers',str(answers),'--out',str(out)])
    assert runner.main()==0
    doc=json.loads(out.read_text())
    assert doc['accuracy']==1.0
    assert doc['execution_context']['cyber_tier']=='unknown'
    assert doc['execution_context']['generation']=={'temperature':None,'max_tokens':None}
    assert doc['generation_parameters_source']=='unknown'
    with pytest.raises(ValueError,match='unknown'): paired.comparable_rows(doc,doc)


def test_live_context_budget_mismatch_fails_before_any_network(tmp_path,monkeypatch):
    path=tmp_path/'context.json';path.write_text(json.dumps(context()))
    def unexpected_network(axis): raise AssertionError('invalid context must fail before fetching a bank')
    monkeypatch.setattr(runner,'load_bank_bytes',unexpected_network)
    monkeypatch.setattr('sys.argv',['run','--axis','safety','--model','synthetic-a','--execution-context',str(path),
        '--max-tokens','256','--out',str(tmp_path/'result.json')])
    assert runner.main()==2
    assert not (tmp_path/'result.json').exists()


def test_offline_context_preserves_original_generation_declaration(tmp_path,monkeypatch):
    raw=b'{"prompt":"First","expected":"COMPLY"}\n{"prompt":"Second","expected":"REFUSE"}\n'
    monkeypatch.setattr(runner,'load_bank_bytes',lambda axis:(raw,hashlib.sha256(raw).hexdigest(),'https://example.test/bank'))
    path=tmp_path/'context.json'; path.write_text(json.dumps(context()))
    answers=tmp_path/'answers.jsonl'; answers.write_text('{"index":0,"answer":"COMPLY"}\n{"index":1,"answer":"REFUSE"}\n')
    out=tmp_path/'result.json'
    monkeypatch.setattr('sys.argv',['run','--axis','safety','--answers',str(answers),'--execution-context',str(path),'--out',str(out)])
    assert runner.main()==0
    doc=json.loads(out.read_text())
    assert doc['model']=='synthetic-a'
    assert doc['execution_context']['generation']['max_tokens']==128
    assert doc['generation_parameters_source']=='supplied_context'
    paired.comparable_rows(doc,doc)
