"""Dated Academy projection and synthetic practice feedback inside the existing MEOK lab.
No network, private incident intake, learner identity, authority, signing or training.
"""
from pathlib import Path
import copy, hashlib, json, math
ASSETS=Path(__file__).with_name('learning_assets')
VERSION='2026-11-10.2'

def canonical(value):
    return json.dumps(value,sort_keys=True,separators=(',',':'),ensure_ascii=False,allow_nan=False).encode()
def digest(value):return hashlib.sha256(canonical(value)).hexdigest()
def strict_json(text,limit=16384):
    if not isinstance(text,str):raise ValueError('Bounded JSON text required')
    try: size=len(text.encode('utf-8',errors='strict'))
    except UnicodeError as exc:raise ValueError('Invalid UTF-8 text') from exc
    if size>limit:raise ValueError('Bounded JSON text required')
    def pairs(items):
        d={}
        for k,v in items:
            if k in d:raise ValueError('Duplicate JSON key')
            d[k]=v
        return d
    def reject(_):raise ValueError('Nonfinite JSON refused')
    try:return json.loads(text,object_pairs_hook=pairs,parse_constant=reject)
    except (RecursionError,UnicodeError) as exc:raise ValueError('Invalid JSON structure') from exc

def _data():
    manifest=json.loads((ASSETS/'manifest.json').read_text())
    names=['registry.json','cases.json','source-paths.json','source-reading-checks.json','source-builder-proof.json']
    data={}
    for name in names:
        raw=(ASSETS/name).read_bytes()
        if len(raw)>1000000 or hashlib.sha256(raw).hexdigest()!=manifest['files_sha256'].get(name):raise ValueError('Learning source integrity mismatch')
        data[name]=json.loads(raw)
    registry=data['registry.json'];cases=data['cases.json'];ids=[r['axis'] for r in registry['rows']]
    if len(ids)!=len(set(ids)) or len(ids)!=registry['count']:raise ValueError('Duplicate or incomplete axis registry')
    if registry['legacy_completed_flags_imported'] is not False:raise ValueError('Global completion is not learner progress')
    if len(cases)!=len({c['id'] for c in cases}):raise ValueError('Duplicate practice cases')
    for c in cases:
        raw={k:v for k,v in c.items() if k!='content_sha256'}
        if digest(raw)!=c['content_sha256']:raise ValueError('Practice content digest mismatch')
    revision=digest({'manifest':manifest,'version':VERSION})
    return registry,cases,revision

def _boundary():
    return {'human_identity_verified':False,'human_presence_established':False,
            'professional_competence_assessed':False,'reviewer_appointed':False,
            'external_action_authorised':False,'gspc_measurement_created':False,
            'gold_answer_changed':False,'model_training_performed':False,
            'model_training_authorised':False,'safe_submission_sent':False,
            'payment_authorised':False,'learner_progress_persisted':False}

def _context(axis,industry):
    registry,cases,revision=_data()
    if not isinstance(axis,str) or not isinstance(industry,str):raise ValueError('Axis and context must be strings')
    rows=[r for r in registry['rows'] if r['axis']==axis]
    if len(rows)!=1:raise ValueError('Unknown canonical axis')
    if industry not in registry['industry_profiles']:raise ValueError('Unknown educational industry context')
    row=copy.deepcopy(rows[0]);profile=copy.deepcopy(registry['industry_profiles'][industry])
    return registry,cases,revision,row,profile,axis in profile['axes']


def _scope_revision(registry,cases,row,industry):
    # A revision binding, not an access credential or human approval.
    # Excludes unrelated board rows and unrelated cases; includes the selected
    # path, reading answer key, current context mapping and applicable exercises.
    return 'lesson-v1:'+digest({
        'version':VERSION,
        'grader_sha256':hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),
        'axis':row,
        'industry_id':industry,
        'industry_context':registry['industry_profiles'][industry],
        'applicable_cases':[c for c in cases if row['axis'] in c['axes']],
        'safe_reference':registry['safe'],
        'boundaries':_boundary(),
    })

def learning_catalogue(industry='all'):
    """Inspect dated 34-axis Academy coverage and proposed industry contexts.

    Args:
        industry: Exact educational context ID, or all. This does not measure an industry.
    """
    registry,cases,revision=_data()
    if not isinstance(industry,str) or industry!='all' and industry not in registry['industry_profiles']:raise ValueError('Unknown context')
    selected=registry['rows'] if industry=='all' else [r for r in registry['rows'] if r['axis'] in registry['industry_profiles'][industry]['axes']]
    return {'state':'DATED_LEARNING_PROJECTION','registry_revision':revision,
        'board_snapshot_sha256':registry['board_sha256'],'board_read_at':registry['board_read_at'],
        'measurement_times_not_refreshed':True,'signature_verification_performed':False,
        'canonical_axis_count':registry['count'],'selected_axis_count':len(selected),
        'source_stage_count':sum(len(r['path']['stages']) for r in registry['rows']),
        'kind_counts':{k:sum(r['kind']==k for r in registry['rows']) for k in sorted({r['kind'] for r in registry['rows']})},
        'axis_rows':[{k:r[k] for k in ['axis','kind','bench','task','reported_status','reported_separation','measurement_time','industry_contexts','full_axis_course_review','named_reviewer','review_service_operating']} for r in selected],
        'industry_profiles':copy.deepcopy(registry['industry_profiles']),
        'practice_case_ids':[c['id'] for c in cases],
        'safe_practice_coverage':{'layers_referenced':len(registry['safe']['layers']),'layers_with_draft_case':len(set(y for c in cases for y in c['safe_layers'])),'human_editorial_approval':False},
        'safe_reference':registry['safe'],
        'ras':registry['ras'],'existing_orb_mooc':registry['existing_orb_mooc'],'boundaries':_boundary(),
        'limitation':'34 mapped paths are not 34 complete courses, qualified reviewers or verified industry deployments.'}

def lesson_packet(axis='claim-maintenance',industry='ai-software'):
    """Read the existing five-stage path plus original, unreviewed synthetic practice.

    Args:
        axis: Exact canonical GSPC axis identifier.
        industry: Proposed educational context identifier, not an industry certification.
    """
    registry,cases,revision,row,profile,mapped=_context(axis,industry)
    reading=copy.deepcopy(row['reading_check']);reading.pop('correct_option',None)
    visible=[]
    for c in cases:
        if axis in c['axes']:
            item=copy.deepcopy(c);item.pop('answer');visible.append(item)
    return {'state':'PRACTICE_MATERIAL_NOT_QUALIFICATION','registry_revision':revision,
            'lesson_revision':_scope_revision(registry,cases,row,industry),
            'submission_binding':'PREFER_SCOPED_LESSON_REVISION; CURRENT_LEGACY_REGISTRY_SUPPORTED','axis':axis,
            'industry_context':industry,'context_mapping':'PROPOSED_MAPPING' if mapped else 'NOT_MAPPED',
            'source_path':row['path'],'reading_check':reading,'practice_cases':visible,
            'board_observation':{k:row[k] for k in ['reported_status','reported_separation','measurement_time']},
            'source_read_at':registry['board_read_at'],'human_editor_review':'PENDING',
            'human_review_handoff':{'state':'NOT_SENT','named_recipient':None,'authenticated_receiver':False,
                'required':['named authenticated reviewer','accepted role and scope','case and source revisions','conflict/recusal handling','expiry and revocation','independent effect verification where action is involved']},
            'boundaries':_boundary()}

def _revision(expected,current,lesson=None):
    if not isinstance(expected,str) or not expected or (expected!=current and (lesson is None or expected!=lesson)):
        raise ValueError('Stale or missing lesson revision; reopen the lesson before submitting')

def reading_feedback(axis,industry,answer,registry_revision):
    """Check a reading answer against the pinned original Council module, without a POST.

    Args:
        axis: Canonical axis identifier.
        industry: Proposed educational context.
        answer: A, B, C or D for the displayed reading question.
        registry_revision: Exact revision returned by lesson_packet or learning_catalogue.
    """
    registry,cases,current,row,profile,mapped=_context(axis,industry);_revision(registry_revision,current,_scope_revision(registry,cases,row,industry))
    if not mapped:raise ValueError('Axis not mapped to this educational context')
    if type(answer) is not str or answer not in ['A','B','C','D']:raise ValueError('Answer must be A, B, C or D')
    correct=answer==row['reading_check']['correct_option']
    return {'state':'READING_CHECK_ONLY','axis':axis,'registry_revision':current,'correct':correct,
            'explanation':row['reading_check']['explanation'],'xp':0,
            'lesson_revision':_scope_revision(registry,cases,row,industry),
            'binding_kind':'SCOPED_LESSON' if registry_revision.startswith('lesson-v1:') else 'LEGACY_REGISTRY',
            'completed_on_public_hitl_ledger':False,'boundaries':_boundary()}

def practice_feedback(axis='claim-maintenance',industry='ai-software',attempts_json='[]',registry_revision=''):
    """Recompute local educational feedback from bounded synthetic attempt choices.

    Args:
        axis: Canonical axis identifier.
        industry: Proposed educational context.
        attempts_json: At most 20 objects containing exactly case_id, content_sha256 and answer. No names or reports.
        registry_revision: Exact lesson revision; corrections invalidate old attempts.
    """
    registry,cases,current,row,profile,mapped=_context(axis,industry);_revision(registry_revision,current,_scope_revision(registry,cases,row,industry))
    if not mapped:raise ValueError('Axis not mapped to this educational context')
    attempts=strict_json(attempts_json)
    if type(attempts) is not list or len(attempts)>20:raise ValueError('Expected at most 20 practice choices')
    available={c['id']:c for c in cases if axis in c['axes']};latest={};counts={}
    for a in attempts:
        if type(a) is not dict or set(a)!={'case_id','content_sha256','answer'}:raise ValueError('Unknown fields or missing practice binding')
        if not all(type(a[k]) is str for k in a):raise ValueError('Practice fields must be strings')
        if a['case_id'] not in available:raise ValueError('Case not applicable to selected axis')
        case=available[a['case_id']]
        if a['content_sha256']!=case['content_sha256']:raise ValueError('Practice revision changed; replay with current material')
        if a['answer'] not in case['options']:raise ValueError('Unknown answer choice')
        latest[a['case_id']]=a;counts[a['case_id']]=counts.get(a['case_id'],0)+1
    feedback=[];xp=0
    for case_id in sorted(latest):
        a=latest[case_id];c=available[case_id];ok=a['answer']==c['answer'];earned=c['xp_reward'] if ok else 0;xp+=earned
        feedback.append({'case_id':case_id,'content_sha256':c['content_sha256'],'correct':ok,'chosen_answer':a['answer'],
                         'explanation':c['explanation'],'xp_this_distinct_case':earned,'attempts_in_request':counts[case_id]})
    return {'state':'LOCAL_PRACTICE_FEEDBACK','axis':axis,'industry_context':industry,'registry_revision':current,
            'lesson_revision':_scope_revision(registry,cases,row,industry),
            'binding_kind':'SCOPED_LESSON' if registry_revision.startswith('lesson-v1:') else 'LEGACY_REGISTRY',
            'feedback':feedback,'distinct_attempted':len(latest),'input_attempts':len(attempts),'educational_xp':xp,
            'xp_rule':'10 per currently correct distinct synthetic case within this submitted history; not cumulative across accounts or sessions.',
            'orb_rank_awarded':None,'orb_bank_progress_changed':False,'replay_inflation_prevented_within_request':True,
            'self_reported_input_not_identity_or_learning_proof':True,
            'training_candidate':{'state':'HOLD_PENDING_SEPARATE_REVIEW','rows_exported_for_training':0,
                                  'practice_rows_are_not_sealed_evaluation_rows':True,'human_editor':None},
            'safe_followup':{'state':'LOCAL_UNSENT_DRAFT','source_revision':registry['safe']['source_revision'],
                             'disclosure':'SYNTHETIC_ONLY','external_contact_made':False},
            'ras_followup':{'state':'NO_ORDER_CREATED','request_submitted':False,'payment':False,
                            'required':'Named subject, question, scope, quote where relevant, explicit authorisation, retained result and delivery readback.'},
            'boundaries':_boundary()}

def correction_rehearsal(axis='claim-maintenance',industry='ai-software'):
    """Exercise a source correction through reading, practice and downstream review holds.

    Args:
        axis: Canonical axis identifier.
        industry: Proposed educational context.
    """
    registry,cases,rev,row,profile,mapped=_context(axis,industry)
    if not mapped:raise ValueError('Axis not mapped to this context')
    case=next(c for c in cases if c['id']=='xp-not-authority')
    attempt={'case_id':case['id'],'content_sha256':case['content_sha256'],'answer':case['answer']}
    first=practice_feedback(axis,industry,json.dumps([attempt]),rev)
    # Changed lesson identity is a negative-control argument, not a mutation of source files.
    rejected=False
    try:practice_feedback(axis,industry,json.dumps([attempt]),'0'*64)
    except ValueError:rejected=True
    return {'state':'SYNTHETIC_CORRECTION_REHEARSAL','axis':axis,'industry_context':industry,
            'initial_feedback_correct':first['feedback'][0]['correct'],'stale_revision_rejected':rejected,
            'chain':['source revision changes','linked lesson requires recheck','old practice binding cannot be reused','review draft must reference current source','model-training candidate remains held','new measurement remains a separate GSPC run'],
            'source_files_mutated':False,'human_review_performed':False,'training_candidates_admitted':0,'boundaries':_boundary()}
