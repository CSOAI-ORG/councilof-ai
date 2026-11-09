import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {charterKit} from './render-kit.mjs';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'../..');
const read=name=>readFileSync(resolve(root,name),'utf8');
const doctrine=JSON.parse(read('council-os/distribution.json')).doctrine;
test('website and HF receive identical register and page bytes',()=>{
 const files=charterKit(read,doctrine);
 for(const name of ['index.html','discussion.html','register.json','manifest.json']) assert.equal(files.get('public/charter-register/'+name),files.get('distribution/charter-federation/hf/'+name));
 assert.match(files.get('public/charter-register/index.html'),/Read sources without JavaScript/);
});
test('stale canonical tracker refuses all exports',()=>{
 assert.throws(()=>charterKit(name=>name==='council-os/working-group-tracker.json'?read(name)+' ':read(name),doctrine),/Stale charter input/);
});
test('changed generated page refuses export',()=>{
 assert.throws(()=>charterKit(name=>name==='packages/charter-federation/tracker.html'?read(name)+' ':read(name),doctrine),/Stale charter output/);
});
test('notebook starts offline and retains the public evidence limitation',()=>{
 const files=charterKit(read,doctrine), meta=JSON.parse(files.get('distribution/charter-federation/kaggle/kernel-metadata.template.json'));
 assert.equal(meta.is_private,'true');assert.equal(meta.enable_gpu,'false');assert.equal(meta.enable_internet,'false');
 const nb=JSON.parse(files.get('distribution/charter-federation/kaggle/charter-register.ipynb'));
 assert.match(nb.cells[0].source.join(''),/No legal applicability/);
 assert.match(nb.cells[1].source.join(''),/hashlib.sha256/);
});
