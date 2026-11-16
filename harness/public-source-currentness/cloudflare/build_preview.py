"""Build a preview from reviewed bytes. No deploy or account operation."""
from pathlib import Path
import hashlib,json,shutil,sys,re
ROOT=Path(__file__).resolve().parents[1]
if len(sys.argv)!=2 or not re.fullmatch('[0-9a-f]{40}',sys.argv[1]):raise ValueError('EXACT_SOURCE_REVISION_REQUIRED')
REV=sys.argv[1]
OUT=ROOT/'cloudflare-dist';OUT.mkdir(exist_ok=True)
guard=(ROOT/'src/source_guard.mjs').read_text();worker=(ROOT/'cloudflare/worker.mjs').read_text();lock=json.loads((ROOT/'cloudflare/lock.json').read_text())
prefix="import {assess,validateLock} from '../src/source_guard.mjs';\nimport lock from './lock.json' with {type:'json'};\n"
if not worker.startswith(prefix):raise ValueError('PACKAGING_PREIMAGE_CHANGED')
combined=guard+'\nconst lock='+json.dumps(lock,separators=(',',':'))+';\n'+worker[len(prefix):]
(OUT/'_worker.js').write_text(combined)
(OUT/'_routes.json').write_text(json.dumps({'version':1,'include':['/api/*'],'exclude':[]})+'\n')
(OUT/'robots.txt').write_text('User-agent: *\nDisallow: /\n')
(OUT/'_headers').write_text('/*\n  X-Robots-Tag: noindex, nofollow\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: no-referrer\n  Content-Security-Policy: default-src \'self\'; script-src \'self\' \'unsafe-inline\'; style-src \'self\' \'unsafe-inline\'; connect-src \'self\'; frame-ancestors \'none\'\n')
shutil.copyfile(ROOT/'cloudflare/index.html',OUT/'index.html')
(OUT/'results').mkdir(exist_ok=True)
for name in ['kaggle-qualification.json','hf-qualification.json','worker-tests.json']:
 p=ROOT/'results'/name
 if not p.is_file() or p.is_symlink() or p.stat().st_size>65536:raise ValueError('RESULT_BOUND '+name)
 shutil.copyfile(p,OUT/'results'/name)
pins={str(p.relative_to(ROOT)):hashlib.sha256(p.read_bytes()).hexdigest() for p in [ROOT/'src/source_guard.mjs',ROOT/'cloudflare/worker.mjs',ROOT/'cloudflare/lock.json',ROOT/'cloudflare/index.html',Path(__file__)]}
manifest={'source_revision':REV,'source_paths_sha256':pins,'transform':'Concatenate identical guard source, fixed registry JSON and Worker body after removing its two import lines. No runtime logic alteration.','preview_only':True,'fixed_target':lock,'source_tests_are_not_a_live_result':True,'deployment_status':'SOURCE_BUILD_ONLY','files_sha256':{str(p.relative_to(OUT)):hashlib.sha256(p.read_bytes()).hexdigest() for p in OUT.rglob('*') if p.is_file() and p.name!='BUILD.json'}}
(OUT/'BUILD.json').write_text(json.dumps(manifest,indent=2)+'\n');print(json.dumps({'files':len(manifest['files_sha256'])+1,'bytes':sum(p.stat().st_size for p in OUT.rglob('*') if p.is_file()),'worker_sha256':hashlib.sha256((OUT/'_worker.js').read_bytes()).hexdigest(),'deployed':False}))
