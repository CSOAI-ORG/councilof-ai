#!/usr/bin/env node
/** Decode public/regulator-indices-one-pager.pdf.b64 → .pdf (MCP-safe binary path).
 * Also supports .b64.part0, .b64.part1, ... when the sidecar was split for MCP size limits.
 */
import { readFileSync, writeFileSync, existsSync, readdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const pub = resolve(root, "public");
const single = resolve(pub, "regulator-indices-one-pager.pdf.b64");
let b64;
if (existsSync(single)) {
  b64 = readFileSync(single, "utf8");
} else {
  const parts = readdirSync(pub)
    .filter((n) => /^regulator-indices-one-pager\.pdf\.b64\.part\d+$/.test(n))
    .sort((a, b) => Number(a.match(/part(\d+)$/)[1]) - Number(b.match(/part(\d+)$/)[1]));
  if (!parts.length) throw new Error("no .b64 sidecar or parts");
  b64 = parts.map((n) => readFileSync(resolve(pub, n), "utf8")).join("");
}
b64 = b64.replace(/\s+/g, "");
const buf = Buffer.from(b64, "base64");
if (buf.subarray(0, 5).toString() !== "%PDF-") throw new Error("not a PDF");
if (buf.length < 10000) throw new Error("PDF too small");
writeFileSync(resolve(pub, "regulator-indices-one-pager.pdf"), buf);
console.log("wrote PDF", buf.length, "bytes");
