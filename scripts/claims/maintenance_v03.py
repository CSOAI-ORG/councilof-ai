#!/usr/bin/env python3
"""Bounded maintenance for csoai.claim-registry/0.3 heads.

The watch receipt selects affected registries. For each affected registry, every declared
measurement in that registry is re-run (the builder requires a complete measurement set), every
claim source is freshly captured by the reference builder, prior bytes are superseded by digest,
and the candidate is signed and timestamp-submitted before it is staged for publication.
"""
from __future__ import annotations
import argparse, datetime as dt, hashlib, json, os, shutil, subprocess, sys
from pathlib import Path

NON_TRIGGER={"source_not_reachable_this_run"}
CONFIG={
  "claimreg-ai-assurance-and-settlement": {"subjects":"scripts/claims/subjects-2026-09-23.json","harness":"scripts/claims/measure_growth.py"},
  "claimreg-hiring-platforms": {"subjects":"scripts/claims/subjects-hiring-platforms-2026-09-24.json","harness":"scripts/claims/measure_hiring.py"},
}

def load(p:Path): return json.loads(p.read_text(encoding='utf-8'))
def sha(p:Path): return hashlib.sha256(p.read_bytes()).hexdigest()
def run(cmd,cwd): return subprocess.run(cmd,cwd=cwd,text=True,capture_output=True)

def live_heads(repo:Path):
    files=[p for p in sorted((repo/'public/claims').glob('claimreg-*.json')) if not p.name.endswith('.signed.json')]
    parsed={}; superseded=set()
    for p in files:
        try: j=load(p)
        except Exception: continue
        parsed[p]=j
        s=j.get('supersedes') or {}
        if isinstance(s,dict) and s.get('file'): superseded.add(str(s['file']).split('/')[-1])
    return [(p,j) for p,j in parsed.items() if p.name not in superseded and j.get('schema')=='csoai.claim-registry/0.3']

def claim_ids(doc): return {c.get('claim_id') for c in doc.get('claims') or [] if c.get('claim_id')}
def cfg_for(registry_id):
    for prefix,cfg in CONFIG.items():
        if str(registry_id).startswith(prefix): return cfg
    return None

def measurement_ids(subjects_path:Path):
    d=load(subjects_path); return sorted({c['measurement'] for s in d.get('subjects',[]) for c in s.get('claims',[]) if c.get('measurement')})

def plan(repo:Path, receipt:dict):
    heads=live_heads(repo); groups=[]; assigned=set()
    for p,j in heads:
        ids=claim_ids(j); changes=[]
        for ch in receipt.get('observed_changes_requiring_review') or []:
            if ch.get('kind') in NON_TRIGGER: continue
            if ch.get('claim') in ids:
                changes.append(ch); assigned.add(ch.get('claim'))
        if changes:
            cfg=cfg_for(j.get('registry_id'))
            groups.append({'registry':p.name,'registry_id':j.get('registry_id'),'claims':sorted({x.get('claim') for x in changes}),
                           'changes':changes,'config':cfg})
    return groups

def main():
    ap=argparse.ArgumentParser(); ap.add_argument('--repo',type=Path,default=Path(__file__).resolve().parents[2]); ap.add_argument('--watch-receipt',type=Path,required=True)
    ap.add_argument('--out',type=Path,required=True); ap.add_argument('--execute',action='store_true'); ap.add_argument('--require-signature',action='store_true')
    ap.add_argument('--token-file',type=Path,default=Path('~/.secrets/board-sign-pod-token')); ap.add_argument('--stamp',action='store_true'); ap.add_argument('--stage-public',action='store_true')
    a=ap.parse_args(); repo=a.repo.resolve(); receipt=load(a.watch_receipt); groups=plan(repo,receipt)
    rid=receipt.get('run_id') or dt.datetime.now(dt.timezone.utc).strftime('%Y%m%dT%H%M%SZ'); work=a.out/f'run-{rid}'; work.mkdir(parents=True,exist_ok=True)
    result={'schema':'csoai.claim-maintenance-v03-receipt/0.1','created_utc':dt.datetime.now(dt.timezone.utc).isoformat().replace('+00:00','Z'),'watch_run_id':rid,
            'source_watch_receipt_sha256':sha(a.watch_receipt),'groups':groups,'runs':[],'state':'PLANNED'}
    if not a.execute:
        (work/'receipt.json').write_text(json.dumps(result,indent=2)+'\n'); print(json.dumps(result,indent=2)); return 0
    if not groups:
        result['state']='NO_ACTION_REQUIRED'; (work/'receipt.json').write_text(json.dumps(result,indent=2)+'\n'); return 0
    series=work/'series'; shutil.copytree(repo/'public/claims/series',series,dirs_exist_ok=True)
    for g in groups:
        if not g['config']:
            result['runs'].append({'registry':g['registry'],'state':'BLOCKED_NO_CONFIG'}); result['state']='BLOCKED'; continue
        prior=repo/'public/claims'/g['registry']; cfg=g['config']; sub=repo/cfg['subjects']; mids=measurement_ids(sub); mdir=work/(g['registry_id']+'-measurements'); mdir.mkdir(parents=True,exist_ok=True)
        cp=run([sys.executable,str(repo/cfg['harness']),str(mdir),*mids],repo)
        row={'prior':g['registry'],'impacted_claims':g['claims'],'measurement_ids':mids,'measurement_returncode':cp.returncode,'measurement_stdout_tail':cp.stdout[-3000:],'measurement_stderr_tail':cp.stderr[-3000:]}
        if cp.returncode: row['state']='MEASUREMENT_FAILED'; result['runs'].append(row); result['state']='FAILED'; continue
        stamp=dt.datetime.now(dt.timezone.utc).strftime('%Y%m%dT%H%M%SZ'); prefix=next(k for k,v in CONFIG.items() if v==cfg); new_id=f'{prefix}-maintenance-{stamp}'
        cand=work/(new_id+'.json')
        cp=run(['node',str(repo/'scripts/claims/capture-growth.mjs'),'--subjects',str(sub),'--measurements',str(mdir),'--series',str(series),'--out',str(cand),'--registry-id',new_id],repo)
        row['capture_returncode']=cp.returncode; row['capture_stdout_tail']=cp.stdout[-3000:]; row['capture_stderr_tail']=cp.stderr[-3000:]
        if cp.returncode or not cand.is_file(): row['state']='CAPTURE_FAILED'; result['runs'].append(row); result['state']='FAILED'; continue
        reason=f"watch run {rid} observed {len(g['changes'])} maintenance event(s) affecting {', '.join(g['claims'])}"
        cp=run(['node',str(repo/'scripts/claims/supersede-registry.mjs'),'--prior',str(prior),'--candidate',str(cand),'--reason',reason],repo)
        row['supersede_returncode']=cp.returncode
        if cp.returncode: row['state']='SUPERSESSION_FAILED'; row['supersede_stderr_tail']=cp.stderr[-2000:]; result['runs'].append(row); result['state']='FAILED'; continue
        doc=load(cand)
        if str(doc.get('signature_state','')).startswith('UNSIGNED'):
            cp=run(['node',str(repo/'scripts/claims/rebaseline-extractor.mjs'),'--restate-signed',str(cand)],repo)
            if cp.returncode: row['state']='RESTATE_FAILED'; row['restate_stderr_tail']=cp.stderr[-2000:]; result['runs'].append(row); result['state']='FAILED'; continue
        tok=os.environ.get('BOARD_SIGN_POD_TOKEN','').strip(); tf=a.token_file.expanduser(); side=cand.with_suffix('.signed.json')
        if tok or tf.is_file():
            cmd=[sys.executable,str(repo/'scripts/claims/sign_registry.py'),str(cand)];
            if not tok: cmd += ['--token-file',str(tf)]
            cp=run(cmd,repo); row['signature_returncode']=cp.returncode; row['signature_stdout_tail']=cp.stdout[-2200:]
            if cp.returncode or not side.is_file(): row['state']='SIGNATURE_FAILED'; row['signature_stderr_tail']=cp.stderr[-1800:]; result['runs'].append(row); result['state']='FAILED'; continue
        elif a.require_signature:
            row['state']='SIGNATURE_BLOCKED'; result['runs'].append(row); result['state']='FAILED'; continue
        if a.stamp:
            cp=run([sys.executable,str(repo/'scripts/ots_stamp_new.py'),str(cand),str(side),'--out-dir',str(work)],repo); row['timestamp_returncode']=cp.returncode; row['timestamp_stdout_tail']=cp.stdout[-2200:]
            if cp.returncode: row['state']='TIMESTAMP_FAILED'; result['runs'].append(row); result['state']='FAILED'; continue
        staged=[]
        if a.stage_public:
            for src in (cand,side,Path(str(cand)+'.ots'),Path(str(side)+'.ots')):
                if src.is_file(): dst=repo/'public/claims'/src.name; shutil.copy2(src,dst); staged.append('/claims/'+src.name)
        row.update({'state':'READY_TO_PUBLISH','candidate':cand.name,'candidate_sha256':sha(cand),'signed_sha256':sha(side) if side.is_file() else None,'staged_public_paths':staged})
        result['runs'].append(row)
    if result['state'] not in ('FAILED','BLOCKED'):
        result['state']='READY_TO_PUBLISH' if all(r.get('state')=='READY_TO_PUBLISH' for r in result['runs']) else 'PARTIAL'
    if a.stage_public and result['state']=='READY_TO_PUBLISH':
        shutil.copytree(series,repo/'public/claims/series',dirs_exist_ok=True)
        mdir=repo/'public/claims/maintenance'; (mdir/'v03').mkdir(parents=True,exist_ok=True)
        result['publication_state']='STAGED_IN_REPO_NOT_YET_PUBLIC'; outrec=mdir/'v03'/f'{rid}.json'; outrec.write_text(json.dumps(result,indent=2)+'\n'); shutil.copy2(outrec,mdir/'v03-latest.json')
    (work/'receipt.json').write_text(json.dumps(result,indent=2)+'\n'); print(json.dumps({'state':result['state'],'runs':[(x.get('registry'),x.get('state')) for x in result['runs']]},sort_keys=True)); return 0 if result['state']=='READY_TO_PUBLISH' else 1
if __name__=='__main__': raise SystemExit(main())
