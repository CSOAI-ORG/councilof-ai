#!/usr/bin/env python3
"""Bounded, offline regression tests. Retained self-test receipt is not new revenue."""
from __future__ import annotations
import argparse,contextlib,copy,importlib.util,io,json,pathlib,unittest,urllib.error
from unittest.mock import patch,Mock
ROOT=pathlib.Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('receipt_candidate',ROOT/'scripts/verify_receipt.py');v=importlib.util.module_from_spec(spec);spec.loader.exec_module(v)
TX='0x'+'a'*64;BLOCK='0x'+'b'*64

def receipt(**extra):
 out={'transactionHash':TX,'blockHash':BLOCK,'blockNumber':'0x10','status':'0x1','logs':[]};out.update(extra);return out

class ReadTests(unittest.TestCase):
 def result(self,r,chain='0x2105',network='eip155:8453'):
  with patch.object(v,'rpc_result',side_effect=[chain,r]) as mocked:
   out=v.tx_exists(TX,'https://rpc.invalid',network);return out,mocked
 def test_success(self):r,m=self.result(receipt());self.assertEqual(r[0],'YES');self.assertEqual(m.call_count,2);self.assertIn('NOT checked',r[1])
 def test_reverted(self):self.assertEqual(self.result(receipt(status='0x0'))[0][0],'NO')
 def test_pending_or_unknown(self):self.assertEqual(self.result(None)[0][0],'UNCHECKED')
 def test_wrong_network_stops_after_one_read(self):r,m=self.result(receipt(),chain='0x1');self.assertEqual(r[0],'UNCHECKED');self.assertEqual(m.call_count,1)
 def test_other_signed_eip155_network_must_match(self):self.assertEqual(self.result(receipt(),chain='0x1',network='eip155:1')[0][0],'YES')
 def test_wrong_tx_hash(self):self.assertEqual(self.result(receipt(transactionHash='0x'+'c'*64))[0][0],'UNCHECKED')
 def test_missing_tx_hash(self):r=receipt();r.pop('transactionHash');self.assertEqual(self.result(r)[0][0],'UNCHECKED')
 def test_case_insensitive_hex_hash(self):self.assertEqual(self.result(receipt(transactionHash='0x'+'A'*64))[0][0],'YES')
 def test_no_blockhash(self):self.assertEqual(self.result(receipt(blockHash=None))[0][0],'UNCHECKED')
 def test_short_blockhash(self):self.assertEqual(self.result(receipt(blockHash='0x01'))[0][0],'UNCHECKED')
 def test_missing_status(self):r=receipt();r.pop('status');self.assertEqual(self.result(r)[0][0],'UNCHECKED')
 def test_unknown_status(self):self.assertEqual(self.result(receipt(status='0x2'))[0][0],'UNCHECKED')
 def test_boolean_status(self):self.assertEqual(self.result(receipt(status=True))[0][0],'UNCHECKED')
 def test_integer_status(self):self.assertEqual(self.result(receipt(status=1))[0][0],'UNCHECKED')
 def test_bad_quantity(self):self.assertEqual(self.result(receipt(blockNumber='0x00'))[0][0],'UNCHECKED')
 def test_negative_height(self):self.assertEqual(self.result(receipt(blockNumber='-1'))[0][0],'UNCHECKED')
 def test_receipt_array(self):self.assertEqual(self.result([])[0][0],'UNCHECKED')
 def test_bad_chainid(self):self.assertEqual(self.result(receipt(),chain=8453)[0][0],'UNCHECKED')
 def test_bad_hash_no_network(self):
  with patch.object(v,'rpc_result',side_effect=AssertionError('must not read')) as m:r=v.tx_exists('bad');self.assertEqual(r[0],'UNCHECKED');self.assertEqual(m.call_count,0)
 def test_unsupported_network_no_network(self):
  with patch.object(v,'rpc_result',side_effect=AssertionError('must not read')) as m:r=v.tx_exists(TX,expected_network='solana:mainnet');self.assertEqual(r[0],'UNCHECKED');self.assertEqual(m.call_count,0)
 def test_timeout_unknown(self):
  with patch.object(v,'rpc_result',side_effect=TimeoutError):self.assertEqual(v.tx_exists(TX)[0],'UNCHECKED')
 def test_exception_does_not_echo_rpc_secret(self):
  with patch.object(v,'rpc_result',side_effect=RuntimeError('private_rpc_key')):r=v.tx_exists(TX);self.assertNotIn('private_rpc_key',r[1])
 def test_transfer_not_inferred(self):r,_=self.result(receipt(logs=[]));self.assertEqual(r[0],'YES');self.assertIn('transfer amount',r[1])

class RpcTests(unittest.TestCase):
 def call_raw(self,raw,request_id=1):
  response=Mock();response.read.return_value=raw;response.__enter__=Mock(return_value=response);response.__exit__=Mock(return_value=None)
  opener=Mock();opener.open.return_value=response
  with patch.object(v.urllib.request,'build_opener',return_value=opener):return v.rpc_result('https://rpc.invalid','eth_chainId',[],request_id)
 def obj(self,x):return self.call_raw(json.dumps(x).encode())
 def test_envelope_valid(self):self.assertEqual(self.obj({'jsonrpc':'2.0','id':1,'result':'0x2105'}),'0x2105')
 def test_null_result_preserved(self):self.assertIsNone(self.obj({'jsonrpc':'2.0','id':1,'result':None}))
 def test_rpc_error_is_not_missing_tx(self):
  with self.assertRaises(v.ChainReadError):self.obj({'jsonrpc':'2.0','id':1,'error':{'code':-32000,'message':'unavailable'}})
 def test_result_plus_error(self):
  with self.assertRaises(v.ChainReadError):self.obj({'jsonrpc':'2.0','id':1,'result':{},'error':None})
 def test_wrong_id(self):
  with self.assertRaises(v.ChainReadError):self.obj({'jsonrpc':'2.0','id':2,'result':'0x2105'})
 def test_boolean_id(self):
  with self.assertRaises(v.ChainReadError):self.obj({'jsonrpc':'2.0','id':True,'result':'0x2105'})
 def test_wrong_version(self):
  with self.assertRaises(v.ChainReadError):self.obj({'jsonrpc':'1.0','id':1,'result':'0x2105'})
 def test_duplicate_fields(self):
  with self.assertRaises(v.ChainReadError):self.call_raw(b'{"jsonrpc":"2.0","id":1,"result":"0x1","result":"0x2105"}')
 def test_nan(self):
  with self.assertRaises(v.ChainReadError):self.call_raw(b'{"jsonrpc":"2.0","id":1,"result":NaN}')
 def test_array_envelope(self):
  with self.assertRaises(v.ChainReadError):self.obj([])
 def test_oversized(self):
  with self.assertRaises(v.ChainReadError):self.call_raw(b' '*(v.CHAIN_RESPONSE_CAP+1))
 def test_html_is_not_rpc(self):
  with self.assertRaises(ValueError):self.call_raw(b'<html>try again</html>')
 def test_plain_remote_http_refused(self):
  with self.assertRaises(v.ChainReadError):v.rpc_origin_check('http://rpc.invalid/')
 def test_local_node_allowed(self):v.rpc_origin_check('http://127.0.0.1:8545');v.rpc_origin_check('http://[::1]:8545');v.rpc_origin_check('http://localhost:8545')
 def test_embedded_credentials_refused(self):
  with self.assertRaises(v.ChainReadError):v.rpc_origin_check('https://user:secret@rpc.invalid')
 def test_fragment_refused(self):
  with self.assertRaises(v.ChainReadError):v.rpc_origin_check('https://rpc.invalid/#x')
 def test_redirect_refused(self):
  with self.assertRaises(v.ChainReadError):v.NoChainRedirect().redirect_request(None,None,302,None,None,'https://other.invalid')
 def test_only_reads(self):
  with self.assertRaises(v.ChainReadError):v.rpc_result('https://rpc.invalid','eth_sendRawTransaction',[],1)

class EndToEndTests(unittest.TestCase):
 def setUp(self):
  self.fixture=json.loads((ROOT/'public/interop/x402-self-settlement-2026-09-11.json').read_bytes());self.token=v.extract_jws(self.fixture)[0];self.doc=json.loads((ROOT/'public/.well-known/did.json').read_bytes());self.args=argparse.Namespace(did='retained-key-document',check_chain=True,rpc='https://rpc.invalid')
 def invoke(self,value):
  out=io.StringIO()
  with patch.object(v,'tx_exists',return_value=value) as p,contextlib.redirect_stdout(out):rc=v.verify_one(self.token,self.doc,self.args)
  return rc,out.getvalue(),p
 def test_rpc_unknown_is_exit_two_not_pass(self):r,text,_=self.invoke(('UNCHECKED','offline fixture'));self.assertEqual(r,2);self.assertNotIn('VALID    receipt',text);self.assertIn('signature verified',text)
 def test_reverted_is_exit_one_not_pass(self):r,text,_=self.invoke(('NO','REVERTED fixture'));self.assertEqual(r,1);self.assertNotIn('VALID    receipt',text)
 def test_success_still_not_payment(self):r,text,p=self.invoke(('YES','successful inclusion; transfer NOT checked'));self.assertEqual(r,0);self.assertIn('VALID    receipt',text);self.assertEqual(p.call_args.kwargs['expected_network'],'eip155:8453')
 def test_default_signature_unchanged_and_no_rpc(self):self.args.check_chain=False;r,text,p=self.invoke(('NO','must not call'));self.assertEqual(r,0);self.assertEqual(p.call_count,0);self.assertIn('UNCHECKED',text)
 def test_wrong_signature_never_reaches_rpc(self):
  parts=self.token.split('.');parts[2]='A'*86;self.token='.'.join(parts);r,text,p=self.invoke(('YES','must not call'));self.assertEqual(r,1);self.assertEqual(p.call_count,0)
 def synthetic(self,payload):
  # Test-only ephemeral key; never a production key or externally published statement.
  from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey
  from cryptography.hazmat.primitives import serialization
  import base64
  b64=lambda raw:base64.urlsafe_b64encode(raw).decode().rstrip('=')
  key=Ed25519PrivateKey.generate();raw=key.public_key().public_bytes(serialization.Encoding.Raw,serialization.PublicFormat.Raw);kid='did:web:csoai.org#synthetic-test-only';header={'alg':'EdDSA','kid':kid};unsigned=b64(json.dumps(header).encode())+'.'+b64(json.dumps(payload).encode());self.token=unsigned+'.'+b64(key.sign(unsigned.encode()));self.doc={'verificationMethod':[{'id':kid,'publicKeyJwk':{'kty':'OKP','crv':'Ed25519','x':b64(raw)}}]}
 def test_privacy_minimal_signature_valid_without_chain_flag(self):self.synthetic({'version':1,'network':'eip155:8453','resourceUrl':'https://councilof.ai/api/free-door','payer':'synthetic','issuedAt':1});self.args.check_chain=False;r,_,p=self.invoke(('NO','must not read'));self.assertEqual(r,0);self.assertEqual(p.call_count,0)
 def test_privacy_minimal_requested_chain_unavailable(self):self.synthetic({'version':1,'network':'eip155:8453','resourceUrl':'https://councilof.ai/api/free-door','payer':'synthetic','issuedAt':1});r,_,p=self.invoke(('YES','must not read'));self.assertEqual(r,2);self.assertEqual(p.call_count,0)
 def test_offer_requested_chain_not_inferred(self):self.synthetic({'version':1,'resourceUrl':'https://councilof.ai/api/free-door','scheme':'exact','network':'eip155:8453','asset':'test-only','payTo':'test-only','amount':'0'});r,_,p=self.invoke(('YES','must not read'));self.assertEqual(r,2);self.assertEqual(p.call_count,0)

if __name__=='__main__':unittest.main(verbosity=2)
