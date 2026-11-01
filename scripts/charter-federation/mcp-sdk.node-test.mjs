import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {Client} from '@modelcontextprotocol/client';
import {StdioClientTransport} from '@modelcontextprotocol/client/stdio';
const root=new URL('../../',import.meta.url);
test('SDK client reads a charter source and obtains an unsent group-bound draft over stdio',async()=>{
 const path=new URL('packages/charter-federation/register.json',root);
 const before=readFileSync(path,'utf8'), envelope=JSON.parse(before);
 const transport=new StdioClientTransport({command:'python3',args:['-B',fileURLToPath(new URL('packages/charter-federation/mcp_server.py',root))],stderr:'pipe'});
 const client=new Client({name:'charter-participation-test',version:'1.0.0'});
 try{
  await client.connect(transport);
  const list=await client.listTools();
  assert.deepEqual(list.tools.map(t=>t.name).sort(),['charter_prepare_change','charter_provision','charter_sources']);
  assert.ok(list.tools.every(t=>t.annotations.readOnlyHint===true));
  const source=await client.callTool({name:'charter_sources',arguments:{query:'ietf'}});
  assert.equal(source.isError,false);assert.equal(JSON.parse(source.content[0].text).matches[0].id,'ietf');
  const draft=await client.callTool({name:'charter_prepare_change',arguments:{source_id:'ietf',expected_register_sha256:envelope.sha256,rationale:'Review the accessible participation and dissent process.'}});
  assert.equal(draft.isError,false);const p=JSON.parse(draft.content[0].text).proposal;
  assert.equal(p.state,'DRAFT_NOT_SUBMITTED');assert.equal(p.may_execute,false);assert.equal(p.human_approval,false);
  assert.equal(p.tracker_sha256,envelope.register.inputs.tracker.sha256);assert.ok(p.review_routes.length>0);
  for(const args of [{source_id:'ietf',expected_register_sha256:'stale',rationale:'Review the accessible participation process.'},{source_id:'ietf',expected_register_sha256:envelope.sha256,rationale:'Review the accessible participation process.',approve:true}]){
   const bad=await client.callTool({name:'charter_prepare_change',arguments:args});assert.equal(bad.isError,true);
  }
  assert.equal(readFileSync(path,'utf8'),before);
 }finally{await client.close();}
});
