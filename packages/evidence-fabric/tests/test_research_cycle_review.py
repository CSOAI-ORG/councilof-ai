import json, os, subprocess, sys, tempfile, unittest
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
import research_cycle as C

class ReviewRegressionTests(unittest.TestCase):
 def inputs(self,root,count=1):
  cat=root/'cat.json';obs=root/'obs.json'
  cat.write_text(json.dumps({'schema':'council.research-catalogue/1','records':[{'id':f'R{i}','repo':f'example/component{i}','commit':'a'*40,'runtime_status':'NOT_RUN'} for i in range(count)]}))
  obs.write_text('[]');return cat,obs
 def test_large_valid_cycle_packet_roundtrip(self):
  with tempfile.TemporaryDirectory() as d:
   root=Path(d);cat,obs=self.inputs(root,1500);r=C.build(cat,obs,root/'runs','2026-10-30T10:00:00Z')
   raw=C.encoded(C.packet(r['directory'],r['manifest_sha256']));self.assertGreater(len(raw),8_000_000)
   self.assertEqual(C.verify_packet(raw,r['manifest_sha256'])['events'],1500)
 def test_fifo_rejected_without_waiting_for_writer(self):
  for filename in ['manifest.json','catalogue.json']:
   with self.subTest(filename=filename),tempfile.TemporaryDirectory() as d:
    root=Path(d);cat,obs=self.inputs(root);r=C.build(cat,obs,root/'runs','2026-10-30T10:00:00Z')
    p=Path(r['directory'])/filename;p.unlink();os.mkfifo(p)
    try:
     out=subprocess.run([sys.executable,str(Path(C.__file__)),'verify',r['directory'],'--expected-manifest',r['manifest_sha256']],capture_output=True,text=True,timeout=2)
    except subprocess.TimeoutExpired:self.fail('verification blocked on FIFO before checking its file type')
    self.assertEqual(out.returncode,2);self.assertIn('regular bundle file',out.stderr)
 def test_aggregate_limit_enforced_before_creation(self):
  from unittest.mock import patch
  with tempfile.TemporaryDirectory() as d:
   root=Path(d);cat,obs=self.inputs(root)
   with patch.object(C,'MAX_PACKET_BYTES',1000):
    with self.assertRaisesRegex(ValueError,'aggregate packet'):C.build(cat,obs,root/'runs','2026-10-30T10:00:00Z')
   self.assertFalse((root/'runs').exists())
 def test_known_legacy_binding_rederives_with_current_code(self):
  with tempfile.TemporaryDirectory() as d:
   root=Path(d);cat,obs=self.inputs(root);r=C.build(cat,obs,root/'runs','2026-10-30T10:00:00Z')
   binding=C.parse(C.read_regular(r['directory'],'binding.json'));binding['implementation_pins']['research_cycle.py']=C.LEGACY_READER_SHA256
   out=C.derive(cat.read_bytes(),obs.read_bytes(),binding)
   self.assertEqual(out['events.jsonl'],C.read_regular(r['directory'],'events.jsonl'))
 def test_unknown_historical_reader_remains_rejected(self):
  with tempfile.TemporaryDirectory() as d:
   root=Path(d);cat,obs=self.inputs(root);r=C.build(cat,obs,root/'runs','2026-10-30T10:00:00Z')
   binding=C.parse(C.read_regular(r['directory'],'binding.json'));binding['implementation_pins']['research_cycle.py']='0'*64
   with self.assertRaisesRegex(ValueError,'reader revision'):C.derive(cat.read_bytes(),obs.read_bytes(),binding)

if __name__=='__main__':unittest.main(verbosity=2)
