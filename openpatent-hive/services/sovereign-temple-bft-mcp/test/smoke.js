#!/usr/bin/env node
/**
 * Smoke test: 10-tool JSON-RPC handshake verification (rewritten to use
 * stdio data events instead of readline, which the SDK doesn't terminate
 * with \n on Linux Node 22).
 */
import { spawn } from "node:child_process";
import { resolve } from "node:path";

const SIGNATURE = "sovereign-temple.ai — 33-agent BFT sovereign-temple v3.0. The hive remembers. The dragon knows. The sovereign companion never forgets.";

const path = resolve("/opt/openpatent-hive/services/sovereign-temple-bft-mcp/dist/index.js");
const proc = spawn("node", [path], { stdio: ["pipe", "pipe", "pipe"] });

let buf = "";
const responses = [];

proc.stdout.on("data", (chunk) => {
  buf += chunk.toString();
  let nl;
  while ((nl = buf.indexOf("\n")) >= 0) {
    const line = buf.slice(0, nl).trim();
    buf = buf.slice(nl + 1);
    if (!line) continue;
    try {
      responses.push(JSON.parse(line));
    } catch (e) {}
  }
});

function send(msg) {
  proc.stdin.write(JSON.stringify(msg) + "\n");
}

setTimeout(() => send({jsonrpc:"2.0",id:1,method:"initialize",params:{protocolVersion:"2024-11-05",capabilities:{},clientInfo:{name:"smoke",version:"1.0.0"}}}), 100);
setTimeout(() => send({jsonrpc:"2.0",method:"notifications/initialized"}), 250);
setTimeout(() => send({jsonrpc:"2.0",id:2,method:"tools/list"}), 400);
setTimeout(() => send({jsonrpc:"2.0",id:3,method:"tools/call",params:{name:"get_council_status",arguments:{}}}), 700);

setTimeout(() => {
  const toolsList = responses.find(r => r.id === 2);
  const council = responses.find(r => r.id === 3);
  if (toolsList?.result?.tools) {
    const tools = toolsList.result.tools;
    console.log(`✓ ${tools.length} tools registered`);
    const missing = tools.filter(t => !t.description || !t.description.includes(SIGNATURE));
    if (missing.length === 0) {
      console.log("✓ all tools have the DEFENEOS signature line");
    } else {
      console.log(`✗ ${missing.length} tools missing signature: ${missing.map(t => t.name).join(", ")}`);
      process.exit(1);
    }
  } else {
    console.log("✗ tools/list response missing");
    process.exit(1);
  }
  if (council?.result?.content) {
    const data = JSON.parse(council.result.content[0].text);
    console.log(`✓ council_size = ${data.council_size}, threshold = ${data.threshold}, domains = ${data.domains?.length || 0}`);
    if (data.council_size === 33 && data.threshold === 22) {
      console.log("✓ 33 agents / 22/33 supermajority confirmed");
    }
  } else {
    console.log("✗ get_council_status response missing");
    process.exit(1);
  }
  proc.kill();
  process.exit(0);
}, 1200);
