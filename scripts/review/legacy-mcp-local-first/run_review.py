#!/usr/bin/env python3
"""Reproduce the two pinned legacy-package corrections in a NEW private directory.

No network fetching, Git write, credential lookup, installation, or package publication.
Inputs are immutable source-file snapshots verified against the bundled manifest.
Existing worktrees are never changed. Run only a trusted copy of this review kit.
"""
from __future__ import annotations
import argparse,hashlib,json,os,stat,subprocess,sys
from pathlib import Path
KIT=Path(__file__).resolve().parent
LIMIT=200000

def read_regular(path:Path)->bytes:
    flags=os.O_RDONLY|getattr(os,'O_NOFOLLOW',0)
    fd=os.open(path,flags)
    try:
        info=os.fstat(fd)
        if not stat.S_ISREG(info.st_mode) or info.st_size>LIMIT:raise ValueError('Not a bounded regular file: '+path.name)
        with os.fdopen(fd,'rb',closefd=False) as stream:data=stream.read(LIMIT+1)
        if len(data)>LIMIT:raise ValueError('Read limit exceeded: '+path.name)
        return data
    finally:os.close(fd)

def stage(source_roots:dict[str,Path], output:Path)->Path:
    manifest=json.loads(read_regular(KIT/'source-manifest.json'))
    captured={}
    for name,row in manifest['repositories'].items():
        root=source_roots[name]
        if root.is_symlink() or not root.is_dir():raise ValueError('Source must be a real directory: '+name)
        files={}
        for filename,digest in row['files'].items():
            if Path(filename).name!=filename:raise ValueError('Unexpected manifest path')
            data=read_regular(root/filename)
            if hashlib.sha256(data).hexdigest()!=digest:raise ValueError('Source mismatch: '+name+'/'+filename)
            files[filename]=data
        captured[name]=(row['commit'],files)
    # Validate kit bytes too, before any directory creation or executable import.
    kit_files={}
    for filename,digest in manifest['kit_files'].items():
        if Path(filename).name!=filename:raise ValueError('Unexpected kit path')
        data=read_regular(KIT/filename)
        if hashlib.sha256(data).hexdigest()!=digest:raise ValueError('Kit mismatch: '+filename)
        kit_files[filename]=data
    output.mkdir(mode=0o700,parents=False,exist_ok=False)
    for name,(commit,files) in captured.items():
        root=output/name/commit;root.mkdir(parents=True,exist_ok=False)
        for filename,data in files.items():(root/filename).write_bytes(data)
    for filename,data in kit_files.items():(output/filename).write_bytes(data)
    (output/'source-manifest.json').write_bytes(read_regular(KIT/'source-manifest.json'))
    return output

def main()->int:
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--sql-source',type=Path,required=True)
    parser.add_argument('--music-source',type=Path,required=True)
    parser.add_argument('--output',type=Path,required=True)
    args=parser.parse_args()
    try:out=stage({'sql-builder-ai-mcp':args.sql_source,'music-production-ai-mcp':args.music_source},args.output)
    except (OSError,ValueError,KeyError) as exc:
        print(json.dumps({'state':'REFUSED','reason':str(exc)}));return 2
    env={k:os.environ[k] for k in ['PATH','LANG','LC_ALL'] if k in os.environ}
    env['HOME']=str(out);env['PYTHONDONTWRITEBYTECODE']='1'
    try:
        result=subprocess.run([sys.executable,'-I','-B',str(out/'build_candidates.py')],cwd=out,env=env,timeout=60)
        if result.returncode:return result.returncode
        rows=json.loads((out/'candidate-results.json').read_text())
        expected=json.loads((KIT/'source-manifest.json').read_text())
        if len(rows)!=2:raise ValueError('Incomplete result set')
        for row in rows:
            if row['candidate_exit']!=0 or row['baseline_exit']==0 or row['changes']!=expected['repositories'][row['repo']]['postimages']:
                raise ValueError('Unexpected test outcome or candidate bytes: '+row['repo'])
        print(json.dumps({'state':'PINNED_CANDIDATES_REPRODUCED','output':str(out),'repositories':[r['repo'] for r in rows],'source_modified':False,'published':False}));return 0
    except (OSError,ValueError,KeyError,subprocess.TimeoutExpired) as exc:
        print(json.dumps({'state':'REVIEW_FAILED','reason':str(exc),'output_preserved':str(out)}));return 1
if __name__=='__main__':raise SystemExit(main())
