#!/usr/bin/env node
// Producer for /crosswalks/owasp-asi.json (and, through it, the /crosswalks/owasp-asi/ page).
//
// Input:  scripts/crosswalks/owasp-asi.source.json — the hand-edited mapping, checked in.
// Output: public/crosswalks/owasp-asi.json — the source, validated, with per-item strength and
//         the DIRECT / PARTIAL / NOT_MEASURED counts derived (never typed), and each census check's
//         observed tallies read from the committed record file it names.
//
// The output carries no clock time, so re-running on unchanged inputs gives identical bytes.
//   node scripts/crosswalks/build-owasp-asi.mjs          write
//   node scripts/crosswalks/build-owasp-asi.mjs --check  exit 1 if the committed file is stale
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
export const SOURCE = "scripts/crosswalks/owasp-asi.source.json";
export const OUTPUT = "public/crosswalks/owasp-asi.json";
export const STRENGTHS = ["DIRECT", "PARTIAL"];
const RANK = { DIRECT: 2, PARTIAL: 1 };

const fail = (msg) => {
  throw new Error(`owasp-asi crosswalk: ${msg}`);
};

function sumBy(obj, keyOf) {
  const out = {};
  for (const [k, v] of Object.entries(obj || {})) {
    const key = keyOf(k);
    if (key == null) continue;
    out[key] = (out[key] || 0) + Number(v);
  }
  return out;
}

// Read each census check's tallies from the committed record it names. Only states and counts
// the record itself carries are copied; nothing is computed beyond grouping by state.
export function observe(spec, readJson) {
  const d = readJson(spec.file);
  const base = { source_file: spec.file.replace(/^public/, "") };
  switch (spec.kind) {
    case "effect-binding-probe": {
      const c = d?.third_party?.counts;
      if (!c?.verdict_distribution) fail(`${spec.file}: third_party.counts.verdict_distribution missing`);
      const { denominator, ...verdicts } = c.verdict_distribution;
      return { ...base, as_of: d.as_of, unit: d.n_unit ?? "servers", tried: c.tried, with_verdict: denominator, states: verdicts };
    }
    case "contract-parity": {
      const states = sumBy(d.capsules_by_dimension_state, (k) =>
        k.startsWith(`${spec.dimension}:`) ? k.slice(spec.dimension.length + 1) : null,
      );
      if (!Object.keys(states).length) fail(`${spec.file}: no capsules for dimension ${spec.dimension}`);
      const n = Object.values(states).reduce((a, b) => a + b, 0);
      return { ...base, as_of: d.as_of, unit: "endpoint capsules", n, states };
    }
    case "a2a-card": {
      const states = sumBy(d.capsules_by_rule_state, (k) => k.split(":").pop());
      return {
        ...base,
        as_of: d.as_of,
        unit: "signed agent cards",
        n: d.n_capsules,
        states,
        served_unsigned_not_verified: d.served_unsigned_not_capsuled,
      };
    }
    case "tool-drift": {
      const states = d.capsules_by_state || d.states;
      return { ...base, as_of: d.as_of, unit: "MCP endpoints", n: d.n_capsules, states };
    }
    case "x402-doors": {
      const p = d.payload || {};
      return {
        ...base,
        as_of: d.as_of,
        unit: "own payment doors",
        n: p.n_doors,
        states: { PROBED_CONFORMANT: p.probed_conformant, MISMATCH: p.discovered_mismatch, UNCHECKABLE: p.uncheckable },
      };
    }
    default:
      fail(`unknown observed_from kind ${spec.kind}`);
  }
}

export function derive(sourceBytes, readJson) {
  const src = JSON.parse(sourceBytes.toString("utf8"));
  const checks = new Map();
  for (const c of src.checks) {
    if (checks.has(c.id)) fail(`duplicate check ${c.id}`);
    checks.set(c.id, c);
  }
  const refs = new Map(src.references.map((r) => [r.id, r]));
  const used = new Set();

  const crosswalks = src.crosswalks.map((cw) => {
    const ref = refs.get(cw.reference) || fail(`unknown reference ${cw.reference}`);
    const want = ref.items.map((i) => i.id);
    const got = cw.items.map((i) => i.id);
    if (new Set(want).size !== want.length) fail(`${ref.id}: duplicate item ids in the reference list`);
    if (JSON.stringify(want) !== JSON.stringify(got))
      fail(`${ref.id}: mapped ids ${got.join(",")} do not match the reference list ${want.join(",")}`);
    const counts = { DIRECT: 0, PARTIAL: 0, NOT_MEASURED: 0 };
    const items = cw.items.map((it, i) => {
      const rows = it.rows.map((r) => {
        const c = checks.get(r.check) || fail(`${it.id}: unknown check ${r.check}`);
        if (!STRENGTHS.includes(r.strength)) fail(`${it.id}/${r.check}: strength ${r.strength} not in ${STRENGTHS}`);
        if (!r.rationale?.trim()) fail(`${it.id}/${r.check}: empty rationale`);
        used.add(r.check);
        return { check: r.check, check_name: c.name, strength: r.strength, rationale: r.rationale, live: c.live };
      });
      if (!rows.length && !it.note?.trim()) fail(`${it.id}: NOT_MEASURED item needs a note saying why`);
      const strength = rows.length
        ? rows.reduce((best, r) => (RANK[r.strength] > RANK[best] ? r.strength : best), "PARTIAL")
        : "NOT_MEASURED";
      counts[strength] += 1;
      return { id: it.id, title: ref.items[i].title, strength, rows, ...(it.note ? { note: it.note } : {}) };
    });
    return { reference: ref.id, reference_title: ref.title, counts, items };
  });

  for (const u of src.unmapped) {
    if (u.check) {
      if (!checks.has(u.check)) fail(`unmapped: unknown check ${u.check}`);
      if (used.has(u.check)) fail(`unmapped: ${u.check} is also mapped`);
      used.add(u.check);
    }
  }
  for (const id of checks.keys()) if (!used.has(id)) fail(`check ${id} is neither mapped nor listed as unmapped`);

  const outChecks = src.checks.map((c) => ({
    ...c,
    observed_from: undefined,
    ...(c.observed_from ? { observed: observe(c.observed_from, readJson) } : {}),
  }));

  return {
    schema: "csoai.crosswalk/0.1",
    id: src.id,
    title: src.title,
    url: `https://councilof.ai${src.page}`,
    json: `https://councilof.ai${src.json}`,
    edited: src.edited,
    generated_from: {
      path: SOURCE,
      sha256: createHash("sha256").update(sourceBytes).digest("hex"),
      producer: "scripts/crosswalks/build-owasp-asi.mjs",
    },
    licence: {
      this_file:
        "CC BY-SA 4.0 for CSOAI's mapping, strengths and rationale. The OWASP IDs and titles keep their own licences, given in references[].licence.",
      not_endorsed: "Not reviewed or endorsed by OWASP.",
    },
    statements: src.statements,
    strength_scale: src.strength_scale,
    item_strength_rule: src.item_strength_rule,
    live_check_rule: src.live_check_rule,
    references: src.references,
    crosswalks,
    checks: JSON.parse(JSON.stringify(outChecks)),
    unmapped: src.unmapped,
    capsule_adapters: src.capsule_adapters,
    prior_art: src.prior_art,
  };
}

export const serialise = (obj) => `${JSON.stringify(obj, null, 2)}\n`;

function main() {
  const readJson = (p) => JSON.parse(readFileSync(join(ROOT, p), "utf8"));
  const out = serialise(derive(readFileSync(join(ROOT, SOURCE)), readJson));
  const target = join(ROOT, OUTPUT);
  if (process.argv.includes("--check")) {
    let have = "";
    try {
      have = readFileSync(target, "utf8");
    } catch {}
    if (have !== out) {
      console.error(`${OUTPUT} is stale: run node scripts/crosswalks/build-owasp-asi.mjs`);
      process.exit(1);
    }
    console.log(`${OUTPUT} is current`);
    return;
  }
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, out);
  const d = JSON.parse(out);
  for (const cw of d.crosswalks) console.log(`${cw.reference}: ${JSON.stringify(cw.counts)}`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) main();
