"""Render the reviewed categorical receiver for an existing private HF host.
No Hub writes or model calls. Does not edit app.py or replace any owned module.
"""
from __future__ import annotations
import argparse, hashlib, json
from pathlib import Path

SOURCE_COMMIT = '37edcea4dba1f7e42ad686f95e9d4860b64aeb38'
PINS = {'join_contract.py': 'bec752c2597a98f6c7538152259d5c46f92d2ef0f954c157851a5dd825d03af0',
        'receive_artifacts.py': 'aada8d71976324737ec6075c83348c3410a8206b58b526421d7d916be0a8b79d'}
EVENT_PIN = '144c6a36d462e21283ab9b34a6469bb32c75021da56133813d5a848412270533'

BRIDGE = r'''"""Read-only host adapter. Caller pins are not authenticated; no action authority."""
from pathlib import Path
import datetime as dt
import hashlib, importlib.util, json

ROOT=Path(__file__).resolve().parent
PINS=__PINS__
EVENT_PIN='__EVENT_PIN__'

def _checked(path, pin):
    if path.is_symlink() or not path.is_file():raise ValueError('SOURCE_FILE_REQUIRED')
    with path.open('rb') as f:raw=f.read(65537)
    if len(raw)>65536 or hashlib.sha256(raw).hexdigest()!=pin:raise ValueError('SOURCE_PIN_MISMATCH')
    return raw

for name,pin in PINS.items():_checked(ROOT/name,pin)
event_path=ROOT.parent/'lab_assets/event.py'
_checked(event_path,EVENT_PIN)
from . import receive_artifacts as receiver
spec=importlib.util.spec_from_file_location('component_join_existing_event',event_path)
E=importlib.util.module_from_spec(spec)
spec.loader.exec_module(E)
# Explicit host-layout adaptation: reuse the existing byte-identical event builder.
receiver._evidence_module=lambda:E

def review(request_json: str) -> dict:
    """Check supplied bytes and declared context using receiver UTC.
    No source fetching, model use, persistence, signatures or execution authority.
    The host/user still needs an authenticated trust path for expected pins.
    """
    for name,pin in PINS.items():_checked(ROOT/name,pin)
    _checked(event_path,EVENT_PIN)
    return receiver.evidence_json(request_json,current=True)

def example_request() -> str:
    """Fresh synthetic demonstration, not outputs from actual neural workers."""
    now=dt.datetime.now(dt.timezone.utc)
    h=lambda value:hashlib.sha256(value.encode()).hexdigest()
    context={'task_id':'SYNTHETIC-colour-demo','input_sha256':h('fictional red/blue input'),
             'label_schema':['RED','BLUE'],'source_snapshot':(now-dt.timedelta(seconds=1)).isoformat(),
             'dependency_root':h('synthetic dependency graph')}
    texts=[];pins=[]
    for i,p in enumerate(([.8,.2],[.6,.4])):
        obj={**context,'component_id':f'SYNTHETIC-worker-{i}','revision':h(f'synthetic code {i}'),
             'probabilities':p,'evidence_kind':'PREDICTION','state':'COMPLETE',
             'valid_until':(now+dt.timedelta(minutes=5)).isoformat(),
             'dependencies_complete':True,'fault_domain':'synthetic-shared-operator'}
        text=json.dumps(obj,sort_keys=True,separators=(',',':'));texts.append(text)
        pins.append({'component_id':obj['component_id'],'revision':obj['revision'],'result_sha256':h(text)})
    return json.dumps({'context':context,'pins':pins,'artifact_json':texts},indent=2)
'''

UI = '''"""Additive review UI; no conversation, memory, provider or authority changes."""
import json
import gradio as gr
from component_join_review.bridge import review, example_request

def review_component_artifacts(request_json: str) -> str:
    """Check supplied specialist artifact bytes and declared context using server UTC.
    Returns an unsigned PARTIAL event, not truth, human approval or permission.
    No models, URLs, files or external actions are invoked from request content.
    """
    try:return json.dumps(review(request_json),sort_keys=True,indent=2,allow_nan=False)
    except (ValueError,TypeError,UnicodeError):
        raise gr.Error('Review refused: check the exact bytes, expected pins, ordered labels, current dependencies and expiry. Caller clocks are not accepted.') from None

def mount_component_join():
    with gr.Accordion('Specialist output review · byte and context checks',open=False):
        gr.Markdown('Compare categorical predictions only when their exact bytes and declared context match. '
                    '**Supplied checksums do not authenticate a source.** Results remain predictions; '
                    'events are unsigned/PARTIAL and do not authorise actions. No training or durable storage is performed.')
        request=gr.Textbox(label='Artifact review JSON — fictional or non-sensitive input only',lines=9)
        result=gr.Code(language='json',interactive=False,label='Byte checks, prediction and held evidence record')
        with gr.Row():
            gr.Button('Load fresh synthetic example').click(example_request,[],request,api_name=False,queue=False)
            gr.Button('Check bytes and compatibility').click(review_component_artifacts,request,result,
                api_name='lab_component_join',concurrency_limit=2)
        gr.Markdown('The example contains invented worker outputs and expires after five minutes. '
                    'Generate a new example rather than supplying an earlier clock. '
                    'Continuous state forecasts, votes and categorical probabilities are different contracts.')
'''

TESTS = r'''import ast,copy,hashlib,json,unittest
from pathlib import Path
from unittest.mock import patch
from component_join_review import bridge as B

class HostBridgeTests(unittest.TestCase):
    def request(self):return json.loads(B.example_request())
    def changed(self,field,value):
        q=self.request();p=json.loads(q['artifact_json'][0]);p[field]=value
        q['artifact_json'][0]=json.dumps(p)
        q['pins'][0]['result_sha256']=hashlib.sha256(q['artifact_json'][0].encode()).hexdigest()
        return q
    def runq(self,q):return B.review(json.dumps(q))
    def test_example_declared_synthetic(self):self.assertTrue(self.request()['context']['task_id'].startswith('SYNTHETIC'))
    def test_example_has_no_clock(self):self.assertNotIn('now',self.request())
    def test_valid_example(self):self.assertEqual(self.runq(self.request())['receiver']['join']['label'],'RED')
    def test_event_is_canonical(self):self.assertEqual(self.runq(self.request())['event']['schema'],'csoai.evidence-event/0.1')
    def test_event_remains_partial_null(self):
        r=self.runq(self.request());self.assertEqual(r['event']['state'],'PARTIAL');self.assertIsNone(r['event']['value'])
    def test_event_unsigned(self):self.assertIsNone(self.runq(self.request())['event']['signature'])
    def test_no_authority(self):self.assertFalse(self.runq(self.request())['receiver']['authorises_execution'])
    def test_pins_not_authenticated(self):self.assertFalse(self.runq(self.request())['receiver']['pins_authenticated'])
    def test_receiver_clock(self):self.assertEqual(self.runq(self.request())['receiver']['clock_mode'],'RECEIVER_UTC')
    def test_caller_clock_refused(self):
        q=self.request();q['now']='2000-01-01T00:00:00Z'
        with self.assertRaises(ValueError):self.runq(q)
    def test_altered_bytes_refused(self):
        q=self.request();q['artifact_json'][0]+=' '
        with self.assertRaises(ValueError):self.runq(q)
    def test_wrong_pin_refused(self):
        q=self.request();q['pins'][0]['result_sha256']='0'*64
        with self.assertRaises(ValueError):self.runq(q)
    def test_stale_context_refused(self):
        q=self.request();q['context']['dependency_root']='9'*64
        with self.assertRaises(ValueError):self.runq(q)
    def test_label_order_refused(self):
        with self.assertRaises(ValueError):self.runq(self.changed('label_schema',['BLUE','RED']))
    def test_expiry_refused(self):
        with self.assertRaises(ValueError):self.runq(self.changed('valid_until','2000-01-01T00:00:00Z'))
    def test_incomplete_dependencies_refused(self):
        with self.assertRaises(ValueError):self.runq(self.changed('dependencies_complete',False))
    def test_truthy_dependency_refused(self):
        with self.assertRaises(ValueError):self.runq(self.changed('dependencies_complete',1))
    def test_observation_not_prediction(self):
        with self.assertRaises(ValueError):self.runq(self.changed('evidence_kind','OBSERVATION'))
    def test_boolean_probabilities_refused(self):
        with self.assertRaises(ValueError):self.runq(self.changed('probabilities',[True,False]))
    def test_extra_request_url_refused(self):
        q=self.request();q['url']='https://not-fetched.invalid'
        with self.assertRaises(ValueError):self.runq(q)
    def test_no_path_input(self):
        q=self.request();q['artifact_json'][0]='/private/not-read'
        with self.assertRaises(ValueError):self.runq(q)
    def test_unknown_input_shape(self):
        with self.assertRaises(ValueError):B.review('[]')
    def test_size_bound(self):
        with self.assertRaises(ValueError):B.review(' '*65537)
    def test_recovery_after_refusal(self):
        with self.assertRaises(ValueError):B.review('{}')
        self.assertEqual(self.runq(self.request())['receiver']['join']['label'],'RED')
    def test_inputs_not_mutated(self):
        q=self.request();before=copy.deepcopy(q);self.runq(q);self.assertEqual(q,before)
    def test_canonical_validation(self):self.assertEqual(B.E.validate(self.runq(self.request())['event']),[])
    def test_source_guard_called(self):
        with patch.object(B,'_checked',side_effect=ValueError('SOURCE_PIN_MISMATCH')):
            with self.assertRaisesRegex(ValueError,'SOURCE_PIN'):self.runq(self.request())
    def test_ui_tool_registration(self):
        text=Path(__file__).with_name('component_join_ui.py').read_text();tree=ast.parse(text)
        names=[kw.value.value for n in ast.walk(tree) if isinstance(n,ast.Call) for kw in n.keywords if kw.arg=='api_name' and isinstance(kw.value,ast.Constant)]
        self.assertEqual(names.count('lab_component_join'),1);self.assertIn(False,names)
    def test_no_trusted_consensus_claim(self):
        r=self.runq(self.request())['receiver']['join'];self.assertEqual(r['independence_status'],'NOT_ESTABLISHED');self.assertEqual(r['replies'],'HELD')

if __name__=='__main__':unittest.main(verbosity=2)
'''

def render(source: Path, output: Path) -> dict:
    sources={}
    for name,pin in PINS.items():
        p=source/name
        if p.is_symlink():raise ValueError('SYMLINK_SOURCE')
        raw=p.read_bytes()
        if len(raw)>65536 or hashlib.sha256(raw).hexdigest()!=pin:raise ValueError('SOURCE_PIN_MISMATCH '+name)
        sources[name]=raw.decode('utf-8')
    pre='from join_contract import FIELDS, HEX, MAX_BYTES, MAX_COMPONENTS, digest, join, loads'
    if sources['receive_artifacts.py'].count(pre)!=1:raise ValueError('ADAPTATION_PREIMAGE')
    sources['receive_artifacts.py']=sources['receive_artifacts.py'].replace(pre,pre.replace('from join_contract','from .join_contract'))
    hashes={k:hashlib.sha256(v.encode()).hexdigest() for k,v in sources.items()}
    files={f'component_join_review/{k}':v for k,v in sources.items()}
    files['component_join_review/__init__.py']='"""Generated review-only adapter from the canonical component join."""\n'
    files['component_join_review/bridge.py']=BRIDGE.replace('__PINS__',repr(hashes)).replace('__EVENT_PIN__',EVENT_PIN)
    files['component_join_ui.py']=UI
    files['test_component_join_bridge.py']=TESTS
    provenance={'canonical_revision':SOURCE_COMMIT,'source_sha256':PINS,'adaptations':['One absolute import made package-relative.','Canonical event loader bound to existing identical lab_assets/event.py.'],
                'event_sha256':EVENT_PIN,'mode':'PRIVATE_REVIEW','execution_authorized':False,'signed':False}
    files['COMPONENT_JOIN_SOURCE.json']=json.dumps(provenance,indent=2)+'\n'
    for name,text in files.items():
        p=output/name;p.parent.mkdir(parents=True,exist_ok=True)
        if p.is_symlink():raise ValueError('SYMLINK_OUTPUT')
        p.write_text(text)
    return {'files_sha256':{n:hashlib.sha256(t.encode()).hexdigest() for n,t in files.items()},'adaptations':provenance['adaptations']}

if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--source',type=Path,required=True);p.add_argument('--out',type=Path,required=True);a=p.parse_args()
    print(json.dumps(render(a.source,a.out),indent=2))
