"""Offline behavior checks; temporarily made files and worker database only."""
import concurrent.futures,json,os,sqlite3,subprocess,sys,tempfile,time,unittest,uuid
from pathlib import Path
try: import saved_result_round as m
except ModuleNotFoundError: import round as m
D=Path(__file__).parent
class WorkerCases(unittest.TestCase):
 def setUp(self):
  self.tmp=tempfile.TemporaryDirectory();self.addCleanup(self.tmp.cleanup);self.r=Path(self.tmp.name); self.f=self.r/'governance-card.json';self.f.write_bytes((D/'governance-card.json').read_bytes());self.now=int(time.time());self.j={'request_id':uuid.uuid4().hex,'nonce':uuid.uuid4().hex,'artifact':m.NAMED,'worker':m.WORKER,'expected_sha256':m.PIN,'expected_bytes':m.SIZE,'issued_s':self.now,'expires_s':self.now+m.TTL}
 def receive(self,reply,**opts):return m.receive(self.j,reply,self.f,transport_worker=opts.pop('transport_worker',m.WORKER),**opts)
 def test_same_bytes_match(self):self.assertTrue(self.receive(m.work(self.j,self.r))['worker_complete'])
 def test_replay_retains_not_fresh(self):
  a=m.work(self.j,self.r);b=m.work(self.j,self.r);self.assertEqual(a['receipt'],b['receipt']);self.assertTrue(self.receive(b)['replayed']);self.assertFalse(b['new_execution'])
 def test_rebound_id_refused(self):
  m.work(self.j,self.r)
  with self.assertRaisesRegex(m.Refusal,'rebound'):m.work({**self.j,'nonce':uuid.uuid4().hex},self.r)
 def test_concurrent_single_winner(self):
  with concurrent.futures.ThreadPoolExecutor(4) as pool: rows=list(pool.map(lambda _:m.work(self.j,self.r),range(4)))
  self.assertEqual(sum(r['new_execution'] for r in rows),1);self.assertEqual(len({m.digest(m.canonical(r['receipt'])) for r in rows}),1)
 def test_held_reservation_not_retried(self):
  m.work(self.j,self.r)
  with sqlite3.connect(self.r/'round.sqlite3') as db:db.execute('UPDATE results SET reply=NULL,checksum=NULL')
  self.assertEqual(self.receive(m.work(self.j,self.r))['state'],'OUTCOME_UNKNOWN')
 def test_corrupt_cached_reply_refused(self):
  m.work(self.j,self.r)
  with sqlite3.connect(self.r/'round.sqlite3') as db:db.execute("UPDATE results SET checksum='untrusted'")
  with self.assertRaisesRegex(m.Refusal,'damaged'):m.work(self.j,self.r)
 def test_expired_job_refused(self):
  with self.assertRaises(m.Refusal):m.validate(self.j,self.j['expires_s'])
 def test_future_job_refused(self):
  with self.assertRaises(m.Refusal):m.validate(self.j,self.now-1)
 def test_no_reply_retains_file(self):
  r=self.receive(None);self.assertTrue(r['saved_file_readable']);self.assertFalse(r['worker_complete'])
 def test_untrusted_transport_refused(self):
  with self.assertRaises(m.Refusal):self.receive(m.work(self.j,self.r),transport_worker='not-approved')
 def test_wrong_row_binding_refused(self):
  reply=m.work(self.j,self.r)
  for key,bad in [('worker','wrong'),('request_id','0'*32),('request_sha256','0'*64),('observed_s',self.now-1),('observed_sha256','0'*64),('bytes',True)]:
   with self.subTest(key=key), self.assertRaises(m.Refusal):self.receive({**reply,'receipt':{**reply['receipt'],key:bad}})
 def test_changed_worker_bytes_not_success(self):
  source=self.f.read_bytes();self.f.write_bytes(source+b' ');r=m.work(self.j,self.r);self.f.write_bytes(source);self.assertEqual(self.receive(r)['state'],'MISMATCH');self.assertFalse(self.receive(r)['worker_complete'])
 def test_no_follow_file_symlink(self):
  source=self.f.read_bytes();self.f.rename(self.r/'other');self.f.symlink_to(self.r/'other');r=m.work(self.j,self.r);self.f.unlink();self.f.write_bytes(source);self.assertEqual(self.receive(r)['state'],'UNREADABLE')
 def test_receiver_changed_copy_rejected(self):
  r=m.work(self.j,self.r);self.f.write_bytes(b'wrong')
  with self.assertRaisesRegex(m.Refusal,'receiver reference'):self.receive(r)
 def test_no_user_paths_or_capabilities(self):
  for new in [{'path':'../outside'},{'artifact':'../outside'},{'worker':'writer'},{'expected_sha256':'0'*64}]:
   with self.subTest(new=new),self.assertRaises(m.Refusal):m.work({**self.j,**new},self.r)
 def test_malformed_input_refused(self):
  with self.assertRaisesRegex(m.Refusal,'duplicate'):m.parse(b'{"worker":"one","worker":"two"}')
  with self.assertRaisesRegex(m.Refusal,'large'):m.parse(b'x'*16385)
if __name__=='__main__':unittest.main()
