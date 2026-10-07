import copy, json, pathlib, sys
try:
    import jsonschema
except Exception as e:
    print('SKIP jsonschema unavailable:', e); sys.exit(2)
ROOT=pathlib.Path(__file__).resolve().parent
S=json.loads((ROOT/'hitl-authority-effect-v0.1.schema.json').read_text())
E=json.loads((ROOT/'hitl-authority-effect.example.json').read_text())
P=json.loads((ROOT/'csoai-alliance-control-plugin-v0.2.json').read_text())
jsonschema.Draft202012Validator.check_schema(S)
jsonschema.validate(E,S)

def rejected(mutator, label):
    bad=copy.deepcopy(E); mutator(bad)
    try:
        jsonschema.validate(bad,S)
    except jsonschema.ValidationError:
        return
    raise SystemExit('FAIL '+label)

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
jsonschema.validate(denied,S)

assert P['independence']['hitl_requires_gspc'] is False
assert P['independence']['claim_maintenance_requires_gspc'] is False
assert P['independence']['measurement_grants_execution_authority'] is False
assert P['normative_profiles']['hitl_authority_effect']=='hitl-authority-effect-v0.1.schema.json'
assert P['normative_profiles']['claim_maintenance']=='safe-reverification-record-v0.1.schema.json'
print('PASS 10/10 HITL + claim-maintenance composition controls')

[executed on device: IOKs-MacBook-Air.local (3a313181-9802-49ab-b57a-b58a3fd4466a)]