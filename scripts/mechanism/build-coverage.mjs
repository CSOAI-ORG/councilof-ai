#!/usr/bin/env node
// Producer for /mechanism/coverage.json (and, through it, the coverage tables on /mechanism/).
//
// Input:  scripts/mechanism/coverage.source.json — the hand-edited map (instrument names, which
//         routing record belongs to which instrument, the predicates, the jurisdiction list).
// Reads:  the frozen provision manifest, the regulatory inventory, the crosswalk files, the
//         published capsule batches and client/src/App.tsx. Every count in the output is derived
//         from those bytes; the source file carries no number.
// Output: public/mechanism/coverage.json. No clock time, so unchanged inputs give identical bytes.
//
//   node scripts/mechanism/build-coverage.mjs          write
//   node scripts/mechanism/build-coverage.mjs --check  exit 1 if the committed file is stale
import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { gunzipSync } from "node:zlib";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
export const SOURCE = "scripts/mechanism/coverage.source.json";
export const OUTPUT = "public/mechanism/coverage.json";
export const PRODUCER = "scripts/mechanism/build-coverage.mjs";
/** A frozen provision id: CELEX number, a colon, the manifest's own (possibly negative) number. */
export const PROVISION_ID_RE = /\b3\d{4}[RLD]\d{4}:-?\d+\b/g;
export const STATUSES = ["PREDICATE", "RELATED_MEASURE", "CROSSWALK_ONLY", "HASH_ONLY"];

const fail = (msg) => {
  throw new Error(`mechanism coverage: ${msg}`);
};
const sha256 = (b) => createHash("sha256").update(b).digest("hex");

/** Article numbers named in free text: "Article 5(1)(b)", "Art. 9", "Arts 8–15" (a range). */
export function articlesIn(text) {
  const out = new Set();
  const unresolved = [];
  const re = /\bArt(?:icle|s|\.)?s?\s*(\d+)(?:\s*[–-]\s*(\d+))?/g;
  for (const m of String(text).matchAll(re)) {
    const a = Number(m[1]);
    const b = m[2] ? Number(m[2]) : a;
    if (b < a || b - a > 40) fail(`implausible article range in "${text}"`);
    for (let n = a; n <= b; n++) out.add(String(n));
  }
  for (const m of String(text).matchAll(/\bAnnex\s+([IVXLC]+)\b/g)) unresolved.push(`Annex ${m[1]}`);
  return { articles: [...out], unresolved };
}

/** The manifest's corpus root, recomputed: sha256 over the concatenation of sorted (id + hash). */
export function corpusRoot(anchors) {
  return sha256(
    Object.keys(anchors)
      .sort()
      .map((k) => k + anchors[k])
      .join(""),
  );
}

/** Route path -> the page file App.tsx renders for it (component route or render-prop route). */
export function routeFiles(appText) {
  const lazy = new Map();
  for (const m of appText.matchAll(/const\s+(\w+)\s*=\s*lazy\(\(\)\s*=>\s*import\("\.\/pages\/([\w/.-]+)"\)\)/g))
    lazy.set(m[1], `client/src/pages/${m[2]}.tsx`);
  const routes = new Map();
  for (const m of appText.matchAll(/<Route\s+path="([^"]+)"\s+component=\{(\w+)\}/g)) routes.set(m[1], m[2]);
  for (const m of appText.matchAll(/<Route\s+path="([^"]+)">\{\(\)\s*=>\s*<(\w+)/g)) routes.set(m[1], m[2]);
  const out = new Map();
  for (const [p, comp] of routes) out.set(p, { component: comp, file: lazy.get(comp) ?? null });
  return out;
}

/** Every capsule in a published batch that carries a provision binding (the optional v0.3 field). */
function capsuleBindings(dir, readBytes) {
  const rec = JSON.parse(readBytes(`${dir}/record.json`).toString("utf8"));
  const gz = readBytes(`${dir}/${rec.capsules_file.path}`);
  if (sha256(gz) !== rec.capsules_file.sha256) fail(`${dir}: capsules file sha256 does not match its record`);
  let withBinding = 0;
  let n = 0;
  const bound = new Set();
  for (const line of gunzipSync(gz).toString("utf8").split("\n")) {
    if (!line.trim()) continue;
    n++;
    const c = JSON.parse(line);
    if (Array.isArray(c.provisions) && c.provisions.length) {
      withBinding++;
      for (const b of c.provisions) if (b && b.provision_id) bound.add(b.provision_id);
    }
  }
  if (n !== rec.n_capsules) fail(`${dir}: ${n} capsules read, record says ${rec.n_capsules}`);
  return { rec, n, withBinding, bound: [...bound].sort() };
}

/**
 * The inventory an unsigned discovery pointer selects, read only as the exact bytes it names. A path
 * that is not a pointer is read as-is. The stamped versions and their proofs are checked in full by
 * scripts/regulatory-inventory-gate.mjs; here the bytes must at least be the ones the pointer names,
 * and the proof's header must commit to them.
 */
export function readInventory(p, io) {
  const doc = io.readJson(p);
  if (doc?.schema !== "csoai.regulatory-inventory-pointer/1") return doc;
  const name = typeof doc.index_url === "string" && /^\/interop\/regulatory-inventory(?:-\d{4}-\d{2}-\d{2}-[0-9a-f]{12})?\.json$/.test(doc.index_url)
    ? doc.index_url.slice("/interop/".length) : fail(`${p} names a file outside the versioned inventory set`);
  const file = `public/interop/${name}`;
  const bytes = io.readBytes(file);
  if (sha256(bytes) !== doc.index_sha256) fail(`${file} is not the bytes ${p} selects`);
  const proof = io.readBytes(`${file}.ots`);
  const header = Buffer.from("004f70656e54696d657374616d7073000050726f6f6600bf89e2e884e89294", "hex");
  if (!proof.subarray(0, header.length).equals(header) || proof[header.length] !== 0x01 || proof[header.length + 1] !== 0x08 ||
      proof.subarray(header.length + 2, header.length + 34).toString("hex") !== doc.index_sha256) {
    fail(`${file}.ots does not commit to the bytes of ${file}`);
  }
  return JSON.parse(bytes.toString("utf8"));
}

export function derive(sourceBytes, io) {
  const { readJson, readBytes, readText, exists, listDirs } = io;
  const src = JSON.parse(sourceBytes.toString("utf8"));
  const S = src.sources;

  // ---- the frozen manifest
  const manifestBytes = readBytes(S.manifest);
  const manifest = JSON.parse(manifestBytes.toString("utf8"));
  const anchors = manifest.anchors || fail("manifest has no anchors");
  const ids = Object.keys(anchors);
  if (ids.length !== manifest.provisions) fail(`manifest says ${manifest.provisions} provisions, anchors hold ${ids.length}`);
  for (const [k, v] of Object.entries(anchors)) {
    if (!/^3\d{4}[RLD]\d{4}:-?\d+$/.test(k)) fail(`manifest id ${k} is not CELEX:number`);
    if (!/^[0-9a-f]{64}$/.test(v)) fail(`manifest hash for ${k} is not sha256 hex`);
  }
  const root = corpusRoot(anchors);
  if (root !== manifest.corpus_root) fail(`corpus_root does not recompute (${root})`);
  const inv = readInventory(S.inventory, io);
  if (inv.frozen_provisions.corpus_root !== root) fail("inventory corpus_root differs from the manifest");
  if (inv.frozen_provisions.evidence_sha256 !== sha256(manifestBytes)) fail("inventory evidence_sha256 does not pin the manifest bytes");

  const byCelex = new Map();
  for (const k of ids) {
    const [celex, num] = k.split(":");
    if (!byCelex.has(celex)) byCelex.set(celex, []);
    byCelex.get(celex).push(num);
  }
  const instrById = new Map(src.instruments.map((i) => [i.celex, i]));
  for (const c of byCelex.keys()) if (!instrById.has(c)) fail(`manifest instrument ${c} is not named in the source file`);
  for (const i of src.instruments) {
    if (!byCelex.has(i.celex)) fail(`source names ${i.celex}, which the manifest does not hold`);
    const want = inv.frozen_provisions.instruments[i.inventory_name];
    if (want !== byCelex.get(i.celex).length)
      fail(`${i.name}: inventory says ${want}, manifest holds ${byCelex.get(i.celex).length}`);
  }
  const adapters = new Map(inv.authority_adapters.map((a) => [a.id, a]));

  // ---- which provisions anything points to
  const status = new Map(); // provision id -> { predicates, related, crosswalk }
  const touch = (pid) => {
    if (!anchors[pid]) return null;
    if (!status.has(pid)) status.set(pid, { predicates: [], related: [], crosswalk: [] });
    return status.get(pid);
  };
  const unresolved = [];

  for (const p of src.predicates) {
    for (const f of p.code) if (!exists(f)) fail(`predicate ${p.id}: code file ${f} missing`);
    for (const [f, needle] of Object.entries(p.code_must_contain || {}))
      if (!readText(f).includes(needle)) fail(`predicate ${p.id}: ${f} no longer contains "${needle}"`);
    const pid = `${p.celex}:${p.article}`;
    const s = touch(pid) || fail(`predicate ${p.id}: ${pid} is not in the manifest`);
    s.predicates.push(p.id);
  }

  const relatedRows = [];
  for (const rs of src.related_measure_sources) {
    const d = readJson(rs.path);
    if (rs.id === "regulator-crosswalk") {
      for (const [axisKey, ax] of Object.entries(d.axes)) {
        for (const ptr of ax.pointers || []) {
          if (ptr.regulator !== rs.regulator) continue;
          const { articles, unresolved: un } = articlesIn(ptr.obligation);
          for (const u of un) unresolved.push({ source: rs.path, text: ptr.obligation, reference: u });
          for (const a of articles) {
            const pid = `${rs.celex}:${a}`;
            const s = touch(pid);
            if (!s) {
              unresolved.push({ source: rs.path, text: ptr.obligation, reference: `Article ${a}` });
              continue;
            }
            const axis = ax.board_axis || axisKey;
            if (!s.related.some((r) => r.axis === axis && r.source === rs.path))
              s.related.push({ axis, obligation: ptr.obligation, relation: ptr.relation, source: rs.path });
            relatedRows.push(pid);
          }
        }
      }
    } else if (rs.id === "gpai-art12") {
      const arts = d.statutes.filter((s) => s.article).map((s) => s.article);
      for (const a of arts) {
        const pid = `${rs.celex}:${a}`;
        const s = touch(pid) || fail(`${rs.path}: Article ${a} not in the manifest`);
        for (const r of d.related_gspc_axes)
          if (!s.related.some((x) => x.axis === r.axis && x.source === rs.path))
            s.related.push({ axis: r.axis, obligation: `Article ${a}`, relation: r.relation, source: rs.path });
      }
    } else fail(`unknown related_measure source ${rs.id}`);
  }

  const ew = readJson(S.east_west);
  const ewRows = new Map(); // regime -> rows
  for (const j of ew.jurisdictions) ewRows.set(j.regime, j);
  for (const i of src.instruments) {
    if (!i.east_west_regime) continue;
    const j = ewRows.get(i.east_west_regime) || fail(`east-west has no regime ${i.east_west_regime}`);
    for (const row of j.rows) {
      const { articles } = articlesIn(row.ref);
      for (const a of articles) {
        const s = touch(`${i.celex}:${a}`);
        if (s) s.crosswalk.push({ source: S.east_west, ref: row.ref, mapped_to: row.mapped_to });
      }
    }
  }

  const statusOf = (pid) => {
    const s = status.get(pid);
    if (!s) return "HASH_ONLY";
    if (s.predicates.length) return "PREDICATE";
    if (s.related.length) return "RELATED_MEASURE";
    if (s.crosswalk.length) return "CROSSWALK_ONLY";
    return "HASH_ONLY";
  };

  // ---- which files cite a frozen provision id at all (expected: only the manifest)
  const rf = routeFiles(readText(S.app));
  const citing = (file) => (file && exists(file) ? (readText(file).match(PROVISION_ID_RE) || []).length : 0);

  // ---- capsule adapters
  const owasp = readJson(S.owasp);
  const owaspItems = new Map(); // check id -> ["ASI07 (DIRECT)", ...]
  for (const cw of owasp.crosswalks)
    for (const it of cw.items)
      for (const r of it.rows) {
        if (!owaspItems.has(r.check)) owaspItems.set(r.check, []);
        owaspItems.get(r.check).push(`${it.id} ${r.strength}`);
      }
  const carries = new Map(owasp.capsule_adapters.map((a) => [a.adapter, a.carries]));
  const batches = listDirs(S.capsule_root)
    .filter((d) => exists(`${S.capsule_root}/${d}/record.json`))
    .sort();
  const capsuleAdapters = batches.map((d) => {
    const { rec, n, withBinding, bound } = capsuleBindings(`${S.capsule_root}/${d}`, readBytes);
    const carried = carries.get(rec.adapter) ?? [];
    return {
      batch: d,
      adapter: rec.adapter,
      kind: rec.kind,
      capsule_schema: rec.capsule_schema,
      n_capsules: n,
      capsules_binding_a_provision: withBinding,
      provision_ids_bound: bound,
      owasp_checks: carried,
      owasp_items: [...new Set(carried.flatMap((c) => owaspItems.get(c) ?? []))].sort(),
      record: `/${S.capsule_root.replace(/^public\//, "")}/${d}/record.json`,
    };
  });

  // ---- instruments, level by level
  const crosswalkRegs = readJson(S.regulator_crosswalk);
  for (const i of src.instruments)
    if (i.crosswalk_regulator && !crosswalkRegs.regulators.some((r) => r.id === i.crosswalk_regulator))
      fail(`${i.name}: no regulator ${i.crosswalk_regulator} in ${S.regulator_crosswalk}`);
  const instruments = src.instruments.map((i) => {
    const nums = byCelex.get(i.celex);
    const counts = Object.fromEntries(STATUSES.map((s) => [s, 0]));
    for (const n of nums) counts[statusOf(`${i.celex}:${n}`)]++;
    const auth = i.authority_record ? adapters.get(i.authority_record) || fail(`no authority record ${i.authority_record}`) : null;
    let crosswalkRows = 0;
    const crosswalkSources = new Set();
    for (const n of nums) {
      const s = status.get(`${i.celex}:${n}`);
      if (!s) continue;
      crosswalkRows += s.related.length + s.crosswalk.length;
      for (const r of [...s.related, ...s.crosswalk]) crosswalkSources.add(r.source);
    }
    const predicates = src.predicates.filter((p) => p.celex === i.celex);
    return {
      celex: i.celex,
      name: i.name,
      long: i.long,
      jurisdiction: i.jurisdiction,
      source_url: i.source_url,
      provisions: nums.length,
      ids_positive: nums.filter((n) => !n.startsWith("-")).length,
      ids_negative: nums.filter((n) => n.startsWith("-")).length,
      by_status: counts,
      levels: {
        authority: auth
          ? { state: "ROUTING_RECORD", record: auth.id, authority: auth.authority, binding_type: auth.binding_type }
          : { state: "NO_RECORD" },
        instrument: { state: "NAMED", id: `CELEX ${i.celex}` },
        version: {
          state: inv.frozen_provisions.state,
          frozen_at: inv.frozen_provisions.frozen_at,
          source_bytes: inv.frozen_provisions.source_database_state,
        },
        provision: { state: "HASHED", n: nums.length },
        obligation: { state: "NO_REGISTER", n: 0 },
        applicability: auth ? { state: auth.output_mode } : { state: "NO_RECORD" },
        crosswalks: { rows: crosswalkRows, sources: [...crosswalkSources].sort() },
        evidence_requirement: { n: predicates.length },
        test: { predicate: counts.PREDICATE, related_measure: counts.RELATED_MEASURE },
        watcher: { state: manifest.watcher },
      },
      crosswalk_regulator: i.crosswalk_regulator,
    };
  });

  const provisionsTouched = [...status.keys()]
    .sort((a, b) => {
      const [ca, na] = a.split(":");
      const [cb, nb] = b.split(":");
      return ca === cb ? Number(na) - Number(nb) : ca < cb ? -1 : 1;
    })
    .map((pid) => {
      const s = status.get(pid);
      const [celex, num] = pid.split(":");
      return {
        provision_id: pid,
        provision_sha256: anchors[pid],
        instrument: instrById.get(celex).name,
        article: num,
        status: statusOf(pid),
        predicates: s.predicates,
        related_axes: [...new Set(s.related.map((r) => r.axis))].sort(),
        related: s.related,
        crosswalk_rows: s.crosswalk,
      };
    });

  const totals = Object.fromEntries(STATUSES.map((s) => [s, 0]));
  for (const pid of ids) totals[statusOf(pid)]++;

  // ---- jurisdictions
  const invCodes = new Set(inv.authority_adapters.map((a) => a.jurisdiction));
  const seenCodes = new Set();
  const seenRegimes = new Set();
  const jurisdictions = src.jurisdictions.map((j) => {
    for (const c of j.inventory) {
      if (!invCodes.has(c)) fail(`jurisdiction ${j.id}: inventory has no code ${c}`);
      if (seenCodes.has(c)) fail(`inventory code ${c} listed twice`);
      seenCodes.add(c);
    }
    for (const r of j.east_west) {
      if (!ewRows.has(r)) fail(`jurisdiction ${j.id}: east-west has no regime ${r}`);
      seenRegimes.add(r);
    }
    const inst = instruments.filter((i) => i.jurisdiction === j.id);
    const records = inv.authority_adapters.filter((a) => j.inventory.includes(a.jurisdiction));
    const pages = j.routes.map((p) => {
      const r = rf.get(p) || fail(`jurisdiction ${j.id}: App.tsx has no route ${p}`);
      return { path: `${p}/`, component: r.component, cites_frozen_provision_ids: citing(r.file) };
    });
    const provisions = inst.reduce((n, i) => n + i.provisions, 0);
    const predicates = inst.reduce((n, i) => n + i.by_status.PREDICATE, 0);
    const related = inst.reduce((n, i) => n + i.by_status.RELATED_MEASURE, 0);
    const ewr = j.east_west.reduce((n, r) => n + ewRows.get(r).rows.length, 0);
    const state = provisions
      ? "IN_FROZEN_CORPUS"
      : records.length
        ? "ROUTING_RECORD_ONLY"
        : ewr
          ? "CROSSWALK_ROWS_ONLY"
          : pages.length
            ? "PROSE_PAGES_ONLY"
            : "NOTHING_HELD";
    return {
      id: j.id,
      label: j.label,
      state,
      frozen_provisions: provisions,
      instruments_in_corpus: inst.map((i) => i.name),
      predicate_provisions: predicates,
      related_measure_provisions: related,
      authority_records: records.map((a) => ({ id: a.id, binding_type: a.binding_type, output_mode: a.output_mode })),
      east_west_rows: ewr,
      prose_pages: pages,
    };
  });
  for (const c of invCodes) if (!seenCodes.has(c)) fail(`inventory jurisdiction ${c} is not in the jurisdiction list`);
  for (const r of ewRows.keys()) if (!seenRegimes.has(r)) fail(`east-west regime ${r} is not in the jurisdiction list`);

  const frameworks = src.frameworks_outside_corpus.map((f) => {
    const reg = crosswalkRegs.regulators.find((r) => r.id === f.crosswalk_regulator) || fail(`no regulator ${f.crosswalk_regulator}`);
    let pointers = 0;
    const axes = new Set();
    for (const [k, ax] of Object.entries(crosswalkRegs.axes))
      for (const p of ax.pointers || [])
        if (p.regulator === f.crosswalk_regulator) {
          pointers++;
          axes.add(ax.board_axis || k);
        }
    for (const file of f.files) if (!exists(file)) fail(`${f.id}: ${file} missing`);
    if (f.authority_record && !adapters.has(f.authority_record)) fail(`${f.id}: no authority record ${f.authority_record}`);
    return {
      id: f.id,
      name: f.name,
      kind: reg.kind,
      frozen_provisions: 0,
      authority_record: f.authority_record,
      axis_pointers: pointers,
      axes_pointing: [...axes].sort(),
      files: f.files,
      page: f.page,
    };
  });

  const inventoryCounts = inv.counts;
  const recovered = [
    { what: "provision hashes", value: ids.length, derived_from: `${S.manifest} · anchors`, inventory_says: inventoryCounts.frozen_provision_counter },
    { what: "authority-routing records", value: inv.authority_adapters.length, derived_from: `${S.inventory} · authority_adapters.length`, inventory_says: inventoryCounts.regulator_authority_adapters },
    { what: "crosswalk assets", value: inv.crosswalk_assets.length, derived_from: `${S.inventory} · crosswalk_assets.length`, inventory_says: inventoryCounts.crosswalk_assets },
    { what: "instruments with provisions in the manifest", value: byCelex.size, derived_from: `${S.manifest} · distinct CELEX ids`, inventory_says: Object.keys(inv.frozen_provisions.instruments).length },
  ];
  for (const r of recovered) if (r.value !== r.inventory_says) fail(`${r.what}: data holds ${r.value}, inventory counts say ${r.inventory_says}`);

  return {
    schema: "csoai.mechanism-coverage/0.1",
    id: src.id,
    title: src.title,
    url: `https://councilof.ai${src.page}`,
    json: `https://councilof.ai${src.json}`,
    edited: src.edited,
    generated_from: { path: SOURCE, sha256: sha256(sourceBytes), producer: PRODUCER },
    statements: src.statements,
    hierarchy: src.hierarchy,
    corpus: {
      manifest: `/${S.manifest.replace(/^public\//, "")}`,
      manifest_sha256: sha256(manifestBytes),
      corpus_root: root,
      corpus_root_recomputes: true,
      root_algorithm: inv.frozen_provisions.root_algorithm,
      provisions: ids.length,
      instruments: byCelex.size,
      frozen_at: inv.frozen_provisions.frozen_at,
      state: inv.frozen_provisions.state,
      source_database_state: inv.frozen_provisions.source_database_state,
      watcher: manifest.watcher,
      limitation: inv.frozen_provisions.limitation,
    },
    recovered_counts: recovered,
    totals,
    instruments,
    provisions_touched: provisionsTouched,
    unresolved_references: unresolved.filter(
      (u, i) => unresolved.findIndex((x) => x.text === u.text && x.reference === u.reference) === i,
    ),
    jurisdictions,
    frameworks_outside_corpus: frameworks,
    predicates: src.predicates.map(({ code_must_contain, ...p }) => ({ ...p, provision_id: `${p.celex}:${p.article}` })),
    capsule_adapters: capsuleAdapters,
    routes_today: src.routes_today,
    not_open_today: src.not_open_today,
  };
}

export const serialise = (obj) => `${JSON.stringify(obj, null, 2)}\n`;

export function nodeIo(root = ROOT) {
  return {
    readBytes: (p) => readFileSync(join(root, p)),
    readText: (p) => readFileSync(join(root, p), "utf8"),
    readJson: (p) => JSON.parse(readFileSync(join(root, p), "utf8")),
    exists: (p) => existsSync(join(root, p)),
    listDirs: (p) =>
      readdirSync(join(root, p), { withFileTypes: true })
        .filter((d) => d.isDirectory())
        .map((d) => d.name),
  };
}

function main() {
  const out = serialise(derive(readFileSync(join(ROOT, SOURCE)), nodeIo()));
  const target = join(ROOT, OUTPUT);
  if (process.argv.includes("--check")) {
    let have = "";
    try {
      have = readFileSync(target, "utf8");
    } catch {}
    if (have !== out) {
      console.error(`${OUTPUT} is stale: run node ${PRODUCER}`);
      process.exit(1);
    }
    console.log(`${OUTPUT} is current`);
    return;
  }
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, out);
  const d = JSON.parse(out);
  console.log(`${d.corpus.provisions} provisions · ${JSON.stringify(d.totals)}`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) main();
