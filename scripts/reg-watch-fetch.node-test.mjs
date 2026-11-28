import test from 'node:test';
import assert from 'node:assert/strict';
import { boundedRegulationRead } from './reg-watch-policy.mjs';

const url='https://www.legislation.gov.uk/ukpga/2018/12/data.xml';
test('complete response and metadata preserved, including split UTF-8', async()=>{
 const raw=new TextEncoder().encode('<doc>é</doc>');
 const body=new ReadableStream({start(c){c.enqueue(raw.slice(0,6));c.enqueue(raw.slice(6));c.close()}});
 const result=await boundedRegulationRead(url,{fetcher:async(u,o)=>{
  assert.equal(u,url);assert.equal(o.redirect,'follow');return new Response(body,{headers:{'last-modified':'example','etag':'"x"'}})
 }});
 assert.equal(result.body,'<doc>é</doc>');assert.equal(result.lastMod,'example');assert.equal(result.etag,'"x"');assert.equal(result.status,200);
});
test('unresponsive connection and late completion are bounded',async()=>{
 let signal;
 await assert.rejects(boundedRegulationRead(url,{deadlineMs:25,fetcher:(_u,o)=>{signal=o.signal;return new Promise(()=>{})}}),/SOURCE_DEADLINE/);
 assert.equal(signal.aborted,true);
});
test('stalled response body with uncooperative cancellation is bounded',async()=>{
 const body=new ReadableStream({pull(){return new Promise(()=>{})},cancel(){return new Promise(()=>{})}});
 await assert.rejects(boundedRegulationRead(url,{deadlineMs:25,fetcher:async()=>new Response(body)}),/SOURCE_DEADLINE/);
});
test('oversized body is refused without waiting for cancellation',async()=>{
 const body=new ReadableStream({start(c){c.enqueue(new Uint8Array(9))},cancel(){return new Promise(()=>{})}});
 await assert.rejects(boundedRegulationRead(url,{maxBytes:8,deadlineMs:100,fetcher:async()=>new Response(body)}),/SOURCE_SIZE/);
});
test('oversized advertised content is rejected before reading',async()=>{
 const body=new ReadableStream({pull(){return new Promise(()=>{})}});
 await assert.rejects(boundedRegulationRead(url,{maxBytes:8,deadlineMs:100,fetcher:async()=>new Response(body,{headers:{'content-length':'9'}})}),/SOURCE_SIZE/);
});
test('invalid bounds rejected before network',async()=>{
 for(const opts of [{deadlineMs:0},{maxBytes:-1},{deadlineMs:1000000},{maxBytes:1000000000}]){
  await assert.rejects(boundedRegulationRead(url,{...opts,fetcher:()=>assert.fail('network attempted')}),/SOURCE_LIMIT/);
 }
});
test('late response is cancelled rather than accepted after timeout',async()=>{
 let resolveFetch, cancelled=false;
 const pending=new Promise(resolve=>{resolveFetch=resolve});
 await assert.rejects(boundedRegulationRead(url,{deadlineMs:25,fetcher:()=>pending}),/SOURCE_DEADLINE/);
 const body=new ReadableStream({cancel(){cancelled=true}});
 resolveFetch(new Response(body));
 await new Promise(resolve=>setImmediate(resolve));
 assert.equal(cancelled,true);
});
test('decoding matches legacy Response.text for BOM and invalid UTF-8',async()=>{
 const bytes=Uint8Array.from([239,187,191,65,255,66]);
 const expected=await new Response(bytes).text();
 const actual=await boundedRegulationRead(url,{fetcher:async()=>new Response(bytes)});
 assert.equal(actual.body,expected);
});
