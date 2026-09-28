#!/usr/bin/env python3
"""Layer O Venturi wrapper: public/owner-bounded inputs -> deterministic WorkEvidenceCapsule.

This is a wrapper, not a blockchain and not an authority root. It reuses the existing
work-evidence-capsule schema and Venturi pack registry, records exact source bytes, reads
the live GSPC board, and fails closed when required profile axes or sources are unavailable.
"""
from __future__ import annotations
import argparse, datetime as dt, hashlib, ipaddress, json, urllib.parse, urllib.request, urllib.error
from pathlib import Path
from typing import Any

ROOT=Path(__file__).resolve().parents[2]
PACKS=ROOT/'public/interop/venturi-pack-registry.v0.1.draft.json'
GSPC='https://councilof.ai/api/gspc'
UA='CSOAI-Layer-O-Venturi/0.1 (+https://councilof.ai/)'

def canon(x: Any)->bytes:
    return json.dumps(x,sort_keys=True,separators=(',',':'),ensure_ascii=False).encode()
def sha(b: bytes)->str: return 'sha256:'+hashlib.sha256(b).hexdigest()
def preserve_bytes(b: bytes, directory: Path)->str:
    digest=sha(b); directory.mkdir(parents=True,exist_ok=True)
    path=directory/(digest.split(':',1)[1]+'.bin')
    if path.exists():
        if path.read_bytes()!=b: raise ValueError('stored evidence digest collision or corruption')
    else:
        path.write_bytes(b)
    return path.name
def validate_source_url(url: str)->None:
    parsed=urllib.parse.urlsplit(url)
    host=parsed.hostname or ''
    if parsed.scheme != 'https' or not host or parsed.username or parsed.password or parsed.fragment:
        raise ValueError('source must be a public HTTPS URL without credentials or fragment')
    if host == 'localhost' or host.endswith('.localhost') or host.endswith('.local'):
        raise ValueError('local source is not public evidence')
    try:
        ipaddress.ip_address(host)
    except ValueError:
        pass
    else:
        raise ValueError('IP literal is not an approved public source')

class PublicRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        validate_source_url(newurl)
        return super().redirect_request(req,fp,code,msg,headers,newurl)

def fetch(url: str)->tuple[bytes,int]:
    validate_source_url(url)
    req=urllib.request.Request(url,headers={'User-Agent':UA,'Accept':'application/json,text/plain,*/*'})
    with urllib.request.build_opener(PublicRedirect()).open(req,timeout=20) as r:
        body=r.read(2_000_001)
        if not body or len(body)>2_000_000: raise ValueError('source body empty or exceeds 2 MB limit')
        return body,int(r.status)
def pack_map()->dict[str,dict]:
    d=json.loads(PACKS.read_text())
    return {x['id']:x for x in d['packs']}
def gspc_axes()->tuple[bytes,set[str]]:
    b,_=fetch(GSPC); d=json.loads(b); rows=d.get('axes') or d.get('rows') or []
    return b,{str(x.get('axis') or x.get('id') or x.get('name')) for x in rows if x.get('status')=='MEASURED'}

def build(profile:str, subject:str, sources:list[str], principal:str, owner_authorized:bool=False, evidence_dir:Path|None=None)->dict[str,Any]:
    packs=pack_map()
    if profile not in packs: raise ValueError(f'unknown profile {profile!r}')
    if not subject.strip() or not sources: raise ValueError('subject and at least one source are required')
    if owner_authorized: raise ValueError('owner authority needs a verified delegation; a CLI flag cannot grant it')
    for url in sources: validate_source_url(url)
    pack=packs[profile]
    observed_at=dt.datetime.now(dt.timezone.utc).isoformat().replace('+00:00','Z')
    receipts=[]; deps=[]; failures=[]; evidence_files=[]
    for i,url in enumerate(sources):
        try:
            b,status=fetch(url); dg=sha(b)
            if evidence_dir: evidence_files.append({'digest':dg,'path':preserve_bytes(b,evidence_dir)})
            deps.append({'dependency_id':f'source:{i}','digest':dg,'kind':'public-source','required_for_resume':True})
            receipts.append({'kind':'source-readback','producer':'layer-o-venturi/0.1','digest':dg,'observed_at':observed_at,'subject':subject,'uri':url})
        except Exception as e:
            failures.append({'url':url,'error':f'{type(e).__name__}: {e}'})
    try:
        gb,axes=gspc_axes(); gd=sha(gb)
        if evidence_dir: evidence_files.append({'digest':gd,'path':preserve_bytes(gb,evidence_dir)})
        deps.append({'dependency_id':'gspc:live-board','digest':gd,'kind':'measurement-board','required_for_resume':True})
        receipts.append({'kind':'gspc-board-readback','producer':'layer-o-venturi/0.1','digest':gd,'observed_at':observed_at,'subject':profile,'uri':GSPC})
    except Exception as e:
        axes=set(); failures.append({'url':GSPC,'error':f'{type(e).__name__}: {e}'})
    required=list(pack['gspc_profile']); missing=sorted(set(required)-axes)
    intent={'profile':profile,'subject':subject,'sources':sources,'required_axes':required,'owner_authorized':owner_authorized}
    limits={'mode':'permissionless-read-only','mutations':False,'payment_mints_measurement':False}
    input_digest=sha(canon(intent)); limits_digest=sha(canon(limits))
    state='completed' if not failures and not missing else 'suspended'
    capsule={
      'schema_uri':'https://csoai.org/schema/work-evidence-capsule-v0.1.json','schema_version':'0.1','capsule_id':None,
      'created_at':observed_at,'state':state,
      'task':{'work_unit_id':'venturi-'+hashlib.sha256(canon(intent)).hexdigest()[:24],'a2a_context_id':None,'a2a_task_id':None,'mcp_task_id':None,'parent_work_unit_id':None},
      'authority':{'principal':principal,'authority_epoch':'2026-09-26','delegation_id':None,'limits_digest':limits_digest,'policy_uri':'https://councilof.ai/spec/claim-maintenance/v0.1/'},
      'skill':{'uri':'https://councilof.ai/interop/venturi-pack-registry.v0.1.draft.json','resources':'static','resource_digests':[{'digest':sha(PACKS.read_bytes()),'uri':None,'media_type':'application/json'}],'materialized_snapshot_digest':None},
      'runtime':{'runtime':'Layer O Venturi','runtime_version':'0.1','runtime_digest':sha(Path(__file__).read_bytes()),'policy_digest':limits_digest,'sandbox_config_digest':None,'toolset_digest':None},
      'inputs_digest':input_digest,'outputs_digest':None,'dependencies':deps,'receipts':receipts,'side_effects':[],'payment':None,'supersedes':None,'correction_reason':None,
      'venturi_extension': {'profile':profile,'profile_name':pack['name'],'required_axes':required,'missing_axes':missing,'source_failures':failures,
          'authority_state':'ALLOW_PUBLIC_READ','effect_state':'NO_EFFECT','work_scope':'PUBLIC_SOURCE_READBACK',
          'subject_measurement_state':'NOT_RUN','constitutional_decision':'NOT_RUN',
          'delivery_state':'NOT_RUN','settlement_state':'NOT_RUN',
          'board_profile_note':'Required axes were checked for MEASURED status on the public board; this is not a measurement of the subject.',
          'evidence_files':evidence_files}
    }
    # Existing capsule schema is strict: extension travels in a companion object, not the canonical capsule.
    ext=capsule.pop('venturi_extension')
    reaction_event={
        'subject_id':'venturi:'+subject,
        'change_state':'OBSERVED_READBACK' if state=='completed' else 'READBACK_SUSPENDED',
        'current_content_id':None,
        'candidate_axes':required,
        'candidate_hives':[],
        'source_scope':profile,
        'observed_facts':[
            f"source_readbacks:{sum(1 for r in receipts if r.get('kind')=='source-readback')}",
            f"missing_required_axes:{len(missing)}",
            f"source_failures:{len(failures)}",
        ],
    }
    ext['reaction_trigger']={
        'schema':'csoai.reaction-trigger/0.1',
        'event_id':hashlib.sha256(canon(reaction_event)).hexdigest(),
        'state':'QUEUED_SYNTHETIC_SIMULATION',
        'event':reaction_event,
        'reaction_classes':['DIRECT_CONTINUATION','COUNTER_REACTION','SECOND_ORDER_SPILLOVER','REGIME_BREAK'],
        'horizons':['IMMEDIATE','SESSION','WEEKEND','WEEKS'],
        'dependency_seed':sorted({str(d.get('dependency_id')) for d in deps if d.get('dependency_id')}),
        'execution_authority':False,
        'measurement_authority':False,
        'note':'Venturi emits a bounded reaction trigger; SovSpace/EAT owns counterfactual simulation and the 3KB reaction record.',
    }
    capsule['outputs_digest']=sha(canon({'state':state,'receipts':receipts,'missing_axes':missing,'failures':failures}))
    tmp=dict(capsule); tmp['capsule_id']=None
    capsule['capsule_id']=sha(canon(tmp))
    ext['reaction_trigger']['event']['current_content_id']=capsule['capsule_id']
    ext['reaction_trigger']['event_id']=hashlib.sha256(canon(ext['reaction_trigger']['event'])).hexdigest()
    return {'schema':'csoai.layer-o-venturi-result/0.1','capsule':capsule,'venturi':ext}

def main()->int:
    ap=argparse.ArgumentParser(); ap.add_argument('--profile',required=True); ap.add_argument('--subject',required=True); ap.add_argument('--source',action='append',required=True); ap.add_argument('--principal',default='did:web:csoai.org'); ap.add_argument('--owner-authorized',action='store_true'); ap.add_argument('--out',type=Path,required=True)
    a=ap.parse_args(); result=build(a.profile,a.subject,a.source,a.principal,a.owner_authorized,a.out.parent/'evidence'); a.out.parent.mkdir(parents=True,exist_ok=True); a.out.write_text(json.dumps(result,indent=2,ensure_ascii=False)+'\n'); print(a.out); print(result['capsule']['capsule_id']); print('readback_task_state='+result['capsule']['state']); print('subject_measurement_state='+result['venturi']['subject_measurement_state']); return 0
if __name__=='__main__': raise SystemExit(main())
