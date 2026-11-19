import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { probeBrainHealth, SYSTEM_CARD_TITLE } from "./claims-e2e-contract.mjs";

const base = "https://brain.invalid/api";
const healthy = { ok: true, service: "sovereign-backend" };
const reply = (body, status = 200, type = "application/json") =>
  new Response(typeof body === "string" ? body : JSON.stringify(body), {
    status, headers: { "content-type": type },
  });

test("only a successful identified brain response enables its dependent checks", async () => {
  const calls = [];
  const state = await probeBrainHealth(base, async (...args) => {
    calls.push(args);
    return reply(healthy, 200, "application/json; charset=utf-8");
  });
  assert.equal(state.up, true);
  assert.deepEqual(state.health, healthy);
  assert.deepEqual(calls, [[base + "/health", { headers: { accept: "application/json" } }]]);
});

for (const status of [401, 404, 503]) {
  test(`HTTP ${status} cannot enable checks even with a healthy-looking JSON body`, async () => {
    const state = await probeBrainHealth(base, async () => reply(healthy, status));
    assert.equal(state.up, false);
    assert.match(state.why, new RegExp(`HTTP ${status}`));
    assert.equal(state.health, undefined);
  });
}

for (const [name, body] of [
  ["HIM edge health observed on 2026-11-08", { ok: true, him: "MEOK-HIM-001", edge: "cloudflare-pages-functions" }],
  ["another named service", { ok: true, service: "other-service" }],
  ["unhealthy brain", { ...healthy, ok: false }],
  ["truthy string instead of boolean", { ...healthy, ok: "true" }],
  ["missing service identity", { ok: true }],
  ["null", null], ["array", [healthy]], ["scalar", 1],
]) {
  test(`${name} leaves the brain claims uncheckable`, async () => {
    const state = await probeBrainHealth(base, async () => reply(body));
    assert.equal(state.up, false);
    assert.match(state.why, /did not identify a healthy sovereign-backend/);
    assert.equal(state.health, undefined);
  });
}

test("a SPA catch-all and an untyped JSON body cannot establish brain health", async () => {
  for (const response of [reply("<html>app</html>", 200, "text/html"), reply(healthy, 200, "")]) {
    const state = await probeBrainHealth(base, async () => response);
    assert.equal(state.up, false);
    assert.match(state.why, /expected JSON brain health/);
  }
});

test("malformed JSON is uncheckable and does not escape as a generic failure", async () => {
  const state = await probeBrainHealth(base, async () => reply("{"));
  assert.equal(state.up, false);
  assert.match(state.why, /did not return valid JSON/);
});

test("a network failure remains uncheckable", async () => {
  const state = await probeBrainHealth(base, async () => { throw new Error("connection refused"); });
  assert.equal(state.up, false);
  assert.match(state.why, /unreachable: connection refused/);
});

test("a JSON structured media type still requires the same service contract", async () => {
  const state = await probeBrainHealth(base, async () => reply(healthy, 200, "application/health+json"));
  assert.equal(state.up, true);
});

test("the canonical system-card title passes while generic and other-page titles fail", () => {
  assert.equal(SYSTEM_CARD_TITLE.test("Council system card | Council of AI"), true);
  for (const title of ["Council of AI", "Council model card | Council of AI", "System Safety Card", "Council system card | Other site"]) {
    assert.equal(SYSTEM_CARD_TITLE.test(title), false, title);
  }
});

// Execute the actual API/report functions without importing the browser launcher.
// Every network dependency is replaced by a fixture; no signing or live tool call runs.
const runner = readFileSync(new URL("./claims-e2e.mjs", import.meta.url), "utf8");
const reportAndApi = runner.slice(runner.indexOf("const R = [];"), runner.indexOf("async function open("));
const runApi = new Function("fetch", "probeBrainHealth", "BRAIN", "SITE",
  reportAndApi + "\nreturn apiTruth().then(() => R);");
function exitCode(rows) {
  let exit;
  new Function("R", "console", "process", "SITE", runner.slice(runner.indexOf("const passes =")))(
    rows, { log() {} }, { exit(code) { exit = code; } }, "https://site.invalid");
  return exit;
}
async function apiFixture(health) {
  const calls = [];
  const fakeFetch = async (url, options = {}) => {
    calls.push({ url, method: options.method || "GET" });
    const parsed = new URL(url);
    if (url === base + "/health") return reply(health);
    if (parsed.pathname === "/api/tools") {
      const q = parsed.searchParams.get("q");
      const tools = !q || q === "measure" ? [{ name: "measure" }] : [];
      return reply({ total: tools.length, tools, catalogue_total: 1, server_count: 1 });
    }
    if (parsed.pathname === "/api/og") return reply("png fixture", 200, "image/png");
    if (url === base + "/mcp") return reply({ result: { tools: [], content: [] } });
    if (url === base + "/sign") return reply({});
    throw new Error("unexpected fixture URL " + url);
  };
  const rows = await runApi(fakeFetch, (origin) => probeBrainHealth(origin, fakeFetch), base, "https://site.invalid");
  return { rows, calls };
}

test("wrong-service health produces explicit UNCHECKABLE rows, no dependent POSTs, and exit 1", async () => {
  const { rows, calls } = await apiFixture({ ok: true, him: "MEOK-HIM-001", edge: "cloudflare-pages-functions" });
  assert.equal(rows.filter((row) => row.startsWith("⚠️")).length, 5);
  assert.match(rows.find((row) => row.includes("Brain host")), /UNCHECKABLE: .*did not identify a healthy sovereign-backend/);
  assert.equal(rows.some((row) => row.startsWith("✅ Brain health")), false);
  assert.equal(calls.some((call) => call.method === "POST"), false);
  assert.equal(exitCode(rows), 1);
});

test("an eligible brain still fails real tool, framework, and signing checks; health is read once", async () => {
  const { rows, calls } = await apiFixture(healthy);
  for (const claim of ["Live MCP tools", "meok_govern", "Ed25519 signing"]) {
    assert.ok(rows.some((row) => row.startsWith("❌ " + claim)), claim);
  }
  assert.ok(rows.includes("✅ Brain health — sovereign-backend"));
  assert.equal(rows.some((row) => row.startsWith("⚠️")), false);
  assert.equal(calls.filter((call) => call.url === base + "/health").length, 1);
  assert.equal(exitCode(rows), 1);
});

test("the actual page check accepts its canonical title and still rejects missing body evidence", async () => {
  const pageFunction = runner.slice(runner.indexOf("async function sov3Pages("), runner.indexOf("async function interactive("));
  for (const body of ["Containment", "generic application shell"]) {
    const rows = [];
    const page = { waitForTimeout: async () => {}, title: async () => "Council system card | Council of AI",
      innerText: async () => body, close: async () => {} };
    await new Function("open", "SYSTEM_CARD_TITLE", "pass", "fail", pageFunction + "\nreturn sov3Pages({});")(
      async () => page, SYSTEM_CARD_TITLE,
      (claim, detail) => rows.push({ pass: true, claim, detail }),
      (claim, detail) => rows.push({ pass: false, claim, detail }));
    const systemRow = rows.find((row) => row.claim.includes("/sov3-system-card"));
    assert.equal(systemRow.pass, body === "Containment");
    if (body !== "Containment") assert.match(systemRow.detail, /bodyMatch=false/);
  }
});
