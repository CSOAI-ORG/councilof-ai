from pathlib import Path
from huggingface_hub import HfApi,hf_hub_url
from huggingface_hub.utils import build_hf_headers
import urllib.request,hashlib,json,subprocess,sys,os,re
repo='Nicholastempleman/meok-hf-runtime';base='a8734612fc5b3d10f295ee45cd99e4ccf2b9b11f';source='7d9fd8052684f2d9d8826a4589ddb6ae3b37cf90';authority_pin='ca5ff304cf1766ee73d84c49fc684631deaae113'
a=HfApi()  # Qualify immutable snapshot; deployment separately checks the current parent.
root=Path('/tmp/meok-gates');root.mkdir();os.chdir(root);sys.path.insert(0,str(root))
def put(name,url,private=False):
 req=urllib.request.Request(url,headers=build_hf_headers(token=True) if private else {})
 with urllib.request.urlopen(req,timeout=25) as r:b=r.read(2000001)
 assert len(b)<=2000000;p=root/name;p.parent.mkdir(parents=True,exist_ok=True);p.write_bytes(b)
 return hashlib.sha256(b).hexdigest()
for name in a.list_repo_files(repo,repo_type='space',revision=base):
 if name.startswith('vendor/'):continue
 if name.endswith(('.py','.json','.md','.txt')) or name.startswith(('lab_assets/','join_assets/')):
  put(name,hf_hub_url(repo,name,repo_type='space',revision=base),True)
original=['test_memory_venturi','test_memory_ui','test_research_lab','test_core','test_app','test_conversation','test_conversation_ui','test_learning_bridge','test_learning_tools','test_specialist_review']
def suite(names):
 result=subprocess.run([sys.executable,'-B','-m','unittest','-v',*names],capture_output=True,text=True,timeout=150)
 print(result.stdout+result.stderr,flush=True);assert result.returncode==0
 match=re.search(r'Ran (\d+) tests',result.stderr);assert match;return int(match.group(1))
baseline_tests=suite(original)
files=['learning_bridge.py','learning_tools.py','learning_ui.py','test_learning_bridge.py','test_learning_tools.py','test_scoped_learning.py','correction_matrix.py','learning_assets/cases.json','learning_assets/manifest.json']
hashes={n:put(n,'https://raw.githubusercontent.com/CSOAI-ORG/councilof-ai/'+source+'/harness/meok-learning-bridge/'+n) for n in files}
composed_tests=suite(original+['test_scoped_learning'])
join_run=subprocess.run([sys.executable,'-B','-m','unittest','discover','-s','join_assets/harness/component-join-review','-p','test*.py','-v'],capture_output=True,text=True,timeout=90)
print('RETAINED_JOIN_TESTS\n'+join_run.stdout+join_run.stderr,flush=True);assert join_run.returncode==0
join_count=int(re.search(r'Ran (\d+) tests',join_run.stderr).group(1))
result=subprocess.run([sys.executable,'-B','correction_matrix.py'],capture_output=True,text=True,timeout=45);print(result.stdout+result.stderr,flush=True);assert result.returncode==0
matrix=json.loads(Path('correction-matrix.json').read_text())
auth_names=['test_hitl_authority_effect_v0_2.py','hitl-authority-effect-v0.2.schema.json','hitl-authority-effect-v0.2.example.json','hitl-authority-effect-v0.1.schema.json','hitl-authority-effect.example.json','HITL-AUTHORITY-EFFECT-PROFILE.md']
auth_hashes={n:put('authority/'+n,'https://raw.githubusercontent.com/CSOAI-ORG/councilof-ai/'+authority_pin+'/docs/standards/osaia-safe-reverification/'+n) for n in auth_names}
auth=subprocess.run([sys.executable,'-B','authority/test_hitl_authority_effect_v0_2.py'],capture_output=True,text=True,timeout=45);print('AUTHORITY_REPLAY\n'+auth.stdout+auth.stderr,flush=True);assert auth.returncode==0
assert '47 total' in auth.stdout
import gradio as gr
from research_ui import mount_lab
from learning_tools import academy_lesson,academy_attempt,academy_catalogue,question_view
from research_lab import components
with gr.Blocks() as v:mount_lab()
endpoints=v.get_api_info()['named_endpoints'];assert '/academy_attempt' in endpoints and '/lab_memory_venturi' in endpoints
cat=academy_catalogue();packet=academy_lesson();text,token,_=question_view('claim-maintenance','ai-software','xp-not-authority');assert token.startswith('lesson-v1:')
out=academy_attempt(answer='D',registry_revision=token);assert out['educational_xp']==10 and out['binding_kind']=='SCOPED_LESSON'
event=out.pop('evidence_event');assert components()[1].validate(event)==[];assert hashlib.sha256(components()[1].jcs(out)).hexdigest()==event['observed']['output_sha256']
report={'state':'QUALIFIED_COMPOSED_GATES','base_space':base,'source_commit':source,'baseline_methods':baseline_tests,'composed_methods':composed_tests,'new_methods':composed_tests-baseline_tests,'updated_compatibility_expectations':2,'correction_decisions':matrix['checks'],'correction_summary':matrix['summary'],'safe_layers_in_draft_cases':cat['safe_practice_coverage'],'practice_cases':len(cat['practice_case_ids']),'axis_count':cat['canonical_axis_count'],'authority_profile':'csoai.hitl-authority-effect/0.2','authority_pin':authority_pin,'authority_checks':47,'retained_join_component_methods':join_count,'authority_live_enforcement_demonstrated':False,'authority_source_hashes':auth_hashes,'new_source_hashes':hashes,'legacy_current_revision_supported':True,'scoped_answer_event_verified':True,'private_data_used':False,'real_learner_count':0,'reviewers_appointed':0,'model_inference_calls':0,'training_performed':False,'gradio':gr.__version__}
print('GATES_QUALIFICATION_JSON='+json.dumps(report),flush=True)
