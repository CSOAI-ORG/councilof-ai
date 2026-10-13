#!/usr/bin/env node
import { readFileSync } from "node:fs";
const toolset = JSON.parse(readFileSync(new URL("./toolset.json", import.meta.url), "utf8"));
const endpoint = process.env.GSPC_MCP_URL || "https://councilof.ai/mcp";
const expectedFree = new Set(toolset.free_read_only_tools);
const paid = new Set(toolset.paid_tools_denied_by_default);
async function rpc(id, method, params) {
  const res = await fetch(endpoint, {method:"POST",headers:{"content-type":"application/json","accept":"application/json, text/event-stream"},body:JSON.stringify({jsonrpc:"2.0",id,method,...(params?{params}:{})}),signal:AbortSignal.timeout(10000)});
  if (!res.ok) throw new Error("HTTP "+res.status);
  const text = await res.text();
  const payloads = text.split(/\r?\n/).filter(x=>x.startsWith("data: ")).map(x=>JSON.parse(x.slice(6)));
  if (!payloads.length) payloads.push(JSON.parse(text));
  const obj = payloads.find(x=>x.id===id) || payloads[0];
  if (obj.error) throw new Error(JSON.stringify(obj.error));
  return obj.result;
}
const listed=await rpc("gspc-tools","tools/list");
const definitions=new Map((listed.tools||[]).map(x=>[x.name,x]));
const names=new Set(definitions.keys());
for (const name of expectedFree) {
  if (!names.has(name)) throw new Error("missing free tool: "+name);
  if (/\bPAID\b/i.test(definitions.get(name).description||"")) throw new Error("free tool now advertises payment: "+name);
}
for (const name of paid) {
  const description=definitions.get(name)?.description||"";
  if (!names.has(name)) throw new Error("missing paid tool declaration: "+name);
  if (!/^PAID\b/i.test(description)) throw new Error("paid tool lost its explicit paid marker: "+name);
}
const total=await rpc("gspc-board","tools/call",{name:"board_totals",arguments:{}});
if (total.isError===true) throw new Error("board_totals returned isError");
console.log(JSON.stringify({state:"PASS",endpoint,listed_tools:names.size,free_tools_present:expectedFree.size,paid_tools_present:paid.size,board_totals_call:"PASS",authority:"read-only smoke only; no paid tool invoked"},null,2));
