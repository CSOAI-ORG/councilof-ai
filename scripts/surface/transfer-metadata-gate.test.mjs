import {test} from 'node:test';import assert from 'node:assert/strict';import {mkdtempSync,mkdirSync,writeFileSync,symlinkSync,rmSync} from 'node:fs';import {tmpdir} from 'node:os';import {join} from 'node:path';import {checkTransferMetadata} from './transfer-metadata-gate.mjs';
function root(t){const d=mkdtempSync(join(tmpdir(),'metadata-guard-fixture-'));t.after(()=>rmSync(d,{recursive:true,force:true}));return d;}
test('clean assets pass without rewriting bytes',t=>{const d=root(t);writeFileSync(join(d,'index.html'),'fixture');assert.equal(checkTransferMetadata(d).state,'PASS');});
test('AppleDouble sidecar blocks serving',t=>{const d=root(t);writeFileSync(join(d,'._index.html'),Buffer.from('00051607','hex'));assert.throws(()=>checkTransferMetadata(d),/TRANSPORT_METADATA/);});
test('nested metadata directory blocks serving',t=>{const d=root(t);mkdirSync(join(d,'.AppleDouble'));assert.throws(()=>checkTransferMetadata(d),/TRANSPORT_METADATA/);});
test('legitimate well-known descriptors remain supported',t=>{const d=root(t);mkdirSync(join(d,'.well-known'));writeFileSync(join(d,'.well-known/did.json'),'{}');assert.equal(checkTransferMetadata(d).state,'PASS');});
test('symlinks cannot hide a different serving tree',t=>{const d=root(t);symlinkSync('/etc/hosts',join(d,'indirect'));assert.throws(()=>checkTransferMetadata(d),/SYMLINK/);});
