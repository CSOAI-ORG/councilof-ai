"""Negative controls for the publication checker; not new model measurements."""
from pathlib import Path
import copy,csv,io,json,shutil,tempfile,unittest
import verify_publication as v
ROOT=Path(__file__).resolve().parent

class PublicationTests(unittest.TestCase):
    def setUp(self):
        self.summary=json.loads((ROOT/'results/summary.json').read_text())
        self.text=(ROOT/'results/history_totals.csv').read_text()
    def test_unchanged_publication(self):self.assertEqual(v.check_sources(ROOT)['history_rows'],36)
    def test_wrong_study(self):
        self.summary['study_id']='other'
        with self.assertRaisesRegex(v.Rejected,'WRONG_STUDY'):v.check_history(self.summary,self.text)
    def test_changed_denominator(self):
        self.summary['histories']=37
        with self.assertRaisesRegex(v.Rejected,'WRONG_COUNT'):v.check_history(self.summary,self.text)
    def test_booleans_are_not_counts(self):
        self.summary['histories']=True
        with self.assertRaisesRegex(v.Rejected,'WRONG_COUNT'):v.check_history(self.summary,self.text)
    def test_altered_total(self):
        self.summary['total_ms_including_setup'][0]['direct']+=1
        with self.assertRaisesRegex(v.Rejected,'TOTAL_MISMATCH'):v.check_history(self.summary,self.text)
    def test_altered_ratio(self):
        self.summary['conditional_4096_speed_ratios']['bypass_over_refresh']['ratio']=99
        with self.assertRaisesRegex(v.Rejected,'RATIO_MISMATCH'):v.check_history(self.summary,self.text)
    def test_duplicate_history(self):
        with self.assertRaisesRegex(v.Rejected,'DUPLICATE'):v.check_history(self.summary,self.text+self.text.splitlines()[1]+'\n')
    def test_missing_history(self):
        with self.assertRaisesRegex(v.Rejected,'MISSING_HISTORY'):v.check_history(self.summary,'\n'.join(self.text.splitlines()[:-1])+'\n')
    def test_negative_time(self):
        rows=list(csv.DictReader(io.StringIO(self.text)));rows[0]['direct_total_ns']='-1'
        out=io.StringIO();w=csv.DictWriter(out,fieldnames=rows[0].keys());w.writeheader();w.writerows(rows)
        with self.assertRaisesRegex(v.Rejected,'NEGATIVE_TIME'):v.check_history(self.summary,out.getvalue())
    def test_no_invented_authority(self):
        self.summary['gspc_admitted']=True
        with self.assertRaisesRegex(v.Rejected,'INVALID_SCOPE'):v.check_history(self.summary,self.text)
    def test_no_invented_energy(self):
        self.summary['energy']=0
        with self.assertRaisesRegex(v.Rejected,'UNMEASURED_COST'):v.check_history(self.summary,self.text)
    def test_no_zero_test_success(self):
        with self.assertRaisesRegex(v.Rejected,'INCOMPLETE_UNIT_SUITE'):v.check_suite({'discovered':0,'tests_run':0})
    def test_skips_do_not_count_as_passes(self):
        r={'discovered':49,'tests_run':49,'errors':0,'failures':0,'skipped':1,'expected_failures':0,'unexpected_successes':0}
        with self.assertRaisesRegex(v.Rejected,'UNIT_SUITE_NOT_CLEAN'):v.check_suite(r)
    def test_missing_result_fails(self):
        with tempfile.TemporaryDirectory() as d:
            with self.assertRaises(FileNotFoundError):v.check_replay(Path(d))
    def test_path_escape_refused(self):
        with self.assertRaisesRegex(v.Rejected,'UNSAFE_PATH'):v.local(ROOT,'../../secrets')
    def test_changed_code_refused(self):
        with tempfile.TemporaryDirectory() as d:
            root=Path(d)
            for n in (*v.INPUTS,'publication-pins.json'):
                p=root/n;p.parent.mkdir(parents=True,exist_ok=True);shutil.copyfile(ROOT/n,p)
            with (root/'run_experiment.py').open('a') as f:f.write('\n# changed\n')
            with self.assertRaisesRegex(v.Rejected,'INPUT_CHANGED'):v.check_sources(root)
    def test_replay_wrong_identity_refused(self):
        with self.assertRaisesRegex(v.Rejected,'REPLAY_IDENTITY'):v.check_report_identity({'protocol':{'identity':'other'}})
    def test_replay_wrong_source_refused(self):
        with self.assertRaisesRegex(v.Rejected,'REPLAY_SOURCE_PIN'):v.check_report_identity({'protocol':{'identity':v.STUDY,'baseline_sha256':'0'*64}})
    def test_replay_incomplete_summary_refused(self):
        p={'identity':v.STUDY,'baseline_sha256':self.summary['baseline_sha256'],
           'candidate_sha256':self.summary['candidate_sha256'],'runner_sha256':self.summary['runner_sha256'],
           'record_counts':list(v.SIZES),'arms':list(v.ARMS),'phases':list(v.PHASES),'histories_per_size':12,'sources_per_batch':16}
        with self.assertRaisesRegex(v.Rejected,'REPLAY_SUMMARY_COVERAGE'):v.check_report_identity({'protocol':p,'summary':[]})
    def test_existing_output_refused(self):
        with tempfile.TemporaryDirectory() as d:
            with self.assertRaisesRegex(v.Rejected,'OUTPUT_EXISTS'):v.replay(ROOT,Path(d))
    def test_output_inside_source_refused(self):
        with self.assertRaisesRegex(v.Rejected,'OUTPUT_INSIDE_SOURCE'):v.replay(ROOT,ROOT/'should-not-exist-publication-test')

if __name__=='__main__':unittest.main()
