#!/usr/bin/env node
/**
 * Push pre-built batch JSON files via local GitHub MCP server.
 * Usage: node scripts/gh-mcp-push-all.mjs [batch-dir] [start] [end]
 * Default: /tmp/gh-sync-final batch-01..16
 */
import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MCP_CANDIDATES = [
  "/home/ubuntu/.npm/_npx/3dfbf5a9eea4a1b3/node_modules/@modelcontextprotocol/server-github/dist/index.js",
  path.join(__dirname, "../node_modules/@modelcontextprotocol/server-github/dist/index.js"),
];

const MCP = MCP_CANDIDATES.find((p) => fs.existsSync(p));
if (!MCP) {
  console.error("GitHub MCP server not found");
  process.exit(1);
}

const batchDir = process.argv[2] || "/tmp/gh-sync-final";
const start = Number(process.argv[3] || 1);
const end = Number(process.argv[4] || 16);

function send(proc, msg) {
  const body = Buffer.from(JSON.stringify(msg));
  proc.stdin.write(`Content-Length: ${body.length}\r\n\r\n`);
  proc.stdin.write(body);
}

async function readMsg(proc, timeoutMs = 300000) {
  const start = Date.now();
  const readLine = () =>
    new Promise((resolve, reject) => {
      const tick = () => {
        if (Date.now() - start > timeoutMs) return reject(new Error("MCP read timeout"));
        const onData = (chunk) => {
          const s = chunk.toString();
          const idx = s.indexOf("\r\n\r\n");
          if (idx === -1) return;
          proc.stdout.off("data", onData);
          const header = s.slice(0, idx);
          const len = Number(header.match(/content-length:\s*(\d+)/i)?.[1] || 0);
          const rest = s.slice(idx + 4);
          if (rest.length >= len) {
            resolve(JSON.parse(rest.slice(0, len)));
          } else {
            const need = len - rest.length;
            proc.stdout.once("data", (c) => resolve(JSON.parse(rest + c.toString().slice(0, need))));
          }
        };
        proc.stdout.on("data", onData);
      };
      tick();
    });
  return readLine();
}

async function mcpCall(args) {
  const proc = spawn("node", [MCP], { stdio: ["pipe", "pipe", "pipe"], env: process.env });
  send(proc, {
    jsonrpc: "2.0",
    id: 1,
    method: "initialize",
    params: { protocolVersion: "2024-11-05", capabilities: {}, clientInfo: { name: "gh-mcp-push-all", version: "1" } },
  });
  await readMsg(proc);
  send(proc, { jsonrpc: "2.0", method: "notifications/initialized" });
  send(proc, { jsonrpc: "2.0", id: 2, method: "tools/call", params: { name: "push_files", arguments: args } });
  const result = await readMsg(proc, 300000);
  proc.kill();
  if (result.error) throw new Error(JSON.stringify(result.error));
  if (result.result?.isError) throw new Error(JSON.stringify(result.result));
  return result.result;
}

const log = [];
for (let i = start; i <= end; i++) {
  const n = String(i).padStart(2, "0");
  const file = path.join(batchDir, `batch-${n}.json`);
  if (!fs.existsSync(file)) {
    console.log("skip missing", file);
    continue;
  }
  const args = JSON.parse(fs.readFileSync(file, "utf8"));
  const paths = args.files.map((f) => f.path).join(", ");
  process.stdout.write(`Pushing batch-${n} (${args.files.length} files)... `);
  try {
    const res = await mcpCall({
      owner: args.owner,
      repo: args.repo,
      branch: args.branch,
      message: args.message,
      files: args.files,
    });
    const text = typeof res?.content?.[0]?.text === "string" ? res.content[0].text : JSON.stringify(res);
    const sha = text.match(/[0-9a-f]{40}/)?.[0] || "ok";
    console.log("OK", sha);
    log.push({ batch: n, sha, paths });
  } catch (e) {
    console.log("FAIL");
    console.error(e.message || e);
    fs.writeFileSync("/tmp/gh-push-log.json", JSON.stringify(log, null, 2));
    process.exit(1);
  }
}
fs.writeFileSync("/tmp/gh-push-log.json", JSON.stringify(log, null, 2));
console.log("done", log.length, "batches");
