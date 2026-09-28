import copy,hashlib,importlib.util,json,tempfile,unittest
from pathlib import Path
p=Path(__file__).with_name('root-witness-release-gate.py');spec=importlib.util.spec_from_file_location('gate',p);g=importlib.util.module_from_spec(spec);spec.loader.exec_module(g)
class Tests(unittest.TestCase):
 def setUp(self):
  self.t=tempfile.TemporaryDirectory();self.p=Path(self.t.name);g.configure_public_dir(self.p);(self.p/'interop').mkdir();self.proof=self.p/'interop/a.ots';self.proof.write_bytes(b'synthetic proof');self.target=self.p/'interop/a.body';self.target.write_bytes(b'exact retained bytes');self.digest=g.sha256(self.target.read_bytes());self.row={'digest':self.digest,'proof_sha256':g.sha256(self.proof.read_bytes()),'target':'interop/a.body'};self.index={'schema':'csoai.ots-exact-byte-bindings/0.1','bindings':{'interop/a.ots':self.row}}
 def tearDown(self):self.t.cleanup()
 def check(self):return g.exact_retained_binding(self.proof,self.digest,self.index)
 def test_exact_bytes(self):self.assertEqual(self.check()[0],self.digest)
 def test_no_entry_no_override(self):self.index['bindings']={};self.assertIsNone(self.check())
 def test_target_tamper(self):
  self.target.write_bytes(b'wrong')
  with self.assertRaises(ValueError):self.check()
 def test_proof_tamper(self):
  self.proof.write_bytes(b'wrong')
  with self.assertRaises(ValueError):self.check()
 def test_wrong_declared_digest(self):
  self.row['digest']='0'*64
  with self.assertRaises(ValueError):self.check()
 def test_missing_target(self):
  self.target.unlink()
  with self.assertRaises(ValueError):self.check()
 def test_traversal(self):
  self.row['target']='../a'
  with self.assertRaises(ValueError):self.check()
 def test_absolute(self):
  self.row['target']=str(self.target)
  with self.assertRaises(ValueError):self.check()
 def test_symlink(self):
  q=self.p/'interop/link';q.symlink_to(self.target);self.row['target']='interop/link'
  with self.assertRaises(ValueError):self.check()
 def test_wrong_schema(self):
  self.index['schema']='fake'
  with self.assertRaises(ValueError):self.check()
 def test_key_scope(self):self.index['bindings']={'interop/b.ots':self.row};self.assertIsNone(self.check())
 def test_declared_match_not_enough(self):
  self.row['target']='interop/other';(self.p/'interop/other').write_bytes(b'a digest declaration is not evidence')
  with self.assertRaises(ValueError):self.check()
if __name__=='__main__':unittest.main(verbosity=2)
