#!/usr/bin/env python3
"""Offline byte and state verification for a public-readback Venturi capsule."""
from __future__ import annotations
import argparse
import json
import sys
from pathlib import Path

from wrapper import canon, sha

def verify(path: Path, evidence_dir: Path|None=None)->dict:
    evidence_dir=evidence_dir or path.parent/'evidence'
    result=json.loads(path.read_text())
    capsule=result['capsule']; venturi=result['venturi']
    tmp=dict(capsule); tmp['capsule_id']=None
    if capsule['capsule_id']!=sha(canon(tmp)):
        raise ValueError('capsule ID mismatch')
    expected=sha(canon({'state':capsule['state'],'receipts':capsule['receipts'],
                       'missing_axes':venturi['missing_axes'],'failures':venturi['source_failures']}))
    if capsule['outputs_digest']!=expected:
        raise ValueError('output digest mismatch')
    if venturi['work_scope']!='PUBLIC_SOURCE_READBACK' or any(
        venturi[key]!='NOT_RUN' for key in
        ('subject_measurement_state','constitutional_decision','delivery_state','settlement_state')
    ) or capsule['side_effects'] or capsule['payment'] is not None:
        raise ValueError('unearned measurement, authority, effect, delivery or payment claim')
    files=venturi['evidence_files']
    by_digest={item['digest']:item for item in files}
    if len(by_digest)!=len(files): raise ValueError('duplicate evidence entry')
    receipts=capsule['receipts']
    if set(by_digest)!={receipt['digest'] for receipt in receipts}:
        raise ValueError('evidence files do not cover receipts')
    for digest,item in by_digest.items():
        name=Path(item['path']).name
        if name!=item['path'] or name!=digest.split(':',1)[1]+'.bin':
            raise ValueError('invalid evidence filename')
        p=evidence_dir/name
        if not p.is_file() or sha(p.read_bytes())!=digest:
            raise ValueError('evidence byte mismatch: '+digest)
    boards=[r for r in receipts if r['kind']=='gspc-board-readback']
    if len(boards)!=1: raise ValueError('expected one board receipt')
    board=json.loads((evidence_dir/by_digest[boards[0]['digest']]['path']).read_bytes())
    measured={x['axis'] for x in board['axes'] if x.get('status')=='MEASURED'}
    missing=sorted(set(venturi['required_axes'])-measured)
    if missing!=venturi['missing_axes']: raise ValueError('board profile status mismatch')
    if capsule['state']=='completed' and (missing or venturi['source_failures']):
        raise ValueError('completed readback with missing evidence')
    return {'capsule_id':capsule['capsule_id'],'readback_task_state':capsule['state'],
            'subject_measurement_state':venturi['subject_measurement_state'],
            'verified_files':len(files),'required_board_axes':len(venturi['required_axes'])}

def main()->int:
    parser=argparse.ArgumentParser(); parser.add_argument('result',type=Path); parser.add_argument('--evidence-dir',type=Path)
    try:
        args=parser.parse_args(); print(json.dumps(verify(args.result,args.evidence_dir),sort_keys=True)); return 0
    except Exception as exc: print(f'HOLD: {type(exc).__name__}: {exc}',file=sys.stderr); return 1

if __name__=='__main__': raise SystemExit(main())
