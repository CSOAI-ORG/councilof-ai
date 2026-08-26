#!/usr/bin/env node
/** NEXT_300 #221–230 — crawl honesty paths against a running BASE_URL. */
const BASE = process.env.BASE_URL || "http://127.0.0.1:43125";
const PATHS = [
  "/", "/indices", "/indices/ai-economy", "/indices/human-labour", "/indices/humanoid-labour",
  "/products", "/powered-by", "/refutation-ledger", "/gspc-verify", "/dashboard/measurement",
];

let fail = 0;
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
if (fail) process.exit(1);
console.log(`broken-link-crawl OK — ${PATHS.length} honesty paths`);
