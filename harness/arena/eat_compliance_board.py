#!/usr/bin/env python3
"""eat_compliance_board.py — aggregate all EAT GovBench results into a SIGNED per-model
compliance leaderboard (context-RAG lift), pod-canonical."""
import json, glob, hashlib, sys, os
from datetime import datetime, timezone
from pathlib import Path
from nacl.signing import SigningKey

def cjson(o):
    import math
    def _n(x):
        if isinstance(x,float):
            if x.is_integer(): return int(x)
            return x
        if isinstance(x,dict): return {k:_n(v) for k,v in x.items()}
        if isinstance(x,list): return [_n(v) for v in x]
        return x
    return json.dumps(_n(o), sort_keys=True, separators=(',',':'), ensure_ascii=False)

def cid(o): return hashlib.sha256(cjson(o).encode()).hexdigest()

D='/workspace/eat/benchmark-results/eat_govbench'
rows=[]
for f in glob.glob(D+'/eat_local_*.json'):
    d=json.load(open(f))
    b=d.get('avg_baseline'); c=d.get('avg_context')
    model=d.get('model','')
    rows.append({'model':model,'baseline':b,'context':c,'lift':round((c or 0)-(b or 0),1) if b is not None and c is not None else None})
rows=[r for r in rows if r['baseline'] is not None]
rows.sort(key=lambda r: -(r['context'] or -1))
body={
  'schema':'csoai.signed-eat-compliance-board/0.1',
  'ts':datetime.now(timezone.utc).isoformat(),
  'backend':'ollama-local (A100, OOWM fleet)',
  'n_measured':len(rows),
  'models':rows,
  'doctrine':'measurement, not certification — context-RAG lift is measured, not claimed; unmeasured models are UNMEASURABLE, never invented',
}
key=Path('/workspace/arena_engine/key').read_bytes()
sk=SigningKey(key); _c=cid(body)
body['signature']={'content_id':_c,'sig':sk.sign(_c.encode()).signature.hex(),'kid':'did:web:csoai.org#card-attestation-1'}
p=Path('/workspace/arena_engine/eat_compliance_board.json'); p.write_text(json.dumps(body,indent=2))
print('EAT compliance board written:', _c[:16], 'models:', len(rows))
