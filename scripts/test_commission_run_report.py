import tempfile
import unittest
from pathlib import Path
from commission_run_report import build
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
if __name__=='__main__':unittest.main()
