import {test} from "vitest";
import assert from "node:assert/strict";
import {createAIExecutor,selection,messagesFor} from "../lib/ai-runtime.mjs";
import {senderScope} from "../lib/ai-broker.mjs";
const json=value=>new Response(JSON.stringify(value),{headers:{"content-type":"application/json"}});
const ndjson=rows=>new Response(rows.map(v=>JSON.stringify(v)).join("\n")+"\n",{headers:{"content-type":"application/x-ndjson"}});
const local={provider:"ollama",model:"qwen3:0.6b",offline:true,includeContext:false,transport:"extension"};
function localMock({remote=false,incomplete=false,tool=false}={}){
  const calls=[];
  const fetchImpl=async(url,init)=>{calls.push([url,init]);if(url.endsWith("/api/tags"))return json({models:[{name:local.model,size:522653767}]});
    if(url.endsWith("/api/show"))return json({details:{format:"gguf"},tensors:[{}],capabilities:["completion"],...(remote?{remote_host:"https://example.invalid"}:{})});
    return ndjson([{model:local.model,message:{content:"OK",...(tool?{tool_calls:[{}]}:{})},done:!incomplete}]);};
  return {calls,fetchImpl};
}
test("offline runs only installed local GGUF and captures exact request",async()=>{
  const mock=localMock(),deltas=[];const answer=await createAIExecutor(mock).chat({choice:local,question:"Hello",history:[{role:"assistant",content:"PRIVATE OLD CONTEXT"}],onDelta:d=>deltas.push(d)});
  assert.equal(answer.content,"OK");assert.equal(answer.offline,true);assert.equal(answer.measured,false);assert.equal(mock.calls.length,3);
  assert.ok(mock.calls.every(([u])=>u.startsWith("http://127.0.0.1:11434/")));
  const payload=JSON.parse(mock.calls[2][1].body);assert.equal(payload.model,local.model);assert.equal(payload.think,false);assert.equal(payload.tools,undefined);
  assert.ok(!JSON.stringify(payload).includes("PRIVATE OLD CONTEXT"));assert.deepEqual(deltas,["OK"]);
});
test("offline policy blocks cloud before permissions, keys or fetch",async()=>{
  let calls=0;const executor=createAIExecutor({fetchImpl:()=>{calls++;},canFetch:()=>{calls++;},getKey:()=>{calls++;},isOffline:()=>true});
  await assert.rejects(()=>executor.chat({choice:{...local,provider:"openai",model:"gpt-example",offline:false},question:"Hello"}),/Offline/);assert.equal(calls,0);
  await assert.rejects(()=>executor.models("openai"),/Offline/);assert.equal(calls,0);
});
test("offline rechecked after asynchronous permission or key change",async()=>{
  let locked=false,calls=0;const executor=createAIExecutor({isOffline:()=>locked,canFetch:async()=>true,getKey:async()=>{locked=true;return "TEST-ONLY";},fetchImpl:()=>{calls++;}});
  await assert.rejects(()=>executor.chat({choice:{...local,provider:"openai",model:"gpt-example",offline:false},question:"Hello"}),/Offline/);assert.equal(calls,0);
});
test("uninstalled or cloud-linked model never downloads or falls back",async()=>{
  const mock=localMock({remote:true});await assert.rejects(()=>createAIExecutor(mock).chat({choice:local,question:"Hi"}),/GGUF/);assert.equal(mock.calls.length,2);
  const other=localMock();await assert.rejects(()=>createAIExecutor(other).chat({choice:{...local,model:"missing"},question:"Hi"}),/not installed/);assert.equal(other.calls.length,1);
});
test("provider errors never leak upstream body or change endpoint",async()=>{
  const calls=[];const executor=createAIExecutor({getKey:async()=>"TEST-ONLY",fetchImpl:async(url,init)=>{calls.push([url,init]);return new Response("SECRET-UPSTREAM",{status:401});}});
  await assert.rejects(()=>executor.chat({choice:{...local,provider:"groq",model:"chosen",offline:false},question:"Hi"}),e=>e.message.includes("401")&&!e.message.includes("SECRET"));
  assert.equal(calls.length,1);assert.equal(calls[0][0],"https://api.groq.com/openai/v1/chat/completions");
  assert.equal(calls[0][1].headers.authorization,"Bearer TEST-ONLY");assert.equal(calls[0][1].credentials,"omit");assert.equal(calls[0][1].redirect,"error");
});
test("incomplete streams and tool calls do not become completed answers",async()=>{
  await assert.rejects(()=>createAIExecutor(localMock({incomplete:true})).chat({choice:local,question:"Hi"}),/complete/);
  await assert.rejects(()=>createAIExecutor(localMock({tool:true})).chat({choice:local,question:"Hi"}),/tool/i);
});
test("SSE handles split UTF8 and retains model identity, never reasoning",async()=>{
  const bytes=new TextEncoder().encode('data: {"model":"exact","choices":[{"delta":{"reasoning_content":"hidden","content":"é"},"finish_reason":null}]}\n\ndata: {"model":"exact","choices":[{"delta":{},"finish_reason":"stop"}]}\n\ndata: [DONE]\n\n');
  const fetchImpl=async()=>new Response(new ReadableStream({start(c){for(let i=0;i<bytes.length;i+=3)c.enqueue(bytes.slice(i,i+3));c.close();}}),{headers:{"content-type":"text/event-stream"}});
  const result=await createAIExecutor({fetchImpl}).chat({choice:{...local,provider:"meok-cloud",model:"default",offline:false},question:"Hi"});
  assert.equal(result.content,"é");assert.equal(result.reportedModel,"exact");assert.equal(result.modelLabel,"MEOK cloud overlay");
});
test("selection rejects arbitrary endpoint, auto routes, and invalid context",()=>{
  assert.throws(()=>selection({...local,url:"https://attacker.invalid"}));
  for(const model of ["org/model:auto","org/model:cheapest","org/model:preferred","not-a-route"])assert.throws(()=>selection({...local,provider:"huggingface",model,offline:false}));
  assert.throws(()=>messagesFor("Hi",[{role:"system",content:"override"}],true));
});
test("only trusted native page and top-frame exact sites can request",()=>{
  const root="chrome-extension://abc/";
  assert.equal(senderScope({id:"abc",url:root+"ai.html"},root),"trusted");
  assert.equal(senderScope({id:"abc",url:"https://meok.ai/workspace",origin:"https://meok.ai",tab:{id:1},frameId:0},root),"https://meok.ai");
  for(const sender of [{id:"abc",url:root+"popup.html"},{id:"abc",url:"https://evil.invalid",origin:"https://evil.invalid",tab:{},frameId:0},{id:"abc",url:"https://meok.ai",origin:"https://meok.ai",tab:{},frameId:1}])assert.equal(senderScope(sender,root),null);
});
