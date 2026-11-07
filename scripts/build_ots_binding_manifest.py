#!/usr/bin/env python3
"""Recover exact-byte OTS payload bindings without rewriting any proof or payload.
This establishes matching bytes, not historical author intent or Bitcoin finality.
"""
import argparse, hashlib, json
from pathlib import Path
from opentimestamps.core.serialize import StreamDeserializationContext
from opentimestamps.core.timestamp import DetachedTimestampFile

def build(public):
    public=public.resolve();proofs={};failures=[]
    for p in sorted(public.rglob('*.ots')):
        if p.is_symlink() or p.stat().st_size>1_000_000:continue
        try:
            with p.open('rb') as f:d=DetachedTimestampFile.deserialize(StreamDeserializationContext(f))
            proofs[p.relative_to(public).as_posix()]={'digest':bytes(d.timestamp.msg).hex(),'proof_sha256':hashlib.sha256(p.read_bytes()).hexdigest()}
        except Exception as e:failures.append({'proof':p.relative_to(public).as_posix(),'error':type(e).__name__})
    wanted={r['digest'] for r in proofs.values()};found={}
    for p in sorted(public.rglob('*')):
        if not p.is_file() or p.is_symlink() or p.suffix in ('.ots','.invalid') or p.stat().st_size>10_000_000:continue
        raw=p.read_bytes();h=hashlib.sha256(raw).hexdigest()
        if h in wanted:found.setdefault(h,[]).append(p.relative_to(public).as_posix())
    bindings={};unresolved=[]
    for proof,row in proofs.items():
        candidates=found.get(row['digest'],[])
        if not candidates:unresolved.append(proof);continue
        direct=proof[:-4]
        target=direct if direct in candidates else sorted(candidates,key=lambda x:(len(x),x))[0]
        bindings[proof]={**row,'target':target,'byte_identical_candidates':len(candidates),'basis':'EXACT_SHA256_OF_RETAINED_BYTES','historical_intent':'NOT_ESTABLISHED'}
    return {'schema':'csoai.ots-exact-byte-bindings/0.1','signed':False,'method':'SHA-256 of actual retained target bytes equals the detached proof message; no proof or target altered. No Bitcoin-finality claim.','bindings':bindings,'unresolved':unresolved,'invalid_proofs':failures,'counts':{'proofs':len(proofs),'bound':len(bindings),'unresolved':len(unresolved),'invalid':len(failures)}}

if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--public',type=Path,default=Path('public'));p.add_argument('--out',type=Path,required=True);a=p.parse_args();d=build(a.public);a.out.parent.mkdir(parents=True,exist_ok=True)
    with a.out.open('x') as f:json.dump(d,f,indent=2)
    print(json.dumps(d['counts']))
