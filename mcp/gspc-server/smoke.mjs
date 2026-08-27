#!/usr/bin/env node
/**
 * smoke — drive the stdio server over its real transport and print the
 * transcript. Not a mock: spawns `node index.mjs`, writes JSON-RPC to its
 * stdin, reads replies from its stdout.
 *
 * The verify_card section is the honesty proof: the SAME tool must answer
 * three DIFFERENT verdicts to (1) a genuine published card, (2) the same card
 * with one byte of body tampered, (3) a forged card whose body was re-signed
 * with a fresh key the forger generated — self-consistent, but not ours.
 *
 *   node smoke.mjs            # full run (needs network for the live tools)
 */
import { spawn } from "node:child_process";
import { createInterface } from "node:readline";
import { generateKeyPairSync, sign as edSign, createHash } from "node:crypto";
import { fileURLToPath } from "node:url";

const ORIGIN = process.env.GSPC_ORIGIN || "https://councilof.ai";
const server = spawn(process.execPath, [fileURLToPath(new URL("./index.mjs", import.meta.url))], {
  stdio: ["pipe", "pipe", "inherit"],
});

const pending = new Map();
createInterface({ input: server.stdout }).on("line", (l) => {
  if (!l.trim()) return;
  const msg = JSON.parse(l);
  console.log("<<", JSON.stringify(msg).slice(0, 2000));
  const p = pending.get(msg.id);
  if (p) {
    pending.delete(msg.id);
    p(msg);
  }
});

let nextId = 1;
function rpc(method, params) {
  const id = nextId++;
  const msg = { jsonrpc: "2.0", id, method, ...(params ? { params } : {}) };
  console.log(">>", JSON.stringify(msg).slice(0, 400));
  server.stdin.write(JSON.stringify(msg) + "\n");
  return new Promise((res) => pending.set(id, res));
}
function notify(method) {
  const msg = { jsonrpc: "2.0", method };
  console.log(">>", JSON.stringify(msg));
  server.stdin.write(JSON.stringify(msg) + "\n");
}

/* Python-style canonical JSON, enough to FORGE a card for the test. A forger
 * controls their own bytes, so this only needs to agree with itself. */
function canonical(v) {
  if (v === null) return "null";
  if (typeof v === "boolean") return v ? "true" : "false";
  if (typeof v === "number") return Number.isInteger(v) ? String(v) : String(v);
  if (typeof v === "string") return JSON.stringify(v);
  if (Array.isArray(v)) return "[" + v.map(canonical).join(",") + "]";
  return "{" + Object.keys(v).sort().map((k) => JSON.stringify(k) + ":" + canonical(v[k])).join(",") + "}";
}

const expect = (label, got, want) => {
  const ok = got === want;
  console.log(`${ok ? "PASS" : "FAIL"}  ${label}: state=${got} (expected ${want})`);
  if (!ok) process.exitCode = 1;
};

// ---- handshake ----
const init = await rpc("initialize", {
  protocolVersion: "2024-11-05",
  capabilities: {},
  clientInfo: { name: "smoke", version: "0" },
});
notify("notifications/initialized");
const list = await rpc("tools/list");
console.log(`tools: ${list.result.tools.map((t) => t.name).join(", ")}`);

// ---- live tools ----
const totals = await rpc("tools/call", { name: "board_totals", arguments: {} });
const axis = await rpc("tools/call", { name: "get_axis", arguments: { axis: "jail" } });
const cards = await rpc("tools/call", { name: "list_cards", arguments: { limit: 2 } });

// ---- verify_card: three inputs, three verdicts ----
const idx = await (await fetch(`${ORIGIN}/signed/card_index.json`)).json();
const cardId = idx.cards[0].card;
const genuine = await (await fetch(`${ORIGIN}/signed/cards/${cardId}.json`)).json();

// (1) genuine, passed as its published URL
const v1 = await rpc("tools/call", {
  name: "verify_card",
  arguments: { card: `${ORIGIN}/signed/cards/${cardId}.json` },
});
expect("genuine card", v1.result.structuredContent.state, "VALID");

// (2) tampered: one field of the body changed, id and signature left as published
const tampered = structuredClone(genuine);
tampered.body.axis = (tampered.body.axis ?? "axis") + "-tampered";
const v2 = await rpc("tools/call", { name: "verify_card", arguments: { card: tampered } });
expect("tampered body", v2.result.structuredContent.state, "INVALID");

// (3) forged: new body, freshly generated key, internally consistent id+signature.
// Verifying against the card's OWN key would say "fine" — the pinned key must not.
const { privateKey, publicKey } = generateKeyPairSync("ed25519");
const forgedPubHex = publicKey.export({ format: "der", type: "spki" }).subarray(-32).toString("hex");
const forgedBody = { axis: "jail", accuracy: 99.9, note: "forged for the smoke test" };
const preimage = Buffer.from(canonical(forgedBody), "utf8");
const forged = {
  id: createHash("sha256").update(preimage).digest("hex"),
  body: forgedBody,
  pubkey: forgedPubHex,
  signature: edSign(null, preimage, privateKey).toString("hex"),
};
const v3 = await rpc("tools/call", { name: "verify_card", arguments: { card: forged } });
expect("forged self-keyed card", v3.result.structuredContent.state, "INVALID");
const distinct =
  v2.result.structuredContent.reason !== v3.result.structuredContent.reason;
console.log(
  `${distinct ? "PASS" : "FAIL"}  tampered and forged carry DIFFERENT reasons:\n` +
    `      tampered: ${v2.result.structuredContent.reason}\n` +
    `      forged:   ${v3.result.structuredContent.reason}`,
);
if (!distinct) process.exitCode = 1;

server.stdin.end();
