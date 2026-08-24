#!/usr/bin/env node
/**
 * Offline East-West pack check — cryptography-stdlib only (Node crypto).
 * Usage: node public/east-west/verify-pack.mjs path/to/pack.json
 * Exit 0 = VALID, 1 = INVALID.
 */
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";

function canonical(o) {
  if (o === null || typeof o !== "object") return JSON.stringify(o);
  if (Array.isArray(o)) return `[${o.map(canonical).join(",")}]`;
  return `{${Object.keys(o)
    .sort()
    .map((k) => `${JSON.stringify(k)}:${canonical(o[k])}`)
    .join(",")}}`;
}

function sha256Hex(text) {
  return createHash("sha256").update(text).digest("hex");
}

const file = process.argv[2];
If (!file) {
  console.error("usage: node verify-pack.mjs <pack.json>");
  process.exit(1);
}

const pack = JSON.parse(readFileSync(file, "utf8"));
const card = pack.card ?? pack;
const { contentHash, signature, ...body } = card;
const recomputed = sha256Hex(canonical(body));
const ok = contentHash && recomputed === contentHash;
if (!ok) {
  console.error("INVALID — contentHash mismatch");
  console.error(" claimed ", String(contentHash).slice(0, 16));
  console.error(" computed", recomputed.slice(0, 16));
  process.exit(1);
}
if (card.measured && card.measured !== "13 measured of 14") {
  console.error("INVALID — grammar count must be 13 measured of 14");
  process.exit(1);
}
if (/certif/i.test(JSON.stringify(card.grammar ?? ""))) {
  console.error("INVALID — certification grammar");
  process.exit(1);
}
console.log("VALID");
console.log("id", card.id);
console.log("contentHash", contentHash);
console.log("signature", signature?.status ?? "UNSIGNED");
process.exit(0);
