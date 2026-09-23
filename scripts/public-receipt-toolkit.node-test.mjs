import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {derive,render,ROOT,SOURCE,OUTPUT,MANIFEST,GUIDE} from './build-public-receipt-toolkit.mjs';
const hash=b=>createHash('sha256').update(b).digest('hex');
function fixture(fn){const root=fs.mkdtempSync(path.join(os.tmpdir(),'csoai-receipt-copy-'));try{fs.mkdirSync(path.join(root,'scripts'));fs.copyFileSync(path.join(ROOT,SOURCE),path.join(root,SOURCE));return fn(root);}finally{fs.rmSync(root,{recursive:true,force:true});}}
test('source copy byte parity',()=>assert.deepEqual(derive().get(OUTPUT),fs.readFileSync(path.join(ROOT,SOURCE))));
test('deterministic outputs',()=>assert.deepEqual([...derive()],[...derive()]));
test('manifest binds code and guide',()=>{const d=derive();const m=JSON.parse(d.get(MANIFEST));assert.equal(hash(d.get(OUTPUT)),m.artifact.sha256);assert.equal(d.get(OUTPUT).length,m.artifact.bytes);assert.equal(hash(d.get(GUIDE)),m.guide.sha256);});
test('no stronger settlement claim',()=>{const m=JSON.parse(derive().get(MANIFEST));assert.equal(m.scope.payment_verified,false);assert.equal(m.scope.receipt_freshness_verified,false);assert.equal(m.scope.measurement_truth_verified,false);});
test('local saved key replay described',()=>{const s=derive().get(GUIDE).toString();assert.match(s,/file:\/\/\$\(pwd\)\/did.json/);assert.match(s,/not that the key is currently published/);});
test('dependency not hidden',()=>assert.equal(JSON.parse(derive().get(MANIFEST)).runtime.external_dependency,'cryptography'));
test('separate card formats retained',()=>{const x=JSON.parse(derive().get(MANIFEST)).related_verifiers;assert.equal(new Set(Object.values(x)).size,3);});
test('check fails before generation',()=>fixture(root=>assert.throws(()=>render(root,true))));
test('check passes generated files',()=>fixture(root=>{render(root);assert.equal(render(root,true).state,'SOURCE_PARITY_VERIFIED');}));
test('modified served script blocks release',()=>fixture(root=>{render(root);fs.appendFileSync(path.join(root,OUTPUT),'\n# drift');assert.throws(()=>render(root,true),/drift/);}));
test('modified manifest blocks release',()=>fixture(root=>{render(root);fs.writeFileSync(path.join(root,MANIFEST),'{}');assert.throws(()=>render(root,true),/drift/);}));
test('source revision needs regeneration',()=>fixture(root=>{render(root);fs.appendFileSync(path.join(root,SOURCE),'\n# new source');assert.throws(()=>render(root,true),/drift/);render(root);assert.equal(render(root,true).state,'SOURCE_PARITY_VERIFIED');}));
test('source symlink rejected',()=>fixture(root=>{const p=path.join(root,SOURCE);fs.renameSync(p,p+'.save');fs.symlinkSync(p+'.save',p);assert.throws(()=>derive(root),/Symlink/);}));
test('output symlink rejected',()=>fixture(root=>{render(root);const p=path.join(root,OUTPUT);fs.unlinkSync(p);fs.symlinkSync(path.join(root,SOURCE),p);assert.throws(()=>render(root),/symlink/i);}));
test('quickstart companion points to same-site checker',()=>{const x=JSON.parse(fs.readFileSync(path.join(ROOT,'public/quickstart.json')));const v=x.steps.find(s=>s.name==='verify');assert.equal(v.offer_receipt_checker.url,'https://councilof.ai/verifier/verify_receipt.py');assert.equal(v.also.some(x=>x.includes('raw.githubusercontent.com')),false);});
test('human quickstart has no GitHub checker fetch',()=>{const x=fs.readFileSync(path.join(ROOT,'client/src/pages/Quickstart.tsx'),'utf8');assert.match(x,/https:\/\/councilof.ai\/verifier\/verify_receipt.py/);assert.equal(x.includes('raw.githubusercontent.com/CSOAI-ORG/councilof-ai'),false);});
test('LLM templates link actual separate same-site code',()=>{const x=fs.readFileSync(path.join(ROOT,'scripts/llms/llms.txt.tmpl'),'utf8');assert.match(x,/https:\/\/councilof.ai\/spec\/claim-maintenance\/v0.1\/reference\/claim-capture.mjs/);assert.match(x,/https:\/\/councilof.ai\/verifier\/verify_receipt.py/);assert.equal(x.includes('scripts/claim-capture.mjs in https://github.com'),false);});
test('source parity gate is in existing build',()=>{const x=JSON.parse(fs.readFileSync(path.join(ROOT,'package.json')));assert.ok(x.scripts['build:client'].startsWith('node scripts/build-public-receipt-toolkit.mjs --check && '));});
test('discovery and receipt responses name downloadable code',()=>{for(const f of ['functions/.well-known/x402.json.ts','functions/api/x402.ts','functions/api/receipts/index.ts','functions/api/receipts/verify.ts']){const s=fs.readFileSync(path.join(ROOT,f),'utf8');assert.match(s,/https:\/\/councilof.ai\/verifier\/verify_receipt.py/);assert.equal(s.includes('verify_receipt.py in github.com'),false);}});
test('OpenAPI generator and output retain same-site verification path',()=>{for(const f of ['scripts/build_openapi.py','public/openapi.json'])assert.match(fs.readFileSync(path.join(ROOT,f),'utf8'),/https:\/\/councilof.ai\/verifier\/verify_receipt.py/);});
test('LLM generated outputs match same-site guidance',()=>{for(const f of ['public/llms.txt','public/llms-full.txt']){const s=fs.readFileSync(path.join(ROOT,f),'utf8');assert.match(s,/https:\/\/councilof.ai\/verifier\/receipt-toolkit.json/);assert.equal(s.includes('scripts/claim-capture.mjs in https://github.com'),false);}});

test('chain scope is explicit and fail-closed',()=>{const m=JSON.parse(derive().get(MANIFEST));assert.equal(m.scope.chain_check_profile,'eip155-receipt-status/1.1');assert.equal(m.scope.chain_check.unknown_exit,2);assert.equal(m.scope.chain_check.reverted_exit,1);assert.equal(m.scope.chain_check.transfer_details_verified,false);assert.equal(m.scope.chain_check.finality_verified,false);});
test('chain request budget remains two read-only calls',()=>{const m=JSON.parse(derive().get(MANIFEST));assert.equal(m.scope.chain_check.maximum_read_only_RPC_calls_per_artifact,2);const s=derive().get(GUIDE).toString();assert.match(s,/no redirects or retries/);assert.match(s,/Pending or missing receipts/);});
test('chain regression tests are mandatory in build',()=>{const p=JSON.parse(fs.readFileSync(path.join(ROOT,'package.json')));assert.ok(p.scripts['build:client'].includes('python3 scripts/test_receipt_chain_result.py'));});

test('transfer extension is opt-in and pins the request',()=>{const s=JSON.parse(derive().get(MANIFEST)).scope;assert.equal(s.transfer_check_profile,'eip155-exact-erc20-event/1.0');assert.equal(s.transfer_check.caller_pinned_expectation_required,true);assert.equal(s.transfer_check.exact_signed_resource_including_query,true);});
test('transfer scope never claims delivery or revenue',()=>{const t=JSON.parse(derive().get(MANIFEST)).scope.transfer_check;for(const k of ['revenue_added','delivered_payload_verified','finality_verified','net_balance_change_verified','zero_value_purchase_allowed','self_transfer_is_customer'])assert.equal(t[k],false);assert.equal(t.maximum_read_only_RPC_calls_per_artifact,2);});
test('machine-readable expectation schema keeps amounts as strings',()=>{const s=JSON.parse(derive().get(MANIFEST)).transfer_expectation_schema;assert.equal(s.additionalProperties,false);assert.equal(s.properties.amount_atomic.type,'string');assert.ok(s.required.includes('resource_url'));});
test('new transfer regression is part of existing build',()=>{const p=JSON.parse(fs.readFileSync(path.join(ROOT,'package.json')));assert.ok(p.scripts['build:client'].includes('python3 scripts/test_exact_transfer.py && '));});
