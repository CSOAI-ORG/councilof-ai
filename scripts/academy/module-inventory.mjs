#!/usr/bin/env node
// SPDX-License-Identifier: CC0-1.0
/**
 * module-inventory.mjs — every learning module in the councilof-ai client, where it is served,
 * which reproducible exercise (if any) realises it, and what in its copy needs attention.
 *
 *   node scripts/academy/module-inventory.mjs            # write council-os/academy/module-inventory.json
 *   node scripts/academy/module-inventory.mjs --check    # exit 1 if the committed file is stale
 *
 * It reads source files only (no network, no build). "Served" is read from the route table in
 * client/src/App.tsx, so it says what the app would render, not what the edge answered on a
 * given day; the live check is the exercise runner (public/academy/exercises/run-exercises.mjs).
 *
 * Findings are flags for a human, never automatic edits:
 *   typed_count  — a number typed into copy next to a counted noun (axes, cards, provisions…);
 *                  a count that belongs to a live surface must be read from it, not typed.
 *   price        — a currency amount, fee or pricing field (public prices are not offered).
 *   certificate  — "certificate/certified/certification" wording. Negations ("certifies
 *                  nothing") are recorded as negated:true; they are disclosure, not an offer.
 *   boundary     — a product name that belongs to another estate (MEOK), which these
 *                  measurement surfaces do not host.
 */
import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const OUT = join(ROOT, "council-os/academy/module-inventory.json");
const SCHEMA = "csoai.academy-module-inventory/0.1";

const read = (p) => readFileSync(join(ROOT, p), "utf8");
const sha = (s) => createHash("sha256").update(s).digest("hex");
const lineOf = (text, idx) => text.slice(0, idx).split("\n").length;

const FINDING_RULES = [
  { kind: "typed_count", re: /\b\d{1,3}(?:,\d{3})*\s+(?:canonical\s+)?(?:axes|axis|slots|cards|provisions|articles|trust controls|measured|modules|courses|lessons|agents)\b/gi },
  // A currency amount followed by million/billion is a statutory fine in regulatory copy, not a price.
  { kind: "price", re: /(?:[$€£]\s?\d[\d,.]*(?!\d|[\d,.]*\s*(?:million|billion|bn|m\b)))|\bexamFee\b|\bpricing\b|\boneTime\b|\bthreeMonth\b|\bpayment\b/gi },
  { kind: "certificate", re: /\bcertif(?:y|ied|ies|icate|icates|ication|ications)\b/gi },
  { kind: "boundary", re: /\bMEOK\b/g },
];
const NEGATION = /\b(?:not|never|no|nothing|withdrawn|retired|legacy|nor)\b[^.]{0,60}$/i;

function findings(text) {
  const out = [];
  for (const { kind, re } of FINDING_RULES) {
    re.lastIndex = 0;
    let m;
    while ((m = re.exec(text)) !== null) {
      const line = lineOf(text, m.index);
      const lineText = text.split("\n")[line - 1].trim();
      const before = text.slice(Math.max(0, m.index - 80), m.index);
      const after = text.slice(m.index, m.index + m[0].length + 40);
      const row = { kind, line, match: m[0], context: lineText.length > 160 ? lineText.slice(0, 157) + "…" : lineText };
      if (kind === "certificate") row.negated = NEGATION.test(before) || /\bnothing\b/i.test(after);
      out.push(row);
    }
  }
  return out.sort((a, b) => a.line - b.line || a.kind.localeCompare(b.kind));
}

function summarise(list) {
  const s = {};
  for (const f of list) {
    const key = f.kind === "certificate" && f.negated ? "certificate_negated" : f.kind;
    s[key] = (s[key] || 0) + 1;
  }
  return s;
}

// ---------------------------------------------------------------- the route table

const APP = read("client/src/App.tsx");
const lazyComponent = new Map(); // component name -> page file stem
for (const m of APP.matchAll(/const (\w+) = lazy\(\(\) => import\("\.\/pages\/([\w/]+)"\)\)/g)) lazyComponent.set(m[1], m[2]);
function routeFor(path) {
  const m = APP.match(new RegExp(`<Route path="${path.replace(/[/:]/g, (c) => "\\" + c)}"(?: component=\\{(\\w+)\\}|>)`));
  return m ? (m[1] || "(inline)") : null;
}
function consumers(stem) {
  // Files under client/src whose import specifiers resolve to client/src/data/<stem> (tests excluded).
  const hits = [];
  const walk = (dir) => {
    for (const e of readdirSync(join(ROOT, dir), { withFileTypes: true })) {
      const p = `${dir}/${e.name}`;
      if (e.isDirectory()) walk(p);
      else if (/\.(tsx?|mjs)$/.test(e.name) && !/\.test\./.test(e.name)) {
        const specs = [...read(p).matchAll(/(?:\bfrom\s+|\bimport\s*\(\s*)["']([^"']+)["']/g)].map((m) => m[1]);
        const inData = dir === "client/src/data";
        if (specs.some((s) => s === `@/data/${stem}` || s.endsWith(`/data/${stem}`) || (inData && s === `./${stem}`))) hits.push(p);
      }
    }
  };
  walk("client/src");
  return hits.filter((p) => !p.endsWith(`data/${stem}.ts`)).sort();
}

// ---------------------------------------------------------------- the exercises (the realisation map)

const runner = await import(pathToFileURL(join(ROOT, "public/academy/exercises/run-exercises.mjs")).href);
const EXERCISES = runner.exerciseMetadata();
const exercisesFor = (id) => EXERCISES.filter((e) => e.realises.includes(id)).map((e) => e.id);

// ---------------------------------------------------------------- surfaces

const surfaces = [];
const sources = new Set();

// A. /learn tracks (client/src/pages/Academy.tsx)
{
  const file = "client/src/pages/Academy.tsx";
  const text = read(file); sources.add(file);
  const component = routeFor("/learn");
  const blocks = [...text.matchAll(/\{ id: "([\w-]+)", name: "([^"]+)", level: "([^"]+)", mins: (\d+)[\s\S]*?\]\s*\}/g)];
  surfaces.push({
    surface: "learn-tracks", file, routes: ["/learn", "/tracks"], component, served: component === "Academy",
    modules: blocks.map((b) => ({
      id: `learn/${b[1]}`, title: b[2], level: b[3], stated_minutes: Number(b[4]),
      steps: [...b[0].matchAll(/\{ t: "([^"]+)", href: ([^}]+?) \}/g)].map((s) => ({ title: s[1], href: s[2].trim() })),
      exercises: exercisesFor(`learn/${b[1]}`),
      findings: findings(b[0]).map((f) => ({ ...f, line: f.line + lineOf(text, b.index) - 1 })),
    })),
  });
}

// B. /academy paths (client/src/pages/CouncilAcademy.tsx)
{
  const file = "client/src/pages/CouncilAcademy.tsx";
  const text = read(file); sources.add(file);
  const component = routeFor("/academy");
  const blocks = [...text.matchAll(/\{ n: (\d+), title: "([^"]+)"[\s\S]*?modules: \[([\s\S]*?)\] \}/g)];
  surfaces.push({
    surface: "academy-paths", file, routes: ["/academy"], component, served: component === "CouncilAcademy",
    modules: blocks.map((b) => {
      const id = `academy/${b[2].toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`;
      return {
        id, title: b[2], position: Number(b[1]),
        steps: [...b[3].matchAll(/\{ name: "([^"]+)", href: "([^"]+)" \}/g)].map((s) => ({ title: s[1], href: s[2] })),
        exercises: exercisesFor(id),
        findings: findings(b[0]).map((f) => ({ ...f, line: f.line + lineOf(text, b.index) - 1 })),
      };
    }),
    page_findings: findings(text).filter((f) => !blocks.some((b) => f.line >= lineOf(text, b.index) && f.line <= lineOf(text, b.index + b[0].length))),
  });
}

// C. Dashboard learning arena (client/src/data/gspc-learning-paths.ts → DashboardLearningPane)
{
  const file = "client/src/data/gspc-learning-paths.ts";
  const text = read(file); sources.add(file);
  const snapRel = text.match(/import BOARD_SNAPSHOT from "\.\.\/\.\.\/\.\.\/(public\/signed\/[\w.-]+\.json)"/)?.[1] ?? null;
  const snapshot = snapRel && existsSync(join(ROOT, snapRel)) ? JSON.parse(read(snapRel)) : null;
  const statusRel = snapRel ? snapRel.replace(/\.signed\.json$/, ".status.json") : null;
  const status = statusRel && existsSync(join(ROOT, statusRel)) ? JSON.parse(read(statusRel)) : null;
  const pane = "client/src/components/DashboardLearningPane.tsx"; sources.add(pane);
  surfaces.push({
    surface: "dashboard-learning-arena", file, routes: ["/dashboard?tab=learn", "/widget"], component: "DashboardLearningPane", served: true,
    snapshot: snapRel ? { file: snapRel, axes: snapshot?.axes?.length ?? null, status_file: statusRel, status_state: status?.state ?? "NO_STATUS_FILE", current: status?.current ?? null } : null,
    live_roster: /\/api\/gspc/.test(read(pane)) ? "the pane reads GET /api/gspc and builds one path per live axis; the snapshot is the fallback" : "NONE — the path count is the snapshot's",
    modules: [{ id: "dashboard/learn", title: "One practice path per board axis (learn · play · explain · propose fix · human review)", exercises: exercisesFor("dashboard/learn"), findings: findings(read(pane)) }],
  });
}

// D. Regulatory course modules (client/src/data/modules/*.ts) — quiz banks
{
  const dir = "client/src/data/modules";
  const files = readdirSync(join(ROOT, dir)).filter((f) => f.endsWith(".ts")).sort();
  const learnRoute = routeFor("/courses/:id/learn");
  const freeRoute = routeFor("/free-course/:courseId");
  const quizConsumers = consumers("quizzes");
  surfaces.push({
    surface: "regulatory-course-modules", file: dir, routes: ["/courses/:id/learn", "/free-course/:courseId"],
    component: `${learnRoute} / ${freeRoute}`, served: learnRoute !== "ContentReviewNotice" || freeRoute !== "ContentReviewNotice" ? "CHECK" : false,
    reachability: `Imported only through client/src/data/quizzes (consumers: ${quizConsumers.join(", ") || "none"}); both player routes render ContentReviewNotice, so no module copy is served.`,
    modules: files.map((f) => {
      const p = `${dir}/${f}`; const text = read(p); sources.add(p);
      const m = f.match(/^(.*)-module-(\d+)\.ts$/);
      return { id: `regulatory/${f.replace(/\.ts$/, "")}`, framework: m?.[1] ?? f, module: m ? Number(m[2]) : null, questions: (text.match(/\bquestion:/g) || []).length, exercises: [], state: "CONTENT_REVIEW — quiz bank, not served; a quiz is not a reproduced measurement", findings: findings(text) };
    }),
  });
}

// E. Other course data (courses, curriculum, widget courses, quizzes index)
{
  const rows = [];
  for (const stem of ["courses", "gspc-curriculum", "widget-courses", "quizzes"]) {
    const file = `client/src/data/${stem}.ts`;
    if (!existsSync(join(ROOT, file))) continue;
    const text = read(file); sources.add(file);
    const used = consumers(stem);
    const routedPages = used.filter((p) => p.startsWith("client/src/pages/")).map((p) => p.replace(/^client\/src\/pages\/|\.tsx$/g, "")).filter((stemName) => [...lazyComponent.values()].includes(stemName));
    rows.push({ id: `data/${stem}`, file, consumers: used, routed_consumer_pages: routedPages, exercises: [], findings: findings(text) });
  }
  surfaces.push({ surface: "course-data", file: "client/src/data", routes: [], component: null, served: "SEE_CONSUMERS", modules: rows });
}

// ---------------------------------------------------------------- the document

const all = surfaces.flatMap((s) => s.modules);
const flat = all.flatMap((m) => m.findings).concat(surfaces.flatMap((s) => s.page_findings || []));
const doc = {
  schema: SCHEMA,
  what: "Every learning module in the councilof-ai client, where it is served, which reproducible exercise realises it, and flags in its copy. Generated from source; flags are for a human to act on, never automatic edits.",
  generator: "scripts/academy/module-inventory.mjs",
  exercises_source: "public/academy/exercises/run-exercises.mjs",
  completion_rule: "A module is complete only through an exercise whose state is REPRODUCED (your result's sha256 equals the published result's sha256 and the negative control fails). Modules with no exercise are reading or practice; finishing them completes nothing.",
  totals: {
    surfaces: surfaces.length,
    modules: all.length,
    modules_with_exercise: all.filter((m) => m.exercises.length).length,
    exercises: EXERCISES.length,
    findings: summarise(flat),
  },
  exercises: EXERCISES.map((e) => ({ id: e.id, title: e.title, realises: e.realises })),
  surfaces,
  sources: [...sources].sort().map((p) => ({ path: p, sha256: sha(read(p)) })),
};
const text = JSON.stringify(doc, null, 2) + "\n";

if (process.argv.includes("--check")) {
  const current = existsSync(OUT) ? readFileSync(OUT, "utf8") : "";
  if (current !== text) {
    console.error(`✖ ${relative(ROOT, OUT)} is stale — run: node scripts/academy/module-inventory.mjs`);
    process.exit(1);
  }
  console.log(`✓ ${relative(ROOT, OUT)} matches its sources (${all.length} modules, ${EXERCISES.length} exercises)`);
} else {
  mkdirSync(dirname(OUT), { recursive: true });
  writeFileSync(OUT, text);
  console.log(`wrote ${relative(ROOT, OUT)}: ${surfaces.length} surfaces, ${all.length} modules, ${doc.totals.modules_with_exercise} with an exercise; findings ${JSON.stringify(doc.totals.findings)}`);
}
