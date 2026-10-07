import {test} from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
const workflow=readFileSync(new URL('../../.github/workflows/deploy.yml',import.meta.url),'utf8');
const buildJob=workflow.match(/^  build-deploy:\n([\s\S]*?)(?=^  [a-z][a-z-]*:|$(?![\s\S]))/m)?.[1];
assert.ok(buildJob,'build-deploy job must exist');
const sourceStep=buildJob.match(/^      - name: Canonical production source — master only\n([\s\S]*?)(?=^      - (?:uses|name):|$(?![\s\S]))/m)?.[1];
assert.ok(sourceStep,'canonical source guard must exist');
const sourceRun=sourceStep.match(/^        run: \|\n((?:^          .*\n?)+)/m)?.[1];
assert.ok(sourceRun,'canonical source guard must have an executable run block');
const sourceGuard=sourceRun.split('\n').map(line=>line.slice(10)).join('\n');
const allowedSource={RELEASE_REPOSITORY:'CSOAI-ORG/councilof-ai',RELEASE_REF:'refs/heads/master',RELEASE_EVENT:'push'};
function runSourceGuard(source){return spawnSync('/bin/bash',['--noprofile','--norc','-e','-o','pipefail','-c',sourceGuard],{env:{PATH:'/usr/bin:/bin',...source},encoding:'utf8',timeout:2000});}
test('source guard is the first step and binds actual GitHub context before checkout or credentials',()=>{
  assert.match(buildJob,/^    steps:\n(?:      #.*\n)*      - name: Canonical production source — master only\n/m);
  for(const [key,context] of [['RELEASE_REPOSITORY','repository'],['RELEASE_REF','ref'],['RELEASE_EVENT','event_name']])assert.ok(sourceStep.includes(key+': ${{ github.'+context+' }}'));
  assert.match(sourceStep,/^        shell: bash$/m);
  assert.doesNotMatch(sourceStep,/continue-on-error|^        if:|secrets\.|\|\| true/m);
});
for(const event of ['push','workflow_dispatch','schedule'])test(`master source accepts the existing ${event} release event`,()=>{
  const result=runSourceGuard({...allowedSource,RELEASE_EVENT:event});
  assert.equal(result.error,undefined);assert.equal(result.status,0,result.stderr);assert.match(result.stdout,/canonical production source accepted/);
});
const deniedSources=[
  ['feature branch',{RELEASE_REF:'refs/heads/codex/fix'}],
  ['main branch',{RELEASE_REF:'refs/heads/main'}],
  ['tag named master',{RELEASE_REF:'refs/tags/master'}],
  ['PR merge ref',{RELEASE_REF:'refs/pull/1/merge',RELEASE_EVENT:'pull_request'}],
  ['PR event with a master ref',{RELEASE_EVENT:'pull_request'}],
  ['fork repository',{RELEASE_REPOSITORY:'other-owner/councilof-ai'}],
  ['workflow_run event',{RELEASE_EVENT:'workflow_run'}],
  ['merge queue event',{RELEASE_EVENT:'merge_group'}],
  ['repository_dispatch event',{RELEASE_EVENT:'repository_dispatch'}],
  ['event with a newline suffix',{RELEASE_EVENT:'workflow_dispatch\n'}],
];
for(const [label,overrides] of deniedSources)test(`source guard rejects ${label}`,()=>{
  const result=runSourceGuard({...allowedSource,...overrides});
  assert.equal(result.error,undefined);assert.equal(result.status,1);assert.match(result.stdout,/::error::/);assert.doesNotMatch(result.stdout,/canonical production source accepted/);
});
for(const field of Object.keys(allowedSource))test(`source guard fails closed when ${field} is missing`,()=>{
  const source={...allowedSource};delete source[field];const result=runSourceGuard(source);
  assert.equal(result.error,undefined);assert.equal(result.status,1);assert.match(result.stdout,/::error::/);assert.doesNotMatch(result.stdout,/canonical production source accepted/);
});
test('every upload targets only the canonical named project and branch',()=>{const lines=workflow.split('\n').filter(l=>l.includes('npx wrangler pages deploy '));assert.equal(lines.length,3);for(const line of lines){assert.match(line,/--project-name=councilof-ai\s+--branch=master\s/);assert.doesNotMatch(line,/--branch=(main|production)\b/);}});
test('initial deployment follows live target preflight',()=>{const gate=workflow.indexOf('Production target and binding preflight');const deploy=workflow.indexOf('- name: Deploy → councilof.ai');assert.ok(gate>0&&deploy>gate);assert.ok(workflow.slice(gate,deploy).includes('node scripts/review/pages-release-target.mjs --config wrangler.jsonc --branch master'));});
test('both automatic retry paths revalidate target before uploading',()=>{for(const name of ['Anti-clobber —','Confirm gated tree still holds']){const i=workflow.indexOf('- name: '+name);assert.ok(i>0);const rest=workflow.slice(i);const upload=rest.indexOf('npx wrangler pages deploy');const check=rest.indexOf('node scripts/review/pages-release-target.mjs');assert.ok(check>0&&upload>check);}});
test('serial write owner and main-site push rule remain unchanged',()=>{assert.match(workflow,/branches: \[master\]/);assert.match(workflow,/concurrency: \{ group: site-deploy, cancel-in-progress: false \}/);});
test('preflight failure is not ignored',()=>{const start=workflow.indexOf('Production target and binding preflight');const end=workflow.indexOf('- name: Deploy → councilof.ai');assert.doesNotMatch(workflow.slice(start,end),/continue-on-error|\|\| true/);});
