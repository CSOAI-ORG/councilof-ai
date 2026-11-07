import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

function fixture(run) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'launcher-capture-'));
  const capture = 'interop/dated-record/mirrors/original.html';
  const bytes = Buffer.from('<!doctype html>\r\n<body>Original third-party 404 capture.\r\n</body>\r\n');
  try {
    fs.mkdirSync(path.join(root,'scripts'),{recursive:true});
    fs.copyFileSync(new URL('./inject-workspace-launcher.mjs',import.meta.url),path.join(root,'scripts/inject-workspace-launcher.mjs'));
    for (const dir of ['public','dist/client']) {
      fs.mkdirSync(path.dirname(path.join(root,dir,capture)),{recursive:true});
      fs.writeFileSync(path.join(root,dir,capture),bytes);
    }
    fs.writeFileSync(path.join(root,'dist/client/index.html'),'<!doctype html><body><h1>Site page</h1></body>');
    const invoke = check => spawnSync(process.execPath,[path.join(root,'scripts/inject-workspace-launcher.mjs'),'--dir','dist/client',...(check?['--check']:[])],{cwd:root,encoding:'utf8'});
    run({root,capture,bytes,invoke});
  } finally { fs.rmSync(root,{recursive:true,force:true}); }
}

test('site chrome is injected once while preserved evidence remains byte-identical',()=>fixture(({root,capture,bytes,invoke})=>{
  assert.equal(invoke(false).status,0);
  assert.equal(invoke(true).status,0);
  assert.equal(invoke(false).status,0);
  assert.deepEqual(fs.readFileSync(path.join(root,'dist/client',capture)),bytes);
  assert.deepEqual(fs.readFileSync(path.join(root,'public',capture)),bytes);
  assert.equal(fs.readFileSync(path.join(root,'dist/client/index.html'),'utf8').split('/council-workspace-launcher.js').length-1,1);
}));

test('both producer and checker refuse an altered evidence capture',()=>fixture(({root,capture,invoke})=>{
  fs.appendFileSync(path.join(root,'dist/client',capture),'<script src="/council-workspace-launcher.js" defer></script>');
  for (const check of [false,true]) {
    const result=invoke(check);assert.equal(result.status,1);assert.match(result.stderr,/immutable HTML captures differ/);
  }
}));

test('missing capture source is uncheckable and cannot pass the byte comparison',()=>fixture(({root,capture,invoke})=>{
  // Settle ordinary pages first, so their missing launcher cannot mask this refusal.
  assert.equal(invoke(false).status,0);
  fs.unlinkSync(path.join(root,'public',capture));
  for (const check of [false,true]) {
    const result=invoke(check);assert.equal(result.status,1);assert.match(result.stderr,/immutable HTML captures differ/);
  }
}));

test('ordinary pages still fail the existing missing and duplicate launcher checks',()=>fixture(({root,invoke})=>{
  const missing=invoke(true);assert.equal(missing.status,1);assert.match(missing.stderr,/missing launcher/);
  assert.equal(invoke(false).status,0);
  fs.appendFileSync(path.join(root,'dist/client/index.html'),'<script src="/council-workspace-launcher.js"></script>');
  const duplicate=invoke(true);assert.equal(duplicate.status,1);assert.match(duplicate.stderr,/duplicate launchers/);
}));

test('a similarly named ordinary directory is not exempted from the launcher check',()=>fixture(({root,invoke})=>{
  const file=path.join(root,'dist/client/interop/not-mirrors/page.html');
  fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,'<body><h1>Site page</h1></body>');
  assert.equal(invoke(false).status,0);
  assert.match(fs.readFileSync(file,'utf8'),/council-workspace-launcher\.js/);
}));
