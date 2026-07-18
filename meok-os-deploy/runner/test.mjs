import { spawn } from 'node:child_process';
// 1) fetch a live SAP, save locally (then everything else is offline-capable)
const sap = await (await fetch('https://os.meok.ai/api/sap?name=Aria&archetype=dragon')).json();
const fs = await import('node:fs'); fs.writeFileSync('/tmp/aria.sap.json', JSON.stringify(sap));
// 2) spawn the runner against the local file
const p = spawn('node', ['meok-sap-runner.mjs', '--sap', '/tmp/aria.sap.json']);
let out = ''; p.stdout.on('data', d => out += d); let err=''; p.stderr.on('data', d => err += d);
const send = o => p.stdin.write(JSON.stringify(o) + '\n');
send({ jsonrpc:'2.0', id:1, method:'initialize' });
send({ jsonrpc:'2.0', id:2, method:'tools/list' });
send({ jsonrpc:'2.0', id:3, method:'tools/call', params:{ name:'identity' } });
send({ jsonrpc:'2.0', id:4, method:'tools/call', params:{ name:'boot' } });
send({ jsonrpc:'2.0', id:5, method:'tools/call', params:{ name:'talk', arguments:{ message:'hello in 3 words' } } });
await new Promise(r => setTimeout(r, 7000)); p.kill();
const msgs = out.trim().split('\n').filter(Boolean).map(l=>JSON.parse(l));
const byId = id => msgs.find(m=>m.id===id);
let pass=0,fail=0; const ck=(n,c)=>{ c?pass++:fail++; console.log((c?'  ok   ':'  FAIL ')+n); };
ck('stderr shows offline signature VERIFY', /VALID ✓/.test(err));
ck('initialize → serverInfo meok-sap-runner + verified flag', byId(1)?.result?.serverInfo?.name==='meok-sap-runner' && byId(1)?.result?.serverInfo?.verified===true);
ck('tools/list has talk+brain_status+boot+identity', ['talk','brain_status','boot','identity'].every(t=>(byId(2)?.result?.tools||[]).some(x=>x.name===t)));
ck('identity → VERIFIED + fingerprint', /VERIFIED ✓ SOV:/.test(byId(3)?.result?.content?.[0]?.text||''));
ck('boot → OS + 3D world url', /os\.meok\.ai/.test(byId(4)?.result?.content?.[0]?.text||'') && /earth3d/.test(byId(4)?.result?.content?.[0]?.text||''));
ck('talk → answers + shows brain route (offline→online fallback)', /— via (offline:|online:|stub)/.test(byId(5)?.result?.content?.[0]?.text||''));
console.log('\n'+(fail===0?'✅ RUNNER PASS':'❌ FAIL')+' — '+pass+' passed, '+fail+' failed');
process.exit(fail?1:0);
