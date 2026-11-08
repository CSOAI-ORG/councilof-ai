#!/usr/bin/env node
/**
 * build-deep-index.mjs — the estate's deep index (schema csoai.deep-index/0.1).
 *
 * WHY. The Council carries seven dimension families, each published in its own place, and
 * nothing says in one artifact what the others contain: the sector×framework content
 * (client/src/data/sectors-content.ts), the industry pages
 * (client/src/data/industries-content.ts), the Distribution Hive account spine
 * (client/src/data/ecosystem.ts), the Layer 0 trust floor (client/src/pages/Layer0.tsx and
 * its node registry client/src/data/layer0Nodes.ts), the measured board (GET /api/gspc)
 * and the deadline register (GET /api/regulation). Every join between those families is
 * either prose on a page or — mostly — nothing at all. This script reads every family from
 * committed bytes or live payloads and emits ONE index, with an explicit DECLARED-GAP layer:
 * every cross-family binding that does NOT yet have a published artifact is listed as such.
 * Honest absence is the deliverable's integrity. No count, title or field is typed from
 * memory; a layer that cannot be read fails the build rather than passing blindly.
 *
 * WHAT. One artifact: public/interop/deep-index.json. Seven layers + anchors + counts +
 * a content_sha256 over the content body in canonical form (sorted keys, no whitespace —
 * the estate's canonical rule). generated_at and the hash are NOT in the hashed body, so
 * the hash is stable across runs against the same inputs.
 *
 *   node scripts/surface/build-deep-index.mjs          # writes public/interop/deep-index.json
 *   node scripts/surface/build-deep-index.mjs --check  # regenerate + compare; exit 1 on drift
 *   node scripts/surface/build-deep-index.mjs --out DIR     # output root (default public)
 *
 * EXTRACTION HONESTY (the grounding rule). sectors-content.ts and industries-content.ts
 * are JSON-style object literals: the exported array literal is sliced out and JSON.parsed.
 * ecosystem.ts, Layer0.tsx and layer0Nodes.ts carry unquoted TypeScript keys: a string-aware
 * scanner reads each record's top-level `key: value` fields — values are taken verbatim,
 * never completed, never defaulted. `sector`, `accuracy` and `separation` are omitted (not
 * null-padded) where the source omits them. Any slug whose framework suffix cannot be
 * resolved keeps framework: null and is counted in unresolved_framework_slugs — never guessed.
 *
 * BOUNDARIES. Org-level public fields only for accounts: HQ coordinates and the free-text
 * `source` / `currentVendor` recon fields stay in the source file and out of this artifact.
 * Deadline penalty_exposure strings are quoted by the register, not copied here. No page,
 * no route, no package.json wiring is produced — the artifact and this generator only.
 * The /deep-index page is the follow-up once this merges.
 */
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const OUT_REL = "public/interop/deep-index.json";
const BRAND = "Council of AI — Global Regulation Atlas";
const LIVE = {
  board: "https://councilof.ai/api/gspc",
  deadlines: "https://councilof.ai/api/regulation",
  crosswalk: "https://councilof.ai/crosswalk/east-west-v1.json",
  inventoryPointer: "https://councilof.ai/interop/regulatory-inventory-latest.json",
};

/* ------------------------------------------------------------------ *
 * String-aware scanners. No eval, no TS parser: read literals as bytes.
 * ------------------------------------------------------------------ */

/** Slice the object/array literal that opens at index `start`, string-aware. */
function sliceLit(src, start, openCh, closeCh) {
  let depth = 0, inStr = false, esc = false;
  for (let i = start; i < src.length; i++) {
    const ch = src[i];
    if (inStr) {
      if (esc) esc = false;
      else if (ch === "\\") esc = true;
      else if (ch === '"') inStr = false;
      continue;
    }
    if (ch === '"') { inStr = true; continue; }
    if (ch === openCh) depth++;
    else if (ch === closeCh) {
      depth--;
      if (depth === 0) return src.slice(start, i + 1);
    }
  }
  return null;
}

/** Split a literal body into top-level {...} records, string-aware. */
function splitRecs(body) {
  const recs = [];
  let depth = 0, recStart = -1, inStr = false, esc = false;
  for (let i = 0; i < body.length; i++) {
    const ch = body[i];
    if (inStr) {
      if (esc) esc = false;
      else if (ch === "\\") esc = true;
      else if (ch === '"') inStr = false;
      continue;
    }
    if (ch === '"') { inStr = true; continue; }
    if (ch === "{") {
      if (depth === 0) recStart = i;
      depth++;
    } else if (ch === "}") {
      depth--;
      if (depth === 0) recs.push(body.slice(recStart, i + 1));
    }
  }
  return recs;
}

/** Read the top-level `key: value` fields of one TS object-literal record.
 *  Values come back verbatim: string, parsed flat array, or bare word. */
function fieldsOf(rec) {
  const out = {};
  let i = 0, inStr = false, esc = false;
  while (i < rec.length) {
    const ch = rec[i];
    if (inStr) {
      if (esc) esc = false;
      else if (ch === "\\") esc = true;
      else if (ch === '"') inStr = false;
      i++;
      continue;
    }
    if (ch === '"') { inStr = true; i++; continue; }
    const idm = /^[A-Za-z_$][A-Za-z0-9_$]*/.exec(rec.slice(i));
    if (!idm) { i++; continue; }
    const key = idm[0];
    let j = i + key.length;
    while (j < rec.length && /\s/.test(rec[j])) j++;
    if (rec[j] !== ":") { i += key.length; continue; }
    let k = j + 1;
    while (k < rec.length && /\s/.test(rec[k])) k++;
    const vch = rec[k];
    if (vch === '"') {
      let s = k + 1, e2 = false, val = "";
      while (s < rec.length) {
        const c = rec[s];
        if (e2) { val += c; e2 = false; }
        else if (c === "\\") e2 = true;
        else if (c === '"') break;
        else val += c;
        s++;
      }
      out[key] = val;
      i = s + 1;
    } else if (vch === "[") {
      const lit = sliceLit(rec, k, "[", "]");
      if (!lit) throw new Error(`ARRAY_LITERAL_UNTERMINATED key=${key}`);
      // The flat literal arrays in these records (strings/numbers) are JSON-clean.
      out[key] = JSON.parse(lit);
      i = k + lit.length;
    } else {
      const bm = /^[^\s,{\]}]+$/.exec(rec.slice(k));
      out[key] = bm ? bm[0] : "";
      i = k + (bm ? bm[0].length : 0);
    }
  }
  return out;
}

/** Locate `const NAME` (exported or module-local) at an identifier boundary. */
function findConst(src, file, name) {
  const m = new RegExp(`\\bconst\\s+${name}\\b`).exec(src);
  if (!m) throw new Error(`CONST_NOT_FOUND ${name} in ${file}`);
  return m.index;
}

/** Extract `export const NAME: ... = [ ... ];` and JSON.parse the array literal. */
function jsonArrayOf(src, file, name) {
  const declIdx = findConst(src, file, name);
  const eqIdx = src.indexOf("=", declIdx);
  const openIdx = src.indexOf("[", eqIdx);
  const lit = sliceLit(src, openIdx, "[", "]");
  if (!lit) throw new Error(`ARRAY_LITERAL_UNTERMINATED ${name} in ${file}`);
  try {
    return JSON.parse(lit);
  } catch (e) {
    throw new Error(`ARRAY_NOT_JSON_CLEAN ${name} in ${file}: ${e.message}`);
  }
}

/** All {...} records of an exported TS array, read by the string-aware field scanner. */
function recordsOf(src, file, name) {
  const declIdx = findConst(src, file, name);
  const eqIdx = src.indexOf("=", declIdx);
  const openIdx = src.indexOf("[", eqIdx);
  const lit = sliceLit(src, openIdx, "[", "]");
  if (!lit) throw new Error(`ARRAY_LITERAL_UNTERMINATED ${name} in ${file}`);
  const recs = splitRecs(lit.slice(1, -1));
  if (!recs.length) {
    throw new Error(`NO_RECORDS_READ ${name} in ${file} — refusing to pass blindly`);
  }
  return recs.map(fieldsOf);
}

/** Layer read failure is fatal: an honest failure beats a silent absence. */
function readLayer(name, read) {
  try {
    const v = read();
    if (v == null || (Array.isArray(v) && v.length === 0)) throw new Error("empty");
    return v;
  } catch (e) {
    throw new Error(`LAYER_UNREADABLE ${name}: ${e.message} — the deep index never invents a layer`);
  }
}

/* ----------------------------- layers ----------------------------- */

// Framework tokens are the suffix vocabulary the sector slugs actually use (longest first,
// so uk-ai-regulation wins over uk-ai). A slug that ends in none of them keeps
// framework: null and is reported — never guessed.
const FRAMEWORK_SUFFIXES = [
  "uk-ai-regulation",
  "eu-ai-act",
  "iso-42001",
  "uk-ai",
  "gdpr",
  "hipaa",
  "nis2",
  "cra",
  "dora",
];

function resolveFramework(slug) {
  for (const fw of FRAMEWORK_SUFFIXES) {
    if (slug.endsWith("-" + fw)) {
      return { framework: fw, industryPath: slug.slice(0, slug.length - fw.length - 1) };
    }
  }
  return { framework: null, industryPath: slug };
}

function sectorsLayer() {
  const src = readFileSync(join(ROOT, "client/src/data/sectors-content.ts"), "utf8");
  const entries = jsonArrayOf(src, "sectors-content.ts", "sectorsdata");
  const unresolved = [];
  const rows = entries.map((e) => {
    const { framework, industryPath } = resolveFramework(e.slug);
    if (!framework) unresolved.push(e.slug);
    return {
      industry_path: industryPath,
      framework, // null when the slug carries no framework suffix (the industries index entry)
      slug: e.slug,
      title: e.title,
      canonical: e.canonical,
    };
  });
  return {
    rows,
    unresolved,
    method:
      "JSON.parse of the exported array literal in client/src/data/sectors-content.ts (sliced from `export const sectorsdata: SectorsDataEntry[] = [ ... ];`); all entries parsed clean. " +
      "industry_path and framework are derived per slug by longest-suffix match against the framework tokens the slugs themselves use " +
      "(uk-ai-regulation, eu-ai-act, iso-42001, uk-ai, gdpr, hipaa, nis2, cra, dora); a slug matching none keeps framework null and is listed in unresolved_framework_slugs.",
  };
}

function industriesLayer() {
  const src = readFileSync(join(ROOT, "client/src/data/industries-content.ts"), "utf8");
  const entries = jsonArrayOf(src, "industries-content.ts", "industriesdata");
  return {
    rows: entries.map((e) => ({ slug: e.slug, title: e.title })),
    method:
      "JSON.parse of the exported array literal in client/src/data/industries-content.ts (`export const industriesdata: IndustriesDataEntry[] = [ ... ];`); slug and title only; all entries parsed clean.",
  };
}

function accountsLayer() {
  const src = readFileSync(join(ROOT, "client/src/data/ecosystem.ts"), "utf8");
  const recs = recordsOf(src, "ecosystem.ts", "ECOSYSTEM");
  const required = ["id", "name", "type", "region", "country", "jurisdictions", "frameworks", "posture", "play"];
  const rows = recs.map((f, idx) => {
    for (const k of required) {
      if (!(k in f)) {
        throw new Error(`ACCOUNT_FIELD_MISSING ${k} on record ${idx + 1} — the file wins, never a default`);
      }
    }
    return {
      id: f.id,
      name: f.name,
      type: f.type,
      region: f.region,
      country: f.country,
      jurisdictions: f.jurisdictions,
      frameworks: f.frameworks,
      // Optional in the source: omitted here when absent, never null-padded.
      ...(f.sector !== undefined ? { sector: f.sector } : {}),
      posture: f.posture,
      play: f.play,
    };
  });
  return {
    rows,
    method:
      "String-aware top-level field scan of the ECOSYSTEM array literal in client/src/data/ecosystem.ts (unquoted TS keys; every value verbatim, nothing completed). " +
      "Org-level public fields only: hq coordinates and the free-text source/currentVendor recon fields stay in the source file and out of this artifact. " +
      "sector is omitted where the source omits it; posture/vendor unknown stays unknown.",
  };
}

function layer0Layer() {
  const page = readFileSync(join(ROOT, "client/src/pages/Layer0.tsx"), "utf8");
  const nodesSrc = readFileSync(join(ROOT, "client/src/data/layer0Nodes.ts"), "utf8");

  // Control levels: const L0_LEVELS = [ { id, name, body } ... ] — title = the level name.
  const levels = recordsOf(page, "Layer0.tsx", "L0_LEVELS").map((f) => ({
    source: "client/src/pages/Layer0.tsx",
    kind: "control-level",
    id: f.id,
    title: f.name,
  }));

  // Bench topics: const BENCH = [ { figure, title, caveat } ... ] — titles only; the
  // measured figures stay on the page, beside their own caveats.
  const bench = recordsOf(page, "Layer0.tsx", "BENCH").map((f) => {
    if (!f.title) throw new Error("BENCH_FIELD_MISSING title");
    return { source: "client/src/pages/Layer0.tsx", kind: "bench-topic", title: f.title };
  });

  // The audited node registry the page computes its counts from.
  const nodes = recordsOf(nodesSrc, "layer0Nodes.ts", "LAYER0_NODES").map((f) => {
    for (const k of ["id", "name", "cls", "status"]) {
      if (!(k in f)) throw new Error(`NODE_FIELD_MISSING ${k} — refusing to pass blindly`);
    }
    return {
      source: "client/src/data/layer0Nodes.ts",
      kind: "node",
      id: f.id,
      title: f.name,
      cls: f.cls,
      status: f.status,
    };
  });

  return {
    rows: [...levels, ...bench, ...nodes],
    method:
      "Structured extraction of the array literals in client/src/pages/Layer0.tsx (L0_LEVELS control-level names, BENCH topics — titles only) " +
      "plus the audited node registry the page renders from, client/src/data/layer0Nodes.ts (LAYER0_NODES: id, name, cls, status). " +
      "Node coordinates and prose fields stay in the registry file.",
  };
}

async function fetchLive(url) {
  let lastErr = null;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const r = await fetch(url, { headers: { accept: "application/json" } });
      if (r.ok) return await r.json();
      lastErr = new Error(`HTTP ${r.status}`);
    } catch (e) {
      lastErr = e;
    }
    if (attempt < 3) await new Promise((res) => setTimeout(res, 1500));
  }
  throw new Error(`LIVE_FETCH_FAILED ${url}: ${lastErr?.message ?? "unknown"}`);
}

async function liveLayers() {
  const [board, reg, crosswalk, inventory] = await Promise.all([
    fetchLive(LIVE.board),
    fetchLive(LIVE.deadlines),
    fetchLive(LIVE.crosswalk),
    fetchLive(LIVE.inventoryPointer),
  ]);

  const axes = (Array.isArray(board?.axes) ? board.axes : []).map((a) => ({
    axis: a.axis,
    kind: a.kind,
    status: a.status,
    // Measured values are carried only when the board serves them — absence stays absence.
    ...(typeof a.accuracy === "number" ? { accuracy: a.accuracy } : {}),
    ...(typeof a.n === "number" ? { n: a.n } : {}),
    ...(a.separation !== undefined && a.separation !== null ? { separation: a.separation } : {}),
  }));

  const now = new Date();
  const todayUtc = now.toISOString().slice(0, 10);
  const deadlines = (Array.isArray(reg?.deadlines) ? reg.deadlines : []).map((d) => ({
    date: d.date,
    instrument: d.instrument,
    basis: d.basis,
    status: d.status,
    days_until: Math.round(
      (Date.parse(d.date + "T00:00:00Z") - Date.parse(todayUtc + "T00:00:00Z")) / 86400000,
    ),
    // Prose fields (what, penalty_exposure) stay in the register: one `what` row quotes a
    // revenue threshold with a currency amount, and this artifact quotes no amounts. The
    // register is the authority for the words; the joinable fields are the ones copied.
  }));

  const jurisdictions = Array.isArray(crosswalk?.jurisdictions) ? crosswalk.jurisdictions : [];
  const crosswalkRows = jurisdictions.reduce(
    (acc, j) => acc + (Array.isArray(j.rows) ? j.rows.length : 0),
    0,
  );
  const concepts = [
    ...new Set(jurisdictions.flatMap((j) => (Array.isArray(j.rows) ? j.rows.map((r) => r.mapped_to) : []))),
  ].filter(Boolean);

  return {
    boardAxes: {
      rows: axes,
      meta: {
        url: LIVE.board,
        board_public_count: board?.totals?.public_count ?? null,
        board_lid: board?.totals?.lid ?? null,
      },
      method:
        "Fetched live from GET /api/gspc at build time; per-axis fields the board serves (axis, kind, status, accuracy, n, separation), absent where the board omits them.",
    },
    deadlines: {
      rows: deadlines,
      meta: {
        url: LIVE.deadlines,
        verified_as_of: reg?.verified_as_of ?? null,
        days_until_rule: `date minus build date ${todayUtc} (UTC), whole days; past dates negative`,
      },
      method:
        "Fetched live from GET /api/regulation at build time. Prose fields (what, penalty_exposure) are quoted by the register and deliberately not copied here — one `what` row carries a currency amount (a quoted revenue threshold), and this artifact quotes no amounts.",
    },
    anchors: {
      crosswalk: {
        url: LIVE.crosswalk,
        schema: crosswalk?.schema ?? null,
        version: crosswalk?.version ?? null,
        rows: crosswalkRows,
        regimes: jurisdictions.length,
        concepts,
        method: "Row, regime and concept counts measured from the fetched crosswalk payload at build time, never typed.",
      },
      regulatoryInventoryPointer: {
        url: LIVE.inventoryPointer,
        schema: inventory?.schema ?? null,
        kind: inventory?.kind ?? null,
        versioned_at: inventory?.versioned_at ?? null,
        index_url: inventory?.index_url ?? null,
        index_sha256: inventory?.index_sha256 ?? null,
        crosswalk_assets:
          typeof inventory?.crosswalk_assets === "number" ? inventory.crosswalk_assets : null,
        method:
          "Frozen-inventory pointer fields read from the fetched payload at build time; the pointer's own scope note governs interpretation.",
      },
    },
  };
}

/* ------------------------- the declared gaps ------------------------- *
 * Every cross-family binding that does NOT yet have a published artifact.
 * Each row was checked against the tree before being declared a gap; where
 * a partial binding exists it is named inside the note, not absorbed.
 * -------------------------------------------------------------------- */

function bindingsLayer() {
  return {
    rows: [
      {
        from: "sectors_frameworks.industry_path",
        to: "board_axes",
        status: "no published binding",
        note:
          "No artifact maps a sectors-content industry path to GSPC axes or findings. The only sector-level binding published is " +
          "public/interop/white-label-sector-crosswalk.json, covering 3 white-label sectors (insurance, bond, cobol) and none of the industry paths in this index.",
      },
      {
        from: "sectors_frameworks.industry_path",
        to: "industries.slug",
        status: "no published binding",
        note:
          "Two industry vocabularies exist — the sector-page paths (including compound forms like finance-banking and legal-law-firms) and the industry-page slugs — with no published mapping between them.",
      },
      {
        from: "sectors_frameworks.entry",
        to: "anchors.crosswalk rows",
        status: "no published binding",
        note:
          "The sector pages carry prose pointers to /crosswalk/east-west-v1.json, but no published artifact binds an individual sector×framework entry to specific crosswalk rows or concepts.",
      },
      {
        from: "accounts.frameworks",
        to: "sectors_frameworks.framework",
        status: "no published binding",
        note:
          "The account spine names framework tokens (eu-ai-act, dora, nis2, ...) and the sector content names the same frameworks, but no published artifact joins an account's framework list to sector framework coverage.",
      },
      {
        from: "accounts",
        to: "anchors.regulatoryInventoryPointer (frozen provisions)",
        status: "no published binding",
        note:
          "The frozen regulatory inventory points at hashed provision crosswalks; no published artifact binds any account's frameworks or jurisdictions to specific inventory provisions.",
      },
      {
        from: "accounts.jurisdictions",
        to: "deadlines",
        status: "no published binding",
        note: "No published artifact joins an account's jurisdictions to the deadline register rows that bite them.",
      },
      {
        from: "deadlines.basis",
        to: "anchors.regulatoryInventoryPointer (frozen provisions)",
        status: "no published binding",
        note: "Deadline rows cite instruments and articles; the inventory pointer lists provisions. Nothing published joins the two.",
      },
      {
        from: "board_axes",
        to: "sectors_frameworks.framework",
        status: "no published binding",
        note: "No published artifact binds a GSPC axis to any framework token the sector content uses.",
      },
      {
        from: "layer0.control-level",
        to: "board_axes",
        status: "no published binding",
        note: "No published artifact binds a Layer 0 control level (L0-1/L0-2/L0-3) to any measured board axis.",
      },
      {
        from: "layer0.node",
        to: "accounts",
        status: "no published binding",
        note:
          "Both layers name real public organisations, but no published artifact identifies Layer 0 registry nodes with account-spine entries (or declares them disjoint).",
      },
    ],
    method:
      "The DECLARED-GAP layer: every cross-dimension binding this index checked for and did not find published. Verified against the tree at authoring time; partial bindings are named in the notes rather than absorbed. A gap closed by a later artifact must be removed from this list in the same commit that publishes the artifact.",
  };
}

/* ------------------------------ emit ------------------------------ */

/** Canonical form per the estate rule: sorted keys, no whitespace. */
function canonicalJson(v) {
  if (Array.isArray(v)) return "[" + v.map(canonicalJson).join(",") + "]";
  if (v && typeof v === "object") {
    return (
      "{" +
      Object.keys(v)
        .sort()
        .map((k) => JSON.stringify(k) + ":" + canonicalJson(v[k]))
        .join(",") +
      "}"
    );
  }
  return JSON.stringify(v);
}

async function buildIndex() {
  const sf = readLayer("sectors_frameworks", sectorsLayer);
  const ind = readLayer("industries", industriesLayer);
  const acc = readLayer("accounts", accountsLayer);
  const l0 = readLayer("layer0", layer0Layer);
  const live = await liveLayers();
  const bind = readLayer("bindings", bindingsLayer);

  const content = {
    sectors_frameworks: sf.rows,
    industries: ind.rows,
    accounts: acc.rows,
    layer0: l0.rows,
    board_axes: live.boardAxes.rows,
    deadlines: live.deadlines.rows,
    bindings: bind.rows,
    anchors: live.anchors,
    layer_meta: {
      sectors_frameworks: {
        extraction: sf.method,
        unresolved_framework_slugs: sf.unresolved,
      },
      industries: { extraction: ind.method },
      accounts: { extraction: acc.method },
      layer0: { extraction: l0.method },
      board_axes: { extraction: live.boardAxes.method, ...live.boardAxes.meta },
      deadlines: { extraction: live.deadlines.method, ...live.deadlines.meta },
      bindings: { extraction: bind.method },
      anchors: { extraction: "Counts and pointer fields measured from fetched payloads at build time." },
    },
  };

  const content_sha256 = createHash("sha256").update(canonicalJson(content)).digest("hex");

  return {
    schema: "csoai.deep-index/0.1",
    brand: BRAND,
    title: "The deep index — every dimension the estate carries, joined or declared apart",
    purpose:
      "One artifact joining the sector×framework content, the industry pages, the Distribution Hive account spine, the Layer 0 trust floor, the measured board and the deadline register — and listing, as data, every cross-dimension binding that has no published artifact yet.",
    measurement_not_certification:
      "This index carries descriptions and states exactly as their sources serve them. A binding declared absent is a fact about published artifacts, not a judgment about compliance. Nothing here is legal opinion.",
    content_sha256_rule:
      "sha256 over canonicalJson(content) — sorted keys, no whitespace — where content is the seven layers plus anchors and layer_meta, WITHOUT generated_at and WITHOUT the hash itself. Same canonical rule as the card digest family; recomputable from the artifact itself.",
    content_sha256,
    sources: {
      sectors_frameworks: "client/src/data/sectors-content.ts (committed bytes)",
      industries: "client/src/data/industries-content.ts (committed bytes)",
      accounts: "client/src/data/ecosystem.ts (committed bytes, org-level public fields only)",
      layer0: "client/src/pages/Layer0.tsx + client/src/data/layer0Nodes.ts (committed bytes, titles and registry fields)",
      board_axes: LIVE.board,
      deadlines: LIVE.deadlines,
      anchors_crosswalk: LIVE.crosswalk,
      anchors_inventory: LIVE.inventoryPointer,
    },
    generated_at: new Date().toISOString(),
    counts: {
      sectors_frameworks: content.sectors_frameworks.length,
      industries: content.industries.length,
      accounts: content.accounts.length,
      layer0: content.layer0.length,
      board_axes: content.board_axes.length,
      deadlines: content.deadlines.length,
      bindings: content.bindings.length,
      declared_gaps: content.bindings.filter((b) => b.status === "no published binding").length,
    },
    sectors_frameworks: content.sectors_frameworks,
    industries: content.industries,
    accounts: content.accounts,
    layer0: content.layer0,
    board_axes: content.board_axes,
    deadlines: content.deadlines,
    bindings: content.bindings,
    anchors: content.anchors,
    layer_meta: content.layer_meta,
  };
}

/* ------------------------------ main ------------------------------ */

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const check = args.includes("--check");
  const outDir = resolve(ROOT, args.includes("--out") ? args[args.indexOf("--out") + 1] : "public");
  const outPath = join(outDir, "interop", "deep-index.json");

  const fresh = await buildIndex();
  const freshBytes = JSON.stringify(fresh, null, 2) + "\n";

  if (check) {
    // Regenerate and byte-compare. generated_at is the only legitimate run-to-run
    // difference (the build instant itself); everything else — including the live board
    // rows, the deadlines and their ages — must match byte for byte. The register aging
    // a day IS drift; the check is supposed to catch that.
    const strip = (s) => s.replace(/"generated_at": "[^"]*",\n/, "");
    if (!existsSync(outPath)) {
      console.error(`✖ deep-index --check: ${relative(ROOT, outPath)} does not exist — run the generator first`);
      process.exit(1);
    }
    const current = readFileSync(outPath, "utf8");
    if (strip(current) === strip(freshBytes)) {
      console.log(`✓ deep index: regenerated artifact matches ${relative(ROOT, outPath)} byte for byte (generated_at excluded)`);
      process.exit(0);
    }
    console.error(
      `✖ deep index is stale against committed bytes or the live sources — run node scripts/surface/build-deep-index.mjs\n  ${relative(ROOT, outPath)}`,
    );
    process.exit(1);
  }

  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, freshBytes);
  const c = fresh.counts;
  console.log(
    `✓ deep index: ${c.sectors_frameworks} sector×framework entries · ${c.industries} industries · ${c.accounts} accounts · ` +
      `${c.layer0} layer0 items · ${c.board_axes} board axes · ${c.deadlines} deadlines · ${c.declared_gaps} declared binding gaps ` +
      `→ ${relative(ROOT, outPath)} (content_sha256 ${fresh.content_sha256.slice(0, 12)}…)`,
  );
}
