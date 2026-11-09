"""Deliberately damaged copies must fail the existing reporter tests by assertion.
Does not modify the qualified implementation, sources, reports or schedules.
"""
from pathlib import Path
import tempfile,shutil,subprocess,sys,json,hashlib
ROOT=Path(__file__).parent
cases=[('tampered-history-accepted',"if previous.get('schema')!=SCHEMA or digest({k:v for k,v in previous.items() if k!='report_id'})!=previous.get('report_id'):","if previous.get('schema')!=SCHEMA:",'test_tampered_previous_report_refused'),('source-merge-is-deployment',"status='SOURCE_MERGED_NOT_DEPLOYMENT'","status='DEPLOYED'",'test_true_merge_only_means_source_merge')]
source=(ROOT/'evidence_review.py').read_text();results=[]
for name,old,new,test in cases:
 assert source.count(old)==1
 with tempfile.TemporaryDirectory(prefix='report-mutant-') as tmp:
  work=Path(tmp);(work/'evidence_review.py').write_text(source.replace(old,new))
  for f in ['review_page.py','test_evidence_review.py']:shutil.copy2(ROOT/f,work/f)
  p=subprocess.run([sys.executable,'-B','-m','unittest','test_evidence_review.ReviewTests.'+test],cwd=work,capture_output=True,text=True,timeout=15)
  text=p.stdout+p.stderr;detected=p.returncode==1 and 'FAIL:' in text and 'AssertionError' in text and 'ImportError' not in text
  results.append({'control':name,'detected_by_assertion':detected,'exit_code':p.returncode})
  if not detected:raise AssertionError(text)
assert (ROOT/'evidence_review.py').read_text()==source
report={'scope':'Disposable copies, no production mutation.','source_sha256':hashlib.sha256(source.encode()).hexdigest(),'results':results,'all_detected':all(x['detected_by_assertion'] for x in results)}
(ROOT/'evidence/report-negative-controls.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps(report,indent=2))
