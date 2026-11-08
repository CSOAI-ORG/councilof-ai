#!/usr/bin/env python3
"""Pinned, offline control-flow reproduction and conservative collection-stop candidate.

Actual collector methods and the actual orchestrator run_task are compiled from a
trusted, SHA-pinned source snapshot. Dependencies/transport/clock are controlled
fixtures; no real sandbox, model, network or vendor service is invoked.
This candidate stops the evaluation on incomplete collection; it does NOT finish
#190's per-check tri-state grade design or preserve unaffected grades on failure.
"""
from __future__ import annotations
import argparse,ast,asyncio,contextlib,copy,dataclasses,difflib,hashlib,json,logging,socket
from pathlib import Path
from types import SimpleNamespace as NS
from unittest.mock import patch
PIN='10426b489746ca588174e0a98f5e9952aacb99fa'
COLLECTOR_SHA='0ae66dffea5564ce2b9a780e0c8dd2f665548fc128c70238758269f57db00ddc'
ORCHESTRATOR_SHA='183dfa969644d83c1a5e9fde9721ac3c64761b0c66abd043a909930d7fc8615d'
PATH='src/midojo/runtimes/openshell/__init__.py'
class EvidenceCollectionError(RuntimeError):pass

def candidate(source:str)->str:
    tree=ast.parse(source);cls=next(n for n in tree.body if isinstance(n,ast.ClassDef) and n.name=='OpenShellRuntime')
    lines=source.splitlines(keepends=True)
    lines[cls.lineno-1:cls.lineno-1]=['class EvidenceCollectionError(RuntimeError):\n    """Runtime evidence is unavailable or incomplete; do not grade this evaluation."""\n\n\n']
    text=''.join(lines)
    old='''        return messages

    def _fetch_ocsf'''
    new='''        raise EvidenceCollectionError("OpenShell log sync is incomplete; do not grade this evaluation")

    def _fetch_ocsf'''
    assert text.count(old)==1;text=text.replace(old,new)
    old='''        except Exception as exc:
            logging.getLogger(__name__).warning(
                "OCSF log fetch failed — security predicates will degrade to False: %s", exc
            )
'''
    new='''        except EvidenceCollectionError:
            raise
        except Exception:
            raise EvidenceCollectionError("OpenShell log collection failed; do not grade this evaluation") from None
'''
    assert text.count(old)==1;text=text.replace(old,new)
    old='''        current = {ln.strip() for ln in all_result.stdout.splitlines() if ln.strip()}
'''
    new='''        if diff_result.exit_code != 0 or all_result.exit_code != 0:
            raise EvidenceCollectionError("OpenShell file listing failed; do not grade this evaluation")
        current = {ln.strip() for ln in all_result.stdout.splitlines() if ln.strip()}
'''
    assert text.count(old)==1;text=text.replace(old,new)
    old='''                if cat.exit_code == 0:
                    new_file_contents[fpath] = cat.stdout
'''
    new='''                if cat.exit_code != 0:
                    raise EvidenceCollectionError("OpenShell file content collection failed; do not grade this evaluation")
                new_file_contents[fpath] = cat.stdout
'''
    assert text.count(old)==1;return text.replace(old,new)

def source_methods(text:str):
    tree=ast.parse(text);cls=next(n for n in tree.body if isinstance(n,ast.ClassDef) and n.name=='OpenShellRuntime')
    methods=[copy.deepcopy(n) for n in cls.body if isinstance(n,ast.FunctionDef) and n.name in ['_sync_ocsf_messages','_fetch_ocsf','observe']]
    def events(messages):return NS(processes=[],network_allowed_endpoints=list(messages),network_blocked_endpoints=[],network_interrupted_endpoints=[],network_callers={},findings=[])
    env={'logging':logging,'uuid':NS(uuid4=lambda:NS(hex='a'*32)),'time':NS(time=lambda:0,sleep=lambda _:None),'_LOG_SYNC_BUDGET_SECONDS':15,'_SYNC_MARKER_SUFFIX':'.fixture.invalid','_SYNC_MARKER_SCRIPT':'fixture {host}',
         '_WORKDIR':'/fixture','parse_ocsf_lines':events,'OpenShellObservations':lambda **kw:NS(**kw),'ProcessRecord':lambda **kw:NS(**kw),'asdict':dataclasses.asdict,'OBSERVATIONS_SOURCE':'openshell','EvidenceCollectionError':EvidenceCollectionError}
    module=ast.Module(body=[ast.ImportFrom(module='__future__',names=[ast.alias(name='annotations')],level=0),*methods],type_ignores=[])
    exec(compile(ast.fix_missing_locations(module),'<pinned-collector-methods>','exec'),env)
    Runtime=type('PinnedRuntime',(),{n.name:env[n.name] for n in methods})
    def runtime():
        r=Runtime();r._files={};r._cached_ocsf=None;r._sync_ocsf_messages=lambda:[];r._exec=lambda *a,**k:NS(exit_code=0,stdout='');return r
    return runtime,Runtime,env

def raises(fn):
    try:fn()
    except EvidenceCollectionError:return True
    return False

def evaluate(text:str,orchestrator:str):
    runtime,Runtime,env=source_methods(text);cases=[]
    def record(name,value):cases.append({'case':name,'satisfied':bool(value)})
    r=runtime();calls=[]
    def broken():calls.append(1);raise RuntimeError('synthetic collector failure')
    r._sync_ocsf_messages=broken;failed=raises(r._fetch_ocsf);record('log-read-error-is-not-empty-evidence',failed and r._cached_ocsf is None)
    r._sync_ocsf_messages=lambda:['recovered-event'];record('failure-does-not-cache-an-empty-success',r._fetch_ocsf().network_allowed_endpoints==['recovered-event'])
    r=runtime();ticks=iter([0,0,16]);env['time']=NS(time=lambda:next(ticks),sleep=lambda _:None);r._read_ocsf_messages=lambda:[]
    record('missing-terminal-marker-is-incomplete',raises(lambda:Runtime._sync_ocsf_messages(r)))
    r=runtime();ticks=iter([0,0]);env['time']=NS(time=lambda:next(ticks),sleep=lambda _:None);r._read_ocsf_messages=lambda:['event','sync-aaaaaaaaaaaa.fixture.invalid']
    record('observed-marker-removes-only-marker',Runtime._sync_ocsf_messages(r)==['event'])
    r=runtime();r._files={'owned.txt':'seed'};r._exec=lambda *a,**k:NS(exit_code=1,stdout='')
    record('failed-listing-is-not-a-deleted-file',raises(r.observe))
    r=runtime();r._exec=lambda cmd,**kw:NS(exit_code=1 if '-newer' in cmd else 0,stdout='')
    record('failed-diff-is-not-no-change',raises(r.observe))
    r=runtime();r._exec=lambda cmd,**kw:NS(exit_code=1 if cmd[0]=='cat' else 0,stdout='/fixture/new.txt\n' if cmd[0]=='find' else '')
    record('failed-content-read-is-not-empty-content',raises(r.observe))
    r=runtime();v=r.observe()['openshell'];record('successful-empty-collection-remains-empty',v.files_deleted==[] and v.network_calls_allowed==[])
    r=runtime();r._files={'deleted.txt':'seed'};record('successful-absence-still-reports-deletion',r.observe()['openshell'].files_deleted==['/fixture/deleted.txt'])
    r=runtime();counter=[];r._sync_ocsf_messages=lambda:(counter.append(1) or ['event']);a=r._fetch_ocsf();b=r._fetch_ocsf();record('complete-events-are-cached-once',a is b and len(counter)==1)
    # Actual orchestration function, controlled collaborators. Fixture I/O cannot touch a host.
    node=next(n for n in ast.parse(orchestrator).body if isinstance(n,ast.AsyncFunctionDef) and n.name=='run_task')
    mod=ast.Module(body=[ast.ImportFrom(module='__future__',names=[ast.alias(name='annotations')],level=0),copy.deepcopy(node)],type_ignores=[])
    scope={'asyncio':asyncio,'contextlib':contextlib,'console':NS(status=lambda *a,**kw:contextlib.nullcontext()),'httpx':NS(HTTPError=type('HTTPError',(Exception,),{})),'TaskResult':lambda **kw:NS(**kw)}
    exec(compile(ast.fix_missing_locations(mod),'<pinned-orchestrator-run-task>','exec'),scope)
    async def journey(collection_failure):
        seen=[]
        class Control:
            async def create_evaluation(self,*a):return NS(id='eval-fixture',prompt='owned fixture',session_token='synthetic-only')
            async def record_observations(self,*a):seen.append('record')
            async def complete_evaluation(self,*a):seen.append('complete')
            async def grade_evaluation(self,*a):seen.append('grade');return {'fixture':True}
            async def revoke_session(self,*a):seen.append('revoke')
        class Agent:
            async def send_task(self,*a,**kw):seen.append('agent');return 'fixture answer'
        r=runtime();r.name='owned fixture';r.setup=lambda *a,**kw:None;r.teardown=lambda:seen.append('teardown')
        if collection_failure:r._sync_ocsf_messages=broken
        try:await scope['run_task'](Control(),Agent(),'run-fixture','task-fixture',None,{},runtime=r)
        except EvidenceCollectionError:seen.append('collection-error')
        return seen
    failure=asyncio.run(journey(True));ok=asyncio.run(journey(False))
    record('failed-collection-never-reaches-complete-or-grade','grade' not in failure and 'complete' not in failure and 'revoke' in failure and 'teardown' in failure)
    record('complete-collection-still-records-and-grades',ok==['agent','record','teardown','complete','grade'])
    return {'checks':cases,'passed':sum(c['satisfied'] for c in cases),'total':len(cases),'failure_path':failure,'success_path':ok}

def main():
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('--source',type=Path,required=True);p.add_argument('--out',type=Path,required=True);args=p.parse_args()
    source=(args.source/PATH).read_bytes();orch=(args.source/'src/midojo/orchestrator.py').read_bytes()
    assert hashlib.sha256(source).hexdigest()==COLLECTOR_SHA,'Source drift; stop and rebase'
    assert hashlib.sha256(orch).hexdigest()==ORCHESTRATOR_SHA,'Orchestrator drift'
    args.out.mkdir(parents=True,exist_ok=False);changed=candidate(source.decode())
    with patch.object(socket.socket,'connect',side_effect=AssertionError('Network disabled for this reproduction')):
        before=evaluate(source.decode(),orch.decode());after=evaluate(changed,orch.decode())
        # Reintroducing swallowed log errors must cause the journey and recovery checks to fail.
        broken_candidate=changed.replace('raise EvidenceCollectionError("OpenShell log collection failed; do not grade this evaluation") from None','pass')
        mutation=evaluate(broken_candidate,orch.decode())
    assert before['passed']<before['total'] and after['passed']==after['total']
    assert not next(c['satisfied'] for c in mutation['checks'] if c['case']=='failed-collection-never-reaches-complete-or-grade')
    (args.out/'collection-stop.patch').write_text(''.join(difflib.unified_diff(source.decode().splitlines(True),changed.splitlines(True),fromfile='a/'+PATH,tofile='b/'+PATH)))
    result={'schema':'csoai.controlled-reproduction/1','upstream':'asago-ai/midojo','source_commit':PIN,'collector_sha256':COLLECTOR_SHA,'orchestrator_sha256':ORCHESTRATOR_SHA,'candidate_sha256':hashlib.sha256(changed.encode()).hexdigest(),'baseline':before,'candidate':after,'disabled_guard_detected':True,'scope':'Exact pinned collector methods and orchestrator run_task, isolated fixture dependencies. Not a native OpenShell run, full package test or vendor production measurement.','limits':['Conservative full-evaluation stop; per-check bool-or-null and unaffected-grade preservation in #190 remain open.','Not installed or merged upstream.','No model, network, genuine user approval, or customer evidence.']}
    (args.out/'reproduction.json').write_text(json.dumps(result,indent=2)+'\n');print(json.dumps(result,indent=2))
if __name__=='__main__':main()
