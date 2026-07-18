#!/usr/bin/env node
// End-to-end tool-call smoke test: invoke several tools, including the
// new GET-based hive_stats and the POST-based ots_verify. We point
// OPENPATENT_API_BASE at an httpbin-like echo server that we run on
// a known port to confirm the right method+path+body are sent.
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import http from "node:http";

const __dirname = dirname(fileURLToPath(import.meta.url));
const dist = join(__dirname, "..", "dist", "index.js");

// Run a tiny echo server that records every request and returns JSON.
const requests = [];
const server = http.createServer((req, res) => {
  let body = "";
  req.on("data", (c) => (body += c));
  req.on("end", () => {
    requests.push({ method: req.method, url: req.url, body });
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ ok: true, tool: "echo" }));
  });
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const port = server.address().port;
const base = `http://127.0.0.1:${port}`;

const child = spawn("node", [dist], {
  env: { ...process.env, OPENPATENT_API_BASE: base },
  stdio: ["pipe", "pipe", "pipe"],
});
let stdout = "";
child.stdout.on("data", (b) => (stdout += b.toString()));
child.stderr.on("data", () => {});

const send = (id, method, params) => {
  child.stdin.write(
    JSON.stringify({ jsonrpc: "2.0", id, method, params }) + "\n"
  );
};

send(1, "initialize", {
  protocolVersion: "2024-11-05",
  capabilities: {},
  clientInfo: { name: "e2e", version: "0" },
});
child.stdin.write(
  JSON.stringify({ jsonrpc: "2.0", method: "notifications/initialized" }) + "\n"
);
// call hive_stats (GET)
send(2, "tools/call", { name: "hive_stats", arguments: {} });
// call ots_verify (POST)
send(3, "tools/call", {
  name: "ots_verify",
  arguments: { ots_base64: "AAAA" },
});
// call get_disclosure (GET with path param)
send(4, "tools/call", { name: "get_disclosure", arguments: { doc_hash_prefix: "abcdef0123456789" } });
// call disclose_invention (POST, body=raw args)
send(5, "tools/call", {
  name: "disclose_invention",
  arguments: { title: "T", description: "D", inventor_did: "did:key:x", document_base64: "AAA" },
});
// call draft_patent_claims (POST, body wrapped as {invention: ...})
send(6, "tools/call", {
  name: "draft_patent_claims",
  arguments: { invention_description: "thing" },
});
// call unknown tool (error path)
send(7, "tools/call", { name: "definitely_not_a_tool", arguments: {} });
child.stdin.end();

setTimeout(() => {
  console.log("=== HTTP REQUESTS SENT BY MCP SERVER ===");
  for (const r of requests) {
    console.log(`${r.method.padEnd(4)} ${r.url}` + (r.body ? `  body=${r.body}` : ""));
  }
  // Verify expected paths
  const checks = [
    { name: "hive_stats",     m: "GET",  url: "/v1/stats" },
    { name: "ots_verify",     m: "POST", url: "/v1/ots/verify" },
    { name: "get_disclosure", m: "GET",  url: "/v1/disclosure/abcdef0123456789" },
    { name: "disclose_invention",   m: "POST", url: "/v1/disclosure" },
    { name: "draft_patent_claims",  m: "POST", url: "/v1/draft-claims" },
  ];
  let bad = [];
  for (const c of checks) {
    const hit = requests.find((r) => r.method === c.m && r.url === c.url);
    if (!hit) bad.push(`MISSING ${c.m} ${c.url} (for ${c.name})`);
  }
  // Verify draft_patent_claims wraps body
  const dpc = requests.find((r) => r.url === "/v1/draft-claims");
  if (dpc) {
    const parsed = JSON.parse(dpc.body);
    if (!parsed.invention) bad.push("draft_patent_claims body missing 'invention' wrapper");
  }
  // Verify unknown tool produced an error result
  const lines = stdout.split("\n").filter(Boolean);
  const unknown = lines.map(l => { try { return JSON.parse(l); } catch { return null; }}).find(m => m && m.id === 7);
  if (!unknown || !unknown.result || !unknown.result.isError) {
    bad.push("unknown tool did not return isError=true");
  } else {
    console.log("UNKNOWN TOOL ERROR (good):", unknown.result.content[0].text.slice(0, 100));
  }
  if (bad.length) {
    console.error("=== E2E FAILURES ===");
    bad.forEach((b) => console.error("  " + b));
    process.exit(1);
  }
  console.log("=== E2E TOOL CALLS OK: 6 tools routed correctly + unknown-tool error path ===");
  process.exit(0);
}, 2000);
