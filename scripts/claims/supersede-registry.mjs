#!/usr/bin/env node
/** Add an immutable supersession edge to an unpublished registry candidate. */
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { basename } from 'node:path';
import { canonicalBytes } from '../claim-capture.mjs';
const arg=(k,d)=>{const i=process.argv.indexOf('--'+k); return i>0?process.argv[i+1]:d;};
const priorPath=arg('prior'); const candidatePath=arg('candidate');
const reason=arg('reason','scheduled claim maintenance after an observed public-source change');
if(!priorPath||!candidatePath){console.error('usage: supersede-registry.mjs --prior <published.json> --candidate <unpublished.json> [--reason text]');process.exit(2);}
const sha=b=>createHash('sha256').update(b).digest('hex');
const priorRaw=readFileSync(priorPath); const prior=JSON.parse(priorRaw);
const candidate=JSON.parse(readFileSync(candidatePath,'utf8'));
const before=sha(canonicalBytes({...candidate,registry_digest:undefined}));
if(candidate.registry_digest!==before) throw new Error('candidate registry_digest does not reproduce before supersession');
if(candidate.supersedes) throw new Error('candidate already carries supersedes; refusing to rewrite lineage');
candidate.supersedes={registry_id:prior.registry_id,file:'/claims/'+basename(priorPath),sha256:sha(priorRaw),rule:'supersede by reference, never edit: the prior file bytes remain unchanged at their own URL'};
candidate.superseded_because=reason+' This records a maintenance transition only; a changed source digest is not a verdict about the subject.';
candidate.registry_digest=sha(canonicalBytes({...candidate,registry_digest:undefined}));
writeFileSync(candidatePath,JSON.stringify(candidate,null,1)+'\n');
const check=JSON.parse(readFileSync(candidatePath,'utf8'));
if(sha(canonicalBytes({...check,registry_digest:undefined}))!==check.registry_digest) throw new Error('registry_digest failed after write');
console.log(`SUPERSEDES ${candidate.registry_id} -> ${prior.registry_id} sha256=${candidate.supersedes.sha256}`);
console.log(`registry_digest=${candidate.registry_digest}`);
