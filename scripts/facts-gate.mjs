#!/usr/bin/env node
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const bodyDir = join(__dirname, "_gate_body");
const n = 4;
const code = Array.from({ length: n }, (_, i) =>
  readFileSync(join(bodyDir, `part${i}.txt`), "utf8")
).join("");
mkdirSync(bodyDir, { recursive: true });
const assembled = join(bodyDir, "_assembled.mjs");
writeFileSync(assembled, code);
const r = spawnSync(process.execPath, [assembled, ...process.argv.slice(2)], {
  stdio: "inherit",
  env: process.env,
});
process.exit(r.status === null ? 1 : r.status);
