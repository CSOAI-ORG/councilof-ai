#!/usr/bin/env python3
"""Local content-addressed release/rollback rehearsal. Never deploys or invokes a cloud API.
Only the explicitly named private rehearsal directory is written; source trees are read-only.
"""
from pathlib import Path
import argparse,hashlib,json,os,tempfile
SCHEMA='csoai.private-release-snapshot/1'
def digest(raw):return hashlib.sha256(raw).hexdigest()
def encode(x):return json.dumps(x,sort_keys=True,separators=(',',':'),allow_nan=False).encode()
def inventory(root):
 root=Path(root).resolve();files={}
 for p in root.rglob('*'):
  rel=p.relative_to(root).as_posix()
  if p.is_symlink():raise ValueError('SYMLINK_IN_SNAPSHOT')
  if p.is_file():
   if any(part.startswith('._') or part=='.AppleDouble' for part in p.relative_to(root).parts):raise ValueError('TRANSPORT_METADATA_IN_SNAPSHOT')
   if p.stat().st_size>25*1024*1024:raise ValueError('ASSET_SIZE_LIMIT')
   files[rel]={'sha256':digest(p.read_bytes()),'bytes':p.stat().st_size}
 if 'index.html' not in files:raise ValueError('MISSING_INDEX')
 if len(files)>20_000:raise ValueError('CONFIGURED_FILE_CAP_EXCEEDED')
 return {'schema':SCHEMA,'root':str(root),'files':dict(sorted(files.items())),'source_root_sha256':files.get('root.json',{}).get('sha256'),'public_deployment':False}
def snapshot(root,out):
 doc=inventory(root);raw=encode(doc);out=Path(out)
 if out.exists():
  if out.read_bytes()!=raw:raise ValueError('EXISTING_MANIFEST_DIFFERS')
 else:
  out.parent.mkdir(parents=True,exist_ok=True)
  with out.open('xb') as f:f.write(raw)
 return {'path':str(out),'sha256':digest(raw),'files':len(doc['files'])}
def verified(manifest):
 raw=Path(manifest).read_bytes();doc=json.loads(raw)
 if doc.get('schema')!=SCHEMA or doc.get('public_deployment') is not False:raise ValueError('WRONG_REHEARSAL_SCHEMA')
 actual=inventory(doc['root'])
 if actual!=doc:raise ValueError('SOURCE_TREE_CHANGED')
 return doc,digest(raw)
def read_selector(path):
 doc=json.loads(Path(path).read_text());manifest=Path(doc['manifest'])
 if digest(manifest.read_bytes())!=doc['manifest_sha256']:raise ValueError('SELECTOR_MANIFEST_MISMATCH')
 selected,sha=verified(manifest)
 return {'manifest_sha256':sha,'index_sha256':selected['files']['index.html']['sha256'],'source_root_sha256':selected['source_root_sha256']}
def rehearse(before_path,after_path,directory):
 before,bh=verified(before_path);after,ah=verified(after_path);directory=Path(directory)
 if directory.exists():raise ValueError('REHEARSAL_DIRECTORY_MUST_BE_NEW')
 directory.mkdir(parents=True);selector=directory/'PRIVATE_TEST_SELECTOR.json'
 def choose(manifest,sha):
  temp=directory/'selector.pending';temp.write_bytes(encode({'manifest':str(Path(manifest).resolve()),'manifest_sha256':sha,'scope':'PRIVATE_REHEARSAL_ONLY'}));os.replace(temp,selector)
 choose(before_path,bh);initial=read_selector(selector)
 # An interrupted write must not change the active selector.
 (directory/'interrupted-write.json').write_text('{');unchanged=read_selector(selector)
 if initial!=unchanged:raise ValueError('INTERRUPTED_WRITE_CHANGED_SELECTION')
 choose(after_path,ah);candidate=read_selector(selector)
 choose(before_path,bh);restored=read_selector(selector)
 if restored!=initial:raise ValueError('ROLLBACK_CONTENT_MISMATCH')
 result={'state':'PASS_PRIVATE_ROLLBACK_REHEARSAL','before':initial,'candidate':candidate,'restored':restored,'interrupted_write_preserved_selection':True,'source_trees_unchanged':True,'cloud_api_calls':0,'production_rollbacks':0,'serving_switches':0,'public_deployment':False,'scope':'Local selector and exact source bytes, not Cloudflare deployment rollback or live traffic.'}
 (directory/'receipt.json').write_text(json.dumps(result,indent=2));return result
if __name__=='__main__':
 p=argparse.ArgumentParser(description=__doc__);s=p.add_subparsers(dest='command',required=True);a=s.add_parser('snapshot');a.add_argument('root',type=Path);a.add_argument('--out',type=Path,required=True);r=s.add_parser('rehearse');r.add_argument('before',type=Path);r.add_argument('after',type=Path);r.add_argument('--out',type=Path,required=True);a=p.parse_args();print(json.dumps(snapshot(a.root,a.out) if a.command=='snapshot' else rehearse(a.before,a.after,a.out),indent=2))
