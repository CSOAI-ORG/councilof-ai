#!/usr/bin/env node
/** Decode public/regulator-indices-one-pager.pdf.b64 → .pdf (MCP-safe binary path). */
import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const b64 = readFileSync(resolve(root, "public/regulator-indices-one-pager.pdf.b64"), "utf8").replace(/\s+/g, "");
const buf = Buffer.from(b64, "base64");
if (buf.subarray(0, 5).toString() !== "%PDF-") throw new Error("not a PDF");
if (buf.length < 10000) throw new Error("PDF too small");
writeFileSync(resolve(root, "public/regulator-indices-one-pager.pdf"), buf);
console.log("wrote PDF", buf.length, "bytes");
