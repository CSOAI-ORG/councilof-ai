#!/usr/bin/env node
/**
 * persona-gauntlet.mjs — 8 personas hit the LIVE site; exit 1 if any persona's
 * surface regressed on canon (EAT 0.8). Read-only; no secrets; extends the
 * drift-guard pattern (fetch + assert) so it runs in CI with no browser.
 *
 * Personas: visitor · buyer · auditor · researcher · api-agent · a2a-agent ·
 * regulator · enterprise. Each has its route, required markers, and kill-strings.
 */

const hostFlag = process.argv.indexOf("--host");
const HOST = (hostFlag > 0 && process.argv[hostFlag + 1] ? process.argv[hostFlag + 1] : "https://councilof.ai").replace(/\/$/, "");
const KILL = [/\bsovereign\b/i, /\bceasai\b/i, /\bbyzantine\b/i, /\bBFT\b/, /Watchdog certification/i, /33-Agent/i, /£\d[\d,]*\/(mo|month|yr|year)/i, /\$\d[\d,]*\/(mo|month)/i, /Pro tier/i];

const PERSONAS = [
  { who: "visitor",    path: "/",                              must: ["Council of AI", "We measure"] },
  { who: "buyer",      path: "/pricing",                       must: ["free"] },
  { who: "auditor",    path: "/honesty",                       must: ["council-oowm"] },
  { who: "researcher", path: "/library",                       must: ["reference pages across"] },
  { who: "api-agent",  path: "/api/gspc",                      must: ['"measured_axes"', '"quotable_axes"', '"public_count"'] , json: true },
  { who: "a2a-agent",  path: "/.well-known/agent-card.json",   must: ['"doi"', "CSOAI Ltd"], json: true, forbid: [/MEOK AI Labs/, /\$\d+\/mo/] },
  { who: "regulator",  path: "/regulators",                    must: [] },
  { who: "enterprise", path: "/start",                         must: [] },
];

let fails = 0;
const fail = (m) => { console.log(`  ✗ ${m}`); fails++; };
const pass = (m) => console.log(`  ✓ ${m}`);

console.log(`PERSONA-GAUNTLET — ${HOST}\n`);
for (const p of PERSONAS) {
  try {
    const r = await fetch(HOST + p.path, { headers: { "user-agent": "persona-gauntlet" }, redirect: "follow" });
    const body = await r.text();
    if (r.status !== 200) { fail(`${p.who} ${p.path}: HTTP ${r.status}`); continue; }
    if (p.json) { try { JSON.parse(body); } catch { fail(`${p.who} ${p.path}: not valid JSON`); continue; } }
    const missing = p.must.filter((m) => !body.includes(m));
    if (missing.length) { fail(`${p.who} ${p.path}: missing ${JSON.stringify(missing)}`); continue; }
    // kill-strings scan on VISIBLE text for HTML, whole body for JSON
    const scan = p.json ? body : body.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ").replace(/<[^>]+>/g, " ");
    const killers = [...KILL, ...(p.forbid || [])].filter((re) => re.test(scan));
    if (killers.length) { fail(`${p.who} ${p.path}: kill-string hit ${killers.map(String).join(", ")}`); continue; }
    if (p.json && p.path === "/api/gspc") {
      const t = JSON.parse(body).totals || {};
      // The sentence must DERIVE from the integers beside it, so a hand-edited
      // count cannot survive here. Grammar per ADR-001 and the 2026-08-26 sweep:
      // "<slots> axes · <measured> measured". This check used to require the
      // retired "<measured> measured of <quotable> quotable" form, which hid the
      // unmeasured slots entirely — the defect the sweep exists to correct.
      const derived = `${t.axes} axes · ${t.measured_axes} measured`;
      if (typeof t.public_count !== "string" || !String(t.public_count).startsWith(derived)) {
        fail(`${p.who}: public_count ${JSON.stringify(t.public_count)} does not derive from axes/measured_axes (want "${derived}")`);
        continue;
      }
      // Both numbers must travel, and the unmeasured slots must add up. A board
      // whose measured count equals its slot count without every slot carrying a
      // run is the exact over-claim this gauntlet is here to catch.
      if (t.axes - t.measured_axes !== t.unmeasured_axes) {
        fail(`${p.who}: totals do not balance — axes ${t.axes} − measured ${t.measured_axes} ≠ unmeasured ${t.unmeasured_axes}`);
        continue;
      }
    }
    pass(`${p.who} ${p.path}`);
  } catch (e) {
    fail(`${p.who} ${p.path}: fetch error ${e.message}`);
  }
}

console.log("");
if (fails) { console.error(`PERSONA-GAUNTLET: FAIL — ${fails} persona(s) regressed.`); process.exit(1); }
console.log("PERSONA-GAUNTLET: PASS — all 8 personas clean.");
