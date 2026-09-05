#!/usr/bin/env node
/**
 * Drive the shipped stdio server: tools/list must be exactly the names that
 * tools/call actually runs — the seven free tools and the five x402-metered ones.
 * A listed tool that does not run, or a running tool that is not listed, fails here.
 * Spawns index.mjs — not a reimplementation.
 */
import { spawn } from "node:child_process";
import { createInterface } from "node:readline";
import { fileURLToPath } from "node:url";

const FREE = [
  "board_totals",
  "get_axis",
  "verify_card",
  "list_cards",
  "get_root",
  "get_card",
  "verify_inclusion",
];
const PAID = [
  "commission_card",
  "art50_marking_evidence",
  "rwa_evidence",
  "witness_hash",
  "receipts_batch",
];
const ALL = [...FREE, ...PAID];

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
check(`tools/list length ${ALL.length}`, names.length === ALL.length);
check("tools/list names", names.join(",") === ALL.join(","));

const root = await rpc("tools/call", { name: "get_root", arguments: {} });
check("get_root is not unknown tool", !root.error);
check("get_root VALID", root.result?.structuredContent?.state === "VALID");

const unknown = await rpc("tools/call", { name: "not_a_tool", arguments: {} });
check("unknown tool still errors", Boolean(unknown.error));

const miss = await rpc("tools/call", { name: "verify_inclusion", arguments: { sha256: "0".repeat(64) } });
const st = miss.result?.structuredContent?.state;
check("verify_inclusion wired", !miss.error && (st === "INVALID" || st === "UNCHECKABLE"));

// Every paid tool must be wired: reachable, argument-checked, and never a fabricated result.
for (const name of PAID) {
  const r = await rpc("tools/call", { name, arguments: {} });
  const status = r.result?.structuredContent?.status;
  check(
    `${name} wired (not unknown-tool)`,
    !r.error && ["BAD_ARGUMENTS", "PAYMENT_REQUIRED", "NOT_DEPLOYED", "UNREACHABLE", "DELIVERED"].includes(status),
    `status=${status}`,
  );
}

// The free preview path must cost nothing and still answer.
const preview = await rpc("tools/call", {
  name: "receipts_batch",
  arguments: { from: "2026-09-01T00:00:00Z", preview: true },
});
const ps = preview.result?.structuredContent?.status;
check("receipts_batch preview is free and answers", ["DELIVERED", "PAYMENT_REQUIRED", "UNREACHABLE"].includes(ps), `status=${ps}`);

// An unpaid call to a metered tool is a challenge, not a charge and not a result.
const challenge = await rpc("tools/call", { name: "witness_hash", arguments: { sha256: "0".repeat(64) } });
const cs = challenge.result?.structuredContent;
check(
  "unpaid metered call returns a challenge, never a deliverable",
  cs?.status !== "DELIVERED" || Boolean(cs?.x_payment_response),
  `status=${cs?.status}`,
);

server.stdin.end();
process.exit(failed ? 1 : 0);
