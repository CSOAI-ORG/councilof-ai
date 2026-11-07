"""Owned, network-isolated regression cases. No real credentials or provider calls.
FastMCP registration is stubbed; this is not native-client/package-release acceptance.
"""
from __future__ import annotations
import importlib.util,json,os,random,socket,sys,types,unittest
from pathlib import Path
from unittest.mock import patch
ROOT=Path(__file__).resolve().parents[1]
class Reply:
 status=200
 def __init__(self,body=None,status=200):self.body=body if body is not None else b'{"allowed":true,"tier":"free","remaining":10}';self.status=status
 def __enter__(self):return self
 def __exit__(self,*args):return False
 def read(self,limit=-1):return self.body if limit<0 else self.body[:limit]
class OfflinePolicy(unittest.TestCase):
 def setUp(self):
  p=patch.dict(os.environ,{},clear=True);p.start();self.addCleanup(p.stop)
  p=patch.object(socket.socket,'connect',side_effect=AssertionError('network prohibited'));p.start();self.addCleanup(p.stop)
  self.calls=[];self.reply=Reply();self.error=None
  spec=importlib.util.spec_from_file_location('auth_middleware',ROOT/'auth_middleware.py');self.auth=importlib.util.module_from_spec(spec);spec.loader.exec_module(self.auth)
  def fake_open(request,**kwargs):
   self.calls.append(request)
   if self.error:raise self.error
   return self.reply
  self.opener=types.SimpleNamespace(open=fake_open)
  for p in [patch.object(self.auth.urllib.request,'build_opener',return_value=self.opener),patch.object(self.auth.urllib.request,'urlopen',side_effect=fake_open)]:p.start();self.addCleanup(p.stop)
 def opt_in(self):os.environ['MEOK_ENABLE_REMOTE_METERING']='1'
 def test_default_has_no_network(self):self.assertTrue(self.auth.check_access()[0]);self.assertEqual(self.calls,[])
 def test_saved_environment_key_does_not_enable_network(self):os.environ['MEOK_API_KEY']='synthetic-owner-key';self.assertTrue(self.auth.check_access()[0]);self.assertEqual(self.calls,[])
 def test_supplied_key_does_not_enable_network(self):self.assertTrue(self.auth.check_access('synthetic-supplied-key')[0]);self.assertEqual(self.calls,[])
 def test_invalid_consent_refuses_without_network(self):
  for mode in ['true','yes','2','false']:os.environ['MEOK_ENABLE_REMOTE_METERING']=mode;self.assertFalse(self.auth.check_access()[0])
  self.assertEqual(self.calls,[])
 def test_explicit_zero_keeps_local_mode(self):os.environ['MEOK_ENABLE_REMOTE_METERING']='0';self.assertEqual(self.auth.check_access()[2],'free');self.assertEqual(self.calls,[])
 def test_opt_in_sends_only_declared_fields(self):
  self.opt_in();self.assertTrue(self.auth.check_access('synthetic-supplied-key')[0]);self.assertEqual(len(self.calls),1);r=self.calls[0]
  self.assertEqual(r.get_method(),'POST');self.assertEqual(r.full_url,'https://proofof.ai/verify');self.assertEqual(json.loads(r.data),{'api_key':'synthetic-supplied-key','tool':''})
 def test_environment_key_used_only_after_consent(self):self.opt_in();os.environ['MEOK_API_KEY']='synthetic-environment-key';self.auth.check_access();self.assertEqual(json.loads(self.calls[0].data)['api_key'],'synthetic-environment-key')
 def test_prefix_is_not_an_entitlement(self):
  self.opt_in();self.reply=Reply(b'{"allowed":false,"tier":"free"}')
  for key in ['CSOAI-FAKE','meok_pro_FAKE','payg_FAKE']:self.assertFalse(self.auth.check_access(key)[0])
  self.assertEqual(len(self.calls),3)
 def test_timeout_refuses_no_leaked_error(self):
  self.opt_in();self.error=TimeoutError('synthetic-secret-in-error');r=self.auth.check_access('synthetic-key');self.assertFalse(r[0]);self.assertEqual(r[2],'unknown');self.assertNotIn('synthetic-secret',repr(r))
 def test_non_200_refuses(self):self.opt_in();self.reply=Reply(status=503);self.assertFalse(self.auth.check_access()[0])
 def test_truthy_permission_does_not_allow(self):
  self.opt_in()
  for value in ['true',1,[],{},None]:self.reply=Reply(json.dumps({'allowed':value,'tier':'free'}).encode());self.assertFalse(self.auth.check_access()[0])
 def test_missing_permission_refuses(self):self.opt_in();self.reply=Reply(b'{"tier":"free"}');self.assertFalse(self.auth.check_access()[0])
 def test_unknown_or_missing_tier_refuses(self):
  self.opt_in()
  for value in [None,1,{},'admin','pro from prefix']:self.reply=Reply(json.dumps({'allowed':True,'tier':value}).encode());self.assertFalse(self.auth.check_access()[0])
 def test_malformed_response_refuses(self):
  self.opt_in()
  for body in [b'not JSON',b'[]',b'null',b'"true"']:self.reply=Reply(body);self.assertFalse(self.auth.check_access()[0])
 def test_oversized_response_refuses(self):self.opt_in();self.reply=Reply(b' '*16385);self.assertFalse(self.auth.check_access()[0])
 def test_remote_settings_reject_invalid_endpoints_before_request(self):
  self.opt_in()
  for url in ['http://example.invalid/verify','file:///etc/passwd','https://u:p@example.invalid/verify','https://example.invalid/?key=secret','https://example.invalid/#key','https://example.invalid:bad/verify','https://example.invalid/\nverify','https://example.invalid\\else/verify']:os.environ['MEOK_VERIFY_URL']=url;self.assertFalse(self.auth.check_access()[0])
  self.assertEqual(self.calls,[])
 def test_bad_timeout_refuses_before_request(self):
  self.opt_in()
  for value in ['nan','inf','0','-1','11','bad']:os.environ['MEOK_VERIFY_TIMEOUT']=value;self.assertFalse(self.auth.check_access()[0])
  self.assertEqual(self.calls,[])
 def test_redirect_handler_refuses(self):
  handler=self.auth._NoRedirect();request=self.auth.urllib.request.Request('https://example.invalid/verify',data=b'{}')
  with self.assertRaises(self.auth.urllib.error.HTTPError):handler.redirect_request(request,None,302,'redirect',{},'https://other.invalid/')
 def test_non_string_opted_in_key_refuses(self):self.opt_in();self.assertFalse(self.auth.check_access({'api_key':'x'})[0]);self.assertEqual(self.calls,[])
 def test_unbounded_key_refuses(self):self.opt_in();self.assertFalse(self.auth.check_access('x'*4097)[0]);self.assertEqual(self.calls,[])
 def test_direct_helper_cannot_bypass_opt_in(self):self.assertIsNone(self.auth._server_check('synthetic-key'));self.assertEqual(self.calls,[])
 def test_local_mode_does_not_consult_remote_configuration(self):os.environ['MEOK_VERIFY_URL']='invalid';os.environ['MEOK_VERIFY_TIMEOUT']='nan';self.assertTrue(self.auth.check_access()[0]);self.assertEqual(self.calls,[])
 def test_no_public_default_mac_key(self):
  with self.assertRaises(ValueError):self.auth.meok_attest({'value':1})
 def test_short_mac_key_refused(self):
  os.environ['MEOK_ATTEST_KEY']='meok-public'
  with self.assertRaises(ValueError):self.auth.meok_attest({'value':1})
 def test_explicit_mac_is_keyed_not_an_authority(self):
  os.environ['MEOK_ATTEST_KEY']='fixture-only-key-not-a-person-0123456789';a=self.auth.meok_attest({'value':1});b=self.auth.meok_attest({'value':2});self.assertEqual(len(a),64);self.assertNotEqual(a,b);self.assertEqual(self.calls,[])
 def load_server(self):
  class FastMCP:
   def __init__(self,*args,**kwargs):self.tools={}
   def tool(self,*args,**kwargs):
    def register(fn):self.tools[fn.__name__]=fn;return fn
    return register
   def run(self):raise AssertionError('client server not run by fixture')
  m=types.ModuleType('mcp');s=types.ModuleType('mcp.server');f=types.ModuleType('mcp.server.fastmcp');f.FastMCP=FastMCP
  p=patch.dict(sys.modules,{'mcp':m,'mcp.server':s,'mcp.server.fastmcp':f,'auth_middleware':self.auth});p.start();self.addCleanup(p.stop)
  spec=importlib.util.spec_from_file_location('owned_legacy_server',ROOT/'server.py');server=importlib.util.module_from_spec(spec);spec.loader.exec_module(server);return server
 def examples(self,server):
  if hasattr(server,'build_select'):return [('build_select',{'table':'synthetic_table','where':{'id':7}}),('build_insert',{'table':'synthetic_table','rows':[{'id':7}]}),('explain_query',{'sql':'SELECT id FROM synthetic_table WHERE id = 7'}),('optimize_query_hints',{'sql':'SELECT * FROM synthetic_table'})]
  return [('generate_chord_progression',{}),('detect_tempo',{'beat_timestamps':[0.,.5,1.,1.5,2.]}),('find_key',{'notes':['C','E','G']}),('analyze_lyrics',{'lyrics':'A bright morning\nA quiet day','title':'Owned fixture'}),('mixing_recommendations',{'tracks':[{'name':'Fixture vocal','type':'vocals','current_db':-10}]})]
 def test_every_tool_works_locally_without_egress(self):
  s=self.load_server()
  for name,args in self.examples(s):
   with self.subTest(tool=name):random.seed(7);result=getattr(s,name)(**args);self.assertIsInstance(result,dict);self.assertNotIn('error',result)
  self.assertEqual(self.calls,[])
 def test_opted_in_metadata_never_contains_calculation_input(self):
  self.opt_in();s=self.load_server()
  for name,args in self.examples(s):getattr(s,name)(**args,api_key='synthetic-key')
  self.assertEqual(len(self.calls),len(self.examples(s)))
  for request in self.calls:self.assertEqual(json.loads(request.data),{'api_key':'synthetic-key','tool':''})
 def test_remote_denial_does_not_increment_local_calculation_counter(self):
  self.opt_in();self.reply=Reply(b'{"allowed":false,"tier":"free"}');s=self.load_server()
  for name,args in self.examples(s):self.assertIn('error',getattr(s,name)(**args))
  self.assertEqual(sum(len(x) for x in s._call_counts.values()),0)
 def test_local_rate_limit_preserved(self):
  s=self.load_server();name,args=self.examples(s)[0];s._call_counts[name]=[s.time.time()]*s.FREE_TIER_LIMIT
  with self.assertRaises(ValueError):getattr(s,name)(**args)
  self.assertEqual(self.calls,[])
 def test_runtime_descriptions_disclose_opt_in_and_local_limits(self):
  s=self.load_server()
  for name in s.mcp.tools:
   d=getattr(s,name).__doc__ or '';self.assertIn('MEOK_ENABLE_REMOTE_METERING',d);self.assertIn(str(s.FREE_TIER_LIMIT),d);self.assertNotIn('No input data is stored, logged, or transmitted',d)
 def test_readme_has_actual_console_entry_and_no_self_score_badge(self):
  readme=(ROOT/'README.md').read_text();project=(ROOT/'pyproject.toml').read_text();import re
  entry=re.search(r'(?m)^([\w-]+)\s*=\s*"server:main"',project).group(1);self.assertIn(entry,readme);self.assertNotIn('[![MCP Scorecard:',readme);self.assertNotIn('compliance** built-in',readme);self.assertIn('not an independent',readme)
if __name__=='__main__':unittest.main(verbosity=2)
