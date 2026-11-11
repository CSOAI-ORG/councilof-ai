"""Deliberately weakened temporary copies must fail the intended contract assertion."""
from pathlib import Path
import shutil, subprocess, sys, tempfile, unittest
ROOT=Path(__file__).resolve().parent
class MutationTests(unittest.TestCase):
 def detected(self, before, after, case):
  source=(ROOT/'join_contract.py').read_text()
  self.assertEqual(source.count(before),1)
  with tempfile.TemporaryDirectory(prefix='join-control-') as d:
   p=Path(d);(p/'join_contract.py').write_text(source.replace(before,after))
   shutil.copyfile(ROOT/'test_join_contract.py',p/'test_join_contract.py')
   r=subprocess.run([sys.executable,'-B','-m','unittest','-v','test_join_contract.JoinTests.'+case],cwd=p,capture_output=True,text=True,timeout=10)
  out=r.stdout+r.stderr
  self.assertNotEqual(r.returncode,0);self.assertIn('AssertionError',out)
  self.assertIn('FAILED (failures=1)',out);self.assertNotIn('ImportError',out);self.assertNotIn('SyntaxError',out)
 def test_truthy_dependency_mutant(self):
  self.detected("if r['dependencies_complete'] is not True:","if not r['dependencies_complete']:",'test_integer_complete')
 def test_label_alignment_mutant(self):
  self.detected('if r[k]!=v:',"if k!='label_schema' and r[k]!=v:",'test_reordered_labels')
 def test_authority_mutant(self):
  self.detected("'authorises_execution':False","'authorises_execution':True",'test_no_authority')
if __name__=='__main__':unittest.main(verbosity=2)
