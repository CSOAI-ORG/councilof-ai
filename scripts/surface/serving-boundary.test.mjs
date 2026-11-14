import {test} from 'node:test';import assert from 'node:assert/strict';import {mkdtempSync,mkdirSync,writeFileSync,rmSync} from 'node:fs';import {tmpdir} from 'node:os';import {join} from 'node:path';import {checkServingBoundary} from './serving-boundary.mjs';
function fixture(t){const d=mkdtempSync(join(tmpdir(),'csoai-boundary-test-'));t.after(()=>rmSync(d,{recursive:true,force:true}));writeFileSync(join(d,'index.html'),'fixture');return d;}
test('serving tree has no raw Functions source directory',t=>assert.equal(checkServingBoundary(fixture(t)).state,'PASS'));
test('cannot silently include the private source copy in assets',t=>{const d=fixture(t);mkdirSync(join(d,'functions'));assert.throws(()=>checkServingBoundary(d),/FUNCTION_SOURCE/);});
test('missing build does not pass',t=>{const d=fixture(t);assert.throws(()=>checkServingBoundary(join(d,'missing')),/index missing/);});
