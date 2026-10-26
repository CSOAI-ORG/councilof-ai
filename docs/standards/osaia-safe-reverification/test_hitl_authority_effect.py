import copy, json, pathlib, sys
try:
    import jsonschema
except ImportError as e:
    print('SKIP jsonschema unavailable:', e); sys.exit(2)
ROOT=pathlib.Path(__file__).resolve().parent
S=json.loads((ROOT/'hitl-authority-effect-v0.1.schema.json').read_text())
E=json.loads((ROOT/'hitl-authority-effect.example.json').read_text())
P=json.loads((ROOT/'csoai-alliance-control-plugin-v0.2.json').read_text())
jsonschema.Draft202012Validator.check_schema(S)
validator=jsonschema.Draft202012Validator(S, format_checker=jsonschema.FormatChecker())
counts={'existing_schema_cases':0, 'plugin_assertions':0, 'added_schema_controls':0}

def accepted(record, category):
    validator.validate(record)
    counts[category] += 1

def rejected(mutator, label, category='existing_schema_cases'):
    bad=copy.deepcopy(E); mutator(bad)
    try:
        validator.validate(bad)
    except jsonschema.ValidationError:
        counts[category] += 1
        return
    raise SystemExit('FAIL '+label)

def plugin_assertion(condition, label):
    if not condition:
        raise SystemExit('FAIL '+label)
    counts['plugin_assertions'] += 1

accepted(E, 'existing_schema_cases')
rejected(lambda x: x['authority'].__setitem__('decision','DENY'), 'deny+executed accepted')
rejected(lambda x: x['authority'].__setitem__('decision','REVOKE'), 'revoke+executed accepted')
rejected(lambda x: x['invocation'].__setitem__('invocation_digest',None), 'executed without invocation digest accepted')
rejected(lambda x: x['effect'].__setitem__('effect_digest',None), 'observed effect without digest accepted')
rejected(lambda x: x['verification'].__setitem__('evidence_refs',[]), 'verified without evidence accepted')

denied=copy.deepcopy(E)
denied['authority']['decision']='DENY'
denied['invocation']={'state':'REJECTED'}
denied['effect']={'state':'NONE'}
denied['verification']={'state':'NOT_RUN','evidence_refs':[]}
accepted(denied, 'existing_schema_cases')

plugin_assertion(P['independence']['hitl_requires_gspc'] is False, 'HITL requires GSPC')
plugin_assertion(P['independence']['claim_maintenance_requires_gspc'] is False, 'claim maintenance requires GSPC')
plugin_assertion(P['independence']['measurement_grants_execution_authority'] is False, 'measurement grants authority')
plugin_assertion(P['normative_profiles']['hitl_authority_effect']=='hitl-authority-effect-v0.1.schema.json', 'HITL schema reference changed')
plugin_assertion(P['normative_profiles']['claim_maintenance']=='safe-reverification-record-v0.1.schema.json', 'SAFE schema reference changed')

for state in ('FAILED', 'PARTIAL'):
    valid=copy.deepcopy(E)
    valid['verification']['state']=state
    accepted(valid, 'added_schema_controls')

for state in ('VERIFIED', 'FAILED', 'PARTIAL'):
    for field in ('verified_at', 'verifier_ref', 'method_ref'):
        for value in (None, ''):
            def mutate(record, state=state, field=field, value=value):
                record['verification']['state']=state
                record['verification'][field]=value
            rejected(mutate, f'{state} accepted {field}={value!r}', 'added_schema_controls')

for path in (
    ('issued_at',),
    ('authority', 'decided_at'),
    ('authority', 'expires_at'),
    ('invocation', 'invoked_at'),
    ('effect', 'observed_at'),
    ('verification', 'verified_at'),
):
    def malformed_time(record, path=path):
        target=record
        for key in path[:-1]:
            target=target[key]
        target[path[-1]]='not-a-date-time'
    rejected(malformed_time, f'malformed timestamp accepted at {".".join(path)}', 'added_schema_controls')

total=sum(counts.values())
print(f"PASS {counts['existing_schema_cases']} existing schema cases; "
      f"{counts['plugin_assertions']} plugin assertions; "
      f"{counts['added_schema_controls']} added schema controls ({total} total)")
