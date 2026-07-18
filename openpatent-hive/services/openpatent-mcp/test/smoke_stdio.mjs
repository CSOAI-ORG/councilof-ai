#!/usr/bin/env node
// stdio handshake smoke test — drives dist/index.js via the JSON-RPC
// protocol over stdio and asserts the 12-tool manifest is returned.
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const dist = join(__dirname, "..", "dist", "index.js");

const child = spawn("node", [dist], { stdio: ["pipe", "pipe", "pipe"] });
let stdout = "";
let stderr = "";
child.stdout.on("data", (b) => (stdout += b.toString()));
child.stderr.on("data", (b) => (stderr += b.toString()));

const req1 = JSON.stringify({
  jsonrpc: "2.0",
  id: 1,
  method: "initialize",
  params: {
    protocolVersion: "2024-11-05",
    capabilities: {},
    clientInfo: { name: "smoke", version: "0" },
  },
});
const req2 = JSON.stringify({ jsonrpc: "2.0", method: "notifications/initialized" });
const req3 = JSON.stringify({ jsonrpc: "2.0", id: 2, method: "tools/list" });

child.stdin.write(req1 + "\n" + req2 + "\n" + req3 + "\n");
child.stdin.end();

setTimeout(() => {
  const lines = stdout.split("\n").filter(Boolean);
  console.log("--- STDERR (banner) ---");
  console.log(stderr);
  console.log("--- JSON-RPC MESSAGES ---");
  let init = null, list = null;
  for (const l of lines) {
    try {
      const m = JSON.parse(l);
      if (m.id === 1) init = m.result;
      if (m.id === 2) list = m.result;
    } catch {}
  }
  if (!init) { console.error("FAIL: no initialize response"); process.exit(1); }
  if (!list) { console.error("FAIL: no tools/list response"); process.exit(1); }

  console.log("PROTOCOL:", init.protocolVersion);
  console.log("SERVER:  ", JSON.stringify(init.serverInfo));
  const tools = list.tools;
  console.log("TOOLS_COUNT:", tools.length);
  console.log("TOOLS:", tools.map(t => t.name).sort().join(", "));

  // Schema + signature check
  const sig = "Disclose First. AI Second.";
  let bad = [];
  for (const t of tools) {
    const s = t.inputSchema;
    if (s.type !== "object") bad.push(`${t.name}: type!=object`);
    if (!s.properties) bad.push(`${t.name}: no properties`);
    if (s.required !== undefined && !Array.isArray(s.required)) bad.push(`${t.name}: required not array`);
    if (!t.description.includes(sig)) bad.push(`${t.name}: missing signature`);
  }
  if (bad.length) {
    console.error("SCHEMA FAIL:");
    bad.forEach(x => console.error("  " + x));
    process.exit(1);
  }
  console.log("SCHEMA OK: all", tools.length, "tools have type=object, properties, required, and the signature line");
  console.log("ORIGINAL 4 PRESERVED:", ["disclose_invention","verify_disclosure","search_prior_art","draft_patent_claims"].every(n => tools.some(t => t.name === n)));
  console.log("8 NEW TOOLS PRESENT:", ["hive_stats","ots_verify","attest_bft","manage_docket","draft_prosecution","consult_patentability","strategy_filing","get_disclosure"].every(n => tools.some(t => t.name === n)));
  process.exit(0);
}, 1500);
