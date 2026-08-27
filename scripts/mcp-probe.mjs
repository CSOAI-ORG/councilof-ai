#!/usr/bin/env node
/**
 * mcp-probe — produce evidence/mcp-registry.json by ACTUALLY CONTACTING MCP servers.
 *
 * WHY THIS EXISTS (2026-08-26, lane A4):
 * `functions/api/mcp.ts` used to serve a hardcoded array of 6 servers in which every entry set
 * `last_checked: new Date().toISOString()`. That field was generated when the request was served,
 * so the endpoint asserted "checked just moments ago" on every call without contacting anything.
 * Two real requests three seconds apart returned 11:43:53.111Z and 11:43:56.233Z — the field simply
 * followed the clock. That is a fabricated freshness timestamp: the same defect class as
 * `"signed": true` with no signature, and it sat under a `predicates: PASS` block on the estate's
 * public governance API.
 *
 * The estate rule this restores: a component must be STRUCTURALLY UNABLE to report a measurement
 * it did not take. `last_probed` in the output can ONLY be written by a probe that returned.
 * If nothing answered, the field is null. There is no code path that synthesises it.
 *
 * The second failure this repairs is reproducibility. The prior 338-servers/1,869-tools figure came
 * from a probe script that was never committed, writing to /tmp. A number nobody can re-derive is
 * not a measurement. This script is committed, dependency-free, and writes to a tracked path.
 *
 * USAGE
 *   node scripts/mcp-probe.mjs                      # probe + write evidence/mcp-registry.json
 *   node scripts/mcp-probe.mjs --out path.json      # write elsewhere
 *   node scripts/mcp-probe.mjs --check              # exit 1 if the tracked artifact is stale/invalid
 *   node scripts/mcp-probe.mjs --selftest           # verify the honesty invariants, no network
 *
 * Requires Node 18+ (global fetch). No npm dependencies.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { spawn } from "node:child_process";
import { hostname } from "node:os";
import { fileURLToPath } from "node:url";
import { dirname, join, resolve } from "node:path";

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(HERE, "..");
const TARGETS = join(REPO, "scripts", "mcp-targets.json");
const DEFAULT_OUT = join(REPO, "evidence", "mcp-registry.json");

const PROTOCOL_VERSION = "2024-11-05";
const PROBE_METHOD =
  "JSON-RPC 2.0 over HTTPS POST: initialize -> tools/list, MCP protocolVersion " +
  PROTOCOL_VERSION + ". A server counts as reachable only if initialize returned a JSON-RPC result.";
const TIMEOUT_MS = Number(process.env.MCP_PROBE_TIMEOUT_MS || 15000);

// ---------------------------------------------------------------- transport

async function rpc(endpoint, method, params) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        accept: "application/json, text/event-stream",
      },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params: params || {} }),
      signal: ctrl.signal,
    });
    const text = await res.text();
    if (!res.ok) return { httpStatus: res.status, error: `HTTP ${res.status}`, body: null };
    // Accept both plain JSON and a single SSE `data:` frame.
    let payload = text.trim();
    if (payload.startsWith("event:") || payload.startsWith("data:")) {
      const line = payload.split("\n").find((l) => l.startsWith("data:"));
      payload = line ? line.slice(5).trim() : payload;
    }
    let body;
    try {
      body = JSON.parse(payload);
    } catch {
      return { httpStatus: res.status, error: "response was not JSON", body: null };
    }
    if (body.error) {
      return { httpStatus: res.status, error: `rpc error ${body.error.code}: ${body.error.message}`, body: null };
    }
    return { httpStatus: res.status, error: null, body };
  } catch (e) {
    const reason = e.name === "AbortError" ? `timeout after ${TIMEOUT_MS}ms` : `${e.name}: ${e.message}`;
    return { httpStatus: null, error: reason, body: null };
  } finally {
    clearTimeout(timer);
  }
}

// ---------------------------------------------------------------- probe

async function probeOne(target) {
  // Every field below starts unmeasured. Only a returning probe may overwrite one.
  const rec = {
    id: target.id,
    name: null,
    endpoint: target.endpoint,
    transport: target.transport || null,
    role: target.role || null,
    alias_of: target.alias_of || null,
    status: "unreachable",
    last_probed: null,
    http_status: null,
    protocol_version: null,
    server_version: null,
    tools_count: null,
    tools: [],
    error: null,
    declared_by: target.declared_by || null,
    catalogue_source: null,
    catalogue_claim: null,
  };

  const init = await rpc(target.endpoint, "initialize", {
    protocolVersion: PROTOCOL_VERSION,
    capabilities: {},
    clientInfo: { name: "csoai-mcp-probe", version: "1" },
  });
  rec.http_status = init.httpStatus;

  if (init.error || !init.body?.result) {
    rec.error = init.error || "initialize returned no result";
    return rec; // status stays `unreachable`; last_probed stays null.
  }

  // Only now — a server actually answered — may a timestamp be written.
  const answeredAt = new Date().toISOString();
  rec.status = "reachable";
  rec.last_probed = answeredAt;
  rec.protocol_version = init.body.result.protocolVersion || null;
  rec.name = init.body.result.serverInfo?.name || null;
  rec.server_version = init.body.result.serverInfo?.version || null;

  const list = await rpc(target.endpoint, "tools/list", {});
  if (list.error || !Array.isArray(list.body?.result?.tools)) {
    // Reachable, but the tool surface is unmeasured. Do NOT invent a count.
    rec.error = list.error || "tools/list returned no tools array";
    rec.tools_count = null;
    return rec;
  }
  rec.tools = list.body.result.tools.map((t) => ({
    name: t.name,
    description: t.description || null,
    required_args: t.inputSchema?.required || [],
  }));
  rec.tools_count = rec.tools.length; // derived from the array, never asserted
  rec.last_probed = new Date().toISOString();
  return rec;
}

/**
 * Probe a LOCAL stdio MCP server: spawn its command from the repo root, run the
 * same initialize -> tools/list conversation over newline-delimited JSON-RPC,
 * and apply the identical honesty rules — last_probed is written only after the
 * process actually answered, tools_count only from a returned tools array.
 * A stdio probe proves the server in THIS checkout runs; it says nothing about
 * any npm-published copy.
 */
async function probeStdioOne(target) {
  const rec = {
    id: target.id,
    name: null,
    endpoint: target.endpoint,
    transport: "stdio",
    role: target.role || null,
    alias_of: target.alias_of || null,
    status: "unreachable",
    last_probed: null,
    http_status: null, // not an HTTP transport; stays null by construction
    protocol_version: null,
    server_version: null,
    tools_count: null,
    tools: [],
    error: null,
    declared_by: target.declared_by || null,
    catalogue_source: null,
    catalogue_claim: null,
  };

  const [cmd, ...args] = target.command;
  const child = spawn(cmd === "node" ? process.execPath : cmd, args, {
    cwd: REPO,
    stdio: ["pipe", "pipe", "ignore"],
  });

  const replies = new Map();
  let buffered = "";
  child.stdout.on("data", (chunk) => {
    buffered += chunk;
    let nl;
    while ((nl = buffered.indexOf("\n")) >= 0) {
      const line = buffered.slice(0, nl).trim();
      buffered = buffered.slice(nl + 1);
      if (!line) continue;
      try {
        const msg = JSON.parse(line);
        const waiter = replies.get(msg.id);
        if (waiter) waiter(msg);
      } catch {
        /* non-JSON line: ignore */
      }
    }
  });

  const ask = (id, method, params) =>
    new Promise((res, rej) => {
      const timer = setTimeout(() => rej(new Error(`timeout after ${TIMEOUT_MS}ms`)), TIMEOUT_MS);
      replies.set(id, (msg) => {
        clearTimeout(timer);
        replies.delete(id);
        msg.error ? rej(new Error(`rpc error ${msg.error.code}: ${msg.error.message}`)) : res(msg);
      });
      child.stdin.write(JSON.stringify({ jsonrpc: "2.0", id, method, params: params || {} }) + "\n");
    });

  try {
    const init = await ask(1, "initialize", {
      protocolVersion: PROTOCOL_VERSION,
      capabilities: {},
      clientInfo: { name: "csoai-mcp-probe", version: "1" },
    });
    if (!init.result) {
      rec.error = "initialize returned no result";
      return rec;
    }
    rec.status = "reachable";
    rec.last_probed = new Date().toISOString();
    rec.protocol_version = init.result.protocolVersion || null;
    rec.name = init.result.serverInfo?.name || null;
    rec.server_version = init.result.serverInfo?.version || null;

    const list = await ask(2, "tools/list", {});
    if (!Array.isArray(list.result?.tools)) {
      rec.error = "tools/list returned no tools array";
      return rec;
    }
    rec.tools = list.result.tools.map((t) => ({
      name: t.name,
      description: t.description || null,
      required_args: t.inputSchema?.required || [],
    }));
    rec.tools_count = rec.tools.length; // derived, never asserted
    rec.last_probed = new Date().toISOString();
    return rec;
  } catch (e) {
    if (rec.status !== "reachable") rec.error = `${e.message}`;
    else rec.error = rec.error || `${e.message}`;
    return rec;
  } finally {
    child.kill();
  }
}

function catalogueRecord(entry) {
  return {
    id: entry.id,
    name: entry.name || null,
    endpoint: null,
    transport: null,
    role: null,
    alias_of: null,
    status: "catalogued-not-probed",
    last_probed: null,
    http_status: null,
    protocol_version: null,
    server_version: null,
    tools_count: null, // NEVER the catalogue's asserted number
    tools: [],
    error: null,
    declared_by: null,
    catalogue_source: entry.catalogue_source || null,
    catalogue_claim: entry.catalogue_claim
      ? { ...entry.catalogue_claim, verified: false }
      : null,
  };
}

// ---------------------------------------------------------------- assembly

function summarise(servers, targets, startedAt, finishedAt) {
  const reachable = servers.filter((s) => s.status === "reachable");
  // Aliases point at the same process. Counting them twice would inflate the fleet.
  const distinct = reachable.filter((s) => !s.alias_of);
  const toolsProbed = distinct.reduce((n, s) => n + (s.tools_count || 0), 0);

  return {
    reachable_endpoints: reachable.length,
    reachable_distinct_servers: distinct.length,
    unreachable_endpoints: servers.filter((s) => s.status === "unreachable").length,
    catalogued_not_probed: servers.filter((s) => s.status === "catalogued-not-probed").length,
    tools_probed: toolsProbed,
    tools_catalogued_not_probed: null,
    external_catalogues_not_probed: (targets.catalogues_not_probed || []).map((c) => ({
      id: c.id,
      count: c.count,
      unit: c.unit,
      source: c.source,
      probe_state: c.probe_state,
    })),
    started: startedAt,
    finished: finishedAt,
  };
}

async function run(outPath) {
  const targets = JSON.parse(readFileSync(TARGETS, "utf8"));
  const startedAt = new Date().toISOString();

  const probed = [];
  for (const t of targets.probe) {
    process.stdout.write(`probing ${t.endpoint} ... `);
    const rec = t.transport === "stdio" ? await probeStdioOne(t) : await probeOne(t);
    console.log(rec.status === "reachable" ? `reachable (${rec.tools_count ?? "tools unmeasured"})` : `unreachable — ${rec.error}`);
    probed.push(rec);
  }
  const catalogued = (targets.catalogued || []).map(catalogueRecord);
  const servers = [...probed, ...catalogued];
  const finishedAt = new Date().toISOString();

  const artifact = {
    schema: "csoai.mcp-registry/1",
    generated_by: "scripts/mcp-probe.mjs",
    probe_method: PROBE_METHOD,
    probe_host: hostname(),
    targets_file: "scripts/mcp-targets.json",
    honesty_contract: [
      "last_probed is written ONLY by a probe that returned. If nothing answered it is null. No code path synthesises it.",
      "tools_count is derived from the length of the probed tools array. A catalogue's asserted tool count is never used as tools_count.",
      "status is one of reachable | unreachable | catalogued-not-probed. Catalogued and probed are never summed.",
      "Endpoints carrying alias_of resolve to a server already counted; they are excluded from reachable_distinct_servers.",
      "Unknown is null or 'unmeasured'. It is never a plausible-looking value.",
    ],
    counts: summarise(servers, targets, startedAt, finishedAt),
    servers,
  };

  writeFileSync(outPath, JSON.stringify(artifact, null, 2) + "\n");
  const c = artifact.counts;
  console.log(
    `\nRESULT reachable_distinct=${c.reachable_distinct_servers} tools_probed=${c.tools_probed} ` +
      `unreachable=${c.unreachable_endpoints} catalogued_not_probed=${c.catalogued_not_probed}`
  );
  console.log(`artifact -> ${outPath}`);
  return artifact;
}

// ---------------------------------------------------------------- guards

/** The invariants that make this artifact trustworthy. Run in CI; no network needed. */
function validate(artifact) {
  const errs = [];
  const ok = (cond, msg) => { if (!cond) errs.push(msg); };

  ok(artifact.schema === "csoai.mcp-registry/1", "wrong schema");
  ok(typeof artifact.probe_method === "string" && artifact.probe_method.length > 20, "probe_method missing");
  ok(typeof artifact.probe_host === "string" && artifact.probe_host.length > 0, "probe_host missing");
  ok(Array.isArray(artifact.servers), "servers missing");

  const VALID = new Set(["reachable", "unreachable", "catalogued-not-probed"]);
  for (const s of artifact.servers || []) {
    ok(VALID.has(s.status), `${s.id}: invalid status "${s.status}"`);
    // The core invariant: a timestamp may exist only where a probe returned.
    if (s.status !== "reachable") {
      ok(s.last_probed === null, `${s.id}: last_probed set on a ${s.status} server — fabricated freshness`);
      ok(s.tools_count === null, `${s.id}: tools_count set on a ${s.status} server — unmeasured count`);
      ok((s.tools || []).length === 0, `${s.id}: tools listed on a ${s.status} server`);
    } else {
      ok(typeof s.last_probed === "string", `${s.id}: reachable but no last_probed`);
      if (s.tools_count !== null) {
        ok(s.tools_count === (s.tools || []).length, `${s.id}: tools_count is asserted, not derived`);
      }
    }
    if (s.catalogue_claim) {
      ok(s.catalogue_claim.verified === false, `${s.id}: a catalogue claim must be marked unverified`);
    }
  }

  const c = artifact.counts || {};
  const reach = (artifact.servers || []).filter((s) => s.status === "reachable");
  ok(c.reachable_endpoints === reach.length, "reachable_endpoints does not match the server list");
  ok(c.reachable_distinct_servers === reach.filter((s) => !s.alias_of).length, "distinct count does not exclude aliases");
  ok(
    c.tools_probed === reach.filter((s) => !s.alias_of).reduce((n, s) => n + (s.tools_count || 0), 0),
    "tools_probed is not derived from the probed tool arrays"
  );
  return errs;
}

function selftest() {
  const bad = {
    schema: "csoai.mcp-registry/1",
    probe_method: PROBE_METHOD,
    probe_host: "test",
    counts: { reachable_endpoints: 0, reachable_distinct_servers: 0, tools_probed: 0 },
    // the exact defect this script exists to prevent
    servers: [{ id: "x", status: "catalogued-not-probed", last_probed: new Date().toISOString(), tools_count: 6, tools: [] }],
  };
  const errs = validate(bad);
  const caught = errs.some((e) => e.includes("fabricated freshness")) && errs.some((e) => e.includes("unmeasured count"));
  if (!caught) {
    console.error("SELFTEST FAIL: validator did not catch a synthesised last_probed / tools_count");
    process.exit(1);
  }
  console.log("selftest ok — validator rejects fabricated freshness and unmeasured counts");
}

// ---------------------------------------------------------------- main

const argv = process.argv.slice(2);
const outIdx = argv.indexOf("--out");
const out = outIdx >= 0 ? resolve(argv[outIdx + 1]) : DEFAULT_OUT;

if (argv.includes("--selftest")) {
  selftest();
} else if (argv.includes("--check")) {
  let artifact;
  try {
    artifact = JSON.parse(readFileSync(out, "utf8"));
  } catch (e) {
    console.error(`FAIL: cannot read ${out} — ${e.message}`);
    process.exit(1);
  }
  const errs = validate(artifact);
  if (errs.length) {
    console.error("FAIL: mcp-registry.json violates the honesty contract:");
    for (const e of errs) console.error("  - " + e);
    process.exit(1);
  }
  console.log(`ok: ${out} valid — ${artifact.counts.reachable_distinct_servers} reachable, ${artifact.counts.tools_probed} tools probed, ${artifact.counts.catalogued_not_probed} catalogued-not-probed`);
} else {
  const artifact = await run(out);
  const errs = validate(artifact);
  if (errs.length) {
    console.error("FAIL: the artifact this run produced violates the honesty contract:");
    for (const e of errs) console.error("  - " + e);
    process.exit(1);
  }
  console.log("honesty contract: ok");
}
