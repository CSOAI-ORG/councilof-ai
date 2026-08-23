#!/usr/bin/env node
/**
 * e2e-integration-stack.mjs — one pass over the full user stack:
 *   lobby chat · AG-UI · living board · models · MCP · OpenRouter metadata honesty
 *
 * Read-only against live host. Exit 1 on any failure.
 *
 *   node scripts/e2e-integration-stack.mjs
 *   node scripts/e2e-integration-stack.mjs --host https://councilof.ai
 */

const arg = (k, d) => {
  const i = process.argv.indexOf("--" + k);
  return i > 0 ? process.argv[i + 1] : d;
};
const HOST = (arg("host", "https://councilof.ai")).replace(/\/$/, "");
const UA = "CSOAI-integration-stack/1.0";

let fails = 0;
const fail = (m) => { console.log(`  ✗ ${m}`); fails++; };
const pass = (m) => console.log(`  ✓ ${m}`);

async function get(path) {
  const r = await fetch(HOST + path, { headers: { "user-agent": UA }, redirect: "follow" });
  return { status: r.status, body: await r.text() };
}

async function postChat(q) {
  const r = await fetch(HOST + "/api/chat", {
    method: "POST",
    headers: { "content-type": "application/json", "user-agent": UA },
    body: JSON.stringify({ messages: [{ role: "user", content: q }] }),
  });
  return { status: r.status, json: await r.json().catch(() => ({})) };
}

console.log(`INTEGRATION-STACK — ${HOST}\n`);

// ── 1. Living board (OpenRouter feeds this via harness, not direct) ──
console.log("## Board + models\n");
const gspc = await get("/api/gspc");
if (gspc.status !== 200) fail(`/api/gspc HTTP ${gspc.status}`);
else {
  try {
    const j = JSON.parse(gspc.body);
    if (j.totals?.axes !== 14) fail(`axes count ${j.totals?.axes}`);
    else pass("GET /api/gspc — 14 axes");
    if (j.totals?.measured_axes !== 13) fail(`measured ${j.totals?.measured_axes}`);
    else pass("GET /api/gspc — 13 measured of 14");
    if (!String(j.totals?.public_count || "").includes("13 measured")) fail("public_count drift");
    else pass("public_count honest");
  } catch { fail("/api/gspc invalid JSON"); }
}

const board = await get("/gspc-scoreboard");
if (board.status !== 200 || board.body.length < 50000) fail(`/gspc-scoreboard thin or ${board.status}`);
else pass(`/gspc-scoreboard living (${board.body.length} B)`);

const models = await get("/models");
if (models.status >= 400) fail(`/models HTTP ${models.status}`);
else pass("/models registry page");

// ── 2. Council Lobby chat contract ──
console.log("\n## Lobby chat (/api/chat)\n");
const chat = await postChat("What does the Council of AI measure?");
if (chat.status !== 200) fail(`POST /api/chat HTTP ${chat.status}`);
else if (chat.json.state === "ungrounded") fail("chat refused public ask");
else if (!chat.json.answer && !chat.json.reply) fail("chat empty answer");
else pass(`POST /api/chat grounded (${chat.json.state})`);

// ── 3. AG-UI surfaces ──
console.log("\n## AG-UI\n");
const agui = await fetch(HOST + "/ag-ui", { redirect: "manual", headers: { "user-agent": UA } });
if (agui.status === 308 && agui.headers.get("location")?.includes("lobby=home")) {
  fail("/ag-ui redirects to lobby — AgUiBridge blocked");
} else if (agui.status >= 400) {
  fail(`/ag-ui HTTP ${agui.status}`);
} else {
  pass(`/ag-ui HTTP ${agui.status} (not lobby redirect)`);
}

const aguiAlias = await fetch(HOST + "/agui", { redirect: "manual", headers: { "user-agent": UA } });
const loc = aguiAlias.headers.get("location") || "";
if (aguiAlias.status === 308 && loc.includes("ag-ui")) pass("/agui → /ag-ui redirect");
else if (aguiAlias.status === 200) pass("/agui serves content");
else fail(`/agui HTTP ${aguiAlias.status} (want 308→ag-ui or 200)`);

// ── 4. MCP tools (measure, verify, jail, arena) ──
console.log("\n## MCP catalog\n");
const mcp = await get("/.well-known/mcp.json");
if (mcp.status !== 200) fail("mcp.json missing");
else {
  for (const tool of ["measure", "verify", "jail-probe", "enter-arena"]) {
    if (!mcp.body.includes(tool)) fail(`mcp missing tool: ${tool}`);
    else pass(`mcp tool: ${tool}`);
  }
}

// ── 5. Static AG-UI host (iframe source) ──
console.log("\n## Static AG-UI iframe source\n");
try {
  const staticAg = await fetch("https://csoai-site.pages.dev/ag-ui", { headers: { "user-agent": UA } });
  if (staticAg.status !== 200) fail(`csoai-site ag-ui HTTP ${staticAg.status}`);
  else {
    const b = await staticAg.text();
    if (!b.includes("council-chat-ask")) fail("static ag-ui missing postMessage bridge");
    else pass("static ag-ui has council-chat-ask bridge");
    if (b.length < 10000) fail("static ag-ui suspiciously thin");
    else pass(`static ag-ui fat (${b.length} B)`);
  }
} catch (e) {
  fail(`static ag-ui fetch: ${e.message}`);
}

console.log("");
if (fails) {
  console.error(`INTEGRATION-STACK: FAIL — ${fails} check(s)`);
  process.exit(1);
}
console.log("INTEGRATION-STACK: PASS — lobby, board, AG-UI, MCP aligned.");
