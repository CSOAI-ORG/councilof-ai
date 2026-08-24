#!/usr/bin/env node
/** Live / local regression for POST /api/assess — keyword measurement, not a bench. */
const host = (process.argv.find((a) => a.startsWith("--host="))?.slice(7) || "https://councilof.ai").replace(/\/$/, "");

const CASES = [
  {
    body: { system: "hiring screener for job applicants", purpose: "rank CVs", domain: "employment" },
    want: "HIGH_RISK",
    not: "I could not ground",
  },
  {
    body: { endpoint: "https://example.com/hire", purpose: "rank job applicants" },
    want: "HIGH_RISK",
  },
  {
    body: { system: "x" },
    want: "UNMEASURED",
    status: 400,
  },
];

let fail = 0;
console.log(`ASSESS-INTAKE — ${host}\n`);
for (const c of CASES) {
  const r = await fetch(`${host}/api/assess`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "cache-control": "no-cache" },
    body: JSON.stringify(c.body),
  });
  const j = await r.json();
  const tier = String(j.tier || "");
  const okTier = tier === c.want;
  const okStatus = c.status ? r.status === c.status : r.status === 200;
  const okNot = c.not ? !JSON.stringify(j).includes(c.not) : true;
  const ok = okTier && okStatus && okNot;
  console.log(ok ? "  ok" : "  FAIL", JSON.stringify(c.body).slice(0, 70), "→", tier, r.status);
  if (!ok) fail++;
}
console.log(fail ? `\nFAIL ${fail}` : "\nPASS");
process.exit(fail ? 1 : 0);
