import copy
from datetime import datetime, timedelta, timezone
import json
from pathlib import Path
import subprocess
import tempfile
from types import SimpleNamespace
import unittest
from unittest.mock import patch
import observe
import worker_quality_bridge as bridge
import test_worker_quality_report as fixtures


def report():
    return {'schema': 'csoai.worker-quality-readback/1',
        'observed_at': datetime.now(timezone.utc).isoformat(), 'state': 'REVIEW_REQUIRED',
        'alerts': ['UNPARSED_COMPLETIONS_REQUIRE_REPAIR'], 'errors': [],
        'mutations': False, 'new_inference': False,
        'window': {'verified_run_records': 3, 'scoreable_candidates': 2,
            'quality_counts': {'FULLY_GRADED_CANDIDATE': 1, 'PARTLY_GRADED_CANDIDATE': 1, 'NO_GRADED_OUTPUT': 1},
            'unparsed_by_model': {'fixture': 1}, 'admitted': None, 'published': None},
        'schedule': {'jobs': 3, 'cadence_state': 'WAITING_UNTIL_DUE', 'next_due_estimate': None},
        'process': {'reported_state': 'WAITING', 'reported_completed_counter': 500}}


class SummaryTests(unittest.TestCase):
    def summary(self, r):
        return bridge.summarize(r, datetime.now(timezone.utc))
    def test_counts_not_lifetime_counter(self):
        self.assertEqual(self.summary(report())['verified_run_records'], 3)
    def test_unknown_admission_stays_unknown(self):
        s = self.summary(report()); self.assertIsNone(s['admitted']); self.assertIsNone(s['published'])
    def test_boolean_count_rejected(self):
        r=report(); r['window']['scoreable_candidates']=True
        with self.assertRaises(ValueError): self.summary(r)
    def test_wrong_total_rejected(self):
        r=report(); r['window']['verified_run_records']=99
        with self.assertRaises(ValueError): self.summary(r)
    def test_wrong_scoreable_rejected(self):
        r=report(); r['window']['scoreable_candidates']=3
        with self.assertRaises(ValueError): self.summary(r)
    def test_stale_report_rejected(self):
        r=report(); r['observed_at']=(datetime.now(timezone.utc)-timedelta(hours=1)).isoformat()
        with self.assertRaises(ValueError): self.summary(r)
    def test_future_report_rejected(self):
        r=report(); r['observed_at']=(datetime.now(timezone.utc)+timedelta(hours=1)).isoformat()
        with self.assertRaises(ValueError): self.summary(r)
    def test_invented_admission_rejected(self):
        r=report(); r['window']['admitted']=3
        with self.assertRaises(ValueError): self.summary(r)
    def test_unknown_class_rejected(self):
        r=report(); r['window']['quality_counts']={'CERTIFIED':3}
        with self.assertRaises(ValueError): self.summary(r)
    def test_errors_cannot_be_green(self):
        r=report(); r['errors']=[{'error':'fixture'}]; r['alerts']=[]
        self.assertIn('INCOMPLETE_OR_INVALID_AUDIT',self.summary(r)['alerts'])
    def test_contradictory_cannot_be_green(self):
        r=report(); r['window']['quality_counts']={'CONTRADICTORY_METADATA':3}; r['window']['scoreable_candidates']=0; r['alerts']=[]
        self.assertIn('RUN_METADATA_OR_COMPLETION_REQUIRES_REVIEW',self.summary(r)['alerts'])
    def test_raw_report_not_mutated(self):
        r=report(); before=copy.deepcopy(r); self.summary(r); self.assertEqual(r,before)


class CollectorTests(unittest.TestCase):
    def setUp(self):
        self.tmp=tempfile.TemporaryDirectory(); self.root=Path(self.tmp.name)
        (self.root/'state').mkdir(); (self.root/'jobs').mkdir()
        (self.root/'state/health.json').write_text(json.dumps({'config_dir':str(self.root/'jobs')}))
    def tearDown(self): self.tmp.cleanup()
    def collect(self): return bridge.collect(self.root,self.root,timeout=2)
    def emit(self, payload=None, code=1):
        raw=json.dumps(payload if payload is not None else report()).encode()
        def run(command, **kwargs):
            self.assertEqual(kwargs['timeout'],2); self.assertEqual(command[0],bridge.sys.executable)
            self.assertEqual(command[-2:],['--hours','24'])
            self.assertNotIn('TEST_SECRET',kwargs['env'])
            kwargs['stdout'].write(raw); return SimpleNamespace(returncode=code)
        return run
    def test_valid_report_preserved(self):
        with patch('worker_quality_bridge.subprocess.run',side_effect=self.emit()), patch.dict('os.environ',{'TEST_SECRET':'fixture'}):
            detail,s=self.collect()
        self.assertEqual(s['scoreable_candidates'],2); self.assertEqual(s['process_exit_code'],1)
    def test_timeout_unknown_not_zero(self):
        with patch('worker_quality_bridge.subprocess.run',side_effect=subprocess.TimeoutExpired('fixture',2)):
            _,s=self.collect()
        self.assertIsNone(s['scoreable_candidates']); self.assertEqual(s['error_code'],'QUALITY_READ_TIMEOUT')
    def test_missing_health_unknown(self):
        (self.root/'state/health.json').unlink()
        _,s=self.collect(); self.assertIsNone(s['verified_run_records'])
    def test_outside_config_rejected_before_process(self):
        (self.root/'state/health.json').write_text(json.dumps({'config_dir':'/unapproved-fixture'}))
        with patch('worker_quality_bridge.subprocess.run') as run:
            _,s=self.collect(); run.assert_not_called()
        self.assertEqual(s['state'],'UNCHECKABLE')
    def test_nonobject_report_rejected(self):
        with patch('worker_quality_bridge.subprocess.run',side_effect=self.emit([])):
            _,s=self.collect()
        self.assertEqual(s['state'],'UNCHECKABLE')
    def test_failed_process_rejected(self):
        with patch('worker_quality_bridge.subprocess.run',side_effect=self.emit(code=9)):
            _,s=self.collect()
        self.assertEqual(s['state'],'UNCHECKABLE')
    def test_exit_two_cannot_pretend_success(self):
        with patch('worker_quality_bridge.subprocess.run',side_effect=self.emit(code=2)):
            _,s=self.collect()
        self.assertEqual(s['state'],'UNCHECKABLE')

    def test_missing_config_uses_unique_live_process(self):
        (self.root/'state/health.json').write_text(json.dumps({'state':'WAITING'}))
        with patch('worker_quality_bridge.config_dir_from_process',return_value=self.root/'jobs') as active, patch('worker_quality_bridge.subprocess.run',side_effect=self.emit()):
            _,s=self.collect()
        active.assert_called_once_with(self.root,self.root/'state')
        self.assertEqual(s['verified_run_records'],3)

    def test_missing_config_without_process_stays_unknown(self):
        (self.root/'state/health.json').write_text(json.dumps({'state':'WAITING'}))
        with patch('worker_quality_bridge.config_dir_from_process',side_effect=ValueError('QUALITY_WORKER_PROCESS_NOT_UNIQUE')):
            _,s=self.collect()
        self.assertEqual(s['state'],'UNCHECKABLE')

    def test_process_directory_comes_from_matching_worker(self):
        proc=self.root/'proc'; (proc/'123').mkdir(parents=True)
        script=self.root/'releases/r/scripts/runpod_gspc_worker.py'
        script.parent.mkdir(parents=True); script.write_text('')
        (proc/'123/cmdline').write_bytes(b'\0'.join(map(str.encode,[
            'python3',str(script),'--config-dir',str(self.root/'jobs'),
            '--state-dir',str(self.root/'state'),'--forever']))+b'\0')
        self.assertEqual(bridge.config_dir_from_process(self.root,self.root/'state',proc),self.root/'jobs')
        (proc/'124').mkdir(); (proc/'124/cmdline').write_bytes((proc/'123/cmdline').read_bytes())
        with self.assertRaisesRegex(ValueError,'NOT_UNIQUE'):
            bridge.config_dir_from_process(self.root,self.root/'state',proc)


class ObserverIntegrationTests(unittest.TestCase):
    def run_observer(self, mill=True, failed=False):
        self.tmp=tempfile.TemporaryDirectory(); self.addCleanup(self.tmp.cleanup)
        self.state=Path(self.tmp.name); detail=report()
        summary=bridge.summarize(detail,datetime.now(timezone.utc))
        if failed:
            summary={'state':'UNCHECKABLE','verified_run_records':None,'scoreable_candidates':None,'quality_counts':None,
                'admitted':None,'published':None,'alerts':['WORKER_QUALITY_UNCHECKABLE']}
        response={'status':'OBSERVED','data':{},'observed_at':datetime.now(timezone.utc).isoformat()}
        with patch('observe.fetch',return_value=response), patch('observe.shutil.disk_usage',return_value=SimpleNamespace(total=100*1024**3,free=50*1024**3,used=50*1024**3)), patch('worker_quality_bridge.collect',return_value=(detail,summary)) as call:
            result=observe.run(self.state,{'period':{},'sources':[],'events':[]},mill=mill)
        return result,call
    def test_mill_invokes_quality_once(self):
        _,call=self.run_observer(); self.assertEqual(call.call_count,1)
    def test_nonmill_does_not_read_worker(self):
        result,call=self.run_observer(False); call.assert_not_called(); self.assertIsNone(result.get('worker_quality'))
    def test_quality_alert_reaches_main_report(self):
        result,_=self.run_observer()
        self.assertIn('worker-quality:UNPARSED_COMPLETIONS_REQUIRE_REPAIR',[a['id'] for a in result['alerts']])
    def test_quality_raw_record_written(self):
        self.run_observer(); self.assertTrue((self.state/'raw/worker-quality.json').is_file())
    def test_dashboard_contains_counts_and_limits(self):
        self.run_observer(); text=(self.state/'DASHBOARD.md').read_text()
        self.assertIn('Worker output quality',text); self.assertIn('Fully graded candidates: 1',text)
        self.assertIn('Admission and publication: not established',text)
    def test_quality_failure_does_not_block_other_observations(self):
        result,_=self.run_observer(failed=True)
        self.assertIn('revenue',result); self.assertIsNone(result['worker_quality']['scoreable_candidates'])
        self.assertIn('worker-quality:WORKER_QUALITY_UNCHECKABLE',[a['id'] for a in result['alerts']])
    def test_history_keeps_summary_not_bulk_run_records(self):
        result,_=self.run_observer(); self.assertNotIn('runs',result['worker_quality'])
        self.assertEqual(json.loads((self.state/'latest.json').read_text())['worker_quality']['verified_run_records'],3)


class CompletionAuditTests(unittest.TestCase):
    def test_contradictory_metadata_alert(self):
        case=fixtures.AuditTests(); case.setUp()
        try:
            case.run['counts']['correct']=99; case.save()
            self.assertIn('RUN_METADATA_OR_COMPLETION_REQUIRES_REVIEW',case.report()['alerts'])
        finally: case.tearDown()
    def test_incomplete_completion_alert(self):
        case=fixtures.AuditTests(); case.setUp()
        try:
            case.run['complete']=False; case.save()
            self.assertIn('RUN_METADATA_OR_COMPLETION_REQUIRES_REVIEW',case.report()['alerts'])
        finally: case.tearDown()


if __name__=='__main__': unittest.main()
