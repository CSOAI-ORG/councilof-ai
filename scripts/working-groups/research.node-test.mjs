import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {validateResearchPack,assessClaim} from '../../council-os/working-groups/research.mjs';
import {renderResearch} from './render-research.mjs';
import {Client} from '@modelcontextprotocol/client';
import {StdioClientTransport} from '@modelcontextprotocol/client/stdio';
const root=fileURLToPath(new URL('../../',import.meta.url));
const pack=JSON.parse(readFileSync(root+'council-os/working-groups/research/controlai.json','utf8'));
test('public source registry and crosswalk preserve dated research boundaries',()=>{
  validateResearchPack(pack);
  assert.equal(pack.sources.length,40);assert.equal(pack.crosswalk.length,12);assert.equal(pack.claims.length,6);
  const source=id=>pack.sources.find(s=>s.id===id);
  assert.equal(source('S12').legalStatus,'organisation-draft');
  assert.equal(source('S15').legalStatus,'not-moved');
  assert.equal(source('S16').authority,'author-submission-hosted-by-parliament');
  assert.ok(pack.sources.every(s=>s.sourceBytesSha256===null));
  const groups=JSON.parse(readFileSync(root+'council-os/working-groups.json','utf8')).groups;
  for(const x of pack.crosswalk)assert.ok(groups.some(g=>g.id===x.groupId));
});
test('unsupported endorsement and superseded legal-name record cannot become review-ready',()=>{
  const outcomes=pack.claims.map(c=>assessClaim(pack,c.id,{asOf:'2026-10-30'}).outcome);
  assert.deepEqual(outcomes,['READY_FOR_HUMAN_REVIEW','READY_FOR_HUMAN_REVIEW','READY_FOR_HUMAN_REVIEW','SYNTHETIC_FIXTURE','SUPERSEDED','READY_FOR_HUMAN_REVIEW']);
  const x=structuredClone(pack);x.claims[3].synthetic=false;x.claims[3].use='organisation-practice';
  assert.equal(assessClaim(x,'CL04',{asOf:'2026-10-30'}).outcome,'NEEDS_EVIDENCE');
});
test('reliance date is mandatory; expired and premature observations are refused',()=>{
  assert.throws(()=>assessClaim(pack,'CL01'),/date/);
  assert.equal(assessClaim(pack,'CL01',{asOf:'2026-11-06'}).outcome,'RECHECK_REQUIRED');
  assert.equal(assessClaim(pack,'CL01',{asOf:'2026-10-29'}).outcome,'OUTSIDE_OBSERVATION_WINDOW');
  assert.throws(()=>assessClaim(pack,'CL01',{asOf:'not-a-date'}));
  assert.throws(()=>assessClaim(pack,'unknown',{asOf:'2026-10-30'}));
});
test('a changed model, tool, permission, environment or method cannot inherit the runtime result',()=>{
  for(const key of ['model','tools','permissions','environment','method']){
    const runtime=structuredClone(pack.claims[2].runtime);runtime[key]=Array.isArray(runtime[key])?['changed']: 'changed';
    assert.equal(assessClaim(pack,'CL03',{asOf:'2026-10-30',runtime}).outcome,'SCOPE_MISMATCH');
  }
});
for(const [label,mutate] of [
  ['authority promotion',x=>x.authorityGranted=true],
  ['invented partnership',x=>x.partnershipEstablished=true],
  ['unestablished licence',x=>x.sourceContentLicenceGranted=true],
  ['invented source-byte hash',x=>x.sources[0].sourceBytesSha256='a'.repeat(64)],
  ['private source URL',x=>x.sources[0].url='https://chatgpt.com/library/private'],
  ['script source URL',x=>x.sources[0].url='javascript:alert(1)'],
  ['missing source reference',x=>x.claims[0].sourceIds=['S999']],
  ['unsupported observed result',x=>x.claims[2].artifacts=[]],
  ['unlabelled fixture',x=>x.claims[3].synthetic=false],
  ['broken correction chain',x=>x.claims[4].supersededBy='CL01'],
  ['unsupported policy authority',x=>x.claims[0].sourceIds=['S12']],
  ['mapping promoted to adoption',x=>x.crosswalk[0].status='ADOPTED'],
  ['fabricated human review',x=>x.claims[0].humanReview={reviewer:'test'}],
  ['artifact path traversal',x=>x.claims[2].artifacts[0].path='../../secret'],
])test(label+' is rejected',()=>{const x=structuredClone(pack);mutate(x);assert.throws(()=>validateResearchPack(x));});
test('retained local fixture bytes match the actual digest and replay intentional failures',()=>{
  const artifact=pack.claims[2].artifacts[0],bytes=readFileSync(root+artifact.path);
  assert.equal(createHash('sha256').update(bytes).digest('hex'),artifact.sha256);
  const replay=spawnSync(process.execPath,['scripts/hitl/revocation-latency.mjs','--check',artifact.path],{cwd:root,encoding:'utf8'});
  assert.equal(replay.status,1,replay.stderr);assert.match(replay.stdout,/INCONCLUSIVE/);assert.match(replay.stdout,/FAIL/);
});
test('CLI is dated, checks local bytes and fails expired reliance',()=>{
  const run=asOf=>spawnSync(process.execPath,['scripts/working-groups/check-research.mjs','--as-of',asOf],{cwd:root,encoding:'utf8'});
  assert.equal(run('2026-10-30').status,0);
  const old=run('2026-11-06');assert.equal(old.status,1);assert.match(old.stdout,/RECHECK_REQUIRED/);
});
test('HTML preserves synthetic warning, corrections and escapes untrusted source text',()=>{
  const x=structuredClone(pack);x.sources[0].title='<script>window.bad=true</script>';
  const html=renderResearch(x);assert.match(html,/&lt;script&gt;/);assert.ok(!html.includes('<script>'));
  assert.match(html,/Deliberately unsupported synthetic/);assert.match(html,/#CL06/);assert.match(html,/not-moved/);
});
test('real stdio protocol returns the same evidence pack and refuses stale/unknown/undated reliance',async()=>{
  const transport=new StdioClientTransport({command:process.execPath,args:[root+'mcp/working-groups-preview/server.mjs'],stderr:'pipe'});
  const client=new Client({name:'research-evidence-test',version:'1.0.0'});
  try{
    await client.connect(transport);
    const tool=(await client.listTools()).tools.find(t=>t.name==='working_group_research');
    assert.equal(tool.annotations.readOnlyHint,true);assert.equal(tool.annotations.openWorldHint,false);
    const result=await client.callTool({name:tool.name,arguments:{packId:pack.id,asOf:'2026-10-30'}});
    assert.deepEqual(result.structuredContent.pack,pack);
    const stale=await client.callTool({name:tool.name,arguments:{packId:pack.id,asOf:'2026-11-06'}});
    assert.equal(stale.structuredContent.results[0].outcome,'RECHECK_REQUIRED');
    for(const args of [{packId:pack.id},{packId:'unknown',asOf:'2026-10-30'}]){
      let refused=false;try{refused=(await client.callTool({name:tool.name,arguments:args})).isError===true;}catch{refused=true;}assert.equal(refused,true);
    }
  }finally{await client.close();}
});
