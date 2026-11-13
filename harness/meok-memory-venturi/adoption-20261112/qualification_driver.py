from pathlib import Path
from huggingface_hub import HfApi,snapshot_download
import json,sys,subprocess,hashlib,urllib.request,os,re,shutil,time
repo='Nicholastempleman/meok-hf-runtime';base='1887656611c1fb3a7010c77a2c6ca3599a5f9aed';source='bd3d6424e7591c63477049c09f5811fe10d70e27'
root=Path('/tmp/meok-invalidation-adoption');root.mkdir()
snapshot_download(repo,repo_type='space',revision=base,local_dir=root,max_workers=4)
os.chdir(root);sys.path.insert(0,str(root))
def execute(cmd,label,expected=None):
 begin=time.monotonic();r=subprocess.run(cmd,capture_output=True,text=True,timeout=150)
 print('LOG_'+label+'\n'+r.stdout+r.stderr,flush=True)
 if r.returncode:raise RuntimeError(label+' failed')
 m=re.search(r'Ran (\d+) tests',r.stderr);n=int(m.group(1)) if m else None
 if expected is not None:assert n==expected,(label,n,expected)
 return {'label':label,'returncode':r.returncode,'methods':n,'wall_seconds':time.monotonic()-begin,'output_sha256':hashlib.sha256((r.stdout+r.stderr).encode()).hexdigest()}
execute([sys.executable,'-m','pip','install','--quiet','--no-cache-dir','-r','requirements-ci.txt'],'CPU_UI_DEPENDENCIES')
execute([sys.executable,'-B','verify_source.py'],'BASE_SOURCE_INTEGRITY')
baseline=execute([sys.executable,'-B','-m','unittest','discover','-s','.','-p','test_*.py','-v'],'BASE_COMPOSED')
assert baseline['methods']>=309
changed=['memory_venturi.py','memory_ui_tools.py','test_targeted_invalidation.py','test_memory_adoption.py'];source_hashes={}
for name in changed:
 url='https://raw.githubusercontent.com/CSOAI-ORG/councilof-ai/'+source+'/harness/meok-memory-venturi/'+name
 with urllib.request.urlopen(url,timeout=20) as response:data=response.read(100001)
 assert len(data)<=100000;(root/name).write_bytes(data);source_hashes[name]=hashlib.sha256(data).hexdigest()
assert source_hashes['memory_venturi.py']=='fee33861233dec6b7e89dbbf91582c0016c9538dd257f796ab9cef493fe1bebc'
manifest=json.loads((root/'SOURCE_MANIFEST.json').read_text())
for name,sha in source_hashes.items():manifest['files_sha256'][name]=sha
(root/'SOURCE_MANIFEST.json').write_text(json.dumps(manifest,indent=2)+'\n')
execute([sys.executable,'-B','verify_source.py'],'CANDIDATE_SOURCE_INTEGRITY')
composed=execute([sys.executable,'-B','-m','unittest','discover','-s','.','-p','test_*.py','-v'],'CANDIDATE_COMPOSED',baseline['methods']+19)
join=execute([sys.executable,'-B','-m','unittest','discover','-s','join_assets/harness/component-join-review','-p','test_*.py','-v'],'PRESERVED_JOIN',87)
from memory_ui_tools import memory_rehearsal
from research_lab import components
payload=memory_rehearsal(17,80);event=payload.pop('evidence_event');builder=components()[1]
assert builder.validate(event)==[]
assert hashlib.sha256(builder.jcs(payload)).hexdigest()==event['observed']['output_sha256']
assert payload['targeted_invalidation']['state']=='DECLARED_CONTROLS_PASSED'
assert payload['targeted_invalidation']['cache_source_sha256']==source_hashes['memory_venturi.py']
assert payload['trained_process_replay']['actual_neural_evaluations']==8 and payload['trained_process_replay']['exact_cache_hits']==4
# Same preserved Gradio UI/API surface; all endpoints must still build.
import gradio as gr
from research_ui import mount_lab
with gr.Blocks() as view:mount_lab()
endpoints=view.get_api_info()['named_endpoints'];assert '/lab_memory_venturi' in endpoints and '/academy_attempt' in endpoints
report={'state':'HF_COMPOSED_ADOPTION_QUALIFIED','base_space_revision':base,'source_commit':source,'baseline':baseline,'composed':composed,'retained_join':join,'new_methods':19,'source_sha256':source_hashes,'original_api_name_retained':'/lab_memory_venturi','five_targeted_controls':payload['targeted_invalidation'],'original_predictor_evaluations':8,'original_reuse_hits':4,'event_schema_and_RFC8785_output_hash_verified':True,'event_signed':False,'GPU_or_large_model_calls':0,'new_training':False,'durable_memory_activated':False,'real_source_authorizer_qualified':False,'whole_job_speedup_claimed':False,'gradio':gr.__version__}
print('EAT_ADOPTION_QUALIFICATION_JSON='+json.dumps(report),flush=True)
