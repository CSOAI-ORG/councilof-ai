"""Run inside the existing HF lab snapshot, with the real canonical evidence builder."""
import json,unittest,copy
import learning_bridge as b
import learning_tools as t
from research_lab import components

class ToolTests(unittest.TestCase):
    def setUp(self):self.rev=b.learning_catalogue()['registry_revision']
    def verify(self,payload):
        d=copy.deepcopy(payload);event=d.pop('evidence_event');builder=components()[1]
        self.assertEqual(builder.validate(event),[])
        self.assertEqual(b.hashlib.sha256(builder.jcs(d)).hexdigest(),event['observed']['output_sha256'])
        self.assertEqual(event['state'],'PARTIAL');self.assertIsNone(event['signature'])
        self.assertIn('learning_bridge.py',d['implementation']['files_sha256'])
    def test_catalogue_actual_event(self):
        out=t.academy_catalogue();self.verify(out);self.assertEqual(out['canonical_axis_count'],34)
    def test_lesson_actual_event(self):
        out=t.academy_lesson();self.verify(out);self.assertFalse(any(out['boundaries'].values()))
    def test_reading_actual_event(self):
        reg,_,_=b._data();row=next(x for x in reg['rows'] if x['axis']=='claim-maintenance')
        out=t.academy_reading(answer=row['reading_check']['correct_option'],registry_revision=self.rev);self.verify(out);self.assertTrue(out['correct'])
    def test_attempt_actual_event(self):
        out=t.academy_attempt(answer='D',registry_revision=self.rev);self.verify(out);self.assertEqual(out['educational_xp'],10);self.assertFalse(out['boundaries']['external_action_authorised'])
    def test_correction_actual_event(self):
        out=t.academy_correction();self.verify(out);self.assertTrue(out['stale_revision_rejected'])
    def test_question_view_and_choice_binding(self):
        text,rev,packet=t.question_view('claim-maintenance','ai-software','xp-not-authority')
        self.assertIn('A.',text);self.assertIn('D.',text);self.assertEqual(rev,self.rev);self.assertEqual(json.loads(packet)['axis'],'claim-maintenance')
        self.assertNotIn('"answer":',packet)
    def test_unknown_case_and_revision_fail_before_event(self):
        for kwargs in [{'case_id':'not-a-case','registry_revision':self.rev},{'registry_revision':'0'*64},{'answer':True,'registry_revision':self.rev}]:
            with self.assertRaises(ValueError):t.academy_attempt(**kwargs)
    def test_tampered_output_is_detectable(self):
        out=t.academy_attempt(answer='D',registry_revision=self.rev);event=out.pop('evidence_event');out['educational_xp']=9999
        self.assertNotEqual(b.hashlib.sha256(components()[1].jcs(out)).hexdigest(),event['observed']['output_sha256'])

if __name__=='__main__':unittest.main(verbosity=2)
