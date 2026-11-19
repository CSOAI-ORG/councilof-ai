from pathlib import Path
from huggingface_hub import HfApi,hf_hub_url
from huggingface_hub.utils import build_hf_headers
import urllib.request,json,hashlib,subprocess,sys,os,unittest,io
repo='Nicholastempleman/meok-hf-runtime';base='9d6ea388ceb1793dae9426495a95c795d3c91cfb';source='17da8f7c8e5fb5b16ddba58f49da7ceca650d3bc'
api=HfApi();assert api.space_info(repo).sha==base
root=Path('/tmp/meok-learning-qualification');root.mkdir();os.chdir(root)
files=api.list_repo_files(repo,repo_type='space',revision=base)
for name in files:
 if name.startswith('vendor/'):continue
 if not(name.endswith(('.py','.json','.md','.txt')) or name.startswith('lab_assets/')):continue
 url=hf_hub_url(repo,name,repo_type='space',revision=base)
 with urllib.request.urlopen(urllib.request.Request(url,headers=build_hf_headers(token=True)),timeout=25) as r:b=r.read(2000001)
 assert len(b)<=2000000
 p=root/name;p.parent.mkdir(parents=True,exist_ok=True);p.write_bytes(b)
source_files=['learning_bridge.py','learning_tools.py','learning_ui.py','test_learning_bridge.py','test_learning_tools.py','learning_assets/manifest.json','learning_assets/registry.json','learning_assets/cases.json','learning_assets/source-paths.json','learning_assets/source-reading-checks.json','learning_assets/source-builder-proof.json']
for name in source_files:
 url='https://raw.githubusercontent.com/CSOAI-ORG/councilof-ai/'+source+'/harness/meok-learning-bridge/'+name
 with urllib.request.urlopen(url,timeout=25) as r:b=r.read(1000001)
 assert len(b)<=1000000;p=root/name;p.parent.mkdir(parents=True,exist_ok=True);p.write_bytes(b)
p=root/'research_ui.py';ui=p.read_text();needle="            with gr.Tab('Runtime evidence'):";assert ui.count(needle)==1
addition="            from learning_ui import mount_learning_tab\n            mount_learning_tab(json_tool)\n"
assert ui.count(addition)==1,'Existing Academy mount changed'
# No new write: qualify the exact combined serving source.
sys.path.insert(0,str(root))
names=['test_memory_venturi','test_memory_ui','test_research_lab','test_core','test_app','test_conversation','test_conversation_ui','test_learning_bridge','test_learning_tools']
suite=unittest.TestLoader().loadTestsFromNames(names);stream=io.StringIO();result=unittest.TextTestRunner(stream=stream,verbosity=2).run(suite)
print('UNIT_TEST_LOG\n'+stream.getvalue(),flush=True)
assert result.wasSuccessful(),'Scoped suite failed'
import gradio as gr
from research_ui import mount_lab
from learning_tools import academy_catalogue,academy_attempt
with gr.Blocks() as view:mount_lab()
info=view.get_api_info();expected=['/academy_catalogue','/academy_lesson','/academy_reading','/academy_attempt','/academy_correction']
assert all(k in info['named_endpoints'] for k in expected)
assert '/lab_memory_venturi' in info['named_endpoints']
cat=academy_catalogue();rev=cat['registry_revision'];answer=academy_attempt(answer='D',registry_revision=rev)
assert answer['educational_xp']==10 and not any(answer['boundaries'].values())
print('LEARNING_QUALIFICATION_JSON='+json.dumps({'state':'QUALIFIED_SOURCE_AND_GRADIO_SCHEMA','base_space_revision':base,'source_commit':source,'unit_test_methods':result.testsRun,'failures':len(result.failures),'errors':len(result.errors),'new_learning_test_methods':38,'retained_test_methods':result.testsRun-38,'axis_count':cat['canonical_axis_count'],'source_stages':cat['source_stage_count'],'industry_contexts':len(cat['industry_profiles']),'kind_counts':cat['kind_counts'],'registry_revision':rev,'new_api_names':expected,'gradio':gr.__version__,'research_ui_sha256':hashlib.sha256(p.read_bytes()).hexdigest(),'model_inference_calls':0,'public_hitl_posts':0,'model_training_performed':False,'source_files_sha256':{n:hashlib.sha256((root/n).read_bytes()).hexdigest() for n in source_files}}),flush=True)
