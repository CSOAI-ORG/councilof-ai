"""Offline replay of an already published self-test receipt. No new signature or payment."""
import argparse,base64,contextlib,copy,importlib.util,io,json,subprocess,sys,tempfile,unittest
from pathlib import Path
from unittest.mock import patch
ROOT=Path(__file__).resolve().parents[1]
SPEC=importlib.util.spec_from_file_location('public_receipt_checker',ROOT/'public/verifier/verify_receipt.py')
VERIFIER=importlib.util.module_from_spec(SPEC);SPEC.loader.exec_module(VERIFIER)
FIXTURE=ROOT/'public/interop/x402-self-settlement-2026-09-11.json';DID=ROOT/'public/.well-known/did.json'
def b64(o):return base64.urlsafe_b64encode(json.dumps(o,separators=(',',':')).encode()).decode().rstrip('=')
class Tests(unittest.TestCase):
 def setUp(self):
  self.receipt=json.loads(FIXTURE.read_text());self.token=self.receipt['server_receipt']['jws'];self.doc=json.loads(DID.read_text());self.args=argparse.Namespace(did='retained-local-key-document',check_chain=False,rpc='UNUSED')
 def call(self,token=None,doc=None):
  out=io.StringIO()
  with patch.object(VERIFIER,'fetch_json',side_effect=AssertionError('network not allowed')),patch.object(VERIFIER,'tx_exists',side_effect=AssertionError('chain not requested')),contextlib.redirect_stdout(out):
   rc=VERIFIER.verify_one(token or self.token,self.doc if doc is None else doc,self.args)
  return rc,out.getvalue()
 def test_exact_source_copy(self):self.assertEqual((ROOT/'scripts/verify_receipt.py').read_bytes(),(ROOT/'public/verifier/verify_receipt.py').read_bytes())
 def test_original_retained_receipt(self):
  rc,out=self.call();self.assertEqual(rc,0);self.assertIn('VALID    receipt',out);self.assertIn('chain      UNCHECKED',out)
 def test_fixture_is_self_test_not_customer(self):self.assertEqual(self.receipt['classification'],'INTERNAL_SELF_FUNDED')
 def test_signature_tamper_rejected(self):
  parts=self.token.split('.');sig=bytearray(VERIFIER.b64url_decode(parts[2]));sig[0]^=1;parts[2]=base64.urlsafe_b64encode(sig).decode().rstrip('=');self.assertEqual(self.call('.'.join(parts))[0],1)
 def test_payload_tamper_rejected(self):
  parts=self.token.split('.');body=json.loads(VERIFIER.b64url_decode(parts[1]));body['payer']='0x0000000000000000000000000000000000000000';parts[1]=b64(body);self.assertEqual(self.call('.'.join(parts))[0],1)
 def test_unlisted_key_rejected(self):self.assertEqual(self.call(doc={'verificationMethod':[]})[0],1)
 def test_wrong_key_rejected(self):
  d=copy.deepcopy(self.doc)
  for vm in d['verificationMethod']:
   if vm['id']=='did:web:csoai.org#board-attestation-1':vm['publicKeyJwk']['x']=base64.urlsafe_b64encode(b'x'*32).decode().rstrip('=')
  self.assertEqual(self.call(doc=d)[0],1)
 def test_wrong_algorithm_rejected(self):
  parts=self.token.split('.');h=json.loads(VERIFIER.b64url_decode(parts[0]));h['alg']='none';parts[0]=b64(h);self.assertEqual(self.call('.'.join(parts))[0],1)
 def test_missing_field_rejected(self):
  parts=self.token.split('.');body=json.loads(VERIFIER.b64url_decode(parts[1]));del body['network'];parts[1]=b64(body);self.assertEqual(self.call('.'.join(parts))[0],1)
 def test_container_dual_payload_not_accepted(self):
  with contextlib.redirect_stderr(io.StringIO()):self.assertEqual(VERIFIER.extract_jws({'format':'jws','signature':self.token,'payload':{}}),[])
 def test_duplicate_receipt_not_double_counted(self):self.assertEqual(VERIFIER.extract_jws([self.token,self.token]),[self.token])
 def test_invalid_jws_rejected(self):self.assertEqual(self.call('not-a-jws')[0],1)
 def test_cli_help(self):
  p=subprocess.run([sys.executable,str(ROOT/'public/verifier/verify_receipt.py'),'--help'],capture_output=True,text=True,timeout=10);self.assertEqual(p.returncode,0);self.assertIn('--did',p.stdout)
 def test_real_cli_saved_key_replay(self):
  p=subprocess.run([sys.executable,str(ROOT/'public/verifier/verify_receipt.py'),'--file',str(FIXTURE),'--did',DID.resolve().as_uri()],capture_output=True,text=True,timeout=10);self.assertEqual(p.returncode,0);self.assertIn('VALID    receipt',p.stdout);self.assertIn('chain      UNCHECKED',p.stdout)
 def test_cli_tampered_saved_payload(self):
  with tempfile.TemporaryDirectory() as tmp:
   parts=self.token.split('.');body=json.loads(VERIFIER.b64url_decode(parts[1]));body['issuedAt']+=1;parts[1]=b64(body);p=Path(tmp)/'altered.json';p.write_text(json.dumps('.'.join(parts)))
   r=subprocess.run([sys.executable,str(ROOT/'public/verifier/verify_receipt.py'),'--file',str(p),'--did',DID.resolve().as_uri()],capture_output=True,text=True,timeout=10);self.assertEqual(r.returncode,1);self.assertIn('INVALID',r.stdout)
if __name__=='__main__':unittest.main(verbosity=2)
