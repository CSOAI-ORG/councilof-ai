import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
test('the native bundle is a gated deterministic producer',()=>{
 const rows=JSON.parse(read('docs/operations/PRODUCERS.json')).producers.filter(p=>p.id==='native-council-panel');
 assert.equal(rows.length,1);assert.equal(rows[0].gated,true);assert.equal(rows[0].mode,'delegate-to-check');
 assert.equal(rows[0].check,'node scripts/build-council-native-panel.mjs --check');
 assert.deepEqual(rows[0].outputs,['public/native-panel/index.html','public/native-panel/resource.json']);
});
test('production checks exact native bytes before building the site',()=>{
 const y=read('.github/workflows/deploy.yml');const guard=y.indexOf('node scripts/build-council-native-panel.mjs --check');const build=y.indexOf('npm run build:client');
 assert(guard>=0&&guard<build);assert.equal(y.includes('continue-on-error: true\n        run: |\n          node scripts/build-council-native-panel'),false);
});
test('source workflow still exercises generator, protocols and negative controls',()=>{
 const y=read('.github/workflows/native-council-panel.yml');
 for(const s of ['node scripts/build-council-native-panel.mjs --check','node scripts/test-council-native-panel.mjs','node scripts/test-council-panel-controls.mjs','functions/mcp/mcp-free-door.test.ts','docs/operations/PRODUCERS.json','scripts/surface/native-panel-release.node-test.mjs'])assert(y.includes(s),s);
});
