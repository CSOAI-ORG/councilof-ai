import unittest,tempfile,json,hashlib,base64,copy
from pathlib import Path
from unittest.mock import patch
from build_discovery_catalog import generate,write_outputs,inspect_reference,asset_path,NAMES,INPUT
class DiscoveryTests(unittest.TestCase):
 def setUp(self):
  self.tmp=tempfile.TemporaryDirectory();self.root=Path(self.tmp.name);self.public=self.root/'public';self.retained=self.root/INPUT;self.retained.mkdir(parents=True);(self.public/'.well-known/agents').mkdir(parents=True);(self.root/'functions/mcp').mkdir(parents=True)
  self.card={'name':'Fixture service','supportedInterfaces':[{'url':'https://councilof.ai/api/a2a','protocolBinding':'JSONRPC'}],'skills':[{'id':'get_card','description':'old fixture'}]}
  self.write(self.public/'.well-known/agent-card.json',self.card);self.write(self.public/'.well-known/agents/get_card.json',self.card);self.write(self.retained/'get_card-template.json',self.card)
  self.write(self.public/'.well-known/vendor.json',{'schema':'csoai.well-known/0.1','name':'Fixture vendor metadata'})
  self.write(self.root/'functions/mcp/gspc-tools.json',{'tools':[{'name':'get_card','description':'Fixture source definition, no promised connection'}]})
  self.old={NAMES[0]:{'agents':[{'engine':'vendor','agent_card':'https://councilof.ai/.well-known/vendor.json','a2a_discovery':'https://councilof.ai/.well-known/agents/vendor.json','mcp':'https://councilof.ai/mcp/vendor.json'},{'engine':'missing','agent_card':'https://councilof.ai/.well-known/missing.json','a2a_discovery':'https://councilof.ai/.well-known/agents/missing.json','mcp':'https://councilof.ai/mcp/missing.json'}]},NAMES[1]:{'platforms':[{'id':'fixture','name':'Fixture','vendor':'Fixture vendor','manifests':[{'format':'example','url':'https://councilof.ai/.well-known/vendor.json'},{'format':'unavailable','url':'https://councilof.ai/interop/no-file.json'}]}]},NAMES[2]:{'population':{'ENUMERATED':3},'merkle':{'root_sha256':'f'*64}}}
  self.manifest={'files':{}}
  for name,value in self.old.items():
   raw=json.dumps(value).encode();(self.retained/name).write_bytes(raw);self.manifest['files']['public/interop/'+name]={'sha256':hashlib.sha256(raw).hexdigest(),'bytes':len(raw)}
  self.write(self.retained/'manifest.json',self.manifest)
 def tearDown(self):self.tmp.cleanup()
 def write(self,p,d):p.parent.mkdir(parents=True,exist_ok=True);p.write_text(json.dumps(d))
 def output(self,name):return json.loads(generate(self.root)['public/interop/'+name])
 def test_vendor_information_is_not_agent_execution(self):
  d=self.output(NAMES[0]);self.assertEqual(d['declared_engine_count'],2);self.assertEqual(d['engines'][0]['metadata']['state'],'LOCAL_JSON_METADATA_ONLY');self.assertFalse(d['engines'][0]['metadata']['declared_executable']);self.assertIsNone(d['executed_agent_count'])
 def test_missing_targets_remain_explicit_not_fabricated(self):
  d=self.output(NAMES[0]);r=d['engines'][1]['metadata'];self.assertEqual(r['state'],'MISSING_LOCAL_FILE');self.assertIsNone(r['link']);self.assertTrue(r['candidate_path'].endswith('missing.json'))
 def test_tool_variants_do_not_inflate_service_count(self):
  d=self.output('agent-discovery-census.json');self.assertEqual(d['counts']['canonical_service_cards'],1);self.assertEqual(d['counts']['tool_scoped_card_records'],1);self.assertEqual(d['counts']['distinct_declared_interface_paths'],1);self.assertEqual(d['counts']['engine_cards_matching_local_shape'],0);self.assertIsNone(d['counts']['executed_agents'])
 def test_original_bytes_and_merkle_material_retained_exactly(self):
  d=self.output('discovery-declarations-archive-2026-09-18.json')
  for name,member in d['members'].items():self.assertEqual(base64.b64decode(member['body_base64']), (self.retained/name).read_bytes());self.assertEqual(hashlib.sha256(base64.b64decode(member['body_base64'])).hexdigest(),member['sha256'])
 def test_enumeration_correction_does_not_reissue_merkle_proof(self):
  d=self.output(NAMES[2]);self.assertEqual(d['state'],'SUPERSEDED_UNVERIFIED_POPULATION');self.assertNotIn('merkle',d);self.assertEqual(d['previous_declared_population'],{'ENUMERATED':3})
 def test_platform_counts_are_not_integration_counts(self):
  d=self.output(NAMES[1]);self.assertEqual(d['declared_manifest_references'],2);self.assertEqual(d['locally_readable_manifest_files'],1);self.assertEqual(d['platforms'][0]['integration_status'],'NOT_TESTED')
 def test_tampered_original_refused(self):
  (self.retained/NAMES[0]).write_text('{}')
  with self.assertRaises(AssertionError):generate(self.root)
 def test_no_network_used(self):
  with patch('socket.socket.connect',side_effect=AssertionError('network forbidden')):self.assertTrue(generate(self.root))
 def test_same_inputs_deterministic(self):self.assertEqual(generate(self.root),generate(self.root))
 def test_single_generation_is_self_consistent(self):write_outputs(self.root);write_outputs(self.root,True)
 def test_output_drift_is_blocked(self):
  write_outputs(self.root);(self.public/'interop/agent-discovery-census.json').write_text('{}')
  with self.assertRaises(ValueError):write_outputs(self.root,True)
 def test_tool_description_comes_from_runtime_registry(self):
  d=json.loads(generate(self.root)['public/.well-known/agents/get_card.json']);self.assertEqual(d['description'],d['skills'][0]['description']);self.assertIn('Fixture source definition',d['description'])
 def test_recomputed_tool_card_hash_bound_in_same_pass(self):
  data=generate(self.root);d=json.loads(data['public/interop/agent-discovery-census.json']);self.assertEqual(d['tool_scoped_cards'][0]['sha256'],hashlib.sha256(data['public/.well-known/agents/get_card.json']).hexdigest())
 def test_invalid_json_not_served_as_metadata(self):
  p=self.public/'bad.json';p.write_text('<html>error</html>');self.assertEqual(inspect_reference(self.public,'/bad.json')['state'],'INVALID_JSON')
 def test_json_array_not_card(self):
  self.write(self.public/'array.json',[]);self.assertEqual(inspect_reference(self.public,'/array.json')['state'],'NOT_JSON_OBJECT')
 def test_duplicate_json_keys_rejected(self):
  (self.public/'bad.json').write_text('{"name":"a","name":"b"}');self.assertEqual(inspect_reference(self.public,'/bad.json')['state'],'INVALID_JSON')
 def test_symlink_not_followed(self):
  (self.public/'linked.json').symlink_to(self.retained/NAMES[0]);self.assertEqual(inspect_reference(self.public,'/linked.json')['state'],'UNSAFE_OR_OVERSIZED_FILE')
 def test_url_boundary(self):
  for url in ['file:///etc/hosts','https://other.invalid/x','//councilof.ai/x','/../private','/a/%2e%2e/private','/x?secret=1','/x#fragment']:
   with self.subTest(url=url),self.assertRaises(ValueError):asset_path(url)
 def test_missing_self_does_not_create_a_service(self):
  (self.public/'.well-known/agent-card.json').unlink();d=self.output('agent-discovery-census.json');self.assertEqual(d['counts']['canonical_service_cards'],0)
 def test_missing_generated_tool_card_is_produced_without_two_pass_drift(self):
  (self.public/'.well-known/agents/get_card.json').unlink();write_outputs(self.root);write_outputs(self.root,True);self.assertEqual(self.output('agent-discovery-census.json')['counts']['tool_scoped_card_records'],1)
if __name__=='__main__':unittest.main()
