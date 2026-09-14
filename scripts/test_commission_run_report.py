import json
import tempfile
import unittest
from pathlib import Path
from commission_run_report import build, build_or_unavailable, health, main
class RunReportTests(unittest.TestCase):
    def test_staged_skip_other_axis_and_unobserved_remain_undelivered(self):
        with tempfile.TemporaryDirectory() as d:
            root=Path(d);(root/'unsigned-test.json').write_text('{}')
            feed={'schema':'csoai.commissions/0.1','status':'MEASURED','records_unreadable':0,'commissions':[{'subject':s,'axis':a,'receipt_sha':s} for s,a in [('a','governance'),('b',None),('c','safety'),('d',None)]]}
            report={'kind':'csoai.hub-queue-mill/0.1','axis':'governance','staged_unsigned':[{'id':'a','axis':'governance','card':'unsigned-test.json'}],'skips':[{'id':'b','axis':'governance','reason':'no provider'}]}
            rows=build(feed,report,root)['commissions']
            self.assertEqual([r['status'] for r in rows],['STAGED_UNSIGNED','SKIPPED_IN_RUN','OTHER_AXIS','NOT_OBSERVED_IN_RUN'])
            self.assertTrue(all(not r['delivered'] and not r['signed'] for r in rows))
            self.assertEqual(len(rows[0]['artifacts'][0]['sha256']),64)
            (root/'unsigned-test.json').unlink()
            with self.assertRaises(ValueError):build(feed,report,root)
    def test_unavailable_is_not_empty(self):
        with self.assertRaises(ValueError):build({'error':'not_found'},{},Path('.'))
    def test_unavailable_feed_warns_without_asserting_or_failing_the_run(self):
        report={'kind':'csoai.hub-queue-mill/0.1','axis':'safety','as_of':'2026-09-14T05:43:20Z','staged_unsigned':[]}
        value=build_or_unavailable({'error':'not_found'},report,Path('.'))
        self.assertEqual(value['status'],'UNAVAILABLE')
        self.assertIsNone(value['commissions'])
        self.assertFalse(value['fulfillment_asserted'])
        state=health({'error':'not_found'},'safety','AVAILABLE',1,'commission-queue')
        self.assertEqual(state['status'],'UNAVAILABLE')
        self.assertEqual(state['priority_status'],'AVAILABLE')
        self.assertEqual(state['report_feed_status'],'UNAVAILABLE')
        with tempfile.TemporaryDirectory() as d:
            root=Path(d);(root/'mill-report.json').write_text(json.dumps(report))
            self.assertEqual(main(['--feed',str(root/'absent.json'),'--mill',str(root)]),0)
            written=json.loads((root/'commission-run-report.json').read_text())
            self.assertEqual(written['status'],'UNAVAILABLE')
            self.assertFalse(written['fulfillment_asserted'])
            self.assertEqual(main(['--feed',str(root/'absent.json'),'--health-out',str(root/'health.json'),
                                   '--axis','safety','--priority-status','AVAILABLE','--priority-source','commission-queue',
                                   '--subject-count','1']),0)
            observed=json.loads((root/'health.json').read_text())
            self.assertEqual(observed['priority_status'],'AVAILABLE')
            self.assertEqual(observed['report_feed_status'],'UNAVAILABLE')
if __name__=='__main__':unittest.main()
