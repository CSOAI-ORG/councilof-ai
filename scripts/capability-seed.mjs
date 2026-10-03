#!/usr/bin/env node
/**
 * capability-seed — fill the MACHINE-KNOWABLE fields of council-os/capabilities.json.
 *
 * This is not a one-off migration script. It is the way a new capability enters the declaration:
 * the mechanical facts (path, method, lifecycle marker, probe expectation, the tool's own
 * description from the door's manifest) are read from the code and the door's own bytes; the
 * editorial fields (name, audience, surfaces, and a description where the code carries none)
 * are the author's and are NEVER overwritten by a re-seed.
 *
 *   node scripts/capability-seed.mjs              # merge into council-os/capabilities.json
 *   node scripts/capability-seed.mjs --dry        # print whether it would change
 *
 * Sources, all of them bytes this repo already serves from:
 *   functions/api/ *.ts                              the handlers, their JSDoc and lifecycle markers
 *   scripts/fixtures/x402scan/well_known_x402.json   the captured /.well-known/x402.json manifest
 *   functions/api/x402-descriptions.json             the canonical door descriptions
 *   functions/mcp/{gspc,paid}-tools.json             the door's own tool definitions
 *   public/.well-known/agent-card.json               the A2A skills, with the router as arbiter
 *   public/llms.txt, public/llms-full.txt            which routes we already publish to readers
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import {
  REPO, REGISTRY_PATH, SCHEMA, routeTable, servedApiRoutes, lifecycleFromSource,
  routerSkillIds,
} from "./capability-registry.mjs";

const readJSON = (p) => JSON.parse(readFileSync(p, "utf8"));
const DRY = process.argv.includes("--dry");

/** The openapi walker's own rule: the first JSDoc paragraph, decoration stripped. */
function jsdocParagraph(text) {
  const m = text.match(/\/\*\*([\s\S]+?)\*\//);
  if (!m) return "";
  const lines = m[1].split("\n").map((l) => l.replace(/^\s*\* ?/, "").trim());
  const para = [];
  for (const l of lines) {
    if (!l || l.startsWith("@")) { if (para.length) break; continue; }
    para.push(l);
  }
  return para.join(" ");
}
/** Collapse whitespace only. The description is NOT truncated: the A2A card and the MCP tool
 *  manifests are rendered from these bytes, and a summariser here would silently rewrite the
 *  prose those doors already serve. openapi keeps its own 200-char `summary` beside this. */
const oneLine = (s) => String(s || "").replace(/\s+/g, " ").trim();

const EXPECT = {
  LIVE: [200],
  NOT_IMPLEMENTED: [501],
  RETIRED: [503],
  DOOR_CLOSED: [404],
  QUARANTINED_PRE_RELEASE: [503],
  METHOD_NOT_ALLOWED: [405],
};

// Which routes we ALREADY publish to readers - read from the bytes, not decided here.
const llms = readFileSync(join(REPO, "public", "llms.txt"), "utf8") +
  readFileSync(join(REPO, "public", "llms-full.txt"), "utf8");
const published = (path) => llms.includes(path);

const entries = new Map();
const put = (e) => entries.set(e.id, e);
/** A human label, derived from the path tail. Mechanical, so it can never disagree with the route. */
const humanName = (path, method) => {
  const tail = path.replace(/^\/(api|\.well-known)\//, "").replace(/\.(json|jsonl|xml|txt)$/, "");
  const words = tail.split("/").join(" ").replace(/[-_]+/g, " ").trim();
  const label = words.charAt(0).toUpperCase() + words.slice(1);
  return method === "GET" ? label : `${label} (${method})`;
};

const idFor = (path, method) =>
  (path.replace(/^\//, "").replace(/[^a-zA-Z0-9]+/g, "-") + (method === "GET" ? "" : "-" + method))
    .toLowerCase().replace(/-+/g, "-").replace(/^-|-$/g, "");

const schemaRefs = (src) =>
  [...new Set([...src.matchAll(/"(csoai\.[a-z0-9./-]+)"/gi)].map((m) => m[1]))].sort();

// -- 1. every served functions/api route ---------------------------------------------------
const table = routeTable();
for (const r of servedApiRoutes(table)) {
  const lifecycle = lifecycleFromSource(r.src, r.method);
  put({
    id: idFor(r.path, r.method),
    kind: "http",
    path: r.path,
    method: r.method,
    name: humanName(r.path, r.method),
    description: oneLine(jsdocParagraph(r.src)),
    description_state: jsdocParagraph(r.src).trim() ? "DOCUMENTED" : "UNDOCUMENTED",
    audience: published(r.path) ? "both" : "agent",
    lifecycle,
    payment: "free",
    schema_refs: schemaRefs(r.src),
    surfaces: ["openapi", ...(published(r.path) ? ["llms"] : [])],
    probe: {
      method: r.method,
      request: r.path,
      expect_status: EXPECT[lifecycle],
      safe: r.method === "GET",
      ...(r.method === "GET" ? {} : { unsafe_reason: `${r.method} would write; the daily loop reads only` }),
    },
    source: r.file,
  });
}

// -- 2. the x402 doors, from the captured manifest ------------------------------------------
const wk = readJSON(join(REPO, "scripts", "fixtures", "x402scan", "well_known_x402.json"));
const canonical = readJSON(join(REPO, "functions", "api", "x402-descriptions.json"));
const canonicalFor = (path, popId) => {
  if (popId) return canonical[`pop_${popId}`];
  const tail = path.split("/").slice(2).join("_").replace(/-/g, "_");
  return canonical[tail] || canonical[`${tail}_bundle`];
};
for (const res of wk.resources) {
  const u = new URL(res.url);
  const path = u.pathname;
  const isPop = path.startsWith("/api/pop/");
  const popId = isPop ? path.slice("/api/pop/".length) : null;
  const free = res.amount === "0";
  const id = idFor(path, "GET");
  const prev = entries.get(id);
  put({
    ...(prev ?? {}),
    id,
    kind: isPop ? "population_door" : "http",
    path,
    method: (res.method || "GET").toUpperCase(),
    name: prev?.name || humanName(path, (res.method || "GET").toUpperCase()),
    description: oneLine(canonicalFor(path, popId) || res.description || prev?.description || ""),
    description_state: "DOCUMENTED",
    audience: "agent",
    lifecycle: "LIVE",
    payment: free ? "free" : res.free_preview ? "free_preview_then_x402" : "x402",
    schema_refs: prev?.schema_refs ?? [],
    surfaces: ["openapi", "llms"],
    probe: {
      method: "GET",
      request: u.pathname + u.search,
      expect_status: free ? [200, 402] : [402],
      safe: true,
    },
    // decodeURIComponent: the manifest's preview URLs carry angle-bracket placeholders
    // (?asset=<symbol>) and new URL() percent-encodes them. A reader must see the placeholder.
    ...(res.free_preview
      ? { free_preview: decodeURIComponent(new URL(res.free_preview).pathname + new URL(res.free_preview).search) }
      : {}),
    ...(res.paid_for ? { paid_for: res.paid_for } : {}),
    ...(popId ? { population: popId } : {}),
    source: prev?.source,
  });
}

// -- 3. the quarantined doors the manifest names rather than hides --------------------------
for (const q of wk.quarantined ?? []) {
  const u = new URL(q.url);
  const id = idFor(u.pathname, "GET");
  const prev = entries.get(id);
  put({
    ...(prev ?? {}),
    id,
    kind: "http",
    path: u.pathname,
    method: "GET",
    name: prev?.name || humanName(u.pathname, "GET"),
    description: oneLine(prev?.description || q.reason),
    description_state: "DOCUMENTED",
    audience: "agent",
    lifecycle: "QUARANTINED_PRE_RELEASE",
    payment: "not_sold",
    schema_refs: prev?.schema_refs ?? [],
    surfaces: ["openapi"],
    probe: { method: "GET", request: u.pathname, expect_status: [503], safe: true },
    quarantine_reason: q.reason,
    source: prev?.source,
  });
}

// -- 4. the MCP tools, from the door's own manifests ----------------------------------------
const freePaid = [
  ...readJSON(join(REPO, "functions", "mcp", "gspc-tools.json")).tools.map((t) => [t, "free"]),
  ...readJSON(join(REPO, "functions", "mcp", "paid-tools.json")).tools.map((t) => [t, "x402"]),
];
for (const [i, [t, payment]] of freePaid.entries()) {
  const prev = entries.get(t.name);
  put({
    id: t.name,
    kind: "mcp_tool",
    name: prev?.name || t.name,
    description: oneLine(t.description || ""),
    description_state: (t.description || "").trim() ? "DOCUMENTED" : "UNDOCUMENTED",
    audience: "agent",
    lifecycle: "LIVE",
    payment,
    schema_refs: prev?.schema_refs ?? [],
    surfaces: ["mcp", "llms"],
    probe: {
      method: "POST",
      request: "/mcp",
      expect_status: payment === "free" ? [200] : [200, 402],
      safe: false,
      unsafe_reason: "tools/call is a JSON-RPC POST; the daily loop probes the /mcp door itself, not each tool",
    },
    required_args: t.inputSchema?.required ?? [],
    // The door's own manifest order. The lock is BY NAME; this only keeps the rendered list in
    // the order functions/mcp/{gspc,paid}-tools.json declares, so a re-render is a no-op diff.
    order: i,
  });
}

// -- 5. the A2A skills, with the ROUTER as the arbiter of the id set ------------------------
const card = readJSON(join(REPO, "public", ".well-known", "agent-card.json"));
const cardSkills = new Map((card.skills ?? []).map((s) => [s.id, s]));
for (const id of routerSkillIds() ?? []) {
  const s = cardSkills.get(id) ?? {};
  const prev = entries.get(id);
  put({
    id,
    kind: "a2a_skill",
    name: s.name || prev?.name || id,
    description: oneLine(s.description || prev?.description || ""),
    description_state: (s.description || prev?.description || "").trim() ? "DOCUMENTED" : "UNDOCUMENTED",
    audience: "agent",
    lifecycle: "LIVE",
    payment: "free",
    schema_refs: prev?.schema_refs ?? [],
    surfaces: ["a2a", "llms"],
    probe: {
      method: "POST",
      request: "/api/a2a",
      expect_status: [200],
      safe: false,
      unsafe_reason: "A2A SendMessage is a JSON-RPC POST; the loop probes GET /api/a2a, the published contract",
    },
    ...(s.tags ? { tags: s.tags } : {}),
    ...(s.examples ? { examples: s.examples } : {}),
    ...(s.inputModes ? { inputModes: s.inputModes } : {}),
    ...(s.outputModes ? { outputModes: s.outputModes } : {}),
  });
}

// -- 6. the well-known documents ------------------------------------------------------------
for (const [route, rec] of table) {
  if (!route.startsWith("/.well-known/")) continue;
  if (route.includes("[")) continue;
  const id = idFor(route, "GET");
  const prev = entries.get(id);
  const lifecycle = lifecycleFromSource(rec.src, "get");
  put({
    id,
    kind: "well_known",
    path: route,
    method: "GET",
    name: prev?.name || humanName(route, "GET"),
    description: oneLine(prev?.description || jsdocParagraph(rec.src)),
    description_state: (prev?.description || jsdocParagraph(rec.src)).trim() ? "DOCUMENTED" : "UNDOCUMENTED",
    audience: "agent",
    lifecycle,
    payment: "free",
    schema_refs: schemaRefs(rec.src),
    surfaces: ["openapi", ...(published(route) ? ["llms"] : [])],
    probe: { method: "GET", request: route, expect_status: EXPECT[lifecycle], safe: true },
    source: rec.file,
  });
}

// -- merge with what is already declared: the author's prose always wins --------------------
// The author's fields survive a re-seed. `description` is NOT one of them: it is derived from
// the handler's own doc comment or the door's own manifest, so a re-seed must be able to refresh
// it. An author who wants different prose sets `description_override`, which does survive — and
// which is visible as an override rather than silently shadowing the code's own words.
const KEEP = ["name", "audience", "surfaces", "notes", "description_override", "probe_override"];
let existing = { schema: SCHEMA, capabilities: [], not_declared: [] };
if (existsSync(REGISTRY_PATH)) existing = readJSON(REGISTRY_PATH);
const byId = new Map(existing.capabilities.map((c) => [c.id, c]));
const merged = [...entries.values()].map((seeded) => {
  const old = byId.get(seeded.id);
  if (!old) return seeded;
  const out = { ...seeded };
  for (const k of KEEP) {
    const v = old[k];
    if (v === undefined || v === "" || (Array.isArray(v) && v.length === 0)) continue;
    out[k] = v;
  }
  if (out.description_override) {
    out.description = oneLine(out.description_override);
    out.description_state = "DOCUMENTED";
  }
  // A probe expectation the SEEDER cannot know. The seeder assumes a LIVE route answers 200 on
  // its bare path; several answer 400 because a required parameter is missing, and one answers
  // 308 because it is a redirect shim. Those are real contracts, not drift, and each override
  // carries the observation that justified it - the date, the origin and the status seen.
  if (out.probe_override) {
    out.probe = { ...out.probe, ...out.probe_override.probe };
  }
  return out;
});
// WHICH ENTRIES public/openapi.json IS EXPECTED TO CARRY.
// scripts/badger/csoai-openapi-gen.py now walks fixed handlers recursively under functions/api/.
// scripts/build_openapi.py then replaces an x402 resource path with the ONE method named by the
// well-known x402 manifest. That replacement is deliberate: aliases exported by the same handler
// are real HTTP capabilities, but they are not advertised as separate payable/discovery methods.
// /.well-known documents remain outside the OpenAPI producer. The gap is NAMED entry by entry so
// a producer expansion makes the old exemption fail closed instead of silently ageing.
const doorMethods = new Map();
for (const r of wk.resources) {
  const path = new URL(r.url).pathname;
  const method = String(r.method || "GET").toUpperCase();
  if (!doorMethods.has(path)) doorMethods.set(path, new Set());
  doorMethods.get(path).add(method);
}
const openapiGap = [];
for (const c of merged) {
  // MCP tools and A2A skills are not HTTP operations; they are rendered onto their own doors.
  if (c.kind === "mcp_tool" || c.kind === "a2a_skill") {
    c.surfaces = c.surfaces.filter((s) => s !== "openapi");
    continue;
  }

  const httpish = c.kind === "http" || c.kind === "population_door";
  const source = String(c.source ?? "");
  // Mirrors the recursive walker's fixed-route boundary: functions/api source, no private path
  // segment, no dynamic [param] segment, and no test file.
  const fixedApiSource =
    /^functions\/api\//.test(source) &&
    !source.split("/").some((part) => part.startsWith("_")) &&
    !source.includes("[") &&
    !source.endsWith(".test.ts");
  const listedMethods = doorMethods.get(c.path);
  // An x402-listed path is owned by the manifest's method set because build_openapi.py replaces
  // the walker's whole path item with the listed operation. Otherwise the recursive walker owns it.
  const inScope =
    httpish &&
    (listedMethods
      ? listedMethods.has(String(c.method || "").toUpperCase())
      : fixedApiSource);

  if (inScope) {
    if (!c.surfaces.includes("openapi")) c.surfaces = ["openapi", ...c.surfaces];
    continue;
  }

  c.surfaces = c.surfaces.filter((s) => s !== "openapi");
  openapiGap.push({
    id: c.id,
    path: c.path,
    method: c.method,
    reason:
      c.kind === "well_known"
        ? "a /.well-known document; the OpenAPI producer covers functions/api only"
        : listedMethods
          ? "the handler exports this alias, but the x402 manifest advertises a different method and build_openapi.py intentionally publishes one method per listed door"
          : "outside the recursive fixed-route functions/api surface rendered by scripts/badger/csoai-openapi-gen.py",
  });
}

// The site's capability navigation shows what a READER can use: a documented capability whose
// audience includes a human. Agent-only plumbing is served, catalogued and probed, but not
// navigated to. The nav surface is derived here so no component can add a row of its own.
for (const c of merged) {
  const wanted = c.audience === "both" || c.audience === "human";
  const has = c.surfaces.includes("nav");
  if (wanted && !has) c.surfaces = [...c.surfaces, "nav"];
  if (!wanted && has) c.surfaces = c.surfaces.filter((s) => s !== "nav");
}

// UNDOCUMENTED is first-class: a route whose handler carries no doc comment has no description
// anywhere in the estate. It is recorded as UNDOCUMENTED rather than given an invented sentence,
// and it is kept OFF the reader-facing surfaces until someone writes one.
for (const c of merged) {
  if (c.description_state === "UNDOCUMENTED" || !String(c.description).trim()) {
    c.description_state = "UNDOCUMENTED";
    c.description = "";
    c.surfaces = c.surfaces.filter((s) => s !== "llms" && s !== "nav");
  }
}
merged.sort((a, b) => (a.kind + "|" + a.id).localeCompare(b.kind + "|" + b.id));

const doc = {
  schema: SCHEMA,
  what: "ONE declaration of every surface this estate serves. public/openapi.json, the MCP tool-fleet lock, the A2A agent card's skills, public/llms*.txt and the site's capability navigation are RENDERED from this file. Nothing here is a count: every total any renderer publishes is the length of an array computed at generation time.",
  rules: [
    "A capability may not claim a lifecycle its probe contradicts: LIVE whose probe expects 404/410/501/503 fails scripts/capability-registry.mjs --check.",
    "A declared entry whose path has no handler in functions/ fails. A served functions/api route declared by no entry fails. Both directions, every build.",
    "MCP tools are locked BY NAME against functions/mcp/{gspc,paid}-tools.json, so a swap of equal size is caught. A2A skills are locked against SKILL_IDS in functions/api/a2a.ts.",
    "probe.safe says whether the daily pod loop may issue the request. A probe the loop may not run is UNCHECKABLE by that loop and says so; it is never recorded as agreement.",
    "Editorial fields (name, audience, surfaces, description) are the author's. scripts/capability-seed.mjs refreshes the mechanical fields and never overwrites them.",
  ],
  lifecycle_vocabulary: "x-csoai-lifecycle, as functions/api/openapi-route-table.test.ts and scripts/badger/csoai-openapi-gen.py already use it: LIVE | NOT_IMPLEMENTED | RETIRED | DOOR_CLOSED | QUARANTINED_PRE_RELEASE | METHOD_NOT_ALLOWED. No second vocabulary was invented.",
  generator: "scripts/capability-seed.mjs (mechanical fields) plus hand-authored editorial fields",
  adjacent_not_absorbed: [
    {
      what: "the memberships manifest (public/interop/, the membership components)",
      why: "another hand-maintained list of things this estate claims, and the same class of surface this declaration exists for. It is NOT absorbed here: it landed in its own lane on 2026-09-22 and belongs to whoever next reconciles it. Named so the next reader finds it rather than rediscovering it.",
    },
    {
      what: "the ~230 HTML page shims under functions/ that serve prerendered client/ pages",
      why: "they are pages, not capabilities, they belong to client/, and nine lanes were editing that tree the day this was built. The declaration covers what the estate SERVES to an agent; the site's own route manifest (client/src/data/route-manifest.ts) covers what it serves to a reader.",
    },
  ],
  not_declared: existing.not_declared ?? [],
  openapi_gap: openapiGap,
  capabilities: merged,
};

const text = JSON.stringify(doc, null, 2) + "\n";
if (DRY) {
  const before = existsSync(REGISTRY_PATH) ? readFileSync(REGISTRY_PATH, "utf8") : "";
  console.log(before === text ? "no change" : `would rewrite council-os/capabilities.json (${merged.length} entries)`);
  process.exit(before === text ? 0 : 1);
} else {
  writeFileSync(REGISTRY_PATH, text);
  console.log(`seeded council-os/capabilities.json - ${merged.length} entries`);
}
