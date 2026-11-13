"""Compare old global revision rejection with dependency-scoped lesson rejection.
This measures contract decisions on synthetic corrections, not learning gains or latency.
"""
import copy,json,hashlib
from unittest.mock import patch
from pathlib import Path
import learning_bridge as b

def run():
    registry,cases,global_rev=b._data();pairs=[(r,p) for r in registry['rows'] for p,v in registry['industry_profiles'].items() if r['axis'] in v['axes']]
    records=[]
    for name in ['instructions-case-corrected','safety-row-corrected','finance-context-corrected','SAFE-source-revised','retrieval-time-only']:
        r=copy.deepcopy(registry);c=copy.deepcopy(cases)
        if name=='instructions-case-corrected':next(x for x in c if x['id']=='scope-assumption')['facts']+=' CORRECTED TEST FIXTURE'
        if name=='safety-row-corrected':next(x for x in r['rows'] if x['axis']=='safety')['task']+=' CORRECTED TEST FIXTURE'
        if name=='finance-context-corrected':r['industry_profiles']['finance-legacy']['title']+=' CORRECTED TEST FIXTURE'
        if name=='SAFE-source-revised':r['safe']['source_revision']='0'*40
        if name=='retrieval-time-only':r['board_read_at']='2099-01-01T00:00:00Z'
        rowmap={x['axis']:x for x in r['rows']}
        changed_axes=set(next(x for x in cases if x['id']=='scope-assumption')['axes'])
        for original,industry in pairs:
            axis=original['axis'];before=b._scope_revision(registry,cases,original,industry)
            after=b._scope_revision(r,c,rowmap[axis],industry)
            expected=(axis in changed_axes if name=='instructions-case-corrected' else axis=='safety' if name=='safety-row-corrected' else industry=='finance-legacy' if name=='finance-context-corrected' else name=='SAFE-source-revised')
            # This expectation uses declared mapping sets, not the digest implementation.
            changed=before!=after;assert changed==expected,(name,axis,industry)
            with patch.object(b,'_data',return_value=(r,c,'f'*64)):
                answer=original['reading_check']['correct_option']
                try:b.reading_feedback(axis,industry,answer,before);scoped_rejected=False
                except ValueError:scoped_rejected=True
                try:b.reading_feedback(axis,industry,answer,global_rev);global_rejected=False
                except ValueError:global_rejected=True
            assert scoped_rejected==expected and global_rejected
            records.append({'mutation':name,'axis':axis,'industry':industry,'dependent_change_expected':expected,'global_binding_rejected':global_rejected,'scoped_binding_rejected':scoped_rejected})
    summary=[]
    for name in sorted({x['mutation'] for x in records}):
        rows=[x for x in records if x['mutation']==name]
        summary.append({'mutation':name,'pairs':len(rows),'global_rejections':sum(x['global_binding_rejected'] for x in rows),'scoped_rejections':sum(x['scoped_binding_rejected'] for x in rows),'unchanged_lesson_bindings_preserved':sum(not x['scoped_binding_rejected'] for x in rows),'missed_relevant_invalidations':sum(x['dependent_change_expected'] and not x['scoped_binding_rejected'] for x in rows)})
    return {'state':'SYNTHETIC_CORRECTION_MATRIX_PASSED','mapped_contexts':len(pairs),'mutations':5,'checks':len(records),'summary':summary,'records':records,'real_source_mutations':0,'human_trials':0,'gspc_admitted':False,'model_weights_changed':False,'boundary':'A lesson binding is not a credential; current access and action authority are separate. Outcomes are limited to this declared dependency map.'}

if __name__=='__main__':
    report=run();Path('correction-matrix.json').write_text(json.dumps(report,indent=2)+'\n')
    print(json.dumps({k:v for k,v in report.items() if k!='records'}),flush=True)
