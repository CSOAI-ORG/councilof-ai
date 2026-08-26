#!/usr/bin/env node
/**
 * NEXT_300 #221–230 — honesty-path crawl + route-manifest scan.
 * Prefer BASE_URL live check; always fail if route-manifest lacks /indices|/products.
 */
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname;
const MANIFEST = join(ROOT, "client/src/data/route-manifest.ts");
const PATHS = [
  "/",
  "/indices",
  "/indices/ai-economy",
  "/indices/human-labour",
  "/indices/humanoid-labour",
  "/products",
  "/powered-by",
  "/refutation-ledger",
  "/gspc-verify",
  "/dashboard/measurement",
];

let fail = 0;

if (existsSync(MANIFEST)) {
  const m = readFileSync(MANIFEST, "utf8");
  for (const must of ["/indices", "/products", "/powered-by"]) {
    if (!m.includes(must)) {
      console.error(`FAIL route-manifest missing ${must}`);
      fail++;
    } else {
      console.log(`OK manifest ${must}`);
    }
  }
} else {
  console.error("FAIL missing route-manifest.ts");
  fail++;
}

const BASE = process.env.BASE_URL;
if (BASE) {
  for (const p of PATHS) {
    try {
      const r = await fetch(BASE + p, { redirect: "follow" });
      const ok = r.status === 200;
      console.log(`${ok ? "OK" : "FAIL"} ${r.status} ${p}`);
      if (!ok) fail++;
    } catch (e) {
      console.log(`FAIL 000 ${p} ${e.message}`);
      fail++;
    }
  }
} else {
  console.log("SKIP live fetch (set BASE_URL to crawl HTTP) — manifest scan only");
}

if (fail) process.exit(1);
console.log(`broken-link-crawl OK — ${PATHS.length} honesty paths listed`);
