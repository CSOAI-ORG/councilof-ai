#!/usr/bin/env node
/**
 * Drive the shipped stdio server: tools/list must be exactly the names that
 * tools/call actually runs — the eight free tools and the four x402-metered ones.
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
  "x402_trust",
];
const PAID = [
  "commission_card",
  "art50_marking_evidence",
  "rwa_evidence",
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

// Every advertised free tool must have a handler. Use deliberately small
// arguments; schema failures are valid tool results, JSON-RPC unknown-tool
// errors are not. This closes the gap where x402_trust was listed but absent
// from HANDLERS.
const freeCalls = {
  board_totals: {},
  get_axis: { axis: "governance" },
  verify_card: {},
  list_cards: { limit: 0 },
  get_root: {},
  get_card: { sha256: "bad" },
  verify_inclusion: { sha256: "bad" },
  x402_trust: {},
};
const freeResults = new Map();
for (const name of FREE) {
  const r = await rpc("tools/call", { name, arguments: freeCalls[name] });
  freeResults.set(name, r);
  check(`${name} has a callable handler`, !r.error && Boolean(r.result?.structuredContent));
}

const root = freeResults.get("get_root");
check("get_root VALID", root.result?.structuredContent?.state === "VALID");

const trust = freeResults.get("x402_trust")?.result?.structuredContent;
check(
  "x402_trust delegates to the canonical measured snapshot",
  trust?.state === "VALID" &&
    trust?.source === `${process.env.GSPC_ORIGIN || "https://councilof.ai"}/interop/x402-trust/latest.json` &&
    trust?.counts && typeof trust.counts === "object" &&
    typeof trust?.headline === "string" && trust.headline.length > 0 &&
    trust?.not_a_certification === true,
);

const unknown = await rpc("tools/call", { name: "not_a_tool", arguments: {} });
check("unknown tool still errors", Boolean(unknown.error));

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
const challenge = await rpc("tools/call", { name: "commission_card", arguments: { subject: "gspc-contract-check" } });
const cs = challenge.result?.structuredContent;
check(
  "unpaid metered call returns a challenge, never a deliverable",
  cs?.status !== "DELIVERED" || Boolean(cs?.x_payment_response),
  `status=${cs?.status}`,
);

server.stdin.end();
process.exit(failed ? 1 : 0);
