#!/usr/bin/env node
/**
 * e2e-persona-walk.mjs — walk councilof.ai as every demographic we already cover.
 *
 *   node scripts/e2e-persona-walk.mjs
 *   E2E_BASE=https://councilof.ai node scripts/e2e-persona-walk.mjs
 *
 * Does not invent audiences. Uses:
 *   - lobby AUDIENCES (asks.ts)
 *   - /for/:persona landings (PersonaRouter)
 *   - homepage industry slugs + canonical industries
 *   - competitor /vs/:vendor
 *   - Council OS aliases (/gspc, /console, /lobby)
 *   - Layer 0 surfaces
 *   - the ask-bar questions against POST /api/chat (must ground, not refuse)
 */
const BASE = process.env.E2E_BASE || "https://councilof.ai";

const AUDIENCE_ASKS = {
  public: "In plain words, what does the Council of AI actually measure?",
  builder: "How is a measurement card signed, and how do I verify one without trusting you?",
  compliance: "What does the Council refuse to state an opinion on, and why?",
  procurement: "What can I rely on in a published measurement, and what is explicitly out of scope?",
  board: "What is the one-paragraph summary of what is measured and what is not?",
  researcher: "What is the minimum n for a quotable figure, and what happens below it?",
  press: "Who publishes these numbers, and what is the legal entity behind them?",
  insurer: "What can an underwriter rely on in a signed measurement card?",
  regulator: "Which figures on the board are safe to quote today, and which are not?",
};

const PAGES = [
  "/",
  "/gspc",
  "/gspc-scoreboard/",
  "/gspc-verify/",
  "/verify",
  "/os",
  "/gspc-arena/",
  "/assess/",
  "/watchdog/",
  "/academy/",
  "/console",
  "/council-os",
  "/lobby",
  "/compare/",
  "/vs/vanta",
  "/vs/drata",
  "/for/regulator",
  "/for/enterprise",
  "/for/finance",
  "/for/healthcare",
  "/for/startup",
  "/for/sec-filer",
  "/insurers/",
  "/regulators/",
  "/industries/",
  "/industries/insurance",
  "/industries/finance",
  "/industries/healthcare",
  "/layer0/",
  "/trust-center/",
  "/network/",
  "/distribution/",
  "/intel/",
  "/hive/",
  "/methodology/",
  "/honesty/",
  "/.well-known/scitt.json",
];

let failed = 0;
function pass(name, detail = "") {
  console.log(`PASS  ${name}${detail ? " — " + detail : ""}`);
}
function fail(name, detail = "") {
  failed += 1;
  console.log(`FAIL  ${name}${detail ? " — " + detail : ""}`);
}

async function get(path) {
  const res = await fetch(BASE + path, {
    headers: { "User-Agent": "CSOAI-e2e-persona-walk/1.0" },
    redirect: "follow",
  });
  const text = await res.text();
  return { res, text, bytes: text.length };
}

console.log(`# persona walk  ${BASE}\n`);

for (const path of PAGES) {
  try {
    const { res, text, bytes } = await get(path);
    const title = (text.match(/<title>([^<]+)/i) || [])[1] || "";
    if (res.status >= 400 || /404 — Not found/i.test(title)) {
      fail(`${path} HTTP ${res.status}`, title.slice(0, 80));
    } else if (path.includes("gspc-scoreboard") && /13 axes\s*[×x]\s*19/i.test(text)) {
      fail(`${path} is the leftover static table`, "hardcoded 13×19");
    } else if (path === "/" && bytes < 20000) {
      fail("homepage thin Vite shell", `${bytes} bytes`);
    } else {
      pass(`${path} HTTP ${res.status}`, `${bytes} B  ${title.slice(0, 50)}`);
    }
  } catch (e) {
    fail(path, String(e).slice(0, 120));
  }
}

for (const [id, q] of Object.entries(AUDIENCE_ASKS)) {
  try {
    const res = await fetch(BASE + "/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json", "User-Agent": "CSOAI-e2e-persona-walk/1.0" },
      body: JSON.stringify({ messages: [{ role: "user", content: q }] }),
    });
    const j = await res.json();
    const answer = String(j.answer || j.reply || "");
    const state = String(j.state || "");
    if (!res.ok) fail(`ask ${id}`, `HTTP ${res.status}`);
    else if (state === "ungrounded" || /I won't answer this one/i.test(answer)) {
      fail(`ask ${id} grounded`, `state=${state} — suggested question was refused`);
    } else if (answer.length < 40) {
      fail(`ask ${id} substance`, answer.slice(0, 80));
    } else {
      pass(`ask ${id} ${state || "ok"}`, answer.slice(0, 70).replace(/\s+/g, " "));
    }
  } catch (e) {
    fail(`ask ${id}`, String(e).slice(0, 120));
  }
}

if (failed) {
  console.log(`\n${failed} check(s) failed`);
  process.exit(1);
}
console.log("\nOK");
