#!/usr/bin/env python3
"""Regression test: claim-capture-publish failed hourly from 2026-10-15 with 'Input revision mismatch'.

Cause: ras_intake/acceptance/run_release_chain.py compared the pinned 14 Oct inspection against the live
(latest-on-PyPI) intake metadata and raised as soon as any of the three upstream packages released.
The fix keeps the retained, version-pinned result, re-verifies its bytes, and returns a non-failing HOLD.

Runs against a chain file given by RAS_RELEASE_CHAIN (default: the M4 install path). Every case runs in a
throw-away temporary mirror with stub Condor/contract/catalogue/checker modules; the real directory is only read.
Stdlib only:  /opt/homebrew/opt/python@3.14/bin/python3.14 -B test_run_release_chain_drift.py
"""
import hashlib,importlib.util,json,os,subprocess,sys,tempfile,types,unittest
from pathlib import Path
CHAIN=Path(os.environ.get('RAS_RELEASE_CHAIN','/Users/nicholas/.csoai/claim-capture-bridge/ras_intake/acceptance/run_release_chain.py'))
TARGETS=('strands-harness','langgraph','a2a-sdk')
# Real values from the M4 state: pins written 2026-10-14T09:40Z; intake of 2026-10-15T00:03Z saw strands-harness 0.3.0.
PINS={'strands-harness':('0.2.0','f3b273ab721cf7298915bbc21a1d3c07d84a7463b7bb6b01f08c42219c57e284'),
      'langgraph':('1.2.15','bc488329db9abe550742c4fed2987565d8657f85a29f8c3702d11068bae30bcc'),
      'a2a-sdk':('1.2.2','59c1ed13135e3cf1dbd4ca7fd39e16746ffad6275c309a6ae324c8b9733c3c38')}
OCT15={'strands-harness':('0.3.0','6cafd641'+'0'*56)}
def enc(v):return json.dumps(v,sort_keys=True,separators=(',',':'),ensure_ascii=False,allow_nan=False).encode()
def sha(b):return hashlib.sha256(b).hexdigest()
INTAKE_STUB='''import hashlib,json,os
from pathlib import Path
CONDOR=Path(os.environ['CSOAI_CONDOR_ROOT']);CONTRACT=CONDOR/'data/layer-o/condor-layer-o-routing.json'
def enc(v):return json.dumps(v,sort_keys=True,separators=(',',':'),ensure_ascii=False,allow_nan=False).encode()
def sha(v):return hashlib.sha256(v).hexdigest()
def decode(raw):return json.loads(raw.decode('utf-8'))
def atomic(p,data):
    t=Path(str(p)+'.tmp');t.write_bytes(data);os.replace(t,p)
'''
LAYER_O_STUB='''class _D:
    def __init__(s,v):s.decision=v
class LayerOContract:
    def __init__(s,payload):s.payload=payload;s.registry_content_id=payload['registry_content_id']
    def read_policy_decision(s):return _D(True)
    def execution_policy_decision(s):return _D(False)
    def route(s,w):raise AssertionError('evaluation path not expected')
'''
SOV_STUB='''class SovSpaceGraph:
    def __init__(s):raise AssertionError('graph path not expected')
class SovNode:pass
class SovEdge:pass
'''
CHECK_STUB="PROFILE='stub';POLICY={'stub':True};LIMITS={'archive_bytes':1048576}\n"
def mirror(root,live=None,pins_ok=True,retained=True,tamper=False,duplicate_pin=False):
    root=Path(root);ri=root/'ras_intake';acc=ri/'acceptance';cond=root/'condor'
    for d in (cond/'condor',cond/'data/layer-o',acc,ri/'state/release-inspection'):d.mkdir(parents=True,exist_ok=True)
    (cond/'condor/__init__.py').write_text('');(cond/'condor/layer_o_contract.py').write_text(LAYER_O_STUB);(cond/'condor/gspc_sovspace.py').write_text(SOV_STUB)
    (cond/'data/layer-o/condor-layer-o-routing.json').write_bytes(enc({'registry_content_id':'reg-1'}))
    (ri/'intake.py').write_text(INTAKE_STUB)
    (ri/'aligned_catalog.py').write_text("from pathlib import Path\nHIVE_FILE=Path(__file__).with_name('hive.json')\ndef load_aligned(p):return {},{'source_sha256':'0'*64}\n");(ri/'hive.json').write_text('{}')
    (acc/'release_check.py').write_text(CHECK_STUB);(acc/'run_release_chain.py').write_bytes(CHAIN.read_bytes())
    live=dict(PINS,**(live or {}));records=[];sources=[];requests=[]
    for n in TARGETS:
        wheel=('wheel:'+n).encode();(ri/'state/release-inspection'/(sha(wheel)+'.whl')).write_bytes(wheel)
        rec={'subject_id':'pkg:pypi/'+n,'state':'ARTIFACT_BYTES_AND_IDENTITY_VERIFIED','version':PINS[n][0],'source_metadata_sha256':PINS[n][1],'sha256':sha(wheel),'bytes':len(wheel)}
        records+= [rec,dict(rec)] if duplicate_pin and n=='langgraph' else [rec]
        sources.append({'source_id':'pypi:'+n,'source_sha256':live[n][1],'source_url':'https://pypi.org/pypi/%s/json'%n,'read_at':'2026-10-15T00:03:56+00:00'})
        requests.append({'request_id':'ras:'+n,'subject':{'id':'pkg:pypi/'+n,'revision':live[n][0]},'route':{'contract_id':'reg-1','wedge':'w'}})
    (ri/'state/release-inspection/inspection.json').write_bytes(enc({'records':records}))
    (ri/'state/latest.json').write_bytes(enc({'registry_content_id':'reg-1','run_id':'r','sources':sources}))
    (ri/'state/request-queue.jsonl').write_bytes(b'\n'.join(enc(r) for r in requests)+b'\n')
    if retained:
        fp='f'*64;out=acc/'runs'/fp;out.mkdir(parents=True)
        files={'summary.json':b'{"reports":3}\n','REPORT.md':b'# retained\n'};[(out/k).write_bytes(v) for k,v in files.items()]
        man=enc({'fingerprint':fp,'files':{k:{'bytes':len(v),'sha256':sha(v)} for k,v in files.items()}})+b'\n';(out/'manifest.json').write_bytes(man)
        (acc/'latest.json').write_bytes(enc({'state':'COMPLETED_LOCAL_RELEASE_CHAIN','as_of':'2026-10-14T09:40:23+00:00','fingerprint':fp,'directory':str(out),'manifest_sha256':sha(man),'reports':3}))
        if tamper:(out/'REPORT.md').write_bytes(b'# altered\n')
    return root,acc
def run(root,acc):
    env={k:v for k,v in os.environ.items() if k!='PYTHONSAFEPATH'};env.update(CSOAI_CONDOR_ROOT=str(root/'condor'))
    p=subprocess.run([sys.executable,'-B',str(acc/'run_release_chain.py')],capture_output=True,text=True,env=env,timeout=60)
    return p.returncode,p.stdout,p.stderr
def snapshot(acc):return sorted(str(p.relative_to(acc)) for p in acc.rglob('*') if p.name!='writer.lock')
@unittest.skipUnless(CHAIN.is_file(),'chain file not present; set RAS_RELEASE_CHAIN')
class DriftRegression(unittest.TestCase):
    def setUp(self):self.tmp=tempfile.TemporaryDirectory();self.addCleanup(self.tmp.cleanup)
    def test_upstream_release_holds_instead_of_failing(self):
        root,acc=mirror(self.tmp.name,live=OCT15);before=snapshot(acc)
        rc,out,err=run(root,acc)
        self.assertEqual(rc,0,err);r=json.loads(out)
        self.assertEqual(r['state'],'NOOP_UPSTREAM_SUPERSEDED_HOLD_UNTIL_RECHECKED')
        self.assertEqual([(d['name'],d['pinned_version'],d['requested_revision']) for d in r['superseded']],[('strands-harness','0.2.0','0.3.0')])
        self.assertEqual(r['retained_fingerprint'],'f'*64);self.assertEqual(r['source_requests'],0)
        self.assertEqual(snapshot(acc),before,'hold path must not write results')
    def test_metadata_change_without_new_version_also_holds(self):
        root,acc=mirror(self.tmp.name,live={'a2a-sdk':('1.2.2','1'*64)});rc,out,err=run(root,acc)
        self.assertEqual(rc,0,err);self.assertEqual([d['name'] for d in json.loads(out)['superseded']],['a2a-sdk'])
    def test_all_three_superseded_as_on_22_nov(self):
        live={'strands-harness':('0.4.0','2'*64),'langgraph':('1.2.24','3'*64),'a2a-sdk':('1.3.1','4'*64)}
        root,acc=mirror(self.tmp.name,live=live);rc,out,err=run(root,acc)
        self.assertEqual(rc,0,err);self.assertEqual(len(json.loads(out)['superseded']),3)
    def test_tampered_retained_output_still_fails(self):
        root,acc=mirror(self.tmp.name,live=OCT15,tamper=True);rc,out,err=run(root,acc)
        self.assertEqual(rc,2);self.assertIn('Retained output changed',err)
    def test_no_retained_result_still_fails(self):
        root,acc=mirror(self.tmp.name,live=OCT15,retained=False);rc,out,err=run(root,acc)
        self.assertEqual(rc,2);self.assertIn('Input revision mismatch',err)
    def test_ambiguous_pin_still_fails(self):
        root,acc=mirror(self.tmp.name,duplicate_pin=True);rc,out,err=run(root,acc)
        self.assertEqual(rc,2);self.assertIn('Pinned input inspection missing or ambiguous',err)
    def test_matching_pins_take_normal_path(self):
        # No drift: the chain proceeds past the pin check to its normal fingerprint/evaluation path (stubbed here).
        root,acc=mirror(self.tmp.name);rc,out,err=run(root,acc)
        self.assertNotIn('NOOP_UPSTREAM_SUPERSEDED',out);self.assertNotIn('Input revision mismatch',err);self.assertIn('evaluation path not expected',err)
if __name__=='__main__':unittest.main(verbosity=2)
