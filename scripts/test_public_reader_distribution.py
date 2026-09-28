import importlib.util,json,os,pathlib,shutil,sys,tempfile,types,unittest
from unittest.mock import patch
ROOT=pathlib.Path(__file__).resolve().parents[1]
class Tests(unittest.TestCase):
 def setUp(self):
  self.t=tempfile.TemporaryDirectory();self.base=pathlib.Path(self.t.name);self.repo=self.base/'repo';self.repo.mkdir();shutil.copytree(ROOT/'public',self.repo/'public');(self.repo/'scripts').mkdir();p=self.repo/'scripts/mirror_to_hf.py';shutil.copy2(ROOT/'scripts/mirror_to_hf.py',p)
  spec=importlib.util.spec_from_file_location('tested_mirror',p);self.m=importlib.util.module_from_spec(spec);spec.loader.exec_module(self.m);self.destination=self.base/'output';self.destination.mkdir();self.network=[]
  class FakeApi:
   def __init__(api,token):pass
   def create_repo(api,*a,**k):raise AssertionError('No external repo write in test')
   def upload_folder(api,**k):raise AssertionError('No external upload in test')
  self.hf=types.SimpleNamespace(HfApi=FakeApi)
 def tearDown(self):self.t.cleanup()
 def build(self):
  with patch.dict(sys.modules,{'huggingface_hub':self.hf}),patch.dict(os.environ,{'HF_TOKEN':'synthetic-test-only'}),patch.object(sys,'argv',['mirror','--dry-run']),patch.object(self.m,'plain_client_status',return_value=200),patch.object(self.m,'fetch',return_value=(b'{"synthetic":true}',200)),patch('tempfile.mkdtemp',return_value=str(self.destination)):
   return self.m.main()
 def test_readme_from_owned_template(self):
  self.assertEqual(self.build(),0);self.assertEqual((self.destination/'README.md').read_bytes(),(self.repo/'public/consumer-kit/v1/MIRROR_README.md').read_bytes())
 def test_kit_and_manifest_distributed_together(self):
  self.build();kit=self.destination/'consumer-kit/v1';m=json.loads((kit/'manifest.json').read_text());self.assertEqual(len(m['files']),6)
  for n,v in m['files'].items():self.assertEqual(self.m.hashlib.sha256((kit/n).read_bytes()).hexdigest(),v['sha256'])
 def test_tampered_reader_blocks(self):
  (self.repo/'public/consumer-kit/v1/csoai_read.py').write_text('tampered')
  with self.assertRaises(ValueError):self.build()
 def test_unexpected_kit_member_blocks(self):
  p=self.repo/'public/consumer-kit/v1/manifest.json';d=json.loads(p.read_text());d['files']['../unowned']={};p.write_text(json.dumps(d))
  with self.assertRaises(ValueError):self.build()
 def test_honest_client_identity(self):self.assertTrue(self.m.UA['User-Agent'].startswith('CSOAI-Public-Mirror/'));self.assertNotIn('Mozilla',self.m.UA['User-Agent'])
 def test_notebook_embeds_exact_client(self):
  kit=self.repo/'public/consumer-kit/v1';n=json.loads((kit/'public_evidence_walkthrough.ipynb').read_text());s=(kit/'csoai_read.py').read_text();self.assertEqual(''.join(n['cells'][1]['source']),s.split("if __name__ == '__main__':")[0]);self.assertFalse(n['metadata']['csoai']['gpu_required'])
if __name__=='__main__':unittest.main(verbosity=2)
