#!/usr/bin/env node
/**
 * capability-registry — ONE declaration of every surface this estate serves.
 *
 * WHY THIS EXISTS (2026-09-22). Three surface lies were repaired by hand in a single day:
 *   · evidence/mcp-registry.json carried the operator's laptop name because the probe called
 *     hostname();
 *   · six catalogue records published status:"LIVE" for servers nothing had ever contacted,
 *     because scripts/mcp-targets.json asserted it and the probe spread the assertion verbatim;
 *   · the board lid said "8 fact runs" while totals.fact_runs two fields away said 9, because
 *     one quantity had two derivations.
 * Each was real. Each was also the same disease: the documents that DESCRIBE the estate
 * (openapi.json, the MCP manifest, the A2A agent card, llms.txt, the site's navigation) are
 * written separately from the estate. Fixing them one at a time is a treadmill.
 *
 * So: one declaration, N renders. council-os/capabilities.json is the declaration. Every
 * catalogue is rendered from it (scripts/capability-render.mjs, scripts/build_openapi.py), and
 * this file is the guard that keeps the declaration itself honest against the CODE:
 *
 *   entry with no handler   -> FAIL   (a catalogue may not claim a route nothing serves)
 *   handler with no entry   -> FAIL   (a served route may not be missing from every catalogue)
 *   LIVE whose probe expects 404/410/501/503 -> FAIL (a lifecycle that contradicts its own probe)
 *   MCP tool name not in the door's own manifests -> FAIL (a fleet swap of equal size is caught)
 *   A2A skill id not in the router's SKILL_IDS    -> FAIL (the card and the router are one set)
 *
 * NO COUNTS LIVE HERE OR IN THE DECLARATION. Every total this project publishes is the length
 * of an array at generation time. `--stats` derives them; it does not read them.
 *
 * FORMAT. The declaration is JSON, not YAML, and the reason is load-bearing rather than taste:
 * Cloudflare Pages Functions import their inputs directly (functions/api/mcp.ts imports
 * evidence/mcp-registry.json), there is no YAML parser at the edge and none in this repo's
 * dependency set, and functions/api/a2a.ts now derives SKILL_IDS from this file at build time.
 * A declaration the edge cannot read would need a second, generated copy — which is the defect.
 *
 * USAGE
 *   node scripts/capability-registry.mjs --check      # declaration vs code; exit 1 on drift
 *   node scripts/capability-registry.mjs --stats      # derived totals by audience and lifecycle
 *   node scripts/capability-registry.mjs --selftest   # prove each guard can go red (no network)
 * The mechanical fields are refreshed by a separate producer, scripts/capability-seed.mjs, which
 * never overwrites an author's name, audience, surfaces or overrides.
 */
import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const REPO = resolve(dirname(fileURLToPath(import.meta.url)), "..");
export const REGISTRY_PATH = join(REPO, "council-os", "capabilities.json");

export const SCHEMA = "csoai.capability-registry/1";

/** The lifecycle vocabulary that ALREADY EXISTS in this repo. Nothing new is invented here:
 *  LIVE                    no marker; the route answers its documented success status
 *  NOT_IMPLEMENTED         @openapi-not-implemented; 501 csoai.capability-state/0.1
 *  RETIRED                 503 csoai.retired-endpoint/0.1, code RETIRED
 *  DOOR_CLOSED             @openapi-closed; 404 by contract — no public prices
 *  QUARANTINED_PRE_RELEASE @openapi-unavailable; 503 until a release gate passes
 *  METHOD_NOT_ALLOWED      @openapi-<verb>-method-not-allowed; 405
 */
export const LIFECYCLES = [
  "LIVE",
  "NOT_IMPLEMENTED",
  "RETIRED",
  "DOOR_CLOSED",
  "QUARANTINED_PRE_RELEASE",
  "METHOD_NOT_ALLOWED",
];
/** A lifecycle that states its own ABSENCE. `LIVE` may never expect one of these statuses. */
export const ABSENCE_STATUSES = new Set([404, 410, 501, 503]);

export const KINDS = ["http", "population_door", "mcp_tool", "a2a_skill", "well_known"];
export const AUDIENCES = ["human", "agent", "both"];
export const PAYMENTS = ["free", "x402", "free_preview_then_x402", "credential", "not_sold"];
export const SURFACES = ["openapi", "mcp", "a2a", "llms", "nav"];

const readJSON = (p) => JSON.parse(readFileSync(p, "utf8"));

export function loadRegistry(path = REGISTRY_PATH) {
  return readJSON(path);
}

// ──────────────────────────────────────────────────────── the code side

const HTTP_METHODS = ["get", "post", "put", "patch", "delete", "head", "options"];

/**
 * Cloudflare Pages Functions: functions/<p>.ts serves /<p>; [[x]] is a catch-all; [x] is a param.
 * Deliberately the SAME resolution functions/api/openapi-route-table.test.ts uses, so the two
 * guards cannot disagree about what "has a handler" means.
 */
export function routeTable(root = join(REPO, "functions")) {
  const table = new Map();
  const walk = (dir) => {
    for (const name of readdirSync(dir)) {
      if (name === "node_modules" || name === "__fixtures__") continue;
      const full = join(dir, name);
      if (statSync(full).isDirectory()) {
        walk(full);
        continue;
      }
      if (!name.endsWith(".ts") || name.endsWith(".test.ts") || name.startsWith("_")) continue;
      let route = "/" + relative(root, full).replace(/\\/g, "/").replace(/\.ts$/, "");
      if (route.endsWith("/index")) route = route.slice(0, -"/index".length) || "/";
      const src = readFileSync(full, "utf8");
      const methods = new Set();
      for (const m of src.matchAll(/\bonRequest(Get|Post|Put|Patch|Delete|Options|Head)?\b/g)) {
        methods.add(m[1] ? m[1].toLowerCase() : "*");
      }
      if (methods.size) table.set(route, { methods, file: relative(REPO, full), src });
    }
  };
  walk(root);
  return table;
}

/** Resolve a path to the handler Pages would run — exact, then param, then catch-all. */
export function handlerFor(path, table) {
  const direct = table.get(path);
  if (direct) return [path, direct];
  let best = null;
  for (const [route, rec] of table) {
    if (route.endsWith("/[[path]]")) {
      const base = route.slice(0, -"/[[path]]".length);
      if (path === base || path.startsWith(base + "/")) {
        if (!best || base.length > best[0].length) best = [route, rec];
      }
    } else if (route.includes("[")) {
      const re = new RegExp("^" + route.replace(/\[+[^\]]+\]+/g, "[^/]+") + "$");
      if (re.test(path) && !best) best = [route, rec];
    }
  }
  return best;
}

/** The lifecycle the SOURCE declares, from the markers the openapi walker already reads. */
export function lifecycleFromSource(src, method) {
  const m = method.toLowerCase();
  if (new RegExp(`@openapi-${m}-method-not-allowed`).test(src)) return "METHOD_NOT_ALLOWED";
  if (/@openapi-closed\b/.test(src)) return "DOOR_CLOSED";
  if (/@openapi-not-implemented\b/.test(src) || new RegExp(`@openapi-${m}-not-implemented`).test(src))
    return "NOT_IMPLEMENTED";
  if (/@openapi-retired\b/.test(src)) return "RETIRED";
  if (/@openapi-unavailable\b/.test(src)) return "QUARANTINED_PRE_RELEASE";
  // NOT inferred from the presence of the string csoai.retired-endpoint: /api/router serves that
  // shape for four RETIRED ALIASES while its own bare GET answers 200 with a route template list.
  // A substring in a file is not a statement about the route the file serves; the marker is.
  return "LIVE";
}

/** Every functions/api/*.ts door the openapi walker enumerates — the universe an entry must cover. */
export function servedApiRoutes(table = routeTable()) {
  const out = [];
  for (const [route, rec] of table) {
    if (!route.startsWith("/api/")) continue;
    if (route.includes("[")) continue; // param and catch-all routes are declared by their concrete ids
    for (const m of rec.methods) {
      if (m === "*") continue;
      if (m === "options" || m === "head") continue;
      out.push({ path: route, method: m.toUpperCase(), file: rec.file, src: rec.src });
    }
  }
  return out.sort((a, b) => (a.path + a.method).localeCompare(b.path + b.method));
}

/** The door's own tool manifests — what POST /mcp actually serves. */
export function doorTools() {
  const free = readJSON(join(REPO, "functions", "mcp", "gspc-tools.json")).tools.map((t) => t.name);
  const paid = readJSON(join(REPO, "functions", "mcp", "paid-tools.json")).tools.map((t) => t.name);
  return { free, paid };
}

/** The A2A router's own skill list, read from its source (the router is the arbiter, not the card). */
export function routerSkillIds() {
  const src = readFileSync(join(REPO, "functions", "api", "a2a.ts"), "utf8");
  const m = src.match(/export const SKILL_IDS = \[([\s\S]*?)\] as const;/);
  if (!m) return null;
  return [...m[1].matchAll(/"([^"]+)"/g)].map((x) => x[1]);
}

// ──────────────────────────────────────────────────────── validation

/** Shape rules every entry obeys, independent of the code. */
export function validateShape(registry) {
  const errs = [];
  const ok = (c, m) => { if (!c) errs.push(m); };
  ok(registry.schema === SCHEMA, `schema must be ${SCHEMA}`);
  ok(Array.isArray(registry.capabilities), "capabilities must be an array");
  // No counts anywhere: a total typed into the declaration is a total nothing retires.
  const banned = JSON.stringify(registry).match(/"(count|total|fleet_size|n_[a-z_]+)"\s*:\s*\d+/g);
  ok(!banned, `the declaration carries a typed count: ${banned && banned.join(", ")}`);

  const ids = new Set();
  for (const c of registry.capabilities ?? []) {
    const at = `${c.id ?? "(no id)"}`;
    ok(typeof c.id === "string" && /^[a-z0-9][a-z0-9._-]*$/.test(c.id), `${at}: id must be a slug`);
    ok(!ids.has(c.id), `${at}: duplicate id`);
    ids.add(c.id);
    ok(KINDS.includes(c.kind), `${at}: kind "${c.kind}" not in ${KINDS.join("|")}`);
    ok(typeof c.name === "string" && c.name.trim().length > 0, `${at}: name is empty`);
    // UNDOCUMENTED is first-class. A handler with no doc comment has no description anywhere in
    // the estate; the registry records that rather than inventing a sentence — and an entry with
    // no description may not appear on a reader-facing surface until someone writes one.
    ok(["DOCUMENTED", "UNDOCUMENTED"].includes(c.description_state),
      `${at}: description_state must be DOCUMENTED or UNDOCUMENTED`);
    if (c.description_state === "DOCUMENTED") {
      ok(typeof c.description === "string" && c.description.trim().length > 0,
        `${at}: description_state says DOCUMENTED but the description is empty`);
    } else {
      ok(!String(c.description ?? "").trim(),
        `${at}: description_state says UNDOCUMENTED but a description is present`);
      ok(!(c.surfaces ?? []).some((s) => s === "llms" || s === "nav"),
        `${at}: UNDOCUMENTED capabilities may not be published to readers (llms / nav)`);
    }
    ok(AUDIENCES.includes(c.audience), `${at}: audience "${c.audience}" not in ${AUDIENCES.join("|")}`);
    ok(LIFECYCLES.includes(c.lifecycle), `${at}: lifecycle "${c.lifecycle}" not in ${LIFECYCLES.join("|")}`);
    ok(PAYMENTS.includes(c.payment), `${at}: payment "${c.payment}" not in ${PAYMENTS.join("|")}`);
    ok(Array.isArray(c.surfaces) && c.surfaces.every((s) => SURFACES.includes(s)), `${at}: surfaces must be a subset of ${SURFACES.join("|")}`);
    ok(Array.isArray(c.schema_refs), `${at}: schema_refs must be an array (empty is a statement too)`);
    const p = c.probe;
    ok(p && typeof p === "object", `${at}: probe missing — a capability with no probe is a claim`);
    if (p) {
      ok(typeof p.method === "string" && HTTP_METHODS.includes(p.method.toLowerCase()), `${at}: probe.method invalid`);
      ok(typeof p.request === "string" && p.request.startsWith("/"), `${at}: probe.request must be an origin-relative path`);
      ok(Array.isArray(p.expect_status) && p.expect_status.length > 0 && p.expect_status.every((s) => Number.isInteger(s)),
        `${at}: probe.expect_status must be a non-empty array of integers`);
      ok(typeof p.safe === "boolean", `${at}: probe.safe must say whether the daily loop may run it`);
      if (p.safe) ok(["get", "head"].includes(p.method.toLowerCase()), `${at}: only GET/HEAD may be marked safe`);
      // THE RULE THIS WHOLE BUILD IS FOR: a lifecycle may not contradict its own probe.
      if (c.lifecycle === "LIVE" && p.expect_status) {
        const absent = p.expect_status.filter((s) => ABSENCE_STATUSES.has(s));
        ok(absent.length === 0,
          `${at}: declared LIVE but its probe expects ${absent.join(",")} — a route that states its own absence is not LIVE`);
      }
      if (c.lifecycle === "DOOR_CLOSED") ok(p.expect_status.includes(404), `${at}: DOOR_CLOSED must expect 404`);
      if (c.lifecycle === "NOT_IMPLEMENTED") ok(p.expect_status.includes(501), `${at}: NOT_IMPLEMENTED must expect 501`);
      if (c.lifecycle === "RETIRED") ok(p.expect_status.includes(503), `${at}: RETIRED must expect 503`);
      if (c.lifecycle === "METHOD_NOT_ALLOWED") ok(p.expect_status.includes(405), `${at}: METHOD_NOT_ALLOWED must expect 405`);
    }
    if (c.kind === "http" || c.kind === "population_door" || c.kind === "well_known") {
      ok(typeof c.path === "string" && c.path.startsWith("/"), `${at}: path must be origin-relative`);
      ok(typeof c.method === "string" && HTTP_METHODS.includes(c.method.toLowerCase()), `${at}: method invalid`);
    }
    if (c.payment !== "free" && c.payment !== "not_sold") {
      ok((c.probe?.expect_status ?? []).includes(402) || c.kind === "mcp_tool" || c.payment === "credential",
        `${at}: a paid door's probe must expect 402 — a price that never issues a challenge is not a door`);
    }
  }
  return errs;
}

/** The declaration against the CODE: no orphan entries, no orphan handlers, no invented tools. */
export function validateAgainstCode(registry, opts = {}) {
  const table = opts.table ?? routeTable();
  const errs = [];
  const ok = (c, m) => { if (!c) errs.push(m); };
  const caps = registry.capabilities ?? [];

  // 1. every declared HTTP-ish entry resolves to a handler that serves its method
  const declared = new Set();
  for (const c of caps) {
    if (!["http", "population_door", "well_known"].includes(c.kind)) continue;
    const found = handlerFor(c.path, table);
    if (!found) {
      errs.push(`${c.id}: ${c.method} ${c.path} — no handler in functions/`);
      continue;
    }
    const methods = found[1].methods;
    ok(methods.has("*") || methods.has(c.method.toLowerCase()),
      `${c.id}: ${c.method} ${c.path} — ${found[1].file} serves only ${[...methods].sort().join(", ")}`);
    declared.add(`${c.method.toUpperCase()} ${c.path}`);
    // the source's own lifecycle marker is the arbiter
    const fromSrc = lifecycleFromSource(found[1].src, c.method);
    if (c.lifecycle !== fromSrc && !(c.lifecycle === "LIVE" && fromSrc === "LIVE")) {
      ok(c.lifecycle === fromSrc,
        `${c.id}: declared ${c.lifecycle} but ${found[1].file} marks it ${fromSrc}`);
    }
  }

  // 2. every served functions/api route is declared — a handler in no catalogue is the other half
  const exempt = new Set(registry.not_declared?.map((x) => `${x.method} ${x.path}`) ?? []);
  for (const r of servedApiRoutes(table)) {
    const key = `${r.method} ${r.path}`;
    ok(declared.has(key) || exempt.has(key), `${key} is served by ${r.file} and declared by no capability entry`);
  }

  // 3. MCP tools: locked BY NAME against the door's own manifests. An equal-size swap is caught.
  const { free, paid } = doorTools();
  const declaredFree = caps.filter((c) => c.kind === "mcp_tool" && c.payment === "free").map((c) => c.id).sort();
  const declaredPaid = caps.filter((c) => c.kind === "mcp_tool" && c.payment !== "free").map((c) => c.id).sort();
  ok(JSON.stringify(declaredFree) === JSON.stringify([...free].sort()),
    `free MCP tools disagree with functions/mcp/gspc-tools.json:\n    registry ${declaredFree.join(",")}\n    door     ${[...free].sort().join(",")}`);
  ok(JSON.stringify(declaredPaid) === JSON.stringify([...paid].sort()),
    `paid MCP tools disagree with functions/mcp/paid-tools.json:\n    registry ${declaredPaid.join(",")}\n    door     ${[...paid].sort().join(",")}`);

  // 4. A2A skills: one set across the card, the router and the registry.
  const routerIds = routerSkillIds();
  if (routerIds) {
    const declaredSkills = caps.filter((c) => c.kind === "a2a_skill").map((c) => c.id).sort();
    ok(JSON.stringify(declaredSkills) === JSON.stringify([...routerIds].sort()),
      `A2A skills disagree with functions/api/a2a.ts SKILL_IDS:\n    registry ${declaredSkills.join(",")}\n    router   ${[...routerIds].sort().join(",")}`);
  } else {
    errs.push("could not read SKILL_IDS from functions/api/a2a.ts — the router is the arbiter and it was unreadable");
  }

  // 5. An A2A skill lives in FOUR places: the card, its /.well-known/agent.json alias, the
  //    router's SKILL_IDS, and the directory census's own recount. The first two are RENDERED
  //    from this registry and the third is checked above. The fourth is a TIMESTAMPED artifact
  //    (public/interop/a2a-directories.json.ots), so it is verified here and never rewritten:
  //    signed and timestamped bytes are superseded, not edited.
  const dirPath = join(REPO, "public", "interop", "a2a-directories.json");
  if (existsSync(dirPath)) {
    const doc = readJSON(dirPath);
    const declared = caps.filter((c) => c.kind === "a2a_skill").length;
    ok(doc.our_agent?.skills === declared,
      `public/interop/a2a-directories.json our_agent.skills is ${doc.our_agent?.skills} and the registry declares ${declared} A2A skills. ` +
      "That file carries an .ots proof over its bytes: supersede it with a dated artifact, never edit it in place.");
  }

  // 6. The router's own prose may not state a skill count the set contradicts. GET /api/a2a
  //    published "seven card skills" while SKILL_IDS held eight — a number with no derivation,
  //    served on a public contract.
  const a2aSrc = readFileSync(join(REPO, "functions", "api", "a2a.ts"), "utf8");
  const WORDS = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve", "thirteen"];
  for (const m of a2aSrc.matchAll(/\b(\w+)\s+(?:card\s+)?skills?\b/gi)) {
    const w = m[1].toLowerCase();
    const n = WORDS.indexOf(w) >= 0 ? WORDS.indexOf(w) : /^\d+$/.test(w) ? Number(w) : null;
    if (n === null) continue;
    ok(n === (routerIds ?? []).length,
      `functions/api/a2a.ts says "${m[0].trim()}" while SKILL_IDS holds ${(routerIds ?? []).length} — ` +
      "a typed count in a served contract is a number nothing retires");
  }
  return errs;
}

// ──────────────────────────────────────────────────────── derived totals

export function stats(registry) {
  const by = (f) => {
    const m = {};
    for (const c of registry.capabilities) m[c[f]] = (m[c[f]] ?? 0) + 1;
    return m;
  };
  return {
    derivation: "every number below is the length of a filter over registry.capabilities, computed now",
    by_kind: by("kind"),
    by_audience: by("audience"),
    by_lifecycle: by("lifecycle"),
    by_payment: by("payment"),
    by_surface: SURFACES.reduce((m, s) => {
      m[s] = registry.capabilities.filter((c) => c.surfaces.includes(s)).length;
      return m;
    }, {}),
    probes_safe_for_the_daily_loop: registry.capabilities.filter((c) => c.probe?.safe).length,
    probes_the_loop_may_not_run: registry.capabilities.filter((c) => !c.probe?.safe).length,
    total: registry.capabilities.length,
  };
}

// ──────────────────────────────────────────────────────── selftest

function selftest() {
  const fails = [];
  const must = (name, errs, needle) => {
    const hit = errs.some((e) => e.includes(needle));
    console.log(`  ${hit ? "✓" : "✖"} ${name}`);
    if (!hit) fails.push(`${name} (looked for "${needle}" in: ${errs.join(" | ") || "(no errors at all)"})`);
  };
  const base = () => ({
    schema: SCHEMA,
    capabilities: [
      {
        id: "api.gspc", kind: "http", path: "/api/gspc", method: "GET", name: "Board",
        description: "the board", description_state: "DOCUMENTED",
        audience: "both", lifecycle: "LIVE", payment: "free",
        schema_refs: [], surfaces: ["openapi"],
        probe: { method: "GET", request: "/api/gspc", expect_status: [200], safe: true },
      },
    ],
  });
  console.log("capability-registry selftest — each guard must go red on its own defect:");

  // 1. an entry whose route has no handler
  let r = base();
  r.capabilities[0].path = "/api/watchdog-that-never-existed";
  r.capabilities[0].probe.request = "/api/watchdog-that-never-existed";
  must("entry with no handler fails", validateAgainstCode(r), "no handler in functions/");

  // 2. a handler with no entry (the base registry declares exactly one of many routes)
  must("handler with no entry fails", validateAgainstCode(base()), "declared by no capability entry");

  // 3. LIVE whose probe expects an absence status
  r = base();
  r.capabilities[0].probe.expect_status = [404];
  must("LIVE whose probe expects 404 fails", validateShape(r), "a route that states its own absence is not LIVE");

  // 4. an MCP fleet swap of equal size
  const { free, paid } = doorTools();
  r = base();
  r.capabilities.push(
    ...free.map((n, i) => ({
      id: i === 0 ? "swapped_tool" : n, kind: "mcp_tool", name: n, description: n, audience: "agent",
      lifecycle: "LIVE", payment: "free", schema_refs: [], surfaces: ["mcp"],
      probe: { method: "POST", request: "/mcp", expect_status: [200], safe: false },
    })),
    ...paid.map((n) => ({
      id: n, kind: "mcp_tool", name: n, description: n, audience: "agent", lifecycle: "LIVE",
      payment: "x402", schema_refs: [], surfaces: ["mcp"],
      probe: { method: "POST", request: "/mcp", expect_status: [402], safe: false },
    })),
  );
  must("an equal-size MCP fleet swap fails", validateAgainstCode(r), "free MCP tools disagree");

  // 5. a typed count in the declaration
  r = base();
  r.counts = { total: 1 };
  must("a typed count in the declaration fails", validateShape(r), "typed count");

  // 6. a paid door whose probe never expects a 402
  r = base();
  r.capabilities[0].payment = "x402";
  must("a paid door that never issues a 402 fails", validateShape(r), "is not a door");

  // 7. an UNDOCUMENTED capability published to readers
  r = base();
  r.capabilities[0].description = "";
  r.capabilities[0].description_state = "UNDOCUMENTED";
  r.capabilities[0].surfaces = ["openapi", "llms"];
  must("UNDOCUMENTED on a reader surface fails", validateShape(r), "may not be published to readers");

  // 8. a swapped MCP tool description is NOT what the lock is about — the NAME is.
  //    Prove the name lock is not vacuous: an identical-length paid list with one renamed entry.
  const r8 = base();
  r8.capabilities.push(
    ...free.map((n) => ({
      id: n, kind: "mcp_tool", name: n, description: n, description_state: "DOCUMENTED",
      audience: "agent", lifecycle: "LIVE", payment: "free", schema_refs: [], surfaces: ["mcp"],
      probe: { method: "POST", request: "/mcp", expect_status: [200], safe: false },
    })),
    ...paid.map((n, i) => ({
      id: i === 0 ? "witness_hash" : n, kind: "mcp_tool", name: n, description: n,
      description_state: "DOCUMENTED", audience: "agent", lifecycle: "LIVE", payment: "x402",
      schema_refs: [], surfaces: ["mcp"],
      probe: { method: "POST", request: "/mcp", expect_status: [402], safe: false },
    })),
  );
  must("a quarantined tool swapped into the paid fleet fails", validateAgainstCode(r8), "paid MCP tools disagree");

  if (fails.length) {
    console.error("\nSELFTEST FAIL:");
    for (const f of fails) console.error("  - " + f);
    process.exit(1);
  }
  console.log("selftest ok — every guard above was observed going red.");
}

// ──────────────────────────────────────────────────────── cli

if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith("capability-registry.mjs")) {
  const argv = process.argv.slice(2);
  if (argv.includes("--selftest")) {
    selftest();
  } else if (argv.includes("--stats")) {
    console.log(JSON.stringify(stats(loadRegistry()), null, 2));
  } else if (argv.includes("--check")) {
    if (!existsSync(REGISTRY_PATH)) {
      console.error(`FAIL: ${relative(REPO, REGISTRY_PATH)} is missing`);
      process.exit(1);
    }
    const reg = loadRegistry();
    const errs = [...validateShape(reg), ...validateAgainstCode(reg)];
    if (errs.length) {
      console.error(`✖ capability registry: ${errs.length} disagreement(s) between council-os/capabilities.json and the code:`);
      for (const e of errs) console.error("  - " + e);
      process.exit(1);
    }
    const s = stats(reg);
    console.log(
      `✓ capability registry: ${s.total} entries agree with functions/ — ` +
      `kinds ${Object.entries(s.by_kind).map(([k, v]) => `${k}:${v}`).join(" ")} · ` +
      `lifecycle ${Object.entries(s.by_lifecycle).map(([k, v]) => `${k}:${v}`).join(" ")}`,
    );
  } else {
    console.log("usage: capability-registry.mjs --check | --stats | --selftest");
    console.log("       (the mechanical fields are refreshed by scripts/capability-seed.mjs)");
    process.exit(2);
  }
}
