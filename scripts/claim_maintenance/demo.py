"""One deliberately synthetic source -> interpretation -> check -> report -> surface chain."""
from pathlib import Path
import json
import claim_maintenance as cm
NOW='2026-09-19T03:00:00Z'
g=cm.ClaimGraph()
ids={}
for kind,subject in [('source','source-v1'),('claim','claim-v1'),('interpretation','control-mapping'),('instrument','check'),('run','retained-run'),('surface','public-summary')]:
    ids[subject]=g.put(kind=kind,subject=subject,source_uri='urn:synthetic:'+subject,
        source_sha256=cm.digest(subject.encode()),observed_at=NOW,
        visibility='public',content={'fixture':True,'no_real_subject':True})
for dep,src in [('claim-v1','source-v1'),('control-mapping','claim-v1'),('check','control-mapping'),('retained-run','check'),('public-summary','retained-run')]:
    g.link(ids[dep],'derived_from',ids[src],evidence_sha256=cm.digest(b'fixture-edge'),recorded_at=NOW,basis='operator_reviewed')
out={'scenario':'SYNTHETIC SOURCE CORRECTION IMPACT; NO REAL REGULATORY OR SECURITY FINDING',
     'impact':g.impact(ids['source-v1'],known_at=NOW,public_only=True),
     'graph':g.export(public_only=True),'execution_authorized':False}
Path('DEMO.json').write_text(json.dumps(out,indent=2)+'\n')
Path('DEMO.html').write_text(cm.render_report(out))
Path('DEMO.prov.jsonld').write_text(json.dumps(g.prov_export(),indent=2)+'\n')
print(json.dumps({'synthetic_nodes':len(g.export()['nodes']),'reassessment_candidates':len(out['impact']['impacted']),'production_changes':0}))
