#!/usr/bin/env node
/**
 * build-static-pages — emits the hand-written static pages from ONE template.
 *
 * K07. These pages were three bespoke templates that had to be hand-edited, so
 * they drifted from the site and from their own sources. Now:
 *
 *   public/dashboard/games.html   DERIVED from public/interop/games-arcade.json
 *   public/interop/index.html     curated leaf list, every href LINK-GATED
 *
 * The games page previously TYPED "10 Council game concepts" and typed all ten
 * cards. The catalogue it links to already carries schema
 * csoai.game-planning-catalogue/0.2 with total_concepts, concepts[], status,
 * as_of and limitations[]. Every one of those is now read, so adding a concept
 * to the catalogue changes the page and the count moves on its own.
 *
 * The interop index is a CURATED list — public/interop holds ~450 entries and
 * the index names about ten. Curation is legitimate, so the list stays
 * declared here, but every entry is checked to exist on disk before the page
 * is written. A leaf that is deleted or renamed fails the build instead of
 * shipping a dead link.
 *
 * Run with --check to verify the committed html matches what the producer
 * emits, which is how CI catches a hand-edit.
 */
import { readFileSync, writeFileSync, existsSync, statSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { renderStaticPage, esc } from "./static-page-template.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const PUBLIC = join(ROOT, "public");
const check = process.argv.includes("--check");

const problems = [];

/**
 * The catalogue stamps compact ISO ("20260905T045748Z"). Rendered as-is that
 * reads like a serial number, so it is reformatted for display ONLY — the
 * value still comes from the artifact and is never substituted.
 */
function readableDate(stamp) {
  const m = /^(\d{4})(\d{2})(\d{2})T/.exec(String(stamp ?? ""));
  if (!m) return stamp || null;
  const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
  if (Number.isNaN(d.getTime())) return stamp;
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
}

/**
 * Every href on a generated page must resolve to something committed.
 * `baseDir` is the directory the page itself is served from, because "./x" on
 * /interop/ means public/interop/x, not public/x.
 */
function assertExists(href, where, baseDir = PUBLIC) {
  const clean = href.split("#")[0].split("?")[0];
  if (/^https?:/.test(clean) || clean.startsWith("mailto:")) return;
  const isRootRelative = clean.startsWith("/");
  const rel = clean.replace(/^\.\//, "").replace(/^\//, "");
  const target = join(isRootRelative ? PUBLIC : baseDir, rel);
  if (existsSync(target)) return;
  // a bare directory url is fine when the directory exists
  if (existsSync(target.replace(/\/$/, "")) && statSync(target.replace(/\/$/, "")).isDirectory()) return;
  problems.push(`${where}: href "${href}" resolves to nothing under public/`);
}

// ── /dashboard/games — derived, not typed ────────────────────────────────────
function gamesPage() {
  const src = "public/interop/games-arcade.json";
  const cat = JSON.parse(readFileSync(join(ROOT, src), "utf8"));
  const concepts = Array.isArray(cat.concepts) ? cat.concepts : [];

  // The count is the array's length. total_concepts is cross-checked against
  // it rather than trusted: a header that disagrees with its own body is the
  // defect this estate keeps finding.
  if (typeof cat.total_concepts === "number" && cat.total_concepts !== concepts.length) {
    problems.push(
      `${src}: total_concepts ${cat.total_concepts} != concepts[].length ${concepts.length}`,
    );
  }

  const cards = concepts
    .map((c) => {
      const status = c.status || cat.status || "UNKNOWN";
      return `    <a class="card" href="/interop/games-arcade.json">
      <h2>${esc(c.name || c.slug)}</h2>
      <p>${esc(c.concept || "")}</p>
      <span class="pill">${esc(status)}</span>
    </a>`;
    })
    .join("\n");

  const limits = (Array.isArray(cat.limitations) ? cat.limitations : [])
    .map((l) => `    <li>${esc(l)}</li>`)
    .join("\n");

  const body = `  <div class="grid">
${cards}
  </div>
  <h2 style="margin-top:32px">What this page does not claim</h2>
  <ul>
${limits}
    <li>No game emits a signed card. Nothing here is a measurement.</li>
  </ul>`;

  assertExists("/interop/games-arcade.json", "games");

  return {
    path: join(PUBLIC, "dashboard", "games.html"),
    html: renderStaticPage({
      title: "Games — Council of AI",
      description:
        "Council game concepts in preview, read from the planning catalogue. Design-review surface only — no game emits a signed card.",
      canonical: "https://councilof.ai/dashboard/games",
      kicker: `Games · ${cat.kind || "planning-catalogue"} · ${cat.status || ""}`.trim(),
      heading: "Council games — concepts in preview",
      lede: `${concepts.length} concepts are catalogued for design review. None of them runs, and none emits a signed card.`,
      bodyHtml: body,
      asOf: readableDate(cat.as_of),
      sourceNote: `${src} (${cat.schema || "no schema"})`,
    }),
  };
}

// ── /interop — curated, link-gated ───────────────────────────────────────────
const INTEROP_DIR = join(PUBLIC, "interop");

const INTEROP_LEAVES = [
  ["./incident-openai-hf-2026-07/", "OpenAI↔HF Jul 2026 public.notice — hashed reports, not recomputed, unsigned."],
  ["./xrpl-toml-gap-2026-09/", "XRPL strict_two_way_toml gap notices."],
  ["./swift-census-2026-09/", "SWIFT 26 public.notice census."],
  ["./art50-hub-queue-2026-09/", "Art 50 marking disclosure, hub-queue first slice — unsigned public.notice, not MEASURED."],
  ["./x402-challenge/", "Live HTTP 402 probe. Settlement UNCHECKABLE from this leaf."],
  ["./cedulon-recon/", "Cedulon reconciliation notes."],
  ["./scrapi-ccf/", "SCRAPI / CCF crosswalk."],
  ["./emilia-ep/", "Emilia EP leaf."],
  ["./financial-axes.json", "The financial axis definitions."],
  ["./financial-measure-run-v2.json", "Financial deterministic-facts run, v2."],
  ["./xrpl-two-way-check.json", "XRPL two-way domain check."],
  ["./games-arcade.json", "Game planning catalogue — the source behind /dashboard/games."],
];

function interopPage() {
  const items = INTEROP_LEAVES.map(([href, what]) => {
    assertExists(href, "interop", INTEROP_DIR);
    return `    <li><a href="${esc(href)}"><code>${esc(href.replace(/^\.\//, ""))}</code></a> — ${esc(what)}</li>`;
  }).join("\n");

  const body = `  <ul>
${items}
  </ul>
  <p class="meta">Machine-readable leaves live under <code>public/interop/</code>; this index names the curated ones. The full markdown index is <a href="./README.md">README.md</a>. Bare directory URLs need this file for Pages.</p>
  <p class="meta">Board counts are not frozen here. Read <a href="https://councilof.ai/api/gspc">GET /api/gspc</a> for <code>totals.public_count</code>. Empty slots are not for sale, and no score is invented on this page.</p>`;

  assertExists("./README.md", "interop", INTEROP_DIR);

  return {
    path: join(PUBLIC, "interop", "index.html"),
    html: renderStaticPage({
      title: "/interop — live / unsigned banks | Council of AI",
      description:
        "Unsigned interop banks and public.notice packs. Measurement, not certification. Living board from GET /api/gspc.",
      canonical: "https://councilof.ai/interop/",
      kicker: "Interop · unsigned banks and public notices",
      heading: "/interop — live and unsigned banks",
      lede:
        "Machine-readable interop leaves. These are public notices and unsigned banks: they record what was observed, and none of them is a certification.",
      bodyHtml: body,
      asOf: null,
      sourceNote: "the curated leaf list in scripts/build-static-pages.mjs, link-gated against public/",
    }),
  };
}

const pages = [gamesPage(), interopPage()];

if (problems.length) {
  console.error("build-static-pages: FAIL");
  for (const p of problems) console.error("  - " + p);
  process.exit(1);
}

let drifted = 0;
for (const { path, html } of pages) {
  const existing = existsSync(path) ? readFileSync(path, "utf8") : null;
  if (existing === html) continue;
  if (check) {
    drifted++;
    console.error(`build-static-pages: DRIFT ${path.replace(ROOT + "/", "")} — hand-edited or producer changed`);
    continue;
  }
  writeFileSync(path, html);
}

if (check && drifted) {
  console.error("build-static-pages: run `node scripts/build-static-pages.mjs` and commit the result");
  process.exit(1);
}

console.log(
  `build-static-pages: ${check ? "check OK" : "wrote"} ${pages.length} page(s) from one template · ${INTEROP_LEAVES.length} interop leaves link-gated`,
);
