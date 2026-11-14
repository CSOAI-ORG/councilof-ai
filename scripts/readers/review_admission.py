"""Offline admission for reviewed human-study evidence and model-change proposals.
No participant data collection, key generation, external calls, or autonomous promotion.
The caller supplies an operator-controlled registry; assertions cannot authorise themselves.
"""
from __future__ import annotations
import base64,datetime as dt,hashlib,json,re
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PublicKey
HEX=re.compile(r'^[0-9a-f]{64}$')
def canonical(v):return json.dumps(v,sort_keys=True,separators=(',',':'),ensure_ascii=True,allow_nan=False).encode()
def stamp(v):
    t=dt.datetime.fromisoformat(v.replace('Z','+00:00'))
    if t.tzinfo is None:raise ValueError('TIMEZONE_REQUIRED')
    return t

def verify(envelope,registry,role):
    if not isinstance(envelope,dict) or set(envelope)!={'payload','signer','signature'}:raise ValueError('ENVELOPE_SCHEMA')
    signer=envelope['signer'];key=registry.get('reviewers',{}).get(signer)
    if not key or key.get('active') is not True or role not in key.get('roles',[]):raise ValueError('AUTHORISED_REVIEWER_REQUIRED')
    try:Ed25519PublicKey.from_public_bytes(base64.b64decode(key['public_key'],validate=True)).verify(base64.b64decode(envelope['signature'],validate=True),canonical(envelope['payload']))
    except Exception as e:raise ValueError('REVIEW_SIGNATURE_INVALID') from e
    return envelope['payload'],key

def human_event(envelope,registry,evidence_bytes,current):
    p,reviewer=verify(envelope,registry,'independent-evaluator')
    expected={'schema','event_id','study_id','protocol_sha256','sample_id','role','system_revision','system_owner_id','observation_sha256','observed_at','expires_at','consent'}
    if set(p)!=expected or p['schema']!='csoai.human-evidence-event/0.1':raise ValueError('EVENT_SCHEMA')
    if p['role'] not in ('participant','independent-evaluator'):raise ValueError('EVENT_ROLE')
    for k in ('protocol_sha256','observation_sha256'):
        if not isinstance(p[k],str) or not HEX.fullmatch(p[k]):raise ValueError('DIGEST_REQUIRED')
    for k in ('event_id','study_id','sample_id','system_revision','system_owner_id'):
        if not isinstance(p[k],str) or not re.fullmatch(r'[A-Za-z0-9_.:-]{1,128}',p[k]):raise ValueError('PSEUDONYMOUS_ID_REQUIRED')
    if p['event_id'] in registry.get('revoked_events',[]):raise ValueError('EVENT_REVOKED')
    if not stamp(p['observed_at'])<=current<stamp(p['expires_at']):raise ValueError('EVENT_TIME_INVALID')
    protocol=registry.get('protocols',{}).get(p['study_id'],{})
    if protocol.get('status')!='APPROVED' or protocol.get('sha256')!=p['protocol_sha256']:raise ValueError('APPROVED_PROTOCOL_REQUIRED')
    if reviewer.get('affiliation') in (None,p['system_owner_id']):raise ValueError('REVIEWER_INDEPENDENCE_NOT_ESTABLISHED')
    consent,custodian=verify(p['consent'],registry,'consent-custodian')
    if p['consent']['signer']==envelope['signer']:raise ValueError('SEPARATE_CUSTODIAN_REQUIRED')
    if consent.get('sample_id')!=p['sample_id'] or consent.get('protocol_sha256')!=p['protocol_sha256'] or consent.get('state')!='ACTIVE':raise ValueError('CONSENT_SCOPE_MISMATCH')
    if consent.get('receipt_id') in registry.get('revoked_consents',[]):raise ValueError('CONSENT_REVOKED')
    if not stamp(consent['observed_at'])<=stamp(p['observed_at']) or not current<stamp(consent['expires_at']):raise ValueError('CONSENT_TIME_INVALID')
    if hashlib.sha256(evidence_bytes).hexdigest()!=p['observation_sha256']:raise ValueError('OBSERVATION_BYTES_MISMATCH')
    return {'event_id':p['event_id'],'role':p['role'],'sample_id':p['sample_id'],'study_id':p['study_id'],'protocol_sha256':p['protocol_sha256'],'system_revision':p['system_revision'],'observation_sha256':p['observation_sha256'],'admission':'REVIEWED_SCOPED_EVIDENCE','constitutes_global_human_score':False}

def human_cups(admitted):
    units={'participant':set(),'independent-evaluator':set()}
    for r in admitted:
        units[r['role']].add((r['study_id'],r['protocol_sha256'],r['system_revision'],r['sample_id'],r['observation_sha256']))
    return {role:{'admitted_observations':len(items),'state':'EVIDENCE_PRESENT' if items else 'NO_ADMITTED_EVIDENCE'} for role,items in units.items()}

def promotion_review(envelope,registry,current):
    p,reviewer=verify(envelope,registry,'release-reviewer')
    if p.get('schema')!='csoai.model-improvement-review/0.1':raise ValueError('REVIEW_SCHEMA')
    if reviewer.get('affiliation') in (None,p.get('candidate_owner_id')):raise ValueError('INDEPENDENT_REVIEW_REQUIRED')
    if not stamp(p['reviewed_at'])<=current<stamp(p['expires_at']):raise ValueError('REVIEW_EXPIRED_OR_FUTURE')
    train=p.get('train_item_sha256');holdout=p.get('evaluation_item_sha256')
    if not isinstance(train,list) or not isinstance(holdout,list) or not holdout:raise ValueError('HELD_OUT_ITEMS_REQUIRED')
    if any(not isinstance(x,str) or not HEX.fullmatch(x) for x in train+holdout):raise ValueError('ITEM_HASH_REQUIRED')
    if len(set(holdout))!=len(holdout) or set(train)&set(holdout):raise ValueError('TRAIN_TEST_CONTAMINATION')
    if p.get('holdout_release_id') not in registry.get('approved_holdout_releases',[]):raise ValueError('INDEPENDENT_HOLDOUT_RELEASE_REQUIRED')
    for k in ('baseline_correct','candidate_correct','graded'):
        if isinstance(p.get(k),bool) or not isinstance(p.get(k),int) or p[k]<0:raise ValueError('VALID_DENOMINATOR_REQUIRED')
    if p['graded']!=len(holdout) or max(p['baseline_correct'],p['candidate_correct'])>p['graded']:raise ValueError('UNMATCHED_DENOMINATOR')
    if p['candidate_correct']<=p['baseline_correct']:raise ValueError('NO_HELDOUT_GAIN')
    if p.get('safety_regressions')!=[] or p.get('reproducibility')!='INDEPENDENTLY_REPLAYED':raise ValueError('REGRESSION_OR_REPLAY_GATE')
    if not p.get('rollback_digest') or not HEX.fullmatch(p['rollback_digest']):raise ValueError('ROLLBACK_REQUIRED')
    return {'state':'ELIGIBLE_FOR_SEPARATE_RELEASE_REVIEW','auto_promote':False,'change_policy':False,'grant_new_authority':False,'signature_scope':'Reviewer statement verified; underlying experimental assertions still require retained/replayed evidence.'}
