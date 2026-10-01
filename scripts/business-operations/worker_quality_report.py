#!/usr/bin/env python3
"""Read-only quality/cadence report for the existing worker; never dispatches work."""
import argparse, hashlib, html, json, sys
from collections import Counter
from datetime import datetime, timedelta, timezone
from pathlib import Path
MAX_JSON=1048576
MAX_EVIDENCE=67108864

def strict_object(pairs):
    result={}
    for key,value in pairs:
        if key in result: raise ValueError('duplicate JSON member: '+key)
        result[key]=value
    return result

def load_json(path):
    if path.is_symlink() or path.stat().st_size>MAX_JSON: raise ValueError('symlink or oversized JSON')
    result=json.loads(path.read_text(encoding='utf-8'),object_pairs_hook=strict_object,parse_constant=lambda v:(_ for _ in ()).throw(ValueError(v)))
    if not isinstance(result,dict): raise ValueError('JSON object required')
    return result

def utc(value):
    result=datetime.fromisoformat(value.replace('Z','+00:00'))
    if result.tzinfo is None: raise ValueError('timestamp must include timezone')
    return result.astimezone(timezone.utc)

def digest(path,strip_lf=False):
    if path.is_symlink() or path.stat().st_size>MAX_EVIDENCE: raise ValueError('symlink or oversized evidence')
    h=hashlib.sha256()
    if strip_lf: h.update(path.read_bytes().rstrip(b'\n'))
    else:
        with path.open('rb') as handle:
            for chunk in iter(lambda:handle.read(1048576),b''): h.update(chunk)
    return h.hexdigest()

def verify_candidate_card(path, expected_id, run):
    """Verify current body IDs and identify older wrapper-hash manifests."""
    card=load_json(path)
    body=card.get('body')
    if not isinstance(body,dict): raise ValueError('candidate body missing')
    if card.get('preimage_rule')!='sha256(canonical body)' or card.get('signature') is not None:
        raise ValueError('candidate preimage or unsigned state invalid')
    canonical=json.dumps(body,sort_keys=True,separators=(',',':'),ensure_ascii=True,allow_nan=False).encode('utf-8')
    actual=hashlib.sha256(canonical).hexdigest()
    if card.get('id')!=actual:
        raise ValueError('candidate body ID mismatch')
    evidence=body.get('compute_evidence')
    if not isinstance(evidence,dict) or body.get('status')!='UNMEASURED':
        raise ValueError('candidate evidence or status invalid')
    for key, value in [('run_id',run['run_id']),('bank_sha256',run['bank_sha256']),
                       ('model_manifest_digest',run['model_manifest_digest']),
                       ('items_sha256',run['items_sha256'])]:
        if evidence.get(key)!=value: raise ValueError('candidate evidence binding mismatch: '+key)
    if expected_id==actual:
        return 'BODY_ID'
    # Earlier worker releases stored the canonical card wrapper hash (without
    # its file newline) in run.card_sha256. Retain that evidence, but keep it
    # out of the scoreable candidate count until intake reviews the legacy pin.
    wrapper=json.dumps(card,sort_keys=True,separators=(',',':'),ensure_ascii=True,allow_nan=False).encode('utf-8')
    if expected_id==hashlib.sha256(wrapper).hexdigest():
        return 'LEGACY_WRAPPER_HASH'
    raise ValueError('candidate manifest hash mismatch')

def classify(run):
    c=run.get('counts');keys=('bank_items','attempted','transport_ok','graded_n','correct','parse_errors_excluded','transport_errors_excluded')
    if not isinstance(c,dict) or any(type(c.get(k)) is not int or c[k]<0 for k in keys): return 'CONTRADICTORY_METADATA'
    if c['correct']>c['graded_n'] or c['attempted']>c['bank_items'] or c['graded_n']+c['parse_errors_excluded']!=c['transport_ok'] or c['transport_ok']+c['transport_errors_excluded']!=c['attempted']: return 'CONTRADICTORY_METADATA'
    if run.get('complete') is not True: return 'INCOMPLETE'
    if c['attempted']!=c['bank_items']: return 'CONTRADICTORY_METADATA'
    if c['transport_errors_excluded']: return 'TRANSPORT_INCOMPLETE'
    if c['graded_n']==0:
        return 'CONTRADICTORY_METADATA' if run.get('landable_candidate') is True else 'NO_GRADED_OUTPUT'
    if run.get('detail_code')!='COMPLETE_UNSIGNED' or run.get('landable_candidate') is not True: return 'REQUIRES_REVIEW'
    return 'PARTLY_GRADED_CANDIDATE' if c['parse_errors_excluded'] else 'FULLY_GRADED_CANDIDATE'

def audit(config_dir,health_path,workspace,now,hours=24,max_runs=20000):
    workspace=workspace.resolve();cutoff=now-timedelta(hours=hours)
    errors=[];rows=[];jobs=[];pins={};seen=set();scanned=0;health=load_json(health_path)
    for config_path in sorted(config_dir.glob('*.json')):
        try:
            c=load_json(config_path);pins[str(config_path)]=digest(config_path);output=Path(c['output_dir']).resolve();interval=c['interval_seconds']
            if not output.is_relative_to(workspace): raise ValueError('output outside workspace')
            if type(interval) is not int or not 1<=interval<=86400: raise ValueError('invalid interval')
            if output in seen: raise ValueError('duplicate configured output directory')
            seen.add(output);latest=None
            for path in sorted((output/'runs').glob('*/run.json')):
                scanned+=1
                if scanned>max_runs: raise ValueError('run scan budget exceeded')
                try:
                    r=load_json(path);finished=utc(r['finished_at'])
                    if finished>now: raise ValueError('future completion timestamp')
                    binding=(r.get('model_transport')==c['model'] and r.get('axis')==c['axis'] and r.get('bank_sha256')==c['expected_bank_sha256'] and r.get('model_manifest_digest')==c['expected_model_manifest_digest'])
                    instrument=r.get('instrument',{});decode=instrument.get('decode',{})
                    expected_profile={'generate':None,'chat':'ollama-chat-message-content-v1','qwen3-raw-nonthinking':'ollama-qwen3-raw-nonthinking-v1'}.get(c.get('ollama_api','generate'),'UNKNOWN')
                    same_instrument=(binding and decode.get('max_tokens')==c['max_tokens'] and decode.get('seed')==c.get('seed',0) and decode.get('temperature')==0 and instrument.get('transport_profile')==expected_profile and instrument.get('allowed_labels')==c.get('allowed_labels',[]))
                    if same_instrument and (latest is None or finished>latest[0]): latest=(finished,r)
                    if finished<cutoff: continue
                    if not binding:
                        errors.append({'file':str(path),'error':'current model/bank binding differs'});continue
                    state=classify(r);candidate=r.get('candidate_file')
                    if candidate not in ('card-unsigned.json','card-incomplete.json'): raise ValueError('unrecognised candidate filename')
                    items=path.parent/'items.jsonl';card_path=path.parent/candidate
                    for target in (items,card_path):
                        if not target.resolve().is_relative_to(workspace): raise ValueError('evidence outside workspace')
                    if digest(items)!=r['items_sha256']: raise ValueError('evidence hash mismatch: items.jsonl')
                    hash_mode=verify_candidate_card(card_path,r['card_sha256'],r)
                    if hash_mode=='LEGACY_WRAPPER_HASH' and state in ('FULLY_GRADED_CANDIDATE','PARTLY_GRADED_CANDIDATE'):
                        state='REQUIRES_REVIEW'
                    rows.append({'run_id':r['run_id'],'manifest':str(path),'model':c['model'],'axis':c['axis'],'finished_at':r['finished_at'],'quality':state,'counts':r['counts'],'detail_code':r.get('detail_code'),'evidence_hashes_match':True,'candidate_hash_mode':hash_mode,'matches_current_instrument':same_instrument})
                except (ValueError,KeyError,TypeError,OSError) as exc: errors.append({'file':str(path),'error':str(exc)[:220]})
            due=latest[0]+timedelta(seconds=interval) if latest and latest[1].get('detail_code') in ('COMPLETE_UNSIGNED','ALL_UNPARSED') else None
            jobs.append({'job':config_path.stem,'model':c['model'],'axis':c['axis'],'interval_seconds':interval,'next_due_estimate':due.isoformat() if due else None,'cadence_estimate_basis':'last matching instrument completion; not live scheduler memory'})
        except (ValueError,KeyError,TypeError,OSError) as exc: errors.append({'file':str(config_path),'error':str(exc)[:220]})
    counts=Counter(r['quality'] for r in rows);unparsed=Counter(r['model'] for r in rows if r['quality']=='NO_GRADED_OUTPUT')
    legacy_count=sum(r['candidate_hash_mode']=='LEGACY_WRAPPER_HASH' for r in rows)
    for path,original in pins.items():
        if digest(Path(path))!=original: errors.append({'file':path,'error':'configuration changed during read'})
    age=None
    try: age=(now-utc(health['updated_at'])).total_seconds()
    except (KeyError,ValueError,TypeError): errors.append({'file':str(health_path),'error':'invalid heartbeat timestamp'})
    estimates=[utc(j['next_due_estimate']) for j in jobs if j['next_due_estimate']];cadence='UNKNOWN';alerts=[]
    if estimates and len(estimates)==len(jobs): cadence='WAITING_UNTIL_DUE' if min(estimates)>now else 'DUE_OR_RUNNING'
    if age is None or age<0 or age>180: alerts.append('HEARTBEAT_NOT_CURRENT')
    if unparsed: alerts.append('UNPARSED_COMPLETIONS_REQUIRE_REPAIR')
    if legacy_count: alerts.append('LEGACY_CANDIDATE_HASH_MODE_REQUIRES_REVIEW')
    if counts['PARTLY_GRADED_CANDIDATE']: alerts.append('PARTIAL_GRADING_REQUIRES_REVIEW')
    if any(counts[k] for k in ('CONTRADICTORY_METADATA','INCOMPLETE','TRANSPORT_INCOMPLETE','REQUIRES_REVIEW')): alerts.append('RUN_METADATA_OR_COMPLETION_REQUIRES_REVIEW')
    if errors: alerts.append('INCOMPLETE_OR_INVALID_AUDIT')
    if not rows: alerts.append('NO_VERIFIED_RUNS_IN_WINDOW')
    return {'schema':'csoai.worker-quality-readback/1','observed_at':now.isoformat(),'window_start':cutoff.isoformat(),'window_hours':hours,'state':'REVIEW_REQUIRED' if alerts else 'OBSERVED_CANDIDATES_PRESENT','alerts':alerts,
        'process':{'reported_state':health.get('state'),'heartbeat_age_seconds':age,'reported_completed_counter':health.get('successful_runs'),'counter_scope':'reported process lifetime; not window count or measurement count'},
        'window':{'verified_run_records':len(rows),'quality_counts':dict(counts),'scoreable_candidates':counts['FULLY_GRADED_CANDIDATE']+counts['PARTLY_GRADED_CANDIDATE'],'legacy_candidate_hash_records':legacy_count,'unparsed_by_model':dict(unparsed),'admitted':None,'published':None,'admission_publication_reason':'not established by compute-only artifacts'},
        'schedule':{'jobs':len(jobs),'cadence_state':cadence,'next_due_estimate':min(estimates).isoformat() if estimates else None},'errors':errors,'runs':rows,'jobs':jobs,'config_sha256':pins,
        'limits':{'maximum_run_manifests':max_runs,'json_bytes':MAX_JSON,'evidence_bytes_per_file':MAX_EVIDENCE},'mutations':False,'new_inference':False,'scheduler_created':False,'scope':'retained output integrity and declared grading counts; not independent grading, admission or publication'}

def render_html(r):
    w=r['window'];e=lambda v:html.escape(str(v));metrics=[('Verified run records',w['verified_run_records']),('Candidates with graded output',w['scoreable_candidates']),('No graded output',w['quality_counts'].get('NO_GRADED_OUTPUT',0)),('Admitted / publicly released','Not established')]
    cards=''.join('<section><h2>'+e(k)+'</h2><strong>'+e(v)+'</strong></section>' for k,v in metrics)
    return '<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>CSOAI worker quality</title><style>body{font:17px system-ui;max-width:1000px;margin:40px auto;padding:20px}section{border:1px solid;padding:20px;margin:12px 0}h2{font-size:18px}strong{font-size:26px}</style><h1>CSOAI: completed is not the same as measured</h1><p>Read-only snapshot: '+e(r['observed_at'])+'</p>'+cards+'<h2>Action required</h2><p>'+e(', '.join(r['alerts']) or 'No automatic release approval')+'</p><p>Worker: '+e(r['process']['reported_state'])+'; cadence: '+e(r['schedule']['cadence_state'])+'</p><p>Estimated next due UTC: '+e(r['schedule']['next_due_estimate'])+'</p><p>Unparsed by model: '+e(w['unparsed_by_model'])+'</p><p>This is a snapshot, not an automatically refreshing monitor. It does not dispatch jobs or approve evidence. Refresh through the existing operator workflow.</p></html>'

def main():
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('--config-dir',type=Path,required=True);p.add_argument('--health',type=Path,required=True);p.add_argument('--workspace',type=Path,required=True);p.add_argument('--hours',type=int,default=24);p.add_argument('--html',action='store_true');a=p.parse_args()
    if not 1<=a.hours<=168: p.error('hours must be between 1 and 168')
    try: r=audit(a.config_dir,a.health,a.workspace,datetime.now(timezone.utc),a.hours)
    except (ValueError,KeyError,TypeError,OSError) as exc: print(json.dumps({'state':'UNCHECKABLE','error':str(exc)}));return 2
    print(render_html(r) if a.html else json.dumps(r,indent=2,sort_keys=True));return 2 if r['errors'] else 1 if r['alerts'] else 0
if __name__=='__main__': sys.exit(main())
