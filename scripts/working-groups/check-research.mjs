#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { validateResearchPack, assessClaim } from '../../council-os/working-groups/research.mjs';
const root=fileURLToPath(new URL('../../',import.meta.url));
const {values}=parseArgs({options:{'as-of':{type:'string'},'output-format':{type:'string',default:'json'}}});
if (!values['as-of']) throw Error('Supply --as-of YYYY-MM-DD; freshness must not silently use the research date.');
const pack=validateResearchPack(JSON.parse(readFileSync(resolve(root,'council-os/working-groups/research/controlai.json'),'utf8')));
for(const claim of pack.claims)for(const artifact of claim.artifacts){
  const bytes=readFileSync(resolve(root,artifact.path));
  if(createHash('sha256').update(bytes).digest('hex')!==artifact.sha256)throw Error('Artifact digest mismatch: '+artifact.path);
}
const results=pack.claims.map(c=>assessClaim(pack,c.id,{asOf:values['as-of']}));
console.log(JSON.stringify({schema:'csoai.research-usability-result/1',pack:pack.id,asOf:values['as-of'],authorityGranted:false,results},null,2));
// Expected synthetic/superseded records are controls. Expired real observations are a failing check.
if(results.some(r=>['RECHECK_REQUIRED','OUTSIDE_OBSERVATION_WINDOW','NEEDS_EVIDENCE','SCOPE_MISMATCH'].includes(r.outcome)))process.exitCode=1;
