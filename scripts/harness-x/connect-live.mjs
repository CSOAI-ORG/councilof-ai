#!/usr/bin/env node
/**
 * connect-live — test every copy-paste block on /connect/ against the live doors.
 *
 *   node scripts/harness-x/connect-live.mjs              read distribution/connect/connect-matrix.json, probe, write
 *                                                       distribution/connect/connect-live-check.json
 *   node scripts/harness-x/connect-live.mjs --origin https://<preview>.pages.dev
 *                                                       PRE-DEPLOY: answer every councilof.ai door from this origin
 *                                                       instead, and say so in the record (stand_in_for)
 *
 * What each block gets (and what it does not):
 *   - every door URL in the block: MCP initialize + tools/list must answer, with the tool count recorded;
 *   - kind json: JSON.parse; kind toml: key = "value" lines only; kind python: python3 ast.parse (top-level await
 *     allowed); kind shell: bash -n; kind curl: EXECUTED, and its output must be a JSON-RPC tools/list result.
 *   - the client's own UI or CLI is NOT driven here (no Cursor, no Copilot Studio on this host). Those steps are
 *     copied from the vendor documentation linked on each row, and the record says "client_steps": "not exercised".
 * A block passes only when every check it has passes. Fails closed: an unreachable door is a FAIL.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
const args = process.argv.slice(2);
const at = args.indexOf("--origin");
const ORIGIN = at >= 0 ? args[at + 1].replace(/\/+$/, "") : null;
const matrix = JSON.parse(readFileSync(join(REPO, "distribution/connect/connect-matrix.json"), "utf8"));
const OUT = join(REPO, "distribution/connect/connect-live-check.json");
const contact = (u) => (ORIGIN ? u.replace("https://councilof.ai", ORIGIN) : u);

async function rpc(url, method, params) {
  const r = await fetch(contact(url), {
    method: "POST",
    headers: { "content-type": "application/json", accept: "application/json, text/event-stream", "user-agent": "csoai-connect-live/1 (+https://councilof.ai/connect/)" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, ...(params ? { params } : {}) }),
    signal: AbortSignal.timeout(30000),
  });
  const t = (await r.text()).trim();
  const body = t.startsWith("{") ? t : t.split("\n").filter((l) => l.startsWith("data:")).pop()?.slice(5);
  const msg = JSON.parse(body);
  if (msg.error) throw new Error(`JSON-RPC error ${msg.error.code}: ${msg.error.message}`);
  return msg.result;
}

const doors = {};
for (const url of [matrix.doors.free.url, matrix.doors.full.url]) {
  try {
    const init = await rpc(url, "initialize", { protocolVersion: "2025-06-18", capabilities: {}, clientInfo: { name: "csoai-connect-live", version: "1" } });
    const tl = await rpc(url, "tools/list");
    doors[url] = { state: "PASS", contacted: contact(url), server: init.serverInfo, protocol: init.protocolVersion, tools: tl.tools.length, names: tl.tools.map((t) => t.name) };
  } catch (e) {
    doors[url] = { state: "FAIL", contacted: contact(url), reason: `${e.name}: ${e.message}` };
  }
}

const syntax = (c) => {
  switch (c.kind) {
    case "json":
      try { JSON.parse(c.snippet); return ["json parses", true, ""]; } catch (e) { return ["json parses", false, e.message]; }
    case "toml":
      return ["toml is [table] + key = \"value\" lines", c.snippet.split("\n").every((l) => /^\[[\w.-]+\]$/.test(l) || /^\w+ = "[^"]*"$/.test(l) || !l.trim()), ""];
    case "python": {
      const r = spawnSync("python3", ["-c", "import ast,sys;compile(sys.stdin.read(),'<snippet>','exec',flags=ast.PyCF_ONLY_AST|ast.PyCF_ALLOW_TOP_LEVEL_AWAIT)"], { input: c.snippet, encoding: "utf8" });
      return ["python parses (ast)", r.status === 0, r.stderr.trim().split("\n").pop() ?? ""];
    }
    case "shell": {
      const r = spawnSync("bash", ["-n"], { input: c.snippet, encoding: "utf8" });
      return ["shell syntax (bash -n)", r.status === 0, r.stderr.trim()];
    }
    case "curl": {
      const r = spawnSync("bash", ["-c", ORIGIN ? c.snippet.replaceAll("https://councilof.ai", ORIGIN) : c.snippet], { encoding: "utf8", timeout: 60000 });
      let n = null;
      try {
        const t = r.stdout.trim();
        const body = t.startsWith("{") ? t : t.split("\n").filter((l) => l.startsWith("data:")).pop().slice(5);
        n = JSON.parse(body).result.tools.length;
      } catch { /* n stays null */ }
      return ["curl block executed: tools/list answered", r.status === 0 && typeof n === "number" && n > 0, n === null ? (r.stderr || r.stdout).slice(0, 200) : `${n} tools`];
    }
    default:
      return ["text block (form values): no syntax to check", true, ""];
  }
};

const clients = matrix.clients.map((c) => {
  const urls = [...new Set([...c.snippet.matchAll(/https:\/\/councilof\.ai[^\s"')]*/g)].map((m) => m[0]))];
  const checks = urls.map((u) => {
    const d = doors[u];
    return d ? { check: `door answers initialize + tools/list: ${u}`, ok: d.state === "PASS", detail: d.state === "PASS" ? `${d.tools} tools, server ${d.server?.version}` : d.reason }
      : { check: `url is one of the two doors: ${u}`, ok: false, detail: "not a door" };
  });
  if (!urls.length) checks.push({ check: "names a door", ok: false, detail: "no councilof.ai URL in the block" });
  const [name, ok, detail] = syntax(c);
  checks.push({ check: name, ok, detail });
  return {
    id: c.id,
    platform: c.platform,
    door: c.door,
    state: checks.every((x) => x.ok) ? "PASS" : "FAIL",
    checks,
    client_steps: c.kind === "curl" ? "executed here" : "not exercised: the client's own UI or CLI was not run on this host; the steps follow the vendor documentation linked in docs",
    docs: c.docs,
  };
});

const record = {
  schema: "csoai.connect-live-check/1",
  generated_by: "scripts/harness-x/connect-live.mjs",
  checked_at: new Date().toISOString(),
  scope: ORIGIN ? `PRE-DEPLOY stand-in: every https://councilof.ai door was contacted at ${ORIGIN}` : "live: the doors were contacted at https://councilof.ai",
  ...(ORIGIN ? { stand_in_for: "https://councilof.ai" } : {}),
  matrix_sha256: (await import("node:crypto")).createHash("sha256").update(readFileSync(join(REPO, "distribution/connect/connect-matrix.json"))).digest("hex"),
  doors,
  clients,
  totals: { clients: clients.length, pass: clients.filter((c) => c.state === "PASS").length, fail: clients.filter((c) => c.state === "FAIL").length },
  doctrine: "measurement, not certification",
};
writeFileSync(OUT, JSON.stringify(record, null, 2) + "\n");
for (const c of clients) console.log(`${c.state.padEnd(5)} ${c.id.padEnd(18)} ${c.checks.filter((x) => !x.ok).map((x) => `${x.check}: ${x.detail}`).join("; ")}`);
console.log(`\nconnect-live: ${record.totals.pass}/${record.totals.clients} PASS · doors ${Object.entries(doors).map(([u, d]) => `${u} ${d.state}${d.tools ? ` (${d.tools})` : ""}`).join(" · ")} → ${OUT}`);
process.exit(record.totals.fail ? 1 : 0);
