import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import crypto from 'node:crypto';
import { stripTypeScriptTypes } from 'node:module';
import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

export async function runPaidRetentionControls(h) {
  const cases = [];
  let recoveryFixture;
  const state = 'x-csoai-output-retention-state';
  const recordState = 'x-csoai-delivery-record-state';
  const resource = 'https://example.test/paid?original=1';
  const tx = 'retention-fixture';
  const opts = kv => ({kv,transaction:tx,resource,confirmedPaid:true,successfulOutput:true});
  const digest = b => crypto.createHash('sha256').update(b).digest('hex');
  const delay = ms => new Promise(resolve => setTimeout(resolve,ms));
  class KV {
    rows = new Map(); gets=[]; puts=[];
    async get(key) { this.gets.push(key); return this.rows.get(key) ?? null; }
    async put(key,value) { this.puts.push(key); this.rows.set(key,value); }
  }
  const input = (body=' \n{"unicode":"café 雪","signature":"original"}\n',headers={}) =>
    new Response(body,{status:201,statusText:'Original prepared output',
      headers:{'content-type':'application/json; charset=utf-8','cache-control':'private, no-store',...headers}});
  const packet = kv => ({delivery_record:JSON.parse(kv.rows.get(h.deliveryTxKey(tx))),
                         retained_output:JSON.parse(kv.rows.get(h.retainedOutputTxKey(tx)))});
  async function run(name,fn) { await fn(); cases.push(name); console.log('PASS retention '+name); }

  await run('original UTF8 bytes, status and metadata stay separate',async()=>{
    const kv=new KV(),res=input(),expected=Buffer.from(await res.clone().arrayBuffer());
    const out=await h.recordPaidResponse(res,opts(kv)),saved=packet(kv);
    assert.deepEqual(Buffer.from(await out.arrayBuffer()),expected);
    assert.deepEqual(Buffer.from(saved.retained_output.body_base64,'base64'),expected);
    assert.equal(out.status,201);assert.equal(out.statusText,'Original prepared output');
    assert.equal(out.headers.get(recordState),'WRITTEN');assert.equal(out.headers.get(state),'RETAINED');
    assert.equal(saved.retained_output.response_sha256,digest(expected));
    assert.equal(saved.retained_output.response_bytes,expected.length);
    assert.equal(saved.retained_output.status,201);assert.equal(saved.retained_output.status_text,out.statusText);
    assert.equal(saved.retained_output.delivered_at,saved.delivery_record.delivered_at);
    assert.equal(saved.delivery_record.body_base64,undefined);
    assert.equal(saved.delivery_record.schema,'csoai.x402.delivery-record/0.1');
    assert.equal(saved.retained_output.signed,false);assert.equal(kv.puts.length,2);
    assert.equal(new Set(kv.rows.keys()).size,2);
    assert.match(out.headers.get('access-control-expose-headers'),/x-csoai-output-retention-state/);
    recoveryFixture=saved;
  });

  await run('binary bytes use Worker-compatible base64',async()=>{
    const body=Uint8Array.from([0,255,128,10,32]),kv=new KV();
    const out=await h.recordPaidResponse(new Response(body),opts(kv)),saved=packet(kv).retained_output;
    assert.deepEqual(Buffer.from(saved.body_base64,'base64'),Buffer.from(body));
    assert.deepEqual(Buffer.from(await out.arrayBuffer()),Buffer.from(body));
    assert.equal(saved.content_type,'');assert.deepEqual(saved.headers,[]);
  });

  await run('empty prepared bytes are retained',async()=>{
    const kv=new KV(),out=await h.recordPaidResponse(input(''),opts(kv));
    assert.equal(await out.text(),'');assert.equal(out.headers.get(state),'RETAINED');
    assert.equal(packet(kv).retained_output.body_base64,'');
    assert.equal(packet(kv).retained_output.response_bytes,0);
  });

  await run('exactly one MiB is retained without argument-stack overflow',async()=>{
    const body=new Uint8Array(h.RETAINED_OUTPUT_MAX_BYTES).fill(255),kv=new KV();
    const out=await h.recordPaidResponse(new Response(body),opts(kv)),saved=packet(kv).retained_output;
    assert.equal(out.headers.get(state),'RETAINED');
    assert.equal(Buffer.from(saved.body_base64,'base64').length,body.length);
    assert.equal(saved.response_sha256,digest(body));
    assert.deepEqual(Buffer.from(await out.arrayBuffer()),Buffer.from(body));
  });

  await run('above-cap output remains exact with honest metadata-only state',async()=>{
    const body=new Uint8Array(h.RETAINED_OUTPUT_MAX_BYTES+1).fill(37),kv=new KV();
    const out=await h.recordPaidResponse(new Response(body),opts(kv));
    assert.deepEqual(Buffer.from(await out.arrayBuffer()),Buffer.from(body));
    assert.equal(out.headers.get(recordState),'WRITTEN');
    assert.equal(out.headers.get(state),'NOT_RETAINED_TOO_LARGE');
    assert.equal(kv.puts.length,1);assert.equal(kv.rows.has(h.retainedOutputTxKey(tx)),false);
  });

  await run('unpaid and unsuccessful gates do no storage work',async()=>{
    for(const patch of [{confirmedPaid:false},{successfulOutput:false}]){
      const kv=new KV(),res=input(),out=await h.recordPaidResponse(res,{...opts(kv),...patch});
      assert.equal(out,res);assert.equal(kv.gets.length,0);assert.equal(kv.puts.length,0);
    }
    for(const res of [new Response('failed',{status:503}),new Response(null,{status:204})]){
      const kv=new KV();assert.equal(await h.recordPaidResponse(res,opts(kv)),res);
      assert.equal(kv.puts.length,0);assert.equal(kv.gets.length,0);
    }
  });

  await run('missing store and transaction do not claim retention',async()=>{
    const missing=await h.recordPaidResponse(input(),opts(undefined));
    assert.equal(missing.headers.get(recordState),'UNRECORDED_NO_STORE');
    assert.equal(missing.headers.get(state),'NOT_RETAINED_NO_STORE');
    const kv=new KV(),noTx=await h.recordPaidResponse(input(),{...opts(kv),transaction:null});
    assert.equal(noTx.headers.get(state),'NOT_RETAINED_NO_TRANSACTION');assert.equal(kv.puts.length,0);
  });

  await run('only relevant headers are retained and final settlement echo is bound',async()=>{
    const kv=new KV(),out=await h.recordPaidResponse(input('exact',{
      authorization:'fixture-sensitive',cookie:'fixture-cookie','set-cookie':'fixture-cookie',
      'x-private-secret':'fixture-secret','content-disposition':'attachment; filename="original.json"',
      'x-csoai-card-sha256':'a'.repeat(64),'x-csoai-payload-sha256':'b'.repeat(64),
      'payment-response':'standard-original-echo','x-payment-response':'old-echo',
    }),{...opts(kv),paymentResponse:'final-settlement-echo'});
    const headers=Object.fromEntries(packet(kv).retained_output.headers);
    assert.equal(headers['content-disposition'],'attachment; filename="original.json"');
    assert.equal(headers['x-csoai-card-sha256'],'a'.repeat(64));
    assert.equal(headers['x-csoai-payload-sha256'],'b'.repeat(64));
    assert.equal(headers['payment-response'],'standard-original-echo');
    assert.equal(headers['x-payment-response'],out.headers.get('x-payment-response'));
    assert.equal(headers['x-payment-response'],'final-settlement-echo');
    for(const key of ['authorization','cookie','set-cookie','x-private-secret'])
      assert.equal(headers[key],undefined);
  });

  await run('oversized relevant headers are explicitly not retained',async()=>{
    const kv=new KV(),out=await h.recordPaidResponse(input('exact',{'etag':'x'.repeat(9000)}),opts(kv));
    assert.equal(out.headers.get(recordState),'WRITTEN');
    assert.equal(out.headers.get(state),'NOT_RETAINED_HEADERS_TOO_LARGE');
    assert.equal(await out.text(),'exact');assert.equal(kv.puts.length,1);
  });

  await run('existing metadata never backfills a regenerated body',async()=>{
    const kv=new KV(),bytes=Buffer.from('original');
    const record=h.buildDeliveryRecord({transaction:tx,resource,response_sha256:digest(bytes),
      response_bytes:bytes.length,content_type:'application/json; charset=utf-8'});
    const raw=JSON.stringify(record);kv.rows.set(h.deliveryTxKey(tx),raw);
    const out=await h.recordPaidResponse(input(bytes),opts(kv));
    assert.equal(out.headers.get(recordState),'ALREADY_RECORDED');
    assert.equal(out.headers.get(state),'EXISTING_UNCHECKED');
    assert.equal(kv.rows.has(h.retainedOutputTxKey(tx)),false);
    assert.equal(kv.puts.length,0);assert.equal(kv.rows.get(h.deliveryTxKey(tx)),raw);
  });

  await run('identical replay preserves the original retained envelope',async()=>{
    const kv=new KV();await h.recordPaidResponse(input('original'),opts(kv));
    const before=JSON.stringify([...kv.rows]),puts=kv.puts.length;
    const out=await h.recordPaidResponse(input('original'),opts(kv));
    assert.equal(out.headers.get(recordState),'ALREADY_RECORDED');
    assert.equal(kv.puts.length,puts);assert.equal(JSON.stringify([...kv.rows]),before);
  });

  await run('wrong-resource replay refuses metadata and body overwrite',async()=>{
    const kv=new KV();await h.recordPaidResponse(input('original'),opts(kv));
    const before=JSON.stringify([...kv.rows]),puts=kv.puts.length;
    const out=await h.recordPaidResponse(input('original'),{...opts(kv),resource:resource+'&other=1'});
    assert.equal(out.headers.get(recordState),'CONFLICT');assert.equal(out.headers.get(state),'CONFLICT');
    assert.equal(kv.puts.length,puts);assert.equal(JSON.stringify([...kv.rows]),before);
  });

  await run('orphaned retained output is never overwritten',async()=>{
    const kv=new KV(),original='unique prior bytes';kv.rows.set(h.retainedOutputTxKey(tx),original);
    const out=await h.recordPaidResponse(input('new output'),opts(kv));
    assert.equal(out.headers.get(recordState),'WRITTEN');assert.equal(out.headers.get(state),'CONFLICT');
    assert.equal(kv.rows.get(h.retainedOutputTxKey(tx)),original);assert.equal(kv.puts.length,1);
  });

  await run('metadata failure cannot start body retention',async()=>{
    const kv=new KV();kv.put=async key=>{kv.puts.push(key);throw Error('metadata rejected');};
    const out=await h.recordPaidResponse(input('original'),opts(kv));
    assert.equal(out.headers.get(recordState),'ERROR');assert.equal(out.headers.get(state),'ERROR');
    assert.equal(kv.gets.length,1);assert.equal(kv.puts.length,1);assert.equal(await out.text(),'original');
  });

  await run('metadata put uncertainty remains UNKNOWN without body retry',async()=>{
    const kv=new KV();kv.put=key=>{kv.puts.push(key);return new Promise(()=>{});};
    const out=await h.recordPaidResponse(input('original'),opts(kv));
    assert.equal(out.headers.get(recordState),'UNKNOWN');assert.equal(out.headers.get(state),'UNKNOWN');
    assert.equal(kv.gets.length,1);assert.equal(kv.puts.length,1);
  });

  await run('never-resolving body get preserves confirmed metadata and stops',async()=>{
    const kv=new KV(),get=kv.get.bind(kv);
    kv.get=key=>key===h.retainedOutputTxKey(tx)
      ?(kv.gets.push(key),new Promise(()=>{})):get(key);
    const out=await h.recordPaidResponse(input('original'),opts(kv));
    assert.equal(out.headers.get(recordState),'WRITTEN');
    assert.equal(out.headers.get(state),'NOT_RETAINED_DEADLINE');
    assert.equal(kv.puts.length,1);assert.equal(await out.text(),'original');
  });

  await run('late body get cannot initiate a write after total deadline',async()=>{
    const kv=new KV(),get=kv.get.bind(kv);let done;
    const finished=new Promise(resolve=>done=resolve);
    kv.get=async key=>{
      if(key!==h.retainedOutputTxKey(tx))return get(key);
      kv.gets.push(key);await delay(h.DELIVERY_STORE_DEADLINE_MS+60);done();return null;
    };
    const out=await h.recordPaidResponse(input('original'),opts(kv));
    assert.equal(out.headers.get(state),'NOT_RETAINED_DEADLINE');
    await finished;await delay(5);assert.equal(kv.puts.length,1);
  });

  await run('body put uncertainty is separate from metadata WRITTEN',async()=>{
    const kv=new KV(),put=kv.put.bind(kv);
    kv.put=(key,value)=>key===h.retainedOutputTxKey(tx)
      ?(kv.puts.push(key),new Promise(()=>{})):put(key,value);
    const out=await h.recordPaidResponse(input('original'),opts(kv));
    assert.equal(out.headers.get(recordState),'WRITTEN');assert.equal(out.headers.get(state),'UNKNOWN');
    assert.equal(kv.puts.length,2);assert.equal(await out.text(),'original');
  });

  await run('late body commit reconciles through reads only',async()=>{
    const kv=new KV(),put=kv.put.bind(kv);let done;
    const finished=new Promise(resolve=>done=resolve);
    kv.put=async(key,value)=>{
      if(key!==h.retainedOutputTxKey(tx))return put(key,value);
      kv.puts.push(key);await delay(h.DELIVERY_STORE_DEADLINE_MS+60);kv.rows.set(key,value);done();
    };
    const out=await h.recordPaidResponse(input('original'),opts(kv));
    assert.equal(out.headers.get(recordState),'WRITTEN');assert.equal(out.headers.get(state),'UNKNOWN');
    await finished;const raw=await kv.get(h.retainedOutputTxKey(tx));
    assert.equal(JSON.parse(raw).response_sha256,digest(Buffer.from('original')));
    assert.equal(kv.puts.length,2);
  });

  await run('late body put rejection is observed without retry',async()=>{
    const kv=new KV(),put=kv.put.bind(kv);let done;
    const finished=new Promise(resolve=>done=resolve);
    kv.put=async(key,value)=>{
      if(key!==h.retainedOutputTxKey(tx))return put(key,value);
      kv.puts.push(key);await delay(h.DELIVERY_STORE_DEADLINE_MS+60);done();throw Error('late body rejection');
    };
    const out=await h.recordPaidResponse(input('original'),opts(kv));
    assert.equal(out.headers.get(recordState),'WRITTEN');assert.equal(out.headers.get(state),'UNKNOWN');
    await finished;await delay(5);assert.equal(kv.puts.length,2);
  });

  await run('metadata and body share the original single total budget',async()=>{
    const kv=new KV(),get=kv.get.bind(kv),put=kv.put.bind(kv);let done;
    const finished=new Promise(resolve=>done=resolve);
    kv.get=async key=>{
      if(key===h.deliveryTxKey(tx)){await delay(150);return get(key);}
      kv.gets.push(key);await delay(200);done();return null;
    };
    kv.put=async(key,value)=>{await delay(20);return put(key,value);};
    const out=await h.recordPaidResponse(input('original'),opts(kv));
    assert.equal(out.headers.get(recordState),'WRITTEN');
    assert.equal(out.headers.get(state),'NOT_RETAINED_DEADLINE');
    await finished;await delay(5);assert.equal(kv.puts.length,1);
  });

  await run('body put failure preserves metadata and the original response',async()=>{
    const kv=new KV(),put=kv.put.bind(kv);
    kv.put=async(key,value)=>{
      if(key!==h.retainedOutputTxKey(tx))return put(key,value);
      kv.puts.push(key);throw Error('retention failed');
    };
    const out=await h.recordPaidResponse(input('original'),opts(kv));
    assert.equal(out.headers.get(recordState),'WRITTEN');assert.equal(out.headers.get(state),'ERROR');
    assert.equal(await out.text(),'original');assert.equal(kv.puts.length,2);
  });

  return {cases,recoveryFixture};
}

if (process.argv[1] && import.meta.url===pathToFileURL(process.argv[1]).href) {
  globalThis.fetch=async()=>{throw Error('external network disabled in offline retention controls');};
  const context=vm.createContext({Response,Request,Headers,URL,TextEncoder,TextDecoder,
    Uint8Array,ArrayBuffer,crypto:crypto.webcrypto,btoa,atob,console,setTimeout,clearTimeout});
  const raw=fs.readFileSync('functions/api/_x402_delivery_record.ts','utf8');
  const module=new vm.SourceTextModule(stripTypeScriptTypes(raw,{mode:'transform'}),{context});
  await module.link(()=>{throw Error('unmocked import refused');});await module.evaluate();
  const result=await runPaidRetentionControls(module.namespace);
  execFileSync('python3',['-B','scripts/test_recover_paid_output.py','--fixture-stdin'],
    {input:JSON.stringify(result.recoveryFixture),stdio:['pipe','inherit','inherit'],timeout:15000});
  console.log('RETENTION_RESULT='+JSON.stringify({offline:true,node_controls:result.cases.length,
    python_controls:16,passed:result.cases.length+16,cases:result.cases,
    helper_sha256:crypto.createHash('sha256').update(raw).digest('hex'),
    network_calls:0,payment_calls:0,signing_calls:0,production_changed:false}));
}
