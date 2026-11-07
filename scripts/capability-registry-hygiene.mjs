#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const REGISTRY = path.join(ROOT, "capabilities", "registry.json");

export function validateRegistry(doc) {
  const errors = [];
  const seen = new Set();
  const allowed = new Set(["http", "mcp", "a2a"]);
  for (const cap of doc.capabilities ?? []) {
    const id = String(cap.id ?? "");
    const endpoint = String(cap.endpoint ?? "");
    const lowered = (id + " " + endpoint).toLowerCase();
    if (!id) errors.push("capability without id");
    if (seen.has(id)) errors.push(`duplicate id: ${id}`);
    seen.add(id);
    if (/\.test\b|_test\b|__test\b/.test(lowered)) {
      errors.push(`test-only capability leaked: ${id} ${endpoint}`);
    }
    const protocols = Array.isArray(cap.protocols) ? cap.protocols : [];
    if (!protocols.length) errors.push(`no protocols: ${id}`);
    for (const p of protocols) {
      if (!allowed.has(String(p))) errors.push(`unknown protocol ${p}: ${id}`);
    }
  }
  return errors;
}
if (process.argv.includes("--selftest")) {
  const good = { capabilities: [{ id: "read", endpoint: "/api/read", protocols: ["http"] }] };
  const bad = { capabilities: [
    { id: "read_test", endpoint: "/api/read.test", protocols: ["http"] },
    { id: "dup", endpoint: null, protocols: ["mcp"] },
    { id: "dup", endpoint: null, protocols: ["bogus"] },
  ] };
  if (validateRegistry(good).length !== 0) throw new Error("good fixture failed");
  const badErrors = validateRegistry(bad);
  if (badErrors.length < 3) throw new Error("bad fixture did not fail strongly");
  console.log("selftest OK: good fixture passes; test leak/duplicate/protocol drift fail");
  process.exit(0);
}

const doc = JSON.parse(fs.readFileSync(REGISTRY, "utf8"));
const errors = validateRegistry(doc);
if (errors.length) {
  console.error("capability registry hygiene FAILED");
  for (const error of errors) console.error(" -", error);
  process.exit(1);
}
console.log(`capability registry hygiene PASS: ${doc.capabilities?.length ?? 0} capabilities`);
