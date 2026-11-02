"""Replay the pinned reference and profile; emit deterministic public results."""
import argparse
import copy
import hashlib
import json
from pathlib import Path
import profile

def results():
    count = profile.verify_upstream()
    check, gen = profile.load_module('check'), profile.load_module('generate')
    expected=json.loads((profile.UP/'expected.json').read_text())
    rows=[]
    for cid in sorted(expected['cases']):
        inp=check.load_case(cid); out=profile.evaluate(inp,check)
        want=expected['cases'][cid]
        assert (out['result'],out['reason'])==(want['result'],want['reason'])
        rows.append({'id':cid,**out})
    for mid,(base,_,mutate) in check.MUTATIONS.items():
        inp=check.load_case(base);mutate(inp);out=profile.evaluate(inp,check)
        want=expected['mutations'][mid]
        assert (out['result'],out['reason'])==(want['result'],want['reason'])
        rows.append({'id':mid,**out})
    extras=[]
    for name in ['subject-mismatch','future-lookup','future-attested-time']:
        inp=check.load_case('C01')
        if name=='subject-mismatch':
            payload=dict(inp['statement']['payload'],identifier='urn:example:subject-b')
            inp['statement']=gen.timestamped(gen.sign(payload,'k-2026'),'2026-10-10T12:00:00Z')
        elif name=='future-lookup':inp['lookup']['fetchedAt']='2026-10-12T00:00:00Z'
        else:inp['statement']=gen.timestamped(gen.sign(inp['statement']['payload'],'k-2026'),'2026-10-12T00:00:00Z')
        out=profile.evaluate(inp,check)
        assert out['result']!='pass' and out['upstream_result']['result']=='pass'
        extras.append({'id':name,**out})
    return {'schema':'council.key-evidence-replay/1','upstream_commit':profile.PIN,
      'upstream_file_count':count,'reproduction_type':'same-reference-implementation; Council integration profile',
      'fixture_scope':'synthetic','execution_authority':False,'baseline_cases':rows,'additional_profile_cases':extras,
      'limitations':['Not a W3C Recommendation or adopted group requirement.','Not an independent cryptographic implementation.','Not a production authority service or general credential verifier.','Hashes provide byte comparison, not publisher authentication.']}

def main():
    p=argparse.ArgumentParser();p.add_argument('--check',action='store_true');args=p.parse_args()
    data=(json.dumps(results(),indent=2,sort_keys=True)+'\n').encode()
    target=profile.HERE/'results.json'
    example=(json.dumps(profile.load_module('check').load_case('C01'),indent=2,sort_keys=True)+'\n').encode()
    if args.check:
        assert target.read_bytes()==data,'Stored results differ from replay'
        assert (profile.HERE/'example.json').read_bytes()==example,'Example drift'
    else:
        target.write_bytes(data);(profile.HERE/'example.json').write_bytes(example)
    print(json.dumps({'baseline_matches':21,'additional_profile_cases':3,'upstream_files_verified':26,'result_sha256':hashlib.sha256(data).hexdigest(),'mode':'check' if args.check else 'write'}))
if __name__=='__main__':main()
