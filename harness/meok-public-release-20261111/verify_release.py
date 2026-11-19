"""Anonymous public-artifact qualification, source inspection and existing test replay."""
from pathlib import Path
import hashlib,json,urllib.request,subprocess,shutil,tempfile,re
from datetime import datetime,timezone
from html.parser import HTMLParser
R=Path(__file__).parent;P=R/'public';BASE='d4994f5d3ce159dc8ab752b6a6875b5cb4b3ec50'
results=[]
def run(label,cmd,cwd):
 p=subprocess.run(cmd,cwd=cwd,capture_output=True,text=True,timeout=90)
 (R/(label+'.log')).write_text(p.stdout+p.stderr)
 results.append({'suite':label,'exit_code':p.returncode,'stdout_sha256':hashlib.sha256((p.stdout+p.stderr).encode()).hexdigest(),'tail':(p.stdout+p.stderr)[-1200:]})
 return p
assert run('root-replay',['node','test.mjs'],P).returncode==0
assert run('research-replay',['node','test.mjs'],P/'research-v03').returncode==0
assert run('ui-contract',['node','test-ui-contract.mjs'],P).returncode==0
assert run('specialist-presentation',['python3','-B','reproduce_public.py'],P/'integration-specialist-review/presentation-v1').returncode==0
assert run('specialist-join',['python3','-B','-m','unittest','discover','-s','join_assets/harness/component-join-review','-p','test*.py'],P/'integration-specialist-review').returncode==0
# Demonstrate that the new check actually detects the old presentation defect.
with tempfile.TemporaryDirectory(dir=R,prefix='prior-ui-control-') as temp:
 t=Path(temp)
 for name in ['core.mjs','test-ui-contract.mjs','model/weights.json','data/test.jsonl']:
  q=t/name;q.parent.mkdir(parents=True,exist_ok=True);shutil.copyfile(P/name,q)
 u=f'https://huggingface.co/spaces/csoai/meok-oowm-hybrid-lab/resolve/{BASE}/ui.mjs'
 with urllib.request.urlopen(u,timeout=20) as resp:raw=resp.read(30000)
 assert hashlib.sha256(raw).hexdigest()=='1be5d2c83eac25b3aa2bee14ed9b2affd1a1d324ca471227d42361a385bf5ecc'
 (t/'ui.mjs').write_bytes(raw)
 neg=run('prior-ui-negative-control',['node','test-ui-contract.mjs'],t)
 assert neg.returncode!=0 and 'edit clears successful result and export' in neg.stderr
# Verify the separately published research manifest without rewriting historic results.
a=json.loads((P/'research-v03/ARTIFACTS.json').read_text());bad=[n for n,h in a['files'].items() if hashlib.sha256((P/'research-v03'/n).read_bytes()).hexdigest()!=h]
assert not bad,bad
report={'state':'PUBLIC_CANDIDATE_QUALIFIED','at':datetime.now(timezone.utc).isoformat(),'base_space_revision':BASE,'suites':results,'existing_numeric_checks':{'root':37,'research':38,'research_inference_evaluations':7200},'new_ui_contract_checks':18,'retained_specialist_presentation_checks':18,'retained_join_checks':87,'negative_control':'Prior exact public UI fails the new stale-result clearing assertion; patched UI passes.','research_manifest_entries_verified':len(a['files']),'weights_changed':False,'new_training':False,'paid_compute':False,'gspc_admitted':False,'source_scope':'Existing public files and original synthetic fixtures only. Tests are not independent expert review or universal correctness.'}
(R/'qualification.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps({k:v for k,v in report.items() if k!='suites'}),flush=True)
