#!/usr/bin/env python3
"""Offline expected-payment checks. Test receipts/keys do not create real payments."""
import argparse,contextlib,copy,importlib.util,io,json,pathlib,unittest
from unittest.mock import patch
ROOT=pathlib.Path(__file__).resolve().parents[1]
s=importlib.util.spec_from_file_location('buyer_verifier',ROOT/'scripts/verify_receipt.py');v=importlib.util.module_from_spec(s);s.loader.exec_module(v)
TX='0x'+'a'*64;BH='0x'+'b'*64;ASSET='0x'+'1'*40;PAYER='0x'+'2'*40;PAYTO='0x'+'3'*40

def expectation(**kw):
 d={'schema':'csoai.erc20-transfer-expectation/1.0','network':'eip155:8453','transaction':TX,'asset':ASSET,'payer':PAYER,'pay_to':PAYTO,'amount_atomic':'20000','resource_url':'https://councilof.ai/api/eunomia-data?feed=1'};d.update(kw);return d

def event(index=1,amount=20000):return {'address':ASSET,'topics':[v.TRANSFER_TOPIC,'0x'+'0'*24+PAYER[2:],'0x'+'0'*24+PAYTO[2:]],'data':'0x'+format(amount,'064x'),'transactionHash':TX,'blockHash':BH,'blockNumber':'0x10','logIndex':hex(index),'removed':False}
def receipt(logs=None):return {'transactionHash':TX,'blockHash':BH,'blockNumber':'0x10','status':'0x1','from':'0x'+'9'*40,'logs':[event()] if logs is None else logs}
class EventTests(unittest.TestCase):
 def check(self,r=None,e=None):return v.assess_erc20_transfer(receipt() if r is None else r,expectation() if e is None else e)
 def edit(self,field,val):r=receipt();r['logs'][0][field]=val;return self.check(r)
 def test_exact_match(self):r=self.check();self.assertEqual(r['state'],'MATCHED');self.assertEqual(r['log_index'],1)
 def test_no_revenue_inferred(self):r=self.check();self.assertFalse(r['revenue_added']);self.assertFalse(r['customer_acceptance_verified']);self.assertFalse(r['delivered_payload_verified']);self.assertFalse(r['finality_verified'])
 def test_relayer_is_not_token_payer(self):self.assertEqual(self.check()['state'],'MATCHED')
 def test_wrong_token(self):self.assertEqual(self.edit('address','0x'+'4'*40)['state'],'NOT_MATCHED')
 def test_wrong_payer(self):r=receipt();r['logs'][0]['topics'][1]='0x'+'0'*24+'4'*40;self.assertEqual(self.check(r)['state'],'NOT_MATCHED')
 def test_wrong_payee(self):r=receipt();r['logs'][0]['topics'][2]='0x'+'0'*24+'4'*40;self.assertEqual(self.check(r)['state'],'NOT_MATCHED')
 def test_wrong_amount(self):self.assertEqual(self.check(receipt([event(amount=19999)]))['state'],'NOT_MATCHED')
 def test_overpayment_not_exact(self):self.assertEqual(self.check(receipt([event(amount=20001)]))['state'],'NOT_MATCHED')
 def test_zero_event_not_match(self):self.assertEqual(self.check(receipt([event(amount=0)]))['state'],'NOT_MATCHED')
 def test_no_summing(self):self.assertEqual(self.check(receipt([event(1,10000),event(2,10000)]))['state'],'NOT_MATCHED')
 def test_ambiguous_exact_events(self):self.assertEqual(self.check(receipt([event(1),event(2)]))['state'],'UNDETERMINED')
 def test_pin_specific_log(self):self.assertEqual(self.check(receipt([event(1),event(2)]),expectation(log_index=2))['log_index'],2)
 def test_pin_wrong_log(self):self.assertEqual(self.check(e=expectation(log_index=2))['state'],'NOT_MATCHED')
 def test_duplicate_logs_not_success(self):self.assertEqual(self.check(receipt([event(),event()]))['state'],'UNDETERMINED')
 def test_removed_log(self):self.assertEqual(self.edit('removed',True)['state'],'UNDETERMINED')
 def test_null_removed(self):self.assertEqual(self.edit('removed',None)['state'],'UNDETERMINED')
 def test_erc721_layout_not_erc20(self):r=receipt();r['logs'][0]['topics'].append('0x'+'0'*64);self.assertEqual(self.check(r)['state'],'UNDETERMINED')
 def test_high_padding_rejected(self):r=receipt();r['logs'][0]['topics'][1]='0x'+'1'+'0'*23+PAYER[2:];self.assertEqual(self.check(r)['state'],'UNDETERMINED')
 def test_short_word(self):self.assertEqual(self.edit('data','0x4e20')['state'],'UNDETERMINED')
 def test_hex_case_is_not_identity_change(self):self.assertEqual(self.edit('transactionHash','0x'+'A'*64)['state'],'MATCHED')
 def test_log_wrong_tx(self):self.assertEqual(self.edit('transactionHash','0x'+'c'*64)['state'],'UNDETERMINED')
 def test_log_wrong_blockhash(self):self.assertEqual(self.edit('blockHash','0x'+'c'*64)['state'],'UNDETERMINED')
 def test_log_wrong_blocknumber(self):self.assertEqual(self.edit('blockNumber','0x11')['state'],'UNDETERMINED')
 def test_negative_index(self):self.assertEqual(self.edit('logIndex','-1')['state'],'UNDETERMINED')
 def test_empty_logs(self):self.assertEqual(self.check(receipt([]))['state'],'NOT_MATCHED')
 def test_absent_logs(self):r=receipt();r.pop('logs');self.assertEqual(self.check(r)['state'],'UNDETERMINED')
 def test_reverted(self):r=receipt();r['status']='0x0';self.assertEqual(self.check(r)['state'],'NOT_MATCHED')
 def test_missing_receipt(self):self.assertEqual(v.assess_erc20_transfer(None,expectation())['state'],'UNDETERMINED')
 def test_unknown_status(self):r=receipt();r['status']='0x2';self.assertEqual(self.check(r)['state'],'UNDETERMINED')
 def test_logs_cap(self):self.assertEqual(self.check(receipt([event(i) for i in range(2049)]))['state'],'UNDETERMINED')
 def test_self_transfer_not_customer(self):e=expectation(pay_to=PAYER);r=receipt();r['logs'][0]['topics'][2]=r['logs'][0]['topics'][1];o=self.check(r,e);self.assertEqual(o['state'],'MATCHED');self.assertEqual(o['participant_classification'],'SELF_TRANSFER');self.assertFalse(o['revenue_added'])
 def test_internal_payer(self):self.assertEqual(self.check(e=expectation(known_internal_wallets=[PAYER]))['participant_classification'],'CALLER_IDENTIFIED_INTERNAL_PARTICIPANT')
 def test_unknown_ownership_not_external_buyer(self):self.assertEqual(self.check()['participant_classification'],'PARTICIPANT_OWNERSHIP_UNESTABLISHED')
class IntentTests(unittest.TestCase):
 def test_valid(self):self.assertEqual(v.validate_transfer_expectation(expectation())['amount_atomic'],'20000')
 def bad(self,**k):
  with self.assertRaises((ValueError,TypeError)):v.validate_transfer_expectation(expectation(**k))
 def test_zero_amount(self):self.bad(amount_atomic='0')
 def test_float_amount(self):self.bad(amount_atomic=0.02)
 def test_bool_amount(self):self.bad(amount_atomic=True)
 def test_leading_zero(self):self.bad(amount_atomic='020000')
 def test_uint_overflow(self):self.bad(amount_atomic=str(2**256))
 def test_negative(self):self.bad(amount_atomic='-20000')
 def test_mint(self):self.bad(payer='0x'+'0'*40)
 def test_burn(self):self.bad(pay_to='0x'+'0'*40)
 def test_resource_foreign(self):self.bad(resource_url='https://elsewhere.invalid/path')
 def test_resource_http(self):self.bad(resource_url='http://councilof.ai/path')
 def test_resource_fragment(self):self.bad(resource_url='https://councilof.ai/path#other')
 def test_resource_credential(self):self.bad(resource_url='https://user:secret@councilof.ai/path')
 def test_bool_index(self):self.bad(log_index=True)
 def test_scope_unknown_field(self):self.bad(trust_me=True)
 def test_duplicate_json(self):
  with self.assertRaises(ValueError):v.strict_transfer_json(b'{"amount_atomic":"1","amount_atomic":"2"}')
 def test_nan_json(self):
  with self.assertRaises(ValueError):v.strict_transfer_json(b'{"amount_atomic":NaN}')
 def test_json_cap(self):
  with self.assertRaises(ValueError):v.strict_transfer_json(b' '*65537)
class BindingTests(unittest.TestCase):
 def setUp(self):self.e=expectation();self.p={'network':self.e['network'],'transaction':TX,'payer':PAYER,'resourceUrl':self.e['resource_url']}
 def invoke(self,side):
  with patch.object(v,'rpc_result',side_effect=side) as mocked:r=v.check_erc20_transfer(self.e,self.p,'https://rpc.invalid');return r,mocked.call_count
 def test_two_calls(self):r,n=self.invoke(['0x2105',receipt()]);self.assertEqual(r['state'],'MATCHED');self.assertEqual(n,2)
 def test_wrong_network_one_call(self):r,n=self.invoke(['0x1']);self.assertEqual(r['state'],'UNDETERMINED');self.assertEqual(n,1)
 def test_unavailable_no_fallback(self):r,n=self.invoke(TimeoutError('secret'));self.assertEqual(r['state'],'UNDETERMINED');self.assertNotIn('secret',json.dumps(r));self.assertEqual(n,1)
 def mismatch(self,key,value):
  self.p[key]=value
  with patch.object(v,'rpc_result',side_effect=AssertionError('must not read')) as rpc:
   with self.assertRaises(ValueError):v.check_erc20_transfer(self.e,self.p)
   self.assertEqual(rpc.call_count,0)
 def test_signed_payer_mismatch(self):self.mismatch('payer',PAYTO)
 def test_signed_network_mismatch(self):self.mismatch('network','eip155:1')
 def test_signed_tx_mismatch(self):self.mismatch('transaction','0x'+'c'*64)
 def test_signed_resource_query_mismatch(self):self.mismatch('resourceUrl','https://councilof.ai/api/eunomia-data?feed=2')
 def test_topic_reuses_owned_ledger_constant(self):
  path=ROOT/'scripts/tui4/settlement_ledger.py';self.assertIn(v.TRANSFER_TOPIC[2:],path.read_text())
class ExistingSignedTests(unittest.TestCase):
 def setUp(self):
  self.f=json.loads((ROOT/'public/interop/x402-self-settlement-2026-09-11.json').read_text());self.jws=self.f['server_receipt']['jws'];self.doc=json.loads((ROOT/'public/.well-known/did.json').read_text());req=self.f['request'];p=self.f['server_receipt']['payload'];self.e=expectation(transaction=p['transaction'],asset=req['asset_contract'],payer=p['payer'],pay_to=req['pay_to'],amount_atomic=req['amount_atomic'],resource_url=p['resourceUrl']);self.args=argparse.Namespace(did='retained-public-key',check_chain=False,rpc='https://rpc.invalid',transfer_expectation=self.e)
 def call(self,state):
  out=io.StringIO()
  with patch.object(v,'check_erc20_transfer',return_value={'state':state,'revenue_added':False}) as mock,contextlib.redirect_stdout(out):rc=v.verify_one(self.jws,self.doc,self.args)
  return rc,out.getvalue(),mock.call_count
 def test_requires_match(self):rc,out,n=self.call('MATCHED');self.assertEqual(rc,0);self.assertEqual(n,1);self.assertIn('not finality',out)
 def test_no_match_exits_one(self):rc,out,n=self.call('NOT_MATCHED');self.assertEqual(rc,1);self.assertNotIn('VALID    receipt',out)
 def test_unknown_exits_two(self):rc,out,n=self.call('UNDETERMINED');self.assertEqual(rc,2);self.assertNotIn('VALID    receipt',out)
 def test_tampered_signature_no_reads(self):self.jws=self.jws[:-4]+'AAAA';rc,out,n=self.call('MATCHED');self.assertEqual(rc,1);self.assertEqual(n,0)
if __name__=='__main__':unittest.main(verbosity=2)
