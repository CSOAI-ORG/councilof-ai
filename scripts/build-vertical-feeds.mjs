#!/usr/bin/env node
/**
 * build-vertical-feeds.mjs — the Layer-0 join: consume all we measure, emit the feed family.
 *
 * CONSUMES (real artifacts on disk):
 *   public/signed/cards/*.json                    — 335+ signed measurement cards (Ed25519, hash-chained via prev)
 *   public/signed/card-matrix.json                — board MEASURED state per axis
 *   tui3-crosswalk/regulatory-crosswalk-*.json    — frameworks → provisions → gspc_axes
 *   public/regulatory-clock.json                  — dated obligations (deadlines, confidence)
 *   public/spec/claim-maintenance/register.json   — corrections ledger
 *   scripts/verticals.json                        — industry → axes definitions
 *
 * EMITS (public/feeds/ — the consumable endpoints for MCPs, sites, AI platforms):
 *   feeds/index.json                — master directory of every feed
 *   feeds/axis/<axis>.json          — per-axis: models, card count, MEASURED state
 *   feeds/model/<slug>.json         — per-model: every card across axes (variation tracking surface)
 *   feeds/regulator/<id>.json       — per-framework: provisions, mapped axes, evidence coverage, deadlines
 *   feeds/industry/<vertical>.json  — per-vertical: axes, deadlines, packs, audience feeds
 *
 * Deterministic: sorted keys, stable ordering, no clocks in output (as_of only).
 * Honest: absences are stated (UNMEASURED / UNMAPPED), never padded.
 * Ruling-safe: no prices, no tiers, no payment-processor names (owner ruling 2026-09-06).
 *
 * Usage:
 *   node scripts/build-vertical-feeds.mjs           # write the feed family
 *   node scripts/build-vertical-feeds.mjs --check   # CI: feeds must match a rerun
 */
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const CHECK = process.argv.includes("--check");
const CARDS_DIR = join(ROOT, "public/signed/cards");
const FEEDS = join(ROOT, "public/feeds");
const AS_OF_FLAG = flag("as-of");

function flag(name) {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 ? process.argv[i + 1] : null;
}
const sha256 = (s) => createHash("sha256").update(s, "utf8").digest("hex");
const canonical = (o) => JSON.stringify(o, null, 1) + "\n";
const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60);
const loadJson = (p) => (existsSync(p) ? JSON.parse(readFileSync(p, "utf8")) : null);

// ---- consume Layer 0 ------------------------------------------------------
const cards = [];
for (const f of readdirSync(CARDS_DIR).filter((f) => f.endsWith(".json")).sort()) {
  try {
    const c = JSON.parse(readFileSync(join(CARDS_DIR, f), "utf8"));
    const b = c.body ?? {};
    cards.push({
      id: c.id,
      file: `signed/cards/${f}`,
      axis: b.axis ?? null,
      model: b.model ?? null,
      kind: b.kind ?? null,
      accuracy: typeof b.accuracy === "number" ? b.accuracy : null,
      created: b.created ?? null,
      issuer: b.issuer ?? null,
      prev: c.prev ?? null,
      sig: c.signature ? sha256(c.signature).slice(0, 16) : null,
    });
  } catch { /* skip unreadable card */ }
}
cards.sort((a, b) => (a.id < b.id ? -1 : 1));

const matrix = loadJson(join(ROOT, "public/signed/card-matrix.json"));
const board = {};
for (const cell of matrix?.cells ?? []) {
  const axis = (cell.axis ?? "").replace(/^gspc-/, "");
  board[axis] = board[axis] === "MEASURED" || cell.card ? "MEASURED" : board[axis] ?? "UNMEASURED";
}

const crosswalkFiles = existsSync(join(ROOT, "tui3-crosswalk"))
  ? readdirSync(join(ROOT, "tui3-crosswalk")).filter((f) => f.startsWith("regulatory-crosswalk-") && f.endsWith(".json")).sort()
  : [];
const crosswalk = loadJson(join(ROOT, "tui3-crosswalk", crosswalkFiles[crosswalkFiles.length - 1] ?? "")) ?? {};
const clock = loadJson(join(ROOT, "public/regulatory-clock.json")) ?? {};
const verticals = loadJson(join(ROOT, "scripts/verticals.json")) ?? { verticals: [] };

const AS_OF = AS_OF_FLAG ?? ((matrix?.as_of ?? clock?.generated ?? null) || null);

// ---- AXIS feeds -----------------------------------------------------------
const byAxis = new Map();
for (const c of cards) {
  if (!c.axis) continue;
  const ax = c.axis.replace(/^gspc-/, "");
  if (!byAxis.has(ax)) byAxis.set(ax, []);
  byAxis.get(ax).push(c);
}
const axisFeeds = new Map();
for (const [ax, list] of [...byAxis.entries()].sort()) {
  const models = [...new Set(list.map((c) => c.model).filter(Boolean))].sort();
  const body = {
    schema: "csoai.feed.axis/0.1",
    feed: `axis/${ax}`,
    as_of: AS_OF,
    axis: ax,
    board_state: board[ax] ?? "UNMEASURED",
    cards: list.length,
    models,
    measurements: list.map((c) => ({ id: c.id, model: c.model, accuracy: c.accuracy, created: c.created, file: c.file })),
    verify: "https://councilof.ai/gspc-verify/",
  };
  axisFeeds.set(`axis/${ax}.json`, body);
}

// ---- MODEL feeds (variation tracking surface) -----------------------------
const byModel = new Map();
for (const c of cards) {
  if (!c.model) continue;
  const key = slug(c.model);
  if (!byModel.has(key)) byModel.set(key, { model: c.model, cards: [] });
  byModel.get(key).cards.push(c);
}
const modelFeeds = new Map();
for (const [key, entry] of [...byModel.entries()].sort()) {
  const axesCovered = [...new Set(entry.cards.map((c) => (c.axis ?? "").replace(/^gspc-/, "")))].sort();
  modelFeeds.set(`model/${key}.json`, {
    schema: "csoai.feed.model/0.1",
    feed: `model/${key}`,
    as_of: AS_OF,
    model: entry.model,
    cards: entry.cards.length,
    axes_covered: axesCovered,
    variation_note: "same-fixture runs across this model's variations live here; deltas between models are the variation evidence",
    measurements: entry.cards.map((c) => ({ id: c.id, axis: (c.axis ?? "").replace(/^gspc-/, ""), accuracy: c.accuracy, created: c.created })),
    verify: "https://councilof.ai/gspc-verify/",
  });
}

// ---- REGULATOR feeds (from crosswalk + clock) ------------------------------
const regulatorFeeds = new Map();
for (const f of crosswalk?.frameworks ?? []) {
  const rid = slug(f.short_name ?? f.instrument ?? "unknown");
  const axes = [];
  const provisions = [];
  for (const p of f.provisions ?? []) {
    provisions.push({ id: p.id, title: p.title, effective: p.effective ?? null, status: p.status ?? null });
    for (const ax of p.gspc_axes ?? []) if (!axes.includes(ax)) axes.push(ax);
  }
  const axisStates = axes.map((ax) => ({ axis: ax, board: board[ax] ?? "UNMEASURED" }));
  const measured = axisStates.filter((a) => a.board === "MEASURED").length;
  const deadlines = (clock.events ?? [])
    .filter((e) => (f.instrument && (e.instrument ?? "").toLowerCase().includes((f.short_name ?? "").toLowerCase())) || (f.jurisdiction && e.jur === f.jurisdiction))
    .map((e) => ({ date: e.date, instrument: e.instrument, provision: e.provision, confidence: e.confidence, days_note: "see regulatory-clock.json" }))
    .slice(0, 6);
  regulatorFeeds.set(`regulator/${rid}.json`, {
    schema: "csoai.feed.regulator/0.1",
    feed: `regulator/${rid}`,
    as_of: AS_OF,
    instrument: f.instrument ?? null,
    short_name: f.short_name ?? null,
    jurisdiction: f.jurisdiction ?? null,
    legal_status: f.legal_status ?? null,
    source_url: f.source_url ?? null,
    provisions: provisions.length,
    provision_detail: provisions,
    gspc_axes: axisStates,
    evidence_coverage: axes.length ? `${measured}/${axes.length} MEASURED` : "UNMAPPED",
    upcoming_deadlines: deadlines,
    disclaimer: "source join only — never a legal or measurement assessment",
  });
}

// ---- INDUSTRY feeds (verticals.json × axes × clock) ------------------------
const industryFeeds = new Map();
for (const v of verticals.verticals ?? []) {
  const axisStates = v.axes.map((ax) => ({ axis: ax, board: board[ax] ?? "UNMEASURED" }));
  const measured = axisStates.filter((a) => a.board === "MEASURED").length;
  const relevantDeadlines = (clock.events ?? [])
    .filter((e) => {
      const du = Math.round((new Date(e.date + "T00:00:00Z") - new Date()) / 86400000);
      return du >= 0 && du <= 120;
    })
    .slice(0, 4)
    .map((e) => ({ date: e.date, instrument: e.instrument, binds: e.binds, confidence: e.confidence }));
  industryFeeds.set(`industry/${v.id}.json`, {
    schema: "csoai.feed.industry/0.1",
    feed: `industry/${v.id}`,
    as_of: AS_OF,
    vertical: v.name,
    audiences: v.audiences ?? [],
    axes: axisStates,
    evidence_coverage: `${measured}/${v.axes.length} MEASURED`,
    relevant_deadlines: relevantDeadlines,
    free_verification: "https://councilof.ai/gspc-verify/",
    note: "verification is free forever; this feed carries no commercial terms",
  });
}

// ---- master index ----------------------------------------------------------
const index = {
  schema: "csoai.feeds.index/0.1",
  as_of: AS_OF,
  description: "Layer-0 join feeds: consume all we measure, per axis / model / regulator / industry.",
  counts: {
    axis: axisFeeds.size,
    model: modelFeeds.size,
    regulator: regulatorFeeds.size,
    industry: industryFeeds.size,
  },
  feeds: {
    axis: [...axisFeeds.keys()].sort(),
    model: [...modelFeeds.keys()].sort(),
    regulator: [...regulatorFeeds.keys()].sort(),
    industry: [...industryFeeds.keys()].sort(),
  },
  base_url: "https://councilof.ai/feeds/",
  free_note: "every feed is free and cites signed, verifiable bytes; verification is free forever",
};

const all = new Map([...axisFeeds, ...modelFeeds, ...regulatorFeeds, ...industryFeeds]);
all.set("index.json", index);


// ---- brand hygiene: internal codenames never reach a public surface (owner rule, brand-gate parity)
const CODENAME = /\bsovos\b|\bsov3\d*(?:-[a-z0-9-]+)?\b|\bdorado\b|\bcibola\b|\bventuri|\bpontius|\blaputa/gi;
function scrub(v) {
  if (typeof v === "string") return v.replace(CODENAME, "[internal-ref]");
  if (Array.isArray(v)) return v.map(scrub);
  if (v && typeof v === "object") return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, scrub(x)]));
  return v;
}

// ---- write / check ---------------------------------------------------------

let mismatch = 0;
for (const [rel, rawBody] of [...all.entries()].sort()) {
  const p = join(FEEDS, rel);
  const bytes = canonical(scrub(rawBody));
  if (CHECK) {
    const cur = existsSync(p) ? readFileSync(p, "utf8") : null;
    if (cur !== bytes) { console.error(`✗ stale: ${rel}`); mismatch++; }
  } else {
    mkdirSync(dirname(p), { recursive: true });
    writeFileSync(p, bytes);
  }
}
if (CHECK) {
  if (mismatch) { console.error(`✗ vertical-feeds --check: ${mismatch} stale file(s) — run node scripts/build-vertical-feeds.mjs`); process.exit(1); }
  console.log(`✓ vertical-feeds --check: ${all.size} feeds current (axis=${axisFeeds.size} model=${modelFeeds.size} regulator=${regulatorFeeds.size} industry=${industryFeeds.size})`);
} else {
  console.log(`✓ vertical-feeds: wrote ${all.size} feeds (axis=${axisFeeds.size} model=${modelFeeds.size} regulator=${regulatorFeeds.size} industry=${industryFeeds.size})`);
}
