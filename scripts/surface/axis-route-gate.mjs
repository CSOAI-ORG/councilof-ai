#!/usr/bin/env node
/**
 * axis-route-gate.mjs — every axis link on a published page must point at a page that exists.
 *
 * WHY. On 2026-11-06 the homepage's board rows linked every axis to
 * `/gspc/<axis>/`. That route is prerendered, and the prerender list was a
 * hand-typed subset of the board. Nine measured-subject axes were on the board,
 * on the homepage, and absent from that list — so nine links from the primary
 * landing page returned HTTP 404, and the working-groups registry broke twenty
 * more. The pages for those axes were published the whole time, at
 * `/axis/<axis>/`, canonical to themselves. Nothing linked to them.
 *
 * The class of defect is "the board grew and a typed list did not". This gate
 * closes it from both ends:
 *
 *   1. ROUTE COVERAGE. Every axis the board serves has exactly one published
 *      route, and that route is the one the link builders derive. A model
 *      comparison axis must be in the prerender list; every other published
 *      axis must have its page in public/axis/. An owner-held axis must have
 *      neither.
 *   2. LINK INTEGRITY. Every href in every published HTML file that points at
 *      an axis route must resolve to a page this build publishes.
 *
 * It reads public/interop/axis-routes.json — the map the axis-page generator
 * publishes from the same payload it rendered the pages from — so it cannot
 * disagree with the pages it checks.
 *
 *   node scripts/surface/axis-route-gate.mjs              # gate the tree
 *   node scripts/surface/axis-route-gate.mjs --selftest   # prove it goes red
 */
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const OWNER_GATED = "HIDDEN_PENDING_OWNER_GO";

/** The route an axis links to, by the board's own kind. One rule, shared with
 *  client/src/lib/axisHref.ts — if the two ever disagree, the gate says so. */
export function routeFor(row) {
  if (!row || typeof row.axis !== "string" || !row.axis) return null;
  if (row.public_pages === OWNER_GATED) return null;
  return row.kind === "model-comparison" ? `/gspc/${row.axis}/` : `/axis/${row.axis}/`;
}

/** The prerender list, read from the source that owns it. */
export function prerenderGspcRoutes(source) {
  const out = new Set();
  for (const m of source.matchAll(/"\/gspc\/([a-z0-9-]+)"/g)) out.add(`/gspc/${m[1]}/`);
  return out;
}

/**
 * THE SOURCE LINT. A route built as a template literal in a component is a
 * route nobody checks: the board grows an axis and the component keeps sending
 * readers to a page that does not exist. The rule belongs in one file —
 * client/src/lib/axisHref.ts — and a component that builds the path itself is
 * the defect recurring.
 *
 * So the gate reads the client source and fails when a template-literal axis
 * route appears anywhere but the helper. This is the rule that would have
 * caught the original nine, before they shipped.
 */
export function lintAxisRouteSource(files) {
  const findings = [];
  const ALLOWED = "client/src/lib/axisHref.ts";
  for (const file of files) {
    const rel = relative(ROOT, file);
    if (rel === ALLOWED) continue;
    const src = readFileSync(file, "utf8");
    src.split("\n").forEach((line, i) => {
      // The literal path in front of the first ${ IS the route prefix.
      for (const m of line.matchAll(/`(\/[^`]*?)\$\{/g)) {
        const prefix = m[1];
        // An API route is not a page route: /api/gspc/axis/<id> is a record
        // endpoint, and the axis page it names is a different thing.
        if (prefix.startsWith("/api/")) continue;
        if (!/\/(gspc|axis)$/.test(prefix)) continue;
        findings.push(
          `${rel}:${i + 1}: the axis route ${prefix}\${…} is built here — use axisHref() from client/src/lib/axisHref.ts`,
        );
      }
    });
  }
  return findings;
}

function htmlFiles(dir, acc = []) {
  if (!existsSync(dir)) return acc;
  for (const name of readdirSync(dir)) {
    if (name === "node_modules" || name === ".git") continue;
    const p = join(dir, name);
    let st;
    try {
      st = statSync(p);
    } catch {
      continue;
    }
    if (st.isDirectory()) htmlFiles(p, acc);
    else if (name.endsWith(".html")) acc.push(p);
  }
  return acc;
}

/** Does the build publish this route? */
export function routePublished(route, publicDir, prerendered) {
  if (!route) return false;
  if (route.startsWith("/gspc/")) {
    const slug = route.slice("/gspc/".length).replace(/\/$/, "");
    // Either the prerendered page is already on disk (a built tree), or the
    // prerender list says it will be (a pre-build tree). Both are true
    // statements about what will be published.
    if (existsSync(join(publicDir, "gspc", slug, "index.html"))) return true;
    return prerendered.has(route);
  }
  if (route.startsWith("/axis/")) {
    const slug = route.slice("/axis/".length).replace(/\/$/, "");
    return existsSync(join(publicDir, "axis", `${slug}.html`));
  }
  return false;
}

/**
 * The gate. Returns { ok, findings }.
 *
 * `publicDir` holds the pages; `prerendered` is the set of /gspc/ routes the
 * prerender will publish.
 */
export function gate({ rows, publicDir, prerendered, htmlFiles: files }) {
  const findings = [];
  const routes = new Map();

  for (const row of rows) {
    const axis = row?.axis;
    if (typeof axis !== "string" || !axis) {
      findings.push(`route map: an axis row has no id`);
      continue;
    }
    const route = routeFor(row);
    routes.set(axis, route);
    if (route === null) {
      // Owner-held: no public page may exist for it, and nothing may link to it.
      if (existsSync(join(publicDir, "axis", `${axis}.html`)))
        findings.push(`${axis}: owner-held but public/axis/${axis}.html exists — a public page for a held slot`);
      continue;
    }
    if (!routePublished(route, publicDir, prerendered))
      findings.push(`${axis}: the route it links to (${route}) is not published — the link would 404`);
  }

  // LINK INTEGRITY: every axis href in every published page must resolve.
  for (const file of files) {
    const html = readFileSync(file, "utf8");
    const rel = relative(ROOT, file);
    for (const m of html.matchAll(/href="(\/(?:gspc|axis)\/[a-z0-9-]+\/)"/g)) {
      const href = m[1];
      const axis = href.slice(href.indexOf("/") + 1).split("/")[1];
      if (!routes.has(axis)) {
        findings.push(`${rel}: links to ${href}, which is not an axis the board serves`);
        continue;
      }
      if (routes.get(axis) === null) {
        findings.push(`${rel}: links to ${href}, an owner-held axis with no public page`);
        continue;
      }
      if (!routePublished(href, publicDir, prerendered))
        findings.push(`${rel}: links to ${href}, which this build does not publish`);
    }
  }
  return { ok: findings.length === 0, findings };
}

function loadRows(publicDir) {
  const p = join(publicDir, "interop", "axis-routes.json");
  if (!existsSync(p)) throw Error(`no route map at ${p} — run node scripts/surface/build-axis-pages.mjs`);
  const raw = JSON.parse(readFileSync(p, "utf8"));
  if (!Array.isArray(raw.axes)) throw Error(`route map at ${p} has no axes array`);
  return raw.axes;
}

/** A gate that has never gone red proves nothing about the tree it passed. */
function selftest() {
  const tmp = join(tmpdir(), "axis-route-gate-selftest");
  const failures = [];
  try {
    const board = loadRows(join(ROOT, "public"));
    const prerendered = prerenderGspcRoutes(readFileSync(join(ROOT, "scripts", "prerender.mjs"), "utf8"));
    const files = htmlFiles(join(ROOT, "public"));

    // A tree that is correct must pass.
    const clean = gate({ rows: board, publicDir: join(ROOT, "public"), prerendered, htmlFiles: files });
    if (!clean.ok) failures.push(`the real tree FAILED the gate: ${clean.findings.slice(0, 4).join(" | ")}`);

    // A row whose route is not published must go red.
    const brokenRow = [{ axis: "not-published", kind: "measured-subject" }];
    const red1 = gate({ rows: brokenRow, publicDir: join(ROOT, "public"), prerendered, htmlFiles: [] });
    if (red1.ok) failures.push("a row whose /axis/ page does not exist did NOT fail the gate");

    // An owner-held axis that has a public page must go red.
    const gated = [{ axis: "governance", kind: "model-comparison", public_pages: OWNER_GATED }];
    const red2 = gate({ rows: gated, publicDir: join(ROOT, "public"), prerendered, htmlFiles: [] });
    if (red2.ok) failures.push("an owner-held axis with a public page did NOT fail the gate");

    // A link to an axis the board does not serve must go red.
    const fake = join(tmp, "fake.html");
    mkdirSync(tmp, { recursive: true });
    writeFileSync(fake, '<a href="/gspc/not-an-axis/">x</a>');
    const red3 = gate({
      rows: board,
      publicDir: join(ROOT, "public"),
      prerendered,
      htmlFiles: [fake],
    });
    if (red3.ok) failures.push("a link to an axis the board does not serve did NOT fail the gate");

    // THE HISTORICAL DEFECT, reproduced exactly: a published page links a
    // measured-subject axis to /gspc/<axis>/, a route the prerender never
    // publishes, because the prerender list was a hand-typed subset of the
    // board. This is the link the homepage carried for nine axes on
    // 2026-11-06, and it answered HTTP 404.
    //
    // The axis is chosen as one that has NO /gspc/ route at all: three
    // deterministic facts (effect-binding, ai-adoption-components,
    // labour-components) ARE prerendered, and a fixture drawn from them would
    // pass for the right reason by accident.
    const subjectAxis = board.find(
      (r) =>
        r.kind !== "model-comparison" &&
        r.public_pages !== OWNER_GATED &&
        !prerendered.has(`/gspc/${r.axis}/`),
    );
    if (!subjectAxis) {
      failures.push("no measured-subject axis without a /gspc/ route to reproduce the defect with");
    } else {
      const historic = join(tmp, "historic.html");
      writeFileSync(historic, `<a href="/gspc/${subjectAxis.axis}/">${subjectAxis.axis}</a>`);
      const red4 = gate({
        rows: board,
        publicDir: join(ROOT, "public"),
        prerendered,
        htmlFiles: [historic],
      });
      if (red4.ok)
        failures.push(
          `the historical defect (a link to /gspc/${subjectAxis.axis}/) did NOT fail the gate`,
        );
    }
  } finally {
    // The fixture file is left for the caller's cleanup; this script never deletes.
    void tmp;
  }
  if (failures.length) {
    console.error("✖ axis-route-gate SELFTEST failed — the gate itself is broken:");
    for (const f of failures) console.error("    " + f);
    return 1;
  }
  console.log("  ✓ axis-route-gate selftest: the gate goes red on every defect class it claims to catch");
  return 0;
}

function require_fs_write(p, text) {
  mkdirSync(dirname(p), { recursive: true });
  writeFileSync(p, text);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  if (args.includes("--selftest")) process.exit(selftest());
  const outDir = resolve(ROOT, args.includes("--out") ? args[args.indexOf("--out") + 1] : "public");
  const rows = loadRows(outDir);
  const prerendered = prerenderGspcRoutes(readFileSync(join(ROOT, "scripts", "prerender.mjs"), "utf8"));
  const files = htmlFiles(outDir);
  const { ok, findings } = gate({ rows, publicDir: outDir, prerendered, htmlFiles: files });
  // The source lint: a component that builds an axis route itself is the
  // defect recurring. It reads client/src, not the built tree.
  const clientSrc = join(ROOT, "client", "src");
  const srcFiles = [];
  (function walk(d) {
    if (!existsSync(d)) return;
    for (const name of readdirSync(d)) {
      const p = join(d, name);
      let st;
      try { st = statSync(p); } catch { continue; }
      if (st.isDirectory()) walk(p);
      else if (/\.(ts|tsx)$/.test(name) && !/\.test\./.test(name)) srcFiles.push(p);
    }
  })(clientSrc);
  findings.push(...lintAxisRouteSource(srcFiles));
  // `ok` was computed before the lint ran, so it is recomputed here. A gate
  // whose verdict is stale is worse than no gate: it reports green on a tree
  // it has not finished reading.
  if (!ok || findings.length) {
    console.error(`✖ axis-route-gate: ${findings.length} broken axis route(s)`);
    for (const f of findings.slice(0, 25)) console.error("    " + f);
    if (findings.length > 25) console.error(`    … and ${findings.length - 25} more`);
    process.exit(1);
  }
  console.log(`✓ axis-route-gate: ${rows.length} axes, ${files.length} published pages — every axis link resolves`);
}
