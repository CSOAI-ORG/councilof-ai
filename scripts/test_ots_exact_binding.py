import hashlib,json,tempfile,unittest
from pathlib import Path
from ots_exact_binding import resolve_exact_binding
class BindingTest(unittest.TestCase):
 def setUp(self):
  self.tmp=tempfile.TemporaryDirectory();self.root=Path(self.tmp.name);(self.root/'interop').mkdir();self.proof=self.root/'renamed.ots';self.proof.write_bytes(b'fixture proof bytes; parser tested by release gate');self.target=self.root/'payload.json';self.target.write_bytes(b'{"fixture":true}')
  h=lambda p:hashlib.sha256(p.read_bytes()).hexdigest();self.doc={'schema':'csoai.ots-exact-byte-bindings/0.1','bindings':{'renamed.ots':{'target':'payload.json','digest':h(self.target),'proof_sha256':h(self.proof)}}};self.save()
 def save(self):(self.root/'interop/ots-exact-bindings-v1.json').write_text(json.dumps(self.doc))
 def tearDown(self):self.tmp.cleanup()
 def test_exact(self):self.assertEqual(resolve_exact_binding(self.root,self.proof)[1],'public/payload.json')
 def test_changed_target(self):
  self.target.write_text('{}')
  with self.assertRaises(ValueError):resolve_exact_binding(self.root,self.proof)
 def test_changed_proof(self):
  self.proof.write_bytes(b'changed')
  with self.assertRaises(ValueError):resolve_exact_binding(self.root,self.proof)
 def test_traversal(self):
  self.doc['bindings']['renamed.ots']['target']='../outside';self.save()
  with self.assertRaises(ValueError):resolve_exact_binding(self.root,self.proof)
 def test_missing(self):
  self.target.unlink()
  with self.assertRaises(ValueError):resolve_exact_binding(self.root,self.proof)
 def test_unknown_proof(self):
  self.doc['bindings']={};self.save();self.assertIsNone(resolve_exact_binding(self.root,self.proof))
 def test_wrong_schema(self):
  self.doc['schema']='bogus';self.save()
  with self.assertRaises(ValueError):resolve_exact_binding(self.root,self.proof)
 def test_symlink_target(self):
  self.target.unlink();self.target.symlink_to('/etc/hosts')
  with self.assertRaises(ValueError):resolve_exact_binding(self.root,self.proof)
if __name__=='__main__':unittest.main()
