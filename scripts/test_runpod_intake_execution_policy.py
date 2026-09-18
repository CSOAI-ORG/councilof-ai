"""Compatibility tests use the existing complete-run fixture and real intake."""
import json
from pathlib import Path
import tempfile
import unittest
from test_verify_runpod_gspc_intake import Fixture, intake

class ExecutionPolicyTests(unittest.TestCase):
    def setUp(self):
        self.temp=tempfile.TemporaryDirectory();self.f=Fixture(Path(self.temp.name).resolve())
    def tearDown(self):self.temp.cleanup()
    def invoke(self):return intake.verify_to_quarantine(self.f.source,self.f.allowlist,self.f.quarantine)
    def set_policy(self,value):
        self.f.run['execution_policy']=value;self.f.write_run()
    def valid_policy(self):return {'profile':'bounded-transport-v1','max_consecutive_transport_errors':3}
    def reject(self):
        with self.assertRaises(intake.IntakeError):self.invoke()
        self.assertFalse(self.f.quarantine.exists())
    def test_legacy_profile_remains_valid(self):
        _,v=self.invoke();self.assertEqual(v['state'],'VERIFIED_QUARANTINE')
    def test_supported_profile_preserves_raw_run_and_unsigned_candidate(self):
        self.set_policy(self.valid_policy());before=(self.f.source/'run.json').read_bytes()
        destination,v=self.invoke()
        self.assertEqual((destination/'run.json').read_bytes(),before)
        self.assertEqual((self.f.source/'run.json').read_bytes(),before)
        self.assertEqual(v['state'],'VERIFIED_QUARANTINE')
        self.assertIsNone(json.loads((destination/'candidate.json').read_text())['signature'])
    def test_unknown_profile(self):
        self.set_policy(dict(self.valid_policy(),profile='unreviewed'));self.reject()
    def test_unknown_limit(self):
        self.set_policy(dict(self.valid_policy(),max_consecutive_transport_errors=4));self.reject()
    def test_float_limit(self):
        self.set_policy(dict(self.valid_policy(),max_consecutive_transport_errors=3.0));self.reject()
    def test_boolean_limit(self):
        self.set_policy(dict(self.valid_policy(),max_consecutive_transport_errors=True));self.reject()
    def test_missing_limit(self):
        self.set_policy({'profile':'bounded-transport-v1'});self.reject()
    def test_extra_policy_field(self):
        self.set_policy(dict(self.valid_policy(),permit_errors=True));self.reject()
    def test_null_policy(self):self.set_policy(None);self.reject()
    def test_policy_does_not_hide_wrong_counts(self):
        self.set_policy(self.valid_policy());self.f.run['counts']['correct']=99;self.f.write_run();self.reject()
    def test_policy_does_not_admit_unknown_run_field(self):
        self.set_policy(self.valid_policy());self.f.run['unreviewed']=True;self.f.write_run();self.reject()
    def test_policy_does_not_admit_incomplete_run(self):
        self.set_policy(self.valid_policy());self.f.run['complete']=False;self.f.write_run();self.reject()

if __name__=='__main__':unittest.main()
