#!/usr/bin/env python3
"""Correct discovery metadata from actual local JSON files, not invented hosted agents.
No network, signing, execution, account access, or counts of independent deployed agents.
The previous unsigned reports are retained exactly and inspectable in a labelled archive.
"""
from pathlib import Path,PurePosixPath
from urllib.parse import urlsplit,unquote
import argparse,base64,hashlib,json,os
ROOT=Path(__file__).resolve().parents[2]
INPUT=Path('evidence/discovery-declarations-2026-09-18')
ARCHIVE='/interop/discovery-declarations-archive-2026-09-18.json'
NAMES=['a2a-engine-cards.json','ai-platform-plugins.json','tui-a-agent-enumeration-v0.1.json']
def digest(b):return hashlib.sha256(b).hexdigest()
def raw_json(b):
 def unique(pairs):
  d={}
  for k,v in pairs:
   if k in d:raise ValueError('Duplicate JSON key')
   d[k]=v
  return d
 return json.loads(b,object_pairs_hook=unique,parse_constant=lambda _:(_ for _ in ()).throw(ValueError('Non-finite JSON')))
def asset_path(url):
 if not isinstance(url,str):raise ValueError('Reference must be a string')
 u=urlsplit(url)
 if u.scheme and (u.scheme!='https' or u.netloc!='councilof.ai'):raise ValueError('Only explicit canonical origin')
 if u.netloc and not u.scheme:raise ValueError('Network-path URL rejected')
 path=unquote(u.path)
 if not path.startswith('/') or any(v in ('.','..') for v in path.split('/')) or '\\' in path or '\x00' in path or u.query or u.fragment:raise ValueError('Unsafe or parameterised asset reference')
 return path

def inspect_reference(public,url,expected_bytes=None):
 path=asset_path(url);file=public/path.lstrip('/');base={'candidate_path':path,'link':None,'state':'MISSING_LOCAL_FILE','declared_executable':False,'execution':'NOT_TESTED'}
 if expected_bytes is None and not file.exists():return base
 if file.is_symlink() or not file.resolve().is_relative_to(public.resolve()):return {**base,'state':'UNSAFE_OR_OVERSIZED_FILE'}
 if expected_bytes is None and (not file.is_file() or file.stat().st_size>1_000_000):return {**base,'state':'UNSAFE_OR_OVERSIZED_FILE'}
 if expected_bytes is not None and len(expected_bytes)>1_000_000:return {**base,'state':'UNSAFE_OR_OVERSIZED_FILE'}
 try:raw=expected_bytes if expected_bytes is not None else file.read_bytes();doc=raw_json(raw)
 except (ValueError,OSError,UnicodeError):return {**base,'state':'INVALID_JSON'}
 if not isinstance(doc,dict):return {**base,'state':'NOT_JSON_OBJECT'}
 # A descriptive well-known record is not an A2A card. Shape checks are not conformance tests.
 interfaces=doc.get('supportedInterfaces');skills=doc.get('skills')
 shaped=isinstance(doc.get('name'),str) and isinstance(interfaces,list) and bool(interfaces) and isinstance(skills,list) and all(isinstance(i,dict) and isinstance(i.get('url'),str) and i.get('protocolBinding')=='JSONRPC' for i in interfaces)
 return {**base,'link':path,'state':'LOCAL_AGENT_CARD_SHAPE' if shaped else 'LOCAL_JSON_METADATA_ONLY','sha256':digest(raw),'bytes':len(raw),'declared_schema':doc.get('schema'),'declared_executable':False,'interface_paths':[asset_path(i['url']) for i in interfaces] if shaped else [],'skill_count':len(skills) if shaped else None}

def generate(repo=ROOT):
 repo=Path(repo);public=repo/'public';retained=repo/INPUT;manifest=raw_json((retained/'manifest.json').read_bytes());old={};members={}
 for name in NAMES:
  rel='public/interop/'+name;raw=(retained/name).read_bytes();expected=manifest['files'][rel];assert digest(raw)==expected['sha256'] and len(raw)==expected['bytes'],'Historical input changed'
  old[name]=raw_json(raw);members[name]={'sha256':digest(raw),'bytes':len(raw),'body_base64':base64.b64encode(raw).decode()}
 tool_definition=raw_json((repo/'functions/mcp/gspc-tools.json').read_bytes())
 get_card=next(t for t in tool_definition['tools'] if t['name']=='get_card')
 tool_card=raw_json((retained/'get_card-template.json').read_bytes())
 tool_card['description']=get_card['description']
 for skill in tool_card['skills']:
  if skill.get('id')=='get_card':skill['description']=get_card['description']
 tool_card_bytes=(json.dumps(tool_card,indent=2,ensure_ascii=False)+'\n').encode()
 common={'revision':'2026-09-18.discovery-correction.1','measurement_state':'NO_NEW_EXECUTION_OR_CONFORMANCE_TEST','source_scope':'Exact local candidate files only. A registry name, metadata record or multiple skill descriptors do not establish distinct deployed agents, vendor affiliation or a partnership.','previous_reports_archive':ARCHIVE,'public_availability':'NOT_TESTED_BY_THIS_GENERATOR'}
 engine_rows=[]
 for declaration in old[NAMES[0]]['agents']:
  engine_rows.append({'declared_engine':declaration['engine'],'metadata':inspect_reference(public,declaration['agent_card']),'a2a_card':inspect_reference(public,declaration['a2a_discovery']),'previous_mcp_candidate_path':asset_path(declaration['mcp']),'mcp_status':'NOT_VERIFIED; a catch-all route alone does not prove a vendor-specific server'})
 self_card=inspect_reference(public,'/.well-known/agent-card.json');canonical_cards=[self_card] if self_card['state']=='LOCAL_AGENT_CARD_SHAPE' else []
 tool_cards=[]
 for p in sorted(set((public/'.well-known/agents').glob('*.json'))|{public/'.well-known/agents/get_card.json'}):
  r=inspect_reference(public,'/'+p.relative_to(public).as_posix(),tool_card_bytes if p.name=='get_card.json' else None)
  if r['state']=='LOCAL_AGENT_CARD_SHAPE':tool_cards.append({'name':p.stem,**r})
 endpoints=sorted(set(v for r in canonical_cards+tool_cards for v in r.get('interface_paths',[])))
 engine={'schema':'csoai.a2a-engine-cards/0.2',**common,'supersedes_sha256':members[NAMES[0]]['sha256'],'declared_engine_count':len(engine_rows),'engines':engine_rows,'agents':canonical_cards,'local_service_interface_paths':endpoints,'executed_agent_count':None,'note':'The earlier blanket statement that every named engine had a discoverable A2A card is withdrawn. No substitute cards were fabricated.'}
 census={'schema':'csoai.agent-discovery-census/0.2',**common,'supersedes_sha256':members[NAMES[2]]['sha256'],'previous_report_population':old[NAMES[2]]['population'],'counts':{'declared_engine_names':len(engine_rows),'engine_cards_matching_local_shape':sum(r['a2a_card']['state']=='LOCAL_AGENT_CARD_SHAPE' for r in engine_rows),'canonical_service_cards':len(canonical_cards),'tool_scoped_card_records':len(tool_cards),'distinct_declared_interface_paths':len(endpoints),'executed_agents':None},'canonical_agent_cards':canonical_cards,'tool_scoped_cards':tool_cards,'interface_paths':endpoints,'independent_agent_population':'NOT_ESTABLISHED','note':'Tool-scoped cards sharing a service are not counted as independent agents. This scoped corrective report does not execute A2A or MCP and does not re-sign or amend the historical Merkle material.'}
 prior=old[NAMES[1]];platforms=[]
 for platform in prior['platforms']:
  platforms.append({k:platform[k] for k in ('id','name','vendor')}|{'integration_status':'NOT_TESTED','manifests':[{'format':m['format'],**inspect_reference(public,m['url'])} for m in platform['manifests']]})
 plugin={'schema':'csoai.plugin-manifests/0.2',**common,'supersedes_sha256':members[NAMES[1]]['sha256'],'total_platforms':len(platforms),'declared_manifest_references':sum(len(x['manifests']) for x in platforms),'locally_readable_manifest_files':sum(m['link'] is not None for x in platforms for m in x['manifests']),'platforms':platforms,'install_methods':{'a2a_descriptor':self_card['link'],'mcp_registry':'/.well-known/mcp.json','instructions':'/connect-gspc'},'note':'Readable local format examples are not successful integrations with a vendor product. Missing references remain explicit candidate paths without a clickable capability claim.'}
 archive={'schema':'csoai.historical-discovery-archive/1','status':'SUPERSEDED_UNSIGNED_DECLARATIONS','format':'Exact bytes encoded as base64; decode and compare SHA-256. Values are historical claims, not active connection instructions.','members':members,'signatures_added':False}
 outputs={'public/interop/a2a-engine-cards.json':engine,'public/interop/agent-discovery-census.json':census,'public/interop/ai-platform-plugins.json':plugin,ARCHIVE.lstrip('/'):archive}
 # ARCHIVE is a URL; filesystem output belongs under public, never the project root.
 outputs['public'+ARCHIVE]=outputs.pop(ARCHIVE.lstrip('/'))
 outputs['public/interop/tui-a-agent-enumeration-v0.1.json']={'schema':'csoai.superseded-discovery-report/1','state':'SUPERSEDED_UNVERIFIED_POPULATION','previous_sha256':members[NAMES[2]]['sha256'],'previous_declared_population':old[NAMES[2]]['population'],'replacement':'/interop/agent-discovery-census.json','history_archive':ARCHIVE,'reason':'Original enumeration promoted registry pointers to agent identities without obtaining all card bodies. Original bytes and Merkle claims are retained unchanged as history, not revalidated.','independent_agent_population':None,'new_measurements':0}
 outputs['public/.well-known/agents/get_card.json']=tool_card
 return {rel:(json.dumps(value,indent=2,ensure_ascii=False)+'\n').encode() for rel,value in outputs.items()}

def write_outputs(repo=ROOT,check=False):
 outputs=generate(repo)
 if check:
  for rel,raw in outputs.items():
   if not (repo/rel).is_file() or (repo/rel).read_bytes()!=raw:raise ValueError('Discovery output drift: '+rel)
 else:
  for rel,raw in outputs.items():
   p=repo/rel;p.parent.mkdir(parents=True,exist_ok=True);tmp=p.with_suffix(p.suffix+'.discovery-pending');tmp.write_bytes(raw);os.replace(tmp,p)
 return {k:digest(v) for k,v in outputs.items()}
if __name__=='__main__':
 p=argparse.ArgumentParser(description=__doc__);p.add_argument('--repo',type=Path,default=ROOT);p.add_argument('--check',action='store_true');a=p.parse_args();print(json.dumps({'state':'MATCHED_SOURCE' if a.check else 'GENERATED_FROM_LOCAL_FILES','outputs':write_outputs(a.repo,a.check),'network_calls':0,'executed_agents':0,'public_deployment':False},indent=2))
