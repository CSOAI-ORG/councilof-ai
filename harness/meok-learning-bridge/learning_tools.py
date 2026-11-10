"""Additive wrappers reusing the existing research evidence builder; no new server/store."""
from pathlib import Path
import hashlib,json
import learning_bridge as bridge

def _record(name,inputs,payload):
    from research_lab import record_call
    root=Path(__file__).parent
    payload['implementation']={'version':bridge.VERSION,'files_sha256':{n:hashlib.sha256((root/n).read_bytes()).hexdigest() for n in ['learning_bridge.py','learning_tools.py']},'assets_manifest_sha256':hashlib.sha256((root/'learning_assets/manifest.json').read_bytes()).hexdigest()}
    payload['evidence_event']=record_call('academy_'+name,inputs,payload.copy())
    return payload

def academy_catalogue(industry='all'):
    """Inspect existing axis paths, five MOOC references and proposed industry contexts.

    Args:
        industry: Exact educational context identifier, or all; not verified industry coverage.
    """
    return _record('catalogue',{'industry':industry},bridge.learning_catalogue(industry))

def academy_lesson(axis='claim-maintenance',industry='ai-software'):
    """Read the dated original five-stage path and linked synthetic exercises.

    Args:
        axis: Exact GSPC axis ID, as shown by academy_catalogue.
        industry: Proposed educational context ID, not an endorsement or industry audit.
    """
    return _record('lesson',{'axis':axis,'industry':industry},bridge.lesson_packet(axis,industry))

def academy_reading(axis='claim-maintenance',industry='ai-software',answer='A',registry_revision=''):
    """Check the displayed source-reading choice without recording a public HITL completion.

    Args:
        axis: Exact GSPC axis ID.
        industry: Proposed educational context ID.
        answer: A, B, C or D from the displayed original reading check.
        registry_revision: Exact revision returned by academy_lesson; stale revisions are rejected.
    """
    return _record('reading',{'axis':axis,'industry':industry,'answer':answer,'registry_revision':registry_revision},bridge.reading_feedback(axis,industry,answer,registry_revision))

def academy_attempt(axis='claim-maintenance',industry='ai-software',case_id='xp-not-authority',answer='A',registry_revision=''):
    """Evaluate one synthetic exercise. Points describe this attempt, not cumulative rank or authority.

    Args:
        axis: Exact GSPC axis ID.
        industry: Proposed educational context ID.
        case_id: Applicable original practice case, as returned by academy_lesson.
        answer: A, B, C or D from the displayed practice options.
        registry_revision: Exact version displayed with the exercise; no implicit refresh.
    """
    packet=bridge.lesson_packet(axis,industry)
    bridge._revision(registry_revision,packet['registry_revision'])
    choices=[c for c in packet['practice_cases'] if c['id']==case_id]
    if len(choices)!=1:raise ValueError('No applicable practice case with this identity')
    attempt={'case_id':case_id,'content_sha256':choices[0]['content_sha256'],'answer':answer}
    out=bridge.practice_feedback(axis,industry,json.dumps([attempt]),registry_revision)
    out['score_scope']='THIS_ATTEMPT_ONLY_NOT_CUMULATIVE_ORB_RANK'
    return _record('attempt',{'axis':axis,'industry':industry,**attempt,'registry_revision':registry_revision},out)

def academy_correction(axis='claim-maintenance',industry='ai-software'):
    """Run the bounded synthetic source-correction and held-training chain.

    Args:
        axis: Exact GSPC axis ID.
        industry: Proposed educational context ID.
    """
    return _record('correction',{'axis':axis,'industry':industry},bridge.correction_rehearsal(axis,industry))

def question_view(axis,industry,case_id):
    """UI-only projection; returned text is source-owned, not arbitrary report input."""
    packet=bridge.lesson_packet(axis,industry)
    if packet['context_mapping']!='PROPOSED_MAPPING':raise ValueError('Axis is not mapped to this educational context')
    matches=[c for c in packet['practice_cases'] if c['id']==case_id]
    if len(matches)!=1:raise ValueError('This exercise is not mapped to the selected axis; choose xp-not-authority for the cross-cutting exercise')
    case=matches[0]
    body=case['title']+'\n\n'+case['facts']+'\n\n'+case['question']+'\n\n'+'\n'.join(k+'. '+v for k,v in case['options'].items())
    return body,packet['registry_revision'],json.dumps(packet,sort_keys=True,indent=2,ensure_ascii=False)
