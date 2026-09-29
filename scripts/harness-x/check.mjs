#!/usr/bin/env node
/**
 * harness-x check — conformance of every generated Layer 0 artifact, per target.
 *
 *   node scripts/harness-x/check.mjs            full (needs network: live door + vendor schema)
 *   node scripts/harness-x/check.mjs --offline  skips the live comparisons and says so (exit 0 only if
 *                                               everything else passes; the live checks print SKIPPED,
 *                                               never PASS)
 *
 * Per target: schema (vendor schema where fetchable — else a vendored copy — else structural),
 * version == live serverInfo.version, tool names == the locked fleet (functions/mcp/tool-fleet.lock.json
 * == council-os/capabilities.json == live tools/list), doctrine sha256 in every declared carrier,
 * brand-gate over every output, no affirmative "certif", no public price, render --check clean.
 * Fails closed: an unreachable door is FAIL (or SKIPPED under --offline), never a pass.
 */
import { readFileSync, existsSync, mkdtempSync, writeFileSync, rmSync, readdirSync, statSync } from "node:fs";
import { createHash } from "node:crypto";
import { spawnSync, execFileSync } from "node:child_process";
import { dirname, join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath, pathToFileURL } from "node:url";

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
const OFFLINE = process.argv.includes("--offline");
const read = (rel) => readFileSync(join(REPO, rel), "utf8");
const readJson = (rel) => JSON.parse(read(rel));
const sha256 = (s) => createHash("sha256").update(s).digest("hex");

const results = []; // {target, check, state: PASS|FAIL|SKIPPED, detail}
const rec = (target, check, ok, detail = "") => results.push({ target, check, state: ok === null ? "SKIPPED" : ok ? "PASS" : "FAIL", detail });
const sameList = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const sameSet = (a, b) => sameList([...a].sort(), [...b].sort());

// ── sources ─────────────────────────────────────────────────────────────────────────────────
const dist = readJson("council-os/distribution.json");
const manifest = readJson("distribution/MANIFEST.json");
const DOCTRINE_SHA = dist.doctrine.sha256;
const caps = readJson("council-os/capabilities.json").capabilities
  .filter((c) => c.kind === "mcp_tool").sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
const capNames = caps.map((c) => c.id);
const SOURCE_VERSION = readJson("mcp/gspc-server/server.json").version;
const DOOR = dist.identity.door;

// The lock lives in functions/, which a sparse lane may not check out: read it from the index.
let lock;
try {
  lock = existsSync(join(REPO, "functions/mcp/tool-fleet.lock.json"))
    ? readJson("functions/mcp/tool-fleet.lock.json")
    : JSON.parse(execFileSync("git", ["-C", REPO, "show", "HEAD:functions/mcp/tool-fleet.lock.json"], { encoding: "utf8" }));
} catch (e) { lock = null; }
const LOCKED = lock ? [...lock.free, ...lock.paid] : null;

// ── 0. render is clean, doctrine pin holds ──────────────────────────────────────────────────
{
  const r = spawnSync(process.execPath, [join(REPO, "scripts/harness-x/render.mjs"), "--check"], { encoding: "utf8" });
  rec("*", "render --check (committed outputs == rendered)", r.status === 0, (r.stdout + r.stderr).trim().split("\n").pop());
  const live = sha256(read(dist.doctrine.source));
  rec("*", "doctrine pin", live === DOCTRINE_SHA && manifest.doctrine.sha256 === DOCTRINE_SHA, `${dist.doctrine.source} ${live.slice(0, 16)}… pinned ${DOCTRINE_SHA.slice(0, 16)}…`);
  const mf = manifest.files.filter((f) => sha256(read(f.path)) !== f.sha256).map((f) => f.path);
  rec("*", "MANIFEST sha256 of every file", mf.length === 0, mf.length ? mf.join(", ") : `${manifest.files.length} files`);
}

// ── 1. the locked fleet: lock == capabilities == live tools/list ────────────────────────────
rec("*", "fleet lock == capabilities.json", LOCKED !== null && sameList(LOCKED, capNames),
  LOCKED ? `${LOCKED.length} locked / ${capNames.length} declared` : "tool-fleet.lock.json unreadable");

async function rpc(method, params) {
  const res = await fetch(DOOR, {
    method: "POST",
    headers: { "content-type": "application/json", accept: "application/json, text/event-stream" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, ...(params ? { params } : {}) }),
    signal: AbortSignal.timeout(30000),
  });
  const t = (await res.text()).trim();
  if (t.startsWith("{")) return JSON.parse(t);
  const d = t.split("\n").filter((l) => l.startsWith("data:"));
  return JSON.parse(d[d.length - 1].slice(5));
}
let LIVE_VERSION = null, LIVE_TOOLS = null, liveWhy = "";
if (!OFFLINE) {
  try {
    const init = await rpc("initialize", { protocolVersion: "2025-06-18", capabilities: {}, clientInfo: { name: "harness-x-check", version: "1" } });
    LIVE_VERSION = init.result.serverInfo.version;
    const tl = await rpc("tools/list");
    LIVE_TOOLS = tl.result.tools.map((t) => t.name);
  } catch (e) { liveWhy = `UNREACHABLE (${e.name}: ${e.message})`; }
}
const liveOk = (v) => (OFFLINE ? null : v);
rec("*", "live serverInfo.version == mcp/gspc-server/server.json", liveOk(LIVE_VERSION === SOURCE_VERSION),
  OFFLINE ? "offline" : LIVE_VERSION ? `live ${LIVE_VERSION} / source ${SOURCE_VERSION}` : liveWhy);
rec("*", "live tools/list == locked fleet (names, order)", liveOk(!!LIVE_TOOLS && !!LOCKED && sameList(LIVE_TOOLS, LOCKED)),
  OFFLINE ? "offline" : LIVE_TOOLS ? `${LIVE_TOOLS.length} live / ${LOCKED?.length} locked` : liveWhy);
const WANT_VERSION = SOURCE_VERSION; // equal to live when the check above passes
const EXPECT_TOOLS = LOCKED ?? capNames;

// ── helpers ─────────────────────────────────────────────────────────────────────────────────
const py = (code, env = {}) => spawnSync("python3", ["-c", code], { encoding: "utf8", env: { ...process.env, ...env } });
const hasPyMod = (m) => py(`import ${m}`).status === 0;
const JSONSCHEMA = hasPyMod("jsonschema");
const YAML = hasPyMod("yaml");
const frontMatter = (text) => {
  const m = /^---\n([\s\S]*?)\n---\n/.exec(text);
  return m ? Object.fromEntries(m[1].split("\n").filter((l) => /^[a-z_]+:/.test(l)).map((l) => [l.split(":")[0], l.slice(l.indexOf(":") + 1).trim()])) : null;
};
const rowsById = Object.fromEntries(dist.distribution.map((r) => [r.id, r]));

// doctrine hash in every declared carrier, all outputs exist
for (const r of dist.distribution) {
  const missing = r.output.filter((p) => !existsSync(join(REPO, p)));
  rec(r.id, "all declared outputs exist", missing.length === 0, missing.join(", ") || `${r.output.length} file(s)`);
  const noHash = r.doctrine_carriers.filter((p) => !existsSync(join(REPO, p)) || !read(p).includes(DOCTRINE_SHA));
  rec(r.id, "doctrine sha256 in carrier(s)", noHash.length === 0, noHash.join(", ") || r.doctrine_carriers.join(", "));
}

// ── 2. MCP registry (vendor schema) ─────────────────────────────────────────────────────────
{
  const schemaUrl = readJson("mcp/gspc-server/server.json").$schema;
  const vendored = "scripts/harness-x/schemas/mcp-server-2025-12-11.schema.json";
  let schemaText = null, schemaFrom = "";
  if (!OFFLINE) {
    try {
      const r = await fetch(schemaUrl, { signal: AbortSignal.timeout(20000) });
      if (r.ok) { schemaText = await r.text(); schemaFrom = "fetched " + schemaUrl; }
    } catch { /* fall back */ }
  }
  if (!schemaText && existsSync(join(REPO, vendored))) { schemaText = read(vendored); schemaFrom = "vendored " + vendored; }
  if (schemaText && existsSync(join(REPO, vendored)) && schemaFrom.startsWith("fetched")) {
    rec("*", "vendored MCP schema == fetched", sha256(schemaText) === sha256(read(vendored)), vendored);
  }
  for (const [id, p, name] of [
    ["mcp-registry-github", "distribution/mcp-registry/io.github.CSOAI-ORG-gspc/server.json", dist.registry_names.github],
    ["mcp-registry-domain", "distribution/mcp-registry/ai.councilof-gspc/server.json", dist.registry_names.domain],
  ]) {
    const doc = readJson(p);
    if (schemaText && JSONSCHEMA) {
      const tmp = mkdtempSync(join(tmpdir(), "hx-"));
      writeFileSync(join(tmp, "s.json"), schemaText);
      const r = py(`import json,jsonschema,sys
s=json.load(open(sys.argv[1] if len(sys.argv)>1 else "${join(tmp, "s.json")}"))
d=json.load(open("${join(REPO, p)}"))
errs=[e.message for e in jsonschema.Draft7Validator(s).iter_errors(d)]
print(len(errs)); [print(e) for e in errs[:5]]; sys.exit(1 if errs else 0)`);
      rmSync(tmp, { recursive: true, force: true });
      rec(id, `schema-valid (${schemaFrom}, jsonschema Draft7)`, r.status === 0, r.stdout.trim().split("\n").slice(1).join(" | ") || "0 errors");
    } else {
      const ok = /^[a-zA-Z0-9.-]+\/[a-zA-Z0-9._-]+$/.test(doc.name) && doc.description.length <= 100 && !!doc.version;
      rec(id, "schema-valid (structural: name pattern, description<=100, version)", ok, "vendor schema or python jsonschema unavailable");
    }
    rec(id, "name", doc.name === name, doc.name);
    rec(id, "version == live", doc.version === WANT_VERSION, doc.version);
    // the domain name carries the door with one trailing slash (the bare URL is held by the github name)
    const wantRemote = (dist.distribution.find((r) => r.id === id) || {}).remote_url || DOOR;
    rec(id, wantRemote === DOOR ? "remote == door" : "remote == door + trailing slash (declared remote_url)",
      wantRemote.replace(/\/$/, "") === DOOR && doc.remotes?.[0]?.url === wantRemote && doc.remotes[0].type === "streamable-http", doc.remotes?.[0]?.url);
    const fl = doc._meta["io.modelcontextprotocol.registry/publisher-provided"]["ai.councilof/fleet"];
    rec(id, "fleet names == locked", sameList([...fl.free, ...fl.paid], EXPECT_TOOLS), `${fl.free.length}+${fl.paid.length}`);
  }
  // what the public registry currently serves as latest for each name (read-only GET)
  for (const [id, name] of [["mcp-registry-github", dist.registry_names.github], ["mcp-registry-domain", dist.registry_names.domain]]) {
    if (OFFLINE) { rec(id, "registry isLatest", null, "offline"); continue; }
    let latest = null, why = "";
    try {
      // /versions answers in <1 s; ?search= took 20-40 s from the pod (2026-09-28) and timed out as a FAIL.
      const r = await fetch(`https://registry.modelcontextprotocol.io/v0/servers/${encodeURIComponent(name)}/versions`, { signal: AbortSignal.timeout(30000) });
      const d = r.status === 404 ? { servers: [] } : await r.json();
      const hit = (d.servers || []).filter((x) => x.server?.name === name)
        .find((x) => x._meta?.["io.modelcontextprotocol.registry/official"]?.isLatest);
      latest = hit ? hit.server.version : "ABSENT";
    } catch (e) { why = `UNREACHABLE (${e.name})`; }
    if (id === "mcp-registry-github") rec(id, "registry isLatest recorded (deprecated alias: nothing new is published under it)", latest !== null, latest ?? why);
    else rec(id, "registry isLatest == source server version", latest === WANT_VERSION, `registry ${latest ?? why} / source ${WANT_VERSION}`);
  }
  // the domain variant must not declare an npm package whose mcpName names the other namespace
  const dom = readJson("distribution/mcp-registry/ai.councilof-gspc/server.json");
  rec("mcp-registry-domain", "remote-only (no npm package bound to another namespace)", !dom.packages, dom.packages ? "has packages" : "remote-only");
  const npmName = readJson("mcp/gspc-server/package.json").mcpName;
  // Owner ruling 2026-09-26: the canonical name is the domain one; io.github.CSOAI-ORG/gspc is its deprecated alias.
  rec("mcp-registry-domain", "npm package source mcpName == the canonical registry name", npmName === dist.registry_names.canonical && dist.registry_names.canonical === dist.registry_names.domain, npmName);
  rec("mcp-registry-github", "the GitHub-namespace name is declared the deprecated alias", dist.registry_names.deprecated_alias === dist.registry_names.github, dist.registry_names.deprecated_alias);
}

// ── 3. plugins (structural: the three manifests agree) ──────────────────────────────────────
{
  const kebab = /^[a-z0-9]+(-[a-z0-9]+)*$/;
  const semver = /^\d+\.\d+\.\d+$/;
  const cp = readJson("distribution/plugin/.claude-plugin/plugin.json");
  const cm = readJson("distribution/plugin/.claude-plugin/marketplace.json");
  const cu = readJson("distribution/plugin/.cursor-plugin/plugin.json");
  const gk = readJson("distribution/plugin/.grok-plugin/marketplace.json");
  const mcpj = readJson("distribution/plugin/.mcp.json");
  const skill = frontMatter(read("distribution/plugin/skills/gspc/SKILL.md"));
  rec("claude-plugin", "plugin.json: kebab name, semver, mcpServers path resolves",
    kebab.test(cp.name) && semver.test(cp.version) && existsSync(join(REPO, "distribution/plugin", cp.mcpServers)), `${cp.name}@${cp.version}`);
  rec("claude-plugin", "marketplace.json: kebab name, owner, plugin listed with source ./",
    kebab.test(cm.name) && !!cm.owner?.name && cm.plugins.length === 1 && cm.plugins[0].name === cp.name && cm.plugins[0].source === "./", cm.name);
  rec("claude-plugin", ".mcp.json: http server → door", Object.values(mcpj.mcpServers).every((s) => s.type === "http" && s.url === DOOR), DOOR);
  rec("claude-plugin", "skill front matter name+description", !!skill?.name && !!skill?.description, skill?.name);
  rec("claude-plugin", "version == live", cp.version === WANT_VERSION && cm.plugins[0].version === WANT_VERSION, cp.version);
  const skillText = read("distribution/plugin/skills/gspc/SKILL.md");
  rec("claude-plugin", "skill lists every locked tool", EXPECT_TOOLS.every((t) => skillText.includes("`" + t + "`")), `${EXPECT_TOOLS.length} names`);
  rec("cursor-plugin", "same name/version/description/mcpServers as Claude manifest",
    cu.name === cp.name && cu.version === cp.version && cu.description === cp.description && cu.mcpServers === cp.mcpServers, `${cu.name}@${cu.version}`);
  rec("grok-plugin", "marketplace lists the same plugin, local source ./",
    gk.plugins.length === 1 && gk.plugins[0].name === cp.name && gk.plugins[0].source?.path === "./" && gk.metadata.version === WANT_VERSION, gk.plugins[0].name);
}

// ── 4. form-value targets (Claude connector, OpenAI app) ────────────────────────────────────
// The Claude connector lists the FREE door (Anthropic Software Directory Policy 4.A: no software that
// transfers money or crypto), so its expected URL and tools are the free door's; the OpenAI app keeps
// the full door.
const EXPECT_FREE = lock ? [...lock.free] : caps.filter((c) => c.payment === "free").map((c) => c.id);
for (const [id, p, urlKey, wantUrl, wantTools] of [
  ["claude-connector", "distribution/claude/connector.json", "server_url", `${DOOR}/free`, EXPECT_FREE],
  ["openai-app", "distribution/openai/app.json", "mcp_server_url", DOOR, EXPECT_TOOLS],
]) {
  const d = readJson(p);
  const names = d.tools.map((t) => t.name);
  rec(id, `server url == ${wantUrl === DOOR ? "door" : "free door"}, auth none`, d[urlKey] === wantUrl && /none/.test(d.authentication), d[urlKey]);
  rec(id, `tools == locked${wantTools === EXPECT_FREE ? " free" : ""}, tool_count == array length`, sameList(names, wantTools) && d.tool_count === names.length, `${names.length}`);
  rec(id, "server_version == live", d.server_version === WANT_VERSION, d.server_version);
  rec(id, "status says NOT SUBMITTED", /NOT SUBMITTED/.test(d.status), d.status);
}
{
  const d = readJson("distribution/openai/app.json");
  const stale = d.derived_from_well_known.filter((s) => sha256(read(s.path)) !== s.sha256).map((s) => s.path);
  rec("openai-app", "derived-from well-known files unchanged since render", stale.length === 0, stale.join(", ") || `${d.derived_from_well_known.length} files`);
}

// ── 5. Gemini CLI extension ─────────────────────────────────────────────────────────────────
{
  const g = readJson("distribution/gemini/gemini-extension.json");
  rec("gemini-extension", "name, version, contextFileName resolves",
    /^[a-z0-9-]+$/.test(g.name) && !!g.version && existsSync(join(REPO, "distribution/gemini", g.contextFileName)), `${g.name}@${g.version}`);
  rec("gemini-extension", "mcpServers.*.httpUrl == door", Object.values(g.mcpServers).every((s) => s.httpUrl === DOOR), DOOR);
  rec("gemini-extension", "version == live", g.version === WANT_VERSION, g.version);
  const ctx = read("distribution/gemini/GEMINI.md");
  rec("gemini-extension", "context lists every locked tool", EXPECT_TOOLS.every((t) => ctx.includes("`" + t + "`")), `${EXPECT_TOOLS.length} names`);
}

// ── 6. Python adapters ──────────────────────────────────────────────────────────────────────
{
  const pkgs = [
    ["pypi-langchain-csoai", "distribution/python/langchain-csoai", "langchain-csoai", "langchain_csoai/_board.py"],
    ["pypi-llama-index-tools-csoai", "distribution/python/llama-index-tools-csoai", "llama-index-tools-csoai", "llama_index/tools/csoai/_board.py"],
    ["pypi-crewai-csoai", "distribution/python/crewai-csoai", "crewai-csoai", "crewai_csoai/_board.py"],
  ];
  const boards = new Set();
  for (const [id, dir, name, board] of pkgs) {
    const files = rowsById[id].output.filter((p) => p.endsWith(".py"));
    const r = spawnSync("python3", ["-m", "py_compile", ...files.map((f) => join(REPO, f))], { encoding: "utf8" });
    rec(id, "py_compile every module", r.status === 0, r.stderr.trim() || `${files.length} module(s)`);
    const pp = read(`${dir}/pyproject.toml`);
    rec(id, "pyproject: name, Apache-2.0, depends on csoai-gspc, version == adapter_version",
      pp.includes(`name = "${name}"`) && pp.includes('license = { text = "Apache-2.0" }') && /"csoai-gspc>=/.test(pp) && pp.includes(`version = "${dist.adapter_version}"`), name);
    rec(id, "LICENSE is Apache-2.0 text", /Apache License\s+Version 2\.0/.test(read(`${dir}/LICENSE`)), "LICENSE");
    boards.add(read(`${dir}/${board}`));
  }
  rec("pypi-*", "the shared _board.py is byte-identical in all three", boards.size === 1, `${boards.size} variant(s)`);
  // smoke the shared reader against the real client and the live board
  const client = join(REPO, "scripts/spray/pypi/csoai-gspc");
  const boardFile = join(REPO, pkgs[0][1], pkgs[0][3]);
  if (OFFLINE) rec("pypi-*", "read_board() live smoke", null, "offline");
  else {
    const r = py(`import importlib.util,json
s=importlib.util.spec_from_file_location("b","${boardFile}");m=importlib.util.module_from_spec(s);s.loader.exec_module(m)
a=m.read_board();b=m.read_board("__no_such_axis__")
print(a["state"],b["state"],a.get("totals",{}).get("public_count"))
assert a["state"]=="LIVE" and b["state"]=="ABSENT" and a["doctrine_sha256"]=="${DOCTRINE_SHA}"`, { PYTHONPATH: client });
    rec("pypi-*", "read_board() live smoke: LIVE / ABSENT via csoai-gspc", r.status === 0, (r.stdout.trim() || r.stderr.trim().split("\n").pop()));
  }
}

// ── 7. TS/ESM adapters ──────────────────────────────────────────────────────────────────────
{
  const clients = new Set();
  for (const [id, dir, fw] of [["npm-ai-sdk-gspc", "distribution/npm/ai-sdk-gspc", "ai"], ["npm-mastra-gspc", "distribution/npm/mastra-gspc", "@mastra/core"]]) {
    const js = rowsById[id].output.filter((p) => p.endsWith(".js"));
    const bad = js.filter((f) => spawnSync(process.execPath, ["--check", join(REPO, f)]).status !== 0);
    rec(id, "node --check every .js", bad.length === 0, bad.join(", ") || `${js.length} file(s)`);
    const pk = readJson(`${dir}/package.json`);
    rec(id, "package.json: Apache-2.0, ESM, framework + zod peers, @csoai/layer0 optional peer",
      pk.license === "Apache-2.0" && pk.type === "module" && !!pk.peerDependencies[fw] && !!pk.peerDependencies.zod &&
      pk.peerDependenciesMeta["@csoai/layer0"]?.optional === true && pk.version === dist.adapter_version, `${pk.name}@${pk.version}`);
    rec(id, "files[] all exist", pk.files.every((f) => existsSync(join(REPO, dir, f))), pk.files.join(", "));
    clients.add(read(`${dir}/gspc-client.js`));
  }
  rec("npm-*", "gspc-client.js byte-identical in both", clients.size === 1, `${clients.size} variant(s)`);
  const mod = await import(pathToFileURL(join(REPO, "distribution/npm/ai-sdk-gspc/gspc-client.js")).href);
  rec("npm-*", "client FREE+PAID == locked", sameList([...mod.FREE_TOOLS, ...mod.PAID_TOOLS], EXPECT_TOOLS), `${mod.FREE_TOOLS.length}+${mod.PAID_TOOLS.length}`);
  if (OFFLINE) rec("npm-*", "callGspc('board_totals') live smoke", null, "offline");
  else {
    const out = await mod.callGspc("board_totals");
    rec("npm-*", "callGspc('board_totals') live smoke", out.state === "LIVE" && !!out.result?.content, `state ${out.state}`);
    let governedSeen = false;
    const fakeL0 = { governed: async (action, _in, run) => { governedSeen = action === "gspc.board_totals"; return { result: await run(), decision: { state: "allow" }, attestation: null }; } };
    const g = await mod.callGspc("board_totals", {}, { layer0: fakeL0 });
    rec("npm-*", "Layer0.governed() wrapping path (stub gateway)", governedSeen && g.state === "LIVE" && g.layer0?.decision?.state === "allow", "gate → run → attest shape");
  }
}

// ── 8. Docker MCP catalog ───────────────────────────────────────────────────────────────────
{
  const dir = "distribution/docker/servers/csoai-gspc";
  if (YAML) {
    const r = py(`import yaml,json;d=yaml.safe_load(open("${join(REPO, dir, "server.yaml")}"));print(json.dumps(d))`);
    let d = null; try { d = JSON.parse(r.stdout); } catch { /* */ }
    rec("docker-mcp-catalog", "server.yaml parses (PyYAML); name/type/about/remote present",
      !!d && d.name === "csoai-gspc" && d.type === "remote" && !!d.about?.title && !!d.about?.description && !!d.meta?.category, d ? d.name : r.stderr.trim());
    rec("docker-mcp-catalog", "remote streamable-http → door", d?.remote?.url === DOOR && d?.remote?.transport_type === "streamable-http", d?.remote?.url);
  } else rec("docker-mcp-catalog", "server.yaml parses", null, "PyYAML unavailable");
  const tj = readJson(`${dir}/tools.json`).map((t) => t.name);
  rec("docker-mcp-catalog", "tools.json names == locked", sameList(tj, EXPECT_TOOLS), `${tj.length}`);
}

// ── 9. HF Space ─────────────────────────────────────────────────────────────────────────────
{
  const dir = "distribution/hf-space/csoai-gspc-mcp";
  const fm = frontMatter(read(`${dir}/README.md`));
  rec("hf-space", "README front matter: sdk gradio, app_file exists, licence apache-2.0",
    fm?.sdk === "gradio" && existsSync(join(REPO, dir, fm.app_file)) && fm.license === "apache-2.0", fm ? `${fm.sdk} ${fm.app_file}` : "no front matter");
  const r = spawnSync("python3", ["-m", "py_compile", join(REPO, dir, "app.py")], { encoding: "utf8" });
  rec("hf-space", "py_compile app.py", r.status === 0, r.stderr.trim() || "ok");
  rec("hf-space", "launches with mcp_server=True", /launch\(mcp_server=True\)/.test(read(`${dir}/app.py`)), "app.py");
}

// ── 10. well-known descriptors (the drift this lane fixes) ──────────────────────────────────
{
  const sc = readJson("public/.well-known/mcp/server-card.json");
  const mj = readJson("public/.well-known/mcp.json");
  const npmV = readJson("mcp/gspc-server/server.json").packages[0].version;
  rec("well-known-server-card", "server-card tools == locked; counts == array lengths",
    sameList(sc.capabilities.tools, EXPECT_TOOLS) && sc.capabilities.total_tools === EXPECT_TOOLS.length &&
    sc.capabilities.free_tools === (lock?.free.length ?? -1) && sc.capabilities.metered_tools === (lock?.paid.length ?? -1),
    `${sc.capabilities.total_tools} = ${sc.capabilities.free_tools} + ${sc.capabilities.metered_tools}`);
  const scText = JSON.stringify(sc);
  const versions = [...scText.matchAll(/server (\d+\.\d+\.\d+)/g)].map((m) => m[1]);
  rec("well-known-server-card", "every stated registry server version == live", versions.length > 0 && versions.every((v) => v === WANT_VERSION), versions.join(", "));
  rec("well-known-server-card", "stdio pin == npm package version", sc.endpoints.mcp.stdio.endsWith("@" + npmV) && mj.servers[0].stdio.endsWith("@" + npmV), sc.endpoints.mcp.stdio);
  rec("well-known-server-card", "mcp.json registry version == live; tools == locked",
    mj.servers[0].registry.version === WANT_VERSION && sameList(mj.measured.tools, EXPECT_TOOLS) && mj.measured.total_tools === EXPECT_TOOLS.length, mj.servers[0].registry.version);
  // Stale fleet prose = any count word that is not the locked one ("eight free", "twelve tools" were
  // the old fleets). Derived from the lock, so a fleet change cannot turn the current count "stale".
  const W = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve",
    "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen", "twenty"];
  const nFree = caps.filter((c) => c.payment === "free").length;
  const others = (n) => W.filter((_, i) => i !== n).join("|");
  const staleWords = new RegExp(`\\b(?:${others(nFree)}) free\\b|\\b(?:${others(EXPECT_TOOLS.length)}) (?:MCP )?tools\\b|No 23rd axis`, "i");
  rec("well-known-server-card", "no stale fleet prose (a count word other than the locked fleet's / No 23rd axis)", !staleWords.test(scText) && !staleWords.test(JSON.stringify(mj)), "clean");
}

// ── 11. brand-gate, certif, price — over EVERY output ───────────────────────────────────────
const allOutputs = manifest.files.map((f) => f.path).concat(["distribution/MANIFEST.json"]);
{
  // (a) brand-gate on the distribution dir as-is
  const a = spawnSync(process.execPath, [join(REPO, "scripts/brand-gate.mjs"), join(REPO, "distribution")], { encoding: "utf8" });
  rec("*", "brand-gate distribution/ (as a dir)", a.status === 0, (a.stdout + a.stderr).trim().split("\n").pop());
  // (b) brand-gate on a flattened copy: its page walk reads only .html/.txt/.svg and skips any path
  //     containing "mcp-", so every output is re-presented as NNN.txt (and JSON also as NNN.json).
  const tmp = mkdtempSync(join(tmpdir(), "hx-gate-"));
  allOutputs.forEach((p, i) => {
    const t = read(p);
    const n = String(i).padStart(3, "0");
    writeFileSync(join(tmp, `f${n}.txt`), t);
    if (p.endsWith(".json")) writeFileSync(join(tmp, `f${n}.json`), t);
  });
  const b = spawnSync(process.execPath, [join(REPO, "scripts/brand-gate.mjs"), tmp], { encoding: "utf8" });
  let detail = (b.stdout + b.stderr).trim().split("\n").pop();
  if (b.status !== 0) detail = (b.stderr || "").replace(/f(\d{3})\.(txt|json)/g, (_, n) => allOutputs[Number(n)]).trim().split("\n").slice(0, 6).join(" | ");
  rec("*", `brand-gate over all ${allOutputs.length} outputs (flattened .txt/.json copy)`, b.status === 0, detail);
  rmSync(tmp, { recursive: true, force: true });

  // (c) certif: every occurrence must be negated in the same clause, or inside quoted third-party
  //     text; affirmative use fails. (d) no public price.
  // not_a_ / not_an_: a snake_case negation key (not_a_certification), which the server card now
  // carries in each tool output schema since it renders the full tools[] (fix #24).
  const NEG = /\b(not|never|no|nor|without|non)\b|n't|explicitly_not|\bnot_an?_/i;
  const affirmative = [], negated = [];
  const prices = [];
  // A JSON string under a negation key (explicitly_not, does_not_establish, claim_boundary) is a
  // negation by construction; any other string — and every line of a non-JSON file — must carry its
  // own negator in the same clause, within 60 characters before the word.
  const NEG_KEYS = /^(explicitly_not|does_not_establish|claim_boundary|not_claimed)$/;
  const clauseNegated = (text, idx) => {
    const lineStart = text.lastIndexOf("\n", idx) + 1;
    return NEG.test(text.slice(Math.max(lineStart, idx - 60), idx).split(/[.;:!?]\s/).pop());
  };
  const scanText = (p, text, underNegKey) => {
    for (const m of text.matchAll(/certif\w*/gi)) {
      const at = `${p}: …${text.slice(Math.max(0, m.index - 40), m.index + m[0].length).replace(/\s+/g, " ")}`;
      (underNegKey || clauseNegated(text, m.index) ? negated : affirmative).push(at);
    }
  };
  const walkJson = (p, node, underNegKey) => {
    if (typeof node === "string") return scanText(p, node, underNegKey);
    if (Array.isArray(node)) return node.forEach((v) => walkJson(p, v, underNegKey));
    if (node && typeof node === "object") for (const [k, v] of Object.entries(node)) { scanText(p, k, underNegKey); walkJson(p, v, underNegKey || NEG_KEYS.test(k)); }
  };
  for (const p of allOutputs) {
    const t = read(p);
    if (p.endsWith(".json")) walkJson(p, JSON.parse(t), false); else scanText(p, t, false);
    for (const m of t.matchAll(/(?:[$£€]\s?\d[\d,.]*|\b(?:USD|GBP|EUR)\s?\d[\d,.]*|\d[\d,.]*\s?(?:USD|GBP|EUR|USDC)\b)/g)) prices.push(`${p}: ${m[0]}`);
  }
  rec("*", "no affirmative 'certif' (negations allowed, listed)", affirmative.length === 0,
    affirmative.length ? affirmative.slice(0, 3).join(" | ") : `0 affirmative · ${negated.length} negated`);
  rec("*", "no public price", prices.length === 0, prices.slice(0, 3).join(" | ") || "0");

  // (e) every README-like output points at the data, the corrections ledger and free verification
  const I = dist.identity;
  const readmes = allOutputs.filter((p) => /(README|readme|SKILL|GEMINI)\.md$/.test(p));
  const noLinks = readmes.filter((p) => { const t = read(p); return ![I.board, I.corrections, I.verify_page].every((u) => t.includes(u)); });
  rec("*", "every README carries data + corrections ledger + verify links", readmes.length > 0 && noLinks.length === 0,
    noLinks.join(", ") || `${readmes.length} README-like files`);
}

// ── report ──────────────────────────────────────────────────────────────────────────────────
const w = Math.max(...results.map((r) => r.target.length));
for (const r of results) console.log(`${r.state.padEnd(7)} ${r.target.padEnd(w)}  ${r.check}${r.detail ? `  — ${r.detail}` : ""}`);
const n = (s) => results.filter((r) => r.state === s).length;
const targetsCovered = new Set(results.map((r) => r.target).filter((t) => rowsById[t])).size;
console.log(`\nharness-x check: ${n("PASS")} PASS · ${n("FAIL")} FAIL · ${n("SKIPPED")} SKIPPED · ${targetsCovered}/${dist.distribution.length} targets · live ${LIVE_VERSION ?? (OFFLINE ? "offline" : "UNREACHABLE")}`);
process.exit(n("FAIL") ? 1 : 0);
