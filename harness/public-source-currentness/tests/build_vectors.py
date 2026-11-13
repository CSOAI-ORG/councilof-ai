from pathlib import Path
import base64,copy,hashlib,json
R=Path(__file__).resolve().parents[1]
NOW=1794376800000
body=b'SYNTHETIC PUBLIC SOURCE - no model or private data\n'
lock={'target':'specialist-receiver','repository':'csoai/meok-oowm-hybrid-lab','path':'integration-specialist-review/join_assets/harness/component-join-review/receive_artifacts.py','approved_revision':'a'*40,'approved_sha256':hashlib.sha256(body).hexdigest(),'max_source_bytes':65536,'valid_until_ms':NOW+86400000}
head={'status':200,'revision':'a'*40,'redirected':False,'age_seconds':0}
obs={'started_ms':NOW-1000,'finished_ms':NOW,'before':copy.deepcopy(head),'source':{**head,'complete':True,'body_base64':base64.b64encode(body).decode()},'after':copy.deepcopy(head)}
rows=[]
def add(name,state,reason,change=None,lock_change=None,now=NOW):
 o=copy.deepcopy(obs);l=copy.deepcopy(lock)
 if change:change(o)
 if lock_change:lock_change(l)
 rows.append({'id':name,'lock':l,'observation':o,'now_ms':now,'expected_state':state,'expected_reason':reason})
def alter(path,value):
 def f(o):
  v=o
  for k in path[:-1]:v=v[k]
  v[path[-1]]=value
 return f
add('valid','MATCH_AT_OBSERVATION','APPROVED_BYTES_MATCH')
add('same_bytes_new_commit','MATCH_AT_OBSERVATION','APPROVED_BYTES_MATCH',lambda o:[o[x].update(revision='b'*40) for x in ['before','source','after']])
add('same_size_changed_bytes','HOLD','APPROVED_BYTES_CHANGED',alter(['source','body_base64'],base64.b64encode(body.replace(b'PUBLIC',b'PUBLIK')).decode()))
add('operator_pin_changed','HOLD','APPROVED_BYTES_CHANGED',lock_change=lambda l:l.update(approved_sha256='0'*64))
add('lock_expired','HOLD','OPERATOR_LOCK_EXPIRED',lock_change=lambda l:l.update(valid_until_ms=NOW-1))
add('lock_expiry_boundary','HOLD','OPERATOR_LOCK_EXPIRED',lock_change=lambda l:l.update(valid_until_ms=NOW))
add('head_moved','UNKNOWN','SOURCE_MOVED_DURING_READ',alter(['after','revision'],'b'*40))
add('wrong_snapshot_read','UNKNOWN','SOURCE_REVISION_MISMATCH',alter(['source','revision'],'c'*40))
for field in ['before','source','after']:
 for value in [403,404,429,500,True,'200',None]:
  add(field+'_status_'+str(value),'UNKNOWN','UPSTREAM_NOT_200',alter([field,'status'],value))
 add(field+'_cached','UNKNOWN','CACHED_OR_INVALID_AGE',alter([field,'age_seconds'],1))
 add(field+'_redirect','UNKNOWN','REDIRECT_OR_UNKNOWN_ROUTE',alter([field,'redirected'],True))
 add(field+'_unknown_route','UNKNOWN','REDIRECT_OR_UNKNOWN_ROUTE',alter([field,'redirected'],None))
 add(field+'_bad_revision','UNKNOWN','INVALID_UPSTREAM_REVISION',alter([field,'revision'],'latest'))
for v in [False,None,1,'true']:
 add('incomplete_'+str(v),'UNKNOWN','INCOMPLETE_SOURCE_BYTES',alter(['source','complete'],v))
add('empty_source','UNKNOWN','SOURCE_SIZE_BOUND',alter(['source','body_base64'],''))
add('over_source_bound','UNKNOWN','SOURCE_SIZE_BOUND',lock_change=lambda l:l.update(max_source_bytes=1))
add('bad_base64','UNKNOWN','INVALID_SOURCE_ENCODING',alter(['source','body_base64'],'%%%'))
add('base64_whitespace','UNKNOWN','INVALID_SOURCE_ENCODING',alter(['source','body_base64'],obs['source']['body_base64']+'\n'))
add('noncanonical_base64','UNKNOWN','INVALID_SOURCE_ENCODING',alter(['source','body_base64'],'YR=='))
add('slow_read','UNKNOWN','READ_DEADLINE_EXCEEDED',alter(['started_ms'],NOW-15001))
add('old_observation','UNKNOWN','OBSERVATION_TOO_OLD',now=NOW+5001)
add('future_finish','UNKNOWN','INVALID_OBSERVATION_CLOCK',alter(['finished_ms'],NOW+1))
add('reversed_clock','UNKNOWN','INVALID_OBSERVATION_CLOCK',alter(['started_ms'],NOW+1))
add('boolean_clock','UNKNOWN','INVALID_OBSERVATION_CLOCK',alter(['started_ms'],True))
add('missing_observation_part','UNKNOWN','INCOMPLETE_OBSERVATION',lambda o:o.pop('after'))
add('unknown_observation_field','UNKNOWN','INCOMPLETE_OBSERVATION',lambda o:o.update(authority=True))
add('null_observation_part','UNKNOWN','INCOMPLETE_OBSERVATION',alter(['after'],None))
for v in ['0',True,-1,1.5]:
 add('age_invalid_'+str(v),'UNKNOWN','CACHED_OR_INVALID_AGE',alter(['before','age_seconds'],v))
add('missing_age_header','MATCH_AT_OBSERVATION','APPROVED_BYTES_MATCH',lambda o:[o[x].pop('age_seconds') for x in ['before','source','after']])
# A header's absence is not treated as independent proof of freshness.
(R/'tests/vectors.json').write_text(json.dumps(rows,indent=2)+'\n')
print(len(rows),'contract vectors')
for part in ['before','source','after']:
 add(part+'_integral_numeric_status','MATCH_AT_OBSERVATION','APPROVED_BYTES_MATCH',alter([part,'status'],200.0))
 add(part+'_fractional_status','UNKNOWN','UPSTREAM_NOT_200',alter([part,'status'],200.5))
add('integral_numeric_clock','MATCH_AT_OBSERVATION','APPROVED_BYTES_MATCH',alter(['started_ms'],float(NOW-1000)))
add('integral_numeric_age','MATCH_AT_OBSERVATION','APPROVED_BYTES_MATCH',alter(['before','age_seconds'],0.0))
(R/'tests/vectors.json').write_text(json.dumps(rows,indent=2)+'\n')
print('final',len(rows),'contract vectors')
