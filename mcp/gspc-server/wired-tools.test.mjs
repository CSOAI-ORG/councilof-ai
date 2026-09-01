#!/usr/bin/env node
/**
 * Drive the shipped stdio server: tools/list must be the seven names that
 * tools/call actually runs (get_root / get_card / verify_inclusion included).
 * Spawns index.mjs — not a reimplementation.
 */
import { spawn } from "node:child_process";
import { createInterface } from "node:readline";
import { fileURLToPath } from "node:url";

const SEVEN = [
  "board_totals",
  "get_axis",
  "verify_card",
  "list_cards",
  "get_root",
  "get_card",
  "verify_inclusion",
];

const server = spawn(process.execPath, [fileURLToPath(new URL("./index.mjs", import.meta.url))], {
  stdio: ["pipe", "pipe", "pipe"],
});
const pending = new Map();
createInterface({ input: server.stdout }).on("line", (l) => {
  if (!l.trim()) return;
  const msg = JSON.parse(l);
  const p = pending.get(msg.id);
  if (p) {
    pending.delete(msg.id);
    p(msg);
  }
});
let nextId = 1;
function rpc(method, params) {
  const id = nextId++;
  server.stdin.write(JSON.stringify({ jsonrpc: "2.0", id, method, ...(params ? { params } : {}) }) + "\n");
  return new Promise((res) => pending.set(id, res));
}

let failed = 0;
function check(label, ok) {
  console.log(`${ok ? "PASS" : "FAIL"}  ${label}`);
  if (!ok) failed += 1;
}

await rpc("initialize", { protocolVersion: "2024-11-05", capabilities: {}, clientInfo: { name: "wired-tools", version: "0" } });
const list = await rpc("tools/list");
const names = (list.result?.tools || []).map((t) => t.name);
check("tools/list length 7", names.length === 7);
check("tools/list names", names.join(",") === SEVEN.join(","));

const root = await rpc("tools/call", { name: "get_root", arguments: {} });
check("get_root is not unknown tool", !root.error);
check("get_root VALID", root.result?.structuredContent?.state === "VALID");

const unknown = await rpc("tools/call", { name: "not_a_tool", arguments: {} });
check("unknown tool still errors", Boolean(unknown.error));

const miss = await rpc("tools/call", { name: "verify_inclusion", arguments: { sha256: "0".repeat(64) } });
const st = miss.result?.structuredContent?.state;
check("verify_inclusion wired", !miss.error && (st === "INVALID" || st === "UNCHECKABLE"));

server.stdin.end();
process.exit(failed ? 1 : 0);
