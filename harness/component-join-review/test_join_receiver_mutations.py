"""Three receiver negative controls: intended assertions, never import failures."""
from pathlib import Path
import shutil,subprocess,sys,tempfile,unittest
ROOT=Path(__file__).resolve().parent
class ReceiverMutationTests(unittest.TestCase):
    def detected(self,filename,before,after,target):
        source=(ROOT/filename).read_text();self.assertEqual(source.count(before),1)
        with tempfile.TemporaryDirectory(prefix='receiver-control-') as d:
            base=Path(d);p=base/'harness/component-join-review';p.mkdir(parents=True)
            for name in ['join_contract.py','receive_artifacts.py','test_join_contract.py','test_join_receiver.py']:
                shutil.copyfile(ROOT/name,p/name)
            (p/filename).write_text(source.replace(before,after))
            e=base/'packages/evidence-fabric';e.mkdir(parents=True)
            shutil.copyfile(ROOT.parents[1]/'packages/evidence-fabric/event.py',e/'event.py')
            r=subprocess.run([sys.executable,'-B','-m','unittest','-v','test_join_receiver.ReceiverTests.'+target],cwd=p,capture_output=True,text=True,timeout=10)
        output=r.stdout+r.stderr
        self.assertNotEqual(r.returncode,0);self.assertIn('AssertionError',output)
        self.assertIn('FAILED (failures=1)',output);self.assertNotIn('ImportError',output);self.assertNotIn('SyntaxError',output)
    def test_checksum_bypass_is_detected(self):
        self.detected('receive_artifacts.py',"if actual != pin['result_sha256']:","if False:",'test_wrong_bytes_rejected')
    def test_shallow_context_is_detected(self):
        self.detected('join_contract.py',"'context':copy.deepcopy(context)","'context':dict(context)",'test_result_detached_from_context')
    def test_predicted_measurement_value_is_detected(self):
        self.detected('receive_artifacts.py',"state='PARTIAL', value=None,","state='PARTIAL', value=1.0,",'test_no_prediction_score_masquerading_as_measurement')
if __name__=='__main__':unittest.main(verbosity=2)
